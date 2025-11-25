import { render, screen, fireEvent } from '@testing-library/react';
import TechnicianCommandCenter from '../TechnicianCommandCenter/TechnicianCommandCenter';

const baseProps = {
  currentUser: { id: 't1', name: 'Carlos Ruiz' },
  alerts: [
    { id: 'a1', techId: 't1', status: 'assigned', visitDate: '2024-05-10', priority: 'Alta', farmName: 'Finca Uno', lote: 'Lote 1' },
  ],
  visits: [],
  tasks: [],
  technicianActions: [
    {
      id: 'ta-1',
      alertId: 'a1',
      producerId: 'p1',
      fincaName: 'Finca Uno',
      lote: 'Lote 1',
      techId: 't1',
      title: 'Toma de muestras',
      type: 'Muestreo',
      status: 'assigned',
      requiresValidation: true,
      updates: [],
    },
  ],
};

describe('TechnicianCommandCenter', () => {
  test('records progress and updates risk meta', () => {
    const progressSpy = jest.fn();
    const submitSpy = jest.fn();
    const metaSpy = jest.fn();

    render(
      <TechnicianCommandCenter
        {...baseProps}
        onLogActionProgress={progressSpy}
        onSubmitAction={submitSpy}
        onUpdateActionMeta={metaSpy}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText('Describe tu avance o próximos pasos'),
      { target: { value: 'Listo' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Registrar avance/i }));
    expect(progressSpy).toHaveBeenCalledWith('ta-1', 'Listo');

    fireEvent.click(screen.getByRole('button', { name: 'Alto' }));
    expect(metaSpy).toHaveBeenCalledWith('ta-1', { risk: 'high' });
  });
});
