/**
 * Identity Resolver Application Service
 *
 * Implements authoritative resolution and atomic provisioning of canonical
 * Bharat PulseLink users from verified external authentication contexts.
 *
 * Key Architecture:
 * - Accepts verified external authentication subject (Descope / Google / WhatsApp)
 * - Guarantees 1 Canonical user_id per authentic human identity
 * - Atomic transactional provisioning (users + user_auth_identities)
 * - Concurrency & race-condition safe (handles unique constraint conflicts)
 * - Emits sanitized observability telemetry
 *
 * Owned by: Identity Domain (Prompt 89)
 */

import type { DatabaseClient } from '../../infrastructure/database/database.js';
import type { UserRepository } from '../../infrastructure/database/repositories/UserRepository.js';
import type { IdentityRepository } from '../../infrastructure/database/repositories/IdentityRepository.js';
import type { Logger } from '../../infrastructure/logger/logger.js';
import type { AuthProvider, UserAuthIdentityRow, UserStatus } from '../../core/types/database.types.js';
import { AppError, ErrorCode } from '../../core/errors/AppError.js';

export interface ResolveUserParams {
  provider: AuthProvider;
  providerSubject: string;
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  providerCreatedAt?: Date | null;
  correlationId?: string;
}

export interface ResolvedUserContext {
  user: {
    id: string;
    status: UserStatus;
  };
  identity: UserAuthIdentityRow;
  isNewUser: boolean;
}

export class IdentityResolver {
  private readonly _logger: Logger;

  constructor(
    private readonly _db: DatabaseClient,
    private readonly _userRepo: UserRepository,
    private readonly _identityRepo: IdentityRepository,
    logger: Logger,
  ) {
    this._logger = logger.child({ module: 'identity-resolver' });
  }

  /**
   * Resolves an existing canonical user or atomically provisions a new user
   * within a strict database transaction.
   */
  async resolveOrCreateUser(params: ResolveUserParams): Promise<ResolvedUserContext> {
    if (!params.provider || !params.providerSubject) {
      throw new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Provider and providerSubject are required for identity resolution',
      });
    }

    try {
      return await this._db.transaction(async (trx) => {
        // 1. Look up existing external identity
        const existingIdentity = await this._identityRepo.findByProviderSubject(
          params.provider,
          params.providerSubject,
          trx,
        );

        if (existingIdentity) {
          // Load canonical user
          const user = await this._userRepo.findById(existingIdentity.user_id, trx);
          if (!user) {
            throw new AppError({
              code: ErrorCode.INTERNAL_ERROR,
              message: 'Database inconsistency: identity exists without a parent user row',
            });
          }

          // Update authentication timestamps
          await this._identityRepo.updateLastAuthenticated(existingIdentity.id, trx);
          await this._userRepo.updateLastAuthenticated(user.id, trx);

          this._logger.info('identity_resolution_existing_user', {
            userId: user.id,
            provider: params.provider,
            correlationId: params.correlationId,
          });

          return {
            user: {
              id: user.id,
              status: user.status,
            },
            identity: existingIdentity,
            isNewUser: false,
          };
        }

        // 2. Provision new canonical user & identity atomically
        let newUser: { id: string; status: UserStatus } | null = null;
        try {
          newUser = await this._userRepo.createUser({ status: 'ACTIVE' }, trx);

          const newIdentity = await this._identityRepo.createIdentity(
            {
              user_id: newUser.id,
              provider: params.provider,
              provider_subject: params.providerSubject,
              email: params.email ?? null,
              email_verified_at: params.emailVerified ? new Date() : null,
              phone: params.phone ?? null,
              phone_verified_at: params.phoneVerified ? new Date() : null,
              provider_created_at: params.providerCreatedAt ?? null,
              last_authenticated_at: new Date(),
            },
            trx,
          );

          this._logger.info('identity_resolution_new_user', {
            userId: newUser.id,
            provider: params.provider,
            correlationId: params.correlationId,
          });

          return {
            user: {
              id: newUser.id,
              status: newUser.status,
            },
            identity: newIdentity,
            isNewUser: true,
          };
        } catch (insertErr) {
          if (newUser) {
            await this._userRepo.deleteUser(newUser.id, trx).catch(() => {});
          }
          throw insertErr;
        }
      });
    } catch (err: unknown) {
      // 3. Handle concurrent first-login unique race condition (PostgreSQL code 23505)
      const error = err as { code?: string; message?: string };
      if (error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('UNIQUE')) {
        this._logger.warn('identity_resolution_conflict_detected', {
          provider: params.provider,
          correlationId: params.correlationId,
        });

        // Re-read existing identity outside the aborted transaction
        const existingIdentity = await this._identityRepo.findByProviderSubject(
          params.provider,
          params.providerSubject,
        );

        if (existingIdentity) {
          const user = await this._userRepo.findById(existingIdentity.user_id);
          if (user) {
            await this._identityRepo.updateLastAuthenticated(existingIdentity.id);
            await this._userRepo.updateLastAuthenticated(user.id);

            return {
              user: {
                id: user.id,
                status: user.status,
              },
              identity: existingIdentity,
              isNewUser: false,
            };
          }
        }
      }

      if (err instanceof AppError) throw err;
      throw new AppError({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Identity resolution failed',
      });
    }
  }

  /**
   * Links a secondary verified provider identity to an existing canonical user.
   */
  async linkIdentityToUser(userId: string, params: ResolveUserParams): Promise<UserAuthIdentityRow> {
    return this._db.transaction(async (trx) => {
      const user = await this._userRepo.findById(userId, trx);
      if (!user) {
        throw new AppError({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'Target user not found for identity linkage',
        });
      }

      const existingIdentity = await this._identityRepo.findByProviderSubject(
        params.provider,
        params.providerSubject,
        trx,
      );

      if (existingIdentity) {
        if (existingIdentity.user_id !== userId) {
          throw new AppError({
            code: ErrorCode.CONFLICT,
            message: 'External identity is already associated with another account',
          });
        }
        return existingIdentity;
      }

      const linkedIdentity = await this._identityRepo.createIdentity(
        {
          user_id: userId,
          provider: params.provider,
          provider_subject: params.providerSubject,
          email: params.email ?? null,
          email_verified_at: params.emailVerified ? new Date() : null,
          phone: params.phone ?? null,
          phone_verified_at: params.phoneVerified ? new Date() : null,
          provider_created_at: params.providerCreatedAt ?? null,
          last_authenticated_at: new Date(),
        },
        trx,
      );

      this._logger.info('identity_linked_success', {
        userId,
        provider: params.provider,
        correlationId: params.correlationId,
      });

      return linkedIdentity;
    });
  }
}
