// src/views/VisitorAccess/RequestVisitForm.jsx
import React, { useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { VISIT_PURPOSES, VALUE_CHAIN_CATEGORIES } from '../../data/constants';
// ¡CAMBIO IMPORTANTE! Usamos la lista plana de fincas
import { MOCK_FINCAS_FLAT } from '../../data/mockData'; 
import './VisitorAccess.css'; // Usa el CSS compartido

const initialFormState = {
  fincaId: MOCK_FINCAS_FLAT[0]?.id || 'f1', // Asegurar que el default sea válido
  name: '',
  // --- CAMBIO CLAVE ---
  // Forzamos el ID para que coincida con el filtro en App.js
  // En una app real, esto vendría de un estado de login de visitante.
  id: '12345', 
  company: '',
  purpose: VISIT_PURPOSES[0],
  valueChain: VALUE_CHAIN_CATEGORIES[0],
  entryTime: '',
  exitTime: '',
};

function RequestVisitForm({ onNewRequest }) {
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState('');

  const isFormValid = () => {
    // El ID ya no necesita ser validado manualmente
    return formData.fincaId.trim() !== '' &&
           formData.name.trim() !== '' &&
           formData.company.trim() !== '' &&
           formData.purpose.trim() !== '' &&
           formData.valueChain.trim() !== '' &&
           formData.entryTime.trim() !== '' &&
           formData.exitTime.trim() !== '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Por favor, complete todos los campos para solicitar la visita.');
      return;
    }
    // onNewRequest ahora es una promesa
    onNewRequest(formData).then(() => {
      setMessage('✅ Visita solicitada. Una vez aprobada, su pase QR estará disponible en la pestaña "Mis Pases QR".');
    });
  };

  if (message) {
    return (
      <div className="messageBox">
        <p>{message}</p>
        <Button onClick={() => {
          setMessage('');
          setFormData(initialFormState);
        }}>
          Solicitar Otra Visita
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {/* --- CAMPO FINCA (Ahora usa MOCK_FINCAS_FLAT) --- */}
      <div className="inputGroup">
        <label htmlFor="fincaId">Finca a Visitar</label>
        <select
          id="fincaId"
          name="fincaId"
          value={formData.fincaId}
          onChange={handleChange}
          className="inputField"
          required
        >
          {MOCK_FINCAS_FLAT.map(finca => (
            <option key={finca.id} value={finca.id}>{finca.name} (Prod: {finca.owner})</option>
          ))}
        </select>
      </div>

      <Input
        label="Nombre Completo"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      {/* --- ID AHORA OCULTO O FIJO --- */}
      <Input
        label="Nro. de Identificación (Cédula/Pasaporte)"
        name="id"
        value={formData.id}
        onChange={handleChange}
        required
        disabled // Lo deshabilitamos para que el usuario no lo cambie
        style={{backgroundColor: '#f9f9f9'}}
      />
      
      <Input
        label="Compañía / Institución"
        name="company"
        value={formData.company}
        onChange={handleChange}
        required
      />
      
      {/* --- MOTIVO (DROPDOWN) --- */}
      <div className="inputGroup">
        <label htmlFor="purpose">Motivo de la Visita</label>
        <select
          id="purpose"
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          className="inputField"
          required
        >
          {VISIT_PURPOSES.map(purpose => (
            <option key={purpose} value={purpose}>{purpose}</option>
          ))}
        </select>
      </div>

      {/* --- CADENA DE VALOR --- */}
      <div className="inputGroup">
        <label htmlFor="valueChain">Parte de la Cadena de Valor</label>
        <select
          id="valueChain"
          name="valueChain"
          value={formData.valueChain}
          onChange={handleChange}
          className="inputField"
          required
        >
          {VALUE_CHAIN_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      <Input
        label="Hora de Entrada (Fecha y Hora)"
        name="entryTime"
        type="datetime-local"
        value={formData.entryTime}
        onChange={handleChange}
        required
      />
      <Input
        label="Hora de Salida (Fecha y Hora)"
        name="exitTime"
        type="datetime-local"
        value={formData.exitTime}
        onChange={handleChange}
        required
      />
      
      <Button type="submit" variant="primary" disabled={!isFormValid()}>
        Solicitar Visita
      </Button>
    </form>
  );
}

export default RequestVisitForm;
