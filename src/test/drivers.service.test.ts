
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listDrivers } from '../services/drivers';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: vi.fn(),
}));

describe('Drivers Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch drivers list', async () => {
    const mockDrivers = [
      { id: 1, name: 'John Doe', mobile: '1234567890', status: true },
    ];
    (api as any).mockResolvedValue(mockDrivers);

    const result = await listDrivers();

    expect(api).toHaveBeenCalledWith('/drivers');
    expect(result).toEqual(mockDrivers);
  });
});
