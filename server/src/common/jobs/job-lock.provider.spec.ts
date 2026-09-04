import { JobLockProvider } from './job-lock.provider';

describe('JobLockProvider', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    jobLock: { updateMany: jest.fn() },
  };

  const provider = new JobLockProvider(prisma as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('acquires the lock when Postgres returns a row', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { name: 'expire-abandoned-checkouts' },
    ]);
    await expect(
      provider.tryAcquire('expire-abandoned-checkouts', 1000),
    ).resolves.toBe(true);
  });

  it('does not run the job when another instance holds the lock', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    const fn = jest.fn();
    await expect(
      provider.runExclusive('expire-abandoned-checkouts', 1000, fn),
    ).resolves.toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });

  it('releases the lock after the exclusive function finishes', async () => {
    prisma.$queryRaw.mockResolvedValue([{ name: 'job' }]);
    prisma.jobLock.updateMany.mockResolvedValue({ count: 1 });
    const fn = jest.fn().mockResolvedValue(42);

    await expect(provider.runExclusive('job', 1000, fn)).resolves.toBe(42);
    expect(fn).toHaveBeenCalled();
    expect(prisma.jobLock.updateMany).toHaveBeenCalled();
  });
});
