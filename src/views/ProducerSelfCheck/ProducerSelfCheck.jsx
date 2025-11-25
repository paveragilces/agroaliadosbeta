import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  Info,
  Lightbulb,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Wrench,
  Sprout,
  Biohazard,
  BookOpen
} from 'lucide-react';
import './ProducerSelfCheck.css';

const RESPONSE_OPTIONS = [
  { value: 'yes', label: 'Sí', helper: 'Lo aplico de forma consistente' },
  { value: 'partial', label: 'En parte', helper: 'Avances, pero aún falta' },
  { value: 'no', label: 'No', helper: 'Aún no lo tengo implementado' },
  { value: 'unknown', label: 'No lo sé', helper: 'Necesito guía o confirmación' }
];

const QUESTION_GROUPS = [
  {
    id: 'access',
    title: 'Ingreso y control',
    description: 'Evitar que patógenos entren por personas, vehículos o equipos.',
    questions: [
      {
        id: 'access_pediluvio',
        label: 'Pediluvio / rodiluvio',
        text: '¿Cuentas con pediluvio/rodiluvio activo en los accesos principales?',
        action: 'Instala o repone solución desinfectante cada 3-5 días y coloca un recordatorio visual en el ingreso.'
      },
      {
        id: 'access_ropa',
        label: 'Ropa y calzado exclusivos',
        text: '¿El personal y las visitas usan calzado o ropa exclusiva para la finca o zonas críticas?',
        action: 'Define un kit de ingreso (botas/overol) y controla su uso antes de entrar a los lotes.'
      },
      {
        id: 'access_registro',
        label: 'Registro de visitas',
        text: '¿Registras las visitas y su procedencia antes de que ingresen a los lotes?',
        action: 'Usa un registro simple (libreta o QR) y verifica la limpieza básica de vehículos/herramientas al ingreso.'
      }
    ]
  },
  {
    id: 'movement',
    title: 'Movimientos y herramientas',
    description: 'Reducir el traslado de suelo y patógenos entre lotes.',
    questions: [
      {
        id: 'tools_disinfection',
        label: 'Desinfección de herramientas',
        text: '¿Desinfectas herramientas y machetes al pasar de un lote/cuartel a otro?',
        action: 'Define un punto de desinfección con solución fresca y asegúrate de que el personal lo use en cada cambio de lote.'
      },
      {
        id: 'movement_control',
        label: 'Movimiento controlado',
        text: '¿Controlas el movimiento de suelo/maquinaria/agua entre lotes (limpieza previa, rutas definidas)?',
        action: 'Evita trasladar suelo de zonas sospechosas, limpia maquinaria antes de entrar y usa rutas separadas para zonas limpias.'
      }
    ]
  },
  {
    id: 'material',
    title: 'Material vegetal y sospechosos',
    description: 'Proteger la plantación desde el origen y aislar focos a tiempo.',
    questions: [
      {
        id: 'material_certificado',
        label: 'Material certificado',
        text: '¿Usas material de siembra certificado o verificado antes de sembrar o resembrar?',
        action: 'Compra a proveedores confiables, guarda comprobantes y revisa visualmente el material antes de entrar a campo.'
      },
      {
        id: 'suspects_isolation',
        label: 'Aislamiento de sospechosos',
        text: '¿Aíslas y señalizas plantas sospechosas antes de mover residuos o herramientas cerca?',
        action: 'Delimita la zona, evita mover herramientas sin desinfección y entierra/cal los residuos de plantas sospechosas.'
      }
    ]
  },
  {
    id: 'moko',
    title: 'Manejo de Moko',
    description: 'Que el equipo detecte y actúe sin dispersar la bacteria.',
    questions: [
      {
        id: 'moko_symptoms',
        label: 'Síntomas de Moko',
        text: '¿Tu equipo reconoce síntomas clave de Moko (marchitez, exudados, decoloración vascular)?',
        action: 'Realiza una charla visual rápida con fotos de síntomas y rota al personal en las rondas de observación.'
      },
      {
        id: 'moko_protocol',
        label: 'Protocolo Moko',
        text: '¿Aplican un protocolo de eliminación y desinfección cuando aparece un caso sospechoso de Moko?',
        action: 'Elimina la planta completa, desinfecta herramientas y define cómo sacar los residuos sin pasar por zonas limpias.'
      }
    ]
  },
  {
    id: 'foc',
    title: 'Prevención Foc R4T',
    description: 'Mantener el hongo fuera y contenerlo si aparece.',
    questions: [
      {
        id: 'foc_monitoring',
        label: 'Monitoreo Foc R4T',
        text: '¿Haces rondas semanales/quincenales para buscar síntomas de Foc R4T (amarillamiento unilateral, necrosis)?',
        action: 'Programa una ronda visual con checklist simple y anota hallazgos, aunque sean negativos.'
      },
      {
        id: 'foc_barriers',
        label: 'Barreras Foc R4T',
        text: '¿Restringes la entrada de maquinaria/suelo de otras fincas y limpias antes de ingresar?',
        action: 'Pide limpieza previa, aplica cal en accesos y controla el ingreso de suelo o agua de fincas externas.'
      }
    ]
  },
  {
    id: 'management',
    title: 'Gestión y capacitación',
    description: 'Sostener buenas prácticas en el tiempo.',
    questions: [
      {
        id: 'records_training',
        label: 'Registros y capacitación',
        text: '¿Llevas registros de inspecciones/incidencias y realizas capacitaciones periódicas al personal?',
        action: 'Define una frecuencia (mensual o trimestral), guarda evidencias simples y registra incidencias con fecha.'
      }
    ]
  }
];

const STATUS_META = {
  pending: {
    label: 'Autoevaluación pendiente',
    tone: 'pending',
    message: 'Responde para priorizar refuerzos y compartirlos con el gerente.'
  },
  good: {
    label: 'Preparación sólida',
    tone: 'good',
    message: 'Mantén estos hábitos y refuerza los pendientes clave para blindar la finca.'
  },
  caution: {
    label: 'Refuerzo recomendado',
    tone: 'caution',
    message: 'Hay prácticas en marcha, pero algunas brechas requieren ajustes rápidos.'
  },
  alert: {
    label: 'Refuerzo urgente',
    tone: 'alert',
    message: 'Varias brechas críticas. Prioriza acciones inmediatas para reducir riesgo.'
  }
};

const SECTION_ICONS = {
  access: DoorOpen,
  movement: Wrench,
  material: Sprout,
  moko: Biohazard,
  foc: Biohazard,
  management: BookOpen
};

const ProducerSelfCheck = ({ producer, onNavigate, onSaveAssessment, savedAssessment }) => {
  const [answers, setAnswers] = useState(() => savedAssessment?.answers || {});
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  const flatQuestions = useMemo(
    () => QUESTION_GROUPS.flatMap(group => group.questions),
    []
  );

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );
  const pendingCount = flatQuestions.length - answeredCount;

  const totals = useMemo(() => {
    const yesCount = flatQuestions.filter(q => answers[q.id] === 'yes').length;
    const partialCount = flatQuestions.filter(q => answers[q.id] === 'partial').length;
    const noCount = flatQuestions.filter(q => answers[q.id] === 'no').length;
    const unknownCount = flatQuestions.filter(q => answers[q.id] === 'unknown').length;

    const completion = Math.round((answeredCount / flatQuestions.length) * 100);

    let status = answeredCount === 0 ? STATUS_META.pending : STATUS_META.good;
    if (answeredCount === 0) {
      status = STATUS_META.pending;
    } else if (noCount >= 3 || yesCount / flatQuestions.length < 0.45) {
      status = STATUS_META.alert;
    } else if (noCount >= 1 || partialCount >= 3 || yesCount / flatQuestions.length < 0.7) {
      status = STATUS_META.caution;
    }

    return {
      yesCount,
      partialCount,
      noCount,
      unknownCount,
      completion,
      status
    };
  }, [answers, answeredCount, flatQuestions]);

  const strengths = useMemo(() => {
    return flatQuestions
      .filter(q => answers[q.id] === 'yes')
      .map(q => ({ id: q.id, text: q.text }));
  }, [answers, flatQuestions]);

  const focusAreas = useMemo(() => {
    const priorityWeight = { no: 3, partial: 2, unknown: 1 };
    return flatQuestions
      .filter(q => answers[q.id] && answers[q.id] !== 'yes')
      .map(q => ({
        ...q,
        answer: answers[q.id],
        weight: priorityWeight[answers[q.id]] || 0
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4);
  }, [answers, flatQuestions]);

  const readyToSave = answeredCount === flatQuestions.length;
  const currentGroup = QUESTION_GROUPS[currentGroupIndex];
  const groupCompletion = currentGroup.questions.filter(q => answers[q.id]).length;
  const isCurrentGroupComplete = groupCompletion === currentGroup.questions.length;

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: value };
      const group = QUESTION_GROUPS[currentGroupIndex];
      const groupComplete = group.questions.every(q => next[q.id]);
      if (groupComplete && currentGroupIndex < QUESTION_GROUPS.length - 1) {
        const targetIndex = currentGroupIndex;
        setTimeout(() => {
          setCurrentGroupIndex(prevIndex => (prevIndex === targetIndex ? targetIndex + 1 : prevIndex));
        }, 120);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!readyToSave) return;
    const payload = {
      producerId: producer?.id,
      answers,
      strengths,
      focusAreas,
      status: totals.status,
      completion: totals.completion,
      savedAt: new Date().toISOString()
    };
    onSaveAssessment?.(payload);
  };

  return (
    <div className="selfcheck-page container">
      <div className="selfcheck-topbar">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => onNavigate('producerDashboard')}
        >
          <ArrowLeft size={16} /> Volver al dashboard
        </button>
        <div className="selfcheck-top-meta">
          <ShieldCheck size={18} />
          <span>Autoevaluación de bioseguridad y control de enfermedades</span>
        </div>
      </div>

      <div className="selfcheck-hero surface-card">
        <div>
          <span className="hero-eyebrow">Productor</span>
          <h1 className="h1">Autodiagnóstico rápido</h1>
          <p className="hero-text">
            Este autodiagnóstico te señala qué reforzar en bioseguridad y en el manejo de Moko y Foc
            R4T. No es una nota: es una guía práctica para enfocar apoyo donde más se necesita.
          </p>
          <div className="hero-tags">
            <span className="tag-intent">
              <Info size={14} /> Responde según tu realidad actual; refinamos a partir de aquí.
            </span>
            <span className="tag-intent">
              <ClipboardCheck size={14} /> 4 opciones: Sí · En parte · No · No lo sé.
            </span>
          </div>
        </div>
        <div className={`status-chip status-${totals.status.tone}`}>
          <span className="status-dot" />
          <div>
            <p>{totals.status.label}</p>
            <small>{totals.status.message}</small>
          </div>
        </div>
      </div>

      <div className="selfcheck-statsbar surface-card">
        <div className="stat-pill">
          <ListChecks size={18} />
          <div>
            <p>Preguntas</p>
            <strong>{flatQuestions.length}</strong>
            <small>Total de preguntas</small>
          </div>
        </div>
        <div className="stat-pill">
          <Sparkles size={18} />
          <div>
            <p>Respondidas</p>
            <strong>{answeredCount}</strong>
            <small>Avance actual</small>
          </div>
        </div>
        <div className="stat-pill">
          <CircleHelp size={18} />
          <div>
            <p>Pendientes</p>
            <strong>{pendingCount}</strong>
            <small>Para completar</small>
          </div>
        </div>
      </div>

      <div className="selfcheck-grid">
        <section className="selfcheck-form surface-card">
          <div className="stepper">
            {QUESTION_GROUPS.map((group, index) => {
              const completed = group.questions.every(q => answers[q.id]);
              const active = index === currentGroupIndex;
              const Icon = SECTION_ICONS[group.id] || Sparkles;
              const dotClass = completed ? 'dot-complete' : 'dot-pending';
              return (
                <button
                  key={group.id}
                  type="button"
                  className={`step-chip ${active ? 'is-active' : ''} ${completed ? 'is-complete' : ''}`}
                  onClick={() => setCurrentGroupIndex(index)}
                >
                  <span className="step-number">{index + 1}</span>
                  <div className="step-text">
                    <p><Icon size={16} /> {group.title}</p>
                    <span className={`step-dot ${dotClass}`} aria-label={completed ? 'Completa' : 'Pendiente'} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="question-group">
            <div className="group-header">
              <div>
                <p className="group-eyebrow">{currentGroup.title}</p>
                <h3 className="group-title">{currentGroup.description}</h3>
              </div>
              <span className={`group-status ${isCurrentGroupComplete ? 'complete' : ''}`}>
                {groupCompletion}/{currentGroup.questions.length} lista
              </span>
            </div>
            <div className="group-questions">
              {currentGroup.questions.map(question => {
                const selected = answers[question.id];
                const cardTone = selected ? `option-${selected}` : '';
                return (
                  <article key={question.id} className={`question-card ${cardTone}`}>
                    <div className="question-text">
                      <span className="question-id">{question.label || question.id.replace(/_/g, ' ').toUpperCase()}</span>
                      <p>{question.text}</p>
                      <small>Acción sugerida: {question.action}</small>
                    </div>
                    <div className="question-options">
                      {RESPONSE_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          className={`option-pill ${selected === option.value ? 'is-selected' : ''} option-${option.value}`}
                          onClick={() => handleAnswerChange(question.id, option.value)}
                        >
                          <span>{option.label}</span>
                          <small>{option.helper}</small>
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="stepper-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setCurrentGroupIndex(Math.max(0, currentGroupIndex - 1))}
              disabled={currentGroupIndex === 0}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <div className="stepper-actions-right">
              {!isCurrentGroupComplete && (
                <span className="step-helper">Responde esta sección para continuar.</span>
              )}
              {currentGroupIndex < QUESTION_GROUPS.length - 1 ? (
                <button
                  type="button"
                  className="button btn-primary"
                  onClick={() => setCurrentGroupIndex(Math.min(QUESTION_GROUPS.length - 1, currentGroupIndex + 1))}
                  disabled={!isCurrentGroupComplete}
                >
                  Siguiente sección <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="button btn-primary"
                  disabled={!readyToSave}
                  onClick={handleSave}
                  title={!readyToSave ? 'Responde todas las preguntas para guardar' : 'Guardar autoevaluación'}
                >
                  <Save size={16} /> Guardar autoevaluación
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="selfcheck-summary surface-card">
          <div className="summary-header">
            <Target size={18} />
            <div>
              <p className="summary-eyebrow">Resultado en tiempo real</p>
              <h3>Fortalezas y refuerzos</h3>
            </div>
          </div>

          <div className="summary-meter">
            <div className="meter-label">
              <span>Avance</span>
              <strong>{totals.completion}%</strong>
            </div>
            <div className="meter-bar">
              <div
                className={`meter-fill tone-${totals.status.tone}`}
                style={{ width: `${Math.min(totals.completion, 100)}%` }}
              />
            </div>
            <p className="meter-helper">{answeredCount} de {flatQuestions.length} preguntas respondidas.</p>
          </div>

          <div className="pill-stats">
            <span className="pill good"><CheckCircle2 size={14} /> Sí: {totals.yesCount}</span>
            <span className="pill caution"><Lightbulb size={14} /> En parte: {totals.partialCount}</span>
            <span className="pill alert"><AlertTriangle size={14} /> No: {totals.noCount}</span>
            <span className="pill neutral"><Info size={14} /> No lo sé: {totals.unknownCount}</span>
          </div>

          <div className="summary-block">
            <div className="block-header">
              <Sparkles size={16} />
              <span>Fortalezas</span>
            </div>
            {strengths.length === 0 ? (
              <p className="summary-empty">Verás aquí tus prácticas que ya se cumplen (Sí).</p>
            ) : (
              <ul className="summary-list">
                {strengths.slice(0, 4).map(item => (
                  <li key={item.id}>
                    <CheckCircle2 size={14} /> {item.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="summary-block">
            <div className="block-header">
              <AlertTriangle size={16} />
              <span>Refuerzos priorizados</span>
            </div>
            {focusAreas.length === 0 ? (
              <p className="summary-empty">Al responder En parte/No/No lo sé verás qué reforzar aquí.</p>
            ) : (
              <ul className="summary-list">
                {focusAreas.map(item => (
                  <li key={item.id}>
                    <Lightbulb size={14} />
                    <div>
                      <p>{item.text}</p>
                      <small>{item.action}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="summary-actions">
            <button
              type="button"
              className="button btn-primary"
              disabled={!readyToSave}
              onClick={handleSave}
              title={!readyToSave ? 'Responde todas las preguntas para guardar' : 'Guardar autoevaluación'}
            >
              <Save size={16} /> Guardar autoevaluación
            </button>
            <p className="save-helper">
              {readyToSave ? 'Se enviará al gerente para enfocar refuerzos.' : 'Completa todas las respuestas para compartir tu autodiagnóstico.'}
            </p>
            {savedAssessment?.savedAt && (
              <p className="last-save">
                Última autoevaluación: {new Date(savedAssessment.savedAt).toLocaleString()}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProducerSelfCheck;
