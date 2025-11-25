import { fireEvent, render, screen, within } from '@testing-library/react';
import WorkerLogViewer from '../WorkerLogViewer/WorkerLogViewer';

const buildLog = ({ id, workerId, fincaId, date }) => ({
  id,
  workerId,
  fincaId,
  date,
  labor: 'Aplicación',
  lote: 'Lote 1',
  description: `${workerId} en ${fincaId}`,
  cintas: [],
  checkIn: `${date}T07:00:00`,
  checkOut: `${date}T12:00:00`,
});

const workers = [
  { id: 'w1', name: 'Andrea' },
  { id: 'w2', name: 'Marco' },
];

const fincas = [
  { id: 'f1', name: 'Finca Norte' },
  { id: 'f2', name: 'Finca Sur' },
];

const cintasOptions = [];

const renderViewer = (workLogs) =>
  render(
    <WorkerLogViewer
      workLogs={workLogs}
      workers={workers}
      fincas={fincas}
      cintasOptions={cintasOptions}
    />
  );

describe('WorkerLogViewer filters', () => {
  test('filter by worker using the new select', () => {
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    renderViewer([
      buildLog({ id: 'log-1', workerId: 'w1', fincaId: 'f1', date: todayISO }),
      buildLog({ id: 'log-2', workerId: 'w2', fincaId: 'f2', date: todayISO }),
    ]);

    expect(screen.getByText('Andrea', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Marco', { selector: 'strong' })).toBeInTheDocument();

    const workerLabel = screen.getAllByText('Trabajador')[0].parentElement;
    const workerDropdown = workerLabel.querySelector('.filterPanel__dropdownTrigger');
    fireEvent.click(workerDropdown);
    const dropdownList = workerDropdown.closest('.filterPanel__dropdown').querySelector('.filterPanel__dropdownList');
    const optionButton = within(dropdownList).getByRole('button', { name: 'Marco' });
    fireEvent.click(optionButton);

    expect(screen.getByText('Marco', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.queryByText('Andrea', { selector: 'strong' })).not.toBeInTheDocument();
  });

  test('quick range pills constrain the visible logs', () => {
    const today = new Date();
    const withinRange = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const outsideRange = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    renderViewer([
      buildLog({ id: 'recent', workerId: 'w1', fincaId: 'f1', date: withinRange }),
      buildLog({ id: 'old', workerId: 'w2', fincaId: 'f2', date: outsideRange }),
    ]);

    expect(screen.getByText('Andrea', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Marco', { selector: 'strong' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /7 días/i }));

    expect(screen.getByText('Andrea', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.queryByText('Marco', { selector: 'strong' })).not.toBeInTheDocument();
  });
});
