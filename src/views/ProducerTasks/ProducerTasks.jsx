import React, { useMemo, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';
import { ICONS } from '../../config/icons';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  Package,
  FileText,
  GraduationCap
} from 'lucide-react';
import './ProducerTasks.css';

const MODULE_META = {
  '1': {
    label: 'Control de Ingreso',
    color: '#cffafe',
    text: '#0f766e',
    Icon: ShieldCheck
  },
  '2': {
    label: 'Operaciones Internas',
    color: '#dbeafe',
    text: '#1d4ed8',
    Icon: ClipboardList
  },
  '3': {
    label: 'Higiene & Limpieza',
    color: '#fae8ff',
    text: '#a21caf',
    Icon: Sparkles
  },
  '4': {
    label: 'Empaque & Logística',
    color: '#fef3c7',
    text: '#b45309',
    Icon: Package
  },
  '5': {
    label: 'Gestión & Registros',
    color: '#ede9fe',
    text: '#6d28d9',
    Icon: FileText
  },
  default: {
    label: 'Seguimiento',
    color: '#e2e8f0',
    text: '#334155',
    Icon: ClipboardList
  }
};

const formatRelativeDays = createdAt => {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  const diffDays = Math.max(0, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return 'Creada hoy';
  if (diffDays === 1) return 'Creada hace 1 día';
  return `Creada hace ${diffDays} días`;
};

const ProducerTasks = ({
  producer,
  tasks,
  technicianActions = [],
  onCompleteTask,
  onShowTraining,
  completedTrainingIds,
  onValidateTechnicianAction,
  onNavigate
}) => {
  const tasksForProducer = useMemo(
    () =>
      tasks.filter(
        task =>
          task.producerId === producer.id && (task.owner || 'producer') === 'producer'
      ),
    [tasks, producer.id]
  );

  const pendingTasks = useMemo(
    () => tasksForProducer.filter(task => task.status === 'pending'),
    [tasksForProducer]
  );

  const completedTasks = useMemo(
    () => tasksForProducer.filter(task => task.status === 'completed'),
    [tasksForProducer]
  );

  const [selectedStatus, setSelectedStatus] = useState(() =>
    pendingTasks.length > 0 ? 'pending' : 'all'
  );
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const completionRate = useMemo(() => {
    if (tasksForProducer.length === 0) return 0;
    return Math.round((completedTasks.length / tasksForProducer.length) * 100);
  }, [tasksForProducer, completedTasks]);

  const totalTrainingMinutes = useMemo(() => {
    const totalSeconds = pendingTasks.reduce((acc, task) => acc + (task.minWatchTime || 0), 0);
    return Math.ceil(totalSeconds / 60);
  }, [pendingTasks]);

  const nextSuggestedTask = useMemo(() => {
    if (pendingTasks.length === 0) return null;
    const sorted = [...pendingTasks].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
    return sorted[0];
  }, [pendingTasks]);

  const tasksByStatus = useMemo(() => {
    switch (selectedStatus) {
      case 'pending':
        return pendingTasks;
      case 'completed':
        return completedTasks;
      default:
        return tasksForProducer;
    }
  }, [selectedStatus, pendingTasks, completedTasks, tasksForProducer]);

  const moduleOptions = useMemo(() => {
    const options = new Map();
    tasksForProducer.forEach(task => {
      const moduleKey = task.questionId?.split('.')[0];
      const moduleMeta = MODULE_META[moduleKey] || MODULE_META.default;
      if (!options.has(moduleMeta.label)) {
        options.set(moduleMeta.label, moduleMeta);
      }
    });
    return Array.from(options.values());
  }, [tasksForProducer]);

  const filteredTasks = useMemo(() => {
    const base = tasksByStatus.filter(task => {
      if (moduleFilter === 'all') return true;
      const moduleKey = task.questionId?.split('.')[0];
      const moduleLabel = (MODULE_META[moduleKey] || MODULE_META.default).label;
      return moduleLabel === moduleFilter;
    });

    if (!searchTerm.trim()) return base;
    const term = searchTerm.trim().toLowerCase();
    return base.filter(task => {
      const moduleKey = task.questionId?.split('.')[0];
      const moduleLabel = (MODULE_META[moduleKey] || MODULE_META.default).label;
      return [
        task.title,
        task.description,
        moduleLabel,
        task.questionId,
        `alerta ${task.alertId}`
      ].some(text => text && text.toLowerCase().includes(term));
    });
  }, [tasksByStatus, searchTerm, moduleFilter]);

  const statusFilterOptions = [
    { id: 'pending', label: `Pendientes (${pendingTasks.length})`, value: 'pending' },
    { id: 'completed', label: `Completadas (${completedTasks.length})`, value: 'completed' },
    { id: 'all', label: `Todas (${tasksForProducer.length})`, value: 'all' }
  ];

  const moduleFilterChoices = useMemo(
    () => [
      { id: 'all', label: 'Todos', value: 'all' },
      ...moduleOptions.map(module => ({
        id: module.label,
        label: module.label,
        value: module.label
      }))
    ],
    [moduleOptions]
  );

  const heroMetrics = [
    {
      icon: CheckCircle2,
      label: 'Avance general',
      value: `${completionRate}%`,
      detail: `${completedTasks.length} de ${tasksForProducer.length} acciones`,
      tone: 'success'
    },
    {
      icon: Clock3,
      label: 'Pendientes',
      value: pendingTasks.length,
      detail: `${totalTrainingMinutes} min de capacitación`,
      tone: 'warning'
    },
    {
      icon: GraduationCap,
      label: 'Capacitación vista',
      value: `${completedTrainingIds.length}`,
      detail: 'Tareas con video completado',
      tone: 'indigo'
    }
  ];

  const actionsNeedingValidation = useMemo(
    () =>
      technicianActions.filter(
        action => action.producerId === producer.id && action.status === 'pending_validation'
      ),
    [producer.id, technicianActions]
  );

  const renderTaskCard = task => {
    const isCompleted = task.status === 'completed';
    const moduleKey = task.questionId?.split('.')[0];
    const { label, color, text, Icon: ModuleIcon } = MODULE_META[moduleKey] || MODULE_META.default;
    const minutes = task.minWatchTime ? Math.ceil(task.minWatchTime / 60) : null;
    const relativeCreated = formatRelativeDays(task.createdAt);
    const descriptionLines = typeof task.description === 'string' ? task.description.split('\n') : [];
    const primaryDescription = descriptionLines[0] || 'Sin descripción disponible.';
    const secondaryDescription = descriptionLines.slice(1).join(' ').trim();

    return (
      <article key={task.id} className={`taskCard ${isCompleted ? 'taskCard--completed' : ''}`}>
        <header className="taskCard__header">
          <span className="taskCard__module" style={{ backgroundColor: color, color: text }}>
            <ModuleIcon size={18} />
            <span>{label}</span>
            {task.questionId && <span className="taskCard__moduleId">#{task.questionId}</span>}
          </span>
          <span className={`taskCard__status ${isCompleted ? 'is-completed' : 'is-pending'}`}>
            {isCompleted ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
            {isCompleted ? 'Completada' : 'Pendiente'}
          </span>
        </header>

        <div className="taskCard__body">
          <h3 className="taskCard__title">{task.title}</h3>
          <p className="taskCard__description">{primaryDescription}</p>
          {secondaryDescription && (
            <p className="taskCard__description taskCard__description--secondary">
              {secondaryDescription}
            </p>
          )}
          <div className="taskCard__origin">
            <span>Generada desde la Alerta #{task.alertId}</span>
            <span>Pregunta {task.questionId}</span>
          </div>
        </div>

        <footer className="taskCard__footer">
          <div className="taskCard__meta">
            {minutes && (
              <span className="taskCard__chip">
                <PlayCircle size={16} /> {minutes} min de capacitación
              </span>
            )}
            {relativeCreated && (
              <span className="taskCard__chip">
                <Clock3 size={16} /> {relativeCreated}
              </span>
            )}
          </div>
          <div className="taskCard__actions">
            {!isCompleted ? (
              <>
                <button className="button button-secondary" onClick={() => onShowTraining(task)}>
                  <PlayCircle size={18} /> Ver capacitación
                </button>
                <button
                  className="button button-success"
                  onClick={() => onCompleteTask(task.id)}
                  disabled={!completedTrainingIds.includes(task.id)}
                  title={
                    !completedTrainingIds.includes(task.id)
                      ? 'Debe ver el video de capacitación completo para marcar la tarea como cumplida.'
                      : 'Marcar esta tarea como completada'
                  }
                >
                  <CheckCircle2 size={18} /> Marcar como cumplida
                </button>
              </>
            ) : (
              <div className="taskCard__completed">
                <CheckCircle2 size={18} /> Acción registrada
              </div>
            )}
          </div>
        </footer>
      </article>
    );
  };

  return (
    <div className="producerTasksPage">
      <section className="producerTasksPage__hero">
        <div className="producerTasksPage__heroPattern" aria-hidden="true" />
        <div className="producerTasksPage__heroLayout">
          <div className="producerTasksPage__heroContent">
            <div className="producerTasksPage__heroHeader">
              {onNavigate && (
                <button className="producerTasksPage__backButton" onClick={() => onNavigate('producerDashboard')}>
                  <ArrowLeft size={18} /> Volver al panel
                </button>
              )}
              <span className="producerTasksPage__eyebrow">
                <Sparkles size={16} /> Ruta personalizada
              </span>
              <h1>Plan de acciones correctivas</h1>
              <p>
                Hola {producer?.name?.split(' ')[0] || 'productor'}, estas acciones fueron priorizadas según las auditorías recientes.
                Completa cada capacitación para desbloquear la confirmación de cumplimiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="producerTasksPage__insights">
        {heroMetrics.map(({ icon: StatIcon, label, value, detail, tone }) => (
          <article
            key={label}
            className={`producerTasksPage__statCard producerTasksPage__statCard--${tone}`}
          >
            <div className="producerTasksPage__statIcon">
              <StatIcon size={22} />
            </div>
            <div className="producerTasksPage__statDetails">
              <span className="producerTasksPage__statLabel">{label}</span>
              <span className="producerTasksPage__statValue">{value}</span>
              <p>{detail}</p>
            </div>
          </article>
        ))}
      </section>

      {actionsNeedingValidation.length > 0 && (
        <section className="producerTasksPage__validation">
          <header>
            <div>
              <h2>Acciones técnicas por validar</h2>
              <p>Confirma los avances reportados por tu técnico para cerrar las alertas.</p>
            </div>
          </header>
          <ul>
            {actionsNeedingValidation.map(action => (
              <li key={action.id}>
                <div>
                  <strong>{action.title}</strong>
                  <span>
                    {action.fincaName} · Lote {action.lote || 'N/A'} ·{' '}
                    {action.dueDate
                      ? new Date(action.dueDate).toLocaleDateString()
                      : 'Sin fecha límite'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onValidateTechnicianAction && onValidateTechnicianAction(action.id)
                  }
                >
                  Validar resultado
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="producerTasksPage__board">
        <div className="producerTasksPage__controls">
          <FilterPanel
            className="producerTasksPage__filterPanel"
            pillGroups={[
              {
                id: 'tasks-status',
                label: 'Estado',
                items: statusFilterOptions.map(option => ({
                  id: option.id,
                  label: option.label,
                  active: selectedStatus === option.value,
                  onClick: () => setSelectedStatus(option.value)
                }))
              },
              {
                id: 'tasks-module',
                label: 'Módulo',
                items: moduleFilterChoices.map(option => ({
                  id: option.id,
                  label: option.label,
                  active: moduleFilter === option.value,
                  onClick: () => setModuleFilter(option.value)
                }))
              }
            ]}
          />
          <label className="producerTasksPage__search">
            <span className="sr-only">Buscar tareas</span>
            <input
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, módulo o alerta"
            />
          </label>
        </div>

        <div className="producerTasksPage__list">
          {filteredTasks.length === 0 ? (
            <EmptyState
              iconPath={ICONS.checkCircle}
              title={selectedStatus === 'completed' ? 'Aún no tienes tareas completadas' : 'Todo al día'}
              message={
                selectedStatus === 'completed'
                  ? 'Cuando marques acciones como cumplidas, aparecerán aquí para que lleves el historial.'
                  : 'No hay tareas en esta vista. Revisa otras pestañas o espera nuevas auditorías.'
              }
            />
          ) : (
            <div className="producerTasksPage__cardGrid">
              {filteredTasks.map(renderTaskCard)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProducerTasks;
