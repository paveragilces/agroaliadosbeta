// En: src/views/ManageWorkers/ManageWorkers.jsx
// --- NUEVO ARCHIVO ---

import React, { useState } from 'react';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import RiskTag from '../../components/ui/RiskTag/RiskTag';
import { ICONS } from '../../config/icons';
import './ManageWorkers.css';

// Formulario interno para registrar
const RegisterWorkerForm = ({ labores, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [labor, setLabor] = useState(labores[0]?.value || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !idNumber || !age || !experience || !labor) return;
    onSubmit({
      name,
      idNumber,
      age: parseInt(age, 10),
      experience: parseInt(experience, 10),
      labor,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="worker-form">
      <Input
        label="Nombre Completo"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Cédula / ID"
        name="idNumber"
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value)}
        required
      />
      <div className="form-grid">
        <Input
          label="Edad"
          name="age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
        <Input
          label="Años de Experiencia"
          name="experience"
          type="number"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          required
        />
      </div>
      <div className="formGroup">
        <label className="label" htmlFor="laborSelect">Labor Principal</label>
        <select
          id="laborSelect"
          className="select"
          value={labor}
          onChange={(e) => setLabor(e.target.value)}
        >
          {labores.map(l => (
            <option key={l.value} value={l.value}>
              {l.label} (Riesgo: {l.risk})
            </option>
          ))}
        </select>
      </div>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="button btn-primary">
          Registrar Trabajador
        </button>
      </div>
    </form>
  );
};

// Componente principal
const ManageWorkers = ({ workers, labores, onRegisterWorker }) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const getLaborInfo = (laborValue) => {
    return labores.find(l => l.value === laborValue) || { label: 'Desconocido', risk: 'N/A' };
  };

  return (
    <>
      <div className="container producer-worker-page">
        <div className="worker-header">
          <h1 className="h1">Mis Trabajadores ({workers.length})</h1>
          <button
            className="button btn-primary"
            onClick={() => setShowRegisterModal(true)}
          >
            <Icon path={ICONS.userPlus} /> Registrar Nuevo Trabajador
          </button>
        </div>

        <div className="worker-card-grid">
          {workers.map(worker => {
            const laborInfo = getLaborInfo(worker.labor);
            return (
              <div key={worker.id} className="worker-card">
                <h2 className="worker-name">{worker.name}</h2>
                <p className="worker-id">ID: {worker.idNumber}</p>
                
                <div className="worker-details-grid">
                  <div className="worker-detail">
                    <span className="detail-label">Edad</span>
                    <span className="detail-value">{worker.age} años</span>
                  </div>
                  <div className="worker-detail">
                    <span className="detail-label">Experiencia</span>
                    <span className="detail-value">{worker.experience} años</span>
                  </div>
                </div>
                
                <div className="worker-labor">
                  <span className="detail-label">Labor Principal</span>
                  <p className="labor-name">{laborInfo.label}</p>
                  <RiskTag riskLevel={laborInfo.risk} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Registro */}
      {showRegisterModal && (
        <Modal
          title="Registrar Nuevo Trabajador"
          onClose={() => setShowRegisterModal(false)}
          size="medium"
        >
          <RegisterWorkerForm
            labores={labores}
            onSubmit={(data) => {
              onRegisterWorker(data);
              setShowRegisterModal(false);
            }}
            onCancel={() => setShowRegisterModal(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default ManageWorkers;