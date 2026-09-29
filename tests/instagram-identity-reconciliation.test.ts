const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    socialPlatform: {
      findFirst: mockFindFirst,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

import { reconcileInstagramPlatformIdentity } from '../src/services/instagram.service';

describe('Instagram canonical identity reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
    mockFindUnique.mockResolvedValue(null);
    mockUpdate.mockResolvedValue({});
  });

  it('leaves the current SocialPlatform unchanged when its identity already matches /me', async () => {
    mockFindUnique.mockResolvedValue({ id: 'current-platform', platformId: 'canonical-id' });

    await reconcileInstagramPlatformIdentity('creator-a', 'canonical-id');

    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ platformName: 'INSTAGRAM', platformId: 'canonical-id' }),
    }));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('repairs only the current platformId when no other creator owns the canonical identity', async () => {
    mockFindUnique.mockResolvedValue({ id: 'current-platform', platformId: 'legacy-id' });

    await reconcileInstagramPlatformIdentity('creator-a', 'canonical-id');

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { influencerId_platformName: { influencerId: 'creator-a', platformName: 'INSTAGRAM' } },
      data: { platformId: 'canonical-id' },
    });
  });

  it('fails closed when the canonical identity belongs to another creator', async () => {
    mockFindFirst.mockResolvedValue({ id: 'foreign-platform' });

    await expect(reconcileInstagramPlatformIdentity('creator-a', 'canonical-id'))
      .rejects.toMatchObject({ code: 'IDENTITY_CONFLICT' });
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does not create a duplicate platform when no current platform row exists', async () => {
    await reconcileInstagramPlatformIdentity('creator-a', 'canonical-id');

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
