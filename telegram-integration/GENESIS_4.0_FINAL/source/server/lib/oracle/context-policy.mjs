const DEFAULT_BUDGET = 16000;

/**
 * Build a bounded, provenance-aware context manifest.
 * The caller must pass only records the authenticated user is allowed to expose.
 * Memory status is not treated as independent verification or inferred consent.
 */
/**
 * @param {{
 *   profile: { values?: string; direction?: string; currentFocus?: string; supportStyle?: string } | null;
 *   memories?: Array<{ id: string; title: string; content: string; classification?: string; source?: string; updatedAt?: Date | string; confidence?: number | null; sourceRef?: { id: string; title: string; trustStatus?: string } | null }>;
 *   worlds?: Array<{ title: string; intention?: string }>;
 *   budget?: number;
 * }} input
 */
export function buildContextManifest({ profile, memories = [], worlds = [], budget = DEFAULT_BUDGET }) {
  const entries = [];
  if (profile) {
    entries.push({
      kind: 'personal_profile',
      provenance: 'USER_AUTHORED_PROFILE',
      trust: 'USER_PROVIDED_NOT_INDEPENDENTLY_VERIFIED',
      content: [
        `Values: ${profile.values || ''}`,
        `Direction: ${profile.direction || ''}`,
        `Current focus: ${profile.currentFocus || ''}`,
        `Support style: ${profile.supportStyle || ''}`
      ].join('\n').trim()
    });
  }

  for (const memory of memories) {
    entries.push({
      kind: 'memory',
      id: memory.id,
      provenance: memory.source || 'USER_SAVED_MEMORY',
      classification: memory.classification || 'UNCLASSIFIED',
      sourceRef: memory.sourceRef ? { id: memory.sourceRef.id, title: memory.sourceRef.title, trustStatus: memory.sourceRef.trustStatus || 'unverified' } : null,
      confidence: Number.isFinite(memory.confidence) ? memory.confidence : null,
      trust: 'SAVED_BY_USER_NOT_INDEPENDENTLY_VERIFIED',
      updatedAt: memory.updatedAt instanceof Date ? memory.updatedAt.toISOString() : memory.updatedAt,
      content: [
        memory.sourceRef ? `Linked source: ${memory.sourceRef.title} (recorded trust label: ${memory.sourceRef.trustStatus || 'unverified'}; not independently verified by GENESIS)` : '',
        Number.isFinite(memory.confidence) ? `User-entered confidence: ${memory.confidence}` : '',
        `${memory.title}: ${memory.content}`
      ].filter(Boolean).join('\n')
    });
  }

  for (const world of worlds) {
    if (!world.intention?.trim()) continue;
    entries.push({
      kind: 'world_intention',
      provenance: 'USER_AUTHORED_WORLD',
      trust: 'USER_PROVIDED_NOT_INDEPENDENTLY_VERIFIED',
      content: `${world.title}: ${world.intention}`
    });
  }

  let remaining = Math.max(0, budget);
  const bounded = [];
  for (const entry of entries) {
    if (remaining <= 0) break;
    const content = String(entry.content || '');
    if (!content) continue;
    const header = `[${entry.kind}; ${entry.provenance}; ${entry.trust}] `;
    const available = Math.max(0, remaining - header.length);
    if (!available) break;
    const clipped = content.length > available ? `${content.slice(0, Math.max(0, available - 1))}…` : content;
    bounded.push({ ...entry, content: clipped });
    remaining -= header.length + clipped.length;
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    policy: 'USER_CONTEXT_ONLY; NO_INDEPENDENT_VERIFICATION_CLAIM; BOUNDED',
    includedCount: bounded.length,
    truncated: bounded.length < entries.length || remaining <= 0,
    entries: bounded
  };
}

export function renderContextManifest(manifest) {
  if (!manifest?.entries?.length) return 'No authorized personal context was supplied.';
  return manifest.entries.map(entry =>
    `[${entry.kind} | ${entry.provenance} | ${entry.trust}]\n${entry.content}`
  ).join('\n\n');
}
