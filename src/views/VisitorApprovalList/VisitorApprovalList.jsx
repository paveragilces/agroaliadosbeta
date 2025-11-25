// En: src/views/VisitorApprovalList/VisitorApprovalList.jsx
// --- ARCHIVO COMPLETO CON LA CORRECCIÓN DE 'calculateRisk' ---

import React, { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/Icon';
import FilterPanel from '../../components/ui/FilterPanel/FilterPanel';
import { ICONS } from '../../config/icons';
import { calculateRisk } from '../../utils/riskCalculator';
import Table from '../../components/ui/Table/Table';
import RiskTag from '../../components/ui/RiskTag/RiskTag';
import './VisitorApprovalList.css';

const STATUS_TABS = [
  { id: 'pending', label: 'Pendientes', description: 'Solicitudes que requieren revisión inmediata.' },
  { id: 'approved', label: 'Autorizadas', description: 'Visitas aprobadas o en curso.' },
  { id: 'history', label: 'Rechazadas', description: 'Solicitudes rechazadas o canceladas.' },
];

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  CHECKED_IN: 'En sitio',
  CHECKED_OUT: 'Finalizada',
  DENIED: 'Rechazada',
  CANCELLED: 'Cancelada',
};

const STATUS_TONES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  CHECKED_IN: 'active',
  CHECKED_OUT: 'completed',
  DENIED: 'denied',
  CANCELLED: 'denied',
};

const parseTime = (value) => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const formatWindow = (entryTime, exitTime) => {
  const entryDate = entryTime ? new Date(entryTime) : null;
  const exitDate = exitTime ? new Date(exitTime) : null;

  if (!entryDate && !exitDate) {
    return 'Sin horario confirmado';
  }

  const dateFormatter = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedStart = entryDate ? dateFormatter.format(entryDate) : '—';
  const formattedEnd = exitDate ? dateFormatter.format(exitDate) : '—';

  if (!exitDate || (entryDate && entryDate.toDateString() === exitDate.toDateString())) {
    return `${formattedStart}${exitDate ? ` • ${exitDate.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}` : ''}`;
  }

  return `${formattedStart} — ${formattedEnd}`;
};

const getVisitRisk = (visit) => {
  const safeCompany = visit.company || '';
  const safePurpose = visit.purpose || '';
  const safeValueChain = visit.valueChain || '';

  if (visit.status === 'PENDING') {
    return calculateRisk(safeCompany, safePurpose, safeValueChain);
  }

  return visit.risk || calculateRisk(safeCompany, safePurpose, safeValueChain);
};

const VisitorApprovalList = ({
  producer,
  visits,
  onApproveVisit,
  onRejectVisit,
  pageData,
  onNavigate,
}) => {
  const [statusTab, setStatusTab] = useState(pageData?.filter || 'pending');
  const [valueChainFilter, setValueChainFilter] = useState(pageData?.valueChain || 'Todas');
  const [searchTerm, setSearchTerm] = useState(pageData?.search || '');

  useEffect(() => {
    if (pageData?.filter && STATUS_TABS.some((tab) => tab.id === pageData.filter)) {
      setStatusTab(pageData.filter);
    }
    if (pageData?.valueChain) {
      setValueChainFilter(pageData.valueChain);
    }
    if (typeof pageData?.search === 'string') {
      setSearchTerm(pageData.search);
    }
  }, [pageData]);

  const visitsForProducer = useMemo(
    () => visits.filter((visit) => visit.producerId === producer.id),
    [visits, producer.id],
  );

  const categorizedVisits = useMemo(() => ({
    pending: visitsForProducer.filter((visit) => visit.status === 'PENDING'),
    approved: visitsForProducer.filter((visit) =>
      ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'].includes(visit.status)
    ),
    history: visitsForProducer.filter((visit) => ['DENIED', 'CANCELLED'].includes(visit.status)),
  }), [visitsForProducer]);

  const valueChainOptions = useMemo(() => {
    const options = new Set(['Todas']);
    visitsForProducer.forEach((visit) => {
      if (visit.valueChain) {
        options.add(visit.valueChain);
      }
    });
    return Array.from(options);
  }, [visitsForProducer]);

  const filterPillGroups = useMemo(() => [
    {
      id: 'status-tabs',
      label: 'Estado',
      items: STATUS_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        active: statusTab === tab.id,
        onClick: () => setStatusTab(tab.id),
      })),
    },
    {
      id: 'value-chain',
      label: 'Cadena de valor',
      items: valueChainOptions.map((option) => ({
        id: option,
        label: option,
        active: valueChainFilter === option,
        onClick: () => setValueChainFilter(option),
      })),
    },
  ], [statusTab, valueChainFilter, valueChainOptions]);

  const upcomingVisit = useMemo(() => {
    const ordered = [...categorizedVisits.pending].sort((a, b) => {
      const timeA = parseTime(a.entryTime) ?? Number.MAX_SAFE_INTEGER;
      const timeB = parseTime(b.entryTime) ?? Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });
    return ordered[0];
  }, [categorizedVisits.pending]);

  const latestDecision = useMemo(() => {
    const decided = [...categorizedVisits.approved, ...categorizedVisits.history];
    if (!decided.length) {
      return null;
    }

    return decided.sort((a, b) => {
      const endA = parseTime(a.exitTime) ?? parseTime(a.entryTime) ?? 0;
      const endB = parseTime(b.exitTime) ?? parseTime(b.entryTime) ?? 0;
      return endB - endA;
    })[0];
  }, [categorizedVisits.approved, categorizedVisits.history]);

  const averageRisk = useMemo(() => {
    const risks = categorizedVisits.pending.map((visit) => getVisitRisk(visit));
    if (!risks.length) {
      return { label: 'Sin pendientes', detail: 'No hay solicitudes para calcular riesgo.' };
    }

    const weight = { Low: 1, Medium: 2, High: 3 };
    const average = risks.reduce((acc, risk) => acc + (weight[risk] || 0), 0) / risks.length;

    if (average <= 1.5) {
      return {
        label: 'Bajo',
        detail: `Promedio calculado sobre ${risks.length} solicitudes`,
      };
    }
    if (average <= 2.3) {
      return {
        label: 'Medio',
        detail: `Promedio calculado sobre ${risks.length} solicitudes`,
      };
    }
    return {
      label: 'Alto',
      detail: `Promedio calculado sobre ${risks.length} solicitudes`,
    };
  }, [categorizedVisits.pending]);

  const displayVisits = useMemo(() => {
    const source = categorizedVisits[statusTab] || categorizedVisits.pending;
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return source
      .filter((visit) => {
        if (valueChainFilter !== 'Todas' && visit.valueChain !== valueChainFilter) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }

        return [visit.name, visit.company, visit.idNumber]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        const timeA = parseTime(a.entryTime) ?? parseTime(a.createdAt) ?? Number.MAX_SAFE_INTEGER;
        const timeB = parseTime(b.entryTime) ?? parseTime(b.createdAt) ?? Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      });
  }, [categorizedVisits, statusTab, valueChainFilter, searchTerm]);

  const tableHeaders = useMemo(() => [
    { label: 'Visitante' },
    { label: 'Finca' },
    { label: 'Compañía' },
    { label: 'Motivo' },
    { label: 'Cadena de Valor' },
    { label: 'Ventana' },
    { label: 'Riesgo', className: 'text-center' },
    statusTab === 'pending'
      ? { label: 'Acción', className: 'text-center' }
      : { label: 'Estado', className: 'text-center' },
  ], [statusTab]);

  const renderVisitRow = (visit) => {
    const finca = producer.fincas.find((fincaItem) => fincaItem.id === visit.fincaId);
    const riskLevel = getVisitRisk(visit);
    const isNext = statusTab === 'pending' && upcomingVisit && upcomingVisit.id === visit.id;
    const statusLabel = STATUS_LABELS[visit.status] || visit.status;
    const statusTone = STATUS_TONES[visit.status] || 'pending';

    return (
      <>
        <td>
          <div className="visitor-approval__person">
            <span className="visitor-approval__person-name">{visit.name}</span>
            <span className="visitor-approval__person-id">{visit.idNumber}</span>
            {isNext && (
              <span className="visitor-approval__badge">Próxima visita</span>
            )}
          </div>
        </td>
        <td>
          <div className="visitor-approval__finca">
            <span className="visitor-approval__finca-name">{finca ? finca.name : 'Sin finca asignada'}</span>
            {finca?.hectares && (
              <span className="visitor-approval__finca-meta">{`${finca.hectares} ha`}</span>
            )}
          </div>
        </td>
        <td>
          <div className="visitor-approval__info">{visit.company || '—'}</div>
        </td>
        <td>
          <div className="visitor-approval__info">{visit.purpose || '—'}</div>
        </td>
        <td>
          <span className="visitor-approval__chip">{visit.valueChain || '—'}</span>
        </td>
        <td>
          <div className="visitor-approval__window">{formatWindow(visit.entryTime, visit.exitTime)}</div>
        </td>
        <td className="text-center">
          <RiskTag riskLevel={riskLevel} />
        </td>
        <td className="text-center">
          {statusTab === 'pending' ? (
            <div className="visitor-approval__actions">
              <button
                type="button"
                onClick={() => onApproveVisit(visit.id, riskLevel)}
                className="visitor-approval__action-btn visitor-approval__action-btn--approve"
                title="Aprobar y generar código QR"
              >
                <Icon path={ICONS.approve} size={18} />
                <span>Aprobar</span>
              </button>
              <button
                type="button"
                onClick={() => onRejectVisit(visit.id)}
                className="visitor-approval__action-btn visitor-approval__action-btn--reject"
                title="Rechazar la solicitud"
              >
                <Icon path={ICONS.reject} size={16} />
                <span>Rechazar</span>
              </button>
            </div>
          ) : (
            <span className={`visitor-approval__status visitor-approval__status--${statusTone}`}>
              {statusLabel}
            </span>
          )}
        </td>
      </>
    );
  };

  const emptyStates = {
    pending: {
      title: 'Sin solicitudes pendientes',
      message: 'Cuando un visitante solicite acceso, aparecerá aquí para que puedas aprobarlo.',
    },
    approved: {
      title: 'No hay visitas autorizadas',
      message: 'Aún no has aprobado visitas recientes. Revisa las solicitudes pendientes para agendar.',
    },
    history: {
      title: 'Sin rechazos recientes',
      message: 'Las solicitudes rechazadas o canceladas aparecerán en este historial.',
    },
  };

  const heroMetrics = [
    {
      icon: ICONS.checkboxEmpty,
      label: 'Pendientes por aprobar',
      primary: String(categorizedVisits.pending.length),
      secondary:
        categorizedVisits.pending.length === 1
          ? '1 solicitud necesita tu decisión.'
          : `${categorizedVisits.pending.length} solicitudes necesitan tu decisión.`,
    },
    {
      icon: ICONS.calendar,
      label: 'Próxima ventana',
      primary: upcomingVisit
        ? formatWindow(upcomingVisit.entryTime, upcomingVisit.exitTime)
        : 'Sin agenda',
      secondary: upcomingVisit
        ? producer.fincas.find((fincaItem) => fincaItem.id === upcomingVisit.fincaId)?.name ||
          'Finca por confirmar'
        : 'Aprueba una visita para agendarla.',
    },
    {
      icon: ICONS.priority,
      label: 'Riesgo promedio',
      primary: averageRisk.label,
      secondary: averageRisk.detail,
    },
  ];

  const currentEmptyState = emptyStates[statusTab] || emptyStates.pending;

  return (
    <div className="visitor-approval">
      <section className="visitor-approval__hero">
        <div className="visitor-approval__hero-content">
          <span className="visitor-approval__breadcrumb">Control de ingreso</span>
          <h1 className="visitor-approval__title">Aprobación de visitas</h1>
          <p className="visitor-approval__subtitle">
            Coordina quién puede ingresar a tus fincas y mantén el flujo seguro. {producer.owner && `Propietario: ${producer.owner}.`}
          </p>
          <div className="visitor-approval__hero-metrics">
            {heroMetrics.map((metric) => (
              <article key={metric.label} className="visitor-approval__metric">
                <div className="visitor-approval__metric-header">
                  <div className="visitor-approval__metric-icon">
                    <Icon path={metric.icon} size={22} />
                  </div>
                  <span className="visitor-approval__metric-label">{metric.label}</span>
                </div>
                <strong className="visitor-approval__metric-value">{metric.primary}</strong>
                <p className="visitor-approval__metric-detail">{metric.secondary}</p>
              </article>
            ))}
          </div>
          <div className="visitor-approval__hero-actions">
            <button
              type="button"
              className="visitor-approval__hero-button visitor-approval__hero-button--primary"
              onClick={() => onNavigate && onNavigate('producerVisitorLog')}
            >
              <Icon path={ICONS.report} size={18} />
              Ver registro completo
            </button>
            <button
              type="button"
              className="visitor-approval__hero-button visitor-approval__hero-button--ghost"
              onClick={() => onNavigate && onNavigate('visitorAccessPage')}
            >
              <Icon path={ICONS.visit} size={18} />
              Abrir solicitud pública
            </button>
          </div>
        </div>
      </section>

      <section className="visitor-approval__table-card">
          <header className="visitor-approval__table-header">
        <FilterPanel
          className="visitor-approval__filterPanel"
          pillGroups={filterPillGroups}
        />
        <label className="visitor-approval__search">
          <span className="sr-only">Buscar visitas</span>
          <Icon path={ICONS.filter} size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por visitante, empresa o cédula"
          />
        </label>
          </header>

          {displayVisits.length === 0 ? (
            <EmptyState
              iconPath={ICONS.visit}
              title={currentEmptyState.title}
              message={currentEmptyState.message}
            />
          ) : (
            <Table
              headers={tableHeaders}
              data={displayVisits}
              renderRow={renderVisitRow}
              emptyMessage=""
            />
          )}
      </section>

      <section className="visitor-approval__guides">
        <article className="visitor-approval__guide-card">
          <Icon path={ICONS.time} size={18} />
          <div>
            <strong>Confirma 24h antes</strong>
            <p>Contacta al visitante si la visita es crítica para ajustar horarios y responsables.</p>
          </div>
        </article>
        <article className="visitor-approval__guide-card">
          <Icon path={ICONS.checkCircle} size={18} />
          <div>
            <strong>Registra evidencias</strong>
            <p>Solicita documentos o protocolos si el riesgo sale alto antes de aprobar.</p>
          </div>
        </article>
        <article className="visitor-approval__guide-card">
          <Icon path={ICONS.info} size={18} />
          <div>
            <strong>Usa el historial</strong>
            <p>Revisa el registro completo para conocer visitas anteriores y decisiones tomadas.</p>
          </div>
        </article>
      </section>
    </div>
  );
};

export default VisitorApprovalList;
