// Token estimation — deliberately simple and documented as such.
// Roughly 4 characters per token is a common heuristic for English text and
// JSON-ish structure. This is an *estimate* for comparing representations,
// not a real tokenizer — see README "Honest limits".
export function estimateTokens(text) {
  return Math.ceil(String(text).length / 4);
}
