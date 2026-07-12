import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from './route';

const deleteEventMock = vi.fn();
const updateEventWeightsMock = vi.fn();
const requirePlantAccessMock = vi.fn();

vi.mock('@/plants/lib/server/plantsStore', () => ({
  deleteEvent: (id: string, eventId: string) => deleteEventMock(id, eventId),
  updateEventWeights: (id: string, eventId: string, input: unknown) =>
    updateEventWeightsMock(id, eventId, input),
}));

vi.mock('../../../_lib/requirePlantAccess', () => ({
  requirePlantAccess: (request: Request) => requirePlantAccessMock(request),
}));

describe('/api/plants/[id]/events/[eventId] route', () => {
  beforeEach(() => {
    deleteEventMock.mockReset();
    updateEventWeightsMock.mockReset();
    requirePlantAccessMock.mockReset();
    requirePlantAccessMock.mockResolvedValue(null);
  });

  it('forwards watering weight updates as trimmed text', async () => {
    updateEventWeightsMock.mockResolvedValue({
      success: true,
      data: {
        id: 'plant-1',
        name: 'Monstera',
        createdAt: 1,
        events: [
          {
            id: 'event-1',
            type: 'watered',
            at: 2,
            weightBefore: '410 g',
          },
        ],
      },
    });

    const response = await PATCH(
      new Request('http://localhost/api/plants/plant-1/events/event-1', {
        method: 'PATCH',
        body: JSON.stringify({
          weightBefore: ' 410 g ',
          weightAfter: '',
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'plant-1', eventId: 'event-1' }) },
    );

    expect(updateEventWeightsMock).toHaveBeenCalledWith('plant-1', 'event-1', {
      weightBefore: '410 g',
      weightAfter: undefined,
    });
    expect(response.status).toBe(200);
  });
});
