/**
 * Bharat PulseLink — IVR API Validation Schemas
 *
 * Strict Zod validation schemas for incoming telephony and internal events.
 */

import { z } from 'zod';

export const IvrCallStartSchema = z.object({
  callId: z.string().min(1, 'callId is required'),
  channelId: z.string().min(1, 'channelId is required'),
  callerNumber: z.string().optional(),
  correlationId: z.string().optional(),
});

export const IvrDtmfInputSchema = z.object({
  callId: z.string().min(1, 'callId is required'),
  digits: z.string().min(1, 'digits is required').max(10),
  correlationId: z.string().optional(),
});

export const IvrTimeoutSchema = z.object({
  callId: z.string().min(1, 'callId is required'),
  correlationId: z.string().optional(),
});

export const IvrHangupSchema = z.object({
  callId: z.string().min(1, 'callId is required'),
  correlationId: z.string().optional(),
});

export const IvrSessionParamSchema = z.object({
  callId: z.string().min(1, 'callId is required'),
});

export type IvrCallStartInput = z.infer<typeof IvrCallStartSchema>;
export type IvrDtmfInput = z.infer<typeof IvrDtmfInputSchema>;
export type IvrTimeoutInput = z.infer<typeof IvrTimeoutSchema>;
export type IvrHangupInput = z.infer<typeof IvrHangupSchema>;
export type IvrSessionParam = z.infer<typeof IvrSessionParamSchema>;
