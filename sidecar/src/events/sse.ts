import type { FastifyReply } from 'fastify';
import type { SSEEvent } from '../types/index.js';

const clients = new Set<FastifyReply>();

export function addSSEClient(reply: FastifyReply): void {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  reply.raw.write(':ok\n\n');
  clients.add(reply);

  reply.raw.on('close', () => {
    clients.delete(reply);
  });
}

export function emitSSE(event: SSEEvent): void {
  const data = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;

  for (const client of clients) {
    try {
      client.raw.write(data);
    } catch {
      clients.delete(client);
    }
  }
}

export function getSSEClientCount(): number {
  return clients.size;
}
