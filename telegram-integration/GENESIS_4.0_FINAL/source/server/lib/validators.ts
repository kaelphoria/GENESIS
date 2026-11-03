
import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(128)
});

export const actionSchema = z.object({
  title: z.string().trim().min(1).max(180),
  notes: z.string().max(4000).optional(),
  worldId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  goalId: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  dueAt: z.string().datetime().optional().nullable()
});

export const memorySchema = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().trim().min(1).max(12000),
  classification: z.enum(['USER_STATEMENT', 'SELF_ASSESSMENT', 'OBSERVATION', 'HYPOTHESIS']).default('USER_STATEMENT'),
  worldId: z.string().optional().nullable(),
  sourceRefId: z.string().optional().nullable()
});

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().max(8000).default(''),
  goalId: z.string().nullable().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).default('active'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  startAt: z.string().datetime().optional().nullable(),
  targetAt: z.string().datetime().optional().nullable()
});

export const milestoneSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(180),
  description: z.string().max(4000).default(''),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).default('pending'),
  dueAt: z.string().datetime().optional().nullable(),
  sortOrder: z.number().int().min(0).max(100000).default(0)
});

export const decisionSchema = z.object({
  goalId: z.string().nullable().optional(),
  question: z.string().trim().min(1).max(8000),
  projectId: z.string().nullable().optional(),
  options: z.array(z.string().trim().min(1).max(1000)).max(12).default([]),
  selectedOption: z.string().max(2000).nullable().optional(),
  rationale: z.string().max(8000).default(''),
  status: z.enum(['open', 'decided', 'revisited']).default('open'),
  assumptions: z.array(z.string().trim().max(1000)).max(30).default([])
});

export const experimentSchema = z.object({
  title: z.string().trim().min(1).max(180),
  decisionId: z.string().nullable().optional(),
  hypothesis: z.string().max(8000).default(''),
  method: z.string().max(8000).default(''),
  result: z.string().max(8000).default(''),
  status: z.enum(['planned', 'running', 'completed', 'abandoned']).default('planned'),
  startedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional()
});

export const sourceSchema = z.object({
  kind: z.enum(['user_entered', 'document', 'web', 'conversation', 'import', 'system']),
  title: z.string().trim().min(1).max(240),
  uri: z.string().trim().url().max(2048).refine(value => /^https?:\/\//i.test(value), 'Only HTTP(S) source links are allowed').optional().nullable()
});

export const artifactSchema = z.object({
  title: z.string().trim().min(1).max(240),
  mediaType: z.enum(['document', 'image', 'audio', 'video', 'data', 'other']),
  projectId: z.string().nullable().optional(),
  sourceId: z.string().nullable().optional()
});

export const lifeEventSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().max(8000).default(''),
  category: z.enum(['milestone', 'transition', 'achievement', 'challenge', 'relationship', 'learning', 'health', 'career', 'other']).default('milestone'),
  occurredAt: z.string().datetime(),
  significance: z.number().int().min(1).max(5).default(3),
  projectId: z.string().nullable().optional(),
  goalId: z.string().nullable().optional(),
  decisionId: z.string().nullable().optional(),
  sourceId: z.string().nullable().optional()
});

export const goalSchema = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().max(8000).default(''),
  worldId: z.string().nullable().optional(),
  status: z.enum(['active', 'paused', 'completed', 'abandoned']).default('active'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  targetAt: z.string().datetime().nullable().optional()
});
