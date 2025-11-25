// En: src/views/WorkerLogViewer/WorkerLogViewer.jsx
// --- ARCHIVO MODIFICADO ---

import React, { useMemo, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';
import ColorPaletteSelector from '../../components/ui/ColorPaletteSelector/ColorPaletteSelector';
import Modal from '../../components/ui/Modal';
import { LABORES_FINCA } from '../../data/constants';
import { ICONS } from '../../config/icons';
import {
  Activity,
  Users,
  Clock3,
  Filter as FilterIcon,
  MapPin,
  CalendarClock,
  Search,
  Tags,
  ClipboardList,
  PlusCircle,
  Layers
} from 'lucide-react';
import './WorkerLogViewer.css';

const HOURS_IN_MS = 1000 * 60 * 60;

const WorkerLogViewer = ({
  workLogs = [],
  workers = [],
  fincas = [],
  cintasOptions = [],
  onNavigate,
  onCreateWorkRequest,
}) => {
  const [workerFilter, setWorkerFilter] = useState('all');
  const [fincaFilter, setFincaFilter] = useState('all');
  const [cintaFilter, setCintaFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [draft, setDraft] = useState({
    workerId: '',
    fincaId: '',
    lote: '',
    labor: LABORES_FINCA[0]?.value || '',
    cintas: [],
    date: '',
    startTime: '07:00',
    endTime: '16:00',
    description: '',
  });
  const [activeNote, setActiveNote] = useState(null);

  const cintaMap = useMemo(() => {
    const map = {};
    (cintasOptions || []).forEach(option => {
      map[option.value] = option;
    });
    return map;
  }, [cintasOptions]);

  const sortedLogs = useMemo(() => {
    return [...workLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [workLogs]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const rangeInDays = dateRange === 'all' ? null : parseInt(dateRange, 10);
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortedLogs.filter(log => {
      if (workerFilter !== 'all' && log.workerId !== workerFilter) {
        return false;
      }

      if (fincaFilter !== 'all' && log.fincaId !== fincaFilter) {
        return false;
      }

      if (cintaFilter !== 'all') {
        const cintas = log.cintas || [];
        if (!cintas.includes(cintaFilter)) {
          return false;
        }
      }

      if (rangeInDays !== null) {
        const logDate = new Date(log.date);
        const diffInDays = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
        if (diffInDays > rangeInDays) {
          return false;
        }
      }

      if (fromDate) {
        const logDate = new Date(log.date);
        const minDate = new Date(fromDate);
        if (logDate < minDate) {
          return false;
        }
      }

      if (toDate) {
        const logDate = new Date(log.date);
        const maxDate = new Date(toDate);
        if (logDate > maxDate) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const finca = fincas.find(f => f.id === log.fincaId);

      return [
        log.description,
        log.labor,
        log.lote,
        finca ? finca.name : '',
      ]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(normalizedSearch));
    });
  }, [sortedLogs, workerFilter, fincaFilter, cintaFilter, dateRange, searchTerm, fincas, fromDate, toDate]);

  const lastActivity = useMemo(() => {
    if (sortedLogs.length === 0) {
      return 'Sin actividad reciente';
    }

    const latest = sortedLogs[0];
    const activityDate = latest.checkOut || latest.checkIn || latest.date;

    if (!activityDate) {
      return 'Sin actividad reciente';
    }

    return new Date(activityDate).toLocaleString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [sortedLogs]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (workerFilter !== 'all') count += 1;
    if (fincaFilter !== 'all') count += 1;
    if (cintaFilter !== 'all') count += 1;
    if (dateRange !== 'all') count += 1;
    if (searchTerm) count += 1;
    if (fromDate) count += 1;
    if (toDate) count += 1;

    return count;
  }, [workerFilter, fincaFilter, cintaFilter, dateRange, searchTerm, fromDate, toDate]);

  const metrics = useMemo(() => {
    const uniqueWorkers = new Set();
    let totalHours = 0;

    filteredLogs.forEach(log => {
      if (log.workerId) {
        uniqueWorkers.add(log.workerId);
      }

      if (log.checkIn && log.checkOut) {
        const duration = new Date(log.checkOut) - new Date(log.checkIn);
        if (!Number.isNaN(duration) && duration > 0) {
          totalHours += duration / HOURS_IN_MS;
        }
      }
    });

    return {
      totalLogs: filteredLogs.length,
      activeWorkers: uniqueWorkers.size,
      totalHours,
    };
  }, [filteredLogs]);

  const formatHours = (hours) => {
    if (!hours) return '0 h';
    return `${hours.toFixed(hours >= 10 ? 0 : 1)} h`;
  };

  const heroStats = [
    {
      label: 'Registros vistos',
      value: metrics.totalLogs,
      hint: 'Según los filtros activos.',
      Icon: Activity,
    },
    {
      label: 'Trabajadores',
      value: metrics.activeWorkers,
      hint: 'Con labores concluidas.',
      Icon: Users,
    },
    {
      label: 'Horas reportadas',
      value: formatHours(metrics.totalHours),
      hint: 'Check-in y check-out confirmados.',
      Icon: Clock3,
    },
  ];

  const workerOptions = useMemo(() => {
    return workers
      .filter(worker => workLogs.some(log => log.workerId === worker.id))
      .map(worker => ({ value: worker.id, label: worker.name }));
  }, [workers, workLogs]);

  const fincaOptions = useMemo(() => {
    return fincas
      .filter(finca => workLogs.some(log => log.fincaId === finca.id))
      .map(finca => ({ value: finca.id, label: finca.name }));
  }, [fincas, workLogs]);

  const rangeOptions = useMemo(() => ([
    { value: 'all', label: 'Todo' },
    { value: '7', label: '7 días' },
    { value: '14', label: '14 días' },
    { value: '30', label: '30 días' },
    { value: '90', label: '90 días' },
  ]), []);

  const filterSelectGroups = useMemo(() => [
    {
      id: 'worker',
      label: 'Trabajador',
      value: workerFilter,
      icon: Users,
      onChange: event => setWorkerFilter(event.target.value),
      options: [{ value: 'all', label: 'Todos los trabajadores' }, ...workerOptions],
    },
    {
      id: 'finca',
      label: 'Finca',
      value: fincaFilter,
      icon: MapPin,
      onChange: event => setFincaFilter(event.target.value),
      options: [{ value: 'all', label: 'Todas las fincas' }, ...fincaOptions],
    },
  ], [workerFilter, fincaFilter, workerOptions, fincaOptions]);

  const filterPillGroups = useMemo(() => [
    {
      id: 'quick-range',
      label: 'Rango rápido',
      items: rangeOptions.map(option => ({
        id: option.value,
        label: option.label,
        active: dateRange === option.value,
        onClick: () => setDateRange(option.value),
      })),
    },
  ], [rangeOptions, dateRange]);

  const resetFilters = () => {
    setWorkerFilter('all');
    setFincaFilter('all');
    setCintaFilter('all');
    setDateRange('all');
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  const getWorkerName = (workerId) => {
    const worker = workers.find(item => item.id === workerId);
    return worker ? worker.name : `ID: ${workerId}`;
  };

  const getFincaName = (fincaId) => {
    if (!fincaId) return 'Pendiente';
    const finca = fincas.find(item => item.id === fincaId);
    return finca ? finca.name : 'N/A';
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDateParts = (value) => {
    if (!value) {
      return { day: '—', rest: '' };
    }
    const day = new Date(value).toLocaleDateString('es-EC', { day: '2-digit' });
    const rest = new Date(value).toLocaleDateString('es-EC', {
      month: 'short',
      year: 'numeric',
    });
    return { day, rest };
  };

  const formatTimeRange = (log) => {
    if (!log.checkIn || !log.checkOut) return '—';
    const from = new Date(log.checkIn).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const to = new Date(log.checkOut).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${from} - ${to}`;
  };

  const getCintaDisplay = (value) => {
    const cinta = cintaMap[value];
    if (!cinta) {
      return { label: value, color: '#CBD5F5' };
    }
    return cinta;
  };

  const toggleCintaFilter = (value) => {
    setCintaFilter(prev => (prev === value ? 'all' : value));
  };

  const resetDraft = () => {
    setDraft({
      workerId: '',
      fincaId: '',
      lote: '',
      labor: LABORES_FINCA[0]?.value || '',
      cintas: [],
      date: '',
      startTime: '07:00',
      endTime: '16:00',
      description: '',
    });
  };

  const handleDraftChange = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleDraftCinta = (values) => {
    handleDraftChange('cintas', values);
  };

  const handleSubmitDraft = (event) => {
    event.preventDefault();
    if (!draft.workerId || !draft.fincaId || !draft.date || draft.cintas.length === 0) {
      return;
    }

    const worker = workers.find(item => item.id === draft.workerId);

    const newLog = {
      workerId: draft.workerId,
      name: worker ? worker.name : undefined,
      fincaId: draft.fincaId,
      lote: draft.lote || null,
      labor: draft.labor,
      cintas: draft.cintas,
      date: draft.date,
      checkIn: `${draft.date}T${draft.startTime || '07:00'}:00`,
      checkOut: `${draft.date}T${draft.endTime || '16:00'}:00`,
      description: draft.description,
    };

    if (onCreateWorkRequest) {
      onCreateWorkRequest(newLog);
    }

    resetDraft();
    setShowDraftForm(false);
  };

  return (
    <div className="container workerLogViewer">
      <header className="workerLogViewer__hero">
        <div className="workerLogViewer__heroContent">
          <p className="workerLogViewer__heroEyebrow">Bitácora de campo</p>
          <h1 className="h1 workerLogViewer__heroTitle">Registro de labores completadas</h1>
          <p className="workerLogViewer__heroSubtitle">
            Supervisa las actividades finalizadas y publica nuevas labores para guiar a tu equipo.
          </p>

          <div className="workerLogViewer__metaChips">
            <span className="workerLogViewer__metaChip">
              <Clock3 size={16} />
              <span>Última actividad:</span>
              <strong>{lastActivity}</strong>
            </span>
            <span className="workerLogViewer__metaChip">
              <FilterIcon size={16} />
              {activeFilterCount === 0
                ? 'Sin filtros activos'
                : `${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} aplicado${activeFilterCount > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div className="workerLogViewer__heroActions">
          {onNavigate && (
            <button
              type="button"
              className="button button-secondary workerLogViewer__ghostButton"
              onClick={() => onNavigate('manageWorkers')}
            >
              <ClipboardList size={18} />
              Gestionar trabajadores
            </button>
          )}
          <button
            type="button"
            className="button btn-primary"
            onClick={() => setShowDraftForm(prev => !prev)}
          >
            {showDraftForm ? <Layers size={18} /> : <PlusCircle size={18} />}
            {showDraftForm ? 'Cerrar creador de labor' : 'Publicar nueva labor'}
          </button>
        </div>
      </header>

      <section className="workerLogViewer__statsRow">
        {heroStats.map(({ label, value, hint, Icon }) => (
          <article key={label} className="workerLogViewer__statCard">
            <span className="workerLogViewer__statIcon">
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <div className="workerLogViewer__statCopy">
              <span className="workerLogViewer__statLabel">{label}</span>
              <strong className="workerLogViewer__statValue">{value}</strong>
              <p className="workerLogViewer__statHint">{hint}</p>
            </div>
          </article>
        ))}
      </section>

      {showDraftForm && (
        <section className="workerLogViewer__draft">
          <h2>Crear labor para tu equipo</h2>
          <p>
            Las labores publicadas aparecerán como pendientes para el trabajador seleccionado en su perfil diario.
          </p>
          <form className="workerLogViewer__draftForm" onSubmit={handleSubmitDraft}>
            <div className="workerLogViewer__draftGrid">
              <label className="workerLogViewer__field">
                <span className="label">Trabajador</span>
                <select
                  className="select"
                  value={draft.workerId}
                  onChange={(event) => handleDraftChange('workerId', event.target.value)}
                  required
                >
                  <option value="">Elige un colaborador…</option>
                  {workers.map(worker => (
                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                  ))}
                </select>
              </label>
              <label className="workerLogViewer__field">
                <span className="label">Finca</span>
                <select
                  className="select"
                  value={draft.fincaId}
                  onChange={(event) => handleDraftChange('fincaId', event.target.value)}
                  required
                >
                  <option value="">Selecciona la finca…</option>
                  {fincas.map(finca => (
                    <option key={finca.id} value={finca.id}>{finca.name}</option>
                  ))}
                </select>
              </label>
              <label className="workerLogViewer__field">
                <span className="label">Lote</span>
                <input
                  type="text"
                  className="input"
                  value={draft.lote}
                  onChange={(event) => handleDraftChange('lote', event.target.value)}
                  placeholder="Ej. Lote 03"
                />
              </label>
              <label className="workerLogViewer__field">
                <span className="label">Labor</span>
                <select
                  className="select"
                  value={draft.labor}
                  onChange={(event) => handleDraftChange('labor', event.target.value)}
                >
                  {LABORES_FINCA.map(labor => (
                    <option key={labor.value} value={labor.value}>{labor.label}</option>
                  ))}
                </select>
              </label>
              <label className="workerLogViewer__field">
                <span className="label">Fecha</span>
                <input
                  type="date"
                  className="input"
                  value={draft.date}
                  onChange={(event) => handleDraftChange('date', event.target.value)}
                  required
                />
              </label>
              <label className="workerLogViewer__field">
                <span className="label">Hora inicio</span>
                <input
                  type="time"
                  className="input"
                  value={draft.startTime}
                  onChange={(event) => handleDraftChange('startTime', event.target.value)}
                />
              </label>
              <label className="workerLogViewer__field">
                <span className="label">Hora fin</span>
                <input
                  type="time"
                  className="input"
                  value={draft.endTime}
                  onChange={(event) => handleDraftChange('endTime', event.target.value)}
                />
              </label>
            </div>

            <div className="workerLogViewer__draftCintas">
              <span className="label">Colores de cinta a trabajar</span>
              <ColorPaletteSelector
                options={cintasOptions}
                selected={draft.cintas}
                onChange={handleToggleDraftCinta}
              />
            </div>

            <label className="workerLogViewer__draftDescription">
              <span className="label">Notas para el trabajador</span>
              <textarea
                rows="3"
                className="textarea"
                value={draft.description}
                onChange={(event) => handleDraftChange('description', event.target.value)}
                placeholder="Detalla objetivos, requisitos o recordatorios importantes."
              />
            </label>

            <div className="workerLogViewer__draftActions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  resetDraft();
                  setShowDraftForm(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="button btn-primary"
                disabled={!draft.workerId || !draft.fincaId || !draft.date || draft.cintas.length === 0}
              >
                Publicar labor
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="workerLogViewer__filtersCard">
        <div className="workerLogViewer__filtersHeader">
          <div className="workerLogViewer__filtersTitleWrap">
            <span className="workerLogViewer__filtersIcon">
              <FilterIcon size={18} />
            </span>
            <div>
              <h2 className="workerLogViewer__filtersTitle">Historial de labores</h2>
              <p className="workerLogViewer__filtersHint">
                Refina la vista por equipo, finca o colores de cinta para ubicar rápidamente los registros.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="button button-secondary workerLogViewer__clearFilters"
            onClick={resetFilters}
            disabled={
              workerFilter === 'all' &&
              fincaFilter === 'all' &&
              cintaFilter === 'all' &&
              dateRange === 'all' &&
              searchTerm === '' &&
              fromDate === '' &&
              toDate === ''
            }
          >
            Limpiar filtros
          </button>
        </div>

        <FilterPanel
          className="workerLogViewer__filterPanel"
          selectGroups={filterSelectGroups}
          pillGroups={filterPillGroups}
        />

        <div className="workerLogViewer__filtersGrid workerLogViewer__filtersGrid--secondary">
          <label className="workerLogViewer__field workerLogViewer__searchField workerLogViewer__field--wide">
            <span className="workerLogViewer__fieldLabel">
              <Search size={16} aria-hidden="true" />
              Buscar
            </span>
            <div className="workerLogViewer__searchInput">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                className="input"
                placeholder="Notas, labores o finca…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </label>

          <label className="workerLogViewer__field">
            <span className="workerLogViewer__fieldLabel">
              <CalendarClock size={16} />
              Desde
            </span>
            <input
              type="date"
              className="input"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>

          <label className="workerLogViewer__field">
            <span className="workerLogViewer__fieldLabel">
              <CalendarClock size={16} />
              Hasta
            </span>
            <input
              type="date"
              className="input"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
        </div>

        <div className="workerLogViewer__cintaFilter">
          <div className="workerLogViewer__cintaFilterHeader">
            <span className="workerLogViewer__fieldLabel">
              <Tags size={16} />
              Colores de cinta
            </span>
            <span className="workerLogViewer__cintaHint">Enfócate en las tareas por color de cinta asignado.</span>
          </div>
          <div className="workerLogViewer__cintaOptions">
            <button
              type="button"
              className={`workerLogViewer__cintaOption ${cintaFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setCintaFilter('all')}
            >
              Todas
            </button>
            {(cintasOptions || []).map(option => (
              <button
                type="button"
                key={option.value}
                className={`workerLogViewer__cintaOption ${cintaFilter === option.value ? 'is-active' : ''}`}
                style={{ '--cinta-color': option.color }}
                onClick={() => toggleCintaFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {filteredLogs.length === 0 ? (
        <EmptyState
          iconPath={ICONS.report}
          title="Sin registros con estos filtros"
          message="Ajusta los filtros para revisar otra parte del historial."
        />
      ) : (
        <section className="workerLogViewer__tableCard">
          <div className="workerLogViewer__tableHeader">
            <div className="workerLogViewer__tableTitle">
              <span className="workerLogViewer__tableIcon">
                <ClipboardList size={20} />
              </span>
              <div>
                <h2>Registros completados</h2>
                <p>
                  {filteredLogs.length} resultado{filteredLogs.length === 1 ? '' : 's'} — Ordenados por fecha más reciente.
                </p>
              </div>
            </div>
          </div>

          <div className="workerLogViewer__tableWrapper">
            <div className="workerLogTable">
              <div className="workerLogTable__row workerLogTable__row--header">
                <span>Fecha</span>
                <span>Horario</span>
                <span>Trabajador</span>
                <span>Finca</span>
                <span>Lote</span>
                <span>Labor</span>
                <span>Horas</span>
                <span>Cintas</span>
                <span>Notas</span>
              </div>
              {filteredLogs.map(log => {
                  const cintas = log.cintas || [];
                  const workerName = getWorkerName(log.workerId);
                  const fincaName = getFincaName(log.fincaId);
                  const durationHours = log.checkIn && log.checkOut
                    ? Math.max((new Date(log.checkOut) - new Date(log.checkIn)) / HOURS_IN_MS, 0)
                    : 0;
                  const primaryCinta = cintas[0];
                  const primaryColor = primaryCinta ? getCintaDisplay(primaryCinta).color : 'rgba(31, 157, 102, 0.14)';
                  const notePreview = log.description || 'Sin detalles registrados.';
                  const dateParts = getDateParts(log.date);

                  return (
                    <div
                      key={log.id}
                      className="workerLogTable__row"
                      style={{ '--worker-log-row-accent': primaryColor }}
                    >
                      <div className="workerLogTable__cell workerLogTable__date">
                        <span className="workerLogTable__dateDay">{dateParts.day}</span>
                        <span className="workerLogTable__dateRest">{dateParts.rest}</span>
                      </div>
                      <div className="workerLogTable__cell workerLogTable__time">
                        {formatTimeRange(log)}
                      </div>
                      <div className="workerLogTable__cell workerLogTable__text-group">
                        <strong>{workerName}</strong>
                        {log.workerId && <span>ID: {log.workerId}</span>}
                      </div>
                      <div className="workerLogTable__cell workerLogTable__text-group">
                        <strong>{fincaName}</strong>
                        {log.fincaId && <span>#{log.fincaId}</span>}
                      </div>
                      <div className="workerLogTable__cell workerLogTable__text-group">
                        <strong>{log.lote || '—'}</strong>
                        <span>Lote</span>
                      </div>
                      <div className="workerLogTable__cell workerLogTable__text-group">
                        <strong>{log.labor || 'Sin especificar'}</strong>
                      </div>
                      <div className="workerLogTable__cell workerLogTable__hours">
                        <strong>{formatHours(durationHours)}</strong>
                      </div>
                      <div className="workerLogTable__cell workerLogTable__cintas">
                        {cintas.length === 0 ? (
                          <span className="workerLogTable__cinta workerLogTable__cinta--empty">Sin cinta</span>
                        ) : (
                          cintas.map(value => {
                            const cinta = getCintaDisplay(value);
                            return (
                              <span
                                key={value}
                                className="workerLogTable__cinta"
                                style={{ '--cinta-color': cinta.color }}
                                data-label={cinta.label}
                              >
                                <span className="sr-only">{cinta.label}</span>
                              </span>
                            );
                          })
                        )}
                      </div>
                      <div className="workerLogTable__cell workerLogTable__notes">
                        {notePreview ? (
                          <button
                            type="button"
                            className="workerLogTable__noteButton"
                            onClick={() =>
                              setActiveNote({
                                date: formatDate(log.date),
                                worker: workerName,
                                finca: fincaName,
                                note: notePreview,
                              })
                            }
                          >
                            Ver nota
                          </button>
                        ) : (
                          <span className="workerLogTable__noNote">Sin nota</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {activeNote && (
        <Modal
          title="Detalle de nota"
          size="large"
          onClose={() => setActiveNote(null)}
        >
          <div className="workerLogViewer__noteModal">
            <p className="workerLogViewer__noteMeta"><strong>Fecha:</strong> {activeNote.date}</p>
            <p className="workerLogViewer__noteMeta"><strong>Trabajador:</strong> {activeNote.worker}</p>
            <p className="workerLogViewer__noteMeta"><strong>Finca:</strong> {activeNote.finca}</p>
            <p className="workerLogViewer__noteText">{activeNote.note}</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkerLogViewer;
