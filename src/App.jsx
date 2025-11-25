// src/App.js
// --- ARCHIVO MODIFICADO (CON FOTOS EN PDF) ---

import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';

// --- SECCIÓN 1: IMPORTAR ESTILOS GLOBALES ---
import './styles/index.css';
import './App.css';

// --- SECCIÓN 2: IMPORTAR DATOS Y CONSTANTES ---
import {
  MOCK_PRODUCERS,
  MOCK_TECHNICIANS_PROFILES,
  MOCK_ALERTS,
  MOCK_VISITS,
  MOCK_TASKS,
  MOCK_TECHNICIAN_ACTIONS,
  MOCK_NOTIFICATIONS,
  MOCK_INSPECTION_MODULES,
  MOCK_FINCAS_FLAT,
  MOCK_CERTIFICATION_HISTORY,
  MOCK_WORKERS,
  MOCK_WORK_LOGS,
  MOCK_CONTAINMENT_PLANS,
  MOCK_IMAGE_ANALYSES,
  WORKER_KNOWLEDGE_QUESTIONS
} from './data/mockData';
import { 
  MOCK_TASK_TEMPLATES, 
  TECHNICIAN_SPECIALTIES, 
  BANANA_DISEASES, 
  TECHNICIAN_ACTIONS,
  LABORES_FINCA,
  CINTAS_COSECHA
} from './data/constants';
import { CONTAINMENT_PLAN_TEMPLATES } from './data/protocols'; 
import { calculateRisk } from './utils/riskCalculator';

// --- SECCIÓN 3: IMPORTAR COMPONENTES REUTILIZABLES ---
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Modal from './components/ui/Modal';
import Input from './components/ui/Input'; 
import ProgressBar from './components/ui/ProgressBar/ProgressBar'; 

// --- SECCIÓN 4: IMPORTAR VISTAS (PÁGINAS) ---
import LoginScreen from './views/LoginScreen/LoginScreen';
import ManagerDashboard from './views/ManagerDashboard/ManagerDashboard';
import TechnicianControl from './views/TechnicianControl/TechnicianControl';
import VisitorReport from './views/VisitorReport/VisitorReport';
import AlertTriageView from './views/AlertTriageView/AlertTriageView';
import TechnicianSchedule from './views/TechnicianSchedule/TechnicianSchedule';
import ProducerDashboard from './views/ProducerDashboard/ProducerDashboard';
import AlertReportForm from './views/AlertReportForm/AlertReportForm';
import VisitorApprovalList from './views/VisitorApprovalList/VisitorApprovalList';
import ProducerTasks from './views/ProducerTasks/ProducerTasks';
import ProducerCertification from './views/ProducerCertification/ProducerCertification';
import NotificationCenter from './views/NotificationCenter/NotificationCenter';
import TechnicianInspectionCenter from './views/TechnicianInspectionCenter/TechnicianInspectionCenter';
import ProducerProfile from './views/ProducerProfile/ProducerProfile'; 
import ProducerAlertList from './views/ProducerAlertList/ProducerAlertList'; 
import ProducerSelfCheck from './views/ProducerSelfCheck/ProducerSelfCheck';
import TechnicianProfile from './views/TechnicianProfile/TechnicianProfile'; 
import TechnicianCommandCenter from './views/TechnicianCommandCenter/TechnicianCommandCenter';
import FincaRegistration from './views/FincaRegistration/FincaRegistration'; 
import VisitorAccessPage from './views/VisitorAccess/VisitorAccessPage';
import VisitorCheckIn from './views/VisitorCheckIn/VisitorCheckIn';
import ProducerVisitorLog from './views/ProducerVisitorLog/ProducerVisitorLog';
import ManageWorkers from './views/ManageWorkers/ManageWorkers';
import WorkerLogViewer from './views/WorkerLogViewer/WorkerLogViewer';
import WorkerProfile from './views/WorkerProfile/WorkerProfile';
import WorkerTrainingCenter from './views/WorkerTrainingCenter/WorkerTrainingCenter';
import SubmitWorkLog from './views/SubmitWorkLog/SubmitWorkLog';
import WorkerCheckInLog from './views/WorkerCheckInLog/WorkerCheckInLog'; 
import ContainmentPlanViewer from './views/ContainmentPlanViewer/ContainmentPlanViewer'; 
import ProducerClimateLab from './views/ProducerClimateLab/ProducerClimateLab';
import ProducerControlCenter from './views/ProducerControlCenter/ProducerControlCenter';
import FincaExecutiveSummary from './views/FincaExecutiveSummary/FincaExecutiveSummary';
import TechnicianPerformanceDashboard from './views/TechnicianPerformanceDashboard/TechnicianPerformanceDashboard';
import ImageAnalytics from './views/ImageAnalytics/ImageAnalytics';
import ProducerSuspicionInbox from './views/ProducerSuspicionInbox/ProducerSuspicionInbox';

// --- IMPORTACIONES PARA GENERACIÓN DE PDF ---
import { jsPDF } from 'jspdf';


// --- COMPONENTE INTERNO: Formulario de Registro de Técnico ---
const RegisterTechnicianForm = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Norte');

  const handleSubmit = event => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), zone);
  };

  return (
    <form className="registerTechForm" onSubmit={handleSubmit}>
      <div className="registerTechForm__fields">
        <Input
          label="Nombre completo"
          name="name"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Ej. Ana Mendoza"
          required
        />
        <label className="registerTechForm__label" htmlFor="zone">
          Zona asignada
          <div className="registerTechForm__selectWrapper">
            <select
              id="zone"
              name="zone"
              value={zone}
              onChange={event => setZone(event.target.value)}
            >
              <option value="Norte">Norte</option>
              <option value="Sur">Sur</option>
              <option value="Este">Este</option>
              <option value="Oeste">Oeste</option>
            </select>
          </div>
        </label>
      </div>
      <div className="registerTechForm__actions">
        <button type="button" className="buttonGhost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="buttonPrimary">
          Registrar técnico
        </button>
      </div>
    </form>
  );
};


function App() {
  // --- Estado de Navegación ---
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [pageData, setPageData] = useState(null);

  // --- Estado Global de la App ---
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: '', type: 'info' });
  const [trainingModalTask, setTrainingModalTask] = useState(null);
  const [registerTechModal, setRegisterTechModal] = useState(false); 
  const [certHistoryModal, setCertHistoryModal] = useState(null); 
  const [fincaToEdit, setFincaToEdit] = useState(null);
  const [completedTrainingIds, setCompletedTrainingIds] = useState([]);
  const [trainingStartTime, setTrainingStartTime] = useState(null);

  // --- Estado de Datos (Mocks) ---
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [visits, setVisits] = useState(MOCK_VISITS);
  const [producerVisitNotes, setProducerVisitNotes] = useState({});
  const [producerVisitEvidence, setProducerVisitEvidence] = useState({});
  const [producerVisitFollowups, setProducerVisitFollowups] = useState({});
  const [technicians, setTechnicians] = useState(
    MOCK_TECHNICIANS_PROFILES.map(t => ({
      ...t,
      workload: MOCK_ALERTS.filter(a => a.techId === t.id && a.status === 'assigned').length
    }))
  );
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [technicianActions, setTechnicianActions] = useState(MOCK_TECHNICIAN_ACTIONS);
  const [producers, setProducers] = useState(MOCK_PRODUCERS);
  const [fincas, setFincas] = useState(MOCK_FINCAS_FLAT);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [certificationHistory, setCertificationHistory] = useState(MOCK_CERTIFICATION_HISTORY);
  const [workers, setWorkers] = useState(MOCK_WORKERS);
  const [workLogs, setWorkLogs] = useState(MOCK_WORK_LOGS);
  const [containmentPlans, setContainmentPlans] = useState(MOCK_CONTAINMENT_PLANS);
  const [imageAnalyses, setImageAnalyses] = useState(MOCK_IMAGE_ANALYSES);
  const [selfAssessments, setSelfAssessments] = useState({});
  const [workerKnowledgeChecks, setWorkerKnowledgeChecks] = useState({});
  const [workerTrainingTasks, setWorkerTrainingTasks] = useState({});
  const [workerSuspicions, setWorkerSuspicions] = useState([]);


  // --- Efecto para generar tareas iniciales (basado en mocks) ---
  useEffect(() => {
    // ... (Sin cambios) ...
    const initialTasks = [];
    const completedAlerts = MOCK_ALERTS.filter(a => a.status === 'completed' && a.inspectionData?.audit?.ratings);
    completedAlerts.forEach(alert => {
      const ratings = alert.inspectionData.audit.ratings;
      MOCK_INSPECTION_MODULES.forEach(module => {
        module.questions.forEach(q => {
          if (ratings[q.id] && ratings[q.id] < 3) {
            const template = MOCK_TASK_TEMPLATES[q.id];
            if (template && !tasks.find(t => t.id === `t-${alert.id}-${q.id}`)) {
              initialTasks.push({
                id: `t-${alert.id}-${q.id}`,
                ...template,
                producerId: alert.producerId,
                alertId: alert.id,
                questionId: q.id,
                status: 'pending',
                owner: 'producer',
                createdAt: new Date().toISOString(),
              });
            }
          }
        });
      });
    });
    if (initialTasks.length > 0) {
      setTasks(prev => [...prev, ...initialTasks]);
    }
  }, []);


  // --- Lógica de Negocio (Handlers) ---

  const showLoadingAndModal = (message, type = 'success', duration = 500) => {
    // ... (Sin cambios) ...
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setModal({ show: true, message, type });
    }, duration);
  };

  const createNotification = (producerId, text, link) => {
    // ... (Sin cambios) ...
    const newNotif = {
      id: `n${Date.now()}`,
      producerId,
      text,
      link,
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleSaveSelfAssessment = (assessment) => {
    if (!assessment?.producerId) return;
    setSelfAssessments(prev => ({ ...prev, [assessment.producerId]: assessment }));
    showLoadingAndModal('Autoevaluación guardada. El gerente verá los refuerzos priorizados.', 'success', 700);
    createNotification(
      assessment.producerId,
      'Tu autoevaluación fue guardada y enviada al gerente.',
      'producerSelfCheck'
    );
  };

  const knowledgeWindowDays = 7;
  const getWorkerById = (workerId) => workers.find(w => w.id === workerId);

  const workerNeedsKnowledgeCheck = (workerId) => {
    const record = workerKnowledgeChecks[workerId];
    if (!record?.completedAt) return true;
    const last = new Date(record.completedAt);
    const diff = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= knowledgeWindowDays;
  };

  const handleSaveWorkerKnowledgeCheck = (workerId, result) => {
    if (!workerId || !result) return;
    const completedAt = new Date().toISOString();
    const failCount = result.passed ? 0 : (workerKnowledgeChecks[workerId]?.failCount || 0) + 1;
    setWorkerKnowledgeChecks(prev => ({
      ...prev,
      [workerId]: {
        ...result,
        completedAt,
        failCount
      }
    }));

    const workerData = getWorkerById(workerId);
    if (!result.passed) {
      const trainingTask = {
        id: `training-${Date.now()}`,
        title: 'Refuerzo express de bioseguridad',
        description: 'Revisa este video con buenas prácticas de desinfección y manejo de residuos.',
        videoUrl: 'https://www.youtube.com/embed/TCt8f2O3p6c',
        videoId: 'TCt8f2O3p6c',
        minWatchTime: 120,
        assignedAt: completedAt,
        completed: false
      };
      setWorkerTrainingTasks(prev => ({ ...prev, [workerId]: trainingTask }));
      if (workerData?.producerId) {
        createNotification(
          workerData.producerId,
          `El trabajador ${workerData.name} necesita refuerzo de bioseguridad.`,
          'manageWorkers'
        );
      }
    } else {
      setWorkerTrainingTasks(prev => {
        if (!prev[workerId]) return prev;
        return {
          ...prev,
          [workerId]: { ...prev[workerId], completed: true }
        };
      });
    }
  };

  const handleCompleteWorkerTraining = (workerId) => {
    setWorkerTrainingTasks(prev => {
      if (!prev[workerId]) return prev;
      return {
        ...prev,
        [workerId]: { ...prev[workerId], completed: true, completedAt: new Date().toISOString() }
      };
    });
  };

  const handleSubmitSuspicion = (suspicion) => {
    if (!suspicion?.workerId || !suspicion?.producerId) return;
    const newSuspicion = {
      id: `s-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...suspicion
    };
    setWorkerSuspicions(prev => [newSuspicion, ...prev]);
    createNotification(
      suspicion.producerId,
      `Nueva sospecha reportada por ${suspicion.workerName || 'trabajador'}.`,
      'producerSuspicionInbox'
    );
    showLoadingAndModal('Sospecha enviada al productor.', 'success', 500);
  };

  const handleUpdateWorkerProfile = (workerId, updates = {}) => {
    if (!workerId || !updates) return;
    setWorkers(prev =>
      prev.map(worker => (worker.id === workerId ? { ...worker, ...updates } : worker))
    );
    if (userRole === 'worker' && currentUser?.id === workerId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    showLoadingAndModal('Perfil del trabajador actualizado.', 'success', 500);
  };

  const handleUpdateTechnicianProfile = (technicianId, updates = {}) => {
    if (!technicianId || !updates) return;
    setTechnicians(prev =>
      prev.map(tech => (tech.id === technicianId ? { ...tech, ...updates } : tech))
    );
    if (userRole === 'technician' && currentUser?.id === technicianId) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    showLoadingAndModal('Perfil del técnico actualizado.', 'success', 500);
  };

  const handleDismissSuspicion = (suspicionId) => {
    setWorkerSuspicions(prev =>
      prev.map(item => item.id === suspicionId ? { ...item, status: 'dismissed' } : item)
    );
  };

  const handleConvertSuspicionToAlert = (suspicionId) => {
    const suspicion = workerSuspicions.find(s => s.id === suspicionId);
    if (!suspicion) return;
    const fincaData = fincas.find(f => f.id === suspicion.fincaId);
    const newAlert = {
      id: `a${Date.now()}`,
      producerId: suspicion.producerId,
      fincaId: suspicion.fincaId,
      lote: suspicion.lote || 'Sin lote',
      farmName: fincaData?.name || 'Finca',
      date: new Date().toISOString(),
      parts: {},
      symptoms: suspicion.type ? [suspicion.type] : [],
      photos: {},
      location: fincaData?.location || null,
      status: 'pending',
      techId: null,
      visitDate: null,
      priority: 'Media',
      managerComment: suspicion.note || 'Sospecha reportada por trabajador.',
      possibleDisease: null,
      inspectionData: null,
      comments: suspicion.note || ''
    };
    setAlerts(prev => [newAlert, ...prev]);
    setWorkerSuspicions(prev =>
      prev.map(item => item.id === suspicionId ? { ...item, status: 'converted', alertId: newAlert.id } : item)
    );
    createNotification(
      suspicion.producerId,
      `Sospecha convertida en alerta ${newAlert.id}.`,
      'producerAlertList'
    );
    showLoadingAndModal('Se creó una alerta a partir de la sospecha.', 'success', 600);
  };

  const handleCreateContainmentPlan = (diagnosisList, alert) => {
    // ... (Sin cambios) ...
    const existingPlans = containmentPlans.filter(p => p.alertId === alert.id);
    diagnosisList.forEach(diagnosis => {
      const planExists = existingPlans.find(p => p.diseaseName === diagnosis);
      const template = CONTAINMENT_PLAN_TEMPLATES[diagnosis];
      if (template && !planExists) {
        const newSteps = template.steps.map(step => ({
          ...step,
          tasks: step.tasks.map(task => ({ 
            ...task,
            id: `${alert.id}-${task.id}`, 
            log: [] 
          }))
        }));
        const newPlan = {
          id: `plan-${alert.id}-${diagnosis}`,
          producerId: alert.producerId,
          fincaId: alert.fincaId,
          alertId: alert.id,
          lote: alert.lote,
          diseaseName: template.diseaseName,
          description: template.description,
          status: 'active',
          createdAt: new Date().toISOString(),
          steps: newSteps,
        };
        setContainmentPlans(prev => [newPlan, ...prev]);
        createNotification(
          alert.producerId, 
          `Se ha activado un Plan de Contención para ${diagnosis} en ${alert.farmName}.`, 
          'containmentPlans'
        );
      }
    });
  };

  const handleUpdateTaskDetails = (planId, taskId, updates) => {
    // ... (Sin cambios) ...
    setContainmentPlans(prevPlans => 
      prevPlans.map(plan => {
        if (plan.id === planId) {
          let allTasksCompleted = true;
          const updatedSteps = plan.steps.map(step => ({
            ...step,
            tasks: step.tasks.map(task => {
              let finalTask = task;
              if (task.id === taskId) {
                const newLogEntry = (updates.comment && currentUser)
                  ? { user: currentUser.name, date: new Date().toISOString(), comment: updates.comment }
                  : null;
                finalTask = { 
                  ...task,
                  status: updates.status,
                  evidencePhoto: updates.evidencePhoto, 
                  completedAt: updates.completedAt, 
                  log: newLogEntry ? [...(task.log || []), newLogEntry] : task.log, 
                };
              }
              if (finalTask.status !== 'completed') {
                allTasksCompleted = false;
              }
              return finalTask;
            })
          }));
          return {
            ...plan,
            steps: updatedSteps, 
            status: allTasksCompleted ? 'completed' : 'active', 
          };
        }
        return plan;
      })
    );
  };

  const handleShowTraining = (task) => {
    // ... (Sin cambios) ...
    setTrainingStartTime(Date.now()); 
    setTrainingModalTask(task);
  };

  const handleTrainingComplete = (task) => {
    // ... (Sin cambios) ...
    const timeElapsed = (Date.now() - trainingStartTime) / 1000; 
    const requiredDuration = task.minWatchTime || 60; 
    if (timeElapsed < requiredDuration) {
      setModal({ 
        show: true, 
        message: `Debe ver la capacitación por al menos ${requiredDuration} segundos para completarla. Solo la vio por ${Math.round(timeElapsed)} segundos.`, 
        type: 'error' 
      });
      return; 
    }
    if (task.id && !completedTrainingIds.includes(task.id)) {
      setCompletedTrainingIds(prev => [...prev, task.id]);
    }
    if (typeof task.onComplete === 'function') {
      task.onComplete();
    }
  };

  const handleLogin = (role, page = null) => {
    // ... (Sin cambios) ...
    setUserRole(role);
    if (role === 'manager') {
      setCurrentUser({ id: 'm1', name: 'Gerente Palmar' });
      setCurrentPage(page || 'managerDashboard');
    } else if (role === 'producer') {
      setCurrentUser(producers[0]);
      setCurrentPage(page || 'producerDashboard');
    } else if (role === 'technician') {
      const techUser = technicians[0];
      setCurrentUser(techUser);
      setCurrentPage(page || 'technicianSchedule');
    } else if (role === 'worker') { 
      const workerUser = workers.find(w => w.producerId === 'p1'); 
      setCurrentUser(workerUser);
      setCurrentPage(page || 'workerProfile');
    } else if (role === 'public') {
      setCurrentUser(null);
      if (page === 'visitorForm') {
        setCurrentPage('visitorAccessPage'); 
      } else if (page === 'visitorCheckIn') {
        setCurrentPage('visitorCheckIn'); 
      }
    } else {
      setCurrentUser(null);
      setCurrentPage('login');
    }
  };

  const handleLogout = () => {
    // ... (Sin cambios) ...
    setUserRole(null);
    setCurrentUser(null);
    setCurrentPage('login');
    setPageData(null);
    setFincaToEdit(null); 
  };

  const handleNavigate = (page, data = null) => {
    // ... (Sin cambios) ...
    if (page === 'logout') {
      handleLogout();
      return;
    }
    if (page === 'fincaRegistration' && data === null) {
      setFincaToEdit(null);
    }
    setCurrentPage(page);
    setPageData(data); 
  };
  
  const handleSubmitAlert = (newAlert) => {
    // ... (Sin cambios) ...
    setLoading(true);
    setTimeout(() => {
      const alertWithId = { ...newAlert, id: `a${Date.now()}` };
      setAlerts(prev => [alertWithId, ...prev]);
      createNotification(newAlert.producerId, `Tu Alerta #${alertWithId.id} (${newAlert.farmName}) ha sido recibida.`, 'producerDashboard');
      setLoading(false);
      setModal({ show: true, message: 'Alerta enviada con éxito. El gerente será notificado.', type: 'success' });
      handleNavigate('producerDashboard');
    }, 500);
  };

  const handleSubmitVisitRequest = (requestData) => {
    // ... (Sin cambios) ...
    return new Promise((resolve) => { 
      setLoading(true);
      setTimeout(() => {
        const fincaData = fincas.find(f => f.id === requestData.fincaId);
        const producerId = fincaData ? fincaData.producerId : null;
        const newVisit = {
          id: `V-${requestData.fincaId}-${Date.now()}-${requestData.id.slice(-3)}`,
          producerId: producerId, 
          fincaId: requestData.fincaId, 
          name: requestData.name,
          idNumber: requestData.id,
          company: requestData.company,
          purpose: requestData.purpose,
          valueChain: requestData.valueChain,
          entryTime: requestData.entryTime, 
          exitTime: requestData.exitTime,   
          status: 'PENDING',
          qrData: null,
          risk: null,
          checkIn: null, 
          checkOut: null, 
          signature: null,
          visitorPhoto: null, 
          vehiclePhoto: null, 
        };
        setVisits(prev => [newVisit, ...prev]);
        if (producerId) {
           createNotification(producerId, `Nueva solicitud de visita de ${newVisit.name} para ${fincaData.name}.`, 'visitorApproval');
        }
        setLoading(false);
        resolve(true); 
      }, 500);
    });
  };

  const handleApproveVisit = (visitId, potentialRisk) => { 
    // ... (Sin cambios) ...
    setLoading(true);
    setTimeout(() => {
      let producerId = '';
      let visitName = '';
      setVisits(prev => prev.map(v => {
        if (v.id === visitId) {
          producerId = v.producerId;
          visitName = v.name;
          return {
            ...v,
            status: 'APPROVED',
            risk: potentialRisk, 
            qrData: `${v.id}|${v.idNumber}|${potentialRisk.toUpperCase()}`, 
          };
        }
        return v;
      }));
      if (producerId) {
        createNotification(producerId, `Has aprobado la visita de ${visitName}.`, 'visitorApproval');
      }
      showLoadingAndModal('Visita aprobada. Se generó el código QR.', 'success');
    }, 500);
  };

  const handleRejectVisit = (visitId) => {
    // ... (Sin cambios) ...
    setLoading(true);
    setTimeout(() => {
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: 'DENIED' } : v));
      showLoadingAndModal('Visita rechazada.', 'info');
      setLoading(false);
    }, 500);
  };

  const handleScanQr = (qrData) => {
    // ... (Sin cambios) ...
    return new Promise((resolve, reject) => {
      setLoading(true);
      setTimeout(() => {
        const now = new Date().toISOString();
        const todayDate = now.split('T')[0];
        const visit = visits.find(v => v.qrData === qrData);
        if (visit) {
          const visitIndex = visits.indexOf(visit);
          let updatedVisit;
          if (visit.status === 'APPROVED') {
            updatedVisit = { ...visit, status: 'CHECKED_IN', checkIn: now, scannedTime: now, isWorker: false };
          } else if (visit.status === 'CHECKED_IN') {
            updatedVisit = { ...visit, status: 'CHECKED_OUT', checkOut: now, scannedTime: now, isWorker: false };
          } else if (visit.status === 'CHECKED_OUT') {
            setLoading(false);
            reject(new Error("Esta visita ya fue registrada como SALIDA."));
            return;
          } else {
            setLoading(false);
            reject(new Error(`El estado de esta visita es '${visit.status}'. No se puede escanear.`));
            return;
          }
          setVisits(prev => prev.map((v, index) => index === visitIndex ? updatedVisit : v));
          setLoading(false);
          resolve(updatedVisit); 
          return;
        }
        const worker = workers.find(w => w.qrCode === qrData);
        if (worker) {
          const openLog = workLogs.find(log => 
            log.workerId === worker.id && 
            log.date === todayDate && 
            !log.checkOut
          );
          if (!openLog) {
            const newLog = {
              id: `wl-${Date.now()}`,
              workerId: worker.id,
              name: worker.name,
              date: todayDate,
              checkIn: now, 
              checkOut: null,
              status: 'pending', 
              fincaId: null, 
              lote: null,
              labor: null,
              cintas: [],
              description: ''
            };
            setWorkLogs(prev => [newLog, ...prev]);
            setLoading(false);
            resolve({
              id: worker.id,
              name: worker.name,
              company: 'Personal de Finca',
              risk: 'Low', 
              status: 'CHECKED_IN',
              checkIn: now,
              scannedTime: now,
              isWorker: true 
            });
          } else {
            setWorkLogs(prev => prev.map(log => 
              log.id === openLog.id ? { ...log, checkOut: now } : log
            ));
            setLoading(false);
            resolve({
              id: worker.id,
              name: worker.name,
              company: 'Personal de Finca',
              risk: 'Low',
              status: 'CHECKED_OUT',
              checkOut: now,
              scannedTime: now,
              isWorker: true
            });
          }
          return;
        }
        setLoading(false);
        reject(new Error("QR Inválido. Código no reconocido."));
      }, 500);
    });
  };

  const handleProducerVisitNoteChange = (alertId, noteValue) => {
    setProducerVisitNotes(prev => ({ ...prev, [alertId]: noteValue }));
  };

  const handleProducerVisitEvidenceChange = (alertId, fileData) => {
    setProducerVisitEvidence(prev => {
      if (!fileData) {
        if (!prev[alertId]) return prev;
        const next = { ...prev };
        delete next[alertId];
        return next;
      }
      return { ...prev, [alertId]: fileData };
    });
  };

  const handleProducerVisitFollowupToggle = alertId => {
    setProducerVisitFollowups(prev => ({
      ...prev,
      [alertId]: {
        completed: !prev[alertId]?.completed,
        timestamp: new Date().toISOString(),
      },
    }));
  };
  
  const handleCaptureEvidence = (visitId, type, data) => {
    // ... (Sin cambios) ...
    setVisits(prev => prev.map(v => 
      v.id === visitId ? { ...v, [type]: data } : v
    ));
    console.log(`Evidencia [${type}] guardada para ${visitId}`);
  };

  const handleGeneratePDF = async (visit) => {
    // ... (Sin cambios, este es para Visitantes) ...
    setLoading(true);
    const doc = new jsPDF();
    try {
      const finca = fincas.find(f => f.id === visit.fincaId);
      const fincaName = finca ? finca.name : 'Finca Desconocida';
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text("Reporte de Visita de Bioseguridad", 105, 22, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(`Visita ID: ${visit.id}`, 14, 35);
      doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 196, 35, { align: 'right' });
      doc.line(14, 40, 196, 40); 
      let y = 50; 
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Detalles del Visitante", 14, y);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Nombre: ${visit.name}`, 14, y += 7);
      doc.text(`Cédula/ID: ${visit.idNumber}`, 14, y += 7);
      doc.text(`Compañía: ${visit.company}`, 14, y += 7);
      doc.text(`Propósito: ${visit.purpose}`, 14, y += 7);
      doc.text(`Nivel de Riesgo: ${visit.risk || 'N/A'}`, 14, y += 7);
      y += 12;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Registro de Tiempos y Finca", 14, y);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Finca Visitada: ${fincaName}`, 14, y += 7);
      doc.text(`Ingreso Aprobado: ${new Date(visit.entryTime).toLocaleString()}`, 14, y += 7);
      doc.text(`Ingreso Real (Check-In): ${visit.checkIn ? new Date(visit.checkIn).toLocaleString() : 'N/A'}`, 14, y += 7);
      doc.text(`Salida Real (Check-Out): ${visit.checkOut ? new Date(visit.checkOut).toLocaleString() : 'N/A'}`, 14, y += 7);
      y += 12;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Evidencia Recolectada", 14, y);
      y += 7;
      const addImageToPdf = (label, imageData, startY) => {
        if (imageData) {
          try {
            doc.setFont(undefined, 'normal');
            doc.text(label, 14, startY);
            doc.addImage(imageData, 'PNG', 14, startY + 2, 80, 60);
            return startY + 70; 
          } catch (e) {
            console.error("Error al añadir imagen al PDF:", e);
            doc.setTextColor(255, 0, 0);
            doc.text("Error al cargar la imagen (formato inválido).", 14, startY + 5);
            doc.setTextColor(100);
            return startY + 10;
          }
        }
        return startY;
      };
      y = addImageToPdf('Foto del Visitante:', visit.visitorPhoto, y);
      if (y > 220) { doc.addPage(); y = 20; }
      y = addImageToPdf('Firma de Conformidad:', visit.signature, y);
      if (y > 220) { doc.addPage(); y = 20; }
      addImageToPdf('Foto del Vehículo:', visit.vehiclePhoto, y);
    } catch (error) {
      console.error("Error al generar PDF: ", error);
      setModal({ show: true, message: 'Hubo un error al generar el PDF.', type: 'error' });
    }
    doc.save(`Reporte_Visita_${visit.id}.pdf`);
    setLoading(false);
  };
  
  // --- MODIFICADO: Generador de PDF de Alerta (con Fotos) ---
  const handleGenerateAlertPDF = (alert) => {
    setLoading(true);
    const doc = new jsPDF();
    try {
      const tech = technicians.find(t => t.id === alert.techId);
      const resolution = alert.inspectionData?.plant?.data;
      
      const addImageToPdf = (label, imageData, startY) => {
        if (imageData) {
          try {
            if (startY > 220) { 
              doc.addPage(); 
              startY = 20; 
            }
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.text(label, 14, startY);
            doc.addImage(imageData, 'PNG', 14, startY + 3, 80, 60);
            return startY + 70; 
          } catch (e) {
            console.error("Error al añadir imagen al PDF:", e);
            doc.setTextColor(255, 0, 0);
            doc.text("Error al cargar la imagen (formato inválido).", 14, startY + 5);
            doc.setTextColor(100);
            return startY + 10;
          }
        }
        return startY;
      };
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text("Reporte de Alerta de Bioseguridad", 105, 22, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(`Alerta ID: ${alert.id}`, 14, 35);
      doc.text(`Fecha de Reporte: ${new Date(alert.date).toLocaleDateString()}`, 196, 35, { align: 'right' });
      doc.line(14, 40, 196, 40);

      let y = 50;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Detalles del Reporte (Productor)", 14, y);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Finca: ${alert.farmName}`, 14, y += 7);
      doc.text(`Lote: ${alert.lote}`, 14, y += 7);
      doc.text(`Síntomas Reportados: ${alert.symptoms.join(', ')}`, 14, y += 7, { maxWidth: 180 });
      y += 7; 
      
      const attachedPhotos = alert.photos ? Object.entries(alert.photos).filter(([key, value]) => value) : [];
      doc.text(`Fotos Adjuntas: ${attachedPhotos.length}`, 14, y += 7);
      y += 7;

      // --- Bucle para añadir fotos del productor ---
      if (attachedPhotos.length > 0) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Evidencia del Productor", 14, y);
        y += 7;
        for (const [key, photoData] of attachedPhotos) {
          y = addImageToPdf(`Evidencia (${key}):`, photoData, y);
        }
      }
      
      if (y > 250) { doc.addPage(); y = 20; } 

      y += 5; // Espacio extra
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Estado de la Alerta", 14, y);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Estado: ${alert.status.toUpperCase()}`, 14, y += 7);
      doc.text(`Prioridad: ${alert.priority || 'N/A'}`, 14, y += 7);

      if (alert.status === 'assigned' && tech) {
        doc.text(`Técnico Asignado: ${tech.name}`, 14, y += 7);
        doc.text(`Fecha Programada: ${alert.visitDate ? new Date(alert.visitDate).toLocaleDateString() : 'N/A'}`, 14, y += 7);
      }
      
      if (y > 250) { doc.addPage(); y = 20; } 

      if (alert.status === 'completed' && resolution) {
        y += 12;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Resolución del Técnico", 14, y);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`Diagnóstico Final: ${resolution.diagnosis.join(', ')}`, 14, y += 7);
        doc.text(`Acciones Tomadas: ${resolution.actions.join(', ')}`, 14, y += 7);
        doc.text(`Recomendaciones: ${resolution.recommendations}`, 14, y += 7, { maxWidth: 180 });
      }

    } catch (error) {
      console.error("Error al generar PDF de Alerta: ", error);
      setModal({ show: true, message: 'Hubo un error al generar el PDF.', type: 'error' });
    }

    doc.save(`Reporte_Alerta_${alert.id}.pdf`);
    setLoading(false);
  };
  
  const renderFincaSummaryPage = (doc, summary) => {
    const margin = 16;
    const drawCard = (x, y, w, h, options = {}) => {
      const { fill = [248, 250, 252], stroke = [230, 235, 242] } = options;
      doc.setDrawColor(...stroke);
      doc.setFillColor(...fill);
      doc.roundedRect(x, y, w, h, 4, 4, 'FD');
    };

    // Hero banner
    doc.setFillColor(11, 78, 122);
    doc.rect(0, 0, 210, 42, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(`Resumen ejecutivo de ${summary.fincaName}`, 105, 17, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Productor: ${summary.producerName}`, margin, 30);
    doc.text(`Hectáreas: ${summary.hectares}  |  Lotes: ${summary.lotes}`, 210 - margin, 30, { align: 'right' });
    doc.setTextColor(15, 23, 42);

    // KPI cards (bicolor)
    const kpiData = [
      { label: 'Alertas activas', value: `${summary.alertsActive}`, detail: `${summary.alertsCritical} críticas`, color: [243, 244, 255] },
      { label: 'Planes activos', value: `${summary.containmentActive}`, detail: 'Contención', color: [236, 253, 245] },
      { label: 'Tareas pendientes', value: `${summary.tasksPending}`, detail: `${summary.tasksCompleted} completadas`, color: [255, 248, 237] },
      { label: 'Visitas pendientes', value: `${summary.visitsPending}`, detail: `${summary.visitsUpcoming} programadas`, color: [239, 246, 255] }
    ];
    const cardWidth = 92;
    kpiData.forEach((kpi, index) => {
      const x = margin + (index % 2) * (cardWidth + 12);
      const y = 50 + Math.floor(index / 2) * 38;
      drawCard(x, y, cardWidth, 34, { fill: kpi.color });
      doc.setFontSize(9);
      doc.text(kpi.label.toUpperCase(), x + 6, y + 10);
      doc.setFontSize(18);
      doc.text(kpi.value, x + 6, y + 22);
      doc.setFontSize(9);
      doc.text(kpi.detail, x + 6, y + 29);
    });

    // Table of indicators
    const indicators = [
      ['Alertas completadas', `${summary.alertsCompleted}`],
      ['Alertas críticas', `${summary.alertsCritical}`],
      ['Planes activos', `${summary.containmentActive}`],
      ['Tareas completadas', `${summary.tasksCompleted}`],
      ['Visitas programadas', `${summary.visitsUpcoming}`]
    ];
    const pageHeight = 297;
    const resetTextColor = () => doc.setTextColor(15, 23, 42);
    const ensureSectionSpace = (currentY, needed) => {
      if (currentY + needed > pageHeight - 20) {
        doc.addPage();
        resetTextColor();
        return 20;
      }
      return currentY;
    };

    const tableY = 130;
    doc.setFontSize(12);
    doc.text('Indicadores clave', margin, tableY);
    doc.setFontSize(10);
    let rowY = tableY + 6;
    indicators.forEach(([label, value]) => {
      drawCard(margin, rowY - 4, 178, 12);
      doc.text(label, margin + 4, rowY + 4);
      doc.text(value, 196 - margin, rowY + 4, { align: 'right' });
      rowY += 14;
    });

    // Alert status breakdown
    let sectionY = rowY + 8;
    sectionY = ensureSectionSpace(sectionY, 26);
    doc.setFontSize(12);
    doc.text('Estado de alertas', margin, sectionY);
    drawCard(margin, sectionY + 4, 178, 18);
    doc.setFontSize(10);
    doc.text(
      `Pendientes: ${summary.statusBreakdown.pending} · Asignadas: ${summary.statusBreakdown.assigned} · Completadas: ${summary.statusBreakdown.completed}`,
      margin + 4,
      sectionY + 16
    );

    // Diseases
    sectionY += 26;
    sectionY = ensureSectionSpace(sectionY, 30);
    doc.setFontSize(12);
    doc.text('Enfermedades detectadas', margin, sectionY);
    drawCard(margin, sectionY + 4, 178, 20);
    doc.setFontSize(10);
    const diseases = summary.topDiseases.length
      ? summary.topDiseases.map(d => `${d.name} (${d.count})`).join(', ')
      : 'Sin registros recientes.';
    doc.text(diseases, margin + 4, sectionY + 16, { maxWidth: 170 });

    // Biosecurity and visits
    sectionY += 30;
    sectionY = ensureSectionSpace(sectionY, 34);
    doc.setFontSize(12);
    doc.text('Bioseguridad y visitas', margin, sectionY);
    drawCard(margin, sectionY + 4, 178, 24);
    doc.setFontSize(10);
    const bioText = summary.biosecurity
      ? `Última auditoría: ${summary.biosecurity.lastStatus} (${summary.biosecurity.lastScore}%) · ${summary.biosecurity.approvals}/${summary.biosecurity.totalAudits} aprobadas`
      : 'Sin historial de certificaciones.';
    doc.text(bioText, margin + 4, sectionY + 14, { maxWidth: 170 });
    doc.text(`Visitas de alto riesgo: ${summary.highRiskVisits}`, margin + 4, sectionY + 22);

    // Notes section
    sectionY += 34;
    sectionY = ensureSectionSpace(sectionY, 40);
    doc.setFontSize(12);
    doc.text('Notas', margin, sectionY);
    drawCard(margin, sectionY + 4, 178, 30);
    doc.setFontSize(10);
    doc.text(summary.notes || 'Sin observaciones registradas.', margin + 4, sectionY + 12, { maxWidth: 170 });
  };

  const handleGenerateFincaSummaryPDF = payload => {
    const doc = new jsPDF();
    const summaries = Array.isArray(payload) ? payload : [payload];
    summaries.forEach((summary, index) => {
      if (index > 0) doc.addPage();
      renderFincaSummaryPage(doc, summary);
    });
    const filename =
      summaries.length === 1
        ? `Resumen_${summaries[0].fincaName}.pdf`
        : `Resumen_${summaries.length}_Fincas.pdf`;
    doc.save(filename);
  };
  
  const handleAssignAlert = (alertId, comment, diseases, techId, date, priority) => { /* ... */ };
  
  const handleCompleteTask = (taskId) => {
    // ... (Sin cambios) ...
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
    showLoadingAndModal('¡Tarea completada!', 'success');
  };

  const handleTechnicianActionProgress = (actionId, note, authorName = 'Técnico') => {
    const cleanNote = (note || '').trim();
    if (!cleanNote) return;
    const timestamp = new Date().toISOString();
    setTechnicianActions(prevActions =>
      prevActions.map(action => {
        if (action.id !== actionId) return action;
        const updates = [
          ...(action.updates || []),
          {
            id: `${actionId}-u-${Date.now()}`,
            authorRole: 'technician',
            authorName,
            message: cleanNote,
            timestamp
          }
        ];
        const nextStatus = action.status === 'assigned' ? 'in_progress' : action.status;
        return { ...action, status: nextStatus, updates, lastUpdate: timestamp };
      })
    );
    showLoadingAndModal('Seguimiento técnico actualizado', 'success', 300);
  };

  const handleTechnicianActionSubmit = (actionId, summary, authorName = 'Técnico') => {
    const cleanSummary = (summary || '').trim();
    const timestamp = new Date().toISOString();
    let actionForNotification = null;
    setTechnicianActions(prevActions =>
      prevActions.map(action => {
        if (action.id !== actionId) return action;
        actionForNotification = action;
        const updates = [
          ...(action.updates || []),
          {
            id: `${actionId}-u-${Date.now()}`,
            authorRole: 'technician',
            authorName,
            message: cleanSummary || 'Se solicita validación del trabajo realizado.',
            timestamp
          }
        ];
        return { ...action, status: 'pending_validation', updates, lastUpdate: timestamp };
      })
    );
    if (actionForNotification) {
      createNotification(
        actionForNotification.producerId,
        `El técnico ${authorName} solicitó validar "${actionForNotification.title}"`,
        'producerTasks'
      );
    }
    showLoadingAndModal('Acción enviada a validación', 'info', 400);
  };

  const handleValidateTechnicianAction = (actionId, approverName = 'Productor') => {
    const timestamp = new Date().toISOString();
    setTechnicianActions(prevActions =>
      prevActions.map(action => {
        if (action.id !== actionId) return action;
        const updates = [
          ...(action.updates || []),
          {
            id: `${actionId}-u-${Date.now()}`,
            authorRole: 'producer',
            authorName: approverName,
            message: 'Trabajo validado y cerrado.',
            timestamp
          }
        ];
        return { ...action, status: 'validated', updates, lastUpdate: timestamp };
      })
    );
    showLoadingAndModal('Acción técnica validada', 'success', 300);
  };

  const handleMarkAsRead = (notificationId) => {
    if (!notificationId) return;
    setNotifications(prev =>
      prev.map(notification => {
        if (notificationId === 'all') {
          return notification.read ? notification : { ...notification, read: true };
        }
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      })
    );
  };
  
  const handleSaveInspectionModule = (alertId, partialInspectionData, finalize = false) => {
    // ... (Sin cambios) ...
    setLoading(true);
    let alertToTriggerPlan = null; 
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => {
        if (alert.id === alertId) {
          const updatedInspectionData = {
            ...alert.inspectionData,
            ...partialInspectionData
          };
          let finalStatus = alert.status;
          if (finalize) {
            finalStatus = 'completed'; 
            if (partialInspectionData.plant) {
              alertToTriggerPlan = alert; 
            }
          }
          return {
            ...alert,
            inspectionData: updatedInspectionData,
            status: finalStatus
          };
        }
        return alert;
      })
    );
    setTimeout(() => {
      setLoading(false);
      if (finalize) {
        setModal({ show: true, message: '¡Inspección finalizada y guardada!', type: 'success' });
        if (alertToTriggerPlan && partialInspectionData.plant) {
          const diagnosis = partialInspectionData.plant.data.diagnosis;
          handleCreateContainmentPlan(diagnosis, alertToTriggerPlan); 
        }
        handleNavigate('technicianSchedule'); 
      } else {
        setModal({ show: true, message: 'Módulo guardado. Puede continuar.', type: 'info' });
      }
    }, 500);
  };

  const handleRegisterTechnician = (name, zone) => { /* ... */ };
  
  const handleEditFinca = (fincaId) => {
    // ... (Sin cambios) ...
    const finca = currentUser.fincas.find(f => f.id === fincaId);
    if (finca) {
      setFincaToEdit(finca); 
      setCurrentPage('fincaRegistration'); 
    }
  };

  const handleSaveImageAnalysis = analysis => {
    if (!analysis) return;
    setImageAnalyses(prev => [analysis, ...prev]);
    setModal({ show: true, message: 'Análisis de imagen guardado correctamente.', type: 'success' });
  };

  const handleRegisterFinca = (fincaData) => {
    // ... (Sin cambios) ...
    setLoading(true);
    const newProducersList = producers.map(producer => {
      if (producer.id === currentUser.id) {
        return {
          ...producer,
          fincas: [...producer.fincas, fincaData]
        };
      }
      return producer;
    });
    setProducers(newProducersList);
    setCurrentUser(prev => ({
      ...prev,
      fincas: [...prev.fincas, fincaData]
    }));
    const newFincasFlat = newProducersList.flatMap(p => 
      p.fincas.map(f => ({...f, producerId: p.id, owner: p.owner}))
    );
    setFincas(newFincasFlat);
    setTimeout(() => {
      setLoading(false);
      setModal({ show: true, message: 'Finca registrada con éxito.', type: 'success' });
      handleNavigate('producerProfile'); 
    }, 500);
  };

  const handleUpdateFinca = (updatedFincaData) => {
    // ... (Sin cambios) ...
    setLoading(true);
    const newProducersList = producers.map(producer => {
      if (producer.id === currentUser.id) {
        const updatedFincas = producer.fincas.map(finca => 
          finca.id === updatedFincaData.id ? updatedFincaData : finca
        );
        return {
          ...producer,
          fincas: updatedFincas
        };
      }
      return producer;
    });
    setProducers(newProducersList);
    setCurrentUser(prev => ({
      ...prev,
      fincas: prev.fincas.map(finca => 
        finca.id === updatedFincaData.id ? updatedFincaData : finca
      )
    }));
    const newFincasFlat = newProducersList.flatMap(p => 
      p.fincas.map(f => ({...f, producerId: p.id, owner: p.owner}))
    );
    setFincas(newFincasFlat);
    setTimeout(() => {
      setLoading(false);
      setModal({ show: true, message: 'Finca actualizada con éxito.', type: 'success' });
      setFincaToEdit(null); 
      handleNavigate('producerProfile'); 
    }, 500);
  };

  const handleRegisterWorker = (workerData) => {
    // ... (Sin cambios) ...
    setLoading(true);
    const newWorker = {
      ...workerData,
      id: `w${Date.now()}`,
      producerId: currentUser.id,
      qrCode: `WORKER-${workerData.idNumber}` 
    };
    setWorkers(prev => [...prev, newWorker]);
    setTimeout(() => {
      setLoading(false);
      setModal({ show: true, message: 'Trabajador registrado con éxito.', type: 'success' });
    }, 500);
  };

  const handleSubmitWorkLog = (logId, logData) => {
    // ... (Sin cambios) ...
    setLoading(true);
    setWorkLogs(prevLogs => prevLogs.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          ...logData, 
          status: 'completed' 
        };
      }
      return log;
    }));
    setTimeout(() => {
      setLoading(false);
      setModal({ show: true, message: 'Reporte de labor enviado.', type: 'success' });
    }, 500);
  };


  // --- Renderizado Condicional de Páginas ---

  const renderPage = () => {
    // ... (Sin cambios en 'publicas') ...
    if (currentPage === 'login') {
      return <LoginScreen onLogin={handleLogin} />;
    }
    if (currentPage === 'visitorAccessPage') {
      return <VisitorAccessPage onNewRequest={handleSubmitVisitRequest} approvedVisits={visits.filter(v => v.idNumber === "12345")} onNavigate={handleNavigate} />;
    }
    if (currentPage === 'visitorCheckIn') {
      return <VisitorCheckIn onNavigate={handleNavigate} onScanQr={handleScanQr} onCaptureEvidence={handleCaptureEvidence} setModal={setModal} />;
    }
    if (!userRole || !currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    switch (userRole) {
      case 'manager':
        // ... (Sin cambios) ...
        switch (currentPage) {
          case 'managerDashboard':
            return (
              <ManagerDashboard
                alerts={alerts}
                visits={visits}
                technicians={technicians}
                tasks={tasks}
                producers={producers}
                containmentPlans={containmentPlans}
                onNavigate={handleNavigate}
              />
            );
          case 'technicianControl':
            return (
              <TechnicianControl
                technicians={technicians}
                alerts={alerts}
                onNavigate={handleNavigate}
                onShowRegisterModal={() => setRegisterTechModal(true)}
              />
            );
          case 'visitorReport':
            return <VisitorReport visits={visits} fincas={fincas} pageData={pageData} onNavigate={handleNavigate} />;
          case 'producerControlCenter':
            return (
              <ProducerControlCenter
                producers={producers}
                alerts={alerts}
              tasks={tasks}
              workers={workers}
              containmentPlans={containmentPlans}
              visits={visits}
              selfAssessments={selfAssessments}
              onNavigate={handleNavigate}
            />
          );
          case 'fincaExecutiveSummary':
            return (
              <FincaExecutiveSummary
                producers={producers}
                alerts={alerts}
                tasks={tasks}
                visits={visits}
                containmentPlans={containmentPlans}
                certificationHistory={certificationHistory}
                technicians={technicians}
                pageData={pageData}
                onDownloadSummary={handleGenerateFincaSummaryPDF}
                onNavigate={handleNavigate}
              />
            );
          case 'technicianPerformance':
            return (
              <TechnicianPerformanceDashboard
                technicians={technicians}
                alerts={alerts}
                tasks={tasks}
                technicianActions={technicianActions}
                onNavigate={handleNavigate}
                pageData={pageData}
              />
            );
          case 'alertTriage':
            return <AlertTriageView alerts={alerts} technicians={technicians} onAssignAlert={handleAssignAlert} setModal={setModal} pageData={pageData} onNavigate={handleNavigate} />; 
          case 'technicianSchedule':
            return <TechnicianSchedule technician={pageData || technicians[0]} alerts={alerts} onNavigate={handleNavigate} />;
          default:
            return (
              <ManagerDashboard
                alerts={alerts}
                visits={visits}
                technicians={technicians}
                tasks={tasks}
                producers={producers}
                containmentPlans={containmentPlans}
                onNavigate={handleNavigate}
              />
            );
        }

      case 'producer':
        switch (currentPage) {
          // ... (Sin cambios en otros cases) ...
          case 'producerDashboard':
            return (
              <ProducerDashboard
                producer={currentUser}
                alerts={alerts}
                visits={visits}
                tasks={tasks}
                technicians={technicians}
                onNavigate={handleNavigate}
                visitNotes={producerVisitNotes}
                visitEvidence={producerVisitEvidence}
                onVisitNoteChange={handleProducerVisitNoteChange}
                onVisitEvidenceChange={handleProducerVisitEvidenceChange}
                visitFollowups={producerVisitFollowups}
                onVisitFollowupToggle={handleProducerVisitFollowupToggle}
                selfAssessment={selfAssessments[currentUser?.id]}
              />
            );
          case 'reportAlert':
            return <AlertReportForm producer={currentUser} onSubmitAlert={handleSubmitAlert} setModal={setModal} onNavigate={handleNavigate} />;
          
          // --- MODIFICADO: Case de Lista de Alertas ---
          case 'producerAlertList': 
            return <ProducerAlertList 
              producer={currentUser} 
              alerts={alerts} 
              technicians={technicians} 
              onNavigate={handleNavigate} 
              pageData={pageData} 
              onGenerateAlertPDF={handleGenerateAlertPDF} // <-- Pasa la función modificada
            />;

          case 'producerSelfCheck':
            return (
              <ProducerSelfCheck
                producer={currentUser}
                savedAssessment={selfAssessments[currentUser.id]}
                onSaveAssessment={handleSaveSelfAssessment}
                onNavigate={handleNavigate}
              />
            );
          
          case 'visitorApproval': 
            const myFincaIds = currentUser.fincas.map(f => f.id);
            const visitsToMe = visits.filter(v => myFincaIds.includes(v.fincaId));
            return <VisitorApprovalList producer={currentUser} visits={visitsToMe} onApproveVisit={handleApproveVisit} onRejectVisit={handleRejectVisit} pageData={pageData} onNavigate={handleNavigate} />;
          case 'producerVisitorLog': 
            const myFincaIdsLog = currentUser.fincas.map(f => f.id);
            const producerLog = visits.filter(v => myFincaIdsLog.includes(v.fincaId));
            return <ProducerVisitorLog producerLog={producerLog} onGeneratePDF={handleGeneratePDF} producer={currentUser} onNavigate={handleNavigate} />;
        case 'producerTasks':
          return (
            <ProducerTasks
              producer={currentUser}
              tasks={tasks}
              technicianActions={technicianActions}
              onCompleteTask={handleCompleteTask}
              onShowTraining={handleShowTraining}
              pageData={pageData}
              completedTrainingIds={completedTrainingIds}
              onValidateTechnicianAction={actionId =>
                handleValidateTechnicianAction(actionId, currentUser.name)
              }
              onNavigate={handleNavigate}
            />
          );
          case 'containmentPlans':
            const myPlans = containmentPlans.filter(p => p.producerId === currentUser.id);
            return <ContainmentPlanViewer
              producer={currentUser}
              plans={myPlans}
              fincas={currentUser.fincas}
              onUpdatePlanTask={handleUpdateTaskDetails} 
              onNavigate={handleNavigate}
            />;
          case 'producerCertification':
            return <ProducerCertification certificationHistory={certificationHistory} />;
          case 'producerClimateLab':
            return (
              <ProducerClimateLab
                producer={currentUser}
                onNavigate={handleNavigate}
              />
            );
          case 'imageAnalytics': {
            const producerFincaOptions = (currentUser.fincas || []).map(f => ({
              id: f.id,
              name: f.name,
              producerId: currentUser.id,
              producerName: currentUser.owner || currentUser.name
            }));
            const myAnalyses = imageAnalyses.filter(analysis => analysis.producerId === currentUser.id);
            return (
              <ImageAnalytics
                role="producer"
                currentUser={currentUser}
                fincas={producerFincaOptions}
                analyses={myAnalyses}
                onSaveAnalysis={handleSaveImageAnalysis}
              />
            );
          }
          case 'notifications':
            return <NotificationCenter
              notifications={notifications.filter(n => n.producerId === currentUser.id)}
              onMarkAsRead={handleMarkAsRead}
              onNavigate={handleNavigate}
            />;
          case 'producerProfile': 
            return <ProducerProfile 
              producer={currentUser} 
              onNavigate={handleNavigate} 
              onEditFinca={handleEditFinca}
            />;
          case 'producerSuspicionInbox': {
            const mySuspicions = workerSuspicions.filter(s => s.producerId === currentUser.id);
            return (
              <ProducerSuspicionInbox
                producer={currentUser}
                suspicions={mySuspicions}
                workers={workers}
                onConvertSuspicion={handleConvertSuspicionToAlert}
                onDismissSuspicion={handleDismissSuspicion}
                onNavigate={handleNavigate}
              />
            );
          }
          case 'fincaRegistration':
            return <FincaRegistration 
              onRegisterFinca={handleRegisterFinca} 
              onNavigate={handleNavigate}
              setModal={setModal}
              onUpdateFinca={handleUpdateFinca}
              fincaToEdit={fincaToEdit}
            />;
        case 'manageWorkers':
          const myWorkers = workers.filter(w => w.producerId === currentUser.id);
          const myWorkerIdsForManage = myWorkers.map(w => w.id);
          const myWorkerLogs = workLogs.filter(log => myWorkerIdsForManage.includes(log.workerId));
          return <ManageWorkers 
            workers={myWorkers} 
            labores={LABORES_FINCA}
            workLogs={myWorkerLogs}
            onRegisterWorker={handleRegisterWorker} 
            onNavigate={handleNavigate}
          />;
          case 'workLogViewer':
            const myWorkerIds = workers.filter(w => w.producerId === currentUser.id).map(w => w.id);
            const myCompletedWorkLogs = workLogs.filter(log => 
              myWorkerIds.includes(log.workerId) && log.status === 'completed'
            );
            return <WorkerLogViewer 
              workLogs={myCompletedWorkLogs}
              workers={workers}
              fincas={currentUser.fincas}
              cintasOptions={CINTAS_COSECHA}
              onNavigate={handleNavigate}
            />;
          case 'workerCheckInLog':
            const myAllWorkerIds = workers.filter(w => w.producerId === currentUser.id).map(w => w.id);
            const myAllWorkLogs = workLogs.filter(log => 
              myAllWorkerIds.includes(log.workerId)
            );
            return <WorkerCheckInLog 
              workerLog={myAllWorkLogs}
              onNavigate={handleNavigate}
            />;
          default:
            return (
              <ProducerDashboard
                producer={currentUser}
                alerts={alerts}
                visits={visits}
                tasks={tasks}
                technicians={technicians}
                onNavigate={handleNavigate}
                visitNotes={producerVisitNotes}
                visitEvidence={producerVisitEvidence}
                onVisitNoteChange={handleProducerVisitNoteChange}
                onVisitEvidenceChange={handleProducerVisitEvidenceChange}
                visitFollowups={producerVisitFollowups}
                onVisitFollowupToggle={handleProducerVisitFollowupToggle}
                selfAssessment={selfAssessments[currentUser?.id]}
              />
            );
        }

      case 'technician':
        switch (currentPage) {
          case 'technicianCommandCenter':
            return (
              <TechnicianCommandCenter
                currentUser={currentUser}
                alerts={alerts}
                visits={visits}
                tasks={tasks}
                technicianActions={technicianActions}
                onLogActionProgress={(actionId, note) =>
                  handleTechnicianActionProgress(actionId, note, currentUser.name)
                }
                onSubmitAction={(actionId, note) =>
                  handleTechnicianActionSubmit(actionId, note, currentUser.name)
                }
                onUpdateActionMeta={handleTechnicianActionMeta}
              />
            );
          case 'technicianSchedule':
            return <TechnicianSchedule technician={currentUser} alerts={alerts} onNavigate={handleNavigate} />;
          case 'technicianInspection':
            return <TechnicianInspectionCenter
              alert={pageData}
              onNavigate={handleNavigate}
              onSaveInspection={handleSaveInspectionModule} 
              setModal={setModal}
            />;
          case 'technicianProfile':
            return (
              <TechnicianProfile
                currentUser={currentUser}
                alerts={alerts}
                visits={visits}
                tasks={tasks}
                onSaveProfile={handleUpdateTechnicianProfile}
                onNavigate={handleNavigate}
              />
            );
          case 'imageAnalytics': {
            const technicianFincas = fincas.map(f => ({
              id: f.id,
              name: f.name,
              producerId: f.producerId,
              producerName: f.owner
            }));
            return (
              <ImageAnalytics
                role="technician"
                currentUser={currentUser}
                fincas={technicianFincas}
                analyses={imageAnalyses}
                onSaveAnalysis={handleSaveImageAnalysis}
              />
            );
          }
          default:
            return (
              <TechnicianCommandCenter
                currentUser={currentUser}
                alerts={alerts}
                visits={visits}
                tasks={tasks}
                technicianActions={technicianActions}
                onLogActionProgress={(actionId, note) =>
                  handleTechnicianActionProgress(actionId, note, currentUser.name)
                }
                onSubmitAction={(actionId, note) =>
                  handleTechnicianActionSubmit(actionId, note, currentUser.name)
                }
                onUpdateActionMeta={handleTechnicianActionMeta}
              />
            );
        }
      
      case 'worker':
        // ... (Sin cambios) ...
        const myProducer = producers.find(p => p.id === currentUser.producerId);
        const producerFincas = myProducer ? myProducer.fincas : [];
        switch (currentPage) {
          case 'workerProfile':
            return <WorkerProfile 
              worker={currentUser}
              labor={LABORES_FINCA.find(l => l.value === currentUser.labor)}
              laborOptions={LABORES_FINCA}
              onNavigate={handleNavigate}
              knowledgeCheck={workerKnowledgeChecks[currentUser.id]}
              needsKnowledgeCheck={workerNeedsKnowledgeCheck(currentUser.id)}
              trainingTask={workerTrainingTasks[currentUser.id]}
              onCompleteTraining={() => handleCompleteWorkerTraining(currentUser.id)}
              knowledgeQuestions={WORKER_KNOWLEDGE_QUESTIONS}
              onCompleteKnowledgeCheck={(result) => handleSaveWorkerKnowledgeCheck(currentUser.id, result)}
              onUpdateProfile={(updates) => handleUpdateWorkerProfile(currentUser.id, updates)}
              onLaunchTraining={handleShowTraining}
            />;
          case 'submitWorkLog':
            const myPendingLogs = workLogs.filter(log => 
              log.workerId === currentUser.id && log.status === 'pending'
            );
            return <SubmitWorkLog 
              fincas={producerFincas}
              pendingLogs={myPendingLogs} 
              onSubmitWorkLog={handleSubmitWorkLog}
              onNavigate={handleNavigate}
              cintasOptions={CINTAS_COSECHA}
              onSubmitSuspicion={handleSubmitSuspicion}
              worker={currentUser}
              knowledgeCheck={workerKnowledgeChecks[currentUser.id]}
              needsKnowledgeCheck={workerNeedsKnowledgeCheck(currentUser.id)}
              onCompleteKnowledgeCheck={(result) => handleSaveWorkerKnowledgeCheck(currentUser.id, result)}
              knowledgeQuestions={WORKER_KNOWLEDGE_QUESTIONS}
              trainingTask={workerTrainingTasks[currentUser.id]}
              onCompleteTraining={() => handleCompleteWorkerTraining(currentUser.id)}
            />;
          case 'workerTraining':
            return (
              <WorkerTrainingCenter
                worker={currentUser}
                knowledgeCheck={workerKnowledgeChecks[currentUser.id]}
                needsKnowledgeCheck={workerNeedsKnowledgeCheck(currentUser.id)}
                trainingTask={workerTrainingTasks[currentUser.id]}
                onCompleteTraining={() => handleCompleteWorkerTraining(currentUser.id)}
                knowledgeQuestions={WORKER_KNOWLEDGE_QUESTIONS}
                onCompleteKnowledgeCheck={(result) => handleSaveWorkerKnowledgeCheck(currentUser.id, result)}
                onLaunchTraining={handleShowTraining}
              />
            );
          default:
            return <WorkerProfile 
              worker={currentUser}
              labor={LABORES_FINCA.find(l => l.value === currentUser.labor)}
              laborOptions={LABORES_FINCA}
              onNavigate={handleNavigate}
              knowledgeCheck={workerKnowledgeChecks[currentUser.id]}
              needsKnowledgeCheck={workerNeedsKnowledgeCheck(currentUser.id)}
              trainingTask={workerTrainingTasks[currentUser.id]}
              onCompleteTraining={() => handleCompleteWorkerTraining(currentUser.id)}
              knowledgeQuestions={WORKER_KNOWLEDGE_QUESTIONS}
              onCompleteKnowledgeCheck={(result) => handleSaveWorkerKnowledgeCheck(currentUser.id, result)}
              onUpdateProfile={(updates) => handleUpdateWorkerProfile(currentUser.id, updates)}
              onLaunchTraining={handleShowTraining}
            />;
        }

      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  const isLoginOrPublicForm = currentPage === 'login' || currentPage === 'visitorAccessPage' || currentPage === 'visitorCheckIn';

  const unreadNotifications = userRole === 'producer'
    ? notifications.filter(n => n.producerId === currentUser?.id && !n.read).length
    : 0;

  // --- ESTRUCTURA PRINCIPAL DE LA APP (con Sidebar) ---
  return (
    <>
      {loading && <LoadingSpinner />}
      
      {modal.show && (
        <Modal
          message={modal.message}
          type={modal.type}
          onClose={() => setModal({ show: false, message: '' })}
        />
      )}
      
      {trainingModalTask && (
        <Modal
          title={`Capacitación: ${trainingModalTask.title}`}
          onClose={() => setTrainingModalTask(null)}
          size="large"
        >
          <div className="training-modal-content">
            <p>{trainingModalTask.description}</p>
            <div className="video-container">
              <YouTube 
                videoId={trainingModalTask.videoId} 
                opts={{
                  height: '390',
                  width: '640',
                  playerVars: {
                    autoplay: 1, 
                    controls: 1,
                  },
                }}
                onEnd={() => handleTrainingComplete(trainingModalTask)}
                className="youtube-iframe"
              />
            </div>
          </div>
        </Modal>
      )}
      
      {registerTechModal && (
        <Modal
          title="Registrar Nuevo Técnico"
          onClose={() => setRegisterTechModal(false)}
        >
          <RegisterTechnicianForm
            onSubmit={handleRegisterTechnician}
            onCancel={() => setRegisterTechModal(false)}
          />
        </Modal>
      )}
      
      {certHistoryModal && (
        <Modal
          title={`Desglose de la Revisión: ${certHistoryModal.date}`}
          onClose={() => setCertHistoryModal(null)}
          size="large"
        >
          <div className="historyModalContent">
            <div className="historyModalHeader">
              <h2 className="h2">Promedio: {certHistoryModal.averageScore}%</h2>
              <span 
                className={`tag ${certHistoryModal.status === 'Aprobado' ? 'tag-aprobado' : 'tag-no-aprobado'}`}
              >
                {certHistoryModal.status}
              </span>
            </div>
            <p>Este fue el desglose de puntajes para esta revisión:</p>
            <div className="progressGrid">
              {MOCK_INSPECTION_MODULES.map(module => (
                <ProgressBar 
                  key={module.id}
                  label={`${module.id}. ${module.name}`}
                  score={certHistoryModal.breakdown[module.name] || 0}
                />
              ))}
            </div>
          </div>
        </Modal>
      )}
      
      {!isLoginOrPublicForm && (
        <Header
          userRole={userRole}
          currentUser={currentUser} 
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          unreadNotifications={unreadNotifications}
        />
      )}
      
      {!isLoginOrPublicForm && (
        <Sidebar
          userRole={userRole}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          currentUser={currentUser}
        />
      )}
      
      <main className={!isLoginOrPublicForm ? 'mainContentWithSidebar' : 'mainContentFull'}>
        {renderPage()}
      </main>
    </>
  );
}

export default App;
  const handleTechnicianActionMeta = (actionId, meta) => {
    if (!meta) return;
    setTechnicianActions(prevActions =>
      prevActions.map(action => {
        if (action.id !== actionId) return action;
        return {
          ...action,
          meta: {
            ...(action.meta || {}),
            ...meta,
          },
        };
      })
    );
  };
