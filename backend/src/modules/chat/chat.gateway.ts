import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayInit, MessageBody, ConnectedSocket, WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

interface AuthSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    server.use((socket: any, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) return next(new WsException('No token'));

        const payload = this.jwt.verify(token, {
          secret: this.config.getOrThrow('JWT_SECRET'),
        });
        socket.userId = payload.sub;
        next();
      } catch {
        next(new WsException('Auth failed'));
      }
    });
  }

  @SubscribeMessage('chat:join')
  handleJoin(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { roomId: string }) {
    client.join(`chat:${data.roomId}`);
    return { event: 'chat:joined', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('chat:leave')
  handleLeave(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { roomId: string }) {
    client.leave(`chat:${data.roomId}`);
    return { event: 'chat:left' };
  }

  @SubscribeMessage('chat:message')
  async handleMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomId: string; content: string; messageType?: string },
  ) {
    const message = await this.chatService.saveMessage(
      data.roomId,
      client.userId,
      data.content,
      data.messageType || 'text',
    );

    // Broadcast to room (including sender for confirmation)
    this.server.to(`chat:${data.roomId}`).emit('chat:new-message', message);
    return message;
  }

  @SubscribeMessage('chat:typing')
  handleTyping(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { roomId: string; isTyping: boolean }) {
    client.to(`chat:${data.roomId}`).emit('chat:typing', {
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('chat:read')
  async handleRead(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { roomId: string }) {
    await this.chatService.markAsRead(data.roomId, client.userId);
    client.to(`chat:${data.roomId}`).emit('chat:messages-read', { readBy: client.userId });
  }
}
