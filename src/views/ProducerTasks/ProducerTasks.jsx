import React, { useMemo, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
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
  onCompleteTask,
  onShowTraining,
  completedTrainingIds,
  onNavigate
}) => {
  const tasksForProducer = useMemo(
    () => tasks.filter(task => task.producerId === producer.id),
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

  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasksByStatus;
    const term = searchTerm.trim().toLowerCase();
    return tasksByStatus.filter(task => {
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
  }, [tasksByStatus, searchTerm]);

  const renderTaskCard = task => {
    const isCompleted = task.status === 'completed';
    const moduleKey = task.questionId?.split('.')[0];
    const { label, color, text, Icon: ModuleIcon } = MODULE_META[moduleKey] || MODULE_META.default;
    const minutes = task.minWatchTime ? Math.ceil(task.minWatchTime / 60) : null;
    const relativeCreated = formatRelativeDays(task.createdAt);

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
          <p className="taskCard__description">{task.description.split('\n')[0]}</p>
          {task.description.includes('\n') && (
            <p className="taskCard__description taskCard__description--secondary">
              {task.description.split('\n').slice(1).join(' ')}
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
              Hola {producer?.name?.split(' ')[0] || 'productor'}, aquí encontrarás las tareas priorizadas según las auditorías
              recientes. Completa cada capacitación para desbloquear la confirmación de cumplimiento.
            </p>
            {nextSuggestedTask && (
              <div className="producerTasksPage__heroCallout">
                <Clock3 size={18} />
                <div>
                  <span className="producerTasksPage__heroCalloutLabel">Próxima acción sugerida</span>
                  <strong>{nextSuggestedTask.title}</strong>
                </div>
              </div>
            )}
          </div>
          <div className="producerTasksPage__stats">
            <div className="producerTasksPage__statCard">
              <CheckCircle2 size={26} />
              <div>
                <span className="producerTasksPage__statValue">{completionRate}%</span>
                <span className="producerTasksPage__statLabel">Avance general</span>
              </div>
            </div>
            <div className="producerTasksPage__statCard">
              <Clock3 size={26} />
              <div>
                <span className="producerTasksPage__statValue">{pendingTasks.length}</span>
                <span className="producerTasksPage__statLabel">Tareas pendientes</span>
              </div>
            </div>
            <div className="producerTasksPage__statCard">
              <GraduationCap size={26} />
              <div>
                <span className="producerTasksPage__statValue">{totalTrainingMinutes} min</span>
                <span className="producerTasksPage__statLabel">Capacitación restante</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="producerTasksPage__board">
        <div className="producerTasksPage__controls">
          <div className="producerTasksPage__tabs">
            {[
              { id: 'pending', label: `Pendientes (${pendingTasks.length})` },
              { id: 'completed', label: `Completadas (${completedTasks.length})` },
              { id: 'all', label: `Todas (${tasksForProducer.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                className={`producerTasksPage__tab ${selectedStatus === tab.id ? 'is-active' : ''}`}
                onClick={() => setSelectedStatus(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
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
            filteredTasks.map(renderTaskCard)
          )}
        </div>
      </section>
    </div>
  );
};

export default ProducerTasks;