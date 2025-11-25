import React, { useMemo, useState, useCallback } from 'react';
import FileUploadButton from '../../components/ui/FileUploadButton';
import MapPinSelector from '../../components/ui/MapPinSelector/MapPinSelector';
import Button from '../../components/ui/Button';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bug,
  Camera,
  CalendarDays,
  CheckCircle,
  Clock,
  Flame,
  Home,
  Image as ImageIcon,
  Leaf,
  List,
  MapPin,
  Phone,
  Star,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import { ALERT_SYMPTOMS_DATA } from '../../data/constants';
import './AlertReportForm.css';

// --- Componente de Modal de Vista Previa de Imagen ---
const ImagePreviewModal = ({ src, onClose }) => (
  <div className="image-preview-backdrop" onClick={onClose}>
    <div className="image-preview-content">
      <button className="image-preview-close" onClick={onClose}>
        {/* --- CAMBIO: Icono de Lucide --- */}
        <X size={24} color="#fff" />
      </button>
      <img src={src} alt="Vista previa de evidencia" />
    </div>
  </div>
);

// --- Lista de Meses ---
const MONTHS = [
  { value: 'all', label: 'Todos los meses' },
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

// --- CAMBIO: Se añade 'onNavigate' a las props ---
const AlertReportForm = ({ producer, onSubmitAlert, onNavigate }) => {
  const fincas = producer.fincas || [];

  const [selectedFincaId, setSelectedFincaId] = useState(fincas[0]?.id || '');
  const [selectedLote, setSelectedLote] = useState('');
  const [selectedParts, setSelectedParts] = useState({});
  const [symptoms, setSymptoms] = useState([]);
  const [photos, setPhotos] = useState({});
  const [location, setLocation] = useState(null);
  const [detectionDate, setDetectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [detectionTime, setDetectionTime] = useState('');
  const [reporterName, setReporterName] = useState(producer?.owner || '');
  const [reporterContact, setReporterContact] = useState(
    producer?.contactPhone || producer?.phone || producer?.contact || ''
  );
  const [urgencyLevel, setUrgencyLevel] = useState('media');
  const [generalNotes, setGeneralNotes] = useState('');
  
  // --- CORRECCIÓN: Estado para el modal (estaba faltando) ---
  const [previewImage, setPreviewImage] = useState(null);
  const [stepErrors, setStepErrors] = useState({});

  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: 'Datos básicos', description: 'Fecha, contacto y prioridad', icon: User },
    { id: 2, title: 'Ubicación y lote', description: 'Selecciona finca, lote y mapa', icon: MapPin },
    { id: 3, title: 'Síntomas y evidencia', description: 'Registra la afectación y fotos', icon: Camera },
    { id: 4, title: 'Revisión final', description: 'Confirma la información antes de enviar', icon: CheckCircle },
  ];

  const URGENCY_OPTIONS = [
    { value: 'alta', label: 'Alta', hint: 'Atención inmediata (24 h)' },
    { value: 'media', label: 'Media', hint: 'Seguimiento en 48 h' },
    { value: 'baja', label: 'Baja', hint: 'Monitoreo preventivo' },
  ];

  const URGENCY_LABELS = {
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
  };

  const selectedFinca = fincas.find(f => f.id === selectedFincaId);
  const lotes = selectedFinca?.lotes || [];

  const selectedPartsList = useMemo(
    () => Object.keys(selectedParts).filter(part => selectedParts[part]),
    [selectedParts]
  );

  const photosLoaded = useMemo(
    () => selectedPartsList.reduce((count, part) => (photos[part] ? count + 1 : count), 0),
    [photos, selectedPartsList]
  );

  const attachments = useMemo(
    () =>
      selectedPartsList
        .map(part => ({ part, photo: photos[part] }))
        .filter(item => Boolean(item.photo)),
    [photos, selectedPartsList]
  );

  const totalLotes = useMemo(
    () => fincas.reduce((count, finca) => count + (finca?.lotes?.length || 0), 0),
    [fincas]
  );

  const heroHighlights = useMemo(
    () => [
      {
        id: 'farms',
        icon: Home,
        label: 'Fincas registradas',
        value: fincas.length || '—',
        hint:
          fincas.length > 1
            ? `${fincas.length} disponibles`
            : fincas.length === 1
              ? '1 finca asociada'
              : 'Sin fincas registradas'
      },
      {
        id: 'plots',
        icon: List,
        label: 'Lotes totales',
        value: totalLotes || '—',
        hint: selectedFinca
          ? `${selectedFinca?.lotes?.length || 0} en ${selectedFinca.name}`
          : 'Selecciona una finca'
      },
      {
        id: 'evidence',
        icon: Camera,
        label: 'Evidencias listas',
        value: selectedPartsList.length ? `${photosLoaded}/${selectedPartsList.length}` : photosLoaded,
        hint: selectedPartsList.length ? 'Partes con foto adjunta' : 'Selecciona partes afectadas'
      }
    ],
    [fincas, totalLotes, selectedFinca, photosLoaded, selectedPartsList.length]
  );

  const isStep1Complete = Boolean(
    detectionDate && detectionTime && reporterName.trim() && reporterContact.trim()
  );
  const isStep2Complete = Boolean(selectedFincaId && selectedLote && location);
  const hasSymptomsData = selectedPartsList.length > 0 && symptoms.length > 0;
  const hasEvidence = attachments.length > 0;
  const isStep3Complete = hasSymptomsData && hasEvidence;
  const isReviewReady = isStep1Complete && isStep2Complete && isStep3Complete;

  const completedSteps = [
    isStep1Complete,
    isStep2Complete,
    isStep3Complete,
    isReviewReady,
  ].filter(Boolean).length;

  const clearStepError = useCallback(step => {
    setStepErrors(prev => {
      if (!prev[step]) return prev;
      const next = { ...prev };
      delete next[step];
      return next;
    });
  }, []);

  const handleFincaChange = (e) => {
    setSelectedFincaId(e.target.value);
    setSelectedLote('');
    clearStepError(1);
  };

  const handlePartToggle = (part) => {
    const newParts = { ...selectedParts, [part]: !selectedParts[part] };
    setSelectedParts(newParts);
    if (!newParts[part]) {
      const symptomsOfPart = ALERT_SYMPTOMS_DATA[part] || [];
      setSymptoms(prev => prev.filter(s => !symptomsOfPart.includes(s)));
    }
    clearStepError(2);
  };

  const handleSymptomToggle = (symptom) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
    clearStepError(2);
  };

  const handlePhotoUpload = (part, fileData) => {
    setPhotos(prev => ({ ...prev, [part]: fileData }));
    clearStepError(3);
  };

  const handleLocationSet = useCallback(
    (coords) => {
      setLocation(coords);
      clearStepError(3);
    },
    [clearStepError]
  );

  const validateStep = useCallback(
    (stepToValidate) => {
      let error = '';
      if (stepToValidate === 1) {
        if (!detectionDate) error = 'Indica la fecha de detección.';
        else if (!detectionTime) error = 'Registra la hora aproximada del hallazgo.';
        else if (!reporterName.trim()) error = 'Escribe el nombre de la persona que reporta.';
        else if (!reporterContact.trim()) error = 'Añade un medio de contacto para seguimiento.';
      } else if (stepToValidate === 2) {
        if (!selectedFincaId) error = 'Selecciona una finca para continuar.';
        else if (!selectedLote) error = 'Indica el lote afectado antes de avanzar.';
        else if (!location) error = 'Fija la ubicación en el mapa para precisar la visita.';
      } else if (stepToValidate === 3) {
        if (selectedPartsList.length === 0) {
          error = 'Elige las partes de la planta que presentan síntomas.';
        } else if (symptoms.length === 0) {
          error = 'Describe al menos un síntoma observado.';
        } else if (!attachments.length) {
          error = 'Adjunta al menos una fotografía como evidencia.';
        }
      } else if (stepToValidate === 4) {
        if (!isReviewReady) {
          error = 'Completa los pasos previos antes de enviar la alerta.';
        }
      }
      setStepErrors(prev => ({ ...prev, [stepToValidate]: error }));
      return !error;
    },
    [
      attachments,
      detectionDate,
      detectionTime,
      isReviewReady,
      location,
      reporterContact,
      reporterName,
      selectedFincaId,
      selectedLote,
      selectedPartsList,
      symptoms,
    ]
  );

  // --- CORRECCIÓN: Función para el modal (estaba faltando) ---
  const handleImageClick = (e, photoSrc) => {
    e.stopPropagation();
    setPreviewImage(photoSrc);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) return;
    const finca = fincas.find(f => f.id === selectedFincaId);
    const alertData = {
      producerId: producer.id,
      fincaId: selectedFincaId,
      lote: selectedLote,
      farmName: finca ? finca.name : 'Finca Desconocida',
      date: new Date().toISOString().split('T')[0],
      parts: selectedParts,
      symptoms,
      photos: photos,
      location,
      status: 'pending',
      priority: null,
      basics: {
        detectionDate,
        detectionTime,
        reporterName,
        reporterContact,
        urgencyLevel,
        generalNotes,
      },
    };
    onSubmitAlert(alertData);
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderSummary = ({ highlightNotes = false } = {}) => {
    const finca = fincas.find(f => f.id === selectedFincaId);
    return (
      <section className="alert-summary-card">
        <header>
          <h3>Resumen previo al envío</h3>
          <p>Verifica cada campo antes de registrar la alerta.</p>
        </header>
        <div className="summary-grid">
          <div>
            <span>Fecha del hallazgo</span>
            <strong>{detectionDate || 'Pendiente'}</strong>
          </div>
          <div>
            <span>Hora aproximada</span>
            <strong>{detectionTime || '—'}</strong>
          </div>
          <div>
            <span>Reportado por</span>
            <strong>{reporterName || 'Sin definir'}</strong>
          </div>
          <div>
            <span>Contacto</span>
            <strong>{reporterContact || 'Agrega un número/correo'}</strong>
          </div>
          <div>
            <span>Prioridad estimada</span>
            <strong>{URGENCY_LABELS[urgencyLevel]}</strong>
          </div>
          <div>
            <span>Finca</span>
            <strong>{finca?.name || 'Sin seleccionar'}</strong>
          </div>
          <div>
            <span>Lote</span>
            <strong>{selectedLote || 'Sin seleccionar'}</strong>
          </div>
          <div>
            <span>Ubicación</span>
            <strong>
              {location ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}` : 'Pendiente'}
            </strong>
          </div>
          <div>
            <span>Partes afectadas</span>
            <strong>{selectedPartsList.length ? selectedPartsList.join(', ') : '—'}</strong>
          </div>
          <div>
            <span>Síntomas</span>
            <strong>{symptoms.length ? symptoms.join(', ') : '—'}</strong>
          </div>
          <div>
            <span>Evidencias</span>
            <strong>{attachments.length} archivo(s)</strong>
          </div>
        </div>
        <div className={`summary-notes ${highlightNotes ? 'is-highlighted' : ''}`}>
          <span>Notas generales</span>
          <p>{generalNotes.trim() || 'Sin comentarios adicionales.'}</p>
        </div>
      </section>
    );
  };

  const renderAttachments = () => (
    <div className="attachment-gallery">
      {attachments.length === 0 ? (
        <p className="muted">Aún no se adjuntan fotografías para esta alerta.</p>
      ) : (
        attachments.map(item => (
          <button
            type="button"
            key={item.part}
            className="attachment-thumb"
            onClick={(event) => handleImageClick(event, item.photo)}
          >
            <img src={item.photo} alt={`Evidencia de ${item.part}`} />
            <span>{item.part}</span>
          </button>
        ))
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-section">
            <div className="step-header">
              <span className="step-badge">Paso 1</span>
              <h2>Datos básicos de la alerta</h2>
              <p>Registra cuándo y quién detectó el evento para facilitar la trazabilidad.</p>
            </div>
            <div className="field-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="detectionDate">Fecha de detección</label>
                <div className="input-with-icon">
                  <CalendarDays size={18} aria-hidden />
                  <input
                    id="detectionDate"
                    type="date"
                    className="modern-input"
                    value={detectionDate}
                    onChange={event => setDetectionDate(event.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="detectionTime">Hora aproximada</label>
                <div className="input-with-icon">
                  <Clock size={18} aria-hidden />
                  <input
                    id="detectionTime"
                    type="time"
                    className="modern-input"
                    value={detectionTime}
                    onChange={event => setDetectionTime(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="field-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="reporterName">Persona que reporta</label>
                <div className="input-with-icon">
                  <User size={18} aria-hidden />
                  <input
                    id="reporterName"
                    type="text"
                    className="modern-input"
                    placeholder="Nombre y cargo"
                    value={reporterName}
                    onChange={event => setReporterName(event.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="reporterContact">Contacto</label>
                <div className="input-with-icon">
                  <Phone size={18} aria-hidden />
                  <input
                    id="reporterContact"
                    type="text"
                    className="modern-input"
                    placeholder="Teléfono o correo"
                    value={reporterContact}
                    onChange={event => setReporterContact(event.target.value)}
                  />
                </div>
                <p className="field-hint">Será usado por el técnico para coordinar la visita.</p>
              </div>
            </div>
            <div className="field-group">
              <span className="field-label with-icon">
                <Flame size={18} aria-hidden /> Prioridad estimada
              </span>
              <div className="chip-list">
                {URGENCY_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className={`chip chip-stacked ${urgencyLevel === option.value ? 'is-active' : ''}`}
                  >
                    <input
                      type="radio"
                      className="chip-input"
                      checked={urgencyLevel === option.value}
                      onChange={() => setUrgencyLevel(option.value)}
                    />
                    <Flame size={16} aria-hidden />
                    <div className="chip-text">
                      <span>{option.label}</span>
                      <small className="chip-hint">{option.hint}</small>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="generalNotes">Notas generales</label>
              <textarea
                id="generalNotes"
                className="modern-textarea"
                placeholder="Describe hallazgos iniciales, recomendaciones del capataz u otra información relevante."
                value={generalNotes}
                onChange={event => setGeneralNotes(event.target.value)}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="step-section">
            <div className="step-header">
              <span className="step-badge">Paso 2</span>
              <h2>Ubicación y lote</h2>
              <p>Elige la finca afectada, define el lote y fija la ubicación exacta en el mapa.</p>
            </div>
            <div className="field-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="fincaSelect">Finca</label>
                <div className="input-with-icon">
                  <Home size={18} aria-hidden />
                  <select id="fincaSelect" className="modern-select" value={selectedFincaId} onChange={handleFincaChange}>
                    {fincas.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <p className="field-hint">{`Mostrando ${fincas.length} finca(s) asociadas.`}</p>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="loteSelect">Lote</label>
                <div className={`input-with-icon ${!selectedLote ? 'is-empty' : ''}`}>
                  <List size={18} aria-hidden />
                  <select
                    id="loteSelect"
                    className="modern-select"
                    value={selectedLote}
                    onChange={(e) => setSelectedLote(e.target.value)}
                    disabled={lotes.length === 0}
                  >
                    <option value="">{lotes.length > 0 ? 'Selecciona un lote…' : 'Selecciona una finca primero'}</option>
                    {lotes.map(lote => <option key={lote} value={lote}>{lote}</option>)}
                  </select>
                </div>
                <p className="field-hint">
                  {selectedFinca ? `${selectedFinca.lotes.length} lotes disponibles en ${selectedFinca.name}.` : 'Selecciona una finca para ver sus lotes.'}
                </p>
              </div>
            </div>

            <div className="field-group">
              <span className="field-label with-icon">
                <MapPin size={18} aria-hidden /> Geolocalización
              </span>
              <p className="field-hint">Ubica el punto exacto para que el técnico llegue con precisión.</p>
              <div className="map-block">
                <MapPinSelector
                  onLocationSet={handleLocationSet}
                  initialLocation={selectedFinca?.location}
                />
              </div>
              <div className={`map-status ${location ? 'is-complete' : 'is-pending'}`}>
                {location ? <CheckCircle size={16} aria-hidden /> : <AlertTriangle size={16} aria-hidden />}
                <span>
                  {location
                    ? `Ubicación fijada: Lat ${location.lat.toFixed(6)}, Lon ${location.lon.toFixed(6)}`
                    : 'Ubicación pendiente. Haz clic en el mapa para establecerla.'}
                </span>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-section">
            <div className="step-header">
              <span className="step-badge">Paso 3</span>
              <h2>Síntomas y evidencia</h2>
              <p>Detalla la afectación observada y adjunta evidencia fotográfica.</p>
            </div>

            <div className="field-group">
              <span className="field-label">Partes de la planta</span>
              <div className="chip-list">
                {Object.keys(ALERT_SYMPTOMS_DATA).map(part => {
                  const isActive = !!selectedParts[part];
                  return (
                    <label key={part} className={`chip ${isActive ? 'is-active' : ''}`}>
                      <input
                        type="checkbox"
                        className="chip-input"
                        checked={isActive}
                        onChange={() => handlePartToggle(part)}
                      />
                      <Leaf size={16} aria-hidden />
                      <span>{part}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedPartsList.length > 0 ? (
              <div className="field-group">
                <span className="field-label">Síntomas específicos</span>
                <div className="chip-list symptoms">
                  {selectedPartsList.map(part => (
                    ALERT_SYMPTOMS_DATA[part].map(symptom => {
                      const isSelected = symptoms.includes(symptom);
                      return (
                        <label key={`${part}-${symptom}`} className={`chip chip-compact ${isSelected ? 'is-active' : ''}`}>
                          <input
                            type="checkbox"
                            className="chip-input"
                            checked={isSelected}
                            onChange={() => handleSymptomToggle(symptom)}
                          />
                          <Bug size={15} aria-hidden />
                          <span>{symptom}</span>
                        </label>
                      );
                    })
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <AlertTriangle size={18} aria-hidden />
                <span>Selecciona al menos una parte afectada para mostrar los síntomas sugeridos.</span>
              </div>
            )}

            <div className="field-group">
              <span className="field-label with-icon">
                <UploadCloud size={18} aria-hidden /> Evidencia fotográfica
              </span>
              <p className="field-hint">Las imágenes ayudan al equipo técnico a priorizar la atención de forma más precisa.</p>
              <div className="evidence-grid">
                {selectedPartsList.length > 0 ? (
                  selectedPartsList.map(part => (
                    <div className="evidence-card" key={`photo-${part}`}>
                      <div className="evidence-header">
                        <div className="evidence-icon">
                          <Camera size={18} aria-hidden />
                        </div>
                        <div>
                          <h3>Foto de {part}</h3>
                          <p>Opcional · Formato JPG o PNG</p>
                        </div>
                      </div>
                      <FileUploadButton
                        label={`Adjuntar foto de ${part}`}
                        onUpload={(file) => handlePhotoUpload(part, file)}
                        evidenceLoaded={!!photos[part]}
                      />
                      {photos[part] ? (
                        <div className="evidence-preview">
                          <div className="preview-image">
                            <img
                              src={photos[part]}
                              alt={`Evidencia de ${part}`}
                              onClick={(e) => handleImageClick(e, photos[part])}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                          <div className="preview-status">
                            <CheckCircle size={16} aria-hidden />
                            <span>Listo para enviar</span>
                          </div>
                        </div>
                      ) : (
                        <div className="evidence-placeholder">
                          <ImageIcon size={18} aria-hidden />
                          <span>Aún no se adjunta foto</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <AlertTriangle size={18} aria-hidden />
                    <span>Selecciona partes afectadas para habilitar la carga de fotografías.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="field-group">
              <span className="field-label">Vista rápida de adjuntos</span>
              {renderAttachments()}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="step-section">
            <div className="step-header">
              <span className="step-badge">Paso 4</span>
              <h2>Revisión final</h2>
              <p>Valida la información y confirma que las evidencias sean correctas antes de enviar.</p>
            </div>
            {renderSummary({ highlightNotes: true })}
            <div className="field-group">
              <span className="field-label with-icon">
                <Camera size={18} aria-hidden /> Adjuntos cargados
              </span>
              {attachments.length > 0 ? (
                renderAttachments()
              ) : (
                <p className="muted">Aún no hay fotografías adjuntas.</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const summaryItems = [
    {
      id: 'basics',
      icon: CalendarDays,
      label: 'Datos básicos',
      value: isStep1Complete
        ? `${detectionDate || '—'} · ${detectionTime || '—'}`
        : 'Completa fecha y hora del hallazgo',
      completed: isStep1Complete,
    },
    {
      id: 'priority',
      icon: Flame,
      label: 'Prioridad',
      value: `Prioridad ${URGENCY_LABELS[urgencyLevel]}`,
      completed: true,
    },
    {
      id: 'contact',
      icon: Phone,
      label: 'Contacto',
      value: reporterContact || 'Agrega datos de contacto',
      completed: Boolean(reporterContact),
    },
    {
      id: 'finca',
      icon: MapPin,
      label: 'Finca seleccionada',
      value: selectedFinca ? selectedFinca.name : 'Selecciona una finca para comenzar',
      completed: !!selectedFinca,
    },
    {
      id: 'lote',
      icon: List,
      label: 'Lote',
      value: selectedLote || 'Aún no has elegido un lote',
      completed: !!selectedLote,
    },
    {
      id: 'location',
      icon: location ? CheckCircle : AlertTriangle,
      label: 'Ubicación georreferenciada',
      value: location ? `Lat ${location.lat.toFixed(5)}, Lon ${location.lon.toFixed(5)}` : 'Fija el punto en el mapa para continuar',
      completed: !!location,
    },
    {
      id: 'parts',
      icon: Leaf,
      label: 'Partes afectadas',
      value: selectedPartsList.length ? selectedPartsList.join(', ') : 'Sin registros por ahora',
      completed: selectedPartsList.length > 0,
    },
    {
      id: 'symptoms',
      icon: Bug,
      label: 'Síntomas reportados',
      value: symptoms.length ? symptoms.join(', ') : 'Selecciona los síntomas observados',
      completed: symptoms.length > 0,
    },
    {
      id: 'photos',
      icon: Camera,
      label: 'Evidencia fotográfica',
      value: attachments.length ? `${attachments.length} archivo(s)` : 'Adjunta al menos una foto',
      completed: attachments.length > 0,
    },
  ];

  const progressValue = Math.round((completedSteps / steps.length) * 100);

  const calloutState = (() => {
    if (currentStep === 4) return isReviewReady ? 'success' : 'warning';
    if (currentStep === 3 && !isStep3Complete) return 'warning';
    if (currentStep === 2 && !isStep2Complete) return 'info';
    if (currentStep === 1 && !isStep1Complete) return 'info';
    return 'success';
  })();

  const calloutMessage = (() => {
    if (currentStep === 4) {
      return isReviewReady
        ? 'Todo listo. Revisa el resumen y envía tu alerta.'
        : 'Verifica que cada paso tenga la información requerida antes de enviar.';
    }
    if (currentStep === 3 && !isStep3Complete) {
      return 'Selecciona síntomas y adjunta al menos una foto para continuar.';
    }
    if (currentStep === 2 && !isStep2Complete) {
      return 'Selecciona la finca, el lote y fija la ubicación en el mapa.';
    }
    if (currentStep === 1 && !isStep1Complete) {
      return 'Completa la fecha, el contacto y la prioridad estimada.';
    }
    return '¡Excelente! Todo listo para enviar la alerta.';
  })();

  return (
    <div className="container alert-report-form">
      {previewImage && (
        <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
      )}

      <div className="alert-report-hero">
        <div className="hero-content">
          <span className="hero-badge">
            <Star size={16} aria-hidden /> Nuevo reporte de alerta
          </span>
          <h1 className="hero-title">Reportar nueva alerta</h1>
          <p className="hero-description">
            Completa los pasos para compartir la información clave con nuestro equipo técnico.
          </p>
          <div className="hero-highlights">
            {heroHighlights.map(({ id, icon: HighlightIcon, label, value, hint }) => (
              <div key={id} className="hero-highlight-card">
                <div className="hero-highlight-icon">
                  <HighlightIcon size={18} aria-hidden />
                </div>
                <div className="hero-highlight-text">
                  <span className="hero-highlight-label">{label}</span>
                  <strong className="hero-highlight-value">{value}</strong>
                  <small>{hint}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* --- CAMBIO: Tarjeta de productor eliminada --- */}
      </div>

      <form onSubmit={handleSubmit} className="alert-report-content">
        <div className="alert-report-layout">
          <section className="alert-report-panel">
            {/* --- CAMBIO: Stepper movido aquí --- */}
            <div className="alert-report-stepper">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const status = index + 1 < currentStep ? 'completed' : index + 1 === currentStep ? 'current' : 'upcoming';
                return (
                  <div key={step.id} className={`step-card ${status}`}>
                    <div className="step-marker">
                      {status === 'completed' ? <CheckCircle size={18} aria-hidden /> : index + 1}
                    </div>
                    <div className="step-text">
                      <div className="step-title">
                        <StepIcon size={18} aria-hidden />
                        <span>{step.title}</span>
                      </div>
                      <p>{step.description}</p>
                    </div>
                  </div>
                );
              })}
          </div>
          {/* --- Fin del Stepper --- */}

          {renderStepContent()}
          {stepErrors[currentStep] && (
            <div className="step-error">
              <AlertTriangle size={16} aria-hidden />
              <p>{stepErrors[currentStep]}</p>
            </div>
          )}
          <div className="formActions">
            {/* --- CAMBIO: Botón Cancelar añadido --- */}
            <Button
              type="button"
              variant="secondary"
              className="wizard-control wizard-control--cancel"
              onClick={() => onNavigate('producerAlertList')}
            >
              <X size={16} aria-hidden /> Cancelar
            </Button>

            {/* --- CAMBIO: Wrapper para botones de navegación --- */}
            <div className="step-navigation">
              <Button
                type="button"
                variant="secondary"
                className="wizard-control wizard-control--secondary"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft size={16} aria-hidden /> Paso anterior
              </Button>

              {currentStep < steps.length && (
                <Button
                  type="button"
                  variant="primary"
                  className="wizard-control wizard-control--primary"
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !isStep1Complete) ||
                    (currentStep === 2 && !isStep2Complete) ||
                    (currentStep === 3 && !isStep3Complete)
                  }
                  title={
                    (currentStep === 1 && !isStep1Complete)
                      ? 'Debe completar los datos básicos'
                      : (currentStep === 2 && !isStep2Complete)
                        ? 'Debe elegir finca, lote y ubicación'
                        : (currentStep === 3 && !isStep3Complete)
                          ? 'Debe registrar síntomas y adjuntar al menos una foto'
                          : 'Siguiente paso'
                  }
                >
                  Continuar <ArrowRight size={16} aria-hidden />
                </Button>
              )}

              {currentStep === steps.length && (
                <Button
                  type="submit"
                  variant="primary"
                  className="wizard-control wizard-control--primary"
                  disabled={!isReviewReady}
                  title={!isReviewReady ? 'Completa la información antes de enviar' : 'Enviar reporte'}
                >
                  Enviar reporte <CheckCircle size={16} aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </section>
         
        <aside className="alert-report-summary">
            <div className="summary-header">
              <Star size={18} aria-hidden />
              <div>
                <h3>Resumen del reporte</h3>
                <p>Visualiza el avance y confirma la información clave.</p>
              </div>
            </div>
            <div className="summary-progress">
              <div className="progress-header">
                <span>Progreso</span>
                <span>{progressValue}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressValue}%` }}></div>
              </div>
            </div>
            <div className={`summary-callout ${calloutState}`}>
              {calloutState === 'success' ? <CheckCircle size={16} aria-hidden /> : <AlertTriangle size={16} aria-hidden />}
              <span>{calloutMessage}</span>
            </div>
            <ul className="summary-list">
              {summaryItems.map(item => {
                const ItemIcon = item.icon;
                return (
                  <li key={item.id} className={`summary-item ${item.completed ? 'is-complete' : ''}`}>
                    <div className="summary-icon">
                      <ItemIcon size={18} aria-hidden />
                    </div>
                    <div className="summary-text">
                      <span className="summary-label">{item.label}</span>
                      <span className="summary-value">{item.value}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {renderSummary()}
            {currentStep === 3 && attachments.length > 0 && (
              <div className="summary-attachments">
                <span>Adjuntos cargados</span>
                {renderAttachments()}
              </div>
            )}
        </aside>
        </div>
      </form>
    </div>
  );
};

export default AlertReportForm;
