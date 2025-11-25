import React, { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock3,
  ListChecks,
  Users,
  MapPin
} from 'lucide-react';
import './TechnicianPerformanceDashboard.css';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';

const diffDays = (start, end) => {
  if (!start || !end) return null;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.max(0, (b - a) / (1000 * 60 * 60 * 24));
};

const formatNumber = (value, digits = 1) =>
  value === null || Number.isNaN(value) ? '—' : Number(value).toFixed(digits);

const formatDayValue = value => {
  if (value === null || Number.isNaN(value)) return '—';
  const digits = Math.abs(value) >= 10 ? 0 : 1;
  return `${Number(value).toFixed(digits)} días`;
};

const formatPluralLabel = (value, singular, plural) =>
  `${value} ${value === 1 ? singular : plural}`;

const TechnicianPerformanceDashboard = ({
  technicians,
  alerts,
  tasks,
  technicianActions = [],
  onNavigate,
  pageData
}) => {
  const [zoneFilter, setZoneFilter] = useState('all');
  const focusTechnicianId = pageData?.focusTechnicianId;

  useEffect(() => {
    if (!focusTechnicianId) return;
    setZoneFilter('all');
    const node = document.getElementById(`tech-card-${focusTechnicianId}`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusTechnicianId]);

  const performanceRows = useMemo(() => {
    return technicians.map(tech => {
      const assignedAlerts = alerts.filter(alert => alert.techId === tech.id);
      const pendingAlerts = assignedAlerts.filter(alert => alert.status !== 'completed');
      const completedAlerts = assignedAlerts.filter(alert => alert.status === 'completed');

      const responseTimes = assignedAlerts
        .map(alert => diffDays(alert.date, alert.visitDate))
        .filter(Boolean);
      const completionTimes = completedAlerts
        .map(alert =>
          diffDays(alert.date, alert.inspectionData?.plant?.data?.completedAt || alert.visitDate)
        )
        .filter(Boolean);

      const technicianTasks = tasks.filter(task => {
        if (task.owner !== 'technician') return false;
        const alert = assignedAlerts.find(a => a.id === task.alertId);
        return Boolean(alert);
      });
      const backlogTasks = technicianTasks.filter(task => task.status !== 'completed');
      const actionsPending = technicianActions.filter(
        action => action.techId === tech.id && action.status !== 'validated'
      );

      const slaHits = responseTimes.filter(time => time <= 2).length;
      const slaRate = responseTimes.length ? Math.round((slaHits / responseTimes.length) * 100) : 0;

      return {
        id: tech.id,
        name: tech.name,
        zone: tech.zone || 'N/D',
        assigned: assignedAlerts.length,
        pending: pendingAlerts.length,
        responseAvg: responseTimes.length
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : null,
        completionAvg: completionTimes.length
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : null,
        tasksBacklog: backlogTasks.length,
        actionsPending: actionsPending.length,
        slaRate,
        alertsCompleted: completedAlerts.length
      };
    });
  }, [alerts, tasks, technicianActions, technicians]);

  const filteredRows =
    zoneFilter === 'all'
      ? performanceRows
      : performanceRows.filter(row => row.zone?.toLowerCase() === zoneFilter.toLowerCase());

  const heroMetrics = useMemo(() => {
    const totalAlerts = performanceRows.reduce((acc, row) => acc + row.assigned, 0);
    const totalCompleted = performanceRows.reduce((acc, row) => acc + row.alertsCompleted, 0);
    const avgResponse =
      performanceRows.reduce((acc, row) => acc + (row.responseAvg || 0), 0) /
      (performanceRows.filter(row => row.responseAvg).length || 1);
    const backlog =
      performanceRows.reduce((acc, row) => acc + row.tasksBacklog + row.actionsPending, 0) || 0;

    return [
      {
        icon: Activity,
        label: 'Alertas monitoreadas',
        value: totalAlerts,
        detail: `${totalCompleted} cerradas`
      },
      {
        icon: Clock3,
        label: 'Tiempo respuesta prom.',
        value: `${formatNumber(avgResponse)} d`,
        detail: 'Desde registro hasta visita'
      },
      {
        icon: ListChecks,
        label: 'Backlog técnico',
        value: backlog,
        detail: 'Tareas + acciones pendientes'
      },
      {
        icon: Users,
        label: 'Equipo activo',
        value: technicians.length,
        detail: `${zoneFilter === 'all' ? 'Todas las zonas' : `Zona ${zoneFilter}`}`
      }
    ];
  }, [performanceRows, technicians.length, zoneFilter]);

  const zoneOptions = useMemo(() => {
    const zones = Array.from(new Set(technicians.map(tech => tech.zone).filter(Boolean)));
    return [{ value: 'all', label: 'Todas las zonas' }, ...zones.map(zone => ({ value: zone, label: `Zona ${zone}` }))];
  }, [technicians]);

  const filterSelectGroups = useMemo(
    () => [
      {
        id: 'zone',
        label: 'Zona',
        icon: MapPin,
        value: zoneFilter,
        onChange: event => setZoneFilter(event.target.value),
        options: zoneOptions
      }
    ],
    [zoneFilter, zoneOptions]
  );

  return (
    <div className="techPerformance">
      <section className="techPerformance__hero">
        <div className="techPerformance__heroCopy">
          <span className="techPerformance__heroEyebrow">Panel gerencial</span>
          <h1>Desempeño de técnicos en campo</h1>
          <p>
            Evalúa tiempos de respuesta, carga operativa y backlog por técnico para priorizar
            soporte y capacitación.
          </p>
          <div className="techPerformance__heroDeck">
            <article>
              <strong>Prioriza zonas críticas</strong>
              <small>Filtra por zona para ubicar quién necesita refuerzo.</small>
            </article>
            <article>
              <strong>Monitorea el backlog</strong>
              <small>Combina tareas y acciones pendientes para cada técnico.</small>
            </article>
          </div>
        </div>
        <div className="techPerformance__heroStats">
          {heroMetrics.map(({ icon: StatIcon, label, value, detail }) => (
            <article key={label}>
              <div className="techPerformance__statIcon">
                <StatIcon size={18} />
              </div>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{detail}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="techPerformance__filters">
        <FilterPanel className="techPerformance__filtersPanel" selectGroups={filterSelectGroups} />
      </section>

      <section className="techPerformance__grid">
        {filteredRows.map(row => (
          <article
            key={row.id}
            id={`tech-card-${row.id}`}
            className={`techPerformance__card ${
              row.id === focusTechnicianId ? 'is-focused' : ''
            }`}
          >
            <header className="techPerformance__cardHeader">
              <div>
                <p className="techPerformance__zoneBadge">Zona {row.zone}</p>
                <h2>{row.name}</h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    'technicianSchedule',
                    technicians.find(t => t.id === row.id) || null
                  )
                }
              >
                Ver agenda <ArrowRight size={16} />
              </button>
            </header>

            <div className="techPerformance__metrics">
              <article>
                <div>
                  <span>Alertas activas</span>
                  <strong>{row.pending}</strong>
                </div>
                <p>{formatPluralLabel(row.assigned, 'asignada total', 'asignadas totales')}</p>
              </article>
              <article>
                <div>
                  <span>Resp. promedio</span>
                  <strong>{formatDayValue(row.responseAvg)}</strong>
                </div>
                <p>Dentro de SLA: {row.slaRate}%</p>
              </article>
              <article>
                <div>
                  <span>Cierre promedio</span>
                  <strong>{formatDayValue(row.completionAvg)}</strong>
                </div>
                <p>Desde registro</p>
              </article>
              <article>
                <div>
                  <span>Backlog</span>
                  <strong>{row.tasksBacklog + row.actionsPending}</strong>
                </div>
                <p>
                  {formatPluralLabel(row.tasksBacklog, 'tarea', 'tareas')} ·{' '}
                  {formatPluralLabel(row.actionsPending, 'acción', 'acciones')}
                </p>
              </article>
            </div>

            <div className="techPerformance__bar">
              <div className="techPerformance__barLabel">
                <CheckCircle2 size={14} /> SLA cumplido
              </div>
              <div className="techPerformance__progress">
                <div style={{ width: `${row.slaRate}%` }} />
              </div>
            </div>

            <div className="techPerformance__footer">
              <span>
                <AlertTriangle size={14} /> {row.pending} alertas requieren seguimiento inmediato.
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default TechnicianPerformanceDashboard;
