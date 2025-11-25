import { fireEvent, render, screen, within } from '@testing-library/react';
import ProducerAlertList from '../ProducerAlertList/ProducerAlertList';

describe('ProducerAlertList', () => {
  const baseProps = {
    technicians: [],
    onNavigate: jest.fn(),
    pageData: null,
    onGenerateAlertPDF: jest.fn(),
  };

  it('filtra por año ignorando alertas sin fecha válida', () => {
    const { container } = render(
      <ProducerAlertList
        {...baseProps}
        producer={{ id: 'p1', fincas: [{ id: 'f1', name: 'Finca Uno' }] }}
        alerts={[
          {
            id: 'a1',
            producerId: 'p1',
            fincaId: 'f1',
            farmName: 'Finca Uno',
            lote: 'Lote 1',
            date: '2024-05-01',
            status: 'pending',
            symptoms: [],
            photos: {},
          },
          {
            id: 'a2',
            producerId: 'p1',
            fincaId: 'f1',
            farmName: 'Finca Uno',
            lote: 'Lote 2',
            date: null,
            status: 'assigned',
            symptoms: [],
            photos: {},
          },
        ]}
      />
    );

    const yearLabel = screen.getAllByText('Año')[0].parentElement;
    const yearDropdown = yearLabel.querySelector('.filterPanel__dropdownTrigger');
    fireEvent.click(yearDropdown);
    const yearList = yearDropdown.closest('.filterPanel__dropdown').querySelector('.filterPanel__dropdownList');
    const optionButton = within(yearList).getByRole('button', { name: '2024' });
    fireEvent.click(optionButton);

    const alertCards = container.querySelectorAll('.alert-card');
    expect(alertCards.length).toBe(1);
  });

  it('muestra la opción "Todas mis Fincas" aunque no existan fincas cargadas', () => {
    render(
      <ProducerAlertList
        {...baseProps}
        producer={{ id: 'p1' }}
        alerts={[]}
      />
    );

    const fincaLabel = screen.getByText('Finca').parentElement;
    const trigger = fincaLabel.querySelector('.filterPanel__dropdownTrigger');
    expect(trigger).toHaveTextContent('Todas mis Fincas');
  });
});
