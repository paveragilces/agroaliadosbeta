import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  ClipboardCheck,
  CalendarDays,
  Activity,
  CalendarClock,
  ListChecks,
  History,
  Map as MapIcon,
  BookOpenCheck
} from 'lucide-react';
import FileUploadButton from '../../components/ui/FileUploadButton';
import './TechnicianCommandCenter.css';

const RISK_OPTIONS = [
  { value: 'low', label: 'Bajo' },
  { value: 'medium', label: 'Medio' },
  { value: 'high', label: 'Alto' }
];

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'urgent', label: 'Urgente' }
];

const TechnicianCommandCenter = ({
  currentUser,
  alerts = [],
  visits = [],
  tasks = [],
  technicianActions = [],
  onLogActionProgress,
  onSubmitAction,
  onUpdateActionMeta
}) => {
  const [actionNotes, setActionNotes] = useState({});
  const [validationNotes, setValidationNotes] = useState({});

  const formatActionStatus = status => {
    switch ((status || '').toLowerCase()) {
      case 'assigned':
        return 'Asignada';
      case 'in_progress':
        return 'En progreso';
      case 'pending_validation':
        return 'Pendiente de validación';
      case 'validated':
        return 'Validada';
      default:
        return status || 'N/A';
    }
  };

  const handleProgressSubmit = (event, actionId) => {
    event.preventDefault();
    if (!onLogActionProgress) return;
    const note = (actionNotes[actionId] || '').trim();
    if (!note) return;
    onLogActionProgress(actionId, note);
    setActionNotes(prev => ({ ...prev, [actionId]: '' }));
  };

  const handleValidationSubmit = (event, actionId) => {
    event.preventDefault();
    if (!onSubmitAction) return;
    const note = (validationNotes[actionId] || '').trim();
    onSubmitAction(actionId, note);
    setValidationNotes(prev => ({ ...prev, [actionId]: '' }));
  };

  const handleMetaChange = (actionId, meta) => {
    if (!onUpdateActionMeta) return;
    onUpdateActionMeta(actionId, meta);
  };

  const stats = useMemo(() => {
    const assignedAlerts = alerts.filter(alert => alert.techId === currentUser.id);
    const pending = assignedAlerts.filter(alert => alert.status === 'pending');
    const inProgress = assignedAlerts.filter(alert => alert.status === 'assigned');
    const completed = assignedAlerts.filter(alert => alert.status === 'completed');
    const critical = assignedAlerts.filter(
      alert => (alert.priority || '').toLowerCase() === 'alta'
    );
    const farms = new Set(assignedAlerts.map(alert => alert.farmName)).size;
    const nextVisit = assignedAlerts
      .map(alert => alert.visitDate)
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))[0];
    const tasksForAlerts = tasks.filter(task =>
      assignedAlerts.some(alert => alert.id === task.alertId)
    );
    const technicianOwnedTasks = tasksForAlerts.filter(
      task => (task.owner || 'producer') === 'technician'
    );
    const checklist = technicianOwnedTasks.filter(task => task.status !== 'completed');

    const recentVisits = visits
      .filter(visit => visit.techId === currentUser.id)
      .sort((a, b) => new Date(b.entryTime || b.date || 0) - new Date(a.entryTime || a.date || 0))
      .slice(0, 5)
      .map(visit => ({
        id: visit.id,
        finca: visit.fincaName || visit.fincaId,
        purpose: visit.purpose,
        status: visit.status
      }));

    const agenda = assignedAlerts
      .filter(alert => alert.visitDate)
      .sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate))
      .slice(0, 4)
      .map(alert => ({
        id: alert.id,
        date: alert.visitDate,
        priority: alert.priority,
        finca: alert.farmName,
        lote: alert.lote
      }));

    const activeAlerts = assignedAlerts.filter(alert => alert.status !== 'completed');
    const history = assignedAlerts
      .filter(alert => alert.status === 'completed')
      .sort(
        (a, b) =>
          new Date(b.inspectionData?.plant?.data?.completedAt || b.date) -
          new Date(a.inspectionData?.plant?.data?.completedAt || a.date)
      )
      .slice(0, 4);

    const coverageMap = new Map();
    assignedAlerts.forEach(alert => {
      coverageMap.set(alert.farmName, (coverageMap.get(alert.farmName) || 0) + 1);
    });
    const coverage = Array.from(coverageMap.entries())
      .map(([farm, count]) => ({ farm, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const actionsForTech = technicianActions.filter(action => action.techId === currentUser.id);
    const actionsSummary = {
      total: actionsForTech.length,
      pending: actionsForTech.filter(action => action.status === 'assigned').length,
      inProgress: actionsForTech.filter(action => action.status === 'in_progress').length,
      waitingValidation: actionsForTech.filter(action => action.status === 'pending_validation').length
    };

    return {
      pending: pending.length,
      inProgress: inProgress.length,
      completed: completed.length,
      critical: critical.length,
      farms,
      nextVisit,
      agenda,
      activeAlerts,
      checklist,
      history,
      coverage,
      tasksGenerated: tasksForAlerts.length,
      recentVisits,
      actions: actionsForTech,
      actionsSummary
    };
  }, [alerts, currentUser.id, tasks, technicianActions, visits]);

  const sectionNav = [
    { id: 'agenda', label: 'Agenda', icon: CalendarClock },
    { id: 'alertas', label: 'Alertas activas', icon: AlertTriangle },
    { id: 'checklist', label: 'Checklist', icon: ListChecks },
    { id: 'acciones', label: 'Acciones técnicas', icon: ClipboardCheck },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'cobertura', label: 'Cobertura', icon: MapIcon },
    { id: 'visitas', label: 'Visitas', icon: BookOpenCheck }
  ];

  return (
    <div className="technicianCommand">
      <section className="technicianCommand__hero">
        <div>
          <span>Panel operativo</span>
          <h1>{currentUser.name}</h1>
          <p>
            Maneja tu carga operativa, revisa próximas visitas y lleva control de tus alertas
            asignadas.
          </p>
        </div>
        <div className="technicianCommand__stats">
          {[
            { label: 'Alertas pendientes', value: stats.pending, icon: AlertTriangle },
            { label: 'Alertas en curso', value: stats.inProgress, icon: Activity },
            { label: 'Alertas cerradas', value: stats.completed, icon: ClipboardCheck },
            { label: 'Fincas atendidas', value: stats.farms, icon: MapPin },
            { label: 'Acciones técnicas', value: stats.actionsSummary.total, icon: CalendarDays }
          ].map(metric => {
            const Icon = metric.icon;
            return (
              <article key={metric.label}>
                <div className="statIcon">
                  <Icon size={16} />
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

      <nav className="technicianCommand__nav">
        {sectionNav.map(link => {
          const Icon = link.icon;
          return (
            <a key={link.id} href={`#${link.id}`}>
              <Icon size={14} /> {link.label}
            </a>
          );
        })}
      </nav>

      <section className="technicianCommand__grid">
        <article className="profileCard" id="alertas">
          <header className="sectionHeader">
            <div>
              <h2>Seguimiento operativo</h2>
              <p>
                {stats.critical} alertas críticas · próxima visita:{' '}
                {stats.nextVisit ? new Date(stats.nextVisit).toLocaleDateString() : 'Sin asignar'}
              </p>
            </div>
          </header>
          <ul className="profileList">
            <li>
              <span>Alertas pendientes</span>
              <strong>{stats.pending}</strong>
            </li>
            <li>
              <span>Alertas en curso</span>
              <strong>{stats.inProgress}</strong>
            </li>
            <li>
              <span>Alertas completadas</span>
              <strong>{stats.completed}</strong>
            </li>
            <li>
              <span>Alertas críticas</span>
              <strong>{stats.critical}</strong>
            </li>
            <li>
              <span>Tareas generadas</span>
              <strong>{stats.tasksGenerated}</strong>
            </li>
          </ul>
        </article>

        <article className="profileCard" id="visitas">
          <header className="sectionHeader">
            <div>
              <h2>Visitas recientes</h2>
              <p>Últimas coordinaciones en finca</p>
            </div>
          </header>
          {stats.recentVisits.length === 0 ? (
            <p className="muted">No hay visitas registradas.</p>
          ) : (
            <ul className="profileList profileList--stacked">
              {stats.recentVisits.map(visit => (
                <li key={visit.id}>
                  <span>{visit.finca}</span>
                  <small>
                    {visit.purpose} · {visit.status}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="technicianCommand__grid">
        <article className="profileCard" id="agenda">
          <header className="sectionHeader">
            <div>
              <h2>Agenda próxima</h2>
              <p>Visitas programadas y su prioridad</p>
            </div>
          </header>
          {stats.agenda.length === 0 ? (
            <p className="muted">Aún no hay visitas asignadas.</p>
          ) : (
            <ul className="profileList profileList--stacked">
              {stats.agenda.map(item => (
                <li key={item.id}>
                  <span>
                    {new Date(item.date).toLocaleDateString()} · {item.finca}
                  </span>
                  <small>
                    Lote {item.lote} · Prioridad {item.priority || 'Media'}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="profileCard">
          <header className="sectionHeader">
            <div>
              <h2>Alertas en curso</h2>
              <p>Alertas asignadas con prioridad</p>
            </div>
          </header>
          {stats.activeAlerts.length === 0 ? (
            <p className="muted">No hay alertas activas.</p>
          ) : (
            <ul className="profileList profileList--stacked">
              {stats.activeAlerts.map(alert => (
                <li key={alert.id}>
                  <span>
                    #{alert.id} · {alert.farmName}
                  </span>
                  <small>
                    Prioridad {alert.priority || 'Media'} · {alert.symptoms?.slice(0, 2).join(', ')}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="technicianCommand__grid">
        <article className="profileCard" id="checklist">
          <header className="sectionHeader">
            <div>
              <h2>Checklist personal</h2>
              <p>Capacitaciones o tareas asignadas directamente al técnico</p>
            </div>
          </header>
          {stats.checklist.length === 0 ? (
            <p className="muted">Sin tareas pendientes.</p>
          ) : (
            <ul className="profileList profileList--stacked">
              {stats.checklist.map(task => (
                <li key={task.id}>
                  <span>{task.title || `Acción ${task.id}`}</span>
                  <small>Alerta #{task.alertId} · {task.status}</small>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="profileCard" id="acciones">
          <header className="sectionHeader">
            <div>
              <h2>Acciones técnicas</h2>
              <p>
                {stats.actionsSummary.total} activas · {stats.actionsSummary.waitingValidation} esperando
                validación
              </p>
            </div>
          </header>
          {stats.actions.length === 0 ? (
            <p className="muted">Aún no tienes acciones técnicas asignadas.</p>
          ) : (
            <ul className="actionList">
              {stats.actions.map(action => (
                <li key={action.id}>
                  <div className="actionList__header">
                    <div>
                      <span className="actionList__location">{action.fincaName}</span>
                      <strong>{action.title}</strong>
                      <small>
                        Lote {action.lote || 'N/A'} · {action.type || 'Seguimiento'}
                      </small>
                    </div>
                    <span className={`actionStatus actionStatus--${action.status}`}>
                      {formatActionStatus(action.status)}
                    </span>
                  </div>
                  {action.description && <p className="actionList__description">{action.description}</p>}
                  <div className="actionList__meta">
                    <span>
                      Fecha objetivo:{' '}
                      {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'Sin definir'}
                    </span>
                    {action.requiresValidation && <span>Requiere validación del productor</span>}
                  </div>
                  <div className="actionMetaPanel">
                    <div className="actionMetaGroup">
                      <span>Riesgo percibido</span>
                      <div className="actionChips">
                        {RISK_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            className={`chip ${action.meta?.risk === option.value ? 'is-active' : ''}`}
                            onClick={() => handleMetaChange(action.id, { risk: option.value })}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="actionMetaGroup">
                      <span>Prioridad técnica</span>
                      <div className="actionChips">
                        {PRIORITY_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            className={`chip ${action.meta?.priority === option.value ? 'is-active' : ''}`}
                            onClick={() => handleMetaChange(action.id, { priority: option.value })}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="actionMetaGroup">
                      <span>Evidencia rápida</span>
                      <div className="actionEvidence">
                        <FileUploadButton
                          label="Adjuntar evidencia"
                          onUpload={fileData => handleMetaChange(action.id, { evidence: fileData })}
                          evidenceLoaded={Boolean(action.meta?.evidence)}
                        />
                        {action.meta?.evidence && (
                          <div className="actionEvidence__preview">
                            <img src={action.meta.evidence} alt={`Evidencia acción ${action.id}`} />
                            <button type="button" onClick={() => handleMetaChange(action.id, { evidence: null })}>
                              Quitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {action.updates && action.updates.length > 0 && (
                    <div className="actionUpdates">
                      {action.updates.slice(-3).map(update => (
                        <article key={update.id}>
                          <header>
                            <strong>{update.authorName}</strong>
                            <span>
                              {update.timestamp
                                ? new Date(update.timestamp).toLocaleString()
                                : ''}
                            </span>
                          </header>
                          <p>{update.message}</p>
                        </article>
                      ))}
                    </div>
                  )}
                  {action.status !== 'validated' && action.status !== 'pending_validation' && (
                    <form
                      className="actionForm"
                      onSubmit={event => handleProgressSubmit(event, action.id)}
                    >
                      <textarea
                        value={actionNotes[action.id] || ''}
                        placeholder="Describe tu avance o próximos pasos"
                        onChange={event =>
                          setActionNotes(prev => ({ ...prev, [action.id]: event.target.value }))
                        }
                      />
                      <div className="actionForm__actions">
                        <button type="submit">Registrar avance</button>
                      </div>
                    </form>
                  )}
                  {action.status !== 'validated' && (
                    <form
                      className="actionForm actionForm--secondary"
                      onSubmit={event => handleValidationSubmit(event, action.id)}
                    >
                      <textarea
                        value={validationNotes[action.id] || ''}
                        placeholder="Resumen para solicitar validación"
                        onChange={event =>
                          setValidationNotes(prev => ({
                            ...prev,
                            [action.id]: event.target.value
                          }))
                        }
                        disabled={action.status === 'pending_validation'}
                      />
                      <div className="actionForm__actions">
                        <button type="submit" disabled={action.status === 'pending_validation'}>
                          {action.status === 'pending_validation'
                            ? 'En espera de validación'
                            : 'Solicitar validación'}
                        </button>
                      </div>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="profileCard" id="historial">
          <header className="sectionHeader">
            <div>
              <h2>Historial reciente</h2>
              <p>Últimas alertas cerradas</p>
            </div>
          </header>
          {stats.history.length === 0 ? (
            <p className="muted">Aún no registras inspecciones completadas.</p>
          ) : (
            <ul className="profileList profileList--stacked">
              {stats.history.map(alert => (
                <li key={alert.id}>
                  <span>
                    #{alert.id} · {alert.farmName}
                  </span>
                  <small>
                    Cerrada el {new Date(alert.date).toLocaleDateString()} · Diagnóstico{' '}
                    {alert.inspectionData?.plant?.data?.diagnosis?.join(', ') || 'N/A'}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="profileCard" id="cobertura">
        <header className="sectionHeader">
          <div>
            <h2>Fincas atendidas</h2>
            <p>Resumen de cobertura</p>
          </div>
        </header>
        {stats.coverage.length === 0 ? (
          <p className="muted">Aún no se registran visitas.</p>
        ) : (
          <ul className="profileList profileList--stacked">
            {stats.coverage.map(item => (
              <li key={item.farm}>
                <span>{item.farm}</span>
                <small>{item.count} intervenciones registradas</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TechnicianCommandCenter;
