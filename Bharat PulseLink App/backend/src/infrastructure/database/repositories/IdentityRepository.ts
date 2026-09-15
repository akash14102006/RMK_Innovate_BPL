/**
 * Identity Repository
 *
 * Implements persistent mapping between external authentication providers
 * (Descope, Google, WhatsApp) and canonical Bharat PulseLink users.
 *
 * Owned by: Identity & Security Infrastructure (Prompt 89)
 */

import type { Knex } from 'knex';
import { uuidv7 } from 'uuidv7';
import type { UserAuthIdentityRow, AuthProvider } from '../../../core/types/database.types.js';

export interface CreateIdentityData {
  id?: string;
  user_id: string;
  provider: AuthProvider;
  provider_subject: string;
  email?: string | null;
  email_verified_at?: Date | null;
  phone?: string | null;
  phone_verified_at?: Date | null;
  provider_created_at?: Date | null;
  last_authenticated_at?: Date | null;
}

export class IdentityRepository {
  constructor(private readonly _knex: Knex) {}

  async findById(id: string, trx?: Knex.Transaction): Promise<UserAuthIdentityRow | null> {
    const q = (trx ?? this._knex)<UserAuthIdentityRow>('user_auth_identities').where({ id }).first();
    return (await q) ?? null;
  }

  async findByProviderSubject(
    provider: AuthProvider,
    providerSubject: string,
    trx?: Knex.Transaction,
  ): Promise<UserAuthIdentityRow | null> {
    const q = (trx ?? this._knex)<UserAuthIdentityRow>('user_auth_identities')
      .where({
        provider,
        provider_subject: providerSubject,
      })
      .first();
    return (await q) ?? null;
  }

  async findByUserId(userId: string, trx?: Knex.Transaction): Promise<UserAuthIdentityRow[]> {
    const q = (trx ?? this._knex)<UserAuthIdentityRow>('user_auth_identities')
      .where({ user_id: userId })
      .orderBy('created_at', 'asc');
    return (await q) ?? [];
  }

  async createIdentity(data: CreateIdentityData, trx?: Knex.Transaction): Promise<UserAuthIdentityRow> {
    const payload: Partial<UserAuthIdentityRow> = {
      id: data.id ?? uuidv7(),
      user_id: data.user_id,
      provider: data.provider,
      provider_subject: data.provider_subject,
      email: data.email ?? null,
      email_verified_at: data.email_verified_at ?? null,
      phone: data.phone ?? null,
      phone_verified_at: data.phone_verified_at ?? null,
      provider_created_at: data.provider_created_at ?? null,
      last_authenticated_at: data.last_authenticated_at ?? new Date(),
    };

    const [identity] = await (trx ?? this._knex)<UserAuthIdentityRow>('user_auth_identities')
      .insert(payload)
      .returning('*');
    return identity!;
  }

  async updateLastAuthenticated(id: string, trx?: Knex.Transaction): Promise<void> {
    await (trx ?? this._knex)('user_auth_identities')
      .where({ id })
      .update({
        last_authenticated_at: new Date(),
        updated_at: new Date(),
      });
  }
}
