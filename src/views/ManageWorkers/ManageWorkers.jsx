// En: src/views/ManageWorkers/ManageWorkers.jsx
// --- NUEVO ARCHIVO ---

import React, { useState } from 'react';
import Icon from '../../components/ui/Icon';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import RiskTag from '../../components/ui/RiskTag/RiskTag';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';
import './ManageWorkers.css';

// Formulario interno para registrar
const RegisterWorkerForm = ({ labores, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [labor, setLabor] = useState(labores[0]?.value || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !idNumber || !age || !experience || !labor) return;
    onSubmit({
      name,
      idNumber,
      age: parseInt(age, 10),
      experience: parseInt(experience, 10),
      labor,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="worker-form">
      <Input
        label="Nombre Completo"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Cédula / ID"
        name="idNumber"
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value)}
        required
      />
      <div className="form-grid">
        <Input
          label="Edad"
          name="age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
        <Input
          label="Años de Experiencia"
          name="experience"
          type="number"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          required
        />
      </div>
      <div className="formGroup">
        <label className="label" htmlFor="laborSelect">Labor Principal</label>
        <select
          id="laborSelect"
          className="select"
          value={labor}
          onChange={(e) => setLabor(e.target.value)}
        >
          {labores.map(l => (
            <option key={l.value} value={l.value}>
              {l.label} (Riesgo: {l.risk})
            </option>
          ))}
        </select>
      </div>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="button btn-primary">
          Registrar Trabajador
        </button>
      </div>
    </form>
  );
};

// Componente principal
const HOURS_PER_SHIFT = 8.5;

const getWeekNumber = date => {
  const target = new Date(date.valueOf());
  target.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((target - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
};

const calculateHours = log => {
  if (!log?.checkIn || !log?.checkOut) return 0;
  const start = new Date(log.checkIn);
  const end = new Date(log.checkOut);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, (end - start) / (1000 * 60 * 60));
};

const ManageWorkers = ({ workers, labores, workLogs = [], onRegisterWorker }) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [laborFilter, setLaborFilter] = useState('Todas');

  const getLaborInfo = (laborValue) => {
    return labores.find(l => l.value === laborValue) || { label: 'Desconocido', risk: 'N/A' };
  };

  const laborFilterOptions = [
    { category: 'General', value: 'Todas', label: 'Todas las labores' },
    ...labores,
  ];

  const filteredWorkers =
    laborFilter === 'Todas'
      ? workers
      : workers.filter((worker) => worker.labor === laborFilter);

  const workerIds = new Set(workers.map(worker => worker.id));
  const completedLogs = workLogs.filter(
    log => workerIds.has(log.workerId) && log.status === 'completed'
  );

  const now = new Date();
  const startOfWeek = new Date(now);
  const weekDay = startOfWeek.getDay();
  const diffToMonday = (weekDay + 6) % 7; // 0 for Monday
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const logsThisWeek = completedLogs.filter(log => {
    const logDate = new Date(log.date || log.checkIn);
    if (Number.isNaN(logDate)) return false;
    return logDate >= startOfWeek && logDate <= now;
  });

  const hoursThisWeek = logsThisWeek.reduce(
    (acc, log) => acc + calculateHours(log),
    0
  );
  const goalHours = workers.length * HOURS_PER_SHIFT * 5;
  const completionRate = goalHours
    ? Math.min(100, Math.round((hoursThisWeek / goalHours) * 100))
    : 0;
  const laborHours = logsThisWeek.reduce((acc, log) => {
    if (!log.labor) return acc;
    const info = getLaborInfo(log.labor);
    const label = info.label || 'Sin labor';
    acc[label] = (acc[label] || 0) + calculateHours(log);
    return acc;
  }, {});
  const topLaborEntryHours = Object.entries(laborHours).sort((a, b) => b[1] - a[1])[0];
  const workerHours = logsThisWeek.reduce((acc, log) => {
    const workerName = log.name || workers.find(w => w.id === log.workerId)?.name || 'Trabajador';
    acc[workerName] = (acc[workerName] || 0) + calculateHours(log);
    return acc;
  }, {});
  const topWorkerRows = Object.entries(workerHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, hours]) => ({ name, hours }));

  const totalWorkers = filteredWorkers.length;
  const averageExperience = totalWorkers
    ? Math.round(
        filteredWorkers.reduce((acc, worker) => acc + (worker.experience || 0), 0) /
          totalWorkers
      )
    : 0;
  const averageAge = totalWorkers
    ? Math.round(
        filteredWorkers.reduce((acc, worker) => acc + (worker.age || 0), 0) / totalWorkers
      )
    : 0;
  const laborCounts = filteredWorkers.reduce((acc, worker) => {
    if (!worker.labor) return acc;
    const key = worker.labor;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topLaborEntry = Object.entries(laborCounts).sort((a, b) => b[1] - a[1])[0];
  const topLabor =
    topLaborEntry && labores.length
      ? labores.find((labor) => labor.value === topLaborEntry[0])?.label
      : null;
  const productivityCards = [
    {
      label: 'Horas registradas (semana)',
      value: `${hoursThisWeek.toFixed(1)} h`,
      detail: goalHours ? `Meta ${goalHours} h` : 'Define tu meta semanal'
    },
    {
      label: 'Registros completados',
      value: logsThisWeek.length,
      detail: 'Operaciones confirmadas'
    },
    {
      label: 'Cumplimiento de meta',
      value: `${completionRate}%`,
      detail: goalHours ? 'Horas registradas vs meta' : 'Sin meta definida'
    },
    {
      label: 'Labor con mayor dedicación',
      value: topLaborEntryHours ? `${topLaborEntryHours[0]}` : 'Sin registros',
      detail: topLaborEntryHours ? `${topLaborEntryHours[1].toFixed(1)} h` : 'Aún no hay horas registradas'
    }
  ];
  const heroStats = [
    {
      label: 'Activos',
      value: `${totalWorkers}`,
      detail: 'Trabajadores registrados',
      icon: 'Users',
    },
    {
      label: 'Experiencia media',
      value: `${averageExperience} años`,
      detail: 'Promedio del equipo',
      icon: 'Medal',
    },
    {
      label: 'Edad media',
      value: `${averageAge} años`,
      detail: 'Madurez operativa',
      icon: 'Cake',
    },
    {
      label: 'Labor destacada',
      value: topLabor || 'Sin labor asignada',
      detail: topLaborEntry ? `${topLaborEntry[1]} asignados` : 'Sin asignaciones',
      icon: 'Briefcase',
    },
  ];

  return (
    <>
      <div className="container producer-worker-page">
        <div className="worker-hero">
          <div className="worker-hero__content">
            <span className="worker-hero__eyebrow">Equipo operativo</span>
            <h1 className="worker-hero__title">Mis Trabajadores ({totalWorkers})</h1>
            <p>
              Visualiza tu equipo, identifica su experiencia y asigna labores críticas para
              mantener el flujo operativo.
            </p>
            <div className="worker-hero__stats">
              {heroStats.map((stat) => (
                <article key={stat.label}>
                  <span className="worker-stat-icon">
                    <Icon name={stat.icon} size={22} strokeWidth={1.8} />
                  </span>
                  <div className="worker-stat-text">
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                    <small>{stat.detail}</small>
                  </div>
                </article>
              ))}
            </div>
            <FilterPanel
              className="worker-filterPanel"
              pillGroups={['General', 'Cosecha', 'Cuidado', 'Empaque']
                .map(category => ({
                  id: category,
                  label: category,
                  items: laborFilterOptions
                    .filter(option => option.category === category)
                    .map(option => ({
                      id: option.value,
                      label: option.label,
                      active: laborFilter === option.value,
                      onClick: () => setLaborFilter(option.value),
                    })),
                }))
                .filter(group => group.items.length > 0)}
            />
          </div>
          <div className="worker-hero__actions">
            <button
              className="button btn-primary"
              onClick={() => setShowRegisterModal(true)}
            >
              <Icon name="UserPlus" size={18} strokeWidth={2} /> Registrar nuevo trabajador
            </button>
          </div>
        </div>

        <section className="worker-productivity">
          <header>
            <div>
              <p>Mi productividad semanal</p>
              <h2>Horas y avances del equipo</h2>
            </div>
            <span className="productivity-badge">
              Semana {getWeekNumber(now)}
            </span>
          </header>
          {logsThisWeek.length === 0 ? (
            <div className="worker-productivity__empty">
              <p>Aún no hay registros confirmados esta semana. Usa el registro de portería para iniciar un turno.</p>
            </div>
          ) : (
            <>
              <div className="worker-productivity__grid">
                {productivityCards.map(card => (
                  <article key={card.label} className="productivity-card">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </article>
                ))}
              </div>
              <div className="worker-productivity__table">
                <div className="worker-productivity__tableInner">
                  <div className="table-header">
                    <span>Colaboradores destacados</span>
                    <span>Total horas</span>
                  </div>
                  {topWorkerRows.map(row => (
                    <div key={row.name} className="table-row">
                      <div>
                        <strong>{row.name}</strong>
                      </div>
                      <div>
                        <span>{row.hours.toFixed(1)} h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        <div className="worker-card-grid">
          {filteredWorkers.map(worker => {
            const laborInfo = getLaborInfo(worker.labor);
            const lastTask = worker.lastTask
              ? `${worker.lastTask.name} · ${worker.lastTask.date}`
              : 'Sin registro reciente';
            return (
              <div key={worker.id} className="worker-card">
                <div className="worker-card__header">
                  <div>
                    <h2 className="worker-name">{worker.name}</h2>
                    <p className="worker-id">ID: {worker.idNumber}</p>
                  </div>
                  <span
                    className={`worker-chip worker-chip--${(laborInfo.risk || 'Bajo')
                      .toString()
                      .toLowerCase()}`}
                  >
                    {laborInfo.risk || 'Bajo'}
                  </span>
                </div>
                <div className="worker-details-grid">
                  <div className="worker-detail">
                    <span className="worker-detail__icon">
                      <Icon name="Cake" size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <span className="detail-label">Edad</span>
                      <span className="detail-value">{worker.age} años</span>
                    </div>
                  </div>
                  <div className="worker-detail">
                    <span className="worker-detail__icon">
                      <Icon name="Award" size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <span className="detail-label">Experiencia</span>
                      <span className="detail-value">{worker.experience} años</span>
                    </div>
                  </div>
                </div>

                <div className="worker-labor">
                  <div className="worker-section-label">
                    <span className="worker-detail__icon">
                      <Icon name="Briefcase" size={18} strokeWidth={2} />
                    </span>
                    <span className="detail-label">Labor Principal</span>
                  </div>
                  <div className="worker-labor__row">
                    <p className="labor-name">{laborInfo.label}</p>
                    <RiskTag riskLevel={laborInfo.risk} />
                  </div>
                  <div className="worker-timeline">
                    <div className="worker-section-label">
                      <span className="worker-detail__icon">
                        <Icon name="History" size={18} strokeWidth={2} />
                      </span>
                      <strong>Última actividad</strong>
                    </div>
                    <span>{lastTask}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Registro */}
      {showRegisterModal && (
        <Modal
          title="Registrar Nuevo Trabajador"
          onClose={() => setShowRegisterModal(false)}
          size="medium"
        >
          <RegisterWorkerForm
            labores={labores}
            onSubmit={(data) => {
              onRegisterWorker(data);
              setShowRegisterModal(false);
            }}
            onCancel={() => setShowRegisterModal(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default ManageWorkers;
