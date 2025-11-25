import React, { useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Activity,
  MapPin,
  CalendarDays,
  ClipboardCheck,
  UserRound
} from 'lucide-react';
import './TechnicianControl.css';

const TechnicianControl = ({ technicians, alerts = [], onNavigate, onShowRegisterModal }) => {
  const heroStats = useMemo(() => {
    const activeAlerts = alerts.filter(alert => alert.status !== 'completed');
    const criticalAlerts = activeAlerts.filter(
      alert => (alert.priority || '').toLowerCase() === 'alta'
    );
    const avgWorkload = technicians.length
      ? (activeAlerts.length / technicians.length).toFixed(1)
      : 0;
    const fincasAtendidas = new Set(activeAlerts.map(alert => alert.farmName)).size;

    return [
      { label: 'Técnicos activos', value: technicians.length, detail: 'en operación', icon: Users },
      {
        label: 'Alertas activas',
        value: activeAlerts.length,
        detail: `${criticalAlerts.length} críticas`,
        icon: AlertTriangle
      },
      {
        label: 'Carga promedio',
        value: `${avgWorkload} `,
        detail: 'alertas / técnico',
        icon: Activity
      },
      {
        label: 'Fincas atendidas',
        value: fincasAtendidas,
        detail: 'con visitas programadas',
        icon: MapPin
      }
    ];
  }, [alerts, technicians]);

  const techniciansWithStats = useMemo(() => {
    return technicians.map(tech => {
      const alertsForTech = alerts.filter(alert => alert.techId === tech.id);
      const assigned = alertsForTech.filter(alert => alert.status === 'assigned');
      const completed = alertsForTech.filter(alert => alert.status === 'completed');
      const uniqueFarms = new Set(alertsForTech.map(alert => alert.farmName)).size;
      const nextVisit = assigned
        .map(alert => alert.visitDate)
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b))[0];

      return {
        ...tech,
        assignedCount: assigned.length,
        completedCount: completed.length,
        farmsCount: uniqueFarms,
        nextVisit
      };
    });
  }, [alerts, technicians]);

  return (
    <div className="technicianControl">
      <div className="technicianControl__hero">
        <div className="technicianControl__heroHeader">
          <div>
            <span>Equipo técnico</span>
            <h1>Control y coordinación de técnicos</h1>
            <p>
              Visualiza la carga operativa de cada técnico, sus especialidades y próximas visitas
              para maximizar la cobertura en campo.
            </p>
          </div>
          <button type="button" className="buttonPrimary" onClick={onShowRegisterModal}>
            Registrar nuevo técnico
          </button>
        </div>
        <div className="technicianControl__heroStats">
          {heroStats.map(({ label, value, detail, icon: StatIcon }) => (
            <article key={label} className="technicianControl__statCard">
              <div className="technicianControl__statIcon">
                <StatIcon size={18} />
              </div>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{detail}</small>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="technicianList">
        {techniciansWithStats.map(tech => (
          <article
            key={tech.id}
            className="technicianCard"
            onClick={() => onNavigate('technicianSchedule', tech)}
            title={`Abrir agenda de ${tech.name}`}
          >
            <header className="technicianCard__header">
              <div className="techAvatar">
                <UserRound size={22} />
              </div>
              <div>
                <h2>{tech.name}</h2>
                <span>Zona {tech.zone}</span>
              </div>
              <div className="techLoadPill">
                {tech.assignedCount} asignadas
              </div>
            </header>

            <div className="technicianCard__metrics">
              <div>
                <span>Alertas completadas</span>
                <strong>{tech.completedCount}</strong>
              </div>
              <div>
                <span>Fincas atendidas</span>
                <strong>{tech.farmsCount}</strong>
              </div>
              <div>
                <span>Próxima visita</span>
                <strong>{tech.nextVisit ? new Date(tech.nextVisit).toLocaleDateString() : 'Pendiente'}</strong>
              </div>
            </div>

            <div className="technicianCard__specialties">
              <span>Especialidades</span>
              <div className="specialtyTags">
                {tech.specialties?.length > 0 ? (
                  tech.specialties.map(skill => (
                    <span key={skill} className="tag tag-skill">
                      <ClipboardCheck size={14} /> {skill}
                    </span>
                  ))
                ) : (
                  <span className="tag tag-info">Sin especialidades registradas</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default TechnicianControl;
