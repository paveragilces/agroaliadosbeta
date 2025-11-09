import React, { useEffect, useMemo, useState } from 'react';
import './Header.css';
import { ROLE_META } from '../../config/roles'; // <-- IMPORTADO
import { hexToRgba } from '../../utils/colors'; // <-- IMPORTADO

// --- Iconos de Lucide-React ---
import {
  LayoutDashboard,
  AlertTriangle,
  Calendar,
  ListTodo,
  Bell,
  ChevronUp,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';

const DASHBOARD_PAGES = {
  producer: 'producerDashboard',
  manager: 'managerDashboard',
  technician: 'technicianSchedule',
  worker: 'workerProfile',
};

// Actualizado para usar componentes de Lucide
const QUICK_ACTION_META = {
  producer: {
    page: 'producerAlertList',
    icon: AlertTriangle,
    label: 'Revisar alertas activas',
  },
  manager: {
    page: 'alertTriage',
    icon: AlertTriangle,
    label: 'Abrir triaje de alertas',
  },
  technician: {
    page: 'technicianSchedule',
    icon: Calendar,
    label: 'Ver agenda técnica',
  },
  worker: {
    page: 'submitWorkLog',
    icon: ListTodo,
    label: 'Registrar labor del día',
  },
};

const Header = ({ userRole, currentUser, unreadNotifications = 0, onNavigate, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const roleMeta = ROLE_META[userRole] || ROLE_META.default;
  const userName = currentUser?.name || currentUser?.owner || 'Usuario';
  const dashboardPage = DASHBOARD_PAGES[userRole];
  const quickAction = QUICK_ACTION_META[userRole];
  const accentBubbleBg = useMemo(() => hexToRgba(roleMeta.accent, 0.12), [roleMeta.accent]);
  const accentBubbleBorder = useMemo(() => hexToRgba(roleMeta.accent, 0.28), [roleMeta.accent]);

  // El icono ahora es un componente que viene de ROLE_META
  const RoleIcon = roleMeta.icon;
  const QuickActionIcon = quickAction?.icon; // Puede no existir

  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date()),
    []
  );

  useEffect(() => {
    if (!dropdownOpen) return undefined;

    const handleClickOutside = event => {
      if (!event.target.closest('.userMenu')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const toggleDropdown = () => setDropdownOpen(prev => !prev);
  const closeDropdown = () => setDropdownOpen(false);

  const handleProfileNavigation = () => {
    if (userRole === 'producer') {
      onNavigate('producerProfile');
    } else if (userRole === 'technician') {
      onNavigate('technicianProfile');
    } else if (userRole === 'worker') {
      onNavigate('workerProfile');
    }
    closeDropdown();
  };

  const handleLogout = () => {
    closeDropdown();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="appHeader" style={{ '--role-accent': roleMeta.accent }}>
      <div className="headerLeft">
        
        {/* --- CAMBIO AQUÍ --- */}
        <div className="headerGreeting" aria-label="Resumen del usuario">
          {/* Mensaje genérico en lugar del nombre */}
          <span className="headerGreetingName">Bienvenido de vuelta</span>
          {/* Se eliminó el rol duplicado */}
        </div>
        {/* --- FIN DEL CAMBIO --- */}

        <span className="headerDate" aria-label="Fecha actual">
          {currentDateLabel}
        </span>
      </div>

      <div className="headerRight">
        <div className="headerActions">
          {dashboardPage && (
            <button
              type="button"
              className="headerIconButton"
              onClick={() => onNavigate(dashboardPage)}
              title="Panel principal"
            >
              <LayoutDashboard size={18} />
            </button>
          )}

          {QuickActionIcon && (
            <button
              type="button"
              className="headerIconButton"
              onClick={() => onNavigate(quickAction.page)}
              title={quickAction.label}
            >
              <QuickActionIcon size={18} />
            </button>
          )}

          {userRole === 'producer' && (
            <button
              type="button"
              className="headerIconButton"
              onClick={() => onNavigate('notifications')}
              aria-label="Ver notificaciones"
              title="Notificaciones"
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="notificationBadge">{unreadNotifications}</span>
              )}
            </button>
          )}
        </div>

        <div className={`userMenu ${dropdownOpen ? 'open' : ''}`}>
          <button type="button" className="userMenuButton" onClick={toggleDropdown}>
            <span
              className="userAvatar"
              style={{ backgroundColor: accentBubbleBg, borderColor: accentBubbleBorder, color: roleMeta.accent }}
            >
              <RoleIcon size={20} />
            </span>
            <div className="userIdentity">
              <span className="userName">{userName}</span>
              <span className="userRole">{roleMeta.label}</span>
            </div>
            {dropdownOpen ? (
              <ChevronUp size={16} color="#55625d" />
            ) : (
              <ChevronDown size={16} color="#55625d" />
            )}
          </button>

          {dropdownOpen && (
            <div className="userDropdown">
              <div className="userDropdownHeader">
                <span
                  className="dropdownAvatar"
                  style={{ backgroundColor: accentBubbleBg, borderColor: accentBubbleBorder, color: roleMeta.accent }}
                >
                  <RoleIcon size={20} />
                </span>
                <div className="dropdownIdentity">
                  <span className="dropdownName">{userName}</span>
                  <span className="dropdownRole">{roleMeta.label}</span>
                </div>
              </div>

              {(userRole === 'producer' || userRole === 'technician' || userRole === 'worker') && (
                <button type="button" className="dropdownButton" onClick={handleProfileNavigation}>
                  <User size={16} />
                  Mi Perfil
                </button>
              )}

              <button type="button" className="dropdownButton logout" onClick={handleLogout}>
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;