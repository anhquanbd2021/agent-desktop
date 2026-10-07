// Side-by-side CLI report: pixels vs. full tree vs. skeleton, plus the
// six-question query deck scored per mode. Exits non-zero on failure.
import { SCENES } from '../public/scene.mjs';
import { treeReport, serializeSkeleton } from '../public/tree.mjs';
import { pixelBudget } from '../public/pixels.mjs';
import { answerQueries } from '../public/queries.mjs';

const mark = { answered: ' YES ', guessed: 'guess', blind: '  no ' };

console.log('Perception Lab — two ways to see the same desktop\n');
console.log(`screenshot model: ${pixelBudget(SCENES['chat-app']).width}x${pixelBudget(SCENES['chat-app']).height}px → ~${pixelBudget(SCENES['chat-app']).imageTokens} image tokens + text tokens\n`);

for (const [key, scene] of Object.entries(SCENES)) {
  const { full, skeleton, reduction } = treeReport(scene.root, { depth: 1 });
  const px = pixelBudget(scene);
  console.log(`== ${scene.title} (${full.nodes} nodes)`);
  console.log(`   screenshot (vision model)      ~${String(px.total).padStart(5)} tokens   (${px.imageTokens} image + ${px.textTokens} text)`);
  console.log(`   accessibility tree, full dump  ~${String(full.tokens).padStart(5)} tokens   ${full.tokens > px.total ? '> pixels — dense apps need compression' : '< pixels — structure wins outright'}`);
  console.log(`   accessibility tree, skeleton   ~${String(skeleton.tokens).padStart(5)} tokens   (-${reduction}% vs full)`);

  const answers = answerQueries(scene);
  console.log(`\n   ${'question'.padEnd(52)}${'tree'.padEnd(8)}pixels`);
  for (const a of answers) {
    console.log(`   ${a.question.slice(0, 50).padEnd(52)}${mark[a.tree.verdict].padEnd(8)}${mark[a.pixels.verdict]}`);
  }
  const blind = answers.filter(a => a.tree.verdict === 'blind').map(a => a.id);
  console.log(`   tree blind spots: ${blind.length ? blind.join(', ') : 'none'}`);
  console.log('');
}

// Drill demo: snapshot just the region behind a skeleton ref on chat-app.
const sk = serializeSkeleton(SCENES['chat-app'].root, { depth: 1 });
console.log(`skeleton overview fits in ~${sk.tokens} tokens; the agent drills into refs it cares about (e.g. --root @e3).`);
console.log('Done.');
