import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Users,
  CalendarDays,
  Activity,
  ClipboardList,
  MapPin,
  ArrowRight,
  BarChart2,
  FileDown
} from 'lucide-react';
import './ManagerDashboard.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';

const STATUS_META = {
  pending: { label: 'Pendiente', tone: 'is-pending' },
  assigned: { label: 'Asignada', tone: 'is-assigned' },
  completed: { label: 'Completada', tone: 'is-completed' }
};

const formatMonthLabel = (date) => {
  const month = date.toLocaleString('es-ES', { month: 'long' });
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`;
};

const ManagerDashboard = ({
  alerts,
  visits,
  technicians,
  tasks,
  producers,
  containmentPlans,
  onNavigate
}) => {
  const heroRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [producerFilter, setProducerFilter] = useState('all');

  const statusCounts = useMemo(() => {
    const pending = alerts.filter(alert => alert.status === 'pending').length;
    const assigned = alerts.filter(alert => alert.status === 'assigned').length;
    const completed = alerts.filter(alert => alert.status === 'completed').length;
    return {
      all: alerts.length,
      pending,
      assigned,
      completed
    };
  }, [alerts]);

  const producerSelectOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos los productores' },
      ...producers.map(producer => ({
        value: String(producer.id),
        label: producer.owner || producer.name || 'Productor'
      }))
    ],
    [producers]
  );

  const filteredTimelineAlerts = useMemo(
    () =>
      alerts.filter(alert => {
        const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
        const matchesProducer =
          producerFilter === 'all' || String(alert.producerId) === producerFilter;
        return matchesStatus && matchesProducer;
      }),
    [alerts, statusFilter, producerFilter]
  );
  const heroStats = useMemo(() => {
    const activeAlerts = alerts.filter(alert => alert.status !== 'completed').length;
    const criticalAlerts = alerts.filter(alert => (alert.priority || '').toLowerCase() === 'alta').length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const assignedAlerts = alerts.filter(alert => alert.status === 'assigned').length;
    const avgWorkload = technicians.length ? (assignedAlerts / technicians.length).toFixed(1) : 0;

    const now = new Date();
    const upcomingVisits = visits.filter(visit => {
      if (!visit.entryTime) return false;
      const visitDate = new Date(visit.entryTime);
      const diffDays = (visitDate - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    const pendingVisits = visits.filter(visit => visit.status === 'PENDING').length;

    return [
      {
        icon: AlertTriangle,
        label: 'Alertas activas',
        value: activeAlerts,
        detail: `${criticalAlerts} críticas`,
        tone: 'warning'
      },
      {
        icon: ShieldCheck,
        label: 'Cumplimiento acciones',
        value: `${completionRate}%`,
        detail: `${completedTasks}/${totalTasks || 0} tareas`,
        tone: 'success'
      },
      {
        icon: Users,
        label: 'Técnicos operando',
        value: technicians.length,
        detail: `${avgWorkload} alertas/tec.`,
        tone: 'indigo'
      },
      {
        icon: CalendarDays,
        label: 'Visitas próximas',
        value: upcomingVisits,
        detail: `${pendingVisits} pendientes`,
        tone: 'info'
      }
    ];
  }, [alerts, tasks, technicians, visits]);

  const controlBoard = useMemo(() => {
    return producers.map(producer => {
      const producerAlerts = alerts.filter(alert => alert.producerId === producer.id);
      const openAlerts = producerAlerts.filter(alert => alert.status !== 'completed');
      const highPriority = producerAlerts.filter(alert => (alert.priority || '').toLowerCase() === 'alta');

      const producerTasks = tasks.filter(task => task.producerId === producer.id);
      const completedTasks = producerTasks.filter(task => task.status === 'completed');
      const completionRate = producerTasks.length
        ? Math.round((completedTasks.length / producerTasks.length) * 100)
        : 0;

      const producerPlans = containmentPlans.filter(plan => plan.producerId === producer.id);
      const activePlans = producerPlans.filter(plan => plan.status !== 'completed');

      const pendingProducerVisits = visits.filter(
        visit => visit.producerId === producer.id && visit.status === 'PENDING'
      );

      const fincaBreakdown = producer.fincas.map(finca => {
        const fincaAlerts = producerAlerts.filter(alert => alert.fincaId === finca.id);
        const open = fincaAlerts.filter(alert => alert.status !== 'completed').length;
        const critical = fincaAlerts.filter(alert => (alert.priority || '').toLowerCase() === 'alta').length;
        return {
          id: finca.id,
          name: finca.name,
          open,
          critical,
          hectares: finca.hectares
        };
      });

      const assignedTechnicians = Array.from(
        new Set(producerAlerts.map(alert => alert.techId).filter(Boolean))
      ).map(techId => ({
        id: techId,
        name: technicians.find(tech => tech.id === techId)?.name || 'Técnico asignado'
      }));

      return {
        id: producer.id,
        owner: producer.owner,
        fincas: producer.fincas.length,
        openAlerts: openAlerts.length,
        highPriority: highPriority.length,
        completionRate,
        activePlans: activePlans.length,
        pendingVisits: pendingProducerVisits.length,
        fincaBreakdown,
        assignedTechnicians
      };
    });
  }, [alerts, tasks, containmentPlans, visits, producers, technicians]);

  const ctaTargets = useMemo(() => {
    let fincaTarget = null;
    controlBoard.forEach(card => {
      card.fincaBreakdown.forEach(finca => {
        const score = finca.critical * 10 + finca.open;
        if (!fincaTarget || score > fincaTarget.score) {
          fincaTarget = { id: finca.id, score };
        }
      });
    });

    let technicianTarget = null;
    technicians.forEach(tech => {
      const pending = alerts.filter(alert => alert.techId === tech.id && alert.status !== 'completed').length;
      if (!technicianTarget || pending > technicianTarget.pending) {
        technicianTarget = { id: tech.id, pending };
      }
    });

    return {
      focusFincaId: fincaTarget?.id || null,
      focusTechnicianId: technicianTarget?.id || null
    };
  }, [alerts, controlBoard, technicians]);

  const timelineGroups = useMemo(() => {
    const groups = new Map();
    const sortedAlerts = [...filteredTimelineAlerts].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedAlerts.forEach(alert => {
      const date = alert.date ? new Date(alert.date) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups.has(key)) {
        groups.set(key, { key, label: formatMonthLabel(date), alerts: [] });
      }
      groups.get(key).alerts.push(alert);
    });
    return Array.from(groups.values());
  }, [filteredTimelineAlerts]);

  const timelinePillGroups = [
    {
      id: 'timeline-status',
      label: 'Estado',
      items: [
        { id: 'status-all', value: 'all', label: `Todas (${statusCounts.all})` },
        { id: 'status-pending', value: 'pending', label: `Pendientes (${statusCounts.pending})` },
        { id: 'status-assigned', value: 'assigned', label: `Asignadas (${statusCounts.assigned})` },
        { id: 'status-completed', value: 'completed', label: `Completadas (${statusCounts.completed})` }
      ].map(option => ({
        id: option.id,
        label: option.label,
        active: statusFilter === option.value,
        onClick: () => setStatusFilter(option.value)
      }))
    }
  ];

  const timelineSelectGroups = [
    {
      id: 'timeline-producer',
      label: 'Productor',
      value: producerFilter,
      onChange: (event) => setProducerFilter(event.target.value),
      icon: Users,
      options: producerSelectOptions
    }
  ];

  const handleHeroExport = async () => {
    if (!heroRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(heroRef.current, { scale: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 10, width, height, undefined, 'FAST');
      pdf.save('resumen-gerencial.pdf');
    } catch (error) {
      console.error('No se pudo exportar el resumen gerencial', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="managerDashboard">
      <section className="managerDashboard__hero">
        <div className="managerDashboard__heroPattern" aria-hidden="true" />
        <div className="managerDashboard__heroContent" ref={heroRef}>
          <div>
            <span className="managerDashboard__heroEyebrow">Panel Ejecutivo</span>
            <h1>Monitoreo integral de bioseguridad</h1>
          <p>
            Visualiza el estado consolidado de alertas, acciones correctivas y visitas para
            priorizar recursos en campo.
          </p>
          <div className="managerDashboard__heroActions">
            <button type="button" onClick={handleHeroExport} disabled={exporting}>
              <FileDown size={16} /> {exporting ? 'Generando PDF...' : 'Exportar resumen'}
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'fincaExecutiveSummary',
                  ctaTargets.focusFincaId ? { focusFincaId: ctaTargets.focusFincaId, initialSelection: [ctaTargets.focusFincaId] } : null
                )
              }
            >
              Resumen por finca <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  'technicianPerformance',
                  ctaTargets.focusTechnicianId ? { focusTechnicianId: ctaTargets.focusTechnicianId } : null
                )
              }
            >
              Desempeño técnico <BarChart2 size={16} />
            </button>
          </div>
          <div className="managerDashboard__heroStats">
            {heroStats.map(({ icon: StatIcon, label, value, detail, tone }) => (
              <article
                  key={label}
                  className={`managerDashboard__statCard managerDashboard__statCard--${tone}`}
                >
                  <div className="managerDashboard__statIcon">
                    <StatIcon size={20} />
                  </div>
                  <div className="managerDashboard__statText">
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>{detail}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="managerDashboard__section">
        <header className="managerDashboard__sectionHeader">
          <div>
            <p>Control operativo por finca</p>
            <h2>Situación actual de productores</h2>
          </div>
          <button type="button" className="managerDashboard__link" onClick={() => onNavigate('alertTriage')}>
            Ir a gestión de alertas <ArrowRight size={16} />
          </button>
        </header>
        <div className="managerDashboard__controlGrid">
          {controlBoard.map(card => (
            <article key={card.id} className="controlCard">
              <div className="controlCard__header">
                <div>
                  <h3>{card.owner}</h3>
                  <span>{card.fincas} fincas · {card.openAlerts} alertas abiertas</span>
                </div>
                <span className={`controlCard__badge ${card.highPriority ? 'has-critical' : ''}`}>
                  {card.highPriority} críticas
                </span>
              </div>
              <div className="controlCard__stats">
                <div>
                  <span className="label">Acciones completadas</span>
                  <strong>{card.completionRate}%</strong>
                  <small>Plan correctivo</small>
                </div>
                <div>
                  <span className="label">Planes activos</span>
                  <strong>{card.activePlans}</strong>
                  <small>Contención</small>
                </div>
                <div>
                  <span className="label">Visitas pendientes</span>
                  <strong>{card.pendingVisits}</strong>
                  <small>Autorizaciones</small>
                </div>
              </div>
              <ul className="controlCard__fincas">
                {card.fincaBreakdown.map(finca => (
                  <li key={finca.id}>
                    <div className="controlCard__fincaInfo">
                      <div>
                        <span>{finca.name}</span>
                        <small>
                          {finca.open} abiertas · {finca.critical} críticas
                        </small>
                      </div>
                      <div className="controlCard__fincaMeta">
                        <MapPin size={14} />
                        <span>{finca.hectares} ha</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate('fincaExecutiveSummary', {
                          focusFincaId: finca.id,
                          initialSelection: [finca.id]
                        })
                      }
                    >
                      Ver resumen
                    </button>
                  </li>
                ))}
              </ul>
              {card.assignedTechnicians.length > 0 && (
                <div className="controlCard__techActions">
                  <span>Técnicos asignados</span>
                  <div>
                    {card.assignedTechnicians.map(tech => (
                      <button
                        key={tech.id}
                        type="button"
                        onClick={() => onNavigate('technicianPerformance', { focusTechnicianId: tech.id })}
                      >
                        {tech.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="managerDashboard__section">
        <header className="managerDashboard__sectionHeader">
          <div>
            <p>Registro consolidado</p>
            <h2>Histórico de alertas</h2>
          </div>
          <button
            type="button"
            className="managerDashboard__link"
            onClick={() => onNavigate('producerAlertList')}
          >
            Ver detalle de alertas <ArrowRight size={16} />
          </button>
        </header>
        <FilterPanel
          className="managerDashboard__timelineFilters"
          pillGroups={timelinePillGroups}
          selectGroups={timelineSelectGroups}
        />
        {timelineGroups.length === 0 ? (
          <div className="managerDashboard__empty">
            <ClipboardList size={40} />
            <p>Sin alertas registradas todavía.</p>
          </div>
        ) : (
          <div className="managerDashboard__timeline">
            {timelineGroups.map(group => (
              <section key={group.key} className="managerDashboard__timelineGroup">
                <header>
                  <span>{group.label}</span>
                  <small>{group.alerts.length} registros</small>
                </header>
                <div className="managerDashboard__timelineGrid">
                  {group.alerts.map(alert => {
                    const status = STATUS_META[alert.status] || STATUS_META.pending;
                    return (
                      <article key={alert.id} className={`timelineCard timelineCard--${alert.status || 'default'}`}>
                        <div className="timelineCard__header">
                          <div>
                            <span className="timelineCard__date">
                              {alert.date ? new Date(alert.date).toLocaleDateString('es-EC', {
                                day: '2-digit',
                                month: 'short'
                              }) : 'Sin fecha'}
                            </span>
                            <p>{alert.farmName}</p>
                          </div>
                          <span className={`timelineCard__status ${status.tone}`}>{status.label}</span>
                        </div>
                        <div className="timelineCard__meta">
                          <span>
                            <AlertTriangle size={14} /> {alert.priority || 'Sin prioridad'}
                          </span>
                          <span>
                            <Activity size={14} /> {alert.lote}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ManagerDashboard;
