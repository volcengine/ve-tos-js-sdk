import http from 'http';
import https from 'https';
import { Socket } from 'net';

// add missing type
declare module 'http' {
  interface AgentOptions {
    // reference:
    // https://stackoverflow.com/questions/51363855/how-to-configure-axios-to-use-ssl-certificate
    rejectUnauthorized?: boolean;
  }

  interface Agent {
    createConnection(...opts: unknown[]): Socket;
  }
}

interface TosAgentOptions extends http.AgentOptions {
  tosOpts: {
    enableVerifySSL: boolean;
    connectionTimeout: number;
    maxConnections: number;
    idleConnectionTime: number;
    isHttps: boolean;
  };
}

// not use class grammar, because Agent is dynamic
export function TosAgent(opts: TosAgentOptions) {
  const { tosOpts, ...agentOpts } = opts;
  const Agent = tosOpts.isHttps ? https.Agent : http.Agent;
  const agent = new Agent({
    ...agentOpts,
    keepAlive: true,
    rejectUnauthorized: tosOpts.enableVerifySSL,
    timeout: tosOpts.idleConnectionTime,
  });

  agent.maxFreeSockets = Infinity;
  agent.maxTotalSockets = tosOpts.maxConnections;

  const oriCreateConnection = agent.createConnection;
  agent.createConnection = function (...args) {
    const socket = oriCreateConnection.call(this, ...args);
    let isTimeout = false;
    let isConnected = false;
    let connectTimer: NodeJS.Timeout | null = null;

    // Place `setTimeout` in `process.nextTick` to avoid to
    // trigger "Connect timeout" when debug
    process.nextTick(() => {
      if (isConnected) {
        return;
      }

      connectTimer = setTimeout(() => {
        isTimeout = true;
      }, tosOpts.connectionTimeout);
    });

    socket.on('connect', () => {
      isConnected = true;
      if (connectTimer) {
        clearTimeout(connectTimer);
      }

      if (isTimeout) {
        socket.destroy(new Error('Connect timeout'));
      }
    });

    return socket;
  };

  return agent;
}
