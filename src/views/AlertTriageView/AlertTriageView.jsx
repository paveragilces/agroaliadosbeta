import React, { useMemo, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';
import { ICONS } from '../../config/icons';
import './AlertTriageView.css';
import {
  AlertTriangle,
  MapPin,
  CalendarDays,
  Camera,
  Activity,
  ShieldCheck,
  Search,
  ArrowLeft,
  Users,
  Hash
} from 'lucide-react';

const PRIORITY_META = {
  Alta: { label: 'Alta', tone: 'is-high' },
  Media: { label: 'Media', tone: 'is-medium' },
  Baja: { label: 'Baja', tone: 'is-low' }
};

const getRiskScore = alert => {
  const base = (alert.priority || 'Media').toLowerCase();
  const priorityScore = base === 'alta' ? 3 : base === 'media' ? 2 : 1;
  const symptomScore = alert.symptoms?.length > 2 ? 1 : 0;
  const ageDays = Math.max(
    0,
    Math.round((Date.now() - new Date(alert.date).getTime()) / (1000 * 60 * 60 * 24))
  );
  const ageScore = ageDays > 5 ? 2 : ageDays > 2 ? 1 : 0;
  const hasCriticalDisease = (alert.possibleDisease || []).some(disease =>
    ['moko', 'fusarium', 'erwinia'].some(keyword => disease?.toLowerCase().includes(keyword))
  );
  return priorityScore + symptomScore + ageScore + (hasCriticalDisease ? 2 : 0);
};

const getRiskLevel = alert => {
  const score = getRiskScore(alert);
  if (score >= 6) return { label: 'Crítica', tone: 'is-high' };
  if (score >= 4) return { label: 'Moderada', tone: 'is-medium' };
  return { label: 'Baja', tone: 'is-low' };
};

const AlertTriageView = ({ alerts, technicians, onAssignAlert, setModal, pageData }) => {
  const [filterStatus, setFilterStatus] = useState(pageData?.filter || 'pending');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [assignComment, setAssignComment] = useState('');
  const [assignDiseases, setAssignDiseases] = useState([]);
  const [assignTechId, setAssignTechId] = useState(technicians[0]?.id || '');
  const [assignDate, setAssignDate] = useState('');
  const [assignPriority, setAssignPriority] = useState('Media');

  const technicianLoad = useMemo(() => {
    const loadMap = technicians.reduce((acc, tech) => {
      acc[tech.id] = 0;
      return acc;
    }, {});
    alerts
      .filter(alert => alert.status === 'assigned' && alert.techId)
      .forEach(alert => {
        loadMap[alert.techId] = (loadMap[alert.techId] || 0) + 1;
      });
    return loadMap;
  }, [alerts, technicians]);

  const heroMetrics = useMemo(() => {
    const pending = alerts.filter(alert => alert.status === 'pending');
    const assigned = alerts.filter(alert => alert.status === 'assigned');
    const criticalPending = pending.filter(alert => (alert.priority || '').toLowerCase() === 'alta');
    const overdue = assigned.filter(alert => {
      if (!alert.visitDate) return false;
      return new Date(alert.visitDate) < new Date();
    });
    return [
      { type: 'pending', label: 'Pendientes', value: pending.length, icon: AlertTriangle, tone: 'is-warning' },
      { type: 'assigned', label: 'Asignadas', value: assigned.length, icon: ShieldCheck, tone: 'is-info' },
      { type: 'critical', label: 'Críticas', value: criticalPending.length, icon: Activity, tone: 'is-danger' },
      { type: 'overdue', label: 'Visitas vencidas', value: overdue.length, icon: CalendarDays, tone: 'is-warning' }
    ];
  }, [alerts]);

  const statusCounts = useMemo(() => ({
    pending: alerts.filter(alert => alert.status === 'pending').length,
    assigned: alerts.filter(alert => alert.status === 'assigned').length,
    completed: alerts.filter(alert => alert.status === 'completed').length
  }), [alerts]);

  const alertsForCurrentStatus = useMemo(
    () => alerts.filter(alert => alert.status === filterStatus),
    [alerts, filterStatus]
  );

  const handleHeroClick = type => {
    if (type === 'pending') {
      setFilterStatus('pending');
      setFilterPriority('all');
      setShowOverdueOnly(false);
    } else if (type === 'assigned') {
      setFilterStatus('assigned');
      setFilterPriority('all');
      setShowOverdueOnly(false);
    } else if (type === 'critical') {
      setFilterStatus('pending');
      setFilterPriority('Alta');
      setShowOverdueOnly(false);
    } else if (type === 'overdue') {
      setFilterStatus('assigned');
      setFilterPriority('all');
      setShowOverdueOnly(true);
    }
    setSearchTerm('');
  };

  const handleStatusChange = status => {
    setFilterStatus(status);
    setShowOverdueOnly(false);
    if (status !== 'pending') {
      setFilterPriority('all');
    }
  };

  const uniqueFincas = useMemo(() => {
    const names = new Map();
    alerts.forEach(alert => {
      if (!names.has(alert.fincaId)) {
        names.set(alert.fincaId, alert.farmName);
      }
    });
    return [{ id: 'all', name: 'Todas las fincas' }, ...Array.from(names, ([id, name]) => ({ id, name }))];
  }, [alerts]);

  const statusPillGroup = useMemo(() => ({
    id: 'status',
    label: 'Estado',
    items: [
      { id: 'pending', label: `Pendientes (${statusCounts.pending})` },
      { id: 'assigned', label: `Asignadas (${statusCounts.assigned})` },
      { id: 'completed', label: `Completadas (${statusCounts.completed})` }
    ].map(option => ({
      ...option,
      active: filterStatus === option.id,
      onClick: () => handleStatusChange(option.id)
    }))
  }), [statusCounts, filterStatus]);

  const priorityPillGroup = useMemo(() => {
    const counts = alertsForCurrentStatus.reduce((acc, alert) => {
      const key = alert.priority || 'Sin prioridad';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const priorities = ['all', 'Alta', 'Media', 'Baja'];
    return {
      id: 'priority',
      label: 'Prioridad',
      items: priorities.map(priority => ({
        id: priority,
        label:
          priority === 'all'
            ? `Todas (${alertsForCurrentStatus.length})`
            : `${priority} (${counts[priority] || 0})`,
        active: filterPriority === priority,
        onClick: () => setFilterPriority(priority)
      }))
    };
  }, [alertsForCurrentStatus, filterPriority]);

  const overduePillGroup = useMemo(() => ({
    id: 'overdue',
    label: 'Seguimiento',
    items: [
      {
        id: 'all-assigned',
        label: 'Todas las asignadas',
        active: !showOverdueOnly,
        onClick: () => setShowOverdueOnly(false)
      },
      {
        id: 'only-overdue',
        label: 'Solo vencidas',
        active: showOverdueOnly,
        onClick: () => setShowOverdueOnly(true)
      }
    ]
  }), [showOverdueOnly]);

  const filterPillGroups = useMemo(() => {
    const groups = [statusPillGroup, priorityPillGroup];
    if (filterStatus === 'assigned') {
      groups.push(overduePillGroup);
    }
    return groups;
  }, [statusPillGroup, priorityPillGroup, overduePillGroup, filterStatus]);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(alert => alert.status === filterStatus)
      .filter(alert => (filterPriority === 'all' ? true : alert.priority === filterPriority))
      .filter(alert => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return [alert.farmName, alert.lote, alert.symptoms?.join(' ')]
          .filter(Boolean)
          .some(text => text.toLowerCase().includes(term));
      })
      .filter(alert => {
        if (!showOverdueOnly) return true;
        if (!alert.visitDate) return false;
        return new Date(alert.visitDate) < new Date();
      });
  }, [alerts, filterStatus, filterPriority, searchTerm, showOverdueOnly]);

  const handleSelectAlert = alert => {
    setSelectedAlert(alert);
    setAssignComment(alert.managerComment || '');
    setAssignDiseases(alert.possibleDisease || []);
    setAssignTechId(alert.techId || technicians[0]?.id || '');
    setAssignDate(alert.visitDate || new Date().toISOString().split('T')[0]);
    const suggestedPriority =
      getRiskLevel(alert).tone === 'is-high'
        ? 'Alta'
        : getRiskLevel(alert).tone === 'is-medium'
          ? 'Media'
          : 'Baja';
    setAssignPriority(alert.priority || suggestedPriority);
  };

  const handleToggleDisease = disease => {
    setAssignDiseases(prev =>
      prev.includes(disease) ? prev.filter(d => d !== disease) : [...prev, disease]
    );
  };

  const handleSubmitAssignment = event => {
    event.preventDefault();
    if (!assignTechId || !assignDate || !assignPriority) {
      setModal({
        show: true,
        message: 'Por favor selecciona técnico, fecha y prioridad.',
        type: 'error'
      });
      return;
    }
    onAssignAlert(
      selectedAlert.id,
      assignComment,
      assignDiseases,
      assignTechId,
      assignDate,
      assignPriority
    );
    setSelectedAlert(null);
  };

  const possibleDiseases = [
    'Sigatoka Negra',
    'Moko (Ralstonia)',
    'Pudrición de la Corona',
    'Nemátodos',
    'Picudo Negro',
    'Erwinia',
    'Deficiencia Nutricional'
  ];

  const renderAlertCard = alert => {
    const risk = getRiskLevel(alert);
    const photos = alert.photos ? Object.values(alert.photos).filter(Boolean) : [];
    return (
      <article
        key={alert.id}
        className="triageCard"
        onClick={() => handleSelectAlert(alert)}
        title="Ver detalle y asignar"
      >
        <header className="triageCard__header">
          <span className={`priorityPill ${PRIORITY_META[alert.priority || 'Media']?.tone || 'is-medium'}`}>
            {alert.priority || 'Media'}
          </span>
          <span className={`riskPill ${risk.tone}`}>{risk.label}</span>
        </header>
        <div className="triageCard__body">
          <h3>{alert.farmName}</h3>
          <p>{alert.symptoms?.join(', ')}</p>
        </div>
        <div className="triageCard__meta">
          <span>
            <MapPin size={14} /> {alert.lote}
          </span>
          <span>
            <CalendarDays size={14} /> {alert.date}
          </span>
          <span>
            <Camera size={14} /> {photos.length} fotos
          </span>
        </div>
      </article>
    );
  };

  return (
    <div className="triagePage">
      {!selectedAlert && (
        <>
          <section className="triageHeroSection">
            <div className="triageHeroIntro">
              <span className="triageEyebrow">Centro de triaje</span>
              <h1>Asignación priorizada de alertas</h1>
              <p>
                Visualiza el estado operativo y asigna técnicos con base en riesgo, prioridad y
                disponibilidad. Mantén control de las incidencias más críticas desde un solo módulo.
              </p>
            </div>
            <div className="triageHero">
              {heroMetrics.map(metric => {
                const Icon = metric.icon;
                return (
                  <article
                    key={metric.label}
                    className={`triageHeroCard ${metric.tone}`}
                    onClick={() => handleHeroClick(metric.type)}
                  >
                    <div className="triageHeroIcon">
                      <Icon size={18} />
                    </div>
                    <div>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="triageFilters">
            <FilterPanel className="triageFilters__panel" pillGroups={filterPillGroups} />
            <label className="filterSearch">
              <span className="sr-only">Buscar alertas por texto</span>
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar por finca, lote o síntoma"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
              />
            </label>
          </section>

          <section className="triageList">
            {filteredAlerts.length === 0 ? (
              <EmptyState
                iconPath={ICONS.checkCircle}
                title="Sin alertas para mostrar"
                message="Todos los reportes de este filtro están al día."
              />
            ) : (
              filteredAlerts.map(renderAlertCard)
            )}
          </section>
        </>
      )}

      {selectedAlert && (
        <section className="triageDetail">
          <button type="button" className="backButton" onClick={() => setSelectedAlert(null)}>
            <ArrowLeft size={16} /> Volver al listado
          </button>
          <header className="triageDetail__header">
            <div>
              <span className="triageDetail__eyebrow">
                <Hash size={16} /> Alerta #{selectedAlert.id}
              </span>
              <h1>{selectedAlert.farmName}</h1>
              <div className="triageDetail__meta">
                <span>
                  <MapPin size={14} /> Lote {selectedAlert.lote}
                </span>
              </div>
            </div>
            <div className="triageDetail__tags">
              <span
                className={`detailTag detailTag--priority ${
                  PRIORITY_META[selectedAlert.priority || 'Media']?.tone || 'is-medium'
                }`}
              >
                <AlertTriangle size={14} /> {selectedAlert.priority || 'Media'}
              </span>
              <span className={`detailTag detailTag--risk ${getRiskLevel(selectedAlert).tone}`}>
                <Activity size={14} /> {getRiskLevel(selectedAlert).label}
              </span>
            </div>
          </header>
          <div className="triageDetailOverview">
            {[
              {
                icon: CalendarDays,
                label: 'Fecha reportada',
                value: selectedAlert.date
              },
              {
                icon: AlertTriangle,
                label: 'Prioridad sugerida',
                value: assignPriority
              },
              {
                icon: Activity,
                label: 'Riesgo calculado',
                value: getRiskLevel(selectedAlert).label
              }
            ].map(card => {
              const Icon = card.icon;
              return (
                <article key={card.label}>
                  <div className="triageDetailOverview__icon">
                    <Icon size={18} />
                  </div>
                  <div className="triageDetailOverview__text">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="triageDetail__grid">
            <aside className="triageDetail__summary">
              <div>
                <strong>Síntomas reportados</strong>
                <ul>
                  {selectedAlert.symptoms.map(symptom => (
                    <li key={symptom}>{symptom}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Posibles enfermedades</strong>
                <div className="chipGroup">
                  {assignDiseases.length === 0 ? (
                    <span className="chip chip--ghost">Sin selección</span>
                  ) : (
                    assignDiseases.map(disease => (
                      <span key={disease} className="chip">
                        {disease}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <strong>Registro fotográfico</strong>
                <div className="photoGrid">
                  {selectedAlert.photos && Object.values(selectedAlert.photos).length > 0 ? (
                    Object.entries(selectedAlert.photos).map(([key, photo]) =>
                      photo ? <img key={key} src={photo} alt={key} /> : null
                    )
                  ) : (
                    <p>Sin fotografías adjuntas.</p>
                  )}
                </div>
              </div>
            </aside>
            <form className="triageForm" onSubmit={handleSubmitAssignment}>
              <div>
                <label className="label" htmlFor="comment">
                  Comentario interno
                </label>
                <textarea
                  id="comment"
                  className="textarea"
                  rows="4"
                  value={assignComment}
                  onChange={event => setAssignComment(event.target.value)}
                  placeholder="Ej: Verificar también el lote aledaño y registrar evidencias adicionales."
                />
              </div>

              <div>
                <label className="label">Posibles enfermedades</label>
                <div className="chipGroup">
                  {possibleDiseases.map(disease => (
                    <button
                      key={disease}
                      type="button"
                      className={`chip chip--button ${assignDiseases.includes(disease) ? 'is-active' : ''}`}
                      onClick={() => handleToggleDisease(disease)}
                    >
                      {disease}
                    </button>
                  ))}
                </div>
              </div>

              <div className="formGrid">
                <div className="formControl">
                  <div className="formControl__label">
                    <Users size={16} /> Técnico
                  </div>
                  <div className="formControl__field">
                    <select value={assignTechId} onChange={event => setAssignTechId(event.target.value)}>
                      {technicians.map(tech => {
                        const load = technicianLoad[tech.id] || 0;
                        return (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} — {tech.zone} ({load} alertas)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="formControl">
                  <div className="formControl__label">
                    <CalendarDays size={16} /> Fecha sugerida
                  </div>
                  <div className="formControl__field">
                    <input
                      type="date"
                      value={assignDate}
                      onChange={event => setAssignDate(event.target.value)}
                    />
                  </div>
                </div>
                <div className="formControl">
                  <div className="formControl__label">
                    <AlertTriangle size={16} /> Prioridad
                  </div>
                  <div className="formControl__field">
                    <select
                      value={assignPriority}
                      onChange={event => setAssignPriority(event.target.value)}
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="triageSuggestions">
                <strong>Sugerencias del sistema</strong>
                <p>
                  {getRiskLevel(selectedAlert).tone === 'is-high'
                    ? 'La alerta presenta factores críticos. Se recomienda prioridad Alta.'
                    : getRiskLevel(selectedAlert).tone === 'is-medium'
                      ? 'Alerta moderada, considera programarla dentro de los próximos días.'
                      : 'Alerta estable. Mantener en vigilancia estándar.'}
                </p>
                <p>
                  Técnicos con menor carga:{' '}
                  {technicians
                    .sort((a, b) => (technicianLoad[a.id] || 0) - (technicianLoad[b.id] || 0))
                    .slice(0, 2)
                    .map(tech => tech.name)
                    .join(', ')}
                </p>
              </div>

              <div className="triageFormActions">
                <button type="submit" className="buttonPrimary">
                  Guardar asignación
                </button>
                <button type="button" className="buttonGhost" onClick={() => setSelectedAlert(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};

export default AlertTriageView;
