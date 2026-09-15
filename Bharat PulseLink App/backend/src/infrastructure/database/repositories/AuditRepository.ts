/**
 * Audit & Security Repository
 *
 * Implements immutable, tamper-evident audit logging for ABDM PHI access
 * and security anomaly events.
 *
 * Owned by: Audit & Security Infrastructure (Prompt 92, 117, 101)
 */

import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import type { AuditEventRow, SecurityEventRow } from '../../../core/types/database.types.js';

export class AuditRepository {
  constructor(private readonly _knex: Knex) {}

  async logAuditEvent(
    data: Omit<AuditEventRow, 'id' | 'timestamp'>,
    trx?: Knex.Transaction,
  ): Promise<AuditEventRow> {
    const [event] = await (trx ?? this._knex)<AuditEventRow>('audit_events')
      .insert({
        id: randomUUID(),
        actor_id: data.actor_id,
        actor_type: data.actor_type,
        action: data.action,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        facility_id: data.facility_id ?? null,
        consent_id: data.consent_id ?? null,
        ip_address: data.ip_address,
        request_id: data.request_id,
        metadata: data.metadata ? (JSON.stringify(data.metadata) as unknown as Record<string, unknown>) : null,
      })
      .returning('*');
    return event!;
  }

  async logSecurityEvent(
    data: Omit<SecurityEventRow, 'id' | 'timestamp'>,
    trx?: Knex.Transaction,
  ): Promise<SecurityEventRow> {
    const [event] = await (trx ?? this._knex)<SecurityEventRow>('security_events')
      .insert({
        id: randomUUID(),
        user_id: data.user_id ?? null,
        device_id: data.device_id ?? null,
        event_type: data.event_type,
        severity: data.severity,
        ip_address: data.ip_address,
        request_id: data.request_id,
        details: data.details ? (JSON.stringify(data.details) as unknown as Record<string, unknown>) : null,
      })
      .returning('*');
    return event!;
  }

  async getResourceAuditTrail(
    resourceType: string,
    resourceId: string,
    limit = 50,
    trx?: Knex.Transaction,
  ): Promise<AuditEventRow[]> {
    return (trx ?? this._knex)<AuditEventRow>('audit_events')
      .where({ resource_type: resourceType, resource_id: resourceId })
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }

  async getActorAuditTrail(
    actorId: string,
    limit = 50,
    trx?: Knex.Transaction,
  ): Promise<AuditEventRow[]> {
    return (trx ?? this._knex)<AuditEventRow>('audit_events')
      .where({ actor_id: actorId })
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }

  async getUserSecurityEvents(
    userId: string,
    limit = 50,
    trx?: Knex.Transaction,
  ): Promise<SecurityEventRow[]> {
    return (trx ?? this._knex)<SecurityEventRow>('security_events')
      .where({ user_id: userId })
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }
}
