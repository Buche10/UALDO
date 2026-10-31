import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RunfoodStaffAliases from '../RunfoodStaffAliases';
import * as salesClient from '../../../services/salesClient';

describe('RunfoodStaffAliases (Brief 27p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('guarda un nuevo alias, muestra mensaje de éxito y notifica la actualización', async () => {
    const onAliasUpdated = vi.fn();
    vi.spyOn(salesClient, 'listRunfoodStaff').mockResolvedValueOnce({
      ok: true,
      data: {
        data: [{ runfood_user_id: 10, nombre_runfood: 'User_10', alias: null }],
        current_page: 1,
        last_page: 1
      }
    });
    vi.spyOn(salesClient, 'updateRunfoodStaffAlias').mockResolvedValueOnce({
      ok: true,
      data: { runfood_user_id: 10, alias: 'Mario' }
    });

    render(<RunfoodStaffAliases isOpen={true} onClose={vi.fn()} onAliasUpdated={onAliasUpdated} />);

    await waitFor(() => {
      expect(screen.getByText('User_10')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Alias para User_10');
    fireEvent.change(input, { target: { value: 'Mario' } });

    const saveBtn = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(salesClient.updateRunfoodStaffAlias).toHaveBeenCalledWith(10, 'Mario');
      expect(screen.getByText('Alias guardado')).toBeInTheDocument();
      expect(onAliasUpdated).toHaveBeenCalledTimes(1);
    });
  });

  it('muestra mensaje de error 422 junto al campo si falla la validación del motor', async () => {
    vi.spyOn(salesClient, 'listRunfoodStaff').mockResolvedValueOnce({
      ok: true,
      data: {
        data: [{ runfood_user_id: 10, nombre_runfood: 'User_10', alias: null }],
        current_page: 1,
        last_page: 1
      }
    });
    vi.spyOn(salesClient, 'updateRunfoodStaffAlias').mockResolvedValueOnce({
      ok: false,
      status: 422,
      error: 'El alias contiene caracteres inválidos.'
    });

    render(<RunfoodStaffAliases isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('User_10')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('El alias contiene caracteres inválidos.')).toBeInTheDocument();
    });
  });

  it('requiere confirmación de dos pasos para quitar un alias existente', async () => {
    const onAliasUpdated = vi.fn();
    vi.spyOn(salesClient, 'listRunfoodStaff').mockResolvedValueOnce({
      ok: true,
      data: {
        data: [{ runfood_user_id: 10, nombre_runfood: 'User_10', alias: 'Mario' }],
        current_page: 1,
        last_page: 1
      }
    });
    vi.spyOn(salesClient, 'updateRunfoodStaffAlias').mockResolvedValueOnce({
      ok: true,
      data: { runfood_user_id: 10, alias: null }
    });

    render(<RunfoodStaffAliases isOpen={true} onClose={vi.fn()} onAliasUpdated={onAliasUpdated} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Quitar alias' })).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole('button', { name: 'Quitar alias' });
    fireEvent.click(removeBtn);

    // No debe haber llamado al motor en el primer paso
    expect(salesClient.updateRunfoodStaffAlias).not.toHaveBeenCalled();

    // El botón cambia de texto para confirmar
    const confirmBtn = screen.getByRole('button', { name: '¿Confirmar quitar?' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(salesClient.updateRunfoodStaffAlias).toHaveBeenCalledWith(10, null);
      expect(screen.getByText('Alias quitado')).toBeInTheDocument();
      expect(onAliasUpdated).toHaveBeenCalledTimes(1);
    });
  });

  it('cierra el modal al hacer clic en el botón de cerrar', async () => {
    const onClose = vi.fn();
    vi.spyOn(salesClient, 'listRunfoodStaff').mockResolvedValueOnce({
      ok: true,
      data: { data: [], current_page: 1, last_page: 1 }
    });

    render(<RunfoodStaffAliases isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /cerrar nombres del personal/i });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('guardar con campo vacío pide confirmación de dos pasos antes de quitar alias', async () => {
    vi.spyOn(salesClient, 'listRunfoodStaff').mockResolvedValueOnce({
      ok: true,
      data: {
        data: [{ runfood_user_id: 10, nombre_runfood: 'User_10', alias: 'Mario' }],
        current_page: 1,
        last_page: 1
      }
    });
    vi.spyOn(salesClient, 'updateRunfoodStaffAlias').mockResolvedValueOnce({
      ok: true,
      data: { runfood_user_id: 10, alias: null }
    });

    render(<RunfoodStaffAliases isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('User_10')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Alias para User_10');
    fireEvent.change(input, { target: { value: '   ' } });

    const saveBtn = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(saveBtn);

    // Primer clic en guardar vacío no llama al motor, cambia texto a confirmación
    expect(salesClient.updateRunfoodStaffAlias).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '¿Confirmar quitar?' })).toBeInTheDocument();

    // Segundo clic confirma
    fireEvent.click(screen.getByRole('button', { name: '¿Confirmar quitar?' }));

    await waitFor(() => {
      expect(salesClient.updateRunfoodStaffAlias).toHaveBeenCalledWith(10, null);
      expect(screen.getByText('Alias quitado')).toBeInTheDocument();
    });
  });

  it('acepta 60 caracteres con espacios recortables al guardar', async () => {
    vi.spyOn(salesClient, 'listRunfoodStaff').mockResolvedValueOnce({
      ok: true,
      data: {
        data: [{ runfood_user_id: 10, nombre_runfood: 'User_10', alias: null }],
        current_page: 1,
        last_page: 1
      }
    });
    vi.spyOn(salesClient, 'updateRunfoodStaffAlias').mockResolvedValueOnce({
      ok: true,
      data: { runfood_user_id: 10, alias: 'a'.repeat(60) }
    });

    render(<RunfoodStaffAliases isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('User_10')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Alias para User_10');
    fireEvent.change(input, { target: { value: 'a'.repeat(60) + ' ' } });

    const saveBtn = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(salesClient.updateRunfoodStaffAlias).toHaveBeenCalledWith(10, 'a'.repeat(60));
    });
  });
});
