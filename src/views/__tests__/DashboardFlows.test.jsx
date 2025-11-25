import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ManagerDashboard from '../ManagerDashboard/ManagerDashboard';
import ProducerDashboard from '../ProducerDashboard/ProducerDashboard';

const mockProducers = [
  {
    id: 'p1',
    owner: 'Juan Valdez',
    fincas: [
      {
        id: 'f1',
        name: 'Finca Horizonte',
        hectares: 40,
        lotes: ['Lote 1', 'Lote 2'],
        location: { lat: -2.1, lon: -79.9 },
      },
    ],
  },
];

const mockTechnicians = [
  { id: 't1', name: 'Carlos Ruiz', zone: 'Norte' },
];

const baseAlert = {
  id: 'a1',
  producerId: 'p1',
  fincaId: 'f1',
  lote: 'Lote 1',
  farmName: 'Finca Horizonte',
  date: '2024-05-01',
  parts: { Hoja: true },
  symptoms: ['Manchas'],
  photos: {},
  location: { lat: -2.11, lon: -79.91 },
  priority: 'Alta',
};

const mockAlerts = [
  { ...baseAlert, status: 'assigned', techId: 't1', visitDate: '2024-05-05' },
  { ...baseAlert, id: 'a2', status: 'pending', techId: null, priority: 'Media' },
];

const mockTasks = [
  { id: 'task1', producerId: 'p1', alertId: 'a1', status: 'pending', owner: 'producer' },
];

const mockVisits = [
  { id: 'v1', producerId: 'p1', fincaId: 'f1', status: 'PENDING', entryTime: '2024-05-04T10:00' },
];

const mockContainmentPlans = [
  { id: 'plan1', producerId: 'p1', fincaId: 'f1', status: 'in_progress' },
];

describe('Dashboard flows', () => {
  test('Manager dashboard CTA navigates to summary and performance', () => {
    const onNavigate = jest.fn();
    render(
      <ManagerDashboard
        alerts={mockAlerts}
        visits={mockVisits}
        technicians={mockTechnicians}
        tasks={mockTasks}
        producers={mockProducers}
        containmentPlans={mockContainmentPlans}
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByText(/Resumen por finca/i));
    expect(onNavigate).toHaveBeenCalledWith(
      'fincaExecutiveSummary',
      expect.objectContaining({ focusFincaId: 'f1' })
    );

    fireEvent.click(screen.getByText(/Desempeño técnico/i));
    expect(onNavigate).toHaveBeenCalledWith(
      'technicianPerformance',
      expect.objectContaining({ focusTechnicianId: 't1' })
    );

    fireEvent.click(screen.getAllByText(/Ver resumen/i)[0]);
    expect(onNavigate).toHaveBeenCalledWith(
      'fincaExecutiveSummary',
      expect.objectContaining({ initialSelection: ['f1'] })
    );
  });

  test('Producer dashboard renders climate thresholds and quick actions', () => {
    const onNavigate = jest.fn();
    const followupSpy = jest.fn();
    render(
      <ProducerDashboard
        producer={mockProducers[0]}
        alerts={mockAlerts}
        visits={mockVisits}
        tasks={mockTasks}
        technicians={mockTechnicians}
        onNavigate={onNavigate}
        visitNotes={{}}
        visitEvidence={{}}
        onVisitNoteChange={jest.fn()}
        onVisitEvidenceChange={jest.fn()}
        visitFollowups={{}}
        onVisitFollowupToggle={followupSpy}
      />
    );

    fireEvent.click(screen.getByText(/Registrar alerta/i));
    expect(onNavigate).toHaveBeenCalledWith('reportAlert');

    expect(screen.getByText(/Indicador de estrés/i)).toBeInTheDocument();
    expect(screen.getByText(/Lluvia acumulada/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Marcar seguimiento completado/i));
    expect(followupSpy).toHaveBeenCalled();
  });
});
