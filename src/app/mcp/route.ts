import { NextRequest, NextResponse } from 'next/server';
import { verifyMcpToken } from '@/lib/mcp-tokens';
import { callMcpTool, toolsForAgent } from '@/lib/mcp-server';

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message },
  });
}

export async function GET() {
  return NextResponse.json({
    name: 'RelayHorizon',
    version: '1.0.0',
    protocol: 'mcp',
    transport: 'json-rpc-http',
    tools: {
      platform: toolsForAgent(true).map((tool) => tool.name),
      tenant: toolsForAgent(false).map((tool) => tool.name),
    },
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing MCP token' }, { status: 401 });
  }
  const mcp = await verifyMcpToken(authHeader.substring(7));
  if (!mcp) {
    return NextResponse.json({ error: 'Invalid MCP token' }, { status: 401 });
  }

  let body: JsonRpc;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }

  const { id, method, params = {} } = body;
  const tools = toolsForAgent(mcp.isPlatform);

  try {
    if (method === 'initialize') {
      return rpcResult(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'RelayHorizon', version: '1.0.0' },
        capabilities: { tools: {} },
      });
    }

    if (method === 'notifications/initialized' || method === 'initialized') {
      return new NextResponse(null, { status: 204 });
    }

    if (method === 'tools/list') {
      return rpcResult(id, { tools });
    }

    if (method === 'ping') {
      return rpcResult(id, {});
    }

    if (method === 'tools/call') {
      const name = params.name as string;
      const args = (params.arguments as Record<string, unknown>) || {};
      const result = await callMcpTool(mcp, name, args);
      return rpcResult(id, result);
    }

    return rpcError(id, -32601, `Unknown method: ${method}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'MCP error';
    return rpcError(id, -32000, message);
  }
}
