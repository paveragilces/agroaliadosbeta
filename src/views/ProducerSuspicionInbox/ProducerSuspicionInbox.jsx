import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, MapPin, User, ShieldQuestion, Archive } from 'lucide-react';
import './ProducerSuspicionInbox.css';

const statusMeta = {
  pending: { label: 'Pendiente', className: 'badge-pending', icon: Clock },
  converted: { label: 'Convertida', className: 'badge-converted', icon: CheckCircle2 },
  dismissed: { label: 'Descartada', className: 'badge-dismissed', icon: Archive }
};

const ProducerSuspicionInbox = ({ producer, suspicions = [], workers = [], onConvertSuspicion, onDismissSuspicion, onNavigate }) => {
  const suspicionsWithMeta = useMemo(() => {
    return suspicions.map(item => {
      const worker = workers.find(w => w.id === item.workerId);
      return {
        ...item,
        workerName: worker?.name || item.workerName || 'Trabajador',
        fincaName: producer?.fincas?.find(f => f.id === item.fincaId)?.name || 'Finca',
      };
    });
  }, [suspicions, workers, producer]);

  const pendingCount = suspicionsWithMeta.filter(s => s.status === 'pending').length;

  return (
    <div className="suspicion-page container">
      <section className="surface-card suspicion-hero">
        <div className="hero-text">
          <p className="hero-eyebrow">Productor</p>
          <h1 className="h1">Sospechas reportadas</h1>
          <p className="muted">Revisa lo que encontraron los trabajadores y decide si convertirlo en alerta.</p>
        </div>
        <div className="hero-chips">
          <div className="hero-chip">
            <span className="chip-label">Pendientes</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="hero-chip">
            <span className="chip-label">Total</span>
            <strong>{suspicionsWithMeta.length}</strong>
          </div>
        </div>
      </section>

      <section className="surface-card suspicion-list-card">
        <div className="list-header">
          <div>
            <p className="list-eyebrow">Inbox</p>
            <h2 className="h2">Reporte de sospechas</h2>
          </div>
        </div>

        {suspicionsWithMeta.length === 0 ? (
          <div className="emptyState mini">
            <ShieldQuestion size={40} color="#94a3b8" />
            <p>Sin sospechas por ahora.</p>
          </div>
        ) : (
          <div className="suspicion-list">
            {suspicionsWithMeta.map(item => {
              const meta = statusMeta[item.status] || statusMeta.pending;
              const Icon = meta.icon;
              return (
                <article key={item.id} className={`suspicion-card surface-card ${item.status}`}>
                  <header className="suspicion-card__header">
                    <div className={`badge ${meta.className}`}>
                      <Icon size={16} /> {meta.label}
                    </div>
                    <span className="date">{new Date(item.createdAt).toLocaleString()}</span>
                  </header>
                  <div className="suspicion-card__body">
                    <div className="type-row">
                      <AlertTriangle size={16} />
                      <p className="type">{item.type}</p>
                    </div>
                    <p className="note">{item.note || 'Sin nota adicional.'}</p>
                    {item.count && (
                      <p className="count">Cantidad aproximada: {item.count}</p>
                    )}
                    <div className="meta">
                      <span><User size={14} /> {item.workerName}</span>
                      <span><MapPin size={14} /> {item.fincaName}{item.lote ? ` · ${item.lote}` : ''}</span>
                    </div>
                  </div>
                  <footer className="suspicion-card__actions">
                    {item.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => onDismissSuspicion?.(item.id)}
                        >
                          Descartar
                        </button>
                        <button
                          type="button"
                          className="button btn-primary"
                          onClick={() => onConvertSuspicion?.(item.id)}
                        >
                          <AlertTriangle size={16} /> Convertir en alerta
                        </button>
                      </>
                    ) : item.status === 'converted' && item.alertId ? (
                      <span className="converted-text">Creada alerta #{item.alertId}</span>
                    ) : (
                      <span className="converted-text">Sin acciones adicionales</span>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProducerSuspicionInbox;
