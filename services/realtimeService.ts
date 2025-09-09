import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';
import { Message } from './conversationService';

export interface RealtimeEvent {
  type: 'new_message' | 'message_read' | 'user_typing' | 'user_online' | 'user_offline' | 'connection';
  data: any;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, ((event: RealtimeEvent) => void)[]> = new Map();
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) {
        throw new Error('No auth token available');
      }

      const wsUrl = config.apiUrl.replace(/^http/, 'ws') + `/ws?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connection', { type: 'connection', data: { status: 'connected' } });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed', event);
        this.isConnecting = false;
        this.emit('connection', { type: 'connection', data: { status: 'disconnected' } });
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.listeners.clear();
  }

  private emit(type: string, event: RealtimeEvent): void {
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  on(eventType: string, listener: (event: RealtimeEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Convenience methods for specific events
  onNewMessage(listener: (message: Message) => void): () => void {
    return this.on('new_message', (event) => listener(event.data));
  }

  onUserTyping(listener: (data: { conversationId: string; userId: string; isTyping: boolean }) => void): () => void {
    return this.on('user_typing', (event) => listener(event.data));
  }

  onMessageRead(listener: (data: { conversationId: string; messageId: string; userId: string }) => void): () => void {
    return this.on('message_read', (event) => listener(event.data));
  }

  onConnectionChange(listener: (data: { status: 'connected' | 'disconnected' }) => void): () => void {
    return this.on('connection', (event) => listener(event.data));
  }

  // Send methods
  private send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  joinConversation(conversationId: string): void {
    this.send({
      type: 'join_conversation',
      data: { conversationId }
    });
  }

  leaveConversation(conversationId: string): void {
    this.send({
      type: 'leave_conversation', 
      data: { conversationId }
    });
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    this.send({
      type: 'typing',
      data: { conversationId, isTyping }
    });
  }

  markMessageAsRead(conversationId: string, messageId: string): void {
    this.send({
      type: 'mark_read',
      data: { conversationId, messageId }
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default new RealtimeService();