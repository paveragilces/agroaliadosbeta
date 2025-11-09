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
  UserCog
} from 'lucide-react';
import './ProducerDashboard.css';

const ProducerDashboard = ({ producer, alerts, visits, tasks, technicians, onNavigate }) => {
  const [selectedFincaFilter, setSelectedFincaFilter] = useState('all');
  const [resultsVisible, setResultsVisible] = useState(true);

  const fincaOptions = useMemo(
    () => [{ id: 'all', name: 'Todas mis Fincas' }, ...producer.fincas],
    [producer.fincas]
  );

  const { filteredAlerts, filteredVisits, filteredTasks } = useMemo(() => {
    const myAlerts = alerts.filter(alert => alert.producerId === producer.id);
    const myVisits = visits.filter(visit => visit.producerId === producer.id);
    const myTasks = tasks.filter(task => task.producerId === producer.id);

    const alertsByFinca = myAlerts.filter(alert =>
      selectedFincaFilter === 'all' || alert.fincaId === selectedFincaFilter
    );

    const visitsByFinca = myVisits.filter(visit =>
      selectedFincaFilter === 'all' || visit.fincaId === selectedFincaFilter
    );

    const tasksByFinca = myTasks.filter(task => {
      if (selectedFincaFilter === 'all') return true;
      const relatedAlert = myAlerts.find(alert => alert.id === task.alertId);
      return relatedAlert?.fincaId === selectedFincaFilter;
    });

    return {
      filteredAlerts: alertsByFinca,
      filteredVisits: visitsByFinca,
      filteredTasks: tasksByFinca
    };
  }, [alerts, visits, tasks, producer.id, selectedFincaFilter]);

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

  return (
    <div className="producer-dashboard-page container">
      <header className="dashboard-header">
        <div className="header-text">
          <span className="welcome">Bienvenido de vuelta</span>
          <h1 className="h1">Dashboard del Productor</h1>
          <div className="header-meta">
            <span><User size={18} /> {producer.owner}</span>
            <span><MapPin size={18} /> {producer.fincas.length} fincas activas</span>
            <span><AlertTriangle size={18} /> {pendingAlerts.length} alertas sin registrar</span>
          </div>
        </div>
        <div className="quick-actions">
          <button
            type="button"
            className="quick-action"
            onClick={() => onNavigate('reportAlert')}
          >
            <FilePlus size={18} /> Registrar alerta
          </button>
          <button
            type="button"
            className="quick-action secondary"
            onClick={() => onNavigate('producerAlertList')}
          >
            <History size={18} /> Ver historial
          </button>
        </div>
      </header>

      <section className="filters">
        <label htmlFor="fincaFilter" className="label">Filtrar por finca</label>
        <div className="filter-pills">
          {fincaOptions.map(finca => (
            <button
              key={finca.id}
              id={finca.id === 'all' ? 'fincaFilter' : undefined}
              type="button"
              className={`filter-pill ${selectedFincaFilter === finca.id ? 'active' : ''}`}
              onClick={() => setSelectedFincaFilter(finca.id)}
            >
              {finca.name}
            </button>
          ))}
        </div>
      </section>

      <section className="kpi-grid">
        <article
          className={`kpi-card ${pendingAlerts.length ? 'is-warning' : ''}`}
          onClick={() => onNavigate('reportAlert')}
        >
          <div className="kpi-header">
            <AlertTriangle size={20} />
            <span>Alertas pendientes de registro</span>
          </div>
          <p className="kpi-value">{pendingAlerts.length}</p>
          <p className="kpi-description">
            Registra nuevas alertas para iniciar el seguimiento con el equipo técnico.
          </p>
        </article>
        <article
          className={`kpi-card ${pendingTasks.length ? 'is-caution' : ''}`}
          onClick={() => onNavigate('producerTasks', { filter: 'pending' })}
        >
          <div className="kpi-header">
            <ListChecks size={20} />
            <span>Tareas pendientes</span>
          </div>
          <p className="kpi-value">{pendingTasks.length}</p>
          <p className="kpi-description">
            Revisa las acciones solicitadas para tus fincas y marca las completadas.
          </p>
        </article>
        <article
          className={`kpi-card ${pendingVisits.length ? 'is-caution' : ''}`}
          onClick={() => onNavigate('visitorApproval', { filter: 'PENDING' })}
        >
          <div className="kpi-header">
            <CalendarClock size={20} />
            <span>Visitas por aprobar</span>
          </div>
          <p className="kpi-value">{pendingVisits.length}</p>
          <p className="kpi-description">
            Asegura el acceso del personal externo con anticipación.
          </p>
        </article>
        <article className="kpi-card" onClick={() => onNavigate('producerCertification')}>
          <div className="kpi-header">
            <Medal size={20} />
            <span>Mi certificación</span>
          </div>
          <p className="kpi-value">92%</p>
          <p className="kpi-description">
            Consulta los requisitos cumplidos y próximos hitos.
          </p>
        </article>
      </section>

      <section className="content-grid">
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

                return (
                  <li key={alert.id} className={`visit-item ${countdown.className}`}>
                    <div className="visit-main">
                      <h3>Alerta #{alert.id} · {alert.farmName}</h3>
                      <p className="visit-meta">
                        <CalendarDays size={18} /> {alert.visitDate || 'Por definir'}
                      </p>
                      <p className="visit-meta">
                        <UserCog size={18} /> {technicianName}
                      </p>
                      <p className="visit-comment">
                        {alert.managerComment || 'Pendiente de comentario del gerente.'}
                      </p>
                    </div>
                    <div className="visit-status">
                      <span className={`status-pill ${alert.priority?.toLowerCase() || 'media'}`}>
                        Prioridad {alert.priority || 'Media'}
                      </span>
                      <span className={`countdown ${countdown.className}`}>{countdown.text}</span>
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
            <h2 className="h2">Resultados de inspección ({completedAlerts.length})</h2>
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

                return (
                  <article key={alert.id} className="result-card">
                    <header className="result-header">
                      <h3>Alerta #{alert.id} · {alert.farmName}</h3>
                      <span className="status-pill success">Completada</span>
                    </header>
                    <div className="result-grid">
                      <div>
                        <span className="result-label">Técnico asignado</span>
                        <p>{technicianName}</p>
                      </div>
                      <div>
                        <span className="result-label">Diagnóstico final</span>
                        <p className="highlight">{plantData.diagnosis.join(', ')}</p>
                      </div>
                      <div>
                        <span className="result-label">Acciones ejecutadas</span>
                        <p>{plantData.actions.join(', ')}</p>
                      </div>
                      <div className="result-metrics">
                        <span className="result-label">Incidencia</span>
                        <strong>{plantData.incidence}%</strong>
                        <span className="result-label">Severidad</span>
                        <strong>{plantData.severity}%</strong>
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
    </div>
  );
};

export default ProducerDashboard;