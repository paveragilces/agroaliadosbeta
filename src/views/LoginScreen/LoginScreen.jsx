// En: src/views/LoginScreen.jsx
// --- ARCHIVO MODIFICADO ---

import React, { useState } from 'react';
import Icon from '../../components/ui/Icon';
import { ICONS } from '../../config/icons';
import './LoginScreen.css'; 

// Importamos todos los íconos que usaremos
const { 
  producer, 
  manager, 
  technician, 
  visitor, 
  checkIn, 
  dashboard, 
  userPlus,  // <-- CAMBIO 1: Importamos el icono para trabajador
  arrowLeft  
} = ICONS; 

/**
 * Pantalla de Login (Pública) - VISTA MEJORADA (Tarjetas + Lista)
 */
const LoginScreen = ({ onLogin }) => {
  // 'main', 'admin', 'finca'
  const [view, setView] = useState('main'); 

  return (
    <div className="loginContainer">
      <div className="loginBox">
        
        <div className="loginLogo">
          <span>Agro</span>
          <span className="loginLogoSub">Aliados</span>
        </div>
        
        {/* --- VISTA 1: PRINCIPAL (Con Tarjetas) --- */}
        {view === 'main' && (
          <div className="loginViewPanel">
            <h1 className="loginTitle">Bienvenido</h1>
            <p className="loginSubtitle">Por favor, selecciona tu portal de ingreso.</p>
            
            <div className="loginCardGrid">
              <button className="loginSelectCard" onClick={() => setView('admin')}>
                <Icon path={dashboard} size="36px" />
                <span>Portal Administrativo</span>
              </button>
              <button className="loginSelectCard" onClick={() => setView('finca')}>
                <Icon path={checkIn} size="36px" />
                <span>Ingreso a Finca</span>
              </button>
              {/* --- CAMBIO 2: Nuevo botón para Trabajador --- */}
              <button className="loginSelectCard" onClick={() => onLogin('worker')}>
                <Icon path={userPlus} size="36px" />
                <span>Portal de Trabajador</span>
              </button>
            </div>
          </div>
        )}
        
        {/* --- VISTA 2: LOGIN ADMIN (Con Lista) --- */}
        {view === 'admin' && (
          <div className="loginViewPanel">
            <button className="loginBackButton" onClick={() => setView('main')}>
              <Icon path={arrowLeft} size="16px" /> Volver
            </button>
            <h1 className="loginTitle">Portal Administrativo</h1>
            <p className="loginSubtitle">Selecciona tu rol.</p>
            
            <div className="loginButtonList">
              <button className="loginSelectButton" onClick={() => onLogin('producer')}>
                <Icon path={producer} />
                <span>Productor</span>
              </button>
              <button className="loginSelectButton" onClick={() => onLogin('manager')}>
                <Icon path={manager} />
                <span>Líder</span> 
              </button>
              <button className="loginSelectButton" onClick={() => onLogin('technician')}>
                <Icon path={technician} />
                <span>Técnico</span>
              </button>
            </div>
          </div>
        )}
        
        {/* --- VISTA 3: INGRESO A FINCA (Con Lista) --- */}
        {view === 'finca' && (
          <div className="loginViewPanel">
            <button className="loginBackButton" onClick={() => setView('main')}>
              <Icon path={arrowLeft} size="16px" /> Volver
            </button>
            <h1 className="loginTitle">Ingreso a Finca</h1>
            <p className="loginSubtitle">Selecciona tu portal.</p>
            
            <div className="loginButtonList">
              <button className="loginSelectButton" onClick={() => onLogin('public', 'visitorForm')}>
                <Icon path={visitor} />
                <span>Portal de Visitantes</span>
              </button>
              <button className="loginSelectButton" onClick={() => onLogin('public', 'visitorCheckIn')}>
                <Icon path={checkIn} />
                <span>Portal de Portería</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginScreen;