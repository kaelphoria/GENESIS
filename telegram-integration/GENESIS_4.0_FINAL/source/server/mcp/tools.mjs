const MAX_LIMIT = 50;

function readStatus(value, allowed, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !allowed.includes(value)) throw new Error('INVALID_STATUS');
  return value;
}

function assertAllowedKeys(args, allowed) {
  if (Object.keys(args).some(key => !allowed.includes(key))) throw new Error('UNKNOWN_ARGUMENT');
}

function readLimit(value, fallback = 20, max = MAX_LIMIT) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1) throw new Error('INVALID_LIMIT');
  return Math.min(max, value);
}

export const GENESIS_MCP_TOOLS = [
  {
    name: 'genesis.get_overview',
    description: 'Read aggregate counts for the authenticated GENESIS owner. Does not return personal record contents.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'genesis.get_personal_profile',
    description: 'Read the owner-authored Personal Model profile. Use only when the user asks to reference their profile or personal direction.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'genesis.list_worlds',
    description: 'List the owner’s Nine Worlds and their user-authored intentions.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  },
  {
    name: 'genesis.list_goals',
    description: 'List the owner’s goals. Optionally filter by lifecycle status.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'] }, limit: { type: 'integer', minimum: 1, maximum: 50 } }, additionalProperties: false }
  },
  {
    name: 'genesis.list_projects',
    description: 'List the owner’s projects and their linked goal titles.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'] }, limit: { type: 'integer', minimum: 1, maximum: 50 } }, additionalProperties: false }
  },
  {
    name: 'genesis.list_actions',
    description: 'List the owner’s actions and their linked world, project and goal titles.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: { state: { type: 'string', enum: ['open', 'completed', 'all'] }, limit: { type: 'integer', minimum: 1, maximum: 50 } }, additionalProperties: false }
  },
  {
    name: 'genesis.search_memories',
    description: 'Search only active memories the owner explicitly approved for AI context. Denied/private memories are never returned.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string', minLength: 1, maxLength: 200 }, limit: { type: 'integer', minimum: 1, maximum: 20 } }, additionalProperties: false }
  },
  {
    name: 'genesis.list_conversations',
    description: 'List recent conversation titles and timestamps. Use only when the user asks to find or continue a prior conversation.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 20 } }, additionalProperties: false }
  },
  {
    name: 'genesis.get_conversation',
    description: 'Read a specific prior conversation and its recent messages. Use only when the user asks to recover or continue that conversation.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', required: ['conversationId'], properties: { conversationId: { type: 'string', minLength: 1, maxLength: 128 }, limit: { type: 'integer', minimum: 1, maximum: 50 } }, additionalProperties: false }
  },
  {
    name: 'genesis.get_memory_history',
    description: 'Read prior versions of one active memory explicitly approved for AI context. Denied/private memory histories are never returned.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', required: ['memoryId'], properties: { memoryId: { type: 'string', minLength: 1, maxLength: 128 }, limit: { type: 'integer', minimum: 1, maximum: 30 } }, additionalProperties: false }
  },
  {
    name: 'genesis.get_life_timeline',
    description: 'Read the owner-authored Life Timeline. This may contain sensitive personal events; call only when directly relevant to the user’s request.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: { type: 'object', properties: { from: { type: 'string', format: 'date-time' }, to: { type: 'string', format: 'date-time' }, limit: { type: 'integer', minimum: 1, maximum: 50 } }, additionalProperties: false }
  }
];

export function createGenesisToolRegistry({ db, userId }) {
  if (!db || typeof userId !== 'string' || !userId.trim()) throw new Error('MCP_OWNER_SCOPE_REQUIRED');

  async function call(name, args = {}) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('INVALID_TOOL_ARGUMENTS');
    switch (name) {
      case 'genesis.get_overview': {
        assertAllowedKeys(args, []);
        const [worlds, goals, projects, actions, memories] = await Promise.all([
          db.world.count({ where: { userId } }),
          db.goal.count({ where: { userId } }),
          db.project.count({ where: { userId } }),
          db.action.count({ where: { userId } }),
          db.memoryRecord.count({ where: { userId } })
        ]);
        return { worlds, goals, projects, actions, memories };
      }
      case 'genesis.get_personal_profile':
        assertAllowedKeys(args, []);
        return db.personalProfile.findUnique({ where: { userId }, select: { displayName: true, values: true, direction: true, currentFocus: true, supportStyle: true, version: true, updatedAt: true } });
      case 'genesis.list_worlds':
        assertAllowedKeys(args, []);
        return db.world.findMany({ where: { userId }, select: { id: true, slug: true, title: true, description: true, intention: true, updatedAt: true }, orderBy: { slug: 'asc' } });
      case 'genesis.list_goals': {
        assertAllowedKeys(args, ['status', 'limit']);
        const status = readStatus(args.status, ['active', 'paused', 'completed', 'archived']);
        return db.goal.findMany({ where: { userId, ...(status ? { status } : {}) }, select: { id: true, title: true, description: true, status: true, priority: true, targetAt: true, world: { select: { id: true, title: true } }, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: readLimit(args.limit) });
      }
      case 'genesis.list_projects': {
        assertAllowedKeys(args, ['status', 'limit']);
        const status = readStatus(args.status, ['active', 'paused', 'completed', 'archived']);
        return db.project.findMany({ where: { userId, ...(status ? { status } : {}) }, select: { id: true, title: true, description: true, status: true, priority: true, targetAt: true, goal: { select: { id: true, title: true } }, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: readLimit(args.limit) });
      }
      case 'genesis.list_actions': {
        assertAllowedKeys(args, ['state', 'limit']);
        const state = readStatus(args.state, ['open', 'completed', 'all'], 'open');
        return db.action.findMany({ where: { userId, ...(state === 'open' ? { completedAt: null } : state === 'completed' ? { completedAt: { not: null } } : {}) }, select: { id: true, title: true, notes: true, priority: true, dueAt: true, completedAt: true, world: { select: { id: true, title: true } }, project: { select: { id: true, title: true } }, goal: { select: { id: true, title: true } } }, orderBy: [{ completedAt: 'asc' }, { dueAt: 'asc' }, { updatedAt: 'desc' }], take: readLimit(args.limit) });
      }
      case 'genesis.search_memories': {
        assertAllowedKeys(args, ['query', 'limit']);
        const query = typeof args.query === 'string' ? args.query.trim().slice(0, 200) : '';
        if (!query) throw new Error('QUERY_REQUIRED');
        return db.memoryRecord.findMany({ where: { userId, status: 'active', contextPermission: 'granted', OR: [{ title: { contains: query, mode: 'insensitive' } }, { content: { contains: query, mode: 'insensitive' } }] }, select: { id: true, title: true, content: true, classification: true, source: true, confidence: true, version: true, updatedAt: true, sourceRef: { select: { id: true, title: true, trustStatus: true } } }, orderBy: { updatedAt: 'desc' }, take: readLimit(args.limit, 10, 20) });
      }
      case 'genesis.list_conversations': {
        assertAllowedKeys(args, ['limit']);
        return db.conversation.findMany({ where: { userId }, select: { id: true, title: true, createdAt: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: readLimit(args.limit, 10, 20) });
      }
      case 'genesis.get_conversation': {
        assertAllowedKeys(args, ['conversationId', 'limit']);
        const conversationId = typeof args.conversationId === 'string' ? args.conversationId.trim() : '';
        if (!conversationId || conversationId.length > 128) throw new Error('CONVERSATION_ID_REQUIRED');
        const conversation = await db.conversation.findFirst({ where: { id: conversationId, userId }, select: { id: true, title: true, createdAt: true, updatedAt: true } });
        if (!conversation) return { conversation: null, messages: [] };
        const messages = await db.chatMessage.findMany({ where: { userId, conversationId }, select: { role: true, content: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: readLimit(args.limit, 30, 50) });
        return { conversation, messages: messages.reverse() };
      }
      case 'genesis.get_memory_history': {
        assertAllowedKeys(args, ['memoryId', 'limit']);
        const memoryId = typeof args.memoryId === 'string' ? args.memoryId.trim() : '';
        if (!memoryId || memoryId.length > 128) throw new Error('MEMORY_ID_REQUIRED');
        const memory = await db.memoryRecord.findFirst({ where: { id: memoryId, userId, status: 'active', contextPermission: 'granted' }, select: { id: true, title: true, version: true } });
        if (!memory) return { memory: null, versions: [] };
        const storedVersions = await db.memoryVersion.findMany({ where: { memoryId, userId }, select: { version: true, snapshot: true, createdAt: true }, orderBy: { version: 'desc' }, take: readLimit(args.limit, 20, 30) });
        const versions = storedVersions.filter(item => item.snapshot && typeof item.snapshot === 'object' && item.snapshot.contextPermission === 'granted');
        return { memory, versions };
      }
      case 'genesis.get_life_timeline': {
        assertAllowedKeys(args, ['from', 'to', 'limit']);
        if (args.from !== undefined && typeof args.from !== 'string') throw new Error('INVALID_DATE_RANGE');
        if (args.to !== undefined && typeof args.to !== 'string') throw new Error('INVALID_DATE_RANGE');
        if (args.from !== undefined && !Number.isFinite(Date.parse(args.from))) throw new Error('INVALID_DATE_RANGE');
        if (args.to !== undefined && !Number.isFinite(Date.parse(args.to))) throw new Error('INVALID_DATE_RANGE');
        const from = typeof args.from === 'string' ? new Date(args.from) : undefined;
        const to = typeof args.to === 'string' ? new Date(args.to) : undefined;
        if (from && to && from > to) throw new Error('INVALID_DATE_RANGE');
        return db.lifeEvent.findMany({ where: { userId, ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }, select: { id: true, title: true, description: true, category: true, significance: true, occurredAt: true, goal: { select: { id: true, title: true } }, project: { select: { id: true, title: true } }, decision: { select: { id: true, question: true } } }, orderBy: { occurredAt: 'desc' }, take: readLimit(args.limit) });
      }
      default: throw new Error('UNKNOWN_TOOL');
    }
  }

  return { list: GENESIS_MCP_TOOLS, call };
}
