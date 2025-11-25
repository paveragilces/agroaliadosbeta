import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapPin, AlertTriangle, ShieldCheck, CalendarDays, Activity, Download, CheckSquare } from 'lucide-react';
import './FincaExecutiveSummary.css';

const FincaExecutiveSummary = ({
  producers,
  alerts,
  tasks,
  visits,
  containmentPlans,
  certificationHistory,
  technicians = [],
  onDownloadSummary,
  pageData,
  onNavigate
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const focusId = pageData?.focusFincaId;
  const initialSelection = pageData?.initialSelection;

  useEffect(() => {
    if (Array.isArray(initialSelection) && initialSelection.length) {
      setSelectedIds(Array.from(new Set(initialSelection)));
    }
  }, [initialSelection]);

  useEffect(() => {
    if (!focusId) return;
    setSelectedIds(prev => Array.from(new Set([...prev, focusId])));
    const node = document.getElementById(`finca-card-${focusId}`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusId]);

  const fincaSummaries = useMemo(() => {
    const summaries = [];
    producers.forEach(producer => {
      producer.fincas.forEach(finca => {
        const fincaAlerts = alerts.filter(alert => alert.fincaId === finca.id);
        const activeAlerts = fincaAlerts.filter(alert => alert.status !== 'completed');
        const completedAlerts = fincaAlerts.filter(alert => alert.status === 'completed');
        const criticalAlerts = activeAlerts.filter(
          alert => (alert.priority || '').toLowerCase() === 'alta'
        );

        const fincaTasks = tasks.filter(task => task.fincaId === finca.id || task.alertId && fincaAlerts.some(alert => alert.id === task.alertId));
        const tasksPending = fincaTasks.filter(task => task.status === 'pending');
        const tasksCompleted = fincaTasks.filter(task => task.status === 'completed');

        const fincaPlans = containmentPlans.filter(plan => plan.fincaId === finca.id);
        const activePlans = fincaPlans.filter(plan => plan.status !== 'completed');

        const fincaVisits = visits.filter(visit => visit.fincaId === finca.id);
        const pendingVisits = fincaVisits.filter(visit => visit.status === 'PENDING');
        const upcomingVisits = fincaVisits.filter(visit => visit.status === 'APPROVED');

        const statusBreakdown = {
          pending: fincaAlerts.filter(alert => alert.status === 'pending').length,
          assigned: fincaAlerts.filter(alert => alert.status === 'assigned').length,
          completed: fincaAlerts.filter(alert => alert.status === 'completed').length
        };

        const diseaseCounts = {};
        fincaAlerts.forEach(alert => {
          (alert.possibleDisease || []).forEach(disease => {
            const key = disease.trim();
            if (!key) return;
            diseaseCounts[key] = (diseaseCounts[key] || 0) + 1;
          });
        });
        const topDiseases = Object.entries(diseaseCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }));

        const highRiskVisits = fincaVisits.filter(visit => (visit.risk || '').toLowerCase() === 'high');

        const latestCertification = certificationHistory?.[0];
        const certificationsApproved = certificationHistory?.filter(item => item.status?.toLowerCase() === 'aprobado').length || 0;

        const notes =
          criticalAlerts.length > 0
            ? 'Hay alertas críticas pendientes por atender.'
            : activePlans.length > 0
              ? 'Se ejecutan planes de contención activos.'
              : highRiskVisits.length > 0
                ? 'Existen visitas de alto riesgo por atender.'
                : 'Operación estable.';

        summaries.push({
          id: finca.id,
          fincaName: finca.name,
          hectares: finca.hectares,
          lotes: finca.lotes.length,
          producerName: producer.owner,
          alertsActive: activeAlerts.length,
          alertsCritical: criticalAlerts.length,
          alertsCompleted: completedAlerts.length,
          tasksPending: tasksPending.length,
          tasksCompleted: tasksCompleted.length,
          containmentActive: activePlans.length,
          visitsPending: pendingVisits.length,
          visitsUpcoming: upcomingVisits.length,
          statusBreakdown,
          topDiseases,
          highRiskVisits: highRiskVisits.length,
          biosecurity: latestCertification
            ? {
                lastStatus: latestCertification.status,
                lastScore: latestCertification.averageScore,
                approvals: certificationsApproved,
                totalAudits: certificationHistory?.length || 0
              }
            : null,
          notes
        });
      });
    });
    return summaries;
  }, [producers, alerts, tasks, visits, containmentPlans]);

  const heroMetrics = useMemo(() => {
    const totalFincas = fincaSummaries.length;
    const criticalFincas = fincaSummaries.filter(summary => summary.alertsCritical > 0);
    const plansActivos = fincaSummaries.filter(summary => summary.containmentActive > 0);
    const visitasPendientes = fincaSummaries.reduce((acc, summary) => acc + summary.visitsPending, 0);
    const tareasPendientes = fincaSummaries.reduce((acc, summary) => acc + summary.tasksPending, 0);

    return [
      { label: 'Fincas monitoreadas', value: totalFincas, detail: `${criticalFincas.length} fincas con alertas críticas`, icon: MapPin },
      { label: 'Contención activa', value: plansActivos.length, detail: 'Planes y protocolos en ejecución', icon: ShieldCheck },
      { label: 'Visitas por aprobar', value: visitasPendientes, detail: `${visitasPendientes} solicitudes a revisión`, icon: CalendarDays },
      { label: 'Acciones pendientes', value: tareasPendientes, detail: 'Correctivas en la cola operativa', icon: Activity }
    ];
  }, [fincaSummaries]);

  const technicianTable = useMemo(() => {
    const metricMap = new Map();
    alerts.forEach(alert => {
      if (!alert.techId) return;
      if (!metricMap.has(alert.techId)) {
        metricMap.set(alert.techId, {
          id: alert.techId,
          name: technicians.find(tech => tech.id === alert.techId)?.name || 'Técnico asignado',
          fincas: new Set(),
          totalAlerts: 0,
          pendingAlerts: 0,
          criticalAlerts: 0,
          responseTimes: [],
          completionTimes: [],
          backlogTasks: 0,
        });
      }
      const entry = metricMap.get(alert.techId);
      entry.totalAlerts += 1;
      entry.fincas.add(alert.fincaName || alert.fincaId);
      if (alert.status !== 'completed') entry.pendingAlerts += 1;
      if ((alert.priority || '').toLowerCase() === 'alta') entry.criticalAlerts += 1;
      if (alert.date && alert.visitDate) {
        const diff = (new Date(alert.visitDate) - new Date(alert.date)) / (1000 * 60 * 60 * 24);
        if (!Number.isNaN(diff) && diff >= 0) entry.responseTimes.push(diff);
      }
      if (alert.status === 'completed') {
        const completionAt = alert.inspectionData?.plant?.data?.completedAt;
        if (completionAt && alert.date) {
          const diff = (new Date(completionAt) - new Date(alert.date)) / (1000 * 60 * 60 * 24);
          if (!Number.isNaN(diff) && diff >= 0) entry.completionTimes.push(diff);
        }
      }
    });

    tasks.forEach(task => {
      if (task.owner !== 'technician') return;
      const relatedAlert = alerts.find(alert => alert.id === task.alertId);
      if (!relatedAlert?.techId) return;
      const entry = metricMap.get(relatedAlert.techId);
      if (!entry) return;
      if (task.status !== 'completed') entry.backlogTasks += 1;
    });

    return Array.from(metricMap.values())
      .map(entry => ({
        ...entry,
        fincas: entry.fincas.size,
        responseAvg: entry.responseTimes.length
          ? (entry.responseTimes.reduce((a, b) => a + b, 0) / entry.responseTimes.length).toFixed(1)
          : '—',
        completionAvg: entry.completionTimes.length
          ? (entry.completionTimes.reduce((a, b) => a + b, 0) / entry.completionTimes.length).toFixed(1)
          : '—',
      }))
      .sort((a, b) => b.pendingAlerts - a.pendingAlerts);
  }, [alerts, tasks, technicians]);

  const toggleSelection = useCallback((fincaId) => {
    setSelectedIds(prev =>
      prev.includes(fincaId) ? prev.filter(id => id !== fincaId) : [...prev, fincaId]
    );
  }, []);

  const toggleAll = () => {
    if (selectedIds.length === fincaSummaries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(fincaSummaries.map(summary => summary.id));
    }
  };

  const handleExportVisible = () => {
    if (!fincaSummaries.length) return;
    onDownloadSummary(fincaSummaries);
  };

  const handleBulkExport = () => {
    if (!selectedIds.length) return;
    const selection = fincaSummaries.filter(summary => selectedIds.includes(summary.id));
    onDownloadSummary(selection);
  };

  return (
    <div className="fincaSummary">
      <section className="fincaSummary__hero">
        <div>
          <span>Resumen Ejecutivo</span>
          <h1>Estado integral por finca</h1>
          <p>
            Revisa el estado de cada finca con indicadores de alertas, tareas correctivas, visitas y
            planes de contención. Descarga reportes ejecutivos con un solo clic.
          </p>
          <div className="fincaSummary__heroActions">
            <button type="button" onClick={toggleAll}>
              <CheckSquare size={16} /> {selectedIds.length === fincaSummaries.length ? 'Quitar selección' : 'Seleccionar todas'}
            </button>
            <button
              type="button"
              className="primary"
              disabled={!selectedIds.length}
              onClick={handleBulkExport}
            >
              <Download size={16} /> Exportar selección
            </button>
            <button
              type="button"
              className="secondary"
              onClick={handleExportVisible}
              disabled={!fincaSummaries.length}
            >
              Exportar todo
            </button>
          </div>
        </div>
        <div className="fincaSummary__heroStats">
          {heroMetrics.map(({ label, value, detail, icon: StatIcon }) => (
            <article key={label} className="fincaSummary__statCard">
              <div className="fincaSummary__statIcon">
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
      </section>

      <section className="fincaSummary__grid">
        {fincaSummaries.map(summary => {
          const isSelected = selectedIds.includes(summary.id);
          const isFocused = summary.id === focusId;
          return (
            <article
              key={summary.id}
              id={`finca-card-${summary.id}`}
              className={`fincaSummary__card ${isSelected ? 'is-selected' : ''} ${
                isFocused ? 'is-focused' : ''
              }`}
            >
            <header>
              <div>
                <span>Finca</span>
                <h2>{summary.fincaName}</h2>
                <p>{summary.producerName}</p>
              </div>
              <button
                type="button"
                className="buttonGhost"
                onClick={() => onDownloadSummary(summary)}
              >
                <Download size={16} /> PDF
              </button>
              <label className="fincaSummary__checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(summary.id)}
                />
                Seleccionar
              </label>
            </header>
            <div className="fincaSummary__metrics">
              <div>
                <span>Alertas activas</span>
                <strong>
                  {summary.alertsActive}{' '}
                  {summary.alertsCritical > 0 && (
                    <small>
                      <AlertTriangle size={12} /> {summary.alertsCritical} críticas
                    </small>
                  )}
                </strong>
              </div>
              <div>
                <span>Planes de contención</span>
                <strong>{summary.containmentActive}</strong>
              </div>
              <div>
                <span>Tareas</span>
                <strong>
                  {summary.tasksPending} pendientes / {summary.tasksCompleted} completadas
                </strong>
              </div>
              <div>
                <span>Visitas</span>
                <strong>
                  {summary.visitsUpcoming} programadas · {summary.visitsPending} pendientes
                </strong>
              </div>
            </div>
            <div className="fincaSummary__extra">
              <div>
                <span>Estado de alertas</span>
                <p>
                  Pendientes {summary.statusBreakdown.pending} · Asignadas {summary.statusBreakdown.assigned} · Completadas {summary.statusBreakdown.completed}
                </p>
              </div>
              <div>
                <span>Enfermedades detectadas</span>
                {summary.topDiseases.length > 0 ? (
                  <ul>
                    {summary.topDiseases.map(disease => (
                      <li key={disease.name}>
                        {disease.name} ({disease.count})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Sin registros recientes.</p>
                )}
              </div>
              <div>
                <span>Bioseguridad</span>
                {summary.biosecurity ? (
                  <p>
                    Última auditoría: {summary.biosecurity.lastStatus} ({summary.biosecurity.lastScore}%) ·
                    {` ${summary.biosecurity.approvals}/${summary.biosecurity.totalAudits} aprobadas`}
                  </p>
                ) : (
                  <p>Sin historial.</p>
                )}
                <p>Visitas de alto riesgo: {summary.highRiskVisits}</p>
              </div>
            </div>
            <p className="fincaSummary__notes">{summary.notes}</p>
            </article>
          );
        })}
      </section>

      {technicianTable.length > 0 && (
        <section className="fincaSummary__technicians">
          <header>
            <div>
              <p>Desempeño por técnico</p>
              <h2>Relación fincas vs carga operativa</h2>
            </div>
          </header>
          <div className="technicianTable">
            <div className="technicianTableWrapper">
            <div className="technicianRow technicianRow--head">
              <span>Técnico</span>
              <span>Fincas</span>
              <span>Alertas activas</span>
              <span>Críticas</span>
              <span>Backlog</span>
              <span>Resp. prom.</span>
              <span>Cierre prom.</span>
            </div>
            {technicianTable.map(row => (
              <div key={row.id} className="technicianRow">
                <div className="technicianRow__name">
                  <strong>{row.name}</strong>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('technicianPerformance', { focusTechnicianId: row.id })}
                    >
                      Ver desempeño
                    </button>
                  )}
                </div>
                <span>{row.fincas}</span>
                <span>{row.pendingAlerts}/{row.totalAlerts}</span>
                <span>{row.criticalAlerts}</span>
                <span>{row.backlogTasks}</span>
                <span>{row.responseAvg} d</span>
                <span>{row.completionAvg} d</span>
              </div>
            ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default FincaExecutiveSummary;
