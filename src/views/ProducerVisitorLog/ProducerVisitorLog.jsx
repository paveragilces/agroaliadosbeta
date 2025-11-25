// src/views/ProducerVisitorLog/ProducerVisitorLog.jsx
// --- TU CÓDIGO ORIGINAL RESTAURADO ---

import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/ui/Table/Table';
// ¡REMOVIMOS 'Button' de esta importación, ya que no lo usamos para los filtros!
import Icon from '../../components/ui/Icon';
import RiskTag from '../../components/ui/RiskTag/RiskTag';
import { ICONS } from '../../config/icons';
import { VISIT_PURPOSES } from '../../data/constants';
import './ProducerVisitorLog.css';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';
import { Calendar, MapPin, CheckCircle2, Layers, AlertTriangle } from 'lucide-react';

// Importamos el componente Button por separado para usarlo en la tabla
import Button from '../../components/ui/Button';


const ProducerVisitorLog = ({ producerLog, onGeneratePDF, producer }) => {
  const [filteredLog, setFilteredLog] = useState(producerLog);
  
  // --- Estados de Filtro ---
  const [fincaFilter, setFincaFilter] = useState('Todos');
  const [nameFilter, setNameFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [purposeFilter, setPurposeFilter] = useState('Todos');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  const [showAdvanced, setShowAdvanced] = useState(false);


  // Opciones para los dropdowns premium del panel
  const statusOptions = [
    { value: 'Todos', label: 'Todos los Estados' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'APPROVED', label: 'Aprobada' },
    { value: 'DENIED', label: 'Rechazada' },
    { value: 'CHECKED_IN', label: 'Ingresó' },
    { value: 'CHECKED_OUT', label: 'Salió' }
  ];

  const riskOptions = [
    { value: 'Todos', label: 'Todos los Riesgos' },
    { value: 'low', label: 'Bajo' },
    { value: 'middle', label: 'Medio' },
    { value: 'high', label: 'Alto' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Cualquier Fecha' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Últimos 7 días' },
    { value: 'month', label: 'Últimos 30 días' },
  ];
  
  const purposeOptions = ['Todos', ...VISIT_PURPOSES];
  const fincaOptions = [{ id: 'Todos', name: 'Todas mis Fincas' }, ...(producer.fincas || [])];
  const fincaSelectOptions = useMemo(
    () => fincaOptions.map(option => ({ value: option.id, label: option.name })),
    [fincaOptions]
  );
  const purposeSelectOptions = useMemo(
    () => purposeOptions.map(option => ({ value: option, label: option })),
    [purposeOptions]
  );
  const primarySelectGroups = useMemo(
    () => [
      {
        id: 'dateRange',
        label: 'Rango de fecha',
        icon: Calendar,
        value: dateRangeFilter,
        onChange: event => setDateRangeFilter(event.target.value),
        options: dateRangeOptions,
      },
      {
        id: 'finca',
        label: 'Finca',
        icon: MapPin,
        value: fincaFilter,
        onChange: event => setFincaFilter(event.target.value),
        options: fincaSelectOptions,
      },
      {
        id: 'status',
        label: 'Estado',
        icon: CheckCircle2,
        value: statusFilter,
        onChange: event => setStatusFilter(event.target.value),
        options: statusOptions,
      }
    ],
    [dateRangeFilter, fincaFilter, statusFilter, dateRangeOptions, fincaSelectOptions, statusOptions]
  );

  const advancedSelectGroups = useMemo(
    () => [
      {
        id: 'purpose',
        label: 'Tipo de visitante',
        icon: Layers,
        value: purposeFilter,
        onChange: event => setPurposeFilter(event.target.value),
        options: purposeSelectOptions,
      },
      {
        id: 'risk',
        label: 'Riesgo',
        icon: AlertTriangle,
        value: riskFilter,
        onChange: event => setRiskFilter(event.target.value),
        options: riskOptions,
      }
    ],
    [purposeFilter, riskFilter, purposeSelectOptions, riskOptions]
  );


  // Lógica de filtrado
  useEffect(() => {
    let tempLog = producerLog;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateRangeFilter !== 'all') {
      let startDate = new Date(today);
      if (dateRangeFilter === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (dateRangeFilter === 'month') {
        startDate.setDate(today.getDate() - 30);
      }
      tempLog = tempLog.filter(visit => {
        const visitDateString = visit.checkIn || visit.entryTime || visit.date;
        if (!visitDateString) return false;
        const visitDate = new Date(visitDateString);
        if (dateRangeFilter === 'today') {
          return visitDate.toDateString() === today.toDateString();
        }
        return visitDate >= startDate && visitDate <= now;
      });
    }
    if (fincaFilter !== 'Todos') {
      tempLog = tempLog.filter(visit => visit.fincaId === fincaFilter);
    }
    if (nameFilter) {
      tempLog = tempLog.filter(visit =>
        visit.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    if (companyFilter) {
      tempLog = tempLog.filter(visit =>
        visit.company.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }
    if (riskFilter !== 'Todos') {
      tempLog = tempLog.filter(visit =>
        (visit.risk || 'N/A').toLowerCase() === riskFilter.toLowerCase()
      );
    }
    if (statusFilter !== 'Todos') {
      tempLog = tempLog.filter(visit =>
        visit.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (purposeFilter !== 'Todos') {
      tempLog = tempLog.filter(visit => visit.purpose === purposeFilter);
    }

    setFilteredLog(tempLog);
  }, [producerLog, fincaFilter, nameFilter, companyFilter, riskFilter, statusFilter, purposeFilter, dateRangeFilter]);

  const tableHeaders = [
    { label: 'Nombre' },
    { label: 'Compañía' },
    { label: 'Riesgo', className: 'text-center' },
    { label: 'Entrada' },
    { label: 'Salida' },
    { label: 'Estado' },
    { label: 'Reporte', className: 'text-center' },
  ];

  const renderVisitRow = (visit) => (
    <>
      <td>{visit.name}</td>
      <td>{visit.company}</td>
      <td className="text-center">
        <RiskTag riskLevel={visit.risk} />
      </td>
      <td>{visit.checkIn ? new Date(visit.checkIn).toLocaleString() : 'N/A'}</td>
      <td>{visit.checkOut ? new Date(visit.checkOut).toLocaleString() : 'N/A'}</td>
      <td>
        <span className={`visitStatusTag ${visit.status.toLowerCase()}`}>
          {statusOptions.find(opt => opt.value === visit.status)?.label || visit.status}
        </span>
      </td>
      <td className="text-center">
        {/* Usamos el componente <Button> de /ui solo para el botón de la tabla */}
        <Button 
          variant="icon" 
          onClick={() => onGeneratePDF(visit)} // <-- Esta llamada es correcta
          disabled={!visit.checkIn}
          className={visit.checkIn ? 'pdfButton enabled' : 'pdfButton'}
          title={!visit.checkIn ? "El reporte está disponible después del ingreso real." : "Generar Reporte PDF"}
        >
          <Icon path={ICONS.download} size={20} />
        </Button>
      </td>
    </>
  );
  
  const clearFilters = () => {
    setFincaFilter('Todos');
    setNameFilter('');
    setCompanyFilter('');
    setRiskFilter('Todos');
    setStatusFilter('Todos');
    setPurposeFilter('Todos');
    setDateRangeFilter('all');
    setShowAdvanced(false); 
  };

  const summary = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    let pending = 0;
    let onSite = 0;
    let highRisk = 0;
    let visitsToday = 0;
    const purposes = new Set();

    filteredLog.forEach(visit => {
      const status = (visit.status || '').toUpperCase();
      if (status === 'PENDING') pending += 1;
      if (status === 'CHECKED_IN') onSite += 1;

      const risk = (visit.risk || '').toLowerCase();
      if (risk === 'high') highRisk += 1;

      if (visit.purpose) {
        purposes.add(visit.purpose);
      }

      const visitDateString = visit.checkIn || visit.entryTime || visit.date;
      if (visitDateString) {
        const visitDate = new Date(visitDateString);
        if (visitDate >= startOfToday && visitDate < startOfTomorrow) {
          visitsToday += 1;
        }
      }
    });

    const total = filteredLog.length;

    return {
      total,
      pending,
      onSite,
      highRisk,
      visitsToday,
      purposeCount: purposes.size,
      highRiskShare: total ? Math.round((highRisk / total) * 100) : 0,
      updatedLabel: now.toLocaleString('es-ES', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }, [filteredLog]);

  return (
    <div className="producerVisitorLog">
      <div className="visitor-log-header">
        <p className="eyebrow">Control de accesos</p>
        <div className="header-title-row">
          <div className="hero-title-wrap">
            <span className="hero-icon">
              <Icon name="ClipboardList" size={26} strokeWidth={1.7} />
            </span>
            <h1 className="h1 hero-title">Registro de visitas</h1>
          </div>
          <span className="hero-updated">Actualizado {summary.updatedLabel}</span>
        </div>
        <p className="hero-subtitle">
          {producer?.name ? `${producer.name} ` : 'Tu finca '}
          monitorea {summary.total === 1 ? 'una visita' : `${summary.total} visitas`} activas con estos filtros.
          {summary.visitsToday > 0 && ` ${summary.visitsToday} movimiento${summary.visitsToday === 1 ? '' : 's'} hoy.`}
        </p>
      </div>

      <div className="visitor-log-statsRow">
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="Layers" size={24} strokeWidth={1.8} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{summary.total}</span>
              <span className="stat-label">Visitas filtradas</span>
              <span className="stat-meta">
                {summary.purposeCount > 0
                  ? `${summary.purposeCount} motivo${summary.purposeCount === 1 ? '' : 's'} distintos`
                  : 'Sin motivo registrado'}
              </span>
            </div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon">
              <Icon name="MapPin" size={24} strokeWidth={1.8} color="#fff" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{summary.onSite}</span>
              <span className="stat-label">En finca ahora</span>
              <span className="stat-meta">
                {summary.pending > 0
                  ? `${summary.pending} pendiente${summary.pending === 1 ? '' : 's'} por revisar`
                  : 'Sin solicitudes pendientes'}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="ArrowDownUp" size={22} strokeWidth={1.8} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{summary.visitsToday}</span>
              <span className="stat-label">Movimientos hoy</span>
              <span className="stat-meta">Corte diario al reiniciar turnos</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <Icon name="AlertTriangle" size={22} strokeWidth={1.8} color="#b73b3b" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{summary.highRiskShare}%</span>
              <span className="stat-label">Riesgo alto</span>
              <span className="stat-meta">
                {summary.highRisk} visitante{summary.highRisk === 1 ? '' : 's'} alerta
              </span>
            </div>
          </div>
      </div>

      {/* --- BARRA DE FILTROS REDISEÑADA --- */}
      <div className="filtersContainer">
        
        {/* --- FILA 1: Filtros Principales --- */}
        <div className="filtersRow primary">
          <FilterPanel className="filtersRow__panel" selectGroups={primarySelectGroups} />

          {/* Botones de acción en la fila principal */}
          <div className="filterGroup actionButtons">
            {/* ¡CAMBIO! Usamos <button> estándar */}
            <button 
              type="button"
              className="button button-secondary-outline"
              onClick={() => setShowAdvanced(prev => !prev)}
            >
              <Icon path={ICONS.filter} size={16} />
              <span>{showAdvanced ? 'Ocultar' : 'Avanzados'}</span>
              <Icon path={showAdvanced ? ICONS.chevronUp : ICONS.chevronDown} size={16} />
            </button>
            
            {/* ¡CAMBIO! Usamos <button> estándar */}
            <button 
              type="button"
              onClick={clearFilters}
              className="button clearFiltersButton icon"
              title="Limpiar filtros"
            >
              <Icon path={ICONS.reject} size={16} />
            </button>
          </div>
        </div>

        {/* --- FILA 2: Filtros Avanzados (Colapsable) --- */}
        <div className={`filtersRow advanced ${showAdvanced ? 'expanded' : ''}`}>
          <div className="filterGroup">
            <label htmlFor="nameFilter" className="filterLabel">
              <Icon name="UserCog" size={16} strokeWidth={2} />
              <span>Nombre</span>
            </label>
            <input
              type="text"
              id="nameFilter"
              className="filterInput"
              placeholder="Filtrar Nombre..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </div>
          <div className="filterGroup">
            <label htmlFor="companyFilter" className="filterLabel">
              <Icon name="Flag" size={16} strokeWidth={2} />
              <span>Compañía</span>
            </label>
            <input
              type="text"
              id="companyFilter"
              className="filterInput"
              placeholder="Filtrar Compañía..."
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            />
          </div>
          <FilterPanel className="filtersRow__panel" selectGroups={advancedSelectGroups} />
        </div>
      </div>

      <div className="visitor-log-tableCard">
        <div className="table-card-header">
          <div className="table-card-title">
            <span className="table-card-icon">
              <Icon name="ClipboardList" size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h3>Bitácora detallada</h3>
              <p>Todos los registros asociados al filtro activo.</p>
            </div>
          </div>
          <span className="table-card-count">
            <Icon name="Filter" size={16} strokeWidth={2} />
            {filteredLog.length} resultado{filteredLog.length === 1 ? '' : 's'}
          </span>
        </div>
        <Table
          headers={tableHeaders}
          data={filteredLog}
          renderRow={renderVisitRow}
          emptyMessage="No hay visitas que coincidan con los filtros."
        />
      </div>
    </div>
  );
};

export default ProducerVisitorLog;
