import React, { useMemo, useState } from 'react';
import { PlayCircle, Brain, CheckCircle2, TimerReset, GraduationCap } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import KnowledgeCheckModal from '../../components/worker/KnowledgeCheckModal';
import './WorkerTrainingCenter.css';

const extractVideoId = (url = '') => {
  if (!url) return null;
  const embedMatch = url.match(/(?:embed\/|v=)([A-Za-z0-9_-]{6,})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];
  if (/^[A-Za-z0-9_-]{6,}$/.test(url)) return url;
  return null;
};

const WorkerTrainingCenter = ({
  worker,
  knowledgeCheck,
  needsKnowledgeCheck,
  trainingTask,
  onCompleteTraining,
  knowledgeQuestions = [],
  onCompleteKnowledgeCheck,
  onLaunchTraining
}) => {
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  const knowledgeStatus = knowledgeCheck
    ? knowledgeCheck.passed
      ? 'apto'
      : 'refuerzo'
    : needsKnowledgeCheck
      ? 'pendiente'
      : 'sin-registro';

  const knowledgeLabel = {
    apto: 'Apto esta semana',
    refuerzo: 'Refuerzo requerido',
    pendiente: 'Prueba pendiente',
    'sin-registro': 'Sin registro'
  }[knowledgeStatus];

  const lastCheck = knowledgeCheck?.completedAt
    ? new Date(knowledgeCheck.completedAt).toLocaleDateString('es-EC', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      })
    : 'Sin registro';

  const scoreLabel = knowledgeCheck ? `${knowledgeCheck.score}%` : '0%';

  const handleKnowledgeResult = (result) => {
    onCompleteKnowledgeCheck?.(result);
  };

  const handleLaunchTraining = () => {
    if (!trainingTask || trainingTask.completed || !onLaunchTraining) return;
    const resolvedVideoId = trainingTask.videoId || extractVideoId(trainingTask.videoUrl || '');
    onLaunchTraining({
      ...trainingTask,
      videoId: resolvedVideoId,
      minWatchTime: trainingTask.minWatchTime || 120,
      onComplete: () => onCompleteTraining?.()
    });
  };

  const pendingTraining = useMemo(() => {
    if (!trainingTask) return null;
    return {
      ...trainingTask,
      assignedLabel: trainingTask.assignedAt
        ? new Date(trainingTask.assignedAt).toLocaleDateString()
        : 'Asignado recientemente'
    };
  }, [trainingTask]);

  return (
    <div className="container worker-training-page">
      <header className="training-hero">
        <div>
          <p className="hero-eyebrow">Capacitación continua</p>
          <h1 className="h1">Refuerzos y preparación semanal</h1>
          <p className="hero-sub">
            Mantén tu QR activo completando la prueba semanal y los refuerzos asignados por el gerente.
          </p>
        </div>
        <div className="hero-pill">
          <GraduationCap size={20} />
          <div>
            <small>Trabajador</small>
            <strong>{worker.name}</strong>
          </div>
        </div>
      </header>

      <section className="training-status-grid">
        <article className={`training-knowledge status-${knowledgeStatus}`}>
          <div className="knowledge-head">
            <Brain size={20} />
            <div>
              <p className="knowledge-eyebrow">Prueba semanal</p>
              <h2>{knowledgeLabel}</h2>
            </div>
          </div>
          <ul className="knowledge-stats">
            <li>
              <span>Puntaje</span>
              <strong>{scoreLabel}</strong>
            </li>
            <li>
              <span>Última actualización</span>
              <strong>{lastCheck}</strong>
            </li>
            <li>
              <span>Fallidos seguidos</span>
              <strong>{knowledgeCheck?.failCount || 0}</strong>
            </li>
          </ul>
          <button type="button" className="button btn-primary" onClick={() => setShowKnowledgeModal(true)}>
            Tomar prueba ahora
          </button>
        </article>

        <article className="training-reminders">
          <div>
            <TimerReset size={18} />
            <h3>Recordatorio semanal</h3>
            <p>Los domingos enviamos un aviso automático para que completes tu autodiagnóstico.</p>
          </div>
          <div>
            <CheckCircle2 size={18} />
            <h3>QR condicionado</h3>
            <p>El código de ingreso se habilita solo si cumples con la prueba y el refuerzo asignado.</p>
          </div>
        </article>
      </section>

      <section className="training-module">
        <header>
          <div>
            <p className="module-eyebrow">Refuerzo asignado</p>
            <h2>Video guiado por el gerente</h2>
          </div>
        </header>
        {pendingTraining ? (
          <div className={`module-card ${pendingTraining.completed ? 'is-completed' : ''}`}>
            <div className="module-body">
              <div className="module-icon">
                <PlayCircle size={22} />
              </div>
              <div>
                <h3>{pendingTraining.title}</h3>
                <p>{pendingTraining.description}</p>
                <small>
                  Duración mínima: {Math.ceil((pendingTraining.minWatchTime || 120) / 60)} minutos · {pendingTraining.assignedLabel}
                </small>
              </div>
            </div>
            {pendingTraining.completed ? (
              <div className="module-status completed">Completado</div>
            ) : (
              <button type="button" className="button btn-primary" onClick={handleLaunchTraining}>
                <PlayCircle size={16} /> Ver capacitación
              </button>
            )}
          </div>
        ) : (
          <div className="module-empty">
            <p>No tienes refuerzos pendientes. Mantén tu práctica semanal para continuar al día.</p>
          </div>
        )}
      </section>

      {showKnowledgeModal && (
        <Modal
          title="Prueba rápida de bioseguridad"
          onClose={() => setShowKnowledgeModal(false)}
          size="large"
        >
          <KnowledgeCheckModal
            workerName={worker.name}
            questions={knowledgeQuestions}
            onSubmit={handleKnowledgeResult}
          />
        </Modal>
      )}
    </div>
  );
};

export default WorkerTrainingCenter;
