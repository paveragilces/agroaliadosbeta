import React, { useState, useMemo, useEffect } from 'react';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';
import './ProducerAlertList.css';

// --- CAMBIO: Importaciones de Lucide ---
import {
  X,
  LayoutDashboard,
  FileWarning,
  Clock,
  CheckCheck,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  MapPin,
  CameraOff,
  ArrowLeft,
  UserCog
} from 'lucide-react';

// --- Componente de Modal de Vista Previa de Imagen ---
const ImagePreviewModal = ({ src, onClose }) => (
  <div className="image-preview-backdrop" onClick={onClose}>
    <div className="image-preview-content">
      <button className="image-preview-close" onClick={onClose}>
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

const getSafeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getYearToken = (value) => {
  const parsed = getSafeDate(value);
  if (parsed) return String(parsed.getFullYear());
  if (typeof value === 'string' && value.length >= 4) return value.substring(0, 4);
  return null;
};

const getMonthToken = (value) => {
  const parsed = getSafeDate(value);
  if (parsed) return String(parsed.getMonth() + 1).padStart(2, '0');
  if (typeof value === 'string' && value.length >= 7) return value.substring(5, 7);
  return null;
};

const getDateSortValue = (value) => {
  const parsed = getSafeDate(value);
  return parsed ? parsed.getTime() : 0;
};

const ProducerAlertList = ({ producer, alerts, technicians, onNavigate, pageData, onGenerateAlertPDF }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);
  
  // --- CAMBIO: Nuevo estado para el filtro de finca ---
  const [filterFinca, setFilterFinca] = useState('all');

  useEffect(() => {
    if (pageData && pageData.filter) {
      setActiveFilter(pageData.filter);
      setFilterYear('all');
      setFilterMonth('all');
      setFilterFinca('all');
    }
  }, [pageData]);

  // --- CAMBIO: Generar opciones de finca ---
  const fincaOptions = useMemo(() => {
    const fincas = Array.isArray(producer?.fincas) ? producer.fincas : [];
    return [{ id: 'all', name: 'Todas mis Fincas' }, ...fincas];
  }, [producer?.fincas]);

  const getTechnicianName = (techId) => {
    const tech = technicians.find(t => t.id === techId);
    return tech ? tech.name : null;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Pendiente', className: 'status-pending' };
      case 'assigned':
        return { text: 'Asignada', className: 'status-assigned' };
      case 'completed':
        return { text: 'Completada', className: 'status-completed' };
      default:
        return { text: status, className: 'status-default' };
    }
  };

  const getPriorityInfo = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'alta':
        return { text: 'Alta', className: 'priority-high' };
      case 'media':
        return { text: 'Media', className: 'priority-medium' };
      case 'baja':
        return { text: 'Baja', className: 'priority-low' };
      default:
        return { text: 'Sin definir', className: 'priority-default' };
    }
  };

  const getLastUpdate = (alert) => {
    if (alert.inspectionData?.plant?.data?.updatedAt) {
      return alert.inspectionData.plant.data.updatedAt;
    }
    if (alert.visitDate) {
      return alert.visitDate;
    }
    return alert.date;
  };

  const formatDate = (date) => {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // --- CAMBIO: Iconos de Lucide ---
  const statusSummary = useMemo(() => {
    const pending = alerts.filter(alert => alert.status === 'pending').length;
    const assigned = alerts.filter(alert => alert.status === 'assigned').length;
    const completed = alerts.filter(alert => alert.status === 'completed').length;

    return [
      { key: 'all', label: 'Totales', value: alerts.length, icon: LayoutDashboard },
      { key: 'pending', label: 'Pendientes', value: pending, icon: FileWarning },
      { key: 'assigned', label: 'Asignadas', value: assigned, icon: Clock },
      { key: 'completed', label: 'Completadas', value: completed, icon: CheckCheck }
    ];
  }, [alerts]);

  const uniqueYears = useMemo(() => {
    const years = new Set(
      alerts
        .map(alert => getYearToken(alert.date))
        .filter(Boolean)
    );
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [alerts]);

  // --- CAMBIO: Lógica de filtro actualizada ---
  const filteredAlerts = useMemo(() => {
    let sorted = [...alerts].sort((a, b) => getDateSortValue(b.date) - getDateSortValue(a.date));

    // 1. Filtro de estado
    if (activeFilter !== 'all') {
      sorted = sorted.filter(alert => alert.status === activeFilter);
    }

    // 2. Filtro de Finca
    if (filterFinca !== 'all') {
      sorted = sorted.filter(alert => alert.fincaId === filterFinca);
    }

    // 3. Filtro de Año
    if (filterYear !== 'all') {
      sorted = sorted.filter(alert => getYearToken(alert.date) === filterYear);
    }

    // 4. Filtro de Mes
    if (filterMonth !== 'all') {
      sorted = sorted.filter(alert => getMonthToken(alert.date) === filterMonth);
    }

    return sorted;
  }, [alerts, activeFilter, filterFinca, filterYear, filterMonth]); // Dependencia añadida

  const formatGroupLabel = (date) => {
    const month = date.toLocaleString('es-ES', { month: 'long' });
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`;
  };

  const groupedAlerts = useMemo(() => {
    const groupsMap = new Map();
    filteredAlerts.forEach(alert => {
      const date = getSafeDate(alert.date) || new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label: formatGroupLabel(date),
          alerts: []
        });
      }
      groupsMap.get(key).alerts.push(alert);
    });
    return Array.from(groupsMap.values());
  }, [filteredAlerts]);

  const renderAlertCard = (alert) => {
    const techName = getTechnicianName(alert.techId);
    const statusInfo = getStatusInfo(alert.status);
    const priorityInfo = getPriorityInfo(alert.priority);
    const lastUpdate = formatDate(getLastUpdate(alert));

    const d = getSafeDate(alert.date) || new Date();
    const day = d.getUTCDate();
    const month = d.toLocaleString('es-ES', { month: 'short', timeZone: 'UTC' }).toUpperCase().replace('.', '');

    const photos = alert.photos ? Object.values(alert.photos).filter(Boolean) : [];
    const hasPhotos = photos.length > 0;
    const symptoms = Array.isArray(alert.symptoms) ? alert.symptoms.filter(Boolean) : [];
    const symptomsText = symptoms.length ? symptoms.join(', ') : 'Sin síntomas reportados';

    let managerDiagnosis = 'Sin diagnóstico';
    if (alert.possibleDisease && alert.possibleDisease.length > 0) {
      managerDiagnosis = alert.possibleDisease.join(', ');
    } else if (alert.managerComment) {
      managerDiagnosis = alert.managerComment;
    }

    const handleImageClick = (e, photoSrc) => {
      e.stopPropagation();
      setPreviewImage(photoSrc);
    };

    return (
      <button
        key={alert.id}
        className={`alert-card alert-card--${alert.status || 'default'}`}
        onClick={() => onNavigate('producerAlertList', alert)}
        title="Ver detalles de la alerta"
      >
        <div className="alert-card-header">
          <div className="alert-card-date">
            <span className="date-day">{day < 10 ? `0${day}` : day}</span>
            <span className="date-month">{month}</span>
          </div>

          <div className="alert-card-header-main">
            <h3 className="alert-card-title">{alert.farmName}</h3>
            <span className="alert-card-subtitle">
              <MapPin size={14} /> {alert.lote}
            </span>
            <div className="alert-card-meta">
              <span className={`priority-chip ${priorityInfo.className}`}>
                Prioridad {priorityInfo.text}
              </span>
              <span className="status-text">{statusInfo.text}</span>
            </div>
          </div>
        </div>

        <div className="alert-card-body">
          {hasPhotos ? (
            <div className="alert-card-mosaic">
              {photos.slice(0, 3).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Evidencia ${index + 1}`}
                  className="mosaic-image"
                  onClick={(e) => handleImageClick(e, photo)}
                />
              ))}
              {photos.length > 3 && (
                <div
                  className="mosaic-more"
                  onClick={(e) => handleImageClick(e, photos[3])}
                >
                  +{photos.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="mosaic-placeholder">
              <CameraOff size={24} />
              <span>No hay fotos, síntomas reportados:</span>
              <p>{symptomsText}</p>
            </div>
          )}
        </div>

        <div className="alert-card-footer">
          <div className="footer-item">
            <span>Estado actual</span>
            <strong>{statusInfo.text}</strong>
          </div>
          <div className="footer-item">
            <span>Técnico asignado</span>
            {techName ? (
              <strong>{techName}</strong>
            ) : (
              <strong className="unassigned">Sin asignar</strong>
            )}
          </div>
          <div className="footer-item">
            <span>Diagnóstico</span>
            {managerDiagnosis !== 'Sin diagnóstico' ? (
              <strong className="manager-diag">{managerDiagnosis}</strong>
            ) : (
              <strong className="unassigned">{managerDiagnosis}</strong>
            )}
          </div>
          <div className="footer-item">
            <span>Última actualización</span>
            <strong>{lastUpdate}</strong>
          </div>
        </div>
      </button>
    );
  };

  const renderAlertList = () => {
    if (groupedAlerts.length === 0) {
      return (
        <div className="emptyState full-width">
          <Filter size={60} color="#ccc" />
          <h2>Sin alertas</h2>
          <p>No se encontraron alertas que coincidan con el filtro seleccionado.</p>
        </div>
      );
    }

    return (
      <section className="alert-log-panel surface-card">
        <div className="alert-log-panelHeader">
          <div>
            <p className="alert-log-eyebrow">Historial consolidado</p>
            <h2>Registros de campo</h2>
          </div>
          <button
            type="button"
            className="button-secondary"
            onClick={() => onNavigate('producerDashboard')}
          >
            <ArrowLeft size={16} />
            Volver al panel
          </button>
        </div>
        <div className="alert-log-timeline">
          {groupedAlerts.map(group => (
            <section key={group.key} className="alert-log-group">
              <header className="alert-log-groupHeader">
                <div className="alert-log-title">
                  <Calendar size={16} />
                  <span>{group.label}</span>
                </div>
                <span className="alert-log-count">
                  {group.alerts.length} {group.alerts.length === 1 ? 'alerta' : 'alertas'}
                </span>
              </header>
              <div className="alert-log-groupBody">
                {group.alerts.map(alert => renderAlertCard(alert))}
              </div>
            </section>
          ))}
        </div>
      </section>
    );
  };

  const renderStatusSummary = () => (
    <div className="status-summary">
      {statusSummary.map(card => {
        const IconComponent = card.icon; // Renombrar para JSX
        return (
          <button
            key={card.key}
            type="button"
            className={`summary-card ${activeFilter === card.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(card.key)}
          >
            <span className="summary-icon">
              <IconComponent size={24} />
            </span>
            <div className="summary-content">
              <span className="summary-label">{card.label}</span>
              <strong className="summary-value">{card.value}</strong>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderFiltersToolbar = () => {
    const pillGroups = [
      {
        id: 'alert-status',
        label: 'Estado',
        items: statusSummary.map(summary => ({
          id: summary.key,
          label: `${summary.label} (${summary.value})`,
          active: activeFilter === summary.key,
          onClick: () => setActiveFilter(summary.key)
        }))
      }
    ];

    const selectGroups = [
      {
        id: 'finca',
        label: 'Finca',
        value: filterFinca,
        onChange: (event) => setFilterFinca(event.target.value),
        icon: MapPin,
        options: fincaOptions.map(finca => ({ value: finca.id, label: finca.name }))
      },
      {
        id: 'year',
        label: 'Año',
        value: filterYear,
        onChange: (event) => setFilterYear(event.target.value),
        icon: Calendar,
        options: [{ value: 'all', label: 'Todos los años' }, ...uniqueYears.map(year => ({ value: year, label: year }))]
      },
      {
        id: 'month',
        label: 'Mes',
        value: filterMonth,
        onChange: (event) => setFilterMonth(event.target.value),
        icon: Calendar,
        disabled: filterYear === 'all',
        options: MONTHS.map(month => ({ value: month.value, label: month.label }))
      }
    ];

    return (
      <div className="filters-toolbar surface-card">
        <div className="filters-toolbar-title">
          <Filter />
          <span>Explora alertas</span>
        </div>
        <FilterPanel
          className="filters-toolbar-panel"
          pillGroups={pillGroups}
          selectGroups={selectGroups}
        />
      </div>
    );
  };

  const renderAlertDetail = (alert) => {
    const techName = getTechnicianName(alert.techId);
    const statusInfo = getStatusInfo(alert.status);
    const resolution = alert.inspectionData?.plant?.data;
    return (
      <div className="alert-detail-container">
        <button className="button-back" onClick={() => onNavigate('producerAlertList')}>
          <ArrowLeft /> Volver al listado
        </button>
        <div className="alert-detail-header">
          <div>
            <h1 className="h1">Detalle de Alerta #{alert.id}</h1>
            <p className="alert-detail-finca">{alert.farmName} - {alert.lote}</p>
          </div>
          <span className={`alert-status-tag ${statusInfo.className}`}>
            {statusInfo.text}
          </span>
        </div>
        <div className="alert-detail-grid">
          <div className="card">
            <h3 className="h3">Reporte del Productor</h3>
            <div className="detail-item">
              <label>Fecha de Reporte:</label>
              <span>{new Date(alert.date).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <label>Síntomas Reportados:</label>
              <p>{alert.symptoms.join(', ')}</p>
            </div>
            <div className="detail-item">
              <label>Comentarios Adicionales:</label>
              <p>{alert.comments || 'Sin comentarios.'}</p>
            </div>
            <div className="detail-item">
              <label>Evidencia:</label>
              <div className="photo-gallery">
                {alert.photos && Object.keys(alert.photos).length > 0 ? (
                  Object.entries(alert.photos).map(([key, photoData]) => (
                    photoData ? <img key={key} src={photoData} alt={key} /> : null
                  ))
                ) : (
                  <span>No se adjuntaron fotos.</span>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="h3">Diagnóstico del Técnico</h3>
            <div className="detail-item">
              <label>Técnico Asignado:</label>
              <span>{techName || 'Pendiente'}</span>
            </div>
            <div className="detail-item">
              <label>Fecha de Visita:</label>
              <span>{alert.visitDate ? new Date(alert.visitDate).toLocaleDateString() : 'Pendiente'}</span>
            </div>
            <div className="detail-item">
              <label>Prioridad:</label>
              <span>{alert.priority || 'Pendiente'}</span>
            </div>
            {resolution ? (
              <>
                <h4 className="h4" style={{ marginTop: '20px' }}>Resultados de la Inspección</h4>
                <div className="detail-item">
                  <label>Diagnóstico Final:</label>
                  <span className="tag-diagnosis">{resolution.diagnosis.join(', ')}</span>
                </div>
                <div className="detail-item">
                  <label>Acciones Inmediatas:</label>
                  <span>{resolution.actions.join(', ')}</span>
                </div>
                <div className="detail-item">
                  <label>Recomendaciones:</label>
                  <p>{resolution.recommendations}</p>
                </div>
              </>
            ) : (
              <div className="emptyState mini">
                <UserCog size={40} color="#ccc" />
                <p>La inspección aún no ha sido completada.</p>
              </div>
            )}
          </div>
        </div>
        <div className="alert-detail-actions">
          <button className="button button-secondary" onClick={() => onGenerateAlertPDF?.(alert)}>
            <Download /> Descargar Reporte
          </button>
        </div>
      </div>
    );
  };

  const shouldShowDetail = pageData && pageData.id;

  return (
    <div className="container">
      {previewImage && (
        <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
      {shouldShowDetail ? (
        renderAlertDetail(pageData)
      ) : (
        <>
          <div className="alerts-hero">
            <div className="alerts-hero-text">
              <span className="hero-eyebrow">Productor</span>
              <h1 className="h1">Registro de Alertas</h1>
              <p>Gestiona y da seguimiento a las alertas reportadas en tus fincas.</p>
              <div className="hero-actions">
                <button className="button btn-primary" onClick={() => onNavigate('reportAlert')}>
                  <AlertCircle /> Reportar nueva alerta
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => onGenerateAlertPDF?.(alerts)}
                >
                  <Download /> Exportar resumen
                </button>
              </div>
            </div>
            {renderStatusSummary()}
          </div>
          {renderFiltersToolbar()}
          {renderAlertList()}
        </>
      )}
    </div>
  );
};

export default ProducerAlertList;
