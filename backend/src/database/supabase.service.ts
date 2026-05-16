import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ws from 'ws';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private _client: SupabaseClient;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const key = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this._client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: { schema: 'public' },
      realtime: {
        transport: ws as any,
      },
    });

    this.logger.log('Supabase client initialized');
  }

  get client(): SupabaseClient {
    return this._client;
  }

  from(table: string) {
    return this._client.from(table);
  }

  storage(bucket: string): any {
    return this._client.storage.from(bucket);
  }

  get auth() {
    return this._client.auth.admin;
  }

  async rpc(fn: string, params?: Record<string, any>) {
    return this._client.rpc(fn, params);
  }
}
