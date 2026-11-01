import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchasingSettingsForm from '../PurchasingSettingsForm';
import * as purchasesClient from '../../../services/purchasesClient';
import * as auth from '../../../services/auth';
import { ABILITIES } from '../../../services/permissions';

describe('PurchasingSettingsForm component (Brief 33p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(auth, 'getUser').mockReturnValue({
      role: 'admin',
      capabilities: { abilities: [ABILITIES.SETTINGS_MANAGE] },
    });
  });

  it('loads purchasing settings and allows saving updates', async () => {
    vi.spyOn(purchasesClient, 'getPurchasingSettings').mockResolvedValue({
      ok: true,
      data: {
        data: {
          base_excess_factor: 1.5,
          receipt_tolerance_pct: 1.0,
          other_purchase_alert_cents: 5000,
        },
      },
    });

    const updateSpy = vi.spyOn(purchasesClient, 'updatePurchasingSettings').mockResolvedValue({
      ok: true,
      data: { success: true },
    });

    render(<PurchasingSettingsForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Factor de aviso de exceso sobre la base/)).toHaveValue(1.5);
      expect(screen.getByLabelText(/Tolerancia de diferencia en recepción/)).toHaveValue(1.0);
      expect(screen.getByLabelText(/Importe de aviso para otras compras/)).toHaveValue('50.00');
    });

    fireEvent.change(screen.getByLabelText(/Factor de aviso de exceso sobre la base/), {
      target: { value: '2.0' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ajustes' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        base_excess_factor: 2,
        receipt_tolerance_pct: 1,
        other_purchase_alert_cents: 5000,
      });
      expect(screen.getByText('Configuración de compras guardada.')).toBeInTheDocument();
    });
  });
});
