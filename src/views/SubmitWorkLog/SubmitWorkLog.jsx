// En: src/views/SubmitWorkLog/SubmitWorkLog.jsx
// --- ARCHIVO MODIFICADO ---

import React, { useMemo, useState } from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal'; 
import Input from '../../components/ui/Input'; 
import { ICONS } from '../../config/icons';
import { LABORES_FINCA } from '../../data/constants'; 
import ColorPaletteSelector from '../../components/ui/ColorPaletteSelector/ColorPaletteSelector';
import EmptyState from '../../components/ui/EmptyState';
import { AlertTriangle } from 'lucide-react';
import KnowledgeCheckModal from '../../components/worker/KnowledgeCheckModal';
import './SubmitWorkLog.css';

const SUSPICION_TYPES = [
  'Síntoma en planta',
  'Agua o suelo extraño',
  'Falla de bioseguridad',
  'Plaga o insectos',
  'Otro hallazgo'
];

/**
 * Formulario interno para llenar el reporte de labor
 * Se muestra DENTRO de un Modal.
 */
const WorkLogForm = ({ log, fincas, cintasOptions, onSubmit, onCancel, onSubmitSuspicion, worker }) => {
  
  // Rellenamos el estado con los datos existentes (si los hay)
  const [selectedFincaId, setSelectedFincaId] = useState(log.fincaId || fincas[0]?.id || '');
  const [selectedLote, setSelectedLote] = useState(log.lote || '');
  const [selectedLabor, setSelectedLabor] = useState(log.labor || LABORES_FINCA[0]?.value || '');
  const [selectedCintas, setSelectedCintas] = useState(log.cintas || []);
  const [description, setDescription] = useState(log.description || '');
  const [suspicionEnabled, setSuspicionEnabled] = useState(false);
  const [suspicionType, setSuspicionType] = useState(SUSPICION_TYPES[0]);
  const [suspicionNote, setSuspicionNote] = useState('');
  const [suspicionCount, setSuspicionCount] = useState('');

  const selectedFinca = fincas.find(f => f.id === selectedFincaId);
  const lotes = selectedFinca?.lotes || [];

  const handleFincaChange = (e) => {
    setSelectedFincaId(e.target.value);
    setSelectedLote(''); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFincaId || !selectedLote || !selectedLabor || !description || selectedCintas.length === 0) {
      alert('Por favor complete todos los campos, incluyendo al menos una cinta.');
      return;
    }
    onSubmit({
      fincaId: selectedFincaId,
      lote: selectedLote,
      labor: selectedLabor,
      cintas: selectedCintas, 
      description: description
    });

    if (suspicionEnabled && onSubmitSuspicion) {
      onSubmitSuspicion({
        workerId: worker?.id,
        workerName: worker?.name,
        producerId: worker?.producerId,
        fincaId: selectedFincaId,
        lote: selectedLote,
        type: suspicionType,
        note: suspicionNote,
        count: suspicionCount
      });
      setSuspicionNote('');
      setSuspicionCount('');
      setSuspicionEnabled(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="worklog-section">
        <p className="section-eyebrow">Ubicación</p>
        <h3 className="section-title">Finca y lote</h3>
        <div className="formGrid">
          <div className="formGroup">
            <label className="label" htmlFor="fincaSelect">
              <Icon path={ICONS.location} size={16} /> Finca donde trabajó
            </label>
            <select id="fincaSelect" className="select" value={selectedFincaId} onChange={handleFincaChange}>
              {fincas.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="formGroup">
            <label className="label" htmlFor="loteSelect">
              <Icon path={ICONS.plant} size={16} /> Lote trabajado
            </label>
            <select id="loteSelect" className="select" value={selectedLote} onChange={(e) => setSelectedLote(e.target.value)} disabled={lotes.length === 0}>
              <option value="">{lotes.length > 0 ? 'Seleccione un lote...' : 'Seleccione una finca primero'}</option>
              {lotes.map(lote => <option key={lote} value={lote}>{lote}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="worklog-section">
        <p className="section-eyebrow">Labor</p>
        <h3 className="section-title">Actividad y cintas</h3>
        <div className="formGrid">
          <div className="formGroup">
            <label className="label" htmlFor="laborSelect">
              <Icon path={ICONS.tasks} size={16} /> Labor principal realizada
            </label>
            <select 
              id="laborSelect" 
              className="select" 
              value={selectedLabor} 
              onChange={(e) => setSelectedLabor(e.target.value)}
            >
              {LABORES_FINCA.map(l => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="formGroup">
            <label className="label label-palette">
              <Icon path={ICONS.filter} size={16} /> Colores de cinta trabajados
            </label>
            <ColorPaletteSelector
              options={cintasOptions}
              selected={selectedCintas}
              onChange={setSelectedCintas}
            />
          </div>
        </div>
      </div>

      <div className="worklog-section">
        <p className="section-eyebrow">Detalle</p>
        <h3 className="section-title">Notas del día</h3>
        <div className="formGroup">
          <label className="label" htmlFor="description">
            <Icon path={ICONS.comment} size={16} /> Detalles adicionales
          </label>
          <textarea
            id="description"
            className="textarea"
            rows="4"
            placeholder="Ej: Deshije en hileras 10-15. Enfunde de 80 racimos con cinta azul."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="suspicion-inline">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={suspicionEnabled}
            onChange={(e) => setSuspicionEnabled(e.target.checked)}
          />
          <span><AlertTriangle size={16} /> Reportar sospecha en este lote (opcional)</span>
        </label>
        {suspicionEnabled && (
          <div className="formGrid">
            <div className="formGroup">
              <label className="label">Tipo de sospecha</label>
              <select
                className="select"
                value={suspicionType}
                onChange={(e) => setSuspicionType(e.target.value)}
              >
                {SUSPICION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="formGroup">
              <label className="label">Cantidad aproximada (plantas/área)</label>
              <input
                className="input"
                placeholder="Ej. 3 plantas"
                value={suspicionCount}
                onChange={(e) => setSuspicionCount(e.target.value)}
              />
            </div>
            <div className="formGroup">
              <label className="label">Nota</label>
              <input
                className="input"
                placeholder="Ej. amarillamiento en borde del lote"
                value={suspicionNote}
                onChange={(e) => setSuspicionNote(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <hr className="formDivider" />

      <div className="formActions">
        <Button 
          type="button" 
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="success"
          disabled={!selectedLote || !description || !selectedLabor || selectedCintas.length === 0}
        >
          <Icon path={ICONS.approve} /> Guardar Reporte
        </Button>
      </div>
    </form>
  );
};


/**
 * Vista Principal: SubmitWorkLog
 * Ahora muestra una lista de "días pendientes" que abren un modal.
 */
const SubmitWorkLog = ({
  fincas,
  pendingLogs,
  onSubmitWorkLog,
  onNavigate,
  cintasOptions,
  onSubmitSuspicion,
  worker,
  knowledgeCheck,
  needsKnowledgeCheck,
  onCompleteKnowledgeCheck,
  knowledgeQuestions = [],
  trainingTask,
  onCompleteTraining
}) => {

  const [editingLog, setEditingLog] = useState(null); // Guarda el log que se está editando
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  const knowledgeStatus = knowledgeCheck
    ? knowledgeCheck.passed
      ? 'apto'
      : 'refuerzo'
    : needsKnowledgeCheck
      ? 'pendiente'
      : 'sin-registro';

  const knowledgeLabel = {
    apto: 'QR actualizado',
    refuerzo: 'Necesita refuerzo',
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

  const sundayReminder = useMemo(() => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - sunday.getDay());
    return sunday.toLocaleDateString('es-EC', {
      weekday: 'long',
      day: '2-digit',
      month: 'short'
    });
  }, []);

  const handleKnowledgeResult = (result) => {
    onCompleteKnowledgeCheck?.(result);
  };

  const handleOpenModal = (log) => {
    setEditingLog(log);
  };

  const handleCloseModal = () => {
    setEditingLog(null);
  };

  const handleSaveAndClose = (logData) => {
    onSubmitWorkLog(editingLog.id, logData); // Pasa el ID del log y los nuevos datos
    handleCloseModal();
  };

  return (
    <div className="container submit-work-log-page">
      <header className="worklog-hero">
        <div>
          <span className="hero-eyebrow">Equipo operativo</span>
          <h1 className="h1">Registrar labor diaria</h1>
          <p className="hero-sub">Selecciona el turno pendiente y describe lo realizado en finca.</p>
        </div>
        <div className={`knowledge-chip status-${knowledgeStatus}`}>
          <span className="chip-label">{knowledgeLabel}</span>
          <small>Última actualización: {lastCheck}</small>
        </div>
      </header>

      <section className={`knowledge-banner status-${knowledgeStatus}`}>
        <div>
          <p className="banner-eyebrow">Verificación semanal</p>
          <h2>
            {knowledgeStatus === 'apto'
              ? 'Tu QR está listo para la semana'
              : 'Necesitas completar la prueba de bioseguridad'}
          </h2>
          <p className="banner-copy">
            El domingo enviamos un recordatorio automático ({sundayReminder}). Completa las preguntas antes
            de tu próximo ingreso para mantener activo tu QR y evitar contratiempos en portería.
          </p>
        </div>
        <div className="banner-actions">
          <button
            type="button"
            className={`button ${knowledgeStatus === 'apto' ? 'button-secondary' : 'btn-primary'}`}
            onClick={() => setShowKnowledgeModal(true)}
          >
            {knowledgeStatus === 'apto' ? 'Repasar' : 'Tomar prueba ahora'}
          </button>
          {knowledgeCheck && (
            <span className="score-pill">{knowledgeCheck.score}%</span>
          )}
        </div>
      </section>

      {trainingTask && !trainingTask.completed && (
        <section className="training-inline surface-card">
          <div>
            <p className="training-eyebrow">
              {trainingTask.requiresFieldPractice ? 'Práctica en campo requerida' : 'Refuerzo pendiente'}
            </p>
            <h3>{trainingTask.title}</h3>
            <p className="training-copy">{trainingTask.description}</p>
          </div>
          <div className="training-actions">
            <button type="button" className="button btn-primary" onClick={onCompleteTraining}>
              Marcar como completado
            </button>
          </div>
        </section>
      )}

      {pendingLogs.length === 0 ? (
        <EmptyState
          iconPath={ICONS.checkIn}
          title="No hay reportes pendientes"
          message="Tu último registro de ingreso ya fue completado. ¡Realiza un nuevo check-in en portería para crear un reporte!"
        />
      ) : (
        <>
          <p className="pending-helper">Elige el día de trabajo que deseas reportar.</p>
          <div className="day-card-list">
            {pendingLogs.map(log => (
              <button
                key={log.id}
                className="day-card"
                onClick={() => handleOpenModal(log)}
              >
                <div className="day-card-date">
                  {new Date(log.checkIn).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </div>
                <div className="day-card-time">
                  <Icon path={ICONS.checkIn} size={16} />
                  Ingreso: {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <span className="day-card-cta">
                  Completar reporte <Icon path={ICONS.chevronDown} style={{ transform: 'rotate(-90deg)' }} />
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {editingLog && (
        <Modal
          title={`Reporte del día: ${new Date(editingLog.date).toLocaleDateString()}`}
          onClose={handleCloseModal}
          size="large"
        >
          <WorkLogForm
            log={editingLog}
            fincas={fincas}
            cintasOptions={cintasOptions}
            onSubmit={handleSaveAndClose}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {showKnowledgeModal && (
        <Modal
          title="Prueba rápida de bioseguridad"
          onClose={() => setShowKnowledgeModal(false)}
          size="large"
        >
          <KnowledgeCheckModal
            workerName={worker?.name}
            questions={knowledgeQuestions}
            onSubmit={handleKnowledgeResult}
          />
        </Modal>
      )}
    </div>
  );
};

export default SubmitWorkLog;
