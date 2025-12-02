// src/services/socket.ts
// Socket service - handles real-time communication with backend using Socket.IO

import { io, Socket } from 'socket.io-client';

type EventCallback = (data: any) => void;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class RealtimeSocket {
  private socket: Socket;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private gameId: string | null = null;
  private playerId: string | null = null;

  constructor() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to', SOCKET_URL, 'id=', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }

  private ensureConnected() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  connect() {
    this.ensureConnected();
  }

  disconnect() {
    console.log('[Socket] Manual disconnect');
    this.socket.disconnect();
    this.listeners.clear();
    this.gameId = null;
    this.playerId = null;
  }

  // Join a game room and remember ids
  joinGame(gameId: string, playerId: string) {
    this.ensureConnected();
    this.gameId = gameId;
    this.playerId = playerId;
    console.log('[Socket] join-game', { gameId, playerId });
    this.socket.emit('join-game', { gameId, playerId });
  }

  // Leave game room; if args not passed, use stored ones
  leaveGame(gameId?: string, playerId?: string) {
    const gid = gameId ?? this.gameId;
    const pid = playerId ?? this.playerId;

    if (gid && pid) {
      console.log('[Socket] leave-game', { gameId: gid, playerId: pid });
      this.ensureConnected();
      this.socket.emit('leave-game', { gameId: gid, playerId: pid });
    }

    this.gameId = null;
    this.playerId = null;
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
      // Bind once per event to underlying socket
      this.socket.on(event, (data: any) => {
        this.listeners.get(event)?.forEach((cb) => cb(data));
      });
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback?: EventCallback) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
    } else {
      this.listeners.delete(event);
    }
  }

  emit(event: string, data?: any) {
    console.log('[Socket] emit', event, data);
    this.ensureConnected();
    this.socket.emit(event, data);
  }

  // For testing if you ever need it
  simulateEvent(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

// Singleton instance
export const socket = new RealtimeSocket();

/**
 * Named helper functions so imports like
 *   import { joinGame as joinSocketGame } from '@/services/socket'
 * work correctly.
 */

export const joinGame = (gameId: string, playerId: string) => {
  socket.joinGame(gameId, playerId);
};

export const leaveGame = (gameId: string, playerId: string) => {
  socket.leaveGame(gameId, playerId);
};

// Host-related events
export const emitGameStart = (gameId: string) => {
  socket.emit('game-start', { gameId });
};

export const emitQuestionStart = (gameId: string, questionIndex: number) => {
  socket.emit('question-start', { gameId, questionIndex });
};

export const emitQuestionEnd = (gameId: string) => {
  socket.emit('question-end', { gameId });
};

export const emitShowLeaderboard = (gameId: string) => {
  socket.emit('show-leaderboard', { gameId });
};

export const emitNextQuestion = (gameId: string) => {
  socket.emit('next-question', { gameId });
};

export const emitGameEnd = (gameId: string) => {
  socket.emit('game-end', { gameId });
};

export const emitAnswerSubmitted = (gameId: string, playerId: string) => {
  socket.emit('answer-submitted', { gameId, playerId });
};
