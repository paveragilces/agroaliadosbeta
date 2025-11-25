// En: src/views/ContainmentPlanViewer/Step.jsx
import React, { useMemo } from 'react';
import Icon from '../../components/ui/Icon';
import { ICONS } from '../../config/icons';
import TimelineCard from './TimelineCard';
import './PlanStepper.css';

const STEP_STATUS_META = {
  completed: { icon: ICONS.checkCircle, label: 'Etapa completada' },
  active: { icon: ICONS.time, label: 'Etapa en curso' },
  pending: { icon: ICONS.checkboxEmpty, label: 'Etapa pendiente' },
};

const STATUS_ORDER = {
  in_progress: 0,
  pending: 1,
  completed: 2,
};

const Step = ({ step, status, isOpen, onToggle, onOpenTaskDetails, index, totalSteps }) => {
  const tasks = step.tasks || [];

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const statusDiff =
        (STATUS_ORDER[a.status] ?? Number.POSITIVE_INFINITY) -
        (STATUS_ORDER[b.status] ?? Number.POSITIVE_INFINITY);
      if (statusDiff !== 0) return statusDiff;

      const aDate = new Date(a.targetDate || a.createdAt || 0).getTime();
      const bDate = new Date(b.targetDate || b.createdAt || 0).getTime();
      return aDate - bDate;
    });
  }, [tasks]);

  const progress = useMemo(() => {
    if (!tasks.length) {
      return 100;
    }
    const completed = tasks.filter((task) => task.status === 'completed').length;
    return (completed / tasks.length) * 100;
  }, [tasks]);

  const completedCount = tasks.filter((task) => task.status === 'completed').length;
  const totalCount = tasks.length;
  const statusMeta = STEP_STATUS_META[status];

  const [timeframeLabel, mainTitle] = useMemo(() => {
    if (!step.title) {
      return [null, ''];
    }

    const segments = step.title.split(':');
    if (segments.length === 1) {
      return [null, segments[0].trim()];
    }

    const [timeframe, ...rest] = segments;
    return [timeframe.trim(), rest.join(':').trim()];
  }, [step.title]);

  const primaryTask = useMemo(() => {
    if (!sortedTasks.length) {
      return null;
    }

    return sortedTasks.find((task) => task.status !== 'completed') || sortedTasks[0];
  }, [sortedTasks]);

  const handleToggle = () => {
    onToggle();
  };

  const handleQuickAction = (event) => {
    event.stopPropagation();
    if (primaryTask) {
      onOpenTaskDetails(primaryTask);
    }
  };

  const formattedIndex = String(index + 1).padStart(2, '0');

  return (
    <div className={`step-row status-${status}`}>
      <div className="step-marker-column" aria-hidden="true">
        <span className={`step-marker tone-${status}`}>{formattedIndex}</span>
        {index < totalSteps - 1 && <span className="step-marker-line" />}
      </div>

      <div className={`step-item status-${status}`}>
        <div className="step-header">
          <button type="button" className="step-toggle" onClick={handleToggle}>
            <div className="step-title-row">
              <div className="step-chip-row">
                <span className="step-number-chip">Paso {index + 1}</span>
                {timeframeLabel && <span className="step-timeframe-chip">{timeframeLabel}</span>}
                {statusMeta && (
                  <span className={`step-status-chip tone-${status}`}>
                    <Icon path={statusMeta.icon} size={16} />
                    {statusMeta.label}
                  </span>
                )}
              </div>
              <h3 className="h3">{mainTitle || step.title}</h3>
            </div>

            <div className="step-progress-meta">
              <span className="step-progress-text">
                {completedCount} de {totalCount} tareas completadas
              </span>
              <div className="step-progress-bar" title={`${Math.round(progress)}%`}>
                <div className="step-progress-bar-inner" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={`step-header-toggle ${isOpen ? 'open' : ''}`}>
              <Icon path={ICONS.chevronDown} size={22} />
            </div>
          </button>

          <button
            type="button"
            className="step-quick-action button button-secondary"
            onClick={handleQuickAction}
            disabled={!primaryTask || status === 'completed'}
          >
            <Icon path={ICONS.tasks} size={16} />
            Registrar avance
          </button>
        </div>

        <div className={`step-content ${isOpen ? 'open' : ''}`}>
          <div className="step-tasks-list">
            {sortedTasks.map((task) => (
              <TimelineCard key={task.id} task={task} onOpenTaskDetails={onOpenTaskDetails} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step;
