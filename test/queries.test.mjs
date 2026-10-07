import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, CHAT_APP, SETTINGS_APP } from '../public/scene.mjs';
import { QUERIES, answerQueries } from '../public/queries.mjs';

const byId = (scene, id) => answerQueries(scene).find(a => a.id === id);

test('deck has six questions and every verdict is a known value', () => {
  assert.equal(QUERIES.length, 6);
  for (const a of answerQueries(CHAT_APP)) {
    for (const mode of ['tree', 'pixels']) {
      assert.ok(['answered', 'guessed', 'blind'].includes(a[mode].verdict), `${a.id}/${mode}`);
    }
  }
});

test('tree answers structural questions pixels can only guess', () => {
  assert.equal(byId(CHAT_APP, 'press-send').tree.verdict, 'answered');
  assert.equal(byId(CHAT_APP, 'press-send').pixels.verdict, 'guessed');
  assert.equal(byId(CHAT_APP, 'checkbox-state').tree.verdict, 'answered');
  assert.equal(byId(CHAT_APP, 'checkbox-state').pixels.verdict, 'guessed');
  assert.equal(byId(CHAT_APP, 'unread-count').tree.verdict, 'answered');
  assert.equal(byId(CHAT_APP, 'modal-focus').tree.verdict, 'answered');
  assert.equal(byId(CHAT_APP, 'modal-focus').pixels.verdict, 'blind');
});

test('the honest blind spot: chart internals are pixel-only', () => {
  assert.equal(byId(CHAT_APP, 'chart-spike').tree.verdict, 'blind');
  assert.equal(byId(CHAT_APP, 'chart-spike').pixels.verdict, 'answered');
});

test('window title is answerable by both modes', () => {
  const q = byId(CHAT_APP, 'window-title');
  assert.equal(q.tree.verdict, 'answered');
  assert.equal(q.pixels.verdict, 'answered');
});

test('settings scene has no canvas blind spot', () => {
  assert.equal(byId(SETTINGS_APP, 'chart-spike').tree.verdict, 'blind'); // no canvas at all
  assert.equal(byId(SETTINGS_APP, 'modal-focus').pixels.verdict, 'answered'); // nothing to detect
});

test('queries answer from real scene data, not constants', () => {
  // Rename the Send button and the tree answer must change.
  const scene = JSON.parse(JSON.stringify(CHAT_APP));
  const composer = scene.root.children.find(c => c.name === 'Composer');
  composer.children = composer.children.filter(c => c.name !== 'Send');
  assert.equal(byId(scene, 'press-send').tree.verdict, 'blind');
});
