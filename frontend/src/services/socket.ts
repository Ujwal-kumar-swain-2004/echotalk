import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8081';

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    if (this.socket) {
      if (this.socket.connected) return this.socket;
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('SocketConnected: Session', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketDisconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket Connection Error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected. Cannot emit: ${event}`);
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export const socketService = new SocketService();
