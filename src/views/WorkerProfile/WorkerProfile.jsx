// En: src/views/WorkerProfile/WorkerProfile.jsx
// --- ARCHIVO COMPLETO Y REDISEÑADO ---

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../../components/ui/Icon';
import RiskTag from '../../components/ui/RiskTag/RiskTag';
import { ICONS } from '../../config/icons';
import './WorkerProfile.css';

const WorkerProfile = ({ worker, labor }) => {

  return (
    <div className="container worker-profile-page">
      {/* El header se mantiene igual */}
      <div className="profile-header">
        <Icon path={ICONS.user} className="header-icon" />
        <div>
          <h1 className="h1">{worker.name}</h1>
          <p className="worker-id">ID: {worker.idNumber}</p>
        </div>
      </div>
      
      <div className="profile-grid">
        {/* --- CAMBIO 1: Columna de Detalles (Ahora a la izquierda) --- */}
        <div className="details-card">
          <h2 className="h2">Mi Información</h2>
          
          {/* La Labor ahora está primero */}
          <div className="worker-labor-primary">
            <span className="detail-label">Labor Principal</span>
            <p className="labor-name">{labor.label}</p>
            <RiskTag riskLevel={labor.risk} />
          </div>

          {/* Detalles secundarios */}
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
        </div>
        
        {/* --- CAMBIO 2: Tarjeta QR rediseñada como credencial --- */}
        <div className="qr-card">
          <h2 className="h2">Mi Código QR de Ingreso</h2>
          <p>Presenta este código en la portería para registrar tu ingreso y salida.</p>
          
          <div className="qr-code-badge">
            <div className="qr-badge-header">
              <Icon path={ICONS.user} size={16} />
              <span>TRABAJADOR AUTORIZADO</span>
            </div>
            <div className="qr-code-container">
              <QRCodeSVG 
                value={worker.qrCode} 
                size={256} 
                style={{ width: '100%', height: 'auto' }} 
              />
            </div>
            <div className="qr-badge-footer">
              <span className="qr-name">{worker.name}</span>
              <span className="qr-id">{worker.idNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;