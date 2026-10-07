// The query deck — agent questions scored against both perception modes.
// Verdicts: 'answered' (reliable), 'guessed' (plausible but unverifiable),
// 'blind' (the representation cannot carry the answer).
// Answers are computed from the real scene data, not hard-coded.
import { findByName, findWhere } from './scene.mjs';
import { assignRefs } from './tree.mjs';
import { transcript, cellsOfColor } from './pixels.mjs';

function treeFind(scene, name) {
  assignRefs(scene.root);
  return findByName(scene.root, name);
}

export const QUERIES = [
  {
    id: 'press-send',
    question: 'Click the "Send" button.',
    tree(scene) {
      const b = treeFind(scene, 'Send');
      if (b?.role === 'button' && b.actions?.includes('press')) {
        return { verdict: 'answered', detail: `press ${b.ref} — role and action are explicit` };
      }
      return { verdict: 'blind', detail: 'no Send button in the tree' };
    },
    pixels(scene) {
      const hit = transcript(scene).find(t => t.text === 'Send');
      if (!hit) return { verdict: 'blind', detail: 'no "Send" text visible' };
      const [x, y, w, h] = hit.box;
      return { verdict: 'guessed', detail: `click ~(${Math.round(x + w / 2)},${Math.round(y + h / 2)}) — a coordinate guess, not a control` };
    },
  },
  {
    id: 'checkbox-state',
    question: 'Is "Notify channel" / "Encrypt backups" switched on?',
    tree(scene) {
      const cb = findWhere(scene.root, n => n.role === 'checkbox')[0];
      if (!cb) return { verdict: 'blind', detail: 'no checkbox in the tree' };
      return { verdict: 'answered', detail: `${cb.name}: checked=${cb.state?.checked} — a state, not a glyph` };
    },
    pixels(scene) {
      const cb = findWhere(scene.root, n => n.role === 'checkbox')[0];
      if (!cb) return { verdict: 'blind', detail: 'no checkbox on screen' };
      return { verdict: 'guessed', detail: 'a checkbox glyph is a few pixels — checked vs unchecked is a coin flip at agent resolution' };
    },
  },
  {
    id: 'unread-count',
    question: 'Which conversations have unread messages?',
    tree(scene) {
      const items = findWhere(scene.root, n => n.badge);
      if (!items.length) return { verdict: 'answered', detail: 'no badges — nothing unread' };
      return { verdict: 'answered', detail: items.map(i => `${i.name} (${i.badge})`).join(', ') };
    },
    pixels(scene) {
      const items = findWhere(scene.root, n => n.badge);
      if (!items.length) return { verdict: 'guessed', detail: 'scanning badge icons pixel by pixel' };
      return { verdict: 'guessed', detail: `badges are tiny glyphs — a vision pass might read "${items.length}" of them, might merge two` };
    },
  },
  {
    id: 'chart-spike',
    question: 'Where does the amber spike appear on the activity chart?',
    tree(scene) {
      const c = findWhere(scene.root, n => n.role === 'canvas')[0];
      if (!c) return { verdict: 'blind', detail: 'no canvas region in this scene' };
      return { verdict: 'blind', detail: `tree reports "${c.name}" as ${c.visual?.rendering} — and nothing inside it` };
    },
    pixels(scene) {
      const amber = cellsOfColor(scene, '#EBB042');
      if (!amber.length) return { verdict: 'blind', detail: 'no spike visible' };
      return { verdict: 'answered', detail: `spike at column x≈${amber[Math.floor(amber.length / 2)].x} of the chart region — pixels see color` };
    },
  },
  {
    id: 'modal-focus',
    question: 'Is a modal dialog blocking the window?',
    tree(scene) {
      const d = findWhere(scene.root, n => n.state?.modal)[0];
      if (!d) return { verdict: 'answered', detail: 'no modal state in the tree' };
      return { verdict: 'answered', detail: `"${d.name}" — state.modal=true; only Delete/Cancel are reachable` };
    },
    pixels(scene) {
      const d = findWhere(scene.root, n => n.state?.modal)[0];
      if (!d) return { verdict: 'answered', detail: 'no dialog drawn' };
      return { verdict: 'blind', detail: 'pixels show a box on top — whether it is *modal* is not visible' };
    },
  },
  {
    id: 'window-title',
    question: 'What is the window title?',
    tree(scene) {
      return { verdict: 'answered', detail: `"${scene.root.name}"` };
    },
    pixels(scene) {
      return { verdict: 'answered', detail: `"${scene.root.name}" — the one thing OCR reads reliably` };
    },
  },
];

export function answerQueries(scene) {
  return QUERIES.map(q => ({
    id: q.id,
    question: q.question,
    tree: q.tree(scene),
    pixels: q.pixels(scene),
  }));
}
