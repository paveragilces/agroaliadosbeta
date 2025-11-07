// En: src/views/WorkerCheckInLog/WorkerCheckInLog.jsx
// --- ARCHIVO CORREGIDO ---

import React from 'react';
import Table from '../../components/ui/Table/Table';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/Icon'; // <-- CAMBIO 1: Importar Icon
import { ICONS } from '../../config/icons'; // <-- CAMBIO 2: Importar ICONS
import './WorkerCheckInLog.css'; 

/**
 * Vista del Productor: Log de Ingreso/Salida de Trabajadores
 * Muestra el historial de check-ins de portería.
 */
const WorkerCheckInLog = ({ workerLog, onNavigate }) => {

  // Ordenamos por fecha (el más reciente primero)
  const sortedLog = [...workerLog].sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

  const tableHeaders = [
    { label: 'Trabajador' },
    { label: 'Fecha' },
    { label: 'Hora de Ingreso' },
    { label: 'Hora de Salida' },
    { label: 'Horas Trabajadas' },
    { label: 'Estado Reporte' }, 
  ];

  const formatTime = (isoString) => {
    if (!isoString) return <span className="text-muted">N/A</span>;
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return <span className="text-muted">--</span>;
    const inTime = new Date(checkIn);
    const outTime = new Date(checkOut);
    const diffMs = outTime - inTime;
    if (diffMs <= 0) return <span className="text-muted">--</span>;
    
    const hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
    return `${hours} horas`;
  };

  const renderLogEntryRow = (log) => {
    return (
      <>
        <td>
          <span className="worker-name-cell">{log.name}</span>
        </td>
        <td>{new Date(log.checkIn).toLocaleDateString()}</td>
        <td>{formatTime(log.checkIn)}</td>
        <td>{formatTime(log.checkOut)}</td>
        <td>
          <span className="hours-cell">
            {calculateHours(log.checkIn, log.checkOut)}
          </span>
        </td>
        <td>
          {/* El código que usaba Icon (ahora importado) */}
          {log.status === 'completed' ? (
            <span className="log-status-tag completed">
              <Icon path={ICONS.checkCircle} size={14} /> Completado
            </span>
          ) : (
            <span className="log-status-tag pending">
              <Icon path={ICONS.alert} size={14} /> Pendiente
            </span>
          )}
        </td>
      </>
    );
  };

  return (
    <div className="container worker-check-in-log-page">
      <h1 className="h1">Registro de Ingreso/Salida de Trabajadores</h1>
      <p>Un historial de todos los registros de portería de tu personal.</p>
      
      {sortedLog.length === 0 ? (
        <EmptyState
          iconPath={ICONS.checkIn}
          title="Sin Registros de Ingreso"
          message="Tu personal aún no ha registrado ningún ingreso o salida."
        />
      ) : (
        <Table
          headers={tableHeaders}
          data={sortedLog}
          renderRow={renderLogEntryRow}
        />
      )}
    </div>
  );
};

export default WorkerCheckInLog;