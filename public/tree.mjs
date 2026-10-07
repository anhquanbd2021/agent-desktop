// Accessibility-tree serializer — what an agent receives when it asks the OS
// for structure instead of pixels. Mirrors the real agent-desktop design:
// deterministic @eN refs, roles/names/states/actions in JSON, and a
// progressive *skeleton* mode that returns a shallow overview with
// children_count annotations so the agent can drill into just one subtree.
import { estimateTokens } from './tokens.mjs';
import { walk } from './scene.mjs';

// Assign deterministic refs @e1, @e2, ... in depth-first order.
// Stable across re-serializations of the same scene — like agent-desktop's
// "optimistic re-identification" across UI shifts.
export function assignRefs(root) {
  const refs = new Map();
  let n = 0;
  walk(root, node => { node.ref = `@e${++n}`; refs.set(node.ref, node); });
  return refs;
}

function serializeNode(node) {
  const out = { ref: node.ref, role: node.role };
  if (node.name) out.name = node.name;
  if (node.desc) out.desc = node.desc;
  if (node.state) out.state = node.state;
  if (node.actions) out.actions = node.actions;
  if (node.badge) out.badge = node.badge;
  // A custom-rendered node is honest about what it is — and nothing more.
  if (node.visual) out.visual = node.visual;
  return out;
}

// Full dump — every node, every property. Faithful but expensive on dense
// apps (the real tool measured >50k tokens for a full Slack tree).
// keepRefs: reuse refs already assigned on the nodes (drill keeps the refs
// the overview handed out, so @e3 means the same element before and after).
export function serializeFull(root, { keepRefs = false } = {}) {
  if (!keepRefs) assignRefs(root);
  const ser = node => ({
    ...serializeNode(node),
    ...(node.children?.length ? { children: node.children.map(ser) } : {}),
  });
  const tree = ser(root);
  const json = JSON.stringify(tree, null, 1);
  return { tree, json, tokens: estimateTokens(json), nodes: countNodes(root) };
}

// Skeleton dump — nodes deeper than `depth` are replaced by a one-line
// summary {ref, role, name, children_count, truncated}. The agent reads the
// overview, then drills into the region it cares about with drill(ref).
export function serializeSkeleton(root, { depth = 1 } = {}) {
  assignRefs(root);
  const ser = (node, d) => {
    if (d >= depth && node.children?.length) {
      return { ...serializeNode(node), children_count: node.children.length, truncated: true };
    }
    return {
      ...serializeNode(node),
      ...(node.children?.length ? { children: node.children.map(c => ser(c, d + 1)) } : {}),
    };
  };
  const tree = ser(root, 0);
  const json = JSON.stringify(tree, null, 1);
  return { tree, json, tokens: estimateTokens(json), nodes: countNodes(root), depth };
}

// Drill — snapshot only the subtree behind a ref, like `--root @e3`.
// Returns null for unknown refs (a real CLI returns a structured error).
export function drill(root, ref) {
  const refs = assignRefs(root);
  const node = refs.get(ref);
  if (!node) return null;
  return serializeFull(node, { keepRefs: true });
}

export function countNodes(root) {
  let n = 0;
  walk(root, () => n++);
  return n;
}

// Summary used by the lab UI and CLI report.
export function treeReport(root, opts) {
  const full = serializeFull(root);
  const skeleton = serializeSkeleton(root, opts);
  const reduction = full.tokens ? Math.round((1 - skeleton.tokens / full.tokens) * 1000) / 10 : 0;
  return { full, skeleton, reduction };
}
