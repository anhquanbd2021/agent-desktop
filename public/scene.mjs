// Scene model — a deterministic "desktop" the two perception modes observe.
// The same fixtures live in examples/*.json; a test asserts parity.
// Node shape: { role, name?, desc?, bounds?, state?, actions?, badge?,
//               visual?, children? } — mirrors what OS accessibility APIs
// expose: role, name, state, actions, and a custom-rendered flag (`visual`)
// for regions the tree cannot see inside.

export const CHAT_APP = {
  scene: 'chat-app',
  title: 'ChatDesk — dense team chat window',
  grid: [64, 36],
  root: {
    role: 'window', name: 'ChatDesk — #general', desc: 'Team chat client main window',
    bounds: [0, 0, 64, 36], state: { focused: true },
    children: [
      { role: 'toolbar', name: 'Main toolbar', bounds: [0, 0, 64, 4], children: [
        { role: 'button', name: 'New channel', bounds: [1, 1, 12, 2], actions: ['press'], desc: 'Create a new channel in this workspace' },
        { role: 'button', name: 'Search', bounds: [14, 1, 10, 2], actions: ['press'], desc: 'Search messages and files' },
        { role: 'button', name: 'Mute', bounds: [25, 1, 8, 2], actions: ['press'], desc: 'Mute notifications for #general' },
        { role: 'button', name: 'Members', bounds: [34, 1, 10, 2], actions: ['press'], desc: 'Show the 42 members of #general' },
      ]},
      { role: 'list', name: 'Channels', bounds: [0, 5, 17, 26], children: [
        { role: 'listitem', name: '# general', bounds: [1, 6, 15, 2], actions: ['press'], state: { selected: true }, desc: '42 members — topic: shipping the June release' },
        { role: 'listitem', name: '# random', bounds: [1, 9, 15, 2], actions: ['press'], badge: '3', desc: '3 unread mentions since yesterday' },
        { role: 'listitem', name: '# releases', bounds: [1, 12, 15, 2], actions: ['press'], desc: 'Release coordination, 18 members' },
        { role: 'listitem', name: '# design', bounds: [1, 15, 15, 2], actions: ['press'], desc: 'Design reviews and mocks' },
        { role: 'listitem', name: '# ops', bounds: [1, 18, 15, 2], actions: ['press'], desc: 'On-call and incident chatter' },
        { role: 'listitem', name: '# watercooler', bounds: [1, 21, 15, 2], actions: ['press'], desc: 'Anything goes' },
        { role: 'listitem', name: 'dm: Minh', bounds: [1, 24, 15, 2], actions: ['press'], desc: 'Direct message, online' },
        { role: 'listitem', name: 'dm: An', bounds: [1, 27, 15, 2], actions: ['press'], badge: '1', desc: 'Direct message, 1 unread, away' },
      ]},
      { role: 'list', name: 'Messages', bounds: [18, 5, 32, 26], children: [
        { role: 'listitem', name: 'Minh 09:12 — deploy is green, tagging v2.4.0', bounds: [19, 6, 30, 2], desc: 'Message from Minh at 09:12' },
        { role: 'listitem', name: 'An 09:14 — nice, rolling to staging now', bounds: [19, 9, 30, 2], desc: 'Message from An at 09:14' },
        { role: 'listitem', name: 'Quan 09:15 — hold on, smoke test flaked', bounds: [19, 12, 30, 2], desc: 'Message from Quan at 09:15' },
        { role: 'listitem', name: 'Minh 09:16 — which job? rerun or real failure?', bounds: [19, 15, 30, 2], desc: 'Message from Minh at 09:16' },
        { role: 'listitem', name: 'Quan 09:18 — e2e checkout flow, digging', bounds: [19, 18, 30, 2], desc: 'Message from Quan at 09:18' },
        { role: 'listitem', name: 'An 09:21 — logs say timeout on the payment stub', bounds: [19, 21, 30, 2], desc: 'Message from An at 09:21' },
        { role: 'listitem', name: 'Minh 09:24 — bump the stub timeout and retry', bounds: [19, 24, 30, 2], desc: 'Message from Minh at 09:24' },
        { role: 'listitem', name: 'Quan 09:27 — green on retry. shipping it', bounds: [19, 27, 30, 2], desc: 'Message from Quan at 09:27' },
      ]},
      { role: 'canvas', name: 'Activity chart', bounds: [51, 5, 12, 26], desc: 'Custom-rendered message volume chart for the last 24 hours', visual: { type: 'chart', rendering: 'canvas2d' } },
      { role: 'form', name: 'Composer', bounds: [18, 32, 45, 4], children: [
        { role: 'textbox', name: 'Message', bounds: [19, 33, 27, 2], state: { focused: true }, actions: ['setText'], desc: 'Message #general — multiline input' },
        { role: 'checkbox', name: 'Notify channel', bounds: [47, 33, 9, 2], state: { checked: true }, actions: ['press'], desc: 'Push a notification to all channel members' },
        { role: 'button', name: 'Send', bounds: [58, 33, 4, 2], actions: ['press'], desc: 'Send message (Ctrl+Enter)' },
      ]},
      { role: 'dialog', name: 'Confirm delete', bounds: [24, 12, 18, 10], state: { modal: true }, desc: 'Delete this message? This cannot be undone.', children: [
        { role: 'button', name: 'Delete', bounds: [26, 18, 6, 2], actions: ['press'], desc: 'Permanently delete the selected message' },
        { role: 'button', name: 'Cancel', bounds: [34, 18, 6, 2], actions: ['press'], desc: 'Cancel and close the dialog' },
      ]},
    ],
  },
};

export const SETTINGS_APP = {
  scene: 'settings-app',
  title: 'Settings — small preferences window',
  grid: [64, 36],
  root: {
    role: 'window', name: 'Settings', desc: 'Application preferences',
    bounds: [0, 0, 64, 36], state: { focused: true },
    children: [
      { role: 'form', name: 'General', bounds: [2, 2, 60, 32], children: [
        { role: 'checkbox', name: 'Launch at login', bounds: [4, 5, 24, 2], state: { checked: true }, actions: ['press'] },
        { role: 'checkbox', name: 'Send crash reports', bounds: [4, 9, 24, 2], state: { checked: false }, actions: ['press'] },
        { role: 'checkbox', name: 'Encrypt backups', bounds: [4, 13, 24, 2], state: { checked: true }, actions: ['press'], desc: 'Encrypt local backups before upload' },
        { role: 'textbox', name: 'Display name', bounds: [4, 18, 28, 2], actions: ['setText'], desc: 'Shown to your teammates' },
        { role: 'button', name: 'Save', bounds: [4, 24, 10, 2], actions: ['press'], desc: 'Save all changes' },
        { role: 'button', name: 'Reset', bounds: [16, 24, 10, 2], actions: ['press'], desc: 'Restore defaults' },
      ]},
    ],
  },
};

export const SCENES = { 'chat-app': CHAT_APP, 'settings-app': SETTINGS_APP };

// Walk every node depth-first, calling fn(node, depth, parent).
export function walk(node, fn, depth = 0, parent = null) {
  fn(node, depth, parent);
  for (const child of node.children || []) walk(child, fn, depth + 1, node);
}

export function findByName(node, name) {
  let hit = null;
  walk(node, n => { if (!hit && n.name === name) hit = n; });
  return hit;
}

export function findWhere(node, pred) {
  const hits = [];
  walk(node, n => { if (pred(n)) hits.push(n); });
  return hits;
}

// Role → display color for the schematic raster render.
export const ROLE_COLORS = {
  window: '#16222b', toolbar: '#1f2f3a', button: '#245B78',
  list: '#101a21', listitem: '#1b2830', form: '#1f2f3a',
  textbox: '#0d151b', checkbox: '#2b4654', dialog: '#3a2f1b',
  canvas: '#0d151b',
};
