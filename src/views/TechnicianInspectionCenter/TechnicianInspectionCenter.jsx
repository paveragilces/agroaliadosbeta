import React, { useMemo, useState } from 'react';
import Icon from '../../components/ui/Icon';
import InspectionStepper from '../../components/ui/InspectionStepper';
import { ICONS } from '../../config/icons';
import { CalendarDays, MapPin, AlertTriangle, ClipboardCheck } from 'lucide-react';
import TechnicianModuleAudit from './TechnicianModuleAudit';
import TechnicianModuleDrone from './TechnicianModuleDrone';
import TechnicianModulePlant from './TechnicianModulePlant';
import './TechnicianInspectionCenter.css';

/**
 * Centro de Inspección (Técnico, con Stepper)
 */
const TechnicianInspectionCenter = ({ alert, onNavigate, onSaveInspection, setModal }) => {
  const [inspectionData, setInspectionData] = useState(
    alert.inspectionData || {
      audit: { status: 'Pendiente', ratings: {}, evidence: {} },
      drone: { status: 'Pendiente', data: { altitude: '', plan: 'libre', hectares: '', observations: '' } },
      plant: { status: 'Pendiente', data: { diagnosis: [], actions: [], incidence: 0, severity: 0, recommendations: '' } },
    }
  );

  const [currentModule, setCurrentModule] = useState(null); // 'audit', 'drone', 'plant'

  const handleSaveModule = (moduleKey, moduleData) => {
    const updatedData = {
      ...inspectionData,
      [moduleKey]: {
        ...inspectionData[moduleKey],
        ...moduleData,
        status: 'Completado',
      }
    };
    setInspectionData(updatedData);
    onSaveInspection(alert.id, updatedData);
    setCurrentModule(null);
    setModal({ show: true, message: `Módulo "${moduleKey}" guardado con éxito.`, type: 'success' });
  };

  const handleFinalizeInspection = () => {
    if (inspectionData.audit.status !== 'Completado' || inspectionData.plant.status !== 'Completado') {
      setModal({ show: true, message: 'Debe completar la "Auditoría de Bioseguridad" y la "Inspección de Planta" para finalizar.', type: 'error' });
      return;
    }
    onSaveInspection(alert.id, inspectionData, true); // true = finalizar
  };

  // ----- Vistas de Módulos -----

  // Vista 1: Centro de Inspección (Dashboard)
  if (!currentModule) {
    const moduleCards = [
      {
        key: 'audit',
        title: 'Auditoría de Bioseguridad',
        description: 'Checklist de ingreso, registros y limpieza.',
        optional: false,
        icon: ICONS.audit
      },
      {
        key: 'drone',
        title: 'Reporte de vuelo drone',
        description: 'Cobertura aérea opcional para validar lotes.',
        optional: true,
        icon: ICONS.drone
      },
      {
        key: 'plant',
        title: 'Inspección de planta (diagnóstico)',
        description: 'Incidencia, severidad y acciones correctivas.',
        optional: false,
        icon: ICONS.plant
      }
    ];

    const completedRequired = ['audit', 'plant'].filter(
      key => inspectionData[key]?.status === 'Completado'
    ).length;
    const progress = Math.round((completedRequired / 2) * 100);

    const metaInfo = [
      {
        label: 'Fecha de visita',
        value: alert.visitDate
          ? new Date(alert.visitDate).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short'
            })
          : 'Sin asignar',
        icon: CalendarDays
      },
      {
        label: 'Lote',
        value: alert.lote || 'No especificado',
        icon: MapPin
      },
      {
        label: 'Prioridad',
        value: alert.priority || 'Sin definir',
        icon: AlertTriangle
      },
      {
        label: 'Alertas cerradas',
        value: `${completedRequired}/2 módulos obligatorios`,
        icon: ClipboardCheck
      }
    ];

    return (
      <div className="inspectionCenter">
        <div className="inspectionCenter__hero">
          <button className="ghostButton" onClick={() => onNavigate('technicianSchedule')}>
            <Icon path={ICONS.back} /> Volver a la agenda
          </button>
          <div>
            <span>Inspección activa</span>
            <h1>{alert.farmName}</h1>
            <p>
              Alerta #{alert.id} · productor {alert.producerName || 'sin registro'}
            </p>
          </div>
          <div className="inspectionCenter__progress">
            <span>{progress}% completado</span>
            <div className="progressBar">
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <InspectionStepper currentModule={null} modules={inspectionData} />

        <section className="inspectionCenter__meta">
          {metaInfo.map(item => {
            const IconMeta = item.icon;
            return (
              <article key={item.label}>
                <div className="inspectionCenter__metaIcon">
                  <IconMeta size={16} />
                </div>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </article>
            );
          })}
        </section>

        <section className="inspectionCenter__modules">
          <header>
            <div>
              <h2>Checklist de módulos</h2>
              <p>Completa los módulos obligatorios antes de cerrar la inspección.</p>
            </div>
            <span className="inspectionCenter__chip">
              {moduleCards.filter(card => inspectionData[card.key]?.status === 'Completado').length}/
              {moduleCards.length}
              &nbsp;finalizados
            </span>
          </header>
          <div className="moduleGrid">
            {moduleCards.map((card, index) => {
              const status = inspectionData[card.key]?.status || 'Pendiente';
              return (
                <article key={card.key} className={`moduleCard moduleCard--${status.toLowerCase()}`}>
                  <div className="moduleCard__icon">
                    <Icon path={card.icon} size={22} color="#0f6b46" />
                  </div>
                  <div className="moduleCard__body">
                    <div className="moduleCard__title">
                      <span>0{index + 1}</span>
                      <h3>{card.title}</h3>
                      {card.optional && <small>Opcional</small>}
                    </div>
                    <p>{card.description}</p>
                    <div className="moduleCard__footer">
                      <span className={`statusBadge statusBadge--${status.toLowerCase()}`}>
                        {status === 'Completado' ? 'Completado' : 'Pendiente'}
                      </span>
                      <button type="button" onClick={() => setCurrentModule(card.key)}>
                        {status === 'Completado' ? 'Editar' : 'Iniciar'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {alert.managerComment && (
          <section className="inspectionCenter__notes">
            <h4>Comentario del gerente</h4>
            <p>{alert.managerComment}</p>
          </section>
        )}

        <div className="inspectionCenter__actions">
          <button className="button button-success" onClick={handleFinalizeInspection}>
            Finalizar y enviar inspección
          </button>
        </div>
      </div>
    );
  }

  // Vista 2: Renderizar módulo seleccionado
  return (
    <div className="container">
      <button
        className="button button-secondary"
        style={{ marginBottom: '20px' }}
        onClick={() => setCurrentModule(null)}
      >
        <Icon path={ICONS.back} /> Volver al Centro de Inspección
      </button>

      <InspectionStepper currentModule={currentModule} modules={inspectionData} />

      {currentModule === 'audit' && (
        <TechnicianModuleAudit
          initialData={inspectionData.audit}
          onSubmit={(data) => handleSaveModule('audit', data)}
          setModal={setModal}
        />
      )}

      {currentModule === 'drone' && (
        <TechnicianModuleDrone
          initialData={inspectionData.drone.data}
          onSubmit={(data) => handleSaveModule('drone', { data })}
        />
      )}

      {currentModule === 'plant' && (
        <TechnicianModulePlant
          alert={alert}
          initialData={inspectionData.plant.data}
          onSubmit={(data) => handleSaveModule('plant', { data })}
        />
      )}
    </div>
  );
};

export default TechnicianInspectionCenter;
