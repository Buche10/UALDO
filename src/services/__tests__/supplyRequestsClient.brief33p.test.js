import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import { savePurchaseOutcome } from '../supplyRequestsClient';

describe('supplyRequestsClient.savePurchaseOutcome (Brief 33p)', () => {
  let spy;

  beforeEach(() => {
    vi.restoreAllMocks();
    spy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { ok: true } });
  });

  it('validates outcome presence and batch limit <= 100', async () => {
    const emptyRes = await savePurchaseOutcome([]);
    expect(emptyRes.status).toBe(422);
    expect(spy).not.toHaveBeenCalled();

    const overLimit = Array.from({ length: 101 }, (_, i) => ({
      supply_request_item_id: i + 1,
      outcome: 'purchased',
    }));
    const overLimitRes = await savePurchaseOutcome(overLimit);
    expect(overLimitRes.status).toBe(422);
    expect(overLimitRes.data.errors.items[0]).toContain('100');
    expect(spy).not.toHaveBeenCalled();
  });

  it('validates required reason for partial and not_purchased', async () => {
    const missingReason = await savePurchaseOutcome([
      { supply_request_item_id: 1, outcome: 'partial', purchased_quantity: '5', reason: '   ' },
      { supply_request_item_id: 2, outcome: 'not_purchased' },
    ]);
    expect(missingReason.status).toBe(422);
    expect(missingReason.data.errors['items.0.reason']).toBeDefined();
    expect(missingReason.data.errors['items.1.reason']).toBeDefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it('normalizes valid items and sends batch request to backend', async () => {
    const validItems = [
      { supply_request_item_id: '1', outcome: 'purchased' },
      { supply_request_item_id: 2, outcome: 'partial', purchased_quantity: '5', reason: '  Solo habia 5 kg  ' },
      { supply_request_item_id: 3, outcome: 'not_purchased', reason: 'Agotado en mercado' },
    ];
    const res = await savePurchaseOutcome(validItems);
    expect(res.ok).toBe(true);
    expect(spy).toHaveBeenCalledWith('/supply-requests/purchase-outcome', {
      method: 'POST',
      body: {
        items: [
          { supply_request_item_id: 1, outcome: 'purchased' },
          { supply_request_item_id: 2, outcome: 'partial', purchased_quantity: '5', reason: 'Solo habia 5 kg' },
          { supply_request_item_id: 3, outcome: 'not_purchased', reason: 'Agotado en mercado' },
        ],
      },
    });
  });
});
