/**
 * SignumLBRI WebSocket Configuration - 2025 Ultra Edition
 * Real-time communication for book marketplace
 * Features: Live updates, notifications, chat, analytics
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { performance } from "perf_hooks";

interface UserSocketData {
  userId?: string;
  userType: 'admin' | 'teacher' | 'student' | 'parent' | 'guest';
  schoolId?: string;
  language: string;
  joinedAt: number;
  lastActivity: number;
}

interface BookUpdate {
  bookId: string;
  action: 'created' | 'updated' | 'deleted' | 'sold';
  data: any;
  timestamp: number;
}

interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  userId?: string;
  schoolId?: string;
  timestamp: number;
  persistent: boolean;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, UserSocketData>();
  private roomSubscriptions = new Map<string, Set<string>>();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupRedisAdapter();
    this.setupEventHandlers();
    this.setupPerformanceMonitoring();
  }

  private async setupRedisAdapter() {
    try {
      const pubClient = createClient({
        url: process.env.REDIS_URI || 'redis://redis:6379',
        password: process.env.REDIS_PASSWORD
      });
      
      const subClient = pubClient.duplicate();

      await Promise.all([
        pubClient.connect(),
        subClient.connect()
      ]);

      this.io.adapter(createAdapter(pubClient, subClient));
      console.log('🔄 WebSocket Redis adapter configured successfully');
    } catch (error) {
      console.warn('⚠️  Redis adapter failed, using memory adapter:', error);
    }
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 New connection: ${socket.id}`);
      
      socket.on('user:authenticate', (data: Partial<UserSocketData>) => {
        this.handleUserAuthentication(socket, data);
      });

      socket.on('book:subscribe', (bookId: string) => {
        this.handleBookSubscription(socket, bookId);
      });

      socket.on('school:subscribe', (schoolId: string) => {
        this.handleSchoolSubscription(socket, schoolId);
      });

      socket.on('notification:mark_read', (notificationId: string) => {
        this.handleNotificationRead(socket, notificationId);
      });

      socket.on('chat:join_room', (roomId: string) => {
        this.handleChatRoomJoin(socket, roomId);
      });

      socket.on('chat:send_message', (data: any) => {
        this.handleChatMessage(socket, data);
      });

      socket.on('analytics:track', (event: any) => {
        this.handleAnalyticsEvent(socket, event);
      });

      socket.on('heartbeat', () => {
        this.updateUserActivity(socket.id);
      });

      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      // Send welcome message with features
      socket.emit('welcome', {
        features: [
          'real_time_updates',
          'notifications',
          'chat',
          'analytics',
          'book_tracking'
        ],
        timestamp: Date.now()
      });
    });
  }

  private handleUserAuthentication(socket: Socket, data: Partial<UserSocketData>) {
    const userData: UserSocketData = {
      userId: data.userId,
      userType: data.userType || 'guest',
      schoolId: data.schoolId,
      language: data.language || 'pl',
      joinedAt: Date.now(),
      lastActivity: Date.now()
    };

    this.connectedUsers.set(socket.id, userData);
    
    // Join user-specific room
    if (userData.userId) {
      socket.join(`user:${userData.userId}`);
    }
    
    // Join school room
    if (userData.schoolId) {
      socket.join(`school:${userData.schoolId}`);
    }

    // Join user type room
    socket.join(`type:${userData.userType}`);

    socket.emit('authenticated', {
      success: true,
      userData,
      timestamp: Date.now()
    });

    console.log(`👤 User authenticated: ${userData.userId || 'anonymous'} (${userData.userType})`);
  }

  private handleBookSubscription(socket: Socket, bookId: string) {
    socket.join(`book:${bookId}`);
    
    if (!this.roomSubscriptions.has(`book:${bookId}`)) {
      this.roomSubscriptions.set(`book:${bookId}`, new Set());
    }
    this.roomSubscriptions.get(`book:${bookId}`)!.add(socket.id);

    socket.emit('book:subscribed', { bookId, timestamp: Date.now() });
  }

  private handleSchoolSubscription(socket: Socket, schoolId: string) {
    socket.join(`school:${schoolId}`);
    socket.emit('school:subscribed', { schoolId, timestamp: Date.now() });
  }

  private handleNotificationRead(socket: Socket, notificationId: string) {
    const userData = this.connectedUsers.get(socket.id);
    if (userData?.userId) {
      // Broadcast to all user's sessions
      this.io.to(`user:${userData.userId}`).emit('notification:read', {
        notificationId,
        timestamp: Date.now()
      });
    }
  }

  private handleChatRoomJoin(socket: Socket, roomId: string) {
    socket.join(`chat:${roomId}`);
    socket.emit('chat:room_joined', { roomId, timestamp: Date.now() });
  }

  private handleChatMessage(socket: Socket, data: any) {
    const userData = this.connectedUsers.get(socket.id);
    if (!userData?.userId) return;

    const message = {
      ...data,
      userId: userData.userId,
      userType: userData.userType,
      timestamp: Date.now()
    };

    // Broadcast to room
    this.io.to(`chat:${data.roomId}`).emit('chat:message', message);
  }

  private handleAnalyticsEvent(socket: Socket, event: any) {
    const userData = this.connectedUsers.get(socket.id);
    
    const analyticsData = {
      ...event,
      socketId: socket.id,
      userId: userData?.userId,
      userType: userData?.userType,
      timestamp: Date.now(),
      sessionDuration: userData ? Date.now() - userData.joinedAt : 0
    };

    // Send to analytics service
    this.io.emit('analytics:event', analyticsData);
  }

  private updateUserActivity(socketId: string) {
    const userData = this.connectedUsers.get(socketId);
    if (userData) {
      userData.lastActivity = Date.now();
    }
  }

  private handleDisconnection(socket: Socket) {
    const userData = this.connectedUsers.get(socket.id);
    
    if (userData) {
      const sessionDuration = Date.now() - userData.joinedAt;
      console.log(`👋 User disconnected: ${userData.userId || 'anonymous'} (session: ${Math.round(sessionDuration / 1000)}s)`);
    }

    this.connectedUsers.delete(socket.id);
    
    // Clean up room subscriptions
    for (const [room, sockets] of this.roomSubscriptions.entries()) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.roomSubscriptions.delete(room);
      }
    }
  }

  private setupPerformanceMonitoring() {
    setInterval(() => {
      const stats = {
        connectedUsers: this.connectedUsers.size,
        activeRooms: this.roomSubscriptions.size,
        memoryUsage: process.memoryUsage(),
        timestamp: Date.now()
      };

      this.io.emit('server:stats', stats);
    }, 30000); // Every 30 seconds
  }

  // Public methods for external use
  public broadcastBookUpdate(update: BookUpdate) {
    this.io.to(`book:${update.bookId}`).emit('book:updated', update);
  }

  public sendNotification(notification: NotificationData) {
    if (notification.userId) {
      this.io.to(`user:${notification.userId}`).emit('notification', notification);
    } else if (notification.schoolId) {
      this.io.to(`school:${notification.schoolId}`).emit('notification', notification);
    } else {
      this.io.emit('notification', notification);
    }
  }

  public broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.io.emit('system:message', {
      type,
      message,
      timestamp: Date.now()
    });
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getActiveRoomsCount(): number {
    return this.roomSubscriptions.size;
  }
}

let wsManager: WebSocketManager | null = null;

export function setupWebSockets(io: SocketIOServer): WebSocketManager {
  wsManager = new WebSocketManager(io);
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}
