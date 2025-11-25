import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BadgeCheck, ClipboardList, Clock, MapPin, Shield, User, Phone, Edit3 } from 'lucide-react';
import RiskTag from '../../components/ui/RiskTag/RiskTag';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import KnowledgeCheckModal from '../../components/worker/KnowledgeCheckModal';
import './WorkerProfile.css';

const WorkerProfile = ({
  worker,
  labor,
  laborOptions = [],
  knowledgeCheck,
  needsKnowledgeCheck,
  trainingTask,
  onCompleteTraining,
  knowledgeQuestions = [],
  onCompleteKnowledgeCheck,
  onUpdateProfile,
}) => {
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: worker.phone || '',
    emergencyContact: worker.emergencyContact || '',
    age: worker.age?.toString() || '',
    experience: worker.experience?.toString() || '',
    labor: worker.labor || laborOptions[0]?.value || '',
    homeBase: worker.homeBase || '',
  });

  useEffect(() => {
    setProfileForm({
      phone: worker.phone || '',
      emergencyContact: worker.emergencyContact || '',
      age: worker.age?.toString() || '',
      experience: worker.experience?.toString() || '',
      labor: worker.labor || laborOptions[0]?.value || '',
      homeBase: worker.homeBase || '',
    });
  }, [worker, laborOptions]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    onUpdateProfile?.({
      phone: profileForm.phone.trim(),
      emergencyContact: profileForm.emergencyContact.trim(),
      age: Number(profileForm.age) || worker.age,
      experience: Number(profileForm.experience) || worker.experience,
      labor: profileForm.labor,
      homeBase: profileForm.homeBase.trim(),
    });
    setShowEditModal(false);
  };

  const laborMeta = labor || { label: worker.labor || 'Sin asignar', risk: 'low' };

  const stats = [
    { label: 'Labor', value: laborMeta.label, icon: ClipboardList },
    { label: 'Experiencia', value: `${worker.experience} años`, icon: Clock },
    { label: 'Edad', value: `${worker.age} años`, icon: User },
  ];

  const knowledgeStatus = knowledgeCheck
    ? knowledgeCheck.passed
      ? 'apto'
      : 'refuerzo'
    : needsKnowledgeCheck
      ? 'pendiente'
      : 'sin-registro';

  const knowledgeLabel = {
    apto: 'Apto esta semana',
    refuerzo: 'Refuerzo requerido',
    pendiente: 'Prueba pendiente',
    'sin-registro': 'Sin registro'
  }[knowledgeStatus];

  const lastCheck = knowledgeCheck?.completedAt
    ? new Date(knowledgeCheck.completedAt).toLocaleDateString('es-EC', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      })
    : 'Sin registro';

  const sundayReminder = useMemo(() => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - sunday.getDay());
    return sunday.toLocaleDateString('es-EC', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    });
  }, []);

  const handleKnowledgeResult = (result) => {
    onCompleteKnowledgeCheck?.(result);
  };


  return (
    <div className="container worker-profile-page">
      <header className="worker-hero">
        <div>
          <span className="hero-eyebrow">Trabajador</span>
          <h1 className="h1">{worker.name}</h1>
          <p className="hero-sub">ID: {worker.idNumber}</p>
        </div>
        <div className="hero-actions">
          <div className="hero-badge">
            <Shield size={16} />
            <span>Autorizado</span>
          </div>
          <button type="button" className="button button-secondary" onClick={() => setShowEditModal(true)}>
            <Edit3 size={16} /> Actualizar perfil
          </button>
        </div>
      </header>

      <section className="worker-stats">
        {stats.map(item => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="stat-card">
              <div className="stat-icon">
                <Icon size={16} />
              </div>
              <p className="stat-label">{item.label}</p>
              <strong className="stat-value">{item.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="worker-knowledge">
        <article className={`knowledge-card status-${knowledgeStatus}`}>
          <div>
            <p className="knowledge-eyebrow">Prueba semanal</p>
            <h3>{knowledgeLabel}</h3>
            <p className="knowledge-meta">Última actualización: {lastCheck}</p>
            {knowledgeCheck && (
              <p className="knowledge-meta">
                Puntaje: {knowledgeCheck.correct}/{knowledgeCheck.total} ({knowledgeCheck.score}%)
              </p>
            )}
            {knowledgeCheck?.failCount > 0 && (
              <p className="knowledge-meta warning">
                Intentos consecutivos fallidos: {knowledgeCheck.failCount}
              </p>
            )}
            {needsKnowledgeCheck && (
              <p className="knowledge-hint">
                Completa la prueba antes del próximo ingreso dominical para mantener tu QR actualizado.
              </p>
            )}
            <p className="knowledge-meta reminder">
              Recordatorio enviado el {sundayReminder}.
            </p>
          </div>
          <div className="knowledge-actions">
            <button
              type="button"
              className={`button ${knowledgeStatus === 'apto' ? 'button-secondary' : 'btn-primary'}`}
              onClick={() => setShowKnowledgeModal(true)}
            >
              {knowledgeStatus === 'apto' ? 'Reforzar' : 'Tomar prueba ahora'}
            </button>
          </div>
        </article>

        {trainingTask && !trainingTask.completed && onNavigate && (
          <div className="training-link-card">
            <p className="training-link-text">Tienes un refuerzo pendiente. Revísalo en tu módulo de capacitación continua.</p>
            <button type="button" className="button button-secondary" onClick={() => onNavigate('workerTraining')}>
              Abrir capacitación
            </button>
          </div>
        )}
      </section>

      <div className="profile-grid">
        <div className="details-card">
          <div className="card-header">
            <BadgeCheck size={16} />
            <h2 className="h2">Mi información</h2>
          </div>
          <div className="worker-labor-primary">
            <div>
              <span className="detail-label">Labor principal</span>
              <p className="labor-name">{laborMeta.label}</p>
              <RiskTag riskLevel={laborMeta.risk} />
            </div>
          </div>
          <div className="worker-details-grid">
            <div className="worker-detail">
              <span className="detail-label">Edad</span>
              <span className="detail-value">{worker.age} años</span>
            </div>
            <div className="worker-detail">
              <span className="detail-label">Experiencia</span>
              <span className="detail-value">{worker.experience} años</span>
            </div>
            <div className="worker-detail">
              <span className="detail-label">Productor</span>
              <span className="detail-value">{worker.producerName || 'Asignado'}</span>
            </div>
            <div className="worker-detail">
              <span className="detail-label">Finca</span>
              <span className="detail-value">{worker.fincaName || 'Ver en agenda'}</span>
            </div>
          </div>
          <div className="worker-contact">
            <div>
              <span className="detail-label">Teléfono</span>
              <span className="detail-value contact">
                <Phone size={14} /> {worker.phone || 'No registrado'}
              </span>
            </div>
            <div>
              <span className="detail-label">Contacto de emergencia</span>
              <span className="detail-value">{worker.emergencyContact || 'No registrado'}</span>
            </div>
            <div>
              <span className="detail-label">Base / Turno</span>
              <span className="detail-value">{worker.homeBase || 'Actualizar en perfil'}</span>
            </div>
          </div>
        </div>

        <div className="qr-card">
          <div className="card-header">
            <MapPin size={16} />
            <h2 className="h2">Código QR de ingreso</h2>
          </div>
          <p className="qr-helper">Muestra este código en portería para registrar ingreso y salida.</p>
          <div className="qr-code-badge">
            <div className="qr-badge-header">
              <User size={16} />
              <span>Trabajador autorizado</span>
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
          <div className="qr-pill-group">
            <span className={`qr-pill status-${knowledgeStatus}`}>{knowledgeLabel}</span>
            {trainingTask && !trainingTask.completed && (
              <span className="qr-pill warning">Refuerzo pendiente</span>
            )}
          </div>
        </div>
      </div>

      {showKnowledgeModal && (
        <Modal
          title="Prueba rápida de bioseguridad"
          onClose={() => setShowKnowledgeModal(false)}
          size="large"
        >
          <KnowledgeCheckModal
            workerName={worker.name}
            questions={knowledgeQuestions}
            onSubmit={handleKnowledgeResult}
          />
        </Modal>
      )}

      {showEditModal && (
        <Modal
          title="Actualizar datos del trabajador"
          onClose={() => setShowEditModal(false)}
          size="large"
        >
          <form className="worker-edit-form" onSubmit={handleProfileSubmit}>
            <div className="formGrid">
              <Input
                label="Teléfono"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="+593 00 000 0000"
              />
              <Input
                label="Contacto de emergencia"
                name="emergencyContact"
                value={profileForm.emergencyContact}
                onChange={handleProfileChange}
                placeholder="Nombre y teléfono"
              />
            </div>
            <div className="formGrid">
              <Input
                label="Edad"
                name="age"
                type="number"
                value={profileForm.age}
                onChange={handleProfileChange}
                min={18}
              />
              <Input
                label="Experiencia"
                name="experience"
                type="number"
                value={profileForm.experience}
                onChange={handleProfileChange}
                min={0}
              />
            </div>
            <div className="formGroup">
              <label className="label">Labor asignada</label>
              <select
                className="select"
                name="labor"
                value={profileForm.labor}
                onChange={handleProfileChange}
              >
                {laborOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} · Riesgo {option.risk}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Base o turno habitual"
              name="homeBase"
              value={profileForm.homeBase}
              onChange={handleProfileChange}
              placeholder="Ej. Portería norte · turno A"
            />
            <div className="formActions">
              <button type="button" className="button button-secondary" onClick={() => setShowEditModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="button btn-primary">
                Guardar cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default WorkerProfile;
