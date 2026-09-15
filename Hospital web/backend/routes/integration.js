/**
 * Hospital Web Backend — Interoperability Integration API Router
 *
 * Exposes:
 * - POST /api/integration/bpl/resolve-qr (Intake patient via Bharat PulseLink QR scan)
 * - GET  /api/integration/bpl/health     (Integration bridge health check)
 *
 * Owned by: Hospital Smart Triage & Interoperability Domain
 */

const express = require('express');
const router = express.Router();
const { resolvePatientQR } = require('../services/bplIntegration');

/**
 * POST /api/integration/bpl/resolve-qr
 * Body: { qrPayload: string, hospitalId?: string, facilityId?: string, requestedScopes?: string[] }
 */
router.post('/bpl/resolve-qr', async (req, res) => {
  const { qrPayload, hospitalId, facilityId, requestedScopes } = req.body;

  if (!qrPayload || typeof qrPayload !== 'string') {
    return res.status(400).json({
      error: 'Missing required field: qrPayload (must be a valid Bharat PulseLink QR string)',
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const intakeResult = await resolvePatientQR({
      qrPayload,
      hospitalId,
      facilityId,
      requestedScopes,
    });

    return res.status(200).json({
      success: true,
      data: intakeResult,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to resolve patient QR',
      code: err.code || 'INTEGRATION_ERROR',
    });
  }
});

/**
 * GET /api/integration/bpl/health
 */
router.get('/bpl/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'bharat-pulselink-hospital-bridge',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
