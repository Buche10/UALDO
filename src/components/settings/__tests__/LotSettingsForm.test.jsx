import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LotSettingsForm from '../LotSettingsForm';
import * as lotsClient from '../../../services/lotsClient';

describe('LotSettingsForm (Brief 40p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('carga y guarda los días de aviso de antigüedad', async () => {
    vi.spyOn(lotsClient, 'getLotSettings').mockResolvedValue({ ok: true, data: { data: { age_alert_days: 5 } } });
    const spy = vi.spyOn(lotsClient, 'updateLotSettings').mockResolvedValue({ ok: true, data: { data: { age_alert_days: 7 } } });
    render(<LotSettingsForm />);

    const input = await screen.findByLabelText('Días de aviso');
    expect(input.value).toBe('5');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar aviso' }));

    await waitFor(() => expect(spy).toHaveBeenCalledWith({ age_alert_days: '7' }));
    expect(await screen.findByText('Aviso de antigüedad guardado.')).toBeInTheDocument();
  });
});
