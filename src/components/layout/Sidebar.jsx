// En: src/components/layout/Sidebar.jsx
// --- ARCHIVO MODIFICADO ---

import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { ICONS } from '../../config/icons';
import './Sidebar.css';

/**
 * Barra Lateral (Sidebar) - REDISEÑADO
 */
const Sidebar = ({ userRole, currentPage, onNavigate }) => {

  // --- Sub-componente interno: SidebarButton ---
  const SidebarButton = ({ page, iconPath, label }) => {
    const isSelected = currentPage === page;
    const [hover, setHover] = useState(false);

    const buttonClasses = [
      'sidebarButton',
      isSelected ? 'selected' : '',
      !isSelected && hover ? 'hover' : ''
    ].filter(Boolean).join(' ');

    return (
      <button
        className={buttonClasses}
        onClick={() => onNavigate(page)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Icon path={iconPath} color={isSelected ? '#005a3a' : '#718096'} />
        {label}
      </button>
    );
  };
  // --- Fin de Sub-componente ---

  if (!userRole) return null;

  return (
    <div className="sidebar">
      <div>
        <div className="sidebarLogo">
          <span>Agro</span>
          <span className="sidebarLogoSub">Aliados</span>
        </div>

        <nav className="sidebarNav">
          {/* --- Vistas de Productor --- */}
          {userRole === 'producer' && (
            <>
              <SidebarButton page="producerDashboard" iconPath={ICONS.dashboard} label="Dashboard" />
              <SidebarButton page="producerAlertList" iconPath={ICONS.alert} label="Registro de Alertas" />
              <SidebarButton page="producerTasks" iconPath={ICONS.tasks} label="Tareas Pendientes" />
              <SidebarButton page="visitorApproval" iconPath={ICONS.visit} label="Aprobar Visitas" />
              <SidebarButton page="producerVisitorLog" iconPath={ICONS.report} label="Log de Visitas" />
              <SidebarButton page="producerCertification" iconPath={ICONS.certification} label="Certificación" />
              <SidebarButton page="producerProfile" iconPath={ICONS.user} label="Mis Fincas" />
              
              {/* --- CAMBIO 1: Nuevos botones para Productor --- */}
              <hr className="sidebarDivider" />
              <SidebarButton page="manageWorkers" iconPath={ICONS.userPlus} label="Mis Trabajadores" />
              <SidebarButton page="workLogViewer" iconPath={ICONS.report} label="Registro de Labores" />
            </>
          )}

          {/* --- Vistas de Gerente --- */}
          {userRole === 'manager' && (
            <>
              <SidebarButton page="managerDashboard" iconPath={ICONS.dashboard} label="Dashboard" />
              <SidebarButton page="alertTriage" iconPath={ICONS.alert} label="Alertas" />
              <SidebarButton page="technicianControl" iconPath={ICONS.technician} label="Técnicos" />
              <SidebarButton page="visitorReport" iconPath={ICONS.visit} label="Visitas" />
            </>
          )}

          {/* --- Vistas de Técnico --- */}
          {userRole === 'technician' && (
            <>
              <SidebarButton page="technicianSchedule" iconPath={ICONS.calendar} label="Mi Agenda" />
              <SidebarButton page="technicianProfile" iconPath={ICONS.user} label="Mi Perfil" />
            </>
          )}

          {/* --- CAMBIO 2: Nuevo Sidebar para Trabajador --- */}
          {userRole === 'worker' && (
            <>
              <SidebarButton page="workerProfile" iconPath={ICONS.user} label="Mi Perfil / QR" />
              <SidebarButton page="submitWorkLog" iconPath={ICONS.tasks} label="Registrar Labor" />
            </>
          )}
        </nav>
      </div>

      <div className="sidebarFooter">
        <div className="footerLogoContainer">
          <img 
            src="https://res.cloudinary.com/do4vybtt4/image/upload/v1762369002/Lytiks-02_indfgk.svg" 
            alt="Lytiks Logo" 
            className="footerLogo"
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;