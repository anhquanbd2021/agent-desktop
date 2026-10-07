import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SCENES, CHAT_APP, SETTINGS_APP, findByName, findWhere } from '../public/scene.mjs';
import { serializeFull, serializeSkeleton, drill, assignRefs, treeReport } from '../public/tree.mjs';
import { pixelBudget } from '../public/pixels.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

function stripRefs(node) {
  const { ref, ...rest } = node;
  return { ...rest, ...(rest.children ? { children: rest.children.map(stripRefs) } : {}) };
}

test('embedded scenes match JSON fixtures on disk', async () => {
  const chat = JSON.parse(await readFile(`${root}examples/chat-app.json`, 'utf8'));
  const settings = JSON.parse(await readFile(`${root}examples/settings-app.json`, 'utf8'));
  assert.deepEqual({ ...CHAT_APP, root: stripRefs(CHAT_APP.root) }, chat);
  assert.deepEqual({ ...SETTINGS_APP, root: stripRefs(SETTINGS_APP.root) }, settings);
});

test('refs are deterministic across serializations', () => {
  serializeFull(CHAT_APP.root);
  const first = findByName(CHAT_APP.root, 'Send').ref;
  serializeFull(CHAT_APP.root);
  assert.equal(findByName(CHAT_APP.root, 'Send').ref, first);
  assert.match(first, /^@e\d+$/);
});

test('full serialization preserves roles, states, and actions', () => {
  const { tree } = serializeFull(CHAT_APP.root);
  const str = JSON.stringify(tree);
  assert.match(str, /"role":"checkbox"/);
  assert.match(str, /"checked":true/);
  assert.match(str, /"modal":true/);
  assert.match(str, /"actions":\["press"\]/);
  assert.match(str, /"canvas"/);
});

test('skeleton truncates containers and annotates children_count', () => {
  const { tree } = serializeSkeleton(CHAT_APP.root, { depth: 1 });
  const containers = tree.children;
  assert.ok(containers.length > 3);
  for (const c of containers.filter(c => c.children?.length || c.children_count)) {
    if (c.children_count) {
      assert.equal(c.truncated, true);
      assert.ok(c.ref);
      assert.equal(c.children, undefined);
    }
  }
  const channels = containers.find(c => c.name === 'Channels');
  assert.equal(channels.children_count, 8);
});

test('drill returns the subtree behind a ref with the same refs', () => {
  const sk = serializeSkeleton(CHAT_APP.root, { depth: 1 });
  const target = sk.tree.children.find(c => c.name === 'Composer');
  const sub = drill(CHAT_APP.root, target.ref);
  assert.equal(sub.tree.ref, target.ref);
  assert.equal(sub.tree.children.length, 3);
  assert.equal(sub.tree.children.find(c => c.name === 'Send').ref, findByName(CHAT_APP.root, 'Send').ref);
  assert.equal(drill(CHAT_APP.root, '@e999'), null);
});

test('dense scene: full tree exceeds a screenshot, skeleton compresses ≥70%', () => {
  const { full, skeleton, reduction } = treeReport(CHAT_APP.root, { depth: 1 });
  const px = pixelBudget(CHAT_APP);
  assert.ok(full.tokens > px.total, `full ${full.tokens} should exceed pixels ${px.total} on a dense app`);
  assert.ok(reduction >= 70, `skeleton reduction ${reduction}% < 70%`);
  assert.ok(skeleton.tokens < px.total);
});

test('small scene: even the full tree beats a screenshot', () => {
  const { full } = treeReport(SETTINGS_APP.root, { depth: 1 });
  const px = pixelBudget(SETTINGS_APP);
  assert.ok(full.tokens < px.total);
});

test('canvas nodes serialize as honest blind spots', () => {
  const canvas = findWhere(CHAT_APP.root, n => n.role === 'canvas')[0];
  assert.equal(canvas.visual.type, 'chart');
  const { json } = serializeFull(CHAT_APP.root);
  assert.match(json, /canvas2d/);
  // The tree carries the region's identity — never pixel contents.
  assert.ok(!json.includes('spike'), 'tree must not contain chart internals');
});
