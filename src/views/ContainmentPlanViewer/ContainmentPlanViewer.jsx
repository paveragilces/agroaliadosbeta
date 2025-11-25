// En: src/views/ContainmentPlanViewer/ContainmentPlanViewer.jsx
// --- ARCHIVO MODIFICADO ---

import React, { useMemo, useState, useEffect } from 'react';
import TaskDetailsModal from './TaskDetailsModal';
import PlanStepper from './PlanStepper';
// Importamos los iconos de Lucide
import {
  CheckCircle2,
  Clock,
  Square,
  ShieldCheck,
  ArrowLeft,
  User,
  MapPin,
  Bug,
  GripVertical,
  ListChecks,
  CalendarDays,
  Zap,
  Info,
  MessageSquare,
} from 'lucide-react';
import './ContainmentPlanViewer.css';
// Ya no importamos PlanStepper.css aquí

// Actualizamos esta función para que devuelva el componente de icono
const getStatusToken = (status) => {
  if (status === 'completed') {
    return { label: 'Plan completado', tone: 'success', icon: <CheckCircle2 size={16} /> };
  }
  if (status === 'active') {
    return { label: 'Plan en curso', tone: 'info', icon: <Clock size={16} /> };
  }
  return { label: 'Plan pendiente', tone: 'neutral', icon: <Square size={16} /> };
};

const ContainmentPlanViewer = ({ producer, plans, fincas, onUpdatePlanTask, onNavigate }) => {
  const producerPlans = useMemo(
    () => plans.filter((plan) => plan.producerId === producer.id),
    [plans, producer.id]
  );

  const [selectedPlanId, setSelectedPlanId] = useState(producerPlans[0]?.id || '');
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (!producerPlans.length) {
      setSelectedPlanId('');
      return;
    }

    const exists = producerPlans.some((plan) => plan.id === selectedPlanId);
    if (!exists) {
      setSelectedPlanId(producerPlans[0].id);
    }
  }, [producerPlans, selectedPlanId]);

  const selectedPlan = useMemo(
    () => producerPlans.find((plan) => plan.id === selectedPlanId) || null,
    [producerPlans, selectedPlanId]
  );

  const getFincaName = (fincaId) => {
    const finca = fincas.find((item) => item.id === fincaId);
    return finca ? finca.name : 'Finca desconocida';
  };

  const planAnalytics = useMemo(() => {
    if (!selectedPlan) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        completionPercent: 0,
        nextTask: null,
        latestUpdate: null,
      };
    }

    const steps = selectedPlan.steps || [];
    const allTasks = steps.flatMap((step) => step.tasks || []);
    const withStepContext = steps.flatMap((step) =>
      (step.tasks || []).map((task) => ({ ...task, stepTitle: step.title }))
    );

    const completedTasks = allTasks.filter((task) => task.status === 'completed').length;
    const inProgressTasks = allTasks.filter((task) => task.status === 'in_progress').length;
    const pendingTasks = allTasks.filter((task) => task.status === 'pending').length;
    const totalTasks = allTasks.length;
    const completionPercent = totalTasks === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100);

    const nextTask =
      withStepContext.find((task) => task.status === 'in_progress') ||
      withStepContext.find((task) => task.status === 'pending') ||
      null;

    const logs = withStepContext.flatMap((task) =>
      (task.log || []).map((entry) => ({
        ...entry,
        taskId: task.id,
        taskText: task.text,
        stepTitle: task.stepTitle,
      }))
    );

    const latestUpdate = logs
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionPercent,
      nextTask,
      latestUpdate,
    };
  }, [selectedPlan]);

  const recentUpdates = useMemo(() => {
    if (!selectedPlan) {
      return [];
    }

    return selectedPlan.steps
      .flatMap((step) =>
        (step.tasks || []).flatMap((task) =>
          (task.log || []).map((entry) => ({
            ...entry,
            taskId: task.id,
            taskText: task.text,
            stepTitle: step.title,
          }))
        )
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [selectedPlan]);

  const handleOpenTaskDetails = (task) => {
    setEditingTask(task);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
  };

  const handleSaveTask = (taskId, updates) => {
    if (selectedPlanId) {
      onUpdatePlanTask(selectedPlanId, taskId, updates);
    }
  };

  if (producerPlans.length === 0) {
    return (
      <div className="containment-plan-page">
        <div className="containment-plan-hero empty">
          <div className="hero-heading">
            <div className="hero-icon">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="h1">Planes de Contención</h1>
              <p className="hero-subtitle">Por ahora no tienes protocolos activos. Te avisaremos si se genera uno nuevo.</p>
            </div>
          </div>
        </div>
        <div className="emptyState modern">
          <CheckCircle2 size={60} />
          <h2>Todo en orden</h2>
          <p>No registramos planes de contención para tus fincas. Sigue monitoreando tus alertas para mantenerte preparado.</p>
        </div>
      </div>
    );
  }

  const statusToken = getStatusToken(selectedPlan?.status);

  const formatDate = (iso) => {
    if (!iso) return 'Sin registro';
    const date = new Date(iso);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statSummaryCards = [
    {
      key: 'progress',
      icon: <ListChecks size={18} />,
      label: 'Avance del plan',
      value: `${planAnalytics.completionPercent}%`,
      detail: `${planAnalytics.completedTasks} de ${planAnalytics.totalTasks} tareas completadas`,
      progress: true,
    },
    {
      key: 'tracking',
      icon: <Clock size={18} />,
      label: 'Tareas en seguimiento',
      value: planAnalytics.inProgressTasks,
      detail: `${planAnalytics.pendingTasks} pendientes por iniciar`,
    },
    {
      key: 'created',
      icon: <CalendarDays size={18} />,
      label: 'Creado',
      value: formatDate(selectedPlan?.createdAt),
      detail: planAnalytics.latestUpdate
        ? `Última actualización ${formatDate(planAnalytics.latestUpdate.date)}`
        : 'Aún sin registros',
    },
  ];

  return (
    <div className="containment-plan-page">
      {editingTask && (
        <TaskDetailsModal task={editingTask} onClose={handleCloseModal} onSaveTask={handleSaveTask} />
      )}

      {/* --- HEADER SIMPLIFICADO --- */}
      <section className="containment-plan-hero">
        <div className="hero-top-bar">
          <div className="hero-top-left">
            {onNavigate && (
              <button
                type="button"
                className="hero-back-button"
                onClick={() => onNavigate('producerDashboard')}
              >
                <ArrowLeft size={18} />
                Volver al panel
              </button>
            )}
          </div>
          {statusToken && (
            <span className={`hero-status-pill tone-${statusToken.tone}`}>
              {statusToken.icon}
              {statusToken.label}
            </span>
          )}
        </div>

        <div className="hero-heading">
          <div className="hero-icon">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="h1">Planes de Contención</h1>
            <p className="hero-subtitle">
              Seguimiento integral a los protocolos de bioseguridad y contención activos para tus fincas.
            </p>
            <div className="hero-meta">
              <span className="meta-chip">
                <User size={16} />
                {producer.owner}
              </span>
              {selectedPlan && (
                <span className="meta-chip">
                  <MapPin size={16} />
                  {getFincaName(selectedPlan.fincaId)}
                </span>
              )}
              {selectedPlan && (
                <span className="meta-chip">
                  <Bug size={16} />
                  {selectedPlan.diseaseName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="plan-selector">
          <label className="label" htmlFor="plan-selector">Seleccionar plan</label>
          <div className="selector-field">
            <GripVertical size={18} />
            <select
              id="plan-selector"
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
            >
              {producerPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.diseaseName} · {getFincaName(plan.fincaId)} · {plan.lote}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- EL GRID DE ESTADÍSTICAS YA NO VA AQUÍ --- */}
      </section>

      {/* --- CONTENIDO PRINCIPAL DE LA PÁGINA --- */}
      {selectedPlan && (
        <div className="plan-content-grid">
          <section className="plan-stats-wrapper">
            <div className="plan-stats-grid">
              {statSummaryCards.map((card) => (
                <article key={card.key} className="stat-card">
                  <header>
                    {card.icon}
                    <span className="stat-label">{card.label}</span>
                  </header>
                  <div className="stat-content">
                    <strong className="stat-value">{card.value}</strong>
                    <p className="stat-detail">{card.detail}</p>
                    {card.progress && (
                      <div className="progress-bar">
                        <div style={{ width: `${planAnalytics.completionPercent}%` }} />
                      </div>
                    )}
                  </div>
                </article>
              ))}
              <article className="stat-card highlight">
                <header>
                  <Zap size={20} />
                  <span>Próxima acción</span>
                </header>
                {planAnalytics.nextTask ? (
                  <>
                    <strong>{planAnalytics.nextTask.text}</strong>
                    <p>{planAnalytics.nextTask.stepTitle}</p>
                  </>
                ) : (
                  <>
                    <strong>Plan al día</strong>
                    <p>No hay acciones pendientes</p>
                  </>
                )}
              </article>
            </div>
          </section>

          <section className="plan-overview-card">
            <div className="plan-overview-header">
              <div>
                <h2 className="h2">Itinerario del plan</h2>
                <p>{selectedPlan.description}</p>
              </div>
            </div>
            <PlanStepper plan={selectedPlan} onOpenTaskDetails={handleOpenTaskDetails} />
          </section>

          <section className="plan-insight-grid">
            <div className="side-card">
              <header>
                <Info size={18} />
                <span>Resumen del plan</span>
              </header>
              <ul>
                <li>
                  <MapPin size={16} />
                  {getFincaName(selectedPlan.fincaId)} · {selectedPlan.lote}
                </li>
                <li>
                  <Bug size={16} />
                  {selectedPlan.diseaseName}
                </li>
                <li>
                  <ListChecks size={16} />
                  {planAnalytics.totalTasks} tareas · {(selectedPlan.steps || []).length} etapas
                </li>
              </ul>
            </div>

            <div className="side-card next-action">
              <header>
                <Zap size={18} />
                <span>Siguiente paso sugerido</span>
              </header>
              {planAnalytics.nextTask ? (
                <>
                  <h3>{planAnalytics.nextTask.text}</h3>
                  <p>{planAnalytics.nextTask.stepTitle}</p>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => handleOpenTaskDetails(planAnalytics.nextTask)}
                  >
                    Actualizar tarea
                  </button>
                </>
              ) : (
                <p className="empty">Todas las tareas están finalizadas.</p>
              )}
            </div>

            <div className="side-card timeline">
              <header>
                <MessageSquare size={18} />
                <span>Últimos movimientos</span>
              </header>
              {recentUpdates.length === 0 ? (
                <p className="empty">Aún no registras novedades dentro del plan.</p>
              ) : (
                <ul>
                  {recentUpdates.map((entry) => (
                    <li key={`${entry.taskId}-${entry.date}`}>
                      <span className="timeline-date">{formatDate(entry.date)}</span>
                      <p>
                        <strong>{entry.user}</strong> registró actividad en
                        {' '}
                        <em>{entry.stepTitle}</em>:
                        {' '}
                        <span>“{entry.comment}”</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ContainmentPlanViewer;
