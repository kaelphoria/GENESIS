import { buildContextManifest, renderContextManifest } from './context-policy.mjs';

type ContextProfile = {
  values: string; direction: string; currentFocus: string; supportStyle: string;
};
type ContextMemory = {
  id: string; title: string; content: string; classification: string; source: string; updatedAt: Date;
  confidence?: number | null; sourceRef?: { id: string; title: string; trustStatus: string } | null;
};
type ContextWorld = { title: string; intention: string };

export type OracleContextResult = {
  manifest: ReturnType<typeof buildContextManifest>;
  rendered: string;
};

export function createOracleContext(input: {
  profile: ContextProfile | null;
  memories: ContextMemory[];
  worlds: ContextWorld[];
  budget?: number;
}): OracleContextResult {
  const manifest = buildContextManifest(input);
  return { manifest, rendered: renderContextManifest(manifest) };
}
