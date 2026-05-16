import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../database/supabase.service';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CallsService {
  private readonly appId: string;
  private readonly appCertificate: string;

  constructor(private config: ConfigService, private supabase: SupabaseService) {
    this.appId = config.getOrThrow('AGORA_APP_ID');
    this.appCertificate = config.getOrThrow('AGORA_APP_CERTIFICATE');
  }

  async initiateCall(callerId: string, targetUserId: string, rideId?: string, errandId?: string) {
    // Verify caller and target are part of the same ride/errand
    if (rideId) {
      const { data: ride } = await this.supabase
        .from('rides')
        .select('customer_id, riders!inner(user_id)')
        .eq('id', rideId)
        .single();

      if (!ride) throw new BadRequestException('Ride not found');
      const participants = [ride.customer_id, (ride.riders as any)?.user_id];
      if (!participants.includes(callerId) || !participants.includes(targetUserId)) {
        throw new ForbiddenException('Not a participant of this ride');
      }
    }

    const channelName = `ubike-call-${uuidv4()}`;
    const expiryTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    const callerToken = this.generateToken(channelName, callerId, expiryTime);
    const receiverToken = this.generateToken(channelName, targetUserId, expiryTime);

    // Save call session
    const { data: session } = await this.supabase
      .from('call_sessions')
      .insert({
        channel_name: channelName,
        caller_id: callerId,
        receiver_id: targetUserId,
        ride_id: rideId || null,
        errand_id: errandId || null,
        status: 'initiated',
        expires_at: new Date(expiryTime * 1000).toISOString(),
      })
      .select()
      .single();

    return {
      sessionId: session.id,
      channelName,
      appId: this.appId,
      callerToken,
      receiverToken,
    };
  }

  async getCallToken(sessionId: string, userId: string) {
    const { data: session } = await this.supabase
      .from('call_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) throw new BadRequestException('Call session not found');
    if (![session.caller_id, session.receiver_id].includes(userId)) {
      throw new ForbiddenException('Not a participant of this call');
    }
    if (new Date(session.expires_at) < new Date()) {
      throw new BadRequestException('Call session expired');
    }

    const expiryTime = Math.floor(new Date(session.expires_at).getTime() / 1000);
    const token = this.generateToken(session.channel_name, userId, expiryTime);

    return { channelName: session.channel_name, appId: this.appId, token };
  }

  async endCall(sessionId: string, userId: string, durationSeconds: number) {
    const { data: session } = await this.supabase
      .from('call_sessions')
      .select('caller_id, receiver_id')
      .eq('id', sessionId)
      .single();

    if (!session || ![session.caller_id, session.receiver_id].includes(userId)) {
      throw new ForbiddenException('Not your call session');
    }

    await this.supabase
      .from('call_sessions')
      .update({ status: 'ended', duration_seconds: durationSeconds, ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    return { message: 'Call ended' };
  }

  private generateToken(channelName: string, uid: string, expiryTime: number): string {
    const uidNum = this.stringUidToInt(uid);
    return RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uidNum,
      RtcRole.PUBLISHER,
      expiryTime,
    );
  }

  private stringUidToInt(uid: string): number {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = (hash << 5) - hash + uid.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
