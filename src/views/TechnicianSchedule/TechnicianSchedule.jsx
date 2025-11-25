import React, { useMemo } from 'react';
import {
  CalendarDays,
  Clock3,
  MapPin,
  AlertTriangle,
  ListChecks,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import './TechnicianSchedule.css';

const TechnicianSchedule = ({ technician, alerts, onNavigate }) => {
  const todayISO = new Date().toISOString().split('T')[0];

  const parseVisitDate = visitDate => (visitDate ? new Date(`${visitDate}T00:00:00`) : null);
  const formatVisitDate = visitDate => {
    if (!visitDate) return 'Sin fecha';
    return new Date(`${visitDate}T00:00:00`).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const { todayVisits, upcomingVisits, completedVisits, summary } = useMemo(() => {
    const assigned = alerts.filter(alert => alert.techId === technician.id && alert.status === 'assigned');
    const completed = alerts.filter(alert => alert.techId === technician.id && alert.status === 'completed');
    const todayList = assigned
      .filter(alert => alert.visitDate === todayISO)
      .sort((a, b) => (a.priority === 'Alta' ? -1 : 1));
    const upcomingList = assigned
      .filter(alert => alert.visitDate && alert.visitDate !== todayISO)
      .sort((a, b) => parseVisitDate(a.visitDate) - parseVisitDate(b.visitDate));
    const criticalToday = todayList.filter(alert => alert.priority === 'Alta').length;
    const nextVisit = todayList[0] || upcomingList[0] || null;
    const monthCompleted = completed.filter(alert => {
      if (!alert.date) return false;
      const alertDate = new Date(alert.date);
      const now = new Date();
      return alertDate.getMonth() === now.getMonth() && alertDate.getFullYear() === now.getFullYear();
    });
    return {
      todayVisits: todayList,
      upcomingVisits: upcomingList,
      completedVisits: completed.slice(0, 4),
      summary: {
        totalAssigned: assigned.length,
        todayCritical: criticalToday,
        nextVisit,
        monthCompleted: monthCompleted.length,
        highPriorityUpcoming: upcomingList.filter(alert => alert.priority === 'Alta').length
      }
    };
  }, [alerts, technician.id]);

  const heroStats = [
    {
      label: 'Visitas hoy',
      value: todayVisits.length,
      detail:
        todayVisits.length === 0
          ? 'Sin recorridos programados'
          : `${summary.todayCritical} críticas en agenda`,
      icon: CalendarDays
    },
    {
      label: 'Próxima visita',
      value: summary.nextVisit ? summary.nextVisit.farmName : 'Sin asignar',
      detail: summary.nextVisit ? formatVisitDate(summary.nextVisit.visitDate) : '—',
      icon: Clock3
    },
    {
      label: 'Alertas asignadas',
      value: summary.totalAssigned,
      detail: `${summary.highPriorityUpcoming} de alta prioridad`,
      icon: AlertTriangle
    },
    {
      label: 'Cerradas este mes',
      value: summary.monthCompleted,
      detail: 'Inspecciones finalizadas',
      icon: CheckCircle2
    }
  ];

  const priorityBadgeClass = priority => {
    if (priority === 'Alta') return 'priorityBadge priorityBadge--high';
    if (priority === 'Media') return 'priorityBadge priorityBadge--medium';
    return 'priorityBadge priorityBadge--low';
  };

  const renderVisitCard = (alert, variant = 'default') => (
    <li key={alert.id} className={`visitCard visitCard--${variant}`}>
      <div className="visitCard__meta">
        <span className="visitCard__date">{formatVisitDate(alert.visitDate)}</span>
        <span className={priorityBadgeClass(alert.priority || 'Media')}>
          {alert.priority || 'Media'}
        </span>
      </div>
      <h3>{alert.farmName}</h3>
      <p>Lote {alert.lote || 'N/A'}</p>
      <div className="visitCard__comment">
        <MapPin size={14} /> {alert.managerComment || 'Sin comentarios del gerente'}
      </div>
      <div className="visitCard__actions">
        <button type="button" onClick={() => onNavigate('technicianInspection', alert)}>
          {variant === 'completed' ? 'Ver reporte' : 'Abrir inspección'} <ChevronRight size={16} />
        </button>
      </div>
    </li>
  );

  return (
    <div className="techSchedule">
      <section className="techSchedule__hero">
        <div>
          <span>Mi agenda operativa</span>
          <h1>{technician.name}</h1>
          <p>
            Zona {technician.zone || 'sin asignar'} · coordina tus visitas y documenta cada hallazgo en
            tiempo real.
          </p>
        </div>
        <div className="techSchedule__stats">
          {heroStats.map(metric => {
            const Icon = metric.icon;
            return (
              <article key={metric.label}>
                <div className="techSchedule__statIcon">
                  <Icon size={18} />
                </div>
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="techSchedule__grid">
        <article className="techSchedule__card techSchedule__card--wide">
          <header>
            <div>
              <h2>Itinerario del día</h2>
              <p>
                {todayVisits.length > 0
                  ? 'Prioriza estas visitas y registra cada acción realizada.'
                  : 'Aún no se programan visitas para hoy.'}
              </p>
            </div>
            <span className="techSchedule__chip">
              <CalendarDays size={14} /> {todayVisits.length} visitas
            </span>
          </header>
          {todayVisits.length === 0 ? (
            <div className="techSchedule__empty">Sin visitas hoy.</div>
          ) : (
            <ul className="visitList">{todayVisits.map(alert => renderVisitCard(alert, 'today'))}</ul>
          )}
        </article>

        <article className="techSchedule__card">
          <header>
            <div>
              <h2>Próximas rutas</h2>
              <p>Consulta tus próximas asignaciones y realiza ajustes de logística.</p>
            </div>
          </header>
          {upcomingVisits.length === 0 ? (
            <div className="techSchedule__empty">Sin visitas próximas.</div>
          ) : (
            <ul className="timelineList">
              {upcomingVisits.slice(0, 5).map(alert => (
                <li key={alert.id}>
                  <div className="timelineList__date">{formatVisitDate(alert.visitDate)}</div>
                  <div>
                    <strong>{alert.farmName}</strong>
                    <p>Prioridad {alert.priority || 'Media'}</p>
                  </div>
                  <button type="button" onClick={() => onNavigate('technicianInspection', alert)}>
                    Detalles
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="techSchedule__card">
          <header>
            <div>
              <h2>Alertas asignadas</h2>
              <p>Estado general de tus intervenciones activas.</p>
            </div>
          </header>
          <ul className="summaryList">
            <li>
              <ListChecks size={16} /> {summary.totalAssigned} alertas vigentes
            </li>
            <li>
              <AlertTriangle size={16} /> {summary.highPriorityUpcoming} de alta prioridad
            </li>
            <li>
              <Clock3 size={16} /> Próxima visita: {summary.nextVisit ? summary.nextVisit.farmName : '—'}
            </li>
          </ul>
        </article>

        <article className="techSchedule__card techSchedule__card--wide">
          <header>
            <div>
              <h2>Bitácora de visitas</h2>
              <p>Últimos cierres registrados.</p>
            </div>
            <span className="techSchedule__chip techSchedule__chip--success">
              <CheckCircle2 size={14} /> {completedVisits.length} recientes
            </span>
          </header>
          {completedVisits.length === 0 ? (
            <div className="techSchedule__empty">Sin visitas completadas aún.</div>
          ) : (
            <ul className="visitList visitList--completed">
              {completedVisits.map(alert => renderVisitCard(alert, 'completed'))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
};

export default TechnicianSchedule;
