import React, { useMemo, useState } from 'react';
import { Brain, CheckCircle2, RefreshCcw, ShieldAlert, ShieldCheck, Tag, BookmarkCheck, Lightbulb } from 'lucide-react';
import './KnowledgeCheckModal.css';

const pickRandomQuestions = (questions, count) => {
  if (!Array.isArray(questions)) return [];
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

const KnowledgeCheckModal = ({
  workerName,
  questions = [],
  questionCount = 4,
  passingScore = 75,
  onSubmit,
}) => {
  const [quizVersion, setQuizVersion] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const quizQuestions = useMemo(
    () => pickRandomQuestions(questions, questionCount),
    [questions, questionCount, quizVersion]
  );

  const currentQuestion = quizQuestions[stepIndex];
  const totalQuestions = quizQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const hasAnsweredCurrent = currentQuestion && Object.prototype.hasOwnProperty.call(answers, currentQuestion.id);

  const computeResult = () => {
    const total = quizQuestions.length;
    const correct = quizQuestions.reduce(
      (sum, question) => (answers[question.id] === question.answerIndex ? sum + 1 : sum),
      0
    );
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const payload = {
      correct,
      total,
      score,
      passed: score >= passingScore,
      answers,
      questionIds: quizQuestions.map(q => q.id),
    };
    setResult(payload);
    onSubmit?.(payload);
  };

  const handleSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (!hasAnsweredCurrent) return;
    if (stepIndex === totalQuestions - 1) {
      computeResult();
    } else {
      setStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex === 0) return;
    setStepIndex(prev => prev - 1);
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    setStepIndex(0);
    setQuizVersion(prev => prev + 1);
  };

  if (!totalQuestions) {
    return (
      <div className="knowledge-modal">
        <p>No hay preguntas configuradas aún.</p>
      </div>
    );
  }

  if (result) {
    const SummaryIcon = result.passed ? ShieldCheck : ShieldAlert;
    return (
      <div className="knowledge-modal">
        <div className={`quiz-summary ${result.passed ? 'pass' : 'fail'}`}>
          <div className="summary-icon">
            <SummaryIcon size={32} />
          </div>
          <div>
            <p className="summary-eyebrow">Resultado semanal</p>
            <h3>{result.passed ? 'Listo para tu jornada' : 'Necesitas refuerzo rápido'}</h3>
            <p>
              Puntaje obtenido: <strong>{result.score}%</strong> ({result.correct} de {result.total} preguntas).
            </p>
            <p className="summary-meta">
              {result.passed
                ? 'Tu QR quedará habilitado para la semana actual.'
                : 'Debes completar el refuerzo sugerido antes de tu siguiente QR.'}
            </p>
          </div>
        </div>
        <div className="summary-actions">
          <button type="button" className="button btn-primary" onClick={handleRetake}>
            <RefreshCcw size={16} /> Volver a intentarlo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-modal">
      <header className="quiz-header">
        <div>
          <p className="quiz-eyebrow">Chequeo de conocimiento semanal</p>
          <h3>Hola, {workerName?.split(' ')[0] || 'trabajador'}. Son {totalQuestions} preguntas rápidas.</h3>
          <p className="quiz-helper">Avanza a tu ritmo; el sistema guardará tu QR automáticamente al cerrar.</p>
        </div>
        <div className="quiz-progress-pill">
          <BookmarkCheck size={18} className="pill-icon" />
          <div className="pill-count">
            <strong>{answeredCount}</strong>
            <span>/{totalQuestions}</span>
          </div>
          <small>respondidas</small>
        </div>
      </header>
      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <section className="question-card">
        <div className="question-meta">
          <span className="question-chip">
            <Tag size={14} /> {currentQuestion.category}
          </span>
          <span className="question-step">Pregunta {stepIndex + 1} de {totalQuestions}</span>
        </div>
        <div className="question-layout">
          <div className="question-text">
            <h4>{currentQuestion.question}</h4>
            <p className="question-hint">
              <Lightbulb size={14} /> Elige la opción que ejecutarías primero según el protocolo oficial.
            </p>
          </div>
          <div className="option-grid">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === idx;
              return (
                <button
                  type="button"
                  key={`${currentQuestion.id}-${idx}`}
                  className={`option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(currentQuestion.id, idx)}
                >
                  <span className="option-index">{idx + 1}</span>
                  <span className="option-text">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="quiz-footer">
        <button
          type="button"
          className="button ghost"
          onClick={handlePrev}
          disabled={stepIndex === 0}
        >
          <Brain size={16} /> Anterior
        </button>
        <button
          type="button"
          className="button btn-primary"
          onClick={handleNext}
          disabled={!hasAnsweredCurrent}
        >
          {stepIndex === totalQuestions - 1 ? (<><CheckCircle2 size={16} /> Finalizar</>) : (<><Brain size={16} /> Siguiente</>)}
        </button>
      </footer>
    </div>
  );
};

export default KnowledgeCheckModal;
