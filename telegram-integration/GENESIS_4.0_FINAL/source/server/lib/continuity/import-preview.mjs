const COLLECTIONS = [
  'worlds', 'goals', 'actions', 'memories', 'conversations', 'messages', 'chatRequests',
  'projects', 'milestones', 'decisions', 'experiments', 'artifacts', 'sources',
  'memoryVersions', 'provenanceEvents', 'lifeEvents', 'lifeEventVersions'
];
const REFERENCES = [
  ['goals', 'worldId', 'worlds'], ['actions', 'worldId', 'worlds'], ['actions', 'projectId', 'projects'], ['actions', 'goalId', 'goals'],
  ['memories', 'worldId', 'worlds'], ['memories', 'sourceRefId', 'sources'],
  ['messages', 'conversationId', 'conversations'], ['chatRequests', 'conversationId', 'conversations'],
  ['chatRequests', 'userMessageId', 'messages'], ['milestones', 'projectId', 'projects'],
  ['projects', 'goalId', 'goals'], ['decisions', 'goalId', 'goals'], ['decisions', 'projectId', 'projects'], ['experiments', 'decisionId', 'decisions'],
  ['artifacts', 'projectId', 'projects'], ['artifacts', 'sourceId', 'sources'],
  ['memoryVersions', 'memoryId', 'memories'], ['provenanceEvents', 'sourceId', 'sources'],
  ['provenanceEvents', 'memoryId', 'memories'], ['provenanceEvents', 'artifactId', 'artifacts'],
  ['lifeEvents', 'projectId', 'projects'], ['lifeEvents', 'goalId', 'goals'], ['lifeEvents', 'decisionId', 'decisions'], ['lifeEvents', 'sourceId', 'sources'],
  ['lifeEventVersions', 'eventId', 'lifeEvents']
];

export function analyzeAccountExport(payload) {
  const errors = [];
  const warnings = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, format: null, schemaVersion: null, counts: {}, errors: ['EXPORT_NOT_OBJECT'], warnings };
  }
  if (payload.format !== 'genesis.account-export') errors.push('UNSUPPORTED_EXPORT_FORMAT');
  const schemaVersion = Number(payload.schemaVersion);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) errors.push('INVALID_SCHEMA_VERSION');
  else if (schemaVersion > 6) errors.push('UNSUPPORTED_FUTURE_SCHEMA_VERSION');

  const data = {};
  const idSets = {};
  const counts = {};
  for (const name of COLLECTIONS) {
    const rows = payload[name];
    if (rows === undefined) {
      data[name] = [];
      counts[name] = 0;
      warnings.push(`MISSING_COLLECTION:${name}`);
      continue;
    }
    if (!Array.isArray(rows)) {
      errors.push(`COLLECTION_NOT_ARRAY:${name}`);
      data[name] = [];
      counts[name] = 0;
      continue;
    }
    data[name] = rows;
    counts[name] = rows.length;
    const ids = new Set();
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string' || !row.id.trim()) {
        errors.push(`INVALID_RECORD:${name}:${index}`);
        continue;
      }
      if (ids.has(row.id)) errors.push(`DUPLICATE_ID:${name}:${row.id}`);
      ids.add(row.id);
    }
    idSets[name] = ids;
  }

  for (const [collection, field, target] of REFERENCES) {
    for (let index = 0; index < data[collection].length; index++) {
      const row = data[collection][index];
      const reference = row && row[field];
      if (reference !== null && reference !== undefined && reference !== '' && idSets[target] && !idSets[target].has(reference)) {
        errors.push(`DANGLING_REFERENCE:${collection}:${index}:${field}`);
      }
    }
  }

  if (!payload.profile || typeof payload.profile !== 'object' || Array.isArray(payload.profile)) warnings.push('PROFILE_MISSING_OR_INVALID');
  return {
    valid: errors.length === 0,
    format: payload.format || null,
    schemaVersion: Number.isInteger(schemaVersion) ? schemaVersion : null,
    counts,
    totalRecords: Object.values(counts).reduce((sum, count) => sum + count, 0),
    errors,
    warnings,
    mutationPerformed: false
  };
}
