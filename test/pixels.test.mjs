import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAT_APP } from '../public/scene.mjs';
import { rasterize, pixelBudget, transcript, cellsOfColor, RASTER_W, RASTER_H } from '../public/pixels.mjs';

test('raster fills the grid and paints the chart region', () => {
  const grid = rasterize(CHAT_APP);
  assert.equal(grid.length, RASTER_H);
  assert.equal(grid[0].length, RASTER_W);
  // The amber spike column exists inside the canvas region.
  const amber = cellsOfColor(CHAT_APP, '#EBB042');
  assert.ok(amber.length > 5);
  assert.ok(amber.every(c => c.node === 'Activity chart'));
});

test('pixel budget scales with resolution, not content', () => {
  const px = pixelBudget(CHAT_APP);
  assert.ok(px.imageTokens > 500);
  assert.equal(px.total, px.imageTokens + px.textTokens);
});

test('transcript carries text and boxes but no roles or states', () => {
  const t = transcript(CHAT_APP);
  const send = t.find(i => i.text === 'Send');
  assert.ok(send, 'Send text must be readable');
  assert.ok(send.box.every(Number.isFinite));
  assert.ok(!('role' in send) && !('state' in send) && !('actions' in send));
  const graphic = t.find(i => i.text === null);
  assert.equal(graphic.note, 'unlabeled graphic');
});
