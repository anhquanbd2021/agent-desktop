// Pixel perception — what a vision-model loop receives. We rasterize the
// scene into a coarse cell grid (a schematic stand-in for a screenshot),
// estimate a vision-token budget, and produce a "transcript": the text a
// vision model plausibly reads, with approximate boxes — and nothing else.
// No roles, no states, no actions: pixels don't carry them.
import { estimateTokens } from './tokens.mjs';
import { ROLE_COLORS, walk } from './scene.mjs';

// A realistic downscaled screenshot size for a computer-use agent.
// Image tokens ≈ pixels/750 matches published vision-token heuristics.
export const SCREEN_W = 1152;
export const SCREEN_H = 648;
export const PIXELS_PER_TOKEN = 750;
export const RASTER_W = 64;
export const RASTER_H = 36;

// Deterministic "chart ink" for canvas regions: the tree can't see it,
// the raster can. Heights follow a fixed pattern with one red spike.
const CHART_BARS = [3, 5, 4, 7, 6, 9, 14, 8, 6, 10, 7, 5];
const SPIKE_INDEX = 6;

function nodeCells(node) {
  // Cells belonging to this node, keyed 'x,y' → color.
  const cells = new Map();
  if (!node.bounds) return cells;
  const [x, y, w, h] = node.bounds;
  const base = ROLE_COLORS[node.role] || '#1b2830';
  for (let cy = y; cy < y + h; cy++) {
    for (let cx = x; cx < x + w; cx++) {
      cells.set(`${cx},${cy}`, base);
    }
  }
  if (node.visual?.type === 'chart') {
    // Draw deterministic bars; the spike column is amber.
    for (let i = 0; i < Math.min(CHART_BARS.length, w - 1); i++) {
      const barH = Math.min(CHART_BARS[i], h - 2);
      const color = i === SPIKE_INDEX ? '#EBB042' : '#3d5a72';
      for (let b = 0; b < barH; b++) {
        cells.set(`${x + i},${y + h - 2 - b}`, color);
      }
    }
  }
  return cells;
}

// Rasterize — paint nodes back-to-front (children over parents) into a
// RASTER_W × RASTER_H grid of { color, node } cells.
export function rasterize(scene) {
  const grid = Array.from({ length: RASTER_H }, () =>
    Array.from({ length: RASTER_W }, () => ({ color: '#101820', node: null })));
  const paint = (node, depth) => {
    if (node.bounds) {
      for (const [key, color] of nodeCells(node)) {
        const [x, y] = key.split(',').map(Number);
        if (x >= 0 && x < RASTER_W && y >= 0 && y < RASTER_H) {
          grid[y][x] = { color, node };
        }
      }
    }
    for (const child of node.children || []) paint(child, depth + 1);
  };
  paint(scene.root, 0);
  return grid;
}

// Vision-token budget for the screenshot path: image patches + the text the
// model has to read off the image. One call per screenshot, every step.
export function pixelBudget(scene) {
  const imageTokens = Math.round((SCREEN_W * SCREEN_H) / PIXELS_PER_TOKEN);
  const text = visibleText(scene).map(t => t.text).join(' ');
  const textTokens = estimateTokens(text);
  return { imageTokens, textTokens, total: imageTokens + textTokens, width: SCREEN_W, height: SCREEN_H };
}

// What a vision model plausibly reports: visible text and rough boxes.
// Deliberately omits role, state, and actions — the model would have to
// guess those from appearance, which is the whole problem.
export function transcript(scene) {
  const sx = SCREEN_W / RASTER_W;
  const sy = SCREEN_H / RASTER_H;
  const items = [];
  walk(scene.root, node => {
    if (node.name && node.role !== 'window' && node.bounds) {
      const [x, y, w, h] = node.bounds;
      items.push({
        text: node.name + (node.badge ? ` (${node.badge})` : ''),
        box: [Math.round(x * sx), Math.round(y * sy), Math.round(w * sx), Math.round(h * sy)],
        confidence: node.role === 'listitem' ? 0.7 : 0.9,
      });
    }
    if (node.visual) {
      items.push({ text: null, note: 'unlabeled graphic', box: node.bounds.map((v, i) => Math.round(v * (i % 2 ? sy : sx))), confidence: 0 });
    }
  });
  return items;
}

export function visibleText(scene) {
  return transcript(scene).filter(t => t.text);
}

// Find cells of a given color inside a node's bounds — used by the pixel
// mode to answer visual questions the tree cannot.
export function cellsOfColor(scene, color) {
  const grid = rasterize(scene);
  const hits = [];
  for (let y = 0; y < RASTER_H; y++) {
    for (let x = 0; x < RASTER_W; x++) {
      if (grid[y][x].color === color) hits.push({ x, y, node: grid[y][x].node?.name });
    }
  }
  return hits;
}
