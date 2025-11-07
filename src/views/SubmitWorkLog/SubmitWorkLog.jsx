// En: src/views/SubmitWorkLog/SubmitWorkLog.jsx
// --- ARCHIVO MODIFICADO ---

import React, { useState } from 'react';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal'; 
import Input from '../../components/ui/Input'; 
import { ICONS } from '../../config/icons';
import { LABORES_FINCA } from '../../data/constants'; 
// --- CAMBIO 1: Corregir la ruta de importación ---
import ColorPaletteSelector from '../../components/ui/ColorPaletteSelector/ColorPaletteSelector';
import EmptyState from '../../components/ui/EmptyState';
import './SubmitWorkLog.css';

/**
 * Formulario interno para llenar el reporte de labor
 * Se muestra DENTRO de un Modal.
 */
const WorkLogForm = ({ log, fincas, cintasOptions, onSubmit, onCancel }) => {
  
  // Rellenamos el estado con los datos existentes (si los hay)
  const [selectedFincaId, setSelectedFincaId] = useState(log.fincaId || fincas[0]?.id || '');
  const [selectedLote, setSelectedLote] = useState(log.lote || '');
  const [selectedLabor, setSelectedLabor] = useState(log.labor || LABORES_FINCA[0]?.value || '');
  const [selectedCintas, setSelectedCintas] = useState(log.cintas || []);
  const [description, setDescription] = useState(log.description || '');

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
    // Devolvemos solo los datos del formulario
    onSubmit({
      fincaId: selectedFincaId,
      lote: selectedLote,
      labor: selectedLabor,
      cintas: selectedCintas, 
      description: description
    });
  };

  return (
    <form onSubmit={handleSubmit}>
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

      <div className="formGroup">
        <label className="label" htmlFor="laborSelect">
          <Icon path={ICONS.tasks} size={16} /> Labor Principal Realizada
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
          <Icon path={ICONS.filter} size={16} /> Colores de Cinta Trabajados
        </label>
        <ColorPaletteSelector
          options={cintasOptions}
          selected={selectedCintas}
          onChange={setSelectedCintas}
        />
      </div>

      <div className="formGroup">
        <label className="label" htmlFor="description">
          <Icon path={ICONS.comment} size={16} /> Detalles Adicionales
        </label>
        <textarea
          id="description"
          className="textarea"
          rows="5"
          placeholder="Ej: Deshije en hileras 10-15. Enfunde de 80 racimos con cinta azul."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
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
const SubmitWorkLog = ({ fincas, pendingLogs, onSubmitWorkLog, onNavigate, cintasOptions }) => {

  const [editingLog, setEditingLog] = useState(null); // Guarda el log que se está editando

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
      <h1 className="h1">Registrar Labor Diaria</h1>
      
      {pendingLogs.length === 0 ? (
        <EmptyState
          iconPath={ICONS.checkIn}
          title="No hay reportes pendientes"
          message="Tu último registro de ingreso ya fue completado. ¡Realiza un nuevo check-in en portería para crear un reporte!"
        />
      ) : (
        <>
          <p>Selecciona el día de trabajo que deseas reportar.</p>
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
                  Completar Reporte <Icon path={ICONS.chevronDown} style={{ transform: 'rotate(-90deg)' }} />
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
    </div>
  );
};

export default SubmitWorkLog;