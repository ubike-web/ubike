import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class ChatService {
  constructor(private supabase: SupabaseService) {}

  async getOrCreateChatRoom(rideId: string, errandId?: string) {
    const query = rideId
      ? this.supabase.from('chat_rooms').select('*').eq('ride_id', rideId)
      : this.supabase.from('chat_rooms').select('*').eq('errand_id', errandId!);

    const { data: existing } = await query.single();
    if (existing) return existing;

    const { data, error } = await this.supabase
      .from('chat_rooms')
      .insert({ ride_id: rideId || null, errand_id: errandId || null })
      .select()
      .single();

    if (error) throw new BadRequestException('Could not create chat room');
    return data;
  }

  async getChatMessages(roomId: string, userId: string, limit = 50, before?: string) {
    await this.assertRoomAccess(roomId, userId);

    let query = this.supabase
      .from('chat_messages')
      .select('id, sender_id, content, message_type, media_url, created_at, is_read')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) query = query.lt('created_at', before);

    const { data } = await query;
    return (data ?? []).reverse();
  }

  async saveMessage(roomId: string, senderId: string, content: string, messageType = 'text', mediaUrl?: string) {
    await this.assertRoomAccess(roomId, senderId);

    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        content,
        message_type: messageType,
        media_url: mediaUrl || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async markAsRead(roomId: string, userId: string) {
    await this.supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    return { updated: true };
  }

  async uploadChatMedia(roomId: string, userId: string, file: Express.Multer.File) {
    await this.assertRoomAccess(roomId, userId);

    const ext = file.originalname.split('.').pop();
    const path = `chat-media/${roomId}/${Date.now()}.${ext}`;

    const { error } = await this.supabase
      .storage('ubike-assets')
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) throw new BadRequestException('Media upload failed');

    const { data } = this.supabase.storage('ubike-assets').getPublicUrl(path);
    return { mediaUrl: data.publicUrl };
  }

  private async assertRoomAccess(roomId: string, userId: string) {
    const { data: room } = await this.supabase
      .from('chat_rooms')
      .select(`
        id,
        rides(customer_id, riders(user_id)),
        errands(customer_id, riders(user_id))
      `)
      .eq('id', roomId)
      .single();

    if (!room) throw new NotFoundException('Chat room not found');

    const participants = new Set<string>();
    if (room.rides) {
      const ride = room.rides as any;
      participants.add(ride.customer_id);
      if (ride.riders?.user_id) participants.add(ride.riders.user_id);
    }
    if (room.errands) {
      const errand = room.errands as any;
      participants.add(errand.customer_id);
      if (errand.riders?.user_id) participants.add(errand.riders.user_id);
    }

    if (!participants.has(userId)) throw new ForbiddenException('Not a participant of this chat');
  }
}
