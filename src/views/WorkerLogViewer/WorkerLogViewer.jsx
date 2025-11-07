// En: src/views/WorkerLogViewer/WorkerLogViewer.jsx
// --- ARCHIVO MODIFICADO ---

import React from 'react';
import Table from '../../components/ui/Table/Table';
import EmptyState from '../../components/ui/EmptyState';
import { ICONS } from '../../config/icons';
import './WorkerLogViewer.css';

// --- CAMBIO 1: Aceptamos 'cintasOptions' ---
const WorkerLogViewer = ({ workLogs, workers, fincas, cintasOptions }) => {

  const tableHeaders = [
    { label: 'Fecha' },
    { label: 'Trabajador' },
    { label: 'Finca / Lote' },
    { label: 'Cintas' }, 
    { label: 'Descripción de Labor' },
  ];

  // --- CAMBIO 2: Helper para encontrar el color HEX ---
  const getColorHex = (cintaValue) => {
    // Si cintasOptions no se ha cargado, devuelve un color por defecto
    if (!cintasOptions) return '#FFFFFF'; 
    const cinta = cintasOptions.find(c => c.value === cintaValue);
    return cinta ? cinta.color : '#FFFFFF'; // Blanco por defecto
  };

  const renderLogEntryRow = (log) => {
    const worker = workers.find(w => w.id === log.workerId);
    const finca = fincas.find(f => f.id === log.fincaId);

    return (
      <>
        <td>{new Date(log.date).toLocaleDateString()}</td>
        <td>
          {worker ? worker.name : <span className="text-muted">ID: {log.workerId}</span>}
        </td>
        <td>
          <div className="log-location">
            <span className="finca-name">{finca ? finca.name : 'N/A'}</span>
            <span className="lote-name">{log.lote || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div className="cintas-container">
            {/* --- CAMBIO 3: Aseguramos que 'log.cintas' exista --- */}
            {(log.cintas || []).map(cintaValue => (
              <div 
                key={cintaValue}
                className="cinta-swatch"
                title={cintaValue}
                style={{ backgroundColor: getColorHex(cintaValue) }}
              />
            ))}
          </div>
        </td>
        <td className="log-description">{log.description || <span className="text-muted">N/A</span>}</td>
      </>
    );
  };

  return (
    <div className="container worker-log-viewer-page">
      <h1 className="h1">Registro de Labores Diarias (Completadas)</h1>
      
      {workLogs.length === 0 ? (
        <EmptyState
          iconPath={ICONS.report}
          title="Sin Registros Completados"
          message="Tus trabajadores aún no han completado ningún reporte de labor."
        />
      ) : (
        <Table
          headers={tableHeaders}
          data={workLogs}
          renderRow={renderLogEntryRow}
        />
      )}
    </div>
  );
};

export default WorkerLogViewer;