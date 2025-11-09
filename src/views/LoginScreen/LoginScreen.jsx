import React, { useState } from 'react';
import './LoginScreen.css';

// --- IMPORTACIONES DE LUCIDE-REACT (CORREGIDAS) ---
import {
  Users, // Reemplaza a 'producer'
  Briefcase, // Reemplaza a 'manager'
  ClipboardCheck, // Reemplaza a 'technician'
  User, // Reemplaza a 'visitor'
  LogIn, // Reemplaza a 'checkIn'
  LayoutDashboard, // Reemplaza a 'dashboard'
  UserPlus,
  ArrowLeft,
  CheckCircle,
  BookUser, // Reemplaza a 'training'
  ClipboardSignature, // <--- REEMPLAZO DE 'visitIcon' (EL CORREGIDO)
  Building, // Para 'Ingreso a Finca'
} from 'lucide-react';

// --- CONSTANTES ACTUALIZADAS CON LOS COMPONENTES DE LUCIDE ---

const HERO_HIGHLIGHTS = [
  {
    icon: CheckCircle, // Componente de Lucide
    label: 'Supervisión completa',
    copy: 'Monitorea alertas, inspecciones y bitácoras en tiempo real.',
  },
  {
    icon: BookUser, // Componente de Lucide
    label: 'Equipo coordinado',
    copy: 'Asigna planes de contención y capacitaciones al instante.',
  },
  {
    icon: ClipboardSignature, // <--- AQUÍ ESTÁ LA CORRECCIÓN
    label: 'Accesos seguros',
    copy: 'Gestiona visitantes, portería y registros con códigos QR.',
  },
];

// Array de los componentes de icono
const HERO_ROLE_ICONS = [Users, Briefcase, ClipboardCheck, User];

const LoginScreen = ({ onLogin }) => {
  const [view, setView] = useState('main');

  const handleLogin = (role, page) => {
    if (page) {
      onLogin(role, page);
    } else {
      onLogin(role);
    }
  };

  return (
    <div className="loginScreen">
      <div className="loginShell">
        <section className="loginHero">
          <span className="heroBadge">AgroAliados</span>
          <h1 className="heroTitle">Impulsa la bioseguridad agrícola</h1>
          <p className="heroSubtitle">
            Coordina equipos, visitas y planes de acción desde un centro de comando unificado.
          </p>

          <div className="heroIconStack">
            {HERO_ROLE_ICONS.map((IconComponent, index) => (
              <span className="heroIconBubble" key={`hero-icon-${index}`}>
                {/* Renderiza el componente de icono dinámicamente */}
                <IconComponent size={24} />
              </span>
            ))}
          </div>

          <ul className="heroHighlights">
            {HERO_HIGHLIGHTS.map((item) => {
              // Obtiene el componente de icono del item
              const HighlightIcon = item.icon;
              return (
                <li key={item.label}>
                  <span className="highlightIcon">
                    <HighlightIcon size={20} />
                  </span>
                  <div>
                    <span className="highlightTitle">{item.label}</span>
                    <p className="highlightCopy">{item.copy}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="loginPanel">
          <header className="loginPanelHeader">
            <span className="loginPanelBadge">Portal Seguro</span>
            <h2>Accede a tu espacio de trabajo</h2>
            <p>Selecciona el flujo que corresponde a tu rol dentro de AgroAliados.</p>
          </header>

          <div className="loginContent">
            {view !== 'main' && (
              <button className="loginBackButton" onClick={() => setView('main')}>
                {/* Icono de Lucide (nota el className) */}
                <ArrowLeft size={16} className="icon-svg" />
                Regresar
              </button>
            )}

            {view === 'main' && (
              <div className="loginViewPanel">
                <h3 className="loginViewTitle">¿Dónde quieres ingresar?</h3>
                <p className="loginViewSubtitle">Elige el portal que necesitas para continuar.</p>

                <div className="loginCardGrid">
                  <button className="loginSelectCard" onClick={() => setView('admin')}>
                    <span className="loginCardIcon">
                      {/* Icono de Lucide (nota size={numero}) */}
                      <LayoutDashboard size={36} />
                    </span>
                    <span className="loginCardLabel">Portal Administrativo</span>
                  </button>

                  <button className="loginSelectCard" onClick={() => setView('finca')}>
                    <span className="loginCardIcon">
                      <Building size={36} />
                    </span>
                    <span className="loginCardLabel">Ingreso a Finca</span>
                  </button>

                  <button className="loginSelectCard" onClick={() => handleLogin('worker')}>
                    <span className="loginCardIcon">
                      <UserPlus size={36} />
                    </span>
                    <span className="loginCardLabel">Portal de Trabajador</span>
                  </button>
                </div>
              </div>
            )}

            {view === 'admin' && (
              <div className="loginViewPanel">
                <h3 className="loginViewTitle">Portal Administrativo</h3>
                <p className="loginViewSubtitle">Selecciona el rol con el que deseas trabajar.</p>

                <div className="loginButtonList">
                  <button className="loginSelectButton" onClick={() => handleLogin('producer')}>
                    <Users className="icon-svg" />
                    <span>Productor</span>
                  </button>
                  <button className="loginSelectButton" onClick={() => handleLogin('manager')}>
                    <Briefcase className="icon-svg" />
                    <span>Líder</span>
                  </button>
                  <button className="loginSelectButton" onClick={() => handleLogin('technician')}>
                    <ClipboardCheck className="icon-svg" />
                    <span>Técnico</span>
                  </button>
                </div>
              </div>
            )}

            {view === 'finca' && (
              <div className="loginViewPanel">
                <h3 className="loginViewTitle">Ingreso a Finca</h3>
                <p className="loginViewSubtitle">Escoge el portal que deseas abrir.</p>

                <div className="loginButtonList">
                  <button className="loginSelectButton" onClick={() => handleLogin('public', 'visitorForm')}>
                    <User className="icon-svg" />
                    <span>Portal de Visitantes</span>
                  </button>
                  <button className="loginSelectButton" onClick={() => handleLogin('public', 'visitorCheckIn')}>
                    <LogIn className="icon-svg" />
                    <span>Portal de Portería</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginScreen;