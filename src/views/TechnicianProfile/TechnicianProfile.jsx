import React, { useEffect, useMemo, useState } from 'react';
import { TECHNICIAN_SPECIALTIES } from '../../data/constants';
import {
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  ShieldCheck,
  Briefcase,
  UserCheck,
  ClipboardCheck,
  Users,
  CalendarCheck,
  CheckCircle,
  FileText,
  BookOpenCheck,
  Edit3
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import './TechnicianProfile.css';

const TechnicianProfile = ({ currentUser, alerts = [], visits = [], onSaveProfile }) => {
  const [mySkills, setMySkills] = useState(currentUser.specialties || []);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    zone: currentUser.zone || '',
    availability: currentUser.availability || '',
    certificationStatus: currentUser.certificationStatus || '',
    yearsExperience: (currentUser.yearsExperience || currentUser.experience || 5).toString(),
    bio: currentUser.bio || '',
    focusAreas: (currentUser.focusAreas || []).join('\n'),
    languages: (currentUser.languages || []).join(', '),
  });

  const identity = useMemo(() => {
    const assignedAlerts = alerts.filter(alert => alert.techId === currentUser.id);
    const completedAlerts = assignedAlerts.filter(alert => alert.status === 'completed').length;
    const producersSupported = new Set(
      assignedAlerts.map(alert => alert.producerId).filter(Boolean)
    ).size;
    const visitsCompleted = visits.filter(visit => visit.techId === currentUser.id).length;
    const normalizedName = (currentUser.name || 'tecnico').toLowerCase().replace(/\s+/g, '.');

    return {
      phone: currentUser.phone || '+593 99 000 0000',
      email: currentUser.email || `${normalizedName}@agroaliados.com`,
      availability: currentUser.availability || 'Lunes a sábado · 07h00 a 16h00',
      certificationStatus:
        currentUser.certificationStatus || 'Bioseguridad nivel 4 · vigente',
      yearsExperience:
        currentUser.yearsExperience ||
        currentUser.experience ||
        Math.max(3, Math.min(12, completedAlerts || 4)),
      documentId: currentUser.documentId || currentUser.id?.toUpperCase(),
      completedAlerts,
      producersSupported,
      visitsCompleted
    };
  }, [
    alerts,
    currentUser.availability,
    currentUser.certificationStatus,
    currentUser.documentId,
    currentUser.email,
    currentUser.experience,
    currentUser.id,
    currentUser.name,
    currentUser.phone,
    currentUser.yearsExperience,
    visits
  ]);

  const heroHighlights = [
    { icon: MapPin, label: 'Zona asignada', value: currentUser.zone || 'Sin zona' },
    { icon: Briefcase, label: 'Experiencia', value: `${identity.yearsExperience} años` },
    { icon: CalendarDays, label: 'Disponibilidad', value: identity.availability },
    { icon: ShieldCheck, label: 'Certificación', value: identity.certificationStatus }
  ];

  const contactItems = [
    { icon: Phone, label: 'Teléfono directo', value: identity.phone },
    { icon: Mail, label: 'Correo institucional', value: identity.email },
    { icon: UserCheck, label: 'ID técnico', value: identity.documentId }
  ];

  const careerMetrics = [
    { icon: ClipboardCheck, label: 'Alertas cerradas', value: identity.completedAlerts },
    { icon: CalendarCheck, label: 'Visitas auditadas', value: identity.visitsCompleted },
    { icon: Users, label: 'Productores guiados', value: identity.producersSupported }
  ];

  const focusAreas =
    currentUser.focusAreas && currentUser.focusAreas.length > 0
      ? currentUser.focusAreas
      : [
          'Respuesta temprana ante focos críticos',
          'Fortalecimiento de bioseguridad de ingreso',
          'Capacitación práctica a productores'
        ];

  const documentation =
    currentUser.documentation && currentUser.documentation.length > 0
      ? currentUser.documentation
      : ['Carné sanitario y apto 2024', 'Seguro de campo vigente', 'Certificación BPA actualizada'];

  const languages =
    currentUser.languages && currentUser.languages.length > 0
      ? currentUser.languages
      : ['Español nativo', 'Inglés técnico básico'];

  const professionalNotes =
    currentUser.bio ||
    `Actualmente lidero acompañamientos en la zona ${currentUser.zone || 'operativa'}, documentando hallazgos y preparando a los productores para auditorías.`;

  useEffect(() => {
    setProfileForm({
      phone: identity.phone || '',
      email: identity.email || '',
      zone: currentUser.zone || '',
      availability: identity.availability || '',
      certificationStatus: identity.certificationStatus || '',
      yearsExperience: identity.yearsExperience?.toString() || '5',
      bio: professionalNotes || '',
      focusAreas: (focusAreas || []).join('\n'),
      languages: (languages || []).join(', '),
    });
  }, [identity, currentUser.zone, professionalNotes, focusAreas, languages]);

  const handleToggleSkill = skill => {
    setMySkills(prev =>
      prev.includes(skill) ? prev.filter(item => item !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = event => {
    event.preventDefault();
    onSaveProfile?.({ specialties: mySkills });
  };

  const handleProfileChange = event => {
    const { name, value } = event.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = event => {
    event.preventDefault();
    const updates = {
      specialties: mySkills,
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      zone: profileForm.zone.trim(),
      availability: profileForm.availability.trim(),
      certificationStatus: profileForm.certificationStatus.trim(),
      yearsExperience: Number(profileForm.yearsExperience) || identity.yearsExperience,
      bio: profileForm.bio.trim(),
      focusAreas: profileForm.focusAreas
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean),
      languages: profileForm.languages
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    };
    onSaveProfile?.(updates);
    setShowProfileModal(false);
  };

  const specialtyIntro =
    mySkills.length > 0
      ? `Seleccionaste ${mySkills.length} especialidad${mySkills.length === 1 ? '' : 'es'}.`
      : 'Selecciona las áreas que dominas para mantener tu perfil actualizado.';

  const heroTagline =
    mySkills.length > 0
      ? `Especialista en ${mySkills.slice(0, 2).join(' · ')}`
      : 'Especialista en bioseguridad aplicada y manejo fitosanitario.';

  return (
    <div className="technicianProfile">
      <section className="technicianProfile__hero">
        <div className="technicianProfile__heroContent">
          <span>Ficha profesional</span>
          <h1>{currentUser.name}</h1>
          <p>{heroTagline}</p>
        </div>
        <div className="technicianProfile__heroAside">
          <div className="technicianProfile__heroActions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setShowProfileModal(true)}
            >
              <Edit3 size={16} /> Editar perfil
            </button>
          </div>
          <div className="technicianProfile__heroHighlights">
            {heroHighlights.map(highlight => {
              const Icon = highlight.icon;
              return (
                <article key={highlight.label}>
                  <div className="technicianProfile__heroIcon">
                    <Icon size={16} />
                  </div>
                  <div>
                    <span>{highlight.label}</span>
                    <strong>{highlight.value}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="technicianProfile__grid">
        <article className="technicianProfile__card">
          <header className="technicianProfile__sectionHeader">
            <div>
              <h2>Contacto directo</h2>
              <p>Datos para coordinaciones urgentes y reportes oficiales.</p>
            </div>
          </header>
          <div className="technicianProfile__contactGrid">
            {contactItems.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="technicianProfile__contactItem">
                  <div className="technicianProfile__contactIcon">
                    <Icon size={16} />
                  </div>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="technicianProfile__card">
          <header className="technicianProfile__sectionHeader">
            <div>
              <h2>Trayectoria personal</h2>
              <p>Métricas que respaldan tu experiencia en campo.</p>
            </div>
          </header>
          <ul className="technicianProfile__metricList">
            {careerMetrics.map(metric => {
              const Icon = metric.icon;
              return (
                <li key={metric.label}>
                  <span className="technicianProfile__metricIcon">
                    <Icon size={16} />
                  </span>
                  <div>
                    <small>{metric.label}</small>
                    <strong>{metric.value}</strong>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="technicianProfile__grid">
        <article className="technicianProfile__card">
          <header className="technicianProfile__sectionHeader">
            <div>
              <h2>Enfoque y compromisos</h2>
              <p>Prioridades actuales de acompañamiento.</p>
            </div>
          </header>
          <ul className="technicianProfile__highlightList">
            {focusAreas.map(area => (
              <li key={area}>
                <span className="technicianProfile__highlightIcon">
                  <BookOpenCheck size={16} />
                </span>
                <p>{area}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="technicianProfile__card">
          <header className="technicianProfile__sectionHeader">
            <div>
              <h2>Idiomas y documentación</h2>
              <p>Credenciales vigentes para operar en finca.</p>
            </div>
          </header>
          <div className="technicianProfile__tagList">
            {languages.map(language => (
              <span key={language}>{language}</span>
            ))}
          </div>
          <ul className="technicianProfile__documentList">
            {documentation.map(doc => (
              <li key={doc}>
                <FileText size={16} />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
          <p className="technicianProfile__notes">{professionalNotes}</p>
        </article>
      </section>

      <section className="technicianProfile__card">
        <header className="technicianProfile__sectionHeader">
          <div>
            <h2>Especialidades certificadas</h2>
            <p>{specialtyIntro}</p>
          </div>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="technicianProfile__specialtyGrid">
            {TECHNICIAN_SPECIALTIES.map(skill => (
              <label
                key={skill}
                className={`technicianProfile__chip ${
                  mySkills.includes(skill) ? 'is-active' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={mySkills.includes(skill)}
                  onChange={() => handleToggleSkill(skill)}
                />
                <CheckCircle size={14} />
                {skill}
              </label>
            ))}
          </div>
          <div className="technicianProfile__actions">
            <button className="buttonPrimary" type="submit">
              Guardar cambios
            </button>
          </div>
        </form>
      </section>

      {showProfileModal && (
        <Modal
          title="Actualizar datos profesionales"
          onClose={() => setShowProfileModal(false)}
          size="large"
        >
          <form className="tech-edit-form" onSubmit={handleProfileSubmit}>
            <div className="formGrid">
              <Input
                label="Teléfono directo"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
              />
              <Input
                label="Correo institucional"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
              />
            </div>
            <div className="formGrid">
              <Input
                label="Zona operativa"
                name="zone"
                value={profileForm.zone}
                onChange={handleProfileChange}
              />
              <Input
                label="Disponibilidad"
                name="availability"
                value={profileForm.availability}
                onChange={handleProfileChange}
                placeholder="Ej. Lunes a sábado · 07h00 a 16h00"
              />
            </div>
            <Input
              label="Certificación vigente"
              name="certificationStatus"
              value={profileForm.certificationStatus}
              onChange={handleProfileChange}
            />
            <Input
              label="Años de experiencia"
              name="yearsExperience"
              type="number"
              min={1}
              value={profileForm.yearsExperience}
              onChange={handleProfileChange}
            />
            <div className="formGroup">
              <label className="label">Áreas de enfoque (una por línea)</label>
              <textarea
                className="textarea"
                name="focusAreas"
                rows="3"
                value={profileForm.focusAreas}
                onChange={handleProfileChange}
              />
            </div>
            <Input
              label="Idiomas (separados por comas)"
              name="languages"
              value={profileForm.languages}
              onChange={handleProfileChange}
            />
            <div className="formGroup">
              <label className="label">Nota profesional para productores</label>
              <textarea
                className="textarea"
                name="bio"
                rows="3"
                value={profileForm.bio}
                onChange={handleProfileChange}
              />
            </div>
            <div className="formActions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowProfileModal(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="buttonPrimary">
                Guardar cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TechnicianProfile;
