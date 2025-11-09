import React from 'react';
import './Sidebar.css';
import { ROLE_META } from '../../config/roles'; // <-- IMPORTADO
// Se eliminó la importación de 'hexToRgba' porque ya no se usa aquí

// --- Iconos de Lucide-React ---
import {
  Sprout,
  LayoutDashboard,
  User,
  AlertTriangle,
  ListTodo,
  ShieldCheck,
  CheckCircle,
  Users,
  FileText,
  ClipboardList,
  Calendar,
  ClipboardCheck,
} from 'lucide-react';

const SidebarButton = ({ page, iconComponent, label, isSelected, onNavigate }) => {
  const IconComponent = iconComponent; // Renombramos para que JSX lo reconozca
  return (
    <button
      type="button"
      className={`sidebarButton ${isSelected ? 'selected' : ''}`}
      onClick={() => onNavigate(page)}
    >
      <span className="sidebarButtonIcon">
        <IconComponent size={18} />
      </span>
      <span className="sidebarButtonLabel">{label}</span>
    </button>
  );
};

const SidebarSection = ({ title, children }) => (
  <div className="sidebarSection">
    {title && <h4 className="sidebarSectionTitle">{title}</h4>}
    <div className="sidebarSectionBody">{children}</div>
  </div>
);

// Nota: Se eliminó 'currentUser' de las props porque ya no se usa
const Sidebar = ({ userRole, currentPage, onNavigate }) => {
  if (!userRole) return null;

  // Solo necesitamos el 'accent' para los botones seleccionados
  const roleMeta = ROLE_META[userRole] || ROLE_META.default;

  return (
    <aside className="sidebar" style={{ '--sidebar-accent': roleMeta.accent }}>
      <div className="sidebarInner">
        <div className="sidebarHeader">
          <span className="sidebarBrandIcon">
            <Sprout size={22} />
          </span>
          <span className="sidebarBrandTitle">AgroAliados</span>
        </div>

        {/* --- BLOQUE ELIMINADO --- 
          Ya no se renderiza el <div className="sidebarUser">...</div>
          El 'gap' en .sidebarInner se encargará de espaciar 
          correctamente el header de la navegación.
        */}

        <nav className="sidebarNav">
          {userRole === 'producer' && (
            <>
              <SidebarSection title="Principal">
                <SidebarButton
                  page="producerDashboard"
                  iconComponent={LayoutDashboard}
                  label="Dashboard"
                  isSelected={currentPage === 'producerDashboard'}
                  onNavigate={onNavigate}
                />
                <SidebarButton
                  page="producerProfile"
                  iconComponent={User}
                  label="Mis Fincas"
                  isSelected={currentPage === 'producerProfile'}
                  onNavigate={onNavigate}
                />
              </SidebarSection>

              <SidebarSection title="Alertas y tareas">
                <SidebarButton
                  page="producerAlertList"
                  iconComponent={AlertTriangle}
                  label="Registro de alertas"
                  isSelected={currentPage === 'producerAlertList'}
                  onNavigate={onNavigate}
                />
                <SidebarButton
                  page="producerTasks"
                  iconComponent={ListTodo}
                  label="Tareas pendientes"
                  isSelected={currentPage === 'producerTasks'}
                  onNavigate={onNavigate}
                />
                <SidebarButton
                  page="containmentPlans"
                  iconComponent={ShieldCheck}
                  label="Planes de contención"
                  isSelected={currentPage === 'containmentPlans'}
                  onNavigate={onNavigate}
                />
              </SidebarSection>

              <SidebarSection title="Gestión de finca">
                <SidebarButton
                  page="visitorApproval"
                  iconComponent={CheckCircle}
                  label="Aprobar visitas"
                  isSelected={currentPage === 'visitorApproval'}
                  onNavigate={onNavigate}
                />
                <SidebarButton
                  page="manageWorkers"
                  iconComponent={Users}
                  label="Mis trabajadores"
                  isSelected={currentPage === 'manageWorkers'}
                  onNavigate={onNavigate}
                />
                <SidebarButton
                  page="producerVisitorLog"
                  iconComponent={FileText}
                  label="Log de visitas"
                  isSelected={currentPage === 'producerVisitorLog'}
                  onNavigate={onNavigate}
                />
                <SidebarButton
                  page="workLogViewer"
                  iconComponent={ClipboardList}
                  label="Registro de labores"
                  isSelected={currentPage === 'workLogViewer'}
                  onNavigate={onNavigate}
                />
              </SidebarSection>

              <SidebarSection title="Certificación">
                <SidebarButton
                  page="producerCertification"
                  iconComponent={ShieldCheck}
                  label="Bioseguridad"
                  isSelected={currentPage === 'producerCertification'}
                  onNavigate={onNavigate}
                />
              </SidebarSection>
            </>
          )}

          {userRole === 'manager' && (
            <SidebarSection title="Panel de control">
              <SidebarButton
                page="managerDashboard"
                iconComponent={LayoutDashboard}
                label="Dashboard"
                isSelected={currentPage === 'managerDashboard'}
                onNavigate={onNavigate}
              />
              <SidebarButton
                page="alertTriage"
                iconComponent={AlertTriangle}
                label="Alertas"
                isSelected={currentPage === 'alertTriage'}
                onNavigate={onNavigate}
              />
              <SidebarButton
                page="technicianControl"
                iconComponent={ClipboardCheck}
                label="Técnicos"
                isSelected={currentPage === 'technicianControl'}
                onNavigate={onNavigate}
              />
              <SidebarButton
                page="visitorReport"
                iconComponent={FileText}
                label="Visitas"
                isSelected={currentPage === 'visitorReport'}
                onNavigate={onNavigate}
              />
            </SidebarSection>
          )}

          {userRole === 'technician' && (
            <SidebarSection title="Mi operación">
              <SidebarButton
                page="technicianSchedule"
                iconComponent={Calendar}
                label="Mi agenda"
                isSelected={currentPage === 'technicianSchedule'}
                onNavigate={onNavigate}
              />
              <SidebarButton
                page="technicianProfile"
                iconComponent={User}
                label="Mi perfil"
                isSelected={currentPage === 'technicianProfile'}
                onNavigate={onNavigate}
              />
            </SidebarSection>
          )}

          {userRole === 'worker' && (
            <SidebarSection title="Mi jornada">
              <SidebarButton
                page="workerProfile"
                iconComponent={User}
                label="Mi perfil / QR"
                isSelected={currentPage === 'workerProfile'}
                onNavigate={onNavigate}
              />
              <SidebarButton
                page="submitWorkLog"
                iconComponent={ListTodo}
                label="Registrar labor"
                isSelected={currentPage === 'submitWorkLog'}
                onNavigate={onNavigate}
              />
            </SidebarSection>
          )}
        </nav>
      </div>

      <footer className="sidebarFooter">
        <div className="sidebarFooterInner">
          <span className="sidebarFooterLabel">© {new Date().getFullYear()} AgroAliados</span>
          <div className="footerLogoContainer">
            <img
              src="https://res.cloudinary.com/do4vybtt4/image/upload/v1762369002/Lytiks-02_indfgk.svg"
              alt="Lytiks"
              className="footerLogo"
            />
          </div>
        </div>
      </footer>
    </aside>
  );
};

export default Sidebar;