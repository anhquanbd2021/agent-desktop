import { SCENES, findWhere } from './scene.mjs';
import { serializeFull, serializeSkeleton, drill, assignRefs } from './tree.mjs';
import { rasterize, pixelBudget, transcript, RASTER_W, RASTER_H } from './pixels.mjs';
import { answerQueries } from './queries.mjs';

const $ = id => document.getElementById(id);
let scene = SCENES['chat-app'];

function renderRaster() {
  const grid = rasterize(scene);
  const el = $('raster');
  el.innerHTML = '';
  el.style.gridTemplateColumns = `repeat(${RASTER_W}, 1fr)`;
  for (let y = 0; y < RASTER_H; y++) {
    for (let x = 0; x < RASTER_W; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.background = grid[y][x].color;
      if (grid[y][x].node?.name) cell.title = `${grid[y][x].node.role}: ${grid[y][x].node.name}`;
      el.appendChild(cell);
    }
  }
  const px = pixelBudget(scene);
  $('px-budget').textContent = `~${px.total.toLocaleString()} tokens per screenshot (${px.width}x${px.height})`;
}

function transcriptText() {
  const px = pixelBudget(scene);
  const lines = transcript(scene).map(t =>
    t.text ? `"${t.text}" @(${t.box.join(',')}) conf=${t.confidence}` : `[${t.note}] @(unlabeled region)`);
  return `vision transcript — ~${px.total.toLocaleString()} tokens/step\n\n` + lines.join('\n');
}

function renderMode() {
  const mode = document.querySelector('input[name=mode]:checked').value;
  const out = $('mode-output'), badge = $('mode-tokens'), note = $('mode-note');
  if (mode === 'pixels') {
    out.textContent = transcriptText();
    badge.textContent = `~${pixelBudget(scene).total.toLocaleString()} tokens`;
    badge.className = 'badge warn';
    note.textContent = 'text + rough boxes; no roles, states, or actions — and it re-pays every step';
  } else {
    const rep = mode === 'skeleton' ? serializeSkeleton(scene.root, { depth: 1 }) : serializeFull(scene.root);
    out.textContent = rep.json;
    badge.textContent = `~${rep.tokens.toLocaleString()} tokens`;
    badge.className = 'badge pass';
    note.textContent = mode === 'skeleton'
      ? `${rep.nodes} nodes → shallow overview; truncated containers show children_count`
      : `all ${rep.nodes} nodes, roles + states + actions + refs`;
  }
}

function renderDrill() {
  const sel = $('drill');
  const ref = sel.value;
  const rep = drill(scene.root, ref);
  if (!rep) { $('drill-output').textContent = 'unknown ref'; return; }
  $('drill-output').textContent = rep.json;
  $('drill-tokens').textContent = `~${rep.tokens.toLocaleString()} tokens for ${ref}`;
}

function renderDrillOptions() {
  const sel = $('drill');
  sel.innerHTML = '';
  assignRefs(scene.root);
  for (const n of findWhere(scene.root, n => n.children?.length && n.role !== 'window')) {
    const o = document.createElement('option');
    o.value = n.ref;
    o.textContent = `${n.ref} — ${n.role} "${n.name}" (${n.children.length} children)`;
    sel.appendChild(o);
  }
  renderDrill();
}

const VERDICT_BADGE = { answered: 'pass', guessed: 'warn', blind: 'fail' };
const VERDICT_LABEL = { answered: 'answered', guessed: 'guesses', blind: 'blind' };

function renderQueries() {
  const ol = $('queries');
  ol.innerHTML = '';
  for (const a of answerQueries(scene)) {
    const li = document.createElement('li');
    li.className = 'result';
    const head = document.createElement('div');
    head.className = 'result-head';
    head.innerHTML = `<strong>${a.question}</strong>`;
    const p = document.createElement('p');
    for (const mode of ['tree', 'pixels']) {
      const r = a[mode];
      const span = document.createElement('p');
      span.innerHTML = `<span class="badge ${VERDICT_BADGE[r.verdict]}">${mode}: ${VERDICT_LABEL[r.verdict]}</span> ${r.detail}`;
      p.appendChild(span);
    }
    li.append(head, p);
    ol.appendChild(li);
  }
}

function renderAll() {
  renderRaster();
  renderMode();
  renderDrillOptions();
  renderQueries();
}

const sel = $('scene');
for (const [key, s] of Object.entries(SCENES)) {
  const o = document.createElement('option');
  o.value = key; o.textContent = s.title;
  sel.appendChild(o);
}
sel.addEventListener('change', () => { scene = SCENES[sel.value]; renderAll(); });
document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', renderMode));
$('drill').addEventListener('change', renderDrill);
renderAll();
