// Dashboard del productor con rediseño de UI/UX y navegación corregida

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FilePlus,
  History,
  Info,
  ListChecks,
  MapPin,
  Medal,
  User,
  UserCog,
  CheckCircle2,
  ClipboardCheck,
  CloudRain,
  Waves,
  ThermometerSun
} from 'lucide-react';
import FileUploadButton from '../../components/ui/FileUploadButton';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';
import './ProducerDashboard.css';

const ProducerDashboard = ({
  producer,
  alerts = [],
  visits = [],
  tasks = [],
  technicians = [],
  onNavigate = () => {},
  visitNotes = {},
  visitEvidence = {},
  onVisitNoteChange = () => {},
  onVisitEvidenceChange = () => {},
  visitFollowups = {},
  onVisitFollowupToggle = () => {},
  selfAssessment = null,
}) => {
  const safeProducer = producer || { owner: 'Productor', fincas: [] };
  const fincas = Array.isArray(safeProducer.fincas) ? safeProducer.fincas : [];
  const producerName = safeProducer.owner || safeProducer.name || 'Productor';
  const producerId = safeProducer.id;
  const hasFincas = fincas.length > 0;
  const [selectedFincaFilter, setSelectedFincaFilter] = useState('all');
  const [resultsVisible, setResultsVisible] = useState(true);
  const [showStressFormula, setShowStressFormula] = useState(false);

  const fincaOptions = useMemo(
    () => [{ id: 'all', name: 'Todas mis Fincas' }, ...fincas],
    [fincas]
  );

  const selectedFinca = useMemo(
    () => fincas.find(f => f.id === selectedFincaFilter) || null,
    [fincas, selectedFincaFilter]
  );

  const { filteredAlerts, filteredVisits, filteredTasks } = useMemo(() => {
    if (!producerId) {
      return { filteredAlerts: [], filteredVisits: [], filteredTasks: [] };
    }
    const myAlerts = alerts.filter(alert => alert.producerId === producerId);
    const myVisits = visits.filter(visit => visit.producerId === producerId);
    const myTasks = tasks.filter(task => task.producerId === producerId);

    const alertsByFinca = myAlerts.filter(alert => {
      if (selectedFincaFilter !== 'all' && alert.fincaId !== selectedFincaFilter) return false;
      return true;
    });

    const visitsByFinca = myVisits.filter(visit => {
      if (selectedFincaFilter !== 'all' && visit.fincaId !== selectedFincaFilter) return false;
      return true;
    });

    const tasksByFinca = myTasks.filter(task => {
      const relatedAlert = myAlerts.find(alert => alert.id === task.alertId);
      if (selectedFincaFilter !== 'all' && relatedAlert?.fincaId !== selectedFincaFilter) {
        return false;
      }
      return true;
    });

    return {
      filteredAlerts: alertsByFinca,
      filteredVisits: visitsByFinca,
      filteredTasks: tasksByFinca
    };
  }, [alerts, visits, tasks, producerId, selectedFincaFilter]);

  const pendingAlerts = useMemo(
    () => filteredAlerts.filter(alert => alert.status === 'pending'),
    [filteredAlerts]
  );
  const assignedAlerts = useMemo(
    () =>
      filteredAlerts
        .filter(alert => alert.status === 'assigned')
        .sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate)),
    [filteredAlerts]
  );
  const completedAlerts = useMemo(
    () =>
      filteredAlerts.filter(
        alert => alert.status === 'completed' && alert.inspectionData?.plant
      ),
    [filteredAlerts]
  );
  const pendingVisits = useMemo(
    () => filteredVisits.filter(visit => visit.status === 'PENDING'),
    [filteredVisits]
  );
  const pendingTasks = useMemo(
    () => filteredTasks.filter(task => task.status === 'pending'),
    [filteredTasks]
  );
  const completedTasksCount = useMemo(
    () => filteredTasks.filter(task => task.status === 'completed').length,
    [filteredTasks]
  );

  const tasksByAlert = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      if (!task.alertId) return acc;
      if (!acc[task.alertId]) acc[task.alertId] = [];
      acc[task.alertId].push(task);
      return acc;
    }, {});
  }, [filteredTasks]);

  const followupStats = useMemo(() => {
    if (!assignedAlerts.length) {
      return { completed: 0, total: 0 };
    }
    const completed = assignedAlerts.filter(alert => visitFollowups[alert.id]?.completed).length;
    return { completed, total: assignedAlerts.length };
  }, [assignedAlerts, visitFollowups]);

  const taskCompletionRate = filteredTasks.length
    ? Math.round((completedTasksCount / filteredTasks.length) * 100)
    : 0;
  const nextVisit = assignedAlerts[0]?.visitDate || null;

  const buildSignal = useMemo(() => {
    return finca => {
      const key = `${producerId || 'prod'}-${finca?.id || 'all'}`;
      const seed = key.split('').reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);
      const pseudo = (offset, min, max) => {
        const x = Math.abs(Math.sin(seed + offset) * 10000) % 1;
        return Number((min + x * (max - min)).toFixed(1));
      };
      const rainfallLastWeek = pseudo(1, 6, 42);
      const historicalAvg = pseudo(2, 18, 34);
      const anomaly = Number((rainfallLastWeek - historicalAvg).toFixed(1));
      const floodPressure = rainfallLastWeek > 38 ? 'alta' : rainfallLastWeek > 28 ? 'media' : 'baja';
      const hydricPressure = rainfallLastWeek < 18 ? 'potencial' : 'estable';
      const hydricMessage =
        hydricPressure === 'potencial'
          ? 'El promedio semanal está por debajo de 20 mm. Evalúa riego o mulching.'
          : 'Humedad en rango aceptable. Mantén monitoreo básico.';
      return {
        rainfall: {
          lastWeek: rainfallLastWeek,
          historicalAvg,
          anomaly,
        },
        flood: {
          pressure: floodPressure,
          label:
            floodPressure === 'alta'
              ? 'Presión alta de encharcamiento'
              : floodPressure === 'media'
                ? 'Presión media'
                : 'Presión baja',
          hint:
            floodPressure === 'alta'
              ? 'Prioriza drenajes y evita labores pesadas en suelos saturados.'
              : floodPressure === 'media'
                ? 'Revisa cunetas y prepara equipos si sube la lluvia.'
                : 'Bajo riesgo de inundación esta semana.',
        },
        hydric: {
          pressure: hydricPressure,
          message: hydricMessage,
        },
      };
    };
  }, [producerId]);

  const climateSignals = useMemo(() => {
    if (selectedFinca) {
      return buildSignal(selectedFinca);
    }

    if (!fincas.length) {
      return buildSignal(null);
    }

    const weights = fincas.map(f => Number(f.hectares) || 1);
    const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;

    const aggregated = fincas.reduce(
      (acc, finca, index) => {
        const signal = buildSignal(finca);
        const w = weights[index];
        acc.rainfall.lastWeek += signal.rainfall.lastWeek * w;
        acc.rainfall.historicalAvg += signal.rainfall.historicalAvg * w;
        return acc;
      },
      { rainfall: { lastWeek: 0, historicalAvg: 0 } }
    );

    aggregated.rainfall.lastWeek = Number((aggregated.rainfall.lastWeek / totalWeight).toFixed(1));
    aggregated.rainfall.historicalAvg = Number((aggregated.rainfall.historicalAvg / totalWeight).toFixed(1));
    aggregated.rainfall.anomaly = Number(
      (aggregated.rainfall.lastWeek - aggregated.rainfall.historicalAvg).toFixed(1)
    );

    const floodPressure =
      aggregated.rainfall.lastWeek > 38 ? 'alta' : aggregated.rainfall.lastWeek > 28 ? 'media' : 'baja';
    const hydricPressure = aggregated.rainfall.lastWeek < 18 ? 'potencial' : 'estable';

    return {
      rainfall: aggregated.rainfall,
      flood: {
        pressure: floodPressure,
        label:
          floodPressure === 'alta'
            ? 'Presión alta de encharcamiento'
            : floodPressure === 'media'
              ? 'Presión media'
              : 'Presión baja',
        hint:
          floodPressure === 'alta'
            ? 'Prioriza drenajes y evita labores pesadas en suelos saturados.'
            : floodPressure === 'media'
              ? 'Revisa cunetas y prepara equipos si sube la lluvia.'
              : 'Bajo riesgo de inundación esta semana.',
      },
      hydric: {
        pressure: hydricPressure,
        message:
          hydricPressure === 'potencial'
            ? 'El promedio semanal está por debajo de 20 mm. Evalúa riego o mulching.'
            : 'Humedad en rango aceptable. Mantén monitoreo básico.',
      },
    };
  }, [selectedFinca, fincas, buildSignal]);

  const climateWindow = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const format = date =>
      date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });

    return {
      startLabel: format(start),
      endLabel: format(end),
    };
  }, []);

  const formatDateLabel = value => {
    if (!value) return 'Sin fecha';
    return new Date(value).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCountdown = date => {
    if (!date) return { text: 'Sin fecha', className: 'urgency-low' };

    const today = new Date(new Date().toISOString().split('T')[0]);
    const visitDate = new Date(new Date(date).toISOString().split('T')[0]);
    const diffTime = visitDate - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: 'Visita atrasada', className: 'urgency-high' };
    if (days === 0) return { text: 'Visita hoy', className: 'urgency-high' };
    if (days === 1) return { text: 'Visita mañana', className: 'urgency-medium' };
    return { text: `Visita en ${days} días`, className: 'urgency-low' };
  };

  const kpiCards = useMemo(() => [
    {
      id: 'alerts',
      icon: AlertTriangle,
      eyebrow: 'Registro rápido',
      label: 'Alertas pendientes',
      value: pendingAlerts.length,
      description: 'Comparte hallazgos nuevos para activar al equipo técnico.',
      meta: `${assignedAlerts.length} alertas asignadas`,
      tone: pendingAlerts.length ? 'is-warning' : 'is-neutral',
      onClick: () => onNavigate('reportAlert'),
    },
    {
      id: 'tasks',
      icon: ListChecks,
      eyebrow: 'Planes correctivos',
      label: 'Tareas del productor',
      value: `${pendingTasks.length} abiertas`,
      description: 'Coordina y completa las actividades solicitadas en cada finca.',
      meta: filteredTasks.length ? `${taskCompletionRate}% completado` : 'Sin tareas asignadas',
      tone: pendingTasks.length ? 'is-caution' : 'is-neutral',
      onClick: () => onNavigate('producerTasks', { filter: 'pending' }),
    },
    {
      id: 'visits',
      icon: CalendarClock,
      eyebrow: 'Visitas técnicas',
      label: 'Visitas por aprobar',
      value: pendingVisits.length || 'Al día',
      description: 'Analiza solicitudes de ingreso y evita cuellos de botella.',
      meta: nextVisit ? `Próxima cita: ${formatDateLabel(nextVisit)}` : 'Sin visitas cercanas',
      tone: pendingVisits.length ? 'is-info' : 'is-neutral',
      onClick: () => onNavigate('visitorApproval', { filter: 'PENDING' }),
    },
    {
      id: 'followup',
      icon: UserCog,
      eyebrow: 'Seguimiento',
      label: 'Seguimientos cerrados',
      value: followupStats.total ? `${followupStats.completed}/${followupStats.total}` : '0',
      description: 'Marca las visitas atendidas para sincronizarte con tu técnico.',
      meta: followupStats.total ? `${Math.round((followupStats.completed / followupStats.total) * 100)}% del plan` : 'Sin visitas activas',
      tone: followupStats.completed === followupStats.total && followupStats.total > 0 ? 'is-success' : 'is-neutral',
      onClick: () => onNavigate('producerAlertList', { filter: 'assigned', section: 'registry' }),
    },
  ], [assignedAlerts.length, followupStats.completed, followupStats.total, nextVisit, onNavigate, pendingAlerts.length, pendingTasks.length, pendingVisits.length, filteredTasks.length, taskCompletionRate]);

  const climateRisk = useMemo(() => {
    const computeStress = rainfallValue => {
      const dry = Math.max(0, 22 - rainfallValue) * 1.6;
      const flood = Math.max(0, rainfallValue - 34) * 1.3;
      const score = Math.min(100, dry + flood);
      return { score, dry, flood };
    };

    let stressData = computeStress(climateSignals.rainfall.lastWeek);

    if (!selectedFinca && fincas.length) {
      const weights = fincas.map(f => Number(f.hectares) || 1);
      const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
      const accum = fincas.reduce(
        (acc, finca, index) => {
          const signal = buildSignal(finca);
          const data = computeStress(signal.rainfall.lastWeek);
          const w = weights[index];
          acc.score += data.score * w;
          acc.dry += data.dry * w;
          acc.flood += data.flood * w;
          return acc;
        },
        { score: 0, dry: 0, flood: 0 }
      );
      stressData = {
        score: accum.score / totalWeight,
        dry: accum.dry / totalWeight,
        flood: accum.flood / totalWeight,
      };
    }

    const stressScore = Math.min(100, stressData.score);
    const drynessScore = stressData.dry;
    const floodScore = stressData.flood;
    const level = stressScore >= 75 ? 'Alto' : stressScore >= 45 ? 'Medio' : 'Bajo';
    const meta = {
      Alto: {
        className: 'risk-high',
        summary: 'Prepara drenajes y protege lotes sensibles. Se espera presión hídrica elevada.',
        recommendations: [
          'Refuerza rondas y drenajes en zonas bajas.',
          'Evita labores pesadas en suelos saturados.',
        ],
      },
      Medio: {
        className: 'risk-medium',
        summary: 'Condiciones variables. Mantén drenajes listos y ajusta riegos según anomalía.',
        recommendations: [
          'Revisa cunetas y puntos de desagüe.',
          'Monitorea focos críticos a mitad de semana.',
        ],
      },
      Bajo: {
        className: 'risk-low',
        summary: 'Clima estable. Aprovecha para mantenimiento y labores culturales.',
        recommendations: [
          'Planifica capacitaciones o labores de mantenimiento.',
          'Mantén observación básica de los lotes críticos.',
        ],
      },
    };
    const focusName = selectedFinca ? selectedFinca.name : 'todas tus fincas';
    const stressIndicator = {
      score: Math.round(stressScore),
      level: stressScore >= 75 ? 'critico' : stressScore >= 45 ? 'alerta' : 'estable',
      message:
        stressScore >= 75
          ? 'Presión hídrica alta. Prioriza drenajes y evita saturación de suelos.'
          : stressScore >= 45
            ? 'Condición intermedia. Ajusta riegos y revisa zonas bajas.'
            : 'Condición estable. Mantén monitoreo básico.',
      drivers: [
        { id: 'rain', label: 'Lluvia semanal', value: `${climateSignals.rainfall.lastWeek} mm` },
        { id: 'anomaly', label: 'Anomalía', value: `${climateSignals.rainfall.anomaly} mm` },
        { id: 'flood', label: 'Presión de inundación', value: climateSignals.flood.label },
        { id: 'dry', label: 'Componente sequía', value: `${drynessScore.toFixed(1)}` },
        { id: 'floodScore', label: 'Componente inundación', value: `${floodScore.toFixed(1)}` },
      ],
      visitContext: '',
      formula: selectedFinca
        ? 'Estrés = min(100, max(0, 22 - lluviaSemanal)*1.6 + max(0, lluviaSemanal - 34)*1.3)'
        : 'Estrés ponderado (ha) = promedio por hectárea de min(100, max(0, 22 - lluviaSemanal)*1.6 + max(0, lluviaSemanal - 34)*1.3)',
    };

    return {
      level,
      ...meta[level],
      focusName,
      stressIndicator,
    };
  }, [climateSignals, selectedFinca, fincas, buildSignal]);

  return (
    <div className="producer-dashboard-page container">
      <header className="dashboard-header hero-shell">
        <div className="hero-ambient"></div>
        <div className="hero-content">
          <div className="hero-left">
            <span className="welcome">Bienvenido de vuelta, {producerName}</span>
            <h1 className="hero-title">Dashboard del Productor</h1>
            <p className="hero-subtitle">
              Panorama operativo y climático para coordinar acciones y proteger tus fincas.
            </p>
            <div className="hero-chips">
              <span className="hero-chip">
                <User size={18} /> {producerName}
              </span>
              <span className="hero-chip">
                <MapPin size={18} /> {fincas.length} fincas activas
              </span>
              <span className="hero-chip">
                <AlertTriangle size={18} /> {pendingAlerts.length} alertas sin registrar
              </span>
            </div>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="hero-btn primary"
              onClick={() => onNavigate('reportAlert')}
            >
              <FilePlus size={18} /> Registrar alerta
            </button>
            <button
              type="button"
              className="hero-btn ghost"
              onClick={() => onNavigate('producerAlertList')}
            >
              <History size={18} /> Ver historial
            </button>
          </div>
        </div>
      </header>

      <section className="filters">
        <FilterPanel
          pillGroups={[
            {
              id: 'fincas',
              label: 'Filtrar por finca',
              items: fincaOptions.map(finca => ({
                id: finca.id,
                label: finca.name,
                active: selectedFincaFilter === finca.id,
                onClick: () => setSelectedFincaFilter(finca.id),
              })),
            },
          ]}
          selectGroups={[]}
        />
      </section>

      {!hasFincas ? (
        <div className="panel panel-empty">
          <div className="empty-state">
            <ClipboardCheck size={24} />
            <p>Registra tu primera finca para ver alertas, visitas y tareas personalizadas.</p>
            <div className="empty-actions">
              <button
                type="button"
                className="quick-action"
                onClick={() => onNavigate('fincaRegistration')}
              >
                <FilePlus size={18} /> Registrar finca
              </button>
              <button
                type="button"
                className="quick-action secondary"
                onClick={() => onNavigate('reportAlert')}
              >
                <AlertTriangle size={18} /> Reportar alerta
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="kpi-grid">
            {kpiCards.map(card => {
              const Icon = card.icon;
              const clickable = typeof card.onClick === 'function';
              return (
                <article
                  key={card.id}
                  className={`kpi-card surface-card ${card.tone} ${clickable ? 'is-clickable' : ''}`}
                  onClick={clickable ? card.onClick : undefined}
                >
                  <span className="kpi-eyebrow">{card.eyebrow}</span>
                  <div className="kpi-header">
                    <div className="kpi-icon">
                      <Icon size={20} />
                    </div>
                    <span>{card.label}</span>
                  </div>
                  <p className="kpi-value">{card.value}</p>
                  <p className="kpi-description">{card.description}</p>
                  {card.meta && <span className="kpi-meta">{card.meta}</span>}
                </article>
              );
            })}
          </section>

          <section className="content-grid">
            <div className="panel climate-panel">
              <div className="panel-header">
                <div>
                  <h2 className="h2">Riesgo climático</h2>
                  <p>
                    Panorama semanal para {climateRisk.focusName}. Ajusta tus cuadrillas y riegos según
                    las recomendaciones.
                  </p>
                  <p className="climate-window">
                  Semana {climateWindow.startLabel} - {climateWindow.endLabel} · Referencia simulada con base en lluvias.
                  </p>
                </div>
                <span className={`risk-pill ${climateRisk.className}`}>{climateRisk.level}</span>
              </div>
              <div className="climate-preview">
                <div className="climate-stats-grid">
                  {[
                    {
                      id: 'rain',
                      icon: CloudRain,
                      label: 'Anomalía de lluvia',
                      value: `${climateSignals.rainfall.anomaly} mm`,
                      foot: `Promedio histórico: ${climateSignals.rainfall.historicalAvg} mm`,
                      tone: climateSignals.rainfall.anomaly < 0 ? 'negative' : 'positive',
                      anim: 'rain',
                    },
                    {
                      id: 'flood',
                      icon: Waves,
                      label: 'Riesgo de inundación',
                      value:
                        climateSignals.flood.pressure === 'alta'
                          ? 'Alta'
                          : climateSignals.flood.pressure === 'media'
                            ? 'Media'
                            : 'Baja',
                      foot: climateSignals.flood.hint,
                      tone: climateSignals.flood.pressure === 'alta' ? 'warning' : 'neutral',
                      anim: 'wave',
                    },
                    {
                      id: 'hydric',
                      icon: ThermometerSun,
                      label: 'Estrés hídrico',
                      value: climateSignals.hydric.pressure === 'potencial' ? 'Potencial' : 'Estable',
                      foot: climateSignals.hydric.message,
                      tone: climateSignals.hydric.pressure === 'potencial' ? 'warning' : 'neutral',
                      anim: 'pulse',
                    },
                  ].map(card => {
                    const Icon = card.icon;
                    return (
                      <article key={card.id} className={`climate-stat-card tone-${card.tone}`}>
                        <div className="stat-header">
                          <div className={`stat-icon anim-${card.anim}`} aria-hidden="true">
                            <Icon size={18} />
                          </div>
                          <span className="stat-label">{card.label}</span>
                        </div>
                        <div className="stat-value">{card.value}</div>
                        <p className="stat-foot">{card.foot}</p>
                      </article>
                    );
                  })}
                </div>
                <div className="climate-preview-details">
                  <p className="risk-summary">{climateRisk.summary}</p>
                  <ul className="risk-recommendations">
                    {climateRisk.recommendations.map(rec => (
                      <li key={rec}>{rec}</li>
                    ))}
                  </ul>
                  <p className="climate-note">
                    Referencia operativa: usa tus estaciones o pronósticos oficiales para decisiones críticas.
                  </p>
                  <div className={`stress-indicator stress-${climateRisk.stressIndicator.level}`}>
                    <div className="stress-score">{climateRisk.stressIndicator.score}%</div>
                    <div>
                      <div className="stress-headline">
                        <span>Indicador de estrés climático</span>
                        <button
                          type="button"
                          className="stress-info"
                          aria-label="Ver cómo se calcula el estrés climático"
                          title="Ver fórmula de cálculo"
                          onClick={() => setShowStressFormula(prev => !prev)}
                        >
                          <Info size={16} />
                        </button>
                      </div>
                      <p>{climateRisk.stressIndicator.message}</p>
                      <div className="stress-drivers">
                        {climateRisk.stressIndicator.drivers.map(driver => (
                          <span key={driver.id}>
                            {driver.label}: <strong>{driver.value}</strong>
                          </span>
                        ))}
                        <span>{climateRisk.stressIndicator.visitContext}</span>
                      </div>
                      {showStressFormula && (
                        <p className="stress-formula">
                          {climateRisk.stressIndicator.formula}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="panel-link"
                    onClick={() => onNavigate('producerClimateLab', { fincaId: selectedFinca?.id })}
                  >
                    Abrir laboratorio climático
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2 className="h2">Próximas visitas técnicas</h2>
                <button
                  type="button"
                  className="panel-link"
                  onClick={() => onNavigate('producerAlertList', { filter: 'assigned', section: 'registry' })}
                >
                  Ver agenda completa
                  <ChevronRight size={18} />
                </button>
              </div>
              {assignedAlerts.length === 0 ? (
                <div className="empty-state">
                  <Info size={24} />
                  <p>No hay visitas técnicas programadas para esta finca.</p>
                </div>
              ) : (
                <ul className="visit-list">
                  {assignedAlerts.map(alert => {
                    const countdown = getCountdown(alert.visitDate);
                    const technicianName = technicians.find(t => t.id === alert.techId)?.name || 'Asignado';
                    const noteValue = visitNotes[alert.id] || '';
                    const evidencePreview = visitEvidence[alert.id];
                    const followUpData = visitFollowups[alert.id];
                    const isFollowUpCompleted = Boolean(followUpData?.completed);
                    const alertTasks = tasksByAlert[alert.id] || [];
                    const previewTasks = alertTasks.slice(0, 3);
                    const extraTasks = alertTasks.length - previewTasks.length;

                    return (
                      <li key={alert.id} className={`visit-item ${countdown.className}`}>
                        <div className="visit-card-header">
                          <div>
                            <span className="visit-label">Alerta #{alert.id}</span>
                            <h3>Finca {alert.farmName}</h3>
                          </div>
                          <div className="visit-flags">
                            <span className={`status-pill ${alert.priority?.toLowerCase() || 'media'}`}>
                              Prioridad {alert.priority || 'Media'}
                            </span>
                            <span className={`visit-countdown ${countdown.className}`}>{countdown.text}</span>
                          </div>
                        </div>
                        <div className="visit-meta-grid">
                          <p className="visit-meta">
                            <CalendarDays size={18} /> {alert.visitDate || 'Por definir'}
                          </p>
                          <p className="visit-meta">
                            <UserCog size={18} /> {technicianName}
                          </p>
                        </div>
                        <p className="visit-comment">
                          {alert.managerComment || 'Pendiente de comentario del gerente.'}
                        </p>
                        <div className="visit-quick-actions">
                          <div className="visit-followup-field">
                            <span>Seguimiento del productor</span>
                            <button
                              type="button"
                              className={`followup-toggle ${isFollowUpCompleted ? 'is-complete' : ''}`}
                              onClick={() => onVisitFollowupToggle(alert.id)}
                            >
                              {isFollowUpCompleted ? 'Seguimiento atendido' : 'Marcar seguimiento completado'}
                            </button>
                            {followUpData?.timestamp && (
                              <small>
                                Última actualización: {new Date(followUpData.timestamp).toLocaleString()}
                              </small>
                            )}
                          </div>
                          {alertTasks.length > 0 && (
                            <div className="visit-task-reminders">
                              <span>Acciones solicitadas</span>
                              <ul>
                                {previewTasks.map(task => (
                                  <li key={task.id} className={task.status === 'completed' ? 'is-complete' : ''}>
                                    <CheckCircle2 size={14} /> {task.title}
                                  </li>
                                ))}
                              </ul>
                              {extraTasks > 0 && (
                                <small>
                                  +{extraTasks} acción{extraTasks === 1 ? '' : 'es'} más en “Tareas pendientes”.
                                </small>
                              )}
                            </div>
                          )}
                          <label className="visit-note-field">
                            <span>Tus notas rápidas</span>
                            <textarea
                              rows={3}
                              value={noteValue}
                              onChange={event => onVisitNoteChange(alert.id, event.target.value)}
                              placeholder="Ej. Recordar revisar drenajes del lote 4"
                            />
                          </label>
                          <div className="visit-evidence-field">
                            <div className="visit-evidence-actions">
                              <span>Evidencia adjunta</span>
                              <FileUploadButton
                                label="Adjuntar foto"
                                onUpload={fileData => onVisitEvidenceChange(alert.id, fileData)}
                                evidenceLoaded={Boolean(evidencePreview)}
                              />
                              {evidencePreview && (
                                <button
                                  type="button"
                                  className="visit-evidence-clear"
                                  onClick={() => onVisitEvidenceChange(alert.id, null)}
                                >
                                  Quitar archivo
                                </button>
                              )}
                            </div>
                            {evidencePreview && (
                              <div className="visit-evidence-preview">
                                <img src={evidencePreview} alt={`Evidencia adicional para la alerta ${alert.id}`} />
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="panel">
              <button
                type="button"
                className="panel-toggle"
                onClick={() => setResultsVisible(!resultsVisible)}
                aria-expanded={resultsVisible}
              >
                <div className="panel-title-row">
                  <h2 className="h2">Resultados de inspección</h2>
                  {completedAlerts.length > 0 && <span className="pill-muted">{completedAlerts.length} registros</span>}
                </div>
                <ChevronDown
                  className={`toggle-icon ${resultsVisible ? 'expanded' : ''}`}
                  size={20}
                />
              </button>
              <div className={`results-wrapper ${resultsVisible ? 'expanded' : ''}`}>
                {completedAlerts.length === 0 ? (
                  <div className="empty-state">
                    <Info size={24} />
                    <p>Aún no hay resultados de inspección disponibles para esta finca.</p>
                  </div>
                ) : (
                  completedAlerts.map(alert => {
                    const plantData = alert.inspectionData?.plant?.data;
                    if (!plantData) return null;

                    const technicianName = technicians.find(t => t.id === alert.techId)?.name || 'Equipo técnico';

                    const primaryDiagnosis = plantData.diagnosis[0];

                    return (
                      <article key={alert.id} className="result-card">
                        <header className="result-header">
                          <div className="result-title-block">
                            <span className="result-label">Alerta #{alert.id}</span>
                            <h3>Finca {alert.farmName}</h3>
                          </div>
                          <div className="result-pill-group">
                            <span className="status-pill success">Completada</span>
                            {primaryDiagnosis && (
                              <span className="result-chip">{primaryDiagnosis}</span>
                            )}
                          </div>
                        </header>
                        <div className="result-grid">
                          <div className="result-field">
                            <span className="result-label">Técnico asignado</span>
                            <p>{technicianName}</p>
                          </div>
                          <div className="result-field">
                            <span className="result-label">Diagnóstico final</span>
                            <p className="highlight">{plantData.diagnosis.join(', ')}</p>
                          </div>
                          <div className="result-field">
                            <span className="result-label">Acciones ejecutadas</span>
                            <p>{plantData.actions.join(', ')}</p>
                          </div>
                          <div className="result-stats">
                            <div>
                              <span className="result-label">Incidencia</span>
                              <strong>{plantData.incidence}%</strong>
                            </div>
                            <div>
                              <span className="result-label">Severidad</span>
                              <strong>{plantData.severity}%</strong>
                            </div>
                          </div>
                        </div>
                        <div className="result-footer">
                          <span className="result-label">Recomendaciones</span>
                          <p>{plantData.recommendations}</p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ProducerDashboard;
