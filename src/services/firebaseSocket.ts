import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

type EventCallback = (data: any) => void;

class FirebaseRealtime {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private unsubscribe: (() => void) | null = null;
  private gameId: string | null = null;
  private lastStatus: string | null = null;
  private lastQuestionIndex: number | null = null;
  private lastPlayersCount: number = 0;

  connect() {
    console.log('[FirebaseRealtime] Virtual connection established');
  }

  disconnect() {
    this.stopListening();
    this.listeners.clear();
  }

  joinGame(gameId: string, _playerId: string) {
    this.gameId = gameId;
    this.startListening(gameId);
  }

  leaveGame(_gameId?: string, _playerId?: string) {
    this.stopListening();
    this.gameId = null;
  }

  private startListening(gameId: string) {
    this.stopListening();
    
    this.unsubscribe = onSnapshot(doc(db, "games", gameId), (docSnap) => {
      if (!docSnap.exists()) return;
      
      const game = docSnap.data();
      
      // Emit 'player-joined' or 'player-left' based on players array length
      const currentPlayersCount = game.players?.length || 0;
      if (currentPlayersCount > this.lastPlayersCount) {
        this.triggerLocalEvent('player-joined', { count: currentPlayersCount });
      } else if (currentPlayersCount < this.lastPlayersCount) {
        this.triggerLocalEvent('player-left', { count: currentPlayersCount });
      }
      this.lastPlayersCount = currentPlayersCount;

      // Emit status based events
      if (game.status !== this.lastStatus) {
        switch (game.status) {
          case 'countdown':
            if (this.lastStatus === 'lobby' || this.lastStatus === 'leaderboard') {
              this.triggerLocalEvent('game-started', {});
            }
            break;
          case 'question':
            this.triggerLocalEvent('question-started', { questionIndex: game.currentQuestionIndex });
            break;
          case 'leaderboard':
            this.triggerLocalEvent('question-ended', {});
            this.triggerLocalEvent('leaderboard-shown', {});
            break;
          case 'finished':
            this.triggerLocalEvent('game-ended', {});
            break;
        }
        this.lastStatus = game.status;
      }

      // Detect next question start specifically if status didn't change but index did
      if (game.currentQuestionIndex !== this.lastQuestionIndex) {
        if (this.lastQuestionIndex !== null) {
          this.triggerLocalEvent('next-question-started', { questionIndex: game.currentQuestionIndex });
        }
        this.lastQuestionIndex = game.currentQuestionIndex;
      }
    });
  }

  private stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
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

  private triggerLocalEvent(event: string, data: any) {
    console.log(`[FirebaseRealtime] Local event: ${event}`, data);
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  // Matches RealtimeSocket interface
  emit(event: string, data?: any) {
    console.log(`[FirebaseRealtime] (No-op) Socket emit: ${event}`, data);
  }
}

export const socket = new FirebaseRealtime();

// Named helper functions to match socket.ts interface
export const joinGame = (gameId: string, playerId: string) => socket.joinGame(gameId, playerId);
export const leaveGame = (gameId: string, playerId: string) => socket.leaveGame(gameId, playerId);
export const emitGameStart = (gameId: string) => {};
export const emitQuestionStart = (gameId: string, questionIndex: number) => {};
export const emitQuestionEnd = (gameId: string) => {};
export const emitShowLeaderboard = (gameId: string) => {};
export const emitNextQuestion = (gameId: string) => {};
export const emitGameEnd = (gameId: string) => {};
export const emitAnswerSubmitted = (gameId: string, playerId: string) => {};
