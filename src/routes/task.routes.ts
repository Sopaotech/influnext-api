import { Router } from 'express';
import { createTask, getMyTasks, createAITasks, completeTaskWithProof, getTelemetryResults, processAICommand } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createTask);
router.get('/', authenticate, getMyTasks);
router.post('/ai-generate', authenticate, createAITasks);
router.post('/process-command', authenticate, processAICommand);
router.post('/:taskId/complete', authenticate, completeTaskWithProof);
router.get('/telemetry', authenticate, getTelemetryResults);

export default router;