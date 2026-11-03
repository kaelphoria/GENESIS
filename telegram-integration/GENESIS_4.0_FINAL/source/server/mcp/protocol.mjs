const SUPPORTED_PROTOCOLS = ['2026-07-28', '2025-11-25', '2025-06-18', '2025-03-26'];
const DEFAULT_PROTOCOL = SUPPORTED_PROTOCOLS[0];
const MAX_ID_LENGTH = 128;
const MAX_TOOL_ARGUMENT_BYTES = 32 * 1024;

function errorResponse(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function validId(id) {
  return (typeof id === 'string' && id.length <= MAX_ID_LENGTH) || (typeof id === 'number' && Number.isFinite(id));
}

function validParams(params) {
  return params === undefined || (params !== null && typeof params === 'object' && !Array.isArray(params));
}

export function createMcpProtocolHandler(registry) {
  let initialized = false;
  let initializationStarted = false;
  return async function handle(message) {
    if (!message || typeof message !== 'object' || Array.isArray(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string' || !message.method || !validParams(message.params)) {
      return Object.prototype.hasOwnProperty.call(message || {}, 'id')
        ? errorResponse(validId(message.id) ? message.id : null, -32600, 'Invalid Request') : null;
    }
    const hasId = Object.prototype.hasOwnProperty.call(message, 'id');
    const id = hasId ? message.id : null;
    if (hasId && !validId(id)) return errorResponse(null, -32600, 'Invalid Request');

    switch (message.method) {
      case 'initialize': {
        if (!hasId) return null;
        const requested = message.params?.protocolVersion;
        const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : DEFAULT_PROTOCOL;
        initialized = false;
        initializationStarted = true;
        return { jsonrpc: '2.0', id, result: { protocolVersion, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'genesis-private', version: '0.2.0' } } };
      }
      case 'notifications/initialized':
        if (hasId) return errorResponse(id, -32600, 'Notifications must not include an id');
        // A client cannot complete initialization before initialize has been called.
        if (!initializationStarted) return null;
        initialized = true;
        return null;
      case 'ping':
        return hasId ? { jsonrpc: '2.0', id, result: {} } : null;
      case 'tools/list':
        if (!hasId) return null;
        if (!initialized) return errorResponse(id, -32002, 'Server not initialized');
        return { jsonrpc: '2.0', id, result: { tools: registry.list } };
      case 'tools/call': {
        if (!hasId) return null;
        if (!initialized) return errorResponse(id, -32002, 'Server not initialized');
        const params = message.params || {};
        if (typeof params.name !== 'string' || !params.name || !validParams(params.arguments)) return errorResponse(id, -32602, 'Invalid params');
        let argumentBytes;
        try { argumentBytes = Buffer.byteLength(JSON.stringify(params.arguments || {}), 'utf8'); }
        catch { return errorResponse(id, -32602, 'Invalid params'); }
        if (argumentBytes > MAX_TOOL_ARGUMENT_BYTES) return errorResponse(id, -32602, 'Tool arguments too large');
        try {
          const data = await registry.call(params.name, params.arguments || {});
          return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data, isError: false } };
        } catch (error) {
          const safeMessage = error instanceof Error && /^[A-Z0-9_:-]{1,80}$/.test(error.message) ? error.message : 'TOOL_FAILED';
          return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: safeMessage }], isError: true } };
        }
      }
      default:
        return hasId ? errorResponse(id, -32601, 'Method not found') : null;
    }
  };
}
