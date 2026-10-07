import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DobleFiloCard from '../DobleFiloCard';
import * as doblefiloEngine from '../../services/doblefiloEngine';
import * as apiClient from '../../services/apiClient';

describe('DobleFiloCard component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: {} });
  });

  it('renders tables tab in strictly read-only mode without Enviar pedido button', async () => {
    vi.spyOn(doblefiloEngine, 'getDoblefiloTables').mockResolvedValueOnce({
      success: true,
      tables: [
        { id: 'M-01', numero: 1, estado: 'libre', total: 0 },
        { id: 'M-02', numero: 2, estado: 'ocupada', total: 25.50 }
      ]
    });

    render(<DobleFiloCard />);

    // Click on Mesas tab
    const mesasTab = screen.getByText('Mesas');
    expect(mesasTab).toBeInTheDocument();
    fireEvent.click(mesasTab);

    // Verify read-only notice is displayed
    await waitFor(() => {
      expect(screen.getByText('Las comandas se registran en el punto de venta.')).toBeInTheDocument();
      expect(screen.getByText('Mesa 1')).toBeInTheDocument();
      expect(screen.getByText('Mesa 2')).toBeInTheDocument();
    });

    // Verify NO order sending button or cart exists
    expect(screen.queryByText(/Enviar a Cocina/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Enviar pedido/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tomar Pedido/i)).not.toBeInTheDocument();
  });
});
