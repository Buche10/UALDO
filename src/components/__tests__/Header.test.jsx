import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../Header';
import { ROLES, ROLE_LABELS } from '../../services/permissions';

describe('Header component (Brief 30p)', () => {
  const dummyNodeStatus = { online: true, latency: 15, checking: false };

  it('muestra el nombre y el cargo del usuario autenticado bajo el nombre', () => {
    const user = {
      id: 12,
      name: 'Manuel Cedeño',
      capabilities: {
        role: ROLES.KITCHEN_HEAD,
        role_label: ROLE_LABELS.kitchen_head,
      },
    };

    render(
      <Header
        nodeStatus={dummyNodeStatus}
        onRefreshStatus={vi.fn()}
        activeTab="negocios"
        isAuthenticated={true}
        user={user}
      />
    );

    expect(screen.getByText('Ualdo Negocios')).toBeInTheDocument();
    expect(screen.getByText('Manuel Cedeño')).toBeInTheDocument();
    expect(screen.getByText('Jefe de cocina')).toBeInTheDocument();
  });

  it('no muestra datos de usuario si no está autenticado', () => {
    render(
      <Header
        nodeStatus={dummyNodeStatus}
        onRefreshStatus={vi.fn()}
        activeTab="asistente"
        isAuthenticated={false}
        user={null}
      />
    );

    expect(screen.getByText('Asistente')).toBeInTheDocument();
    expect(screen.queryByText('Jefe de cocina')).not.toBeInTheDocument();
  });
});
