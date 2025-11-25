// En: src/views/ProducerProfile/ProducerProfile.jsx
// --- ARCHIVO COMPLETO CON DISEÑO CORREGIDO ---

import React, { useMemo, useState } from 'react';
import Icon from '../../components/ui/Icon';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ICONS } from '../../config/icons';
import './ProducerProfile.css';

/**
 * Vista de Perfil del Productor (Mis Fincas)
 */
const sortOptions = [
  { value: 'size', label: 'Hectáreas (mayor a menor)' },
  { value: 'lots', label: 'Número de lotes' },
  { value: 'name', label: 'Nombre (A-Z)' },
];

const sizeFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'large', label: 'Gran escala' },
  { value: 'medium', label: 'Medianas' },
  { value: 'small', label: 'Pequeñas' },
];

const getSizeMeta = (hectares = 0) => {
  if (hectares >= 110) {
    return { key: 'large', label: 'Gran escala', tone: 'high' };
  }
  if (hectares >= 70) {
    return { key: 'medium', label: 'Mediana', tone: 'medium' };
  }
  return { key: 'small', label: 'Pequeña', tone: 'low' };
};

const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined) return '—';
  const formatter = new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 1,
    ...options,
  });
  return formatter.format(value);
};

const ProducerProfile = ({ producer, onNavigate, onEditFinca }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('size');
  const [sizeFilter, setSizeFilter] = useState('all');

  // --- CORRECCIÓN DE HOOKS ---
  // Todos los Hooks deben llamarse en el nivel superior, antes de cualquier 'return'.

  const fincas = useMemo(() => {
    // Usamos optional chaining (?.) para manejar el caso donde 'producer' es null
    return (producer?.fincas || []).map(finca => {
      const lotes = Array.isArray(finca.lotes) ? finca.lotes : [];
      const hectares = Number(finca.hectares) || 0;
      const sizeMeta = getSizeMeta(hectares);
      return {
        ...finca,
        hectares,
        lotes,
        lotCount: lotes.length,
        sizeMeta,
      };
    });
  }, [producer]);

  const summary = useMemo(() => {
    // Esta lógica ya es segura porque 'fincas' será un array vacío si 'producer' es null
    if (fincas.length === 0) {
      return {
        totalHectares: 0,
        totalLotes: 0,
        averageLotSize: null,
        largestFinca: null,
        mediumOrLargeCount: 0,
      };
    }

    const totalHectares = fincas.reduce((acc, finca) => acc + finca.hectares, 0);
    const totalLotes = fincas.reduce((acc, finca) => acc + finca.lotCount, 0);
    const largestFinca = fincas.reduce((current, finca) => {
      if (!current) return finca;
      return finca.hectares > current.hectares ? finca : current;
    }, null);

    const mediumOrLargeCount = fincas.filter(finca => finca.sizeMeta.key !== 'small').length;

    return {
      totalHectares,
      totalLotes,
      averageLotSize: totalLotes > 0 ? totalHectares / totalLotes : null,
      largestFinca,
      mediumOrLargeCount,
    };
  }, [fincas]);

  const filteredFincas = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    // Esta lógica también es segura
    let list = fincas.filter(finca => {
      if (!normalizedQuery) return true;
      return finca.name.toLowerCase().includes(normalizedQuery);
    });

    if (sizeFilter !== 'all') {
      list = list.filter(finca => finca.sizeMeta.key === sizeFilter);
    }

    const sortedList = [...list];
    switch (sortBy) {
      case 'name':
        sortedList.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
      case 'lots':
        sortedList.sort((a, b) => b.lotCount - a.lotCount);
        break;
      case 'size':
      default:
        sortedList.sort((a, b) => b.hectares - a.hectares);
        break;
    }

    return sortedList;
  }, [fincas, searchQuery, sizeFilter, sortBy]);


  // El 'return' condicional AHORA se mueve DESPUÉS de todas las llamadas a Hooks.
  if (!producer) {
    return <LoadingSpinner message="Cargando perfil del productor..." />;
  }
  
  const hasFincas = fincas.length > 0;
  const hasResults = filteredFincas.length > 0;

  return (
    <div className="producer-profile">
      <section className="producer-profile__hero">
        <div className="producer-profile__hero-content">
          <span className="producer-profile__breadcrumb">Perfil del productor</span>
          <h1 className="producer-profile__title">Mis fincas</h1>
          <p className="producer-profile__description">
            Gestiona la información de tus predios, registra nuevas propiedades y mantén actualizada la ubicación de cada lote.
          </p>
          <div className="producer-profile__hero-meta">
            <div className="producer-profile__meta-item">
              <Icon path={ICONS.user} size={18} />
              <span>{producer.owner}</span>
            </div>
            <div className="producer-profile__meta-item">
              <Icon path={ICONS.location} size={18} />
              <span>{formatNumber(summary.totalHectares)} ha totales</span>
            </div>
            <div className="producer-profile__meta-item">
              <Icon path={ICONS.tasks} size={18} />
              <span>{summary.totalLotes} lotes registrados</span>
            </div>
          </div>
        </div>
        <div className="producer-profile__hero-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => onNavigate('producerDashboard')}
          >
            <Icon path={ICONS.dashboard} size={18} /> Ir al tablero
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => onNavigate('producerClimateLab')}
          >
            <Icon path={ICONS.thermometer} size={18} /> Laboratorio climático
          </button>
          <button
            type="button"
            className="button btn-primary"
            onClick={() => onNavigate('fincaRegistration')}
          >
            <Icon path={ICONS.report} size={18} /> Registrar nueva finca
          </button>
        </div>
      </section>

      <section className="producer-profile__metrics">
        <article className="producer-profile__metric-card">
          <div className="producer-profile__metric-icon">
            <Icon path={ICONS.users} size={20} />
          </div>
          <div className="producer-profile__metric-content">
            <span className="producer-profile__metric-label">Fincas activas</span>
            <strong className="producer-profile__metric-value">{fincas.length}</strong>
            <p className="producer-profile__metric-foot">{summary.mediumOrLargeCount} con potencial de expansión</p>
          </div>
        </article>
        <article className="producer-profile__metric-card">
          <div className="producer-profile__metric-icon">
            <Icon path={ICONS.location} size={20} />
          </div>
          <div className="producer-profile__metric-content">
            <span className="producer-profile__metric-label">Hectáreas totales</span>
            <strong className="producer-profile__metric-value">{formatNumber(summary.totalHectares)}</strong>
            <p className="producer-profile__metric-foot">Incluye superficies productivas y de reserva</p>
          </div>
        </article>
        <article className="producer-profile__metric-card">
          <div className="producer-profile__metric-icon">
            <Icon path={ICONS.tasks} size={20} />
          </div>
          <div className="producer-profile__metric-content">
            <span className="producer-profile__metric-label">Lotes registrados</span>
            <strong className="producer-profile__metric-value">{summary.totalLotes}</strong>
            <p className="producer-profile__metric-foot">Promedio por finca: {formatNumber(summary.averageLotSize)} ha</p>
          </div>
        </article>
        <article className="producer-profile__metric-card">
          <div className="producer-profile__metric-icon">
            <Icon path={ICONS.priority} size={20} />
          </div>
          <div className="producer-profile__metric-content">
            <span className="producer-profile__metric-label">Finca destacada</span>
            <strong className="producer-profile__metric-value">
              {summary.largestFinca ? summary.largestFinca.name : 'Sin registros'}
            </strong>
            <p className="producer-profile__metric-foot">
              {summary.largestFinca ? `${formatNumber(summary.largestFinca.hectares)} ha` : 'Registra tu primera finca'}
            </p>
          </div>
        </article>
      </section>

      <div className="producer-profile__layout">
        <div className="producer-profile__main">
          {hasFincas && (
            <div className="producer-profile__toolbar">
              <div className="producer-profile__search">
                <Icon path={ICONS.filter} size={18} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Buscar finca por nombre"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="producer-profile__clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="producer-profile__filters">
                <div className="producer-profile__chips" role="group" aria-label="Filtrar por tamaño de finca">
                  {sizeFilters.map(filter => (
                    <button
                      key={filter.value}
                      type="button"
                      className={`producer-profile__chip ${sizeFilter === filter.value ? 'is-active' : ''}`}
                      onClick={() => setSizeFilter(filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <label className="producer-profile__sort">
                  <span>Ordenar por</span>
                  <div className="producer-profile__select-wrapper">
                    <Icon path={ICONS.menu} size={16} aria-hidden="true" />
                    <select value={sortBy} onChange={event => setSortBy(event.target.value)}>
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
            </div>
          )}

          {!hasFincas && (
            <div className="producer-profile__empty-state">
              <Icon path={ICONS.info} size={48} />
              <h2>Empieza registrando tu primera finca</h2>
              <p>
                Aún no tienes propiedades asociadas. Utiliza el botón "Registrar nueva finca" para comenzar a documentar tu información productiva.
              </p>
            </div>
          )}

          {hasFincas && !hasResults && (
            <div className="producer-profile__empty-state producer-profile__empty-state--muted">
              <Icon path={ICONS.filter} size={44} />
              <h2>No encontramos coincidencias</h2>
              <p>Prueba con otro nombre o reinicia los filtros para ver todas tus fincas nuevamente.</p>
              <button type="button" className="button button-secondary" onClick={() => {
                setSearchQuery('');
                setSizeFilter('all');
                setSortBy('size');
              }}>
                Restablecer filtros
              </button>
            </div>
          )}

          {hasResults && (
            <div className="producer-profile__finca-grid">
              {filteredFincas.map(finca => {
                const isHighlighted = summary.largestFinca && summary.largestFinca.id === finca.id;
                const extraLotes = finca.lotCount > 5 ? finca.lotCount - 5 : 0;
                return (
                  <article
                    key={finca.id}
                    className={`producer-profile__finca-card ${isHighlighted ? 'producer-profile__finca-card--highlight' : ''}`}
                  >
                    <header className="producer-profile__finca-header">
                      <div className="producer-profile__finca-titles">
                        <h3>{finca.name}</h3>
                        <div className={`producer-profile__finca-badge producer-profile__finca-badge--${finca.sizeMeta.tone}`}>
                          {finca.sizeMeta.label}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="button button-secondary button-small"
                        onClick={() => onEditFinca(finca.id)}
                      >
                        <Icon path={ICONS.audit} size={14} /> Editar ficha
                      </button>
                    </header>

                    <div className="producer-profile__finca-metrics">
                      <div>
                        <span className="producer-profile__metric-tag">Hectáreas</span>
                        <strong>{formatNumber(finca.hectares, { maximumFractionDigits: 0 })} ha</strong>
                      </div>
                      <div>
                        <span className="producer-profile__metric-tag">Lotes</span>
                        <strong>{finca.lotCount}</strong>
                      </div>
                      {finca.location && (
                        <div>
                          <span className="producer-profile__metric-tag">Ubicación</span>
                          <strong>
                            Lat {finca.location.lat.toFixed(3)}, Lon {finca.location.lon.toFixed(3)}
                          </strong>
                        </div>
                      )}
                    </div>

                    {finca.lotCount > 0 && (
                      <div className="producer-profile__lotes">
                        {finca.lotes.slice(0, 5).map(lote => (
                          <span key={lote} className="producer-profile__lote-pill">
                            {lote}
                          </span>
                        ))}
                        {extraLotes > 0 && (
                          <span className="producer-profile__lote-pill producer-profile__lote-pill--more">
                            +{extraLotes} más
                          </span>
                        )}
                      </div>
                    )}

                    <footer className="producer-profile__finca-footer">
                      <div className="producer-profile__footer-hint">
                        <Icon path={ICONS.info} size={16} />
                        <span>
                          {isHighlighted
                            ? 'Esta es tu finca con mayor superficie registrada.'
                            : 'Mantén actualizados los datos de hectáreas y lotes para reportes precisos.'}
                        </span>
                      </div>
                      <div className="producer-profile__footer-actions">
                        <button
                          type="button"
                          className="button button-secondary button-small"
                          onClick={() => onNavigate('containmentPlans')}
                        >
                          <Icon path={ICONS.action} size={14} /> Ver planes
                        </button>
                        <button
                          type="button"
                          className="button btn-primary button-small"
                          onClick={() => onNavigate('producerTasks')}
                        >
                          <Icon path={ICONS.tasks} size={14} /> Revisar tareas
                        </button>
                      </div>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="producer-profile__aside">
          <div className="producer-profile__aside-card">
            <h2>Resumen ejecutivo</h2>
            <ul>
              <li>
                <Icon path={ICONS.checkCircle} size={16} />
                {fincas.length} fincas activas con {summary.totalLotes} lotes documentados.
              </li>
              <li>
                <Icon path={ICONS.time} size={16} />
                Actualiza la georreferenciación al menos una vez por trimestre para mantener la trazabilidad.
              </li>
              <li>
                <Icon path={ICONS.training} size={16} />
                Vincula a tus colaboradores para registrar quiénes operan en cada lote.
              </li>
            </ul>
          </div>

          <div className="producer-profile__aside-card producer-profile__aside-card--accent">
            <h3>Consejos de mantenimiento</h3>
            <div className="producer-profile__tip">
              <Icon path={ICONS.reload} size={18} />
              <div>
                <strong>Sincroniza con alertas</strong>
                <p>Revisa periódicamente tus planes de contención para mantener alineadas las acciones por finca.</p>
              </div>
            </div>
            <div className="producer-profile__tip">
              <Icon path={ICONS.disease} size={18} />
              <div>
                <strong>Monitoreo fitosanitario</strong>
                <p>Documenta síntomas detectados por lote para facilitar la asignación de técnicos.</p>
              </div>
            </div>
          </div>

          <div className="producer-profile__aside-card producer-profile__aside-card--outline">
            <h3>Próximos pasos sugeridos</h3>
            <ol>
              <li>Registrar fotografías recientes de la finca destacada.</li>
              <li>Invitar a tu equipo a revisar el tablero de tareas pendientes.</li>
              <li>Actualizar la información de lotes antes de la próxima visita técnica.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProducerProfile;
