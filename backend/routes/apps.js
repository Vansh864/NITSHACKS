import express from 'express';
import { appPermissionSchema, accessEventSchema, actionSchema, alertPatchSchema, validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import { applyAction, applyRecommendations, getApp, getAppRecommendations, getTrustHistoryEndpoint, listApps, patchPermission, recordAccess, requestPermission, simulateApp } from '../controllers/appsController.js';
import { listAlertsController, patchAlert, summary, history, resetDatabase, healthCheck, mainScenario } from '../controllers/systemController.js';
import { z } from 'zod';

const router = express.Router();

const appIdSchema = z.object({ id: z.string().min(1) });
const querySchema = z.object({
  status: z.string().optional(),
  q: z.string().optional(),
});

router.get('/health', healthCheck);
router.get('/apps', validateQuery(querySchema), listApps);
router.get('/apps/:id', validateParams(appIdSchema), getApp);
router.patch('/apps/:id/permissions', validateParams(appIdSchema), validateBody(appPermissionSchema), patchPermission);
router.post('/apps/:id/permissions/request', validateParams(appIdSchema), validateBody(z.object({ permissionName: z.string().min(1), purpose: z.string().optional() })), requestPermission);
router.post('/apps/:id/access', validateParams(appIdSchema), validateBody(accessEventSchema), recordAccess);
router.post('/apps/:id/action', validateParams(appIdSchema), validateBody(actionSchema), applyAction);
router.post('/apps/:id/apply-recommendations', validateParams(appIdSchema), applyRecommendations);
router.get('/apps/:id/recommendations', validateParams(appIdSchema), getAppRecommendations);
router.get('/apps/:id/trust-history', validateParams(appIdSchema), getTrustHistoryEndpoint);
router.post('/apps/:id/simulate', validateParams(appIdSchema), simulateApp);
router.get('/alerts', listAlertsController);
router.patch('/alerts/:id', validateParams(z.object({ id: z.string().min(1) })), validateBody(alertPatchSchema), patchAlert);
router.get('/history', history);
router.get('/summary', summary);
router.post('/simulation/scenario', mainScenario);
router.post('/reset', resetDatabase);
router.get('/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.write('retry: 1000\n\n');
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);
  req.on('close', () => clearInterval(interval));
});

export default router;
