import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import CountUp from 'react-countup';
import { ReactTyped } from 'react-typed';
import { Toaster, toast } from 'sonner';
import BiosecurityBackground from './BiosecurityBackground';
import AgroAliadosLogo from './AgroAliadosLogo';
import './LoginScreen.css';

// Iconos
import {
  Briefcase, ClipboardCheck, User, LogIn, LayoutDashboard,
  UserPlus, ArrowLeft, CloudSun, ScanEye, ShieldCheck, 
  ArrowRight, Building, LineChart, GraduationCap, QrCode, CheckCircle2,
  ThermometerSun
} from 'lucide-react';

// --- ANIMACIONES FRAMER ---
const fadeInUp = { 
  hidden: { opacity: 0, y: 20 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } 
};

const stagger = { 
  visible: { transition: { staggerChildren: 0.1 } } 
};

// --- CONFIGURACIÓN TILT ---
const defaultTiltOptions = { 
  reverse: true, max: 8, scale: 1.02, speed: 1000, transition: true, glare: true, "max-glare": 0.2, "glare-prerender": false 
};

// --- ANIMACIONES SPOTLIGHT ---
const cardVariants = {
  rest: { scale: 1, borderColor: "rgba(0,0,0,0.06)", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)" },
  hover: { scale: 1.02, borderColor: "rgba(16, 185, 129, 0.4)", boxShadow: "0 12px 24px -8px rgba(16, 185, 129, 0.15)", transition: { duration: 0.3, ease: "easeOut" } },
  tap: { scale: 0.98, transition: { duration: 0.1 } }
};

const scannerVariants = {
  animate: { x: ['-100%', '200%'], opacity: [0, 0.5, 0], transition: { duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 } }
};

// --- CONTENIDO ---
const HERO_FEATURES = [
  { icon: CloudSun, title: 'Clima y Riesgos en Vivo', desc: 'Pronóstico y alertas meteo integradas para anticipar amenazas.' },
  { icon: ScanEye, title: 'Lectura Visual (RGB)', desc: 'Análisis de imagen para detectar signos tempranos en cultivos.' },
  { icon: GraduationCap, title: 'Capacitación y Trazabilidad', desc: 'Cursos continuos y accesos auditables ligados a QR.' }
];

const LoginScreen = ({ onLogin }) => {
  const [view, setView] = useState('main');
  const [isLoading, setIsLoading] = useState(true);
  const gridRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const typedEnabled = !prefersReducedMotion;

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsLoading(false);
      return undefined;
    }
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  const handleMouseMove = (e) => {
    if (!gridRef.current) return;
    const cards = gridRef.current.getElementsByClassName("spotlight-card");
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    }
  };

  const handleRoleLogin = (role, subRole) => {
    // 1. Feedback inmediato de carga
    const toastId = toast.loading('Validando credenciales...');

    // 2. Simulación de proceso seguro
    setTimeout(() => {
      // 3. Éxito (Sin confeti, solo notificación elegante)
      toast.dismiss(toastId);
      
      toast.success(`Acceso Autorizado: ${role}`, {
        icon: <CheckCircle2 size={18} className="text-green-500" />,
        description: 'Redirigiendo al entorno seguro...',
        style: { border: '1px solid #10b981', background: '#ecfdf5' }
      });

      // 4. Redirección real
      setTimeout(() => {
        if (onLogin) onLogin(role, subRole);
      }, 1000);
    }, 1500);
  };

  const handleSupportClick = () => {
    toast('Solicitud enviada a TI', { icon: <ShieldCheck size={18} className="text-blue-500" />, description: 'El soporte técnico revisará tu caso prioritario.' });
  };

  return (
    <div className="loginScreen">
      <Toaster position="top-center" richColors theme="light" style={{ fontFamily: 'Inter, sans-serif' }} />
      
      <BiosecurityBackground />

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="splash" className="splashScreen"
            initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }} transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="splashContent">
              <AgroAliadosLogo className="splashLogo" />
              <div className="loadingBarContainer">
                <motion.div className="loadingBar" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.2, ease: "easeInOut" }} />
              </div>
              <div className="splashText">
                {typedEnabled ? (
                  <ReactTyped strings={['INICIALIZANDO PROTOCOLOS...', 'CONECTANDO SATÉLITE...', 'SISTEMA LISTO.']} typeSpeed={40} backSpeed={0} startDelay={200} showCursor={false} />
                ) : (
                  <span>Sistema listo.</span>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="loginShell">
            {/* HERO */}
            <motion.section className="loginHero dark-glass" initial="hidden" animate="visible" variants={stagger}>
              <motion.header variants={fadeInUp} className="heroHeader">
                <AgroAliadosLogo className="heroLogo" />
                <div className="liveBadge">
                  <span className="dotpulse"></span>
                  {typedEnabled ? (
                    <ReactTyped strings={['CLIMA EN VIVO', 'ANÁLISIS RGB', 'TRAZABILIDAD QR']} typeSpeed={40} backSpeed={50} backDelay={2000} loop showCursor={false} className="font-mono"/>
                  ) : (
                    <span className="font-mono">CLIMA EN VIVO · ANÁLISIS RGB · TRAZABILIDAD QR</span>
                  )}
                </div>
              </motion.header>

              <motion.div variants={fadeInUp} className="heroContent">
                <h1 className="heroTitle">Gestión inteligente: <br /><span className="text-highlight">
                  {typedEnabled ? (
                    <ReactTyped strings={['Clima.', 'Visión.', 'Seguridad.']} typeSpeed={60} backSpeed={40} backDelay={2500} loop cursorChar="|"/>
                  ) : (
                    'Clima · Visión · Seguridad'
                  )}
                </span></h1>
                <p className="heroSubtitle">Coordina accesos, clima, análisis de imagen y capacitación desde una interfaz clara y elegante.</p>
              </motion.div>

              <motion.div className="liveMetricsDeck" variants={fadeInUp}>
                <Tilt {...defaultTiltOptions} className="metricTilt">
                  <div className="metricCard glass-panel">
                    <div className="metricIcon" style={{color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)'}}><ThermometerSun size={20} /></div>
                    <div><span className="metricValue"><CountUp end={28} duration={2} suffix="°C" /></span><span className="metricLabel">Microclima</span></div>
                  </div>
                </Tilt>
                <Tilt {...defaultTiltOptions} className="metricTilt">
                  <div className="metricCard glass-panel">
                    <div className="metricIcon" style={{color: '#34d399', background: 'rgba(52, 211, 153, 0.15)'}}><ScanEye size={20} /></div>
                    <div><span className="metricValue"><CountUp end={98} duration={3} suffix="%" /></span><span className="metricLabel">Precisión RGB</span></div>
                  </div>
                </Tilt>
              </motion.div>

              <div className="featureList">
                {HERO_FEATURES.map((feat, idx) => (
                  <motion.div key={idx} className="featureItem" variants={fadeInUp}>
                    <div className="featureIcon"><feat.icon size={20} /></div>
                    <div className="featureText"><h4>{feat.title}</h4><p>{feat.desc}</p></div>
                  </motion.div>
                ))}
              </div>

              <motion.div className="heroCTA" variants={fadeInUp}>
                <p className="ctaText">¿Buscas potenciar tu bioseguridad?</p>
                <button className="ctaButton" onClick={handleSupportClick}>Solicitar Demo <ArrowRight size={14} /></button>
              </motion.div>

              <motion.footer variants={fadeInUp} className="heroFooter">
                <p>Powered by <strong>Lytiks</strong></p>
              </motion.footer>
            </motion.section>

            {/* PANEL DERECHO */}
            <motion.section 
              className="loginPanel light-glass" 
              layout 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.7, delay: 0.2, layout: { duration: 0.3 } }}
            >
              <AnimatePresence mode="wait">
                {view === 'main' && (
                  <motion.div key="main" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="panelContent">
                    <header className="panelHeader"><span className="panelTag">Acceso Unificado</span><h2>Bienvenido</h2><p>Selecciona el flujo operativo.</p></header>
                    <div className="loginCardGrid" ref={gridRef} onMouseMove={handleMouseMove}>
                      <Tilt {...defaultTiltOptions} glareColor="#ffffff" glareMaxOpacity={0.1}>
                        <motion.button className="modernCard spotlight-card" onClick={() => setView('admin')} variants={cardVariants} initial="rest" whileHover="hover" whileTap="tap">
                          <div className="spotlight-bg"></div><motion.div className="card-scanner" variants={scannerVariants} animate="animate" />
                          <div className="modernIconBox blue-theme"><LayoutDashboard size={24} strokeWidth={2} /></div>
                          <div className="modernCardContent"><div className="cardTitleRow"><h3>Portal Administrativo</h3><ArrowRight size={16} className="arrowIcon" /></div><p>Gerentes, Productores y Técnicos.</p></div>
                        </motion.button>
                      </Tilt>
                      <Tilt {...defaultTiltOptions} glareColor="#ffffff" glareMaxOpacity={0.1}>
                        <motion.button className="modernCard spotlight-card" onClick={() => setView('finca')} variants={cardVariants} initial="rest" whileHover="hover" whileTap="tap">
                          <div className="spotlight-bg"></div><motion.div className="card-scanner" variants={scannerVariants} animate="animate" style={{transitionDelay:'1s'}} />
                          <div className="modernIconBox green-theme"><QrCode size={24} strokeWidth={2} /></div>
                          <div className="modernCardContent"><div className="cardTitleRow"><h3>Ingreso a Finca</h3><ArrowRight size={16} className="arrowIcon" /></div><p>Visitantes y Portería (QR).</p></div>
                        </motion.button>
                      </Tilt>
                      <Tilt {...defaultTiltOptions} glareColor="#ffffff" glareMaxOpacity={0.1}>
                        <motion.button className="modernCard spotlight-card" onClick={() => handleRoleLogin('worker')} variants={cardVariants} initial="rest" whileHover="hover" whileTap="tap">
                          <div className="spotlight-bg"></div><motion.div className="card-scanner" variants={scannerVariants} animate="animate" style={{transitionDelay:'2s'}} />
                          <div className="modernIconBox orange-theme"><UserPlus size={24} strokeWidth={2} /></div>
                          <div className="modernCardContent"><div className="cardTitleRow"><h3>Portal Trabajador</h3><ArrowRight size={16} className="arrowIcon" /></div><p>Bitácoras y Cintas de Cosecha.</p></div>
                        </motion.button>
                      </Tilt>
                    </div>
                  </motion.div>
                )}
                {(view === 'admin' || view === 'finca') && (
                  <motion.div key="subview" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="panelContent">
                    <button className="backLink" onClick={() => setView('main')}><ArrowLeft size={16} /> Regresar</button>
                    <header className="panelHeader"><h2>{view === 'admin' ? 'Administración' : 'Accesos Finca'}</h2><p>Selecciona tu rol.</p></header>
                    <div className="buttonList">
                      {view === 'admin' ? (
                        <>
                          <button className="listBtn" onClick={() => handleRoleLogin('producer')}><LineChart size={18} /> <strong>Productor:</strong> Gestión</button>
                          <button className="listBtn" onClick={() => handleRoleLogin('manager')}><Briefcase size={18} /> <strong>Gerente:</strong> Coordinación</button>
                          <button className="listBtn" onClick={() => handleRoleLogin('technician')}><ClipboardCheck size={18} /> <strong>Técnico:</strong> Inspección</button>
                        </>
                      ) : (
                        <>
                          <button className="listBtn" onClick={() => handleRoleLogin('public', 'visitorForm')}><User size={18} /> <strong>Visitante:</strong> Solicitar Acceso</button>
                          <button className="listBtn" onClick={() => handleRoleLogin('public', 'visitorCheckIn')}><ShieldCheck size={18} /> <strong>Portería:</strong> Escanear QR</button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;
