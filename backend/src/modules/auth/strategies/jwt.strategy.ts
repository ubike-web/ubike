import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../../database/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private supabase: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const { data: user } = await this.supabase
      .from('users')
      .select('id, role, is_active, full_name, phone')
      .eq('id', payload.sub)
      .single();

    if (!user || !user.is_active) throw new UnauthorizedException('User not found or inactive');

    return { id: user.id, role: user.role, name: user.full_name, phone: user.phone };
  }
}
