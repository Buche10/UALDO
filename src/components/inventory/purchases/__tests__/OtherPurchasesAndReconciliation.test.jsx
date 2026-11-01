import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import OtherPurchasesPanel from '../OtherPurchasesPanel';
import ReconciliationPanel from '../ReconciliationPanel';
import * as purchasesClient from '../../../../services/purchasesClient';

describe('OtherPurchasesPanel and ReconciliationPanel (Brief 33p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('OtherPurchasesPanel', () => {
    it('renders list of other purchases without catalog item_id', async () => {
      vi.spyOn(purchasesClient, 'listOtherPurchases').mockResolvedValue({
        ok: true,
        data: {
          data: [
            {
              id: 1,
              name: 'Foco LED 10W',
              unit: 'unidad',
              quantity: '4',
              line_total: '12.00',
              note: 'Cambio de focos barra',
              purchased_on: '2026-10-15',
              supplier_name: 'Ferretería Central',
            },
          ],
          total: 1,
        },
      });

      render(<OtherPurchasesPanel />);
      await waitFor(() => {
        expect(screen.getByText('Foco LED 10W')).toBeInTheDocument();
        expect(screen.getByText(/Ferretería Central/)).toBeInTheDocument();
        expect(screen.getByText(/USD 12,00/)).toBeInTheDocument();
      });
    });
  });

  describe('ReconciliationPanel', () => {
    it('renders comparison items and highlights differences with alert', async () => {
      vi.spyOn(purchasesClient, 'getReconciliation').mockResolvedValue({
        ok: true,
        data: {
          data: [
            {
              item_id: 1,
              item_name: 'Lomo fino',
              unit: 'kg',
              requested_qty: '5.000',
              purchased_qty: '5.000',
              received_qty: '3.500',
              difference: '-1.500',
              alerta: true,
            },
            {
              item_id: 2,
              item_name: 'Arroz',
              unit: 'kg',
              requested_qty: '10.000',
              purchased_qty: '10.000',
              received_qty: '10.000',
              difference: '0.000',
              alerta: false,
            },
          ],
        },
      });

      render(<ReconciliationPanel />);
      await waitFor(() => {
        expect(screen.getByText('Lomo fino')).toBeInTheDocument();
        expect(screen.getByText('Arroz')).toBeInTheDocument();
        expect(screen.getByText('Diferencia')).toBeInTheDocument();
      });
    });
  });
});
