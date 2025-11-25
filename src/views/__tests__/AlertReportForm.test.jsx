import { render, screen, fireEvent } from '@testing-library/react';
import AlertReportForm from '../AlertReportForm/AlertReportForm';

const mockProducer = {
  id: 'producer-1',
  owner: 'Juan Pérez',
  contactPhone: '099999999',
  fincas: [
    {
      id: 'f1',
      name: 'Finca Uno',
      lotes: ['Lote 1'],
      location: { lat: -2.1, lon: -79.9 },
    },
  ],
};

describe('AlertReportForm wizard', () => {
  test('enables step progression once datos básicos están completos', () => {
    render(
      <AlertReportForm
        producer={mockProducer}
        onSubmitAlert={jest.fn()}
        onNavigate={jest.fn()}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continuar/i });
    expect(continueButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Hora aproximada/i), {
      target: { value: '08:00' },
    });

    expect(continueButton).not.toBeDisabled();
  });
});
