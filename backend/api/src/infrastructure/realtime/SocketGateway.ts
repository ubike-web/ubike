import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { JwtPayload } from '../../shared/types';

export class SocketGateway {
  private io!: Server;
  private userSockets = new Map<string, string[]>(); // userId -> socketIds

  init(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: [env.FRONTEND_URL, 'http://localhost:3000'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use(this.authMiddleware.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    return this.io;
  }

  private authMiddleware(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  }

  private handleConnection(socket: Socket) {
    const user = (socket as any).user as JwtPayload;
    const userId = user.sub;

    // Track socket
    const existing = this.userSockets.get(userId) || [];
    this.userSockets.set(userId, [...existing, socket.id]);
    socket.join(`user:${userId}`);
    socket.join(`role:${user.role}`);

    socket.on('rider:location', (data: { lat: number; lng: number }) => {
      if (user.role === 'passenger_rider' || user.role === 'errands_rider') {
        socket.broadcast.emit(`rider:location:${userId}`, { riderId: userId, ...data });
      }
    });

    socket.on('sos:trigger', (data: { lat: number; lng: number; message?: string }) => {
      this.io.to('role:admin').to('role:super_admin').emit('sos:alert', {
        userId,
        role: user.role,
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      const sockets = this.userSockets.get(userId)?.filter(id => id !== socket.id) || [];
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, sockets);
      }
    });
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(role: string, event: string, data: unknown) {
    this.io?.to(`role:${role}`).emit(event, data);
  }

  emitToAll(event: string, data: unknown) {
    this.io?.emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.length ?? 0) > 0;
  }
}

export const socketGateway = new SocketGateway();
