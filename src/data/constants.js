// En: src/data/constants.js
// --- ARCHIVO MODIFICADO ---

export const ALERT_SYMPTOMS_DATA = {
  'Externo': ['Amarillamiento de hojas bajas', 'Marchitez o colapso de hojas', 'Muerte apical / pseudotallo blando', 'Hojas jóvenes torcidas o con bordes secos'],
  'Fruto': ['Frutos pequeños o deformados', 'Pulpa con manchas marrón-rojizas', 'Exudado bacteriano ("ooze") en pedúnculo'],
  'Flor masculina': ['Necrosis o ennegrecimiento en el nudo floral'],
  'Pseudotallo': ['Amarillamiento de hojas bajas', 'Puntos café en haces vasculares longitudinales', 'Exudado viscoso al presionar corte'],
  'Hoja': ['Decoloración en pecíolos o base de hojas'],
  'Rizoma': ['Oscurecimiento en el corazón del rizoma'],
};

export const BANANA_DISEASES = ["Moko", "Erwinia", "Foc R4T", "Virosis", "Picudo", "Sigatoka Negra", "Mal de Panamá", "Pudrición de la corona", "Otro"];

export const TECHNICIAN_ACTIONS = ["Cuarentena", "Erradicación", "Muestreo", "Aplicación Química", "Control Biológico", "Recomendación Poda", "Otro"];

export const VISIT_PURPOSES = [
  "Inspección",
  "Venta de Insumos",
  "Entrega de Cartón",
  "Transporte de Fruta",
  "Mantenimiento",
  "Visita Administrativa",
  "Otra Visita"
];

export const VALUE_CHAIN_CATEGORIES = [
  "Producción (Personal de Finca)",
  "Agroinsumos (Proveedor)",
  "Transporte (Logística)",
  "Exportación (Cliente/Auditor)",
  "Servicios (Contratista)",
  "Otro"
];

export const MOCK_TASK_TEMPLATES = {
  '1.1': { 
    title: 'Revisar Protocolo de Registro de Ingreso', 
    description: 'Capacitación sobre la importancia de mantener un registro detallado de todo el personal y vehículos.',
    videoId: 'IRFEQzBmVj0',
    minWatchTime: 270 // Video largo
  },
  '1.2': { 
    title: 'Capacitación: Desinfección de Calzado y Llantas', 
    description: 'Video instructivo sobre la correcta preparación y uso de pediluvios y rodiluvios.\nAsegúrese de que todo el personal vea este video.',
    videoId: '9RpTyXCq8Rs',
    minWatchTime: 70 // Video de 1:19
  },
  '1.3': { 
    title: 'Revisar Política de Ropa de Trabajo', 
    description: 'Recordatorio sobre la política de uso exclusivo de ropa de trabajo dentro de la finca.',
    videoId: 'IRFEQzBmVj0',
    minWatchTime: 270 
  },
  '2.1': { 
    title: 'Taller: Limpieza de Herramientas (Amulación)', 
    description: 'Protocolo de limpieza y desinfección de herramientas (machetes, tijeras) entre lotes.',
    videoId: '9RpTyXCq8Rs',
    minWatchTime: 70
  },
  '2.2': { 
    title: 'Instalar y Mantener Barreras Vivas', 
    description: 'Instrucciones para colocar nueva señalética y reforzar la política de no ingreso a personal no autorizado.',
    videoId: '0PPLXC4EwNc',
    minWatchTime: 120 // Video de 2:15
  },
  '2.3': { 
    title: 'Protocolo de Identificación y Aislamiento de Plantas', 
    description: 'Capacitación sobre cómo marcar, aislar y reportar plantas con síntomas sospechosos (Moko, R4T).',
    videoId: 'IRFEQzBmVj0',
    minWatchTime: 270
  },
  '3.1': { 
    title: 'Revisar Puntos de Lavado', 
    description: 'Inspeccionar y reabastecer todos los puntos de lavado de manos y herramientas.',
    videoId: '9RpTyXCq8Rs',
    minWatchTime: 70
  },
  '3.2': { title: 'Reforzar Limpieza de Zonas Comunes', description: 'Revisar bitácora...', videoId: 'IRFEQzBmVj0', minWatchTime: 60 },
  '3.3': { title: 'Verificar Fuente de Agua', description: 'Tomar muestra...', videoId: 'IRFEQzBmVj0', minWatchTime: 60 },
  '4.1': { title: 'Protocolo de Limpieza de Empacadora', description: 'Video sobre el procedimiento...', videoId: '9RpTyXCq8Rs', minWatchTime: 70 },
  '4.2': { title: 'Revisar Almacenamiento de Materiales', description: 'Asegurar que los materiales...', videoId: 'IRFEQzBmVj0', minWatchTime: 60 },
  '4.3': { title: 'Inspección de Vehículos de Transporte', description: 'Checklist para la inspección...', videoId: 'IRFEQzBmVj0', minWatchTime: 60 },
  '5.1': { title: 'Re-Capacitación en Bioseguridad (General)', description: 'Video general de 5 minutos...', videoId: 'IRFEQzBmVj0', minWatchTime: 270 },
  '5.2': { title: 'Auditoría de Bitácoras y Registros', description: 'Asegurarse de que todos los registros...', videoId: 'IRFEQzBmVj0', minWatchTime: 60 },
  '5.3': { title: 'Inventario de Productos de Limpieza', description: 'Verificar stock...', videoId: 'IRFEQzBmVj0', minWatchTime: 60 },
};


export const LYTIKS_LOGO_URL = 'https://i.imgur.com/y8lq2Y6.png';
export const APP_VERSION = "1.2.0";

export const TECHNICIAN_SPECIALTIES = [
  'Manejo de Sigatoka Negra',
  'Control de Moko (Ralstonia)',
  'Prevención Foc R4T (Fusarium)',
  'Control de Nemátodos y Plagas de Suelo',
  'Control de Insectos Vectores (Picudo)',
  'Nutrición y Fertilidad de Suelos',
  'Manejo de Riego y Drenaje',
  'Manejo de Cultivos Orgánicos',
  'Auditoría de Bioseguridad',
  'Buenas Prácticas Agrícolas (BPA)'
];

export const LABORES_FINCA = [
  { label: 'Cosecha (Pullero)', value: 'cosecha_pullero', risk: 'Alto' },
  { label: 'Cosecha (Colero)', value: 'cosecha_colero', risk: 'Alto' },
  { label: 'Deshije / Desmache', value: 'deshije', risk: 'Alto' },
  { label: 'Deshoje / Cirugía', value: 'deshoje', risk: 'Alto' },
  { label: 'Enfundado / Embolse', value: 'enfunde', risk: 'Medio' },
  { label: 'Deschante / Desflore', value: 'deschante', risk: 'Medio' },
  { label: 'Amarre / Apuntalado', value: 'amarre', risk: 'Medio' },
  { label: 'Control de Malezas (Desbrosador)', value: 'control_malezas', risk: 'Bajo' },
  { label: 'Fertilización', value: 'fertilizacion', risk: 'Bajo' },
  { label: 'Riego', value: 'riego', risk: 'Bajo' },
  { label: 'Operador de Cable Vía (Cabrero)', value: 'cable_via', risk: 'Bajo' },
  { label: 'Empaque - Desmanador', value: 'empaque_desmane', risk: 'Crítico' },
  { label: 'Empaque - Lavado/Selección', value: 'empaque_lavado', risk: 'Crítico' },
];

// --- ¡NUEVA CONSTANTE AÑADIDA! ---
// Basado en el calendario de Dole y colores estándar
export const CINTAS_COSECHA = [
  { value: 'rojo', label: 'Rojo', color: '#E53935' },
  { value: 'amarillo', label: 'Amarillo', color: '#FDD835' },
  { value: 'azul', label: 'Azul', color: '#1E88E5' },
  { value: 'verde', label: 'Verde', color: '#43A047' },
  { value: 'blanco', label: 'Blanco', color: '#EEEEEE' },
  { value: 'naranja', label: 'Naranja', color: '#FB8C00' },
  { value: 'violeta', label: 'Violeta', color: '#8E24AA' },
  { value: 'celeste', label: 'Celeste', color: '#03A9F4' },
  { value: 'negro', label: 'Negro', color: '#424242' },
  { value: 'gris', label: 'Gris', color: '#BDBDBD' },
];