import { fireEvent, render, screen } from '@testing-library/react';
import AlertTriageView from '../AlertTriageView/AlertTriageView';

const buildAlert = (overrides = {}) => ({
  id: overrides.id || `a-${Math.random().toString(36).slice(2, 6)}`,
  fincaId: overrides.fincaId || 'f1',
  farmName: overrides.farmName || 'Finca Base',
  lote: overrides.lote || 'Lote 1',
  status: overrides.status || 'pending',
  priority: overrides.priority || 'Alta',
  date: overrides.date || '2024-05-01',
  symptoms: overrides.symptoms || [],
  photos: overrides.photos || {},
  possibleDisease: overrides.possibleDisease || [],
  managerComment: overrides.managerComment || '',
  visitDate: overrides.visitDate || null,
  techId: overrides.techId || null,
});

const baseTechnicians = [{ id: 't1', name: 'Laura Rivera' }];

const renderTriage = (props = {}) => {
  const { alerts = [] } = props;
  return render(
    <AlertTriageView
      alerts={alerts}
      technicians={baseTechnicians}
      onAssignAlert={jest.fn()}
      setModal={jest.fn()}
    />
  );
};

describe('AlertTriageView filters', () => {
  test('status pills switch between pending and assigned alerts', () => {
    renderTriage({
      alerts: [
        buildAlert({ id: 'pending', farmName: 'Finca Pendiente', status: 'pending' }),
        buildAlert({ id: 'assigned', farmName: 'Finca Asignada', status: 'assigned' }),
      ],
    });

    expect(screen.getByText('Finca Pendiente')).toBeInTheDocument();
    expect(screen.queryByText('Finca Asignada')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Asignadas/i }));

    expect(screen.getByText('Finca Asignada')).toBeInTheDocument();
    expect(screen.queryByText('Finca Pendiente')).not.toBeInTheDocument();
  });

  test('priority pills filter the pending alerts displayed', () => {
    renderTriage({
      alerts: [
        buildAlert({ id: 'alta', farmName: 'Finca Alta', status: 'pending', priority: 'Alta' }),
        buildAlert({ id: 'baja', farmName: 'Finca Baja', status: 'pending', priority: 'Baja' }),
      ],
    });

    expect(screen.getByText('Finca Alta')).toBeInTheDocument();
    expect(screen.getByText('Finca Baja')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Alta/ }));

    expect(screen.getByText('Finca Alta')).toBeInTheDocument();
    expect(screen.queryByText('Finca Baja')).not.toBeInTheDocument();
  });
});
