// En: src/views/ProducerCertification/ProducerCertification.jsx
// --- ARCHIVO COMPLETO CON HEADER FUSIONADO ---

import React, { useMemo, useState } from 'react';
import Icon from '../../components/ui/Icon';
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar';
import { ICONS } from '../../config/icons';
import { MOCK_INSPECTION_MODULES } from '../../data/mockData';
import './ProducerCertification.css';

const formatHistoryDate = (dateString) => {
  if (!dateString) return 'Sin registro';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const ProducerCertification = ({ certificationHistory }) => {
  const [expandedId, setExpandedId] = useState(null);
  const currentStatus = certificationHistory[0];

  const totalScore = currentStatus.averageScore;
  const isCertified = totalScore >= 90;

  const moduleScores = useMemo(
    () =>
      MOCK_INSPECTION_MODULES.map((module) => ({
        id: module.id,
        name: module.name,
        score: currentStatus.breakdown[module.name] || 0,
      })),
    [currentStatus.breakdown]
  );

  const modulesAboveThreshold = moduleScores.filter((module) => module.score >= 90).length;

  const heroMetrics = [
    {
      key: 'average',
      label: 'Promedio actual',
      value: `${totalScore}%`,
      detail: isCertified ? 'Listo para renovar el sello' : 'Necesitas superar el 90%',
    },
    {
      key: 'modules',
      label: 'Módulos al 90%',
      value: `${modulesAboveThreshold}/${moduleScores.length}`,
      detail: 'Cumplidos por encima del umbral',
    },
    {
      key: 'last',
      label: 'Última auditoría',
      value: formatHistoryDate(currentStatus.date),
      detail: 'Consulta el historial para comparar',
    },
  ];

  const toggleHistory = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="producerCertificationPage">
      <section className={`certHero ${isCertified ? 'certHero-certified' : 'certHero-pending'}`}>
        <div className="certHero-top">
          <div className="certHero-badge">
            <Icon path={ICONS.certification} size={32} />
          </div>
          <div className="certHero-copy">
            <p className="certHero-eyebrow">Certificación interna</p>
            <h1 className="certHero-title">
              {isCertified ? '¡Sello AgroAliados vigente!' : 'Proceso de certificación en curso'}
            </h1>
            <p className="certHero-description">
              {isCertified
                ? 'Tu finca mantiene el estándar de bioseguridad requerido para exportación.'
                : 'Aún falta elevar algunos módulos críticos para obtener el sello.'}
            </p>
          </div>
          <div className="certHero-score">
            <span>Promedio</span>
            <strong>{totalScore}%</strong>
          </div>
        </div>
        <div className="certHero-metrics">
          {heroMetrics.map((stat) => (
            <article key={stat.key} className="certMetricCard">
              <span className="metric-label">{stat.label}</span>
              <span className="metric-value">{stat.value}</span>
              <p>{stat.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="certModules">
        <header className="certModules-header">
          <div>
            <p className="certModules-eyebrow">Módulos evaluados</p>
            <h2>Desglose actual</h2>
            <p>Conoce el puntaje de cada módulo auditado durante la última inspección.</p>
          </div>
        </header>
        <div className="progressGrid moduleGrid">
          {moduleScores.map((module) => (
            <ProgressBar key={module.id} label={`${module.id}. ${module.name}`} score={module.score} />
          ))}
        </div>
      </section>

      <section className="certHistorySection">
        <div className="certHistoryHeader">
          <div>
            <p className="certModules-eyebrow">Seguimiento</p>
            <h2>Historial de revisiones</h2>
            <p>Haz clic en cada tarjeta para comparar los resultados de visitas anteriores.</p>
          </div>
        </div>
        <div className="historyList">
          {certificationHistory.map((historyItem) => {
            const isExpanded = expandedId === historyItem.id;
            return (
              <article key={historyItem.id} className={`historyCard ${isExpanded ? 'open' : ''}`}>
                <button
                  className="historyCard-header"
                  onClick={() => toggleHistory(historyItem.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="historyCard-info">
                    <span className="history-date">{formatHistoryDate(historyItem.date)}</span>
                    <span className="history-score">
                      Promedio <strong>{historyItem.averageScore}%</strong>
                    </span>
                  </div>
                  <div className="historyCard-actions">
                    <span className={`tag ${historyItem.status === 'Aprobado' ? 'tag-aprobado' : 'tag-no-aprobado'}`}>
                      {historyItem.status}
                    </span>
                    <Icon
                      path={ICONS.chevronDown}
                      size={16}
                      className={`historyCtaIcon ${isExpanded ? 'expanded' : ''}`}
                    />
                  </div>
                </button>
                <div className={`historyBreakdown ${isExpanded ? 'expanded' : ''}`}>
                  <div className="progressGrid moduleGrid">
                    {MOCK_INSPECTION_MODULES.map((module) => (
                      <ProgressBar
                        key={module.id}
                        label={`${module.id}. ${module.name}`}
                        score={historyItem.breakdown[module.name] || 0}
                      />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ProducerCertification;
