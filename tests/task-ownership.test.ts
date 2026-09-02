const mockInfluencerFindUnique = jest.fn();
const mockTaskFindMany = jest.fn();
const mockTaskFindFirst = jest.fn();
const mockTaskUpdate = jest.fn();
const mockTaskDelete = jest.fn();
const mockAddPostAnalysisJob = jest.fn();

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    influencerProfile: {
      findUnique: mockInfluencerFindUnique,
    },
    task: {
      findMany: mockTaskFindMany,
      findFirst: mockTaskFindFirst,
      update: mockTaskUpdate,
      delete: mockTaskDelete,
    },
  },
}));

jest.mock('../src/queues/post-analyzer.queue', () => ({
  addPostAnalysisJob: mockAddPostAnalysisJob,
}));

jest.mock('../src/services/calendar.service', () => ({
  CalendarService: {
    syncTaskToCalendar: jest.fn(),
  },
}));

import {
  completeTaskWithProof,
  deleteTask,
  getMyTasks,
  toggleTask,
} from '../src/controllers/task.controller';
import { authenticate } from '../src/middlewares/auth.middleware';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function authenticatedRequest(userId: string, taskId = 'task-a', body: Record<string, unknown> = {}) {
  return {
    user: { id: userId, email: `${userId}@example.com`, role: 'INFLUENCER' },
    params: { taskId },
    body,
  } as any;
}

describe('STEP 1B — Task ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite ao usuário listar apenas as próprias tarefas', async () => {
    const ownTasks = [{ id: 'task-a', influencerId: 'influencer-a', title: 'Minha tarefa' }];
    mockInfluencerFindUnique.mockResolvedValue({ id: 'influencer-a', userId: 'user-a' });
    mockTaskFindMany.mockResolvedValue(ownTasks);
    const res = createResponse();

    await getMyTasks(authenticatedRequest('user-a'), res);

    expect(mockTaskFindMany).toHaveBeenCalledWith({
      where: { influencerId: 'influencer-a' },
      orderBy: { scheduledDate: 'asc' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(ownTasks);
  });

  it('permite concluir a própria tarefa', async () => {
    const ownedTask = { id: 'task-a', influencerId: 'influencer-a', isDone: false, fromAI: false };
    const completedTask = { ...ownedTask, isDone: true, proofUrl: 'https://example.com/proof' };
    mockTaskFindFirst.mockResolvedValue(ownedTask);
    mockTaskUpdate.mockResolvedValue(completedTask);
    const res = createResponse();

    await completeTaskWithProof(
      authenticatedRequest('user-a', 'task-a', { proofUrl: 'https://example.com/proof' }),
      res,
    );

    expect(mockTaskFindFirst).toHaveBeenCalledWith({
      where: { id: 'task-a', influencer: { userId: 'user-a' } },
    });
    expect(mockTaskUpdate).toHaveBeenCalledWith({
      where: { id: 'task-a' },
      data: { isDone: true, proofUrl: 'https://example.com/proof' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejeita conclusão de tarefa alheia sem alterar a tarefa', async () => {
    mockTaskFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await completeTaskWithProof(
      authenticatedRequest('user-b', 'task-a', { proofUrl: 'https://example.com/proof' }),
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
    expect(mockAddPostAnalysisJob).not.toHaveBeenCalled();
  });

  it('rejeita toggle de tarefa alheia sem alterar a tarefa', async () => {
    mockTaskFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await toggleTask(authenticatedRequest('user-b'), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('rejeita exclusão de tarefa alheia sem excluir a tarefa', async () => {
    mockTaskFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await deleteTask(authenticatedRequest('user-b'), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockTaskDelete).not.toHaveBeenCalled();
  });

  it('retorna 404 para tarefa inexistente', async () => {
    mockTaskFindFirst.mockResolvedValue(null);
    const res = createResponse();

    await toggleTask(authenticatedRequest('user-a', 'missing-task'), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockTaskUpdate).not.toHaveBeenCalled();
  });

  it('rejeita usuário não autenticado antes de acessar tarefas', () => {
    const req: any = { headers: {} };
    const res = createResponse();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(mockTaskFindFirst).not.toHaveBeenCalled();
  });
});
