import React, { useMemo, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
import { ICONS } from '../../config/icons';
import {
  Bell,
  MailCheck,
  Filter,
  Search,
  CheckCheck,
  AlertTriangle,
  Users,
  ClipboardList,
  CalendarClock,
  Shield,
  MapPin,
  Inbox
} from 'lucide-react';
import './NotificationCenter.css';

const NotificationCenter = ({ notifications, onMarkAsRead, onNavigate }) => {
  const [filterMode, setFilterMode] = useState('all'); // all | unread
  const [searchTerm, setSearchTerm] = useState('');

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const handleClick = (notification) => {
    onMarkAsRead(notification.id);
    if (notification.link) {
      onNavigate(notification.link);
    }
  };

  const getNotificationMeta = (notification) => {
    const text = notification.text.toLowerCase();
    if (text.includes('alerta')) return { icon: AlertTriangle, tone: 'alert', label: 'Alerta' };
    if (text.includes('visita')) return { icon: MapPin, tone: 'visit', label: 'Visita' };
    if (text.includes('tarea') || text.includes('plan')) return { icon: ClipboardList, tone: 'task', label: 'Tarea/Plan' };
    if (text.includes('certific')) return { icon: Shield, tone: 'info', label: 'Certificación' };
    if (text.includes('trabajador') || text.includes('equipo')) return { icon: Users, tone: 'team', label: 'Equipo' };
    if (text.includes('agenda') || text.includes('cita')) return { icon: CalendarClock, tone: 'info', label: 'Agenda' };
    return { icon: Bell, tone: 'default', label: 'General' };
  };

  const renderItem = (n) => {
    const meta = getNotificationMeta(n);
    const IconComponent = meta.icon;
    return (
      <button
        key={n.id}
        className={`notificationItem surface-card ${n.read ? 'read' : 'unread'} tone-${meta.tone}`}
        onClick={() => handleClick(n)}
        type="button"
      >
        <span className="timeline-dot" aria-hidden="true" />
        <span className="notification-icon">
          <IconComponent size={18} />
        </span>
        <div className="notification-content">
          <div className="notification-header">
            <p className="notification-title">{n.text}</p>
            <span className={`type-chip chip-${meta.tone}`}>{meta.label}</span>
          </div>
          <span className="notificationDate">{new Date(n.date).toLocaleString()}</span>
        </div>
      </button>
    );
  };

  const handleMarkAll = () => {
    if (unreadNotifications.length === 0) return;
    onMarkAsRead?.('all');
  };

  const filteredUnread = useMemo(() => {
    return unreadNotifications.filter(n =>
      n.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [unreadNotifications, searchTerm]);

  const filteredRead = useMemo(() => {
    return readNotifications.filter(n =>
      n.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [readNotifications, searchTerm]);

  const emptyFiltered = filterMode === 'unread'
    ? filteredUnread.length === 0
    : notifications.length === 0;

  return (
    <div className="notification-page container">
      <section className="surface-card notif-hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">Productor</p>
          <h1 className="h1">Centro de Notificaciones</h1>
          <p className="muted">Resumen de alertas, visitas y acciones pendientes.</p>
        </div>
        <div className="hero-chips">
          <article className="hero-chip">
            <span className="chip-icon">
              <Bell size={16} />
            </span>
            <div>
              <small>Nuevas</small>
              <strong>{unreadNotifications.length}</strong>
            </div>
          </article>
          <article className="hero-chip">
            <span className="chip-icon neutral">
              <Inbox size={16} />
            </span>
            <div>
              <small>Total</small>
              <strong>{notifications.length}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="surface-card notif-controls">
        <div className={`segment-control ${filterMode === 'unread' ? 'unread-active' : ''}`}>
          <button
            type="button"
            className={`segment ${filterMode === 'all' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            <span className="segment-icon"><Filter size={14} /></span>
            <span>Todas</span>
          </button>
          <button
            type="button"
            className={`segment ${filterMode === 'unread' ? 'is-active' : ''}`}
            onClick={() => setFilterMode('unread')}
          >
            <span className="segment-icon"><Bell size={14} /></span>
            <span>No leídas</span>
            {unreadNotifications.length > 0 && (
              <span className="segment-badge">{unreadNotifications.length}</span>
            )}
          </button>
        </div>
        <div className="actions-wrap">
          <div className="search-field">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar notificación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            className="icon-pill ghost"
            onClick={handleMarkAll}
            disabled={unreadNotifications.length === 0}
            title="Marcar todo como leído"
          >
            <CheckCheck size={18} />
          </button>
        </div>
      </section>

      <section className="surface-card notif-list-card">
        {emptyFiltered ? (
          <EmptyState
            iconPath={ICONS.notifications}
            title="Bandeja vacía"
            message="No tienes notificaciones nuevas en este momento."
          />
        ) : (
          <>
            {(filterMode === 'all' || filterMode === 'unread') && filteredUnread.length > 0 && (
              <>
                <div className="list-section">
                  <div className="list-header">
                    <p className="list-eyebrow">Nuevas</p>
                    <span className="list-count">{filteredUnread.length}</span>
                  </div>
                  <div className="notificationList timeline">
                    {filteredUnread.map(renderItem)}
                  </div>
                </div>
              </>
            )}

            {filterMode === 'all' && filteredRead.length > 0 && (
              <>
                <div className="list-section">
                  <div className="list-header">
                    <p className="list-eyebrow">Leídas</p>
                    <span className="list-count neutral">{filteredRead.length}</span>
                  </div>
                  <div className="notificationList timeline">
                    {filteredRead.map(renderItem)}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default NotificationCenter;
