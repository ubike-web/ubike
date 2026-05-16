import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
    });

    this.logger.log('Supabase client initialized');
  }

  get client(): SupabaseClient {
    return this._client;
  }

  // Convenience — return typed query builder for a table
  from(table: string) {
    return this._client.from(table);
  }

  // Storage bucket helper
  storage(bucket: string) {
    return this._client.storage.from(bucket);
  }

  // Auth admin helpers
  get auth() {
    return this._client.auth.admin;
  }

  // Run raw SQL (useful for complex queries)
  async rpc(fn: string, params?: Record<string, any>) {
    return this._client.rpc(fn, params);
  }
}
