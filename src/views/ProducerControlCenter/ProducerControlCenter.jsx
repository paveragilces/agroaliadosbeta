import React, { useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Users,
  ThermometerSun,
  Activity,
  Award,
  ArrowRight,
  ClipboardCheck
} from 'lucide-react';
import './ProducerControlCenter.css';

const LABOR_RISK_META = {
  deshije: { label: 'Deshije', risk: 'high' },
  enfunde: { label: 'Enfunde', risk: 'medium' },
  control_malezas: { label: 'Control de Malezas', risk: 'medium' },
  fumigacion: { label: 'Fumigación', risk: 'high' },
  cosecha: { label: 'Cosecha', risk: 'medium' }
};

const RISK_SCORE = {
  high: 3,
  medium: 1.5,
  low: 0
};

const ProducerControlCenter = ({
  producers,
  alerts,
  tasks,
  workers,
  containmentPlans,
  visits,
  onNavigate,
  selfAssessments = {}
}) => {
  const producerSummaries = useMemo(() => {
    return producers.map(producer => {
      const producerAlerts = alerts.filter(alert => alert.producerId === producer.id);
      const activeAlerts = producerAlerts.filter(alert => alert.status !== 'completed');
      const criticalAlerts = producerAlerts.filter(
        alert => (alert.priority || '').toLowerCase() === 'alta'
      );

      const producerTasks = tasks.filter(task => task.producerId === producer.id);
      const completedTasks = producerTasks.filter(task => task.status === 'completed');
      const completionRate = producerTasks.length
        ? Math.round((completedTasks.length / producerTasks.length) * 100)
        : 100;

      const producerPlans = containmentPlans.filter(
        plan => plan.producerId === producer.id && plan.status !== 'completed'
      );

      const producerWorkers = workers.filter(worker => worker.producerId === producer.id);
      const workerRisk = producerWorkers.reduce(
        (acc, worker) => {
          const meta = LABOR_RISK_META[worker.labor] || { label: worker.labor, risk: 'low' };
          acc[meta.risk] = (acc[meta.risk] || 0) + 1;
          return acc;
        },
        { high: 0, medium: 0, low: 0 }
      );

      const pendingVisits = visits.filter(
        visit => visit.producerId === producer.id && visit.status === 'PENDING'
      );

      const hasCriticalDisease = producerAlerts.some(alert =>
        (alert.possibleDisease || []).some(disease =>
          ['moko', 'fusarium', 'foc', 'erwinia'].some(keyword =>
            disease.toLowerCase().includes(keyword)
          )
        )
      );

      const climateRisk = hasCriticalDisease ? 'high' : producerPlans.length > 0 ? 'medium' : 'low';

      const selfCheck = selfAssessments[producer.id];
      const selfCheckTone = selfCheck?.status?.tone || 'pending';
      const selfCheckLabel = selfCheck?.status?.label || 'Pendiente';
      const selfCheckDetail = selfCheck?.focusAreas?.[0]?.text || (selfCheck?.savedAt ? 'Sin brechas críticas' : 'Sin autoevaluación');

      const riskScore =
        activeAlerts.length * 2 +
        criticalAlerts.length * 3 +
        RISK_SCORE[climateRisk] +
        workerRisk.high * 0.5 +
        (completionRate < 60 ? 2 : completionRate < 80 ? 1 : 0);

      const riskLevel = riskScore >= 6 ? 'high' : riskScore >= 3 ? 'medium' : 'low';

      const focusPoints = [];
      if (criticalAlerts.length > 0) focusPoints.push('Alertas críticas');
      if (completionRate < 70) focusPoints.push('Bajo avance en acciones');
      if (climateRisk === 'high') focusPoints.push('Riesgo fitosanitario');
      if (pendingVisits.length > 0) focusPoints.push('Visitas pendientes');
      if (workerRisk.high > 0) focusPoints.push('Labores de alto riesgo');

      return {
        id: producer.id,
        owner: producer.owner,
        fincas: producer.fincas.length,
        completionRate,
        activeAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
        activePlans: producerPlans.length,
        workerCount: producerWorkers.length,
        workerRisk,
        pendingVisits: pendingVisits.length,
        climateRisk,
        riskLevel,
        riskScore,
        focusPoints,
        selfCheck: {
          label: selfCheckLabel,
          tone: selfCheckTone,
          detail: selfCheck?.savedAt
            ? new Date(selfCheck.savedAt).toLocaleDateString()
            : 'Aún no realizada',
          focus: selfCheckDetail
        }
      };
    });
  }, [producers, alerts, tasks, workers, containmentPlans, visits, selfAssessments]);

  const heroStats = useMemo(() => {
    const totalProducers = producerSummaries.length;
    const avgCompliance = totalProducers
      ? Math.round(
          producerSummaries.reduce((acc, summary) => acc + summary.completionRate, 0) /
            totalProducers
        )
      : 0;
    const lowRiskProducers = producerSummaries.filter(summary => summary.riskLevel === 'low');
    const riskFree = producerSummaries.filter(summary => summary.activeAlerts === 0);
    const completedSelfChecks = producerSummaries.filter(
      summary => summary.selfCheck && summary.selfCheck.tone !== 'pending'
    ).length;
    const pendingSelfChecks = totalProducers - completedSelfChecks;

    return [
      {
        icon: ClipboardCheck,
        label: 'Autoevaluaciones',
        value: `${completedSelfChecks}/${totalProducers}`,
        detail: `${pendingSelfChecks} pendientes`
      },
      {
        icon: ShieldCheck,
        label: 'Productores monitoreados',
        value: totalProducers,
        detail: `${lowRiskProducers.length} en verde`
      },
      {
        icon: TrendingUp,
        label: 'Cumplimiento promedio',
        value: `${avgCompliance}%`,
        detail: 'Acciones correctivas'
      },
      {
        icon: AlertTriangle,
        label: 'Sin alertas activas',
        value: riskFree.length,
        detail: 'Operación estable'
      },
      {
        icon: Users,
        label: 'Trabajadores registrados',
        value: workers.length,
        detail: `${producerSummaries.reduce((acc, summary) => acc + summary.workerRisk.high, 0)} en labores críticas`
      }
    ];
  }, [producerSummaries, workers.length]);

  const workerOverview = useMemo(() => {
    const totals = { high: 0, medium: 0, low: 0 };
    const laborCount = {};

    workers.forEach(worker => {
      const meta = LABOR_RISK_META[worker.labor] || {
        label: worker.labor?.replace(/_/g, ' ') || 'Otra labor',
        risk: 'low'
      };
      totals[meta.risk] = (totals[meta.risk] || 0) + 1;
      const label = meta.label;
      laborCount[label] = (laborCount[label] || 0) + 1;
    });

    const topLabors = Object.entries(laborCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, count]) => ({ label, count }));

    return { totals, topLabors };
  }, [workers]);

  const producersNeedingAttention = useMemo(() => {
    return producerSummaries
      .filter(summary => summary.riskLevel !== 'low')
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3);
  }, [producerSummaries]);

  const topPerformers = useMemo(() => {
    return [...producerSummaries]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3);
  }, [producerSummaries]);

  return (
    <div className="producerControlCenter">
      <section className="producerControlCenter__hero">
        <div className="producerControlCenter__heroPattern" aria-hidden="true" />
        <div className="producerControlCenter__heroContent">
          <div>
            <span className="producerControlCenter__eyebrow">Centro de control</span>
            <h1>Salud operacional de productores</h1>
            <p>
              Identifica quién mantiene protocolos al día, quién requiere refuerzos de bioseguridad
              y dónde asignar técnicos o recursos de apoyo.
            </p>
          </div>
          <div className="producerControlCenter__heroStats">
            {heroStats.map(({ icon: Icon, label, value, detail }) => (
              <article key={label} className="producerControlCenter__statCard">
                <div className="producerControlCenter__statIcon">
                  <Icon size={18} />
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
      </section>

      <section className="producerControlCenter__section">
        <header className="producerControlCenter__sectionHeader">
          <div>
            <p>Comparativo ejecutivo</p>
            <h2>Estado de productores</h2>
          </div>
          <button
            type="button"
            className="producerControlCenter__link"
            onClick={() => onNavigate('alertTriage')}
          >
            Ver alertas <ArrowRight size={16} />
          </button>
        </header>
        <div className="producerControlCenter__tableWrapper">
          <table className="producerControlCenter__table">
            <thead>
              <tr>
                <th>Productor</th>
                <th>Riesgo</th>
                <th>Alertas</th>
                <th>Acciones</th>
                <th>Autoevaluación</th>
                <th>Planes</th>
                <th>Clima / Enfermedad</th>
                <th>Equipo</th>
              </tr>
            </thead>
            <tbody>
              {producerSummaries.map(summary => (
                <tr key={summary.id}>
                  <td>
                    <div className="producerCell">
                      <strong>{summary.owner}</strong>
                      <span>{summary.fincas} fincas</span>
                    </div>
                  </td>
                  <td>
                    <span className={`riskBadge riskBadge--${summary.riskLevel}`}>
                      {summary.riskLevel === 'high'
                        ? 'Alto'
                        : summary.riskLevel === 'medium'
                          ? 'Medio'
                          : 'Bajo'}
                    </span>
                  </td>
                  <td>
                    <div className="metricColumn">
                      <strong>{summary.activeAlerts}</strong>
                      <small>{summary.criticalAlerts} críticas</small>
                    </div>
                  </td>
                  <td>
                    <div className="metricColumn">
                      <strong>{summary.completionRate}%</strong>
                      <small>Plan correctivo</small>
                    </div>
                  </td>
                  <td>
                    <div className="metricColumn">
                      <span className={`selfcheckBadge selfcheckBadge--${summary.selfCheck.tone}`}>
                        <span className={`selfcheckDot dot-${summary.selfCheck.tone}`} />
                        {summary.selfCheck.label}
                      </span>
                      <small>{summary.selfCheck.detail}</small>
                      {summary.selfCheck.focus && (
                        <small className="selfcheckFocus">{summary.selfCheck.focus}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="metricColumn">
                      <strong>{summary.activePlans}</strong>
                      <small>Contención activa</small>
                    </div>
                  </td>
                  <td>
                    <div className="metricColumn">
                      <strong>
                        {summary.climateRisk === 'high'
                          ? 'Alto'
                          : summary.climateRisk === 'medium'
                            ? 'Medio'
                            : 'Bajo'}
                      </strong>
                      <small>
                        {summary.focusPoints.length > 0
                          ? summary.focusPoints[0]
                          : 'Sin novedades'}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="metricColumn">
                      <strong>{summary.workerCount}</strong>
                      <small>{summary.workerRisk.high} en alto riesgo</small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="producerControlCenter__grid">
        <div className="producerControlCenter__panel">
          <header>
            <div>
              <p>Labores expuestas</p>
              <h3>Riesgo del personal operativo</h3>
            </div>
            <Activity size={18} />
          </header>
          <div className="producerControlCenter__riskBars">
            {['high', 'medium', 'low'].map(level => (
              <div key={level}>
                <div className="riskBarHeader">
                  <span>
                    {level === 'high' ? 'Alto' : level === 'medium' ? 'Medio' : 'Bajo'} riesgo
                  </span>
                  <strong>{workerOverview.totals[level] || 0}</strong>
                </div>
                <div className="riskBarTrack">
                  <div
                    className={`riskBarFill riskBarFill--${level}`}
                    style={{
                      width: workers.length
                        ? `${((workerOverview.totals[level] || 0) / workers.length) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <ul className="producerControlCenter__list">
            {workerOverview.topLabors.map(item => (
              <li key={item.label}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="producerControlCenter__panel">
          <header>
            <div>
              <p>Prioridades inmediatas</p>
              <h3>Productores a reforzar</h3>
            </div>
            <ThermometerSun size={18} />
          </header>
          <ul className="producerControlCenter__list">
            {producersNeedingAttention.length === 0 && (
              <li className="producerControlCenter__empty">Todos los productores están bajo control.</li>
            )}
            {producersNeedingAttention.map(item => (
              <li key={item.id}>
                <div>
                  <span>{item.owner}</span>
                  <small>{item.focusPoints.slice(0, 2).join(' · ') || 'Monitoreo constante'}</small>
                </div>
                <button
                  type="button"
                  className="producerControlCenter__chip"
                  onClick={() => onNavigate('alertTriage', { producerId: item.id })}
                >
                  Revisar
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="producerControlCenter__panel">
          <header>
            <div>
              <p>Mejores prácticas</p>
              <h3>Productores consistentes</h3>
            </div>
            <Award size={18} />
          </header>
          <ul className="producerControlCenter__list">
            {topPerformers.map(item => (
              <li key={item.id}>
                <div>
                  <span>{item.owner}</span>
                  <small>{item.completionRate}% de acciones completadas</small>
                </div>
                <span className="producerControlCenter__tag">
                  {item.activeAlerts === 0 ? 'Sin alertas' : `${item.activeAlerts} alertas`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default ProducerControlCenter;
