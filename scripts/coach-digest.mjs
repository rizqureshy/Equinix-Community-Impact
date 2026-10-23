// Writes the knowledge base for the Community Impact Coach (an ElevenLabs
// agent) from the site's own content, so the coach never knows more than
// the page does. Usage: node scripts/coach-digest.mjs > media-src/voice/coach-knowledge.md
import { stories, sources, principles, topics } from '../impact/scripts/content/stories.js';
import { journeySteps } from '../impact/scripts/content/render.js';

const lines = [];
const out = (s = '') => lines.push(s);

out('# Equinix community impact: what the site says');
out();
out('This is the complete factual content of the internal "Infrastructure for human possibility" site. Every figure carries its scope and period. Nothing outside this document should be stated as fact.');
out();
out('## The five promises (the Community Principles)');
out();
out('Equinix has made five promises to the places it calls home, reported against every year.');
for (const p of principles) {
  out(`- **${p.name}.** Promise: ${p.promise} Proof: ${p.proof} (${p.kind}; ${p.where}.)`);
}
out();
out('## The places on the community model and their lead stories');
out();
for (const s of journeySteps()) {
  out(`- ${s.number} ${s.placeName} (${s.label}): ${s.moment} ${s.summary}`);
}
out();
out('## How to speak about the Equinix role');
out();
out('Equinix does not deliver the care, the research or the teaching. It provides secure, local, well-connected infrastructure: data center space, private interconnection, and in one case recovered heat. The hospitals, researchers, schools and partners do the work. Never say Equinix "powers hospitals" or "saves lives".');
out();
out('## Stories');
out();
for (const t of topics) {
  out(`### ${t.label}`);
  out();
  for (const s of stories.filter((x) => x.topic === t.id)) {
    out(`#### ${s.title}`);
    out(`Organisation: ${s.organisation}. Location: ${s.location}. Timeframe: ${s.timeframe}. Verification: ${s.verificationStatus}, last checked ${s.lastChecked}.`);
    out();
    out(`Summary: ${s.summary}`);
    if (s.humanContext) out(`Human context: ${s.humanContext}`);
    if (s.challenge) out(`Challenge: ${s.challenge}`);
    if (s.equinixContribution) out(`What Equinix provides: ${s.equinixContribution}`);
    if (s.partnerContribution) out(`What the partner does: ${s.partnerContribution}`);
    if (s.outcome) out(`Outcome: ${s.outcome}`);
    if (s.metric) out(`Figure: ${s.metric} (${s.metricLabel}). Scope: ${s.metricScope} Period: ${s.reportingPeriod}.`);
    if (s.connection) out(`The connection, in one line: ${s.connection}`);
    if (s.quote) out(`Quote: "${s.quote.text}" (${s.quote.attribution})`);
    if (s.conversationStarter) out(`Conversation starter: ${s.conversationStarter}`);
    out(`Sources: ${(s.sources || []).map((id) => `${id}: ${sources[id]?.title} (${sources[id]?.publisher})`).join('; ')}`);
    out();
  }
}
out('## Sources');
out();
for (const s of Object.values(sources)) {
  out(`- ${s.id}: ${s.title}. ${s.publisher}${s.published ? `, ${s.published}` : ''}. ${s.url}. Supports: ${s.supports}`);
}
process.stdout.write(lines.join('\n') + '\n');
