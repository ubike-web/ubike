import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

interface AuthSocket extends Socket {
  userId: string;
  userRole: string;
  riderId?: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  // userId → socket.id mappings for targeted events
  private userSockets = new Map<string, string>();

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Socket.IO gateway initialized');

    // Middleware — authenticate every connection
    server.use(async (socket: any, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) return next(new WsException('No token provided'));

        const payload = this.jwt.verify(token, {
          secret: this.config.getOrThrow('JWT_SECRET'),
        });

        socket.userId = payload.sub;
        socket.userRole = payload.role;

        // Attach rider ID if rider
        if (['transport_rider', 'errands_rider'].includes(payload.role)) {
          const { data } = await this.supabase
            .from('riders')
            .select('id')
            .eq('user_id', payload.sub)
            .single();
          socket.riderId = data?.id;
        }

        next();
      } catch {
        next(new WsException('Authentication failed'));
      }
    });
  }

  handleConnection(client: AuthSocket) {
    this.userSockets.set(client.userId, client.id);
    client.join(`user:${client.userId}`);

    // Riders join their service room for broadcast matching
    if (client.riderId) {
      client.join(`riders:${client.userRole}`);
      client.join(`rider:${client.riderId}`);
    }

    this.logger.debug(`Connected: ${client.userId} (${client.userRole})`);
  }

  handleDisconnect(client: AuthSocket) {
    this.userSockets.delete(client.userId);
    this.logger.debug(`Disconnected: ${client.userId}`);
  }

  // ─────────────────────────────────────────
  // RIDER LOCATION — rider pushes GPS every ~5s
  // ─────────────────────────────────────────
  @SubscribeMessage('rider:location')
  async handleRiderLocation(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { lat: number; lng: number; heading?: number },
  ) {
    if (!client.riderId) throw new WsException('Not a rider');

    // Persist location to DB
    await this.supabase
      .from('riders')
      .update({
        current_lat: data.lat,
        current_lng: data.lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', client.riderId);

    // Broadcast to any active trips watching this rider
    this.server.to(`rider-tracking:${client.riderId}`).emit('rider:location:update', {
      riderId: client.riderId,
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
      timestamp: new Date().toISOString(),
    });
  }

  // ─────────────────────────────────────────
  // CUSTOMER — subscribe to track their rider
  // ─────────────────────────────────────────
  @SubscribeMessage('track:rider')
  handleTrackRider(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { riderId: string },
  ) {
    client.join(`rider-tracking:${data.riderId}`);
    return { event: 'tracking:started', data: { riderId: data.riderId } };
  }

  @SubscribeMessage('untrack:rider')
  handleUntrackRider(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { riderId: string },
  ) {
    client.leave(`rider-tracking:${data.riderId}`);
    return { event: 'tracking:stopped' };
  }

  // ─────────────────────────────────────────
  // RIDER — toggle online status via socket
  // ─────────────────────────────────────────
  @SubscribeMessage('rider:toggle-online')
  async handleToggleOnline(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { isOnline: boolean },
  ) {
    if (!client.riderId) throw new WsException('Not a rider');

    await this.supabase
      .from('riders')
      .update({ is_online: data.isOnline, last_seen: new Date().toISOString() })
      .eq('id', client.riderId);

    return { event: 'rider:online-status', data: { isOnline: data.isOnline } };
  }

  // ─────────────────────────────────────────
  // Server-side emitters used by other services
  // ─────────────────────────────────────────

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRider(riderId: string, event: string, data: any) {
    this.server.to(`rider:${riderId}`).emit(event, data);
  }

  broadcastToTransportRiders(event: string, data: any) {
    this.server.to('riders:transport_rider').emit(event, data);
  }

  broadcastToErrandsRiders(event: string, data: any) {
    this.server.to('riders:errands_rider').emit(event, data);
  }

  emitRideRequest(riderIds: string[], rideData: any) {
    riderIds.forEach((riderId) => {
      this.server.to(`rider:${riderId}`).emit('ride:new-request', rideData);
    });
  }

  emitErrandRequest(riderIds: string[], errandData: any) {
    riderIds.forEach((riderId) => {
      this.server.to(`rider:${riderId}`).emit('errand:new-request', errandData);
    });
  }
}
