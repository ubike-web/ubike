import crypto from 'crypto';
import { env } from '../../config/env';

export class ZegoService {
  generateToken(userId: string, roomId: string, effectiveTimeInSeconds = 3600): string {
    if (!env.ZEGO_APP_ID || !env.ZEGO_SERVER_SECRET) {
      throw new Error('ZEGOCLOUD credentials not configured');
    }

    const appId = parseInt(env.ZEGO_APP_ID, 10);
    const expire = Math.floor(Date.now() / 1000) + effectiveTimeInSeconds;
    const nonce = Math.floor(Math.random() * 2147483647);

    const payload = JSON.stringify({
      app_id: appId,
      user_id: userId,
      room_id: roomId,
      privilege: { 1: 1, 2: 1 },
      stream_id_list: null,
    });

    const hash = crypto
      .createHmac('sha256', env.ZEGO_SERVER_SECRET)
      .update(`${appId}${userId}${nonce}${expire}${payload}`)
      .digest('hex');

    const tokenData = {
      app_id: appId,
      user_id: userId,
      nonce,
      ctime: Math.floor(Date.now() / 1000),
      expire,
      payload,
      hash,
    };

    const tokenStr = JSON.stringify(tokenData);
    return Buffer.from(tokenStr).toString('base64');
  }

  generateRoomId(rideId: string): string {
    return `ubike_${rideId}`;
  }
}

export const zegoService = new ZegoService();
