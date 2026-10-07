# Perception Lab — companion demo

Interactive lab for the article about computer-use perception: one fake
desktop, seen two ways — as a **screenshot** a vision model must interpret,
and as a **serialized accessibility tree** with roles, states, actions, and
deterministic `@eN` refs. Inspired by
[`lahfir/agent-desktop`](https://github.com/lahfir/agent-desktop), the Rust
CLI that gives agents structured access to real desktop apps.

Zero dependencies — Node 20+ only. The scene model, tree serializer, pixel
rasterizer, and query engine are plain ES modules shared by the browser UI,
the CLI report, and the test suite.

## Three views

| View | What it proves |
|---|---|
| **Scene + modes** | Pick a fixture (`chat-app`, `settings-app`) and flip between vision transcript, full tree dump, and skeleton overview — with an estimated token count for each. Dense apps show why a full dump needs compression; the skeleton shows the fix. |
| **Drill-down** | Skeleton containers carry `children_count`; pick a ref (`--root @eN` semantics) and snapshot only that subtree — the agent pays for the region it needs. |
| **Query deck** | Six agent questions scored per mode (answered / guesses / blind) — including the honest blind spot: a custom-rendered chart the tree cannot see but pixels can. |

## Run it

```text
npm start       # serve the lab on :3000
npm test        # serializer + raster + query deck + server
npm run report  # side-by-side token/answerability report in the terminal
npm run check   # both
```

## Examples

- `examples/chat-app.json` — a dense Slack-like window (32 nodes): full tree
  (~1.3k est. tokens) exceeds a screenshot (~1.1k); skeleton drops to ~265.
  Contains a `canvas`-role chart region — the tree's blind spot.
- `examples/settings-app.json` — a small preferences window where even the
  full tree beats a screenshot ~3x.

## Honest limits

- Token counts are a chars/4 estimate plus a pixels/750 image heuristic —
  a comparison tool, not a tokenizer or vision-model benchmark.
- The raster is a schematic stand-in for a screenshot; real vision models
  fail in more interesting ways (occlusion, styling, adversarial UI).
- Fixture trees are well-formed; real apps ship missing names, wrong roles,
  and custom widgets that expose nothing.
- Query verdicts are illustrative of the pattern, not a benchmark.
- Nothing here touches a real screen, accessibility API, or model.

This is an educational demo, not production infrastructure.
