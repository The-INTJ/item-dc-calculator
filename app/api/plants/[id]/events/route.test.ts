import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const addEventMock = vi.fn();
const requirePlantAccessMock = vi.fn();

vi.mock('@/plants/lib/server/plantsStore', () => ({
  addEvent: (id: string, input: unknown) => addEventMock(id, input),
}));

vi.mock('../../_lib/requirePlantAccess', () => ({
  requirePlantAccess: (request: Request) => requirePlantAccessMock(request),
}));

describe('/api/plants/[id]/events route', () => {
  beforeEach(() => {
    addEventMock.mockReset();
    requirePlantAccessMock.mockReset();
    requirePlantAccessMock.mockResolvedValue(null);
  });

  it('forwards note payloads to the plant store', async () => {
    addEventMock.mockResolvedValue({
      success: true,
      data: {
        id: 'plant-1',
        name: 'Monstera',
        createdAt: 1,
        events: [{ id: 'event-1', type: 'note', at: 2, note: 'Leaf spray.' }],
      },
    });

    const response = await POST(
      new Request('http://localhost/api/plants/plant-1/events', {
        method: 'POST',
        body: JSON.stringify({ type: 'note', note: 'Leaf spray.' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'plant-1' }) },
    );

    expect(addEventMock).toHaveBeenCalledWith('plant-1', {
      type: 'note',
      note: 'Leaf spray.',
    });
    expect(response.status).toBe(201);
  });

  it('forwards vibe ratings as numbers', async () => {
    addEventMock.mockResolvedValue({
      success: true,
      data: {
        id: 'plant-1',
        name: 'Monstera',
        createdAt: 1,
        events: [{ id: 'event-1', type: 'vibe_check', at: 2, rating: 8 }],
      },
    });

    const response = await POST(
      new Request('http://localhost/api/plants/plant-1/events', {
        method: 'POST',
        body: JSON.stringify({ type: 'vibe_check', rating: '8' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'plant-1' }) },
    );

    expect(addEventMock).toHaveBeenCalledWith('plant-1', {
      type: 'vibe_check',
      rating: 8,
    });
    expect(response.status).toBe(201);
  });

  it('forwards optional watering weights as trimmed text', async () => {
    addEventMock.mockResolvedValue({
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

    const response = await POST(
      new Request('http://localhost/api/plants/plant-1/events', {
        method: 'POST',
        body: JSON.stringify({
          type: 'watered',
          weightBefore: ' 410 g ',
          weightAfter: '',
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: 'plant-1' }) },
    );

    expect(addEventMock).toHaveBeenCalledWith('plant-1', {
      type: 'watered',
      weightBefore: '410 g',
      weightAfter: undefined,
    });
    expect(response.status).toBe(201);
  });
});
