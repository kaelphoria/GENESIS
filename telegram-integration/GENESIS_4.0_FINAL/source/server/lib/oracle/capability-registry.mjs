/**
 * Canonical capability catalogue. `available` means implemented and usable in
 * this deployment; planned capabilities are deliberately not advertised as live.
 */
const DEFINITIONS = [
  { id: 'oracle.respond', label: 'Ответы ORACLE', domain: 'intelligence', status: 'available', permission: 'authenticated', risk: 'low' },
  { id: 'memory.read', label: 'Чтение разрешённой памяти', domain: 'memory', status: 'available', permission: 'personal_context', risk: 'medium' },
  { id: 'memory.write', label: 'Изменение памяти', domain: 'memory', status: 'planned', permission: 'explicit_user_action', risk: 'medium' },
  { id: 'projects.manage', label: 'Управление проектами', domain: 'execution', status: 'planned', permission: 'explicit_user_action', risk: 'high' },
  { id: 'web.research', label: 'Внешнее исследование', domain: 'research', status: 'not_connected', permission: 'external_access', risk: 'medium' },
  { id: 'devices.sync', label: 'Синхронизация устройств', domain: 'continuity', status: 'planned', permission: 'device_pairing', risk: 'high' }
];

export function listCapabilities({ includeContext = false } = {}) {
  return DEFINITIONS.map(item => ({
    ...item,
    enabled: item.status === 'available' && (item.id !== 'memory.read' || includeContext)
  }));
}

export function canUseCapability(id, options = {}) {
  const item = DEFINITIONS.find(capability => capability.id === id);
  if (!item) return { allowed: false, reason: 'UNKNOWN_CAPABILITY' };
  if (item.status !== 'available') return { allowed: false, reason: `CAPABILITY_${item.status.toUpperCase()}` };
  if (item.id === 'memory.read' && options.includeContext !== true) {
    return { allowed: false, reason: 'PERSONAL_CONTEXT_NOT_GRANTED' };
  }
  return { allowed: true, reason: null };
}
