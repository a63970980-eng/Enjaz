import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { getConnectionCredentials, logIntegrationAction } from '../credentials-vault.js';
import { registerTool } from '../tool-registry.js';

const text = value => String(value ?? '').trim();

function validateEndpoint(value, allowedHosts = []) {
  let url;
  try { url = new URL(text(value)); } catch { throw new Error('MCP endpoint must be a valid URL'); }
  if (url.protocol !== 'https:') throw new Error('MCP endpoint must use HTTPS');
  if (url.username || url.password) throw new Error('MCP endpoint must not contain embedded credentials');
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' || hostname === '[::1]' || hostname === '::1' ||
      hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('MCP endpoint cannot target a local or internal hostname');
  }
  const hosts = Array.isArray(allowedHosts) ? allowedHosts.map(text).filter(Boolean) : [];
  if (!hosts.length) throw new Error('MCP connection must declare an allowed host');
  if (!hosts.some(host => hostname === host.toLowerCase() || hostname.endsWith('.' + host.toLowerCase()))) {
    throw new Error('MCP endpoint host is not allowlisted for this connection');
  }
  return url;
}

function authHeaders(credentials, config) {
  const token = text(credentials?.accessToken || credentials?.token || credentials?.apiKey || credentials?.apiToken);
  if (!token) return {};
  const headerName = text(config?.authHeaderName || 'Authorization');
  if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(headerName)) throw new Error('Invalid MCP authentication header name');
  return {
    [headerName]: headerName.toLowerCase() === 'authorization' && !/^Bearer\s/i.test(token) ? 'Bearer ' + token : token,
  };
}

async function withClient({ workspaceId, connectionId, context, operation }) {
  const connection = await getConnectionCredentials({ workspaceId, connectionId, provider: 'mcp' });
  const endpoint = validateEndpoint(connection.config?.endpoint, connection.config?.allowedHosts);
  const headers = authHeaders(connection.credentials, connection.config);
  const transport = new StreamableHTTPClientTransport(endpoint, {
    requestInit: { headers },
    fetch: async (input, init = {}) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const upstream = init.signal;
        if (upstream?.aborted) controller.abort(upstream.reason);
        else if (upstream) upstream.addEventListener('abort', () => controller.abort(upstream.reason), { once: true });
        return await fetch(input, { ...init, signal: controller.signal, redirect: 'error' });
      } finally {
        clearTimeout(timeout);
      }
    },
  });
  const client = new Client({ name: 'enjaz-workforce', version: '1.0.0' });
  try {
    await client.connect(transport);
    return await operation({ client, connection, endpoint });
  } finally {
    await client.close().catch(() => {});
  }
}

function publicToolDescriptor(tool) {
  return {
    name: String(tool?.name || '').slice(0, 200),
    description: String(tool?.description || '').slice(0, 500),
    inputSchema: tool?.inputSchema && typeof tool.inputSchema === 'object' ? tool.inputSchema : {},
    source: 'external_mcp_untrusted',
  };
}

registerTool({
  name: 'mcp.tools.list',
  description: 'Discover tools exposed by a connected external MCP server.',
  risk: 'low',
  execute: async ({ input, context }) => {
    const connectionId = text(input?.connectionId);
    if (!connectionId) throw new Error('connectionId is required');
    return withClient({
      workspaceId: context.workspaceId, connectionId, context,
      operation: async ({ client, connection, endpoint }) => {
        const result = await client.listTools();
        await logIntegrationAction({
          workspaceId: context.workspaceId, taskId: context.taskId, employeeId: context.employeeId,
          connectionId: connection.id, provider: connection.provider, action: 'mcp.tools.list',
          status: 'succeeded',
          requestMeta: { endpoint: endpoint.origin + endpoint.pathname },
          responseMeta: { toolCount: result.tools?.length || 0 },
        });
        return { type: 'mcp_tools', connectionId: connection.id, tools: (result.tools || []).map(publicToolDescriptor) };
      },
    });
  },
});

registerTool({
  name: 'mcp.tool.call',
  description: 'Call a tool exposed by a connected external MCP server. External calls are high-risk and require human approval.',
  risk: 'high',
  execute: async ({ input, context, approved }) => {
    if (!approved) return {
      type: 'approval_required', action: 'mcp.tool.call',
      requestedOperation: text(input?.toolName) || 'external_mcp_tool',
    };
    const connectionId = text(input?.connectionId);
    const toolName = text(input?.toolName);
    if (!connectionId || !toolName) throw new Error('connectionId and toolName are required');
    if (toolName.length > 200) throw new Error('toolName is too long');
    const argumentsValue = input?.arguments;
    if (argumentsValue !== undefined && (!argumentsValue || typeof argumentsValue !== 'object' || Array.isArray(argumentsValue))) {
      throw new Error('MCP tool arguments must be an object');
    }
    return withClient({
      workspaceId: context.workspaceId, connectionId, context,
      operation: async ({ client, connection, endpoint }) => {
        const result = await client.callTool({ name: toolName, arguments: argumentsValue || {} });
        const isError = result?.isError === true;
        await logIntegrationAction({
          workspaceId: context.workspaceId, taskId: context.taskId, employeeId: context.employeeId,
          connectionId: connection.id, provider: connection.provider, action: 'mcp.tool.call',
          status: isError ? 'failed' : 'succeeded',
          requestMeta: { endpoint: endpoint.origin + endpoint.pathname, toolName },
          responseMeta: { isError, contentItems: Array.isArray(result?.content) ? result.content.length : 0 },
        });
        return {
          type: 'mcp_tool_result', connectionId: connection.id, toolName, isError,
          content: result?.content || [], structuredContent: result?.structuredContent,
        };
      },
    });
  },
});
