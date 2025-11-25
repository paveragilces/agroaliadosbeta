// En: src/data/mockData.js
// --- ARCHIVO MODIFICADO ---

export const MOCK_PRODUCERS = [
  { 
    id: 'p1', 
    owner: 'Juan Valdez', 
    fincas: [
      { 
        id: 'f1', 
        name: 'Finca Santa Rita', 
        hectares: 50, 
        lotes: ['Lote 01', 'Lote 02', 'Lote 03 (Producción)', 'Lote 04'],
        location: { lat: -2.140, lon: -79.900 }
      },
      { 
        id: 'f2', 
        name: 'Hacienda El Sol', 
        hectares: 120, 
        lotes: ['Bloque A', 'Bloque B', 'Sector Nuevo'],
        location: { lat: -2.200, lon: -79.850 }
      }
    ]
  },
  { 
    id: 'p2', 
    owner: 'Maria Gomez',
    fincas: [
      { 
        id: 'f3', 
        name: 'El Gran Cacao', 
        hectares: 75, 
        lotes: ['Lote 1A', 'Lote 1B', 'Lote 2C'],
        location: { lat: -2.050, lon: -79.750 }
      }
    ]
  },
];

export const MOCK_FINCAS_FLAT = MOCK_PRODUCERS.flatMap(p => 
  p.fincas.map(f => ({...f, producerId: p.id, owner: p.owner}))
);

export const MOCK_TECHNICIANS_PROFILES = [
  { id: 't1', name: 'Carlos Ruiz', zone: 'Norte', specialties: ['Manejo de Sigatoka Negra', 'Nutrición y Fertilidad de Suelos'] },
  { id: 't2', name: 'Ana Mendoza', zone: 'Sur', specialties: ['Prevención Foc R4T (Fusarium)', 'Control de Moko (Ralstonia)', 'Auditoría de Bioseguridad'] },
  { id: 't3', name: 'Luis Torres', zone: 'Norte', specialties: ['Manejo de Cultivos Orgánicos', 'Buenas Prácticas Agrícolas (BPA)'] },
];

export const MOCK_ALERTS = [
  { id: 'a1', producerId: 'p1', fincaId: 'f1', lote: 'Lote 02', farmName: 'Finca Santa Rita', date: '2024-05-01', parts: {'Hoja': true}, symptoms: ['Amarillamiento de hojas bajas'], photos: {}, location: { lat: -2.14, lon: -79.9 }, status: 'pending', techId: null, visitDate: null, priority: null, managerComment: null, possibleDisease: null, inspectionData: null },
  { id: 'a2', producerId: 'p1', fincaId: 'f2', lote: 'Bloque A', farmName: 'Hacienda El Sol', date: '2024-05-03', parts: {'Fruto': true}, symptoms: ['Frutos pequeños o deformados'], photos: {}, location: { lat: -2.2, lon: -79.8 }, status: 'pending', techId: null, visitDate: null, priority: null, managerComment: null, possibleDisease: null, inspectionData: null },
  { id: 'a3', producerId: 'p1', fincaId: 'f1', lote: 'Lote 03 (Producción)', farmName: 'Finca Santa Rita', date: '2024-04-20', parts: {'Pseudotallo': true}, symptoms: ['Exudado viscoso al presionar corte'], photos: {"Pseudotallo":"data:image/png;base64,EVIDENCIA-MOCK-1.2"}, location: { lat: -2.145, lon: -79.905 }, status: 'completed', techId: 't2', visitDate: '2024-04-25', priority: 'Alta', managerComment: 'Revisar urgente Moko', possibleDisease: ['Moko'], 
    inspectionData: {
      audit: { 
        status: 'Completado',
        ratings: { '1.1': 5, '1.2': 2, '1.3': 4, '2.1': 5, '2.2': 3, '2.3': 3, '3.1': 5, '3.2': 4, '3.3': 5, '4.1': 5, '4.2': 4, '4.3': 5, '5.1': 3, '5.2': 5, '5.3': 5 },
        evidence: { '1.2': 'data:image/png;base64,EVIDENCIA-MOCK-1.2' },
      },
      drone: { 
        status: 'Completado',
        data: { altitude: '100', plan: 'libre', hectares: '10', observations: 'Vuelo sobre lote 5' },
      },
      plant: { 
        status: 'Completado',
        data: { 
          diagnosis: ['Moko'], 
          actions: ['Cuarentena', 'Muestreo'],
          incidence: 20, 
          severity: 10,  
          recommendations: 'Iniciar protocolo de bioseguridad Nivel 5. Eliminar plantas afectadas y aplicar cal.' 
        }
      }
    }
  },
  { id: 'a4', producerId: 'p1', fincaId: 'f1', lote: 'Lote 01', farmName: 'Finca Santa Rita', date: '2024-05-05', parts: {'Hoja': true}, symptoms: ['Marchitez o colapso de hojas'], photos: {}, location: { lat: -2.142, lon: -79.901 }, status: 'assigned', techId: 't1', visitDate: '2024-11-01', priority: 'Alta', managerComment: 'Posible Erwinia, revisar urgente.', possibleDisease: ['Erwinia'], inspectionData: null },
];

export const MOCK_VISITS = [
  { id: 'v1', producerId: 'p1', fincaId: 'f1', name: 'Carlos R.', company: 'AgroInsumos S.A.', purpose: 'Entrega de fertilizantes', valueChain: 'Insumos (Proveedor)', entryTime: '2024-11-01T09:00', exitTime: '2024-11-01T10:00', status: 'PENDING', qrData: null, risk: null, checkIn: null, checkOut: null, signature: null, idNumber: '0987654321', visitorPhoto: null, vehiclePhoto: null },
  { id: 'v2', producerId: 'p1', fincaId: 'f1', name: 'Ana Gomez', company: 'Fumigax', purpose: 'Fumigación', valueChain: 'Producción (Finca)', entryTime: '2024-11-02T14:00', exitTime: '2024-11-02T16:00', status: 'APPROVED', qrData: 'v2|1234567890|HIGH', risk: 'High', checkIn: null, checkOut: null, signature: null, idNumber: '1234567890', visitorPhoto: null, vehiclePhoto: null },
  { id: 'v3', producerId: 'p2', fincaId: 'f3', name: 'Luis Peña', company: 'Cartonera Nacional', purpose: 'Entrega cartón', valueChain: 'Insumos (Proveedor)', entryTime: '2024-11-01T11:00', exitTime: '2024-11-01T12:00', status: 'PENDING', qrData: null, risk: null, checkIn: null, checkOut: null, signature: null, idNumber: '1122334455', visitorPhoto: null, vehiclePhoto: null },
  { id: 'v4', producerId: 'p1', fincaId: 'f1', name: 'Visita Rechazada', company: 'Pesticidas S.A.', purpose: 'Auditoría Externa', valueChain: 'Certificación', entryTime: '2024-11-03T09:00', exitTime: '2024-11-03T10:00', status: 'DENIED', qrData: null, risk: 'High', checkIn: null, checkOut: null, signature: null, idNumber: '12345', visitorPhoto: null, vehiclePhoto: null },
  { id: 'v5', producerId: 'p1', fincaId: 'f1', name: 'Visita Completada', company: 'EcoCert', purpose: 'Visita de Certificadora', valueChain: 'Certificación', entryTime: '2024-11-01T09:00', exitTime: '2024-11-01T11:00', status: 'CHECKED_OUT', qrData: 'v5|55555|LOW', risk: 'Low', checkIn: '2024-11-01T09:05:00', checkOut: '2024-11-01T10:58:00', signature: 'data:image/png;base64,SIGNATURE-MOCK', idNumber: '55555', visitorPhoto: 'data:image/png;base64,VISITOR-MOCK', vehiclePhoto: 'data:image/png;base64,VEHICLE-MOCK' },
];

export const MOCK_TASKS = [
  {
    id: 'task-training-1',
    producerId: 'p1',
    alertId: 'a4',
    questionId: '1.2',
    title: 'Capacitación: refuerzo en pediluvios',
    description: 'Revisar con el personal el uso correcto de pediluvios y documentar evidencias fotográficas.',
    minWatchTime: 70,
    status: 'pending',
    owner: 'producer',
    createdAt: '2024-10-25T09:00:00Z'
  },
  {
    id: 'task-tech-briefing',
    producerId: 'p1',
    alertId: 'a4',
    questionId: '2.3',
    title: 'Checklist técnico de aislamiento',
    description: 'Verificar en campo el aislamiento de plantas sospechosas y documentar hallazgos.',
    status: 'pending',
    owner: 'technician',
    createdAt: '2024-10-28T07:30:00Z'
  }
]; 

export const MOCK_TECHNICIAN_ACTIONS = [
  {
    id: 'ta-01',
    alertId: 'a4',
    producerId: 'p1',
    fincaName: 'Finca Santa Rita',
    lote: 'Lote 01',
    techId: 't1',
    title: 'Toma de muestras confirmatorias',
    description: 'Recolectar muestras de pseudotallo y suelo para descartar presencia de Moko.',
    type: 'Muestreo',
    status: 'assigned',
    dueDate: '2024-11-04',
    requiresValidation: true,
    updates: [
      {
        id: 'ta-01-u1',
        authorRole: 'manager',
        authorName: 'Coordinación técnica',
        message: 'Priorizar lotes con síntomas activos y adjuntar fotografías.',
        timestamp: '2024-10-30T10:00:00Z'
      }
    ]
  },
  {
    id: 'ta-02',
    alertId: 'a3',
    producerId: 'p1',
    fincaName: 'Finca Santa Rita',
    lote: 'Lote 03',
    techId: 't2',
    title: 'Capacitación express al personal',
    description: 'Reunión rápida en empaque para repasar tips de detección temprana.',
    type: 'Capacitación',
    status: 'pending_validation',
    dueDate: '2024-10-20',
    requiresValidation: true,
    updates: [
      {
        id: 'ta-02-u1',
        authorRole: 'technician',
        authorName: 'Ana Mendoza',
        message: 'Entrenamiento completado con 12 personas, fotos cargadas al drive.',
        timestamp: '2024-10-20T12:45:00Z'
      }
    ]
  }
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', producerId: 'p1', date: '2024-04-22', text: 'El Gerente ha asignado la Alerta #a3 (Finca Santa Rita). El técnico Ana Mendoza visitará su finca el 2024-04-25.', read: true, link: 'producerDashboard' },
  { id: 'n2', producerId: 'p1', date: '2024-04-25', text: 'La inspección de la Alerta #a3 ha sido completada. Revise los resultados y tareas.', read: true, link: 'producerDashboard' },
  { id: 'n3', producerId: 'p1', date: '2024-05-05', text: 'Su Alerta #a4 (Finca Santa Rita) ha sido recibida y está siendo revisada por el gerente.', read: true, link: 'producerDashboard' },
  { id: 'n4', producerId: 'p1', date: '2024-05-06', text: 'El Gerente ha asignado la Alerta #a4 (Finca Santa Rita). El técnico Carlos Ruiz visitará su finca el 2024-11-01.', read: false, link: 'producerDashboard' },
  { id: 'n5', producerId: 'p1', date: '2024-10-30', text: 'La solicitud de visita de Carlos R. (AgroInsumos S.A.) para Finca Santa Rita está pendiente de aprobación.', read: false, link: 'visitorApproval' },
];

export const MOCK_IMAGE_ANALYSES = [];

export const MOCK_INSPECTION_MODULES = [
  { id: '1', name: 'Ingreso', questions: [
    { id: '1.1', text: '¿Existe control y registro de ingreso de personas y vehículos?' },
    { id: '1.2', text: '¿Se realiza desinfección de calzado, llantas y herramientas?' },
    { id: '1.3', text: '¿El personal usa ropa exclusiva para la finca o equipo limpio?' },
  ]},
  { id: '2', name: 'Producción', questions: [
    { id: '2.1', text: '¿Se limpian y desinfectan las herramientas después del uso?' },
    { id: '2.2', text: '¿Se controla el ingreso de personas ajenas a las áreas de cultivo?' },
    { id: '2.3', text: '¿Se identifican y aíslan plantas sospechosas o enfermas?' },
  ]},
  { id: '3', name: 'Infraestructura', questions: [
    { id: '3.1', text: '¿Los puntos de lavado y desinfección están operativos?' },
    { id: '3.2', text: '¿Se realiza limpieza frecuente en zonas comunes (bodegas, baños, comedores)?' },
    { id: '3.3', text: '¿El agua utilizada proviene de una fuente segura y tratada?' },
  ]},
  { id: '4', name: 'Empaque', questions: [
    { id: '4.1', text: '¿Se limpia y desinfecta el área de empaque antes de cada jornada?' },
    { id: '4.2', text: '¿Los materiales de empaque se almacenan en lugar limpio y cerrado?' },
    { id: '4.3', text: '¿Los vehículos que transportan fruta son inspeccionados y desinfectados antes del ingreso?' },
  ]},
  { id: '5', name: 'Gestión', questions: [
    { id: '5.1', text: '¿El personal ha recibido capacitación recente en bioseguridad?' },
    { id: '5.2', text: '¿Se mantiene registro de limpieza, ingreso y monitoreo de enfermedades?' },
    { id: '5.3', text: '¿Se dispone de productos de limpieza y desinfección aprobados?' },
  ]},
];

export const WORKER_KNOWLEDGE_QUESTIONS = [
  {
    id: 'symptom-1',
    category: 'síntomas',
    question: 'Al observar hojas con amarillamiento unilateral y colapso rápido, ¿qué acción tomas primero?',
    options: [
      'Registrar la planta, aislarla y avisar al encargado',
      'Cortar las hojas amarillas y continuar la jornada',
      'Aplicar fertilizante foliar inmediato',
      'Mover la planta a otro lote'
    ],
    answerIndex: 0
  },
  {
    id: 'disinfection-1',
    category: 'desinfección',
    question: 'Después de usar machetes en un lote sospechoso, ¿qué protocolo es correcto?',
    options: [
      'Ponerlos a la sombra hasta la próxima jornada',
      'Lavarlos con agua, luego desinfectar con solución aprobada',
      'Solo limpiar la hoja del machete',
      'Compartirlos con otro compañero para avanzar'
    ],
    answerIndex: 1
  },
  {
    id: 'residue-1',
    category: 'residuos',
    question: '¿Cómo manejas los residuos de plantas con síntomas cuarentenarios?',
    options: [
      'Se colocan en compostera general',
      'Se dejan en el piso para secarse',
      'Se embolsan, aíslan y se coordinan con el supervisor',
      'Se usan como abono inmediato'
    ],
    answerIndex: 2
  },
  {
    id: 'ingreso-1',
    category: 'ingreso',
    question: 'Al pasar de una finca externa a la tuya, ¿qué es obligatorio?',
    options: [
      'Solo reportar la visita',
      'Uso de ropa limpia y pasar por pediluvio/rodiluvio',
      'Cambiar botas únicamente',
      'Desinfectar solo las manos'
    ],
    answerIndex: 1
  },
  {
    id: 'general-1',
    category: 'general',
    question: '¿Cada cuánto revisas el nivel de la solución de desinfección en los recipientes?',
    options: [
      'Una vez al mes',
      'Cada vez que entras o sales del lote',
      'Cuando el supervisor lo indique',
      'Solo si se ve turbio'
    ],
    answerIndex: 1
  },
  {
    id: 'symptom-2',
    category: 'síntomas',
    question: 'Las rayas rojizas internas en pseudotallo son indicio de:',
    options: [
      'Moko o similar, se debe aislar',
      'Deficiencia de potasio',
      'Daño mecánico normal',
      'Ataque de insecto superficial'
    ],
    answerIndex: 0
  }
];


export const MOCK_CERTIFICATION_HISTORY = [
  { 
    id: 'h3', 
    date: '2024-10-01', 
    averageScore: 92, 
    status: 'Aprobado', 
    breakdown: { 'Ingreso': 95, 'Producción': 88, 'Infraestructura': 90, 'Empaque': 100, 'Gestión': 85 } 
  },
  { 
    id: 'h2', 
    date: '2024-06-01', 
    averageScore: 88, 
    status: 'No Aprobado', 
    breakdown: { 'Ingreso': 90, 'Producción': 75, 'Infraestructura': 85, 'Empaque': 98, 'Gestión': 90 } 
  },
  { 
    id: 'h1', 
    date: '2024-02-01', 
    averageScore: 82, 
    status: 'No Aprobado', 
    breakdown: { 'Ingreso': 80, 'Producción': 70, 'Infraestructura': 80, 'Empaque': 95, 'Gestión': 85 } 
  }
];

export const MOCK_WORKERS = [
  {
    id: 'w1',
    name: 'Carlos Alberto Solís',
    age: 34,
    experience: 5, 
    labor: 'deshije', 
    producerId: 'p1', 
    idNumber: '0912345678',
    qrCode: 'WORKER-w1-0912345678'
  },
  {
    id: 'w2',
    name: 'Maria Fernanda Ochoa',
    age: 28,
    experience: 2,
    labor: 'enfunde',
    producerId: 'p1',
    idNumber: '0987654321',
    qrCode: 'WORKER-w2-0987654321'
  },
  {
    id: 'w3',
    name: 'Luis Martinez',
    age: 45,
    experience: 15,
    labor: 'control_malezas',
    producerId: 'p2',
    idNumber: '0911111111',
    qrCode: 'WORKER-w3-0911111111'
  },
];

// --- CAMBIO: 'MOCK_WORK_LOGS' es ahora la fuente de verdad ---
export const MOCK_WORK_LOGS = [
  {
    id: 'wl1',
    workerId: 'w1',
    name: 'Carlos Alberto Solís',
    fincaId: 'f1', // Finca Santa Rita
    lote: 'Lote 01',
    labor: 'deshije',
    cintas: ['rojo'],
    date: '2025-11-05',
    checkIn: '2025-11-05T07:01:00', // <-- CAMPO AÑADIDO
    checkOut: '2025-11-05T16:05:00', // <-- CAMPO AÑADIDO
    status: 'completed', // <-- CAMPO AÑADIDO
    description: 'Deshije completo en hileras 1-10. Se encontraron 2 plantas con posible Moko, se marcaron y reportaron.'
  },
  {
    id: 'wl2',
    workerId: 'w2',
    name: 'Maria Fernanda Ochoa',
    fincaId: 'f1', // Finca Santa Rita
    lote: 'Lote 03 (Producción)',
    labor: 'enfunde',
    cintas: ['azul', 'verde'],
    date: '2025-11-05',
    checkIn: '2025-11-05T07:30:00',
    checkOut: '2025-11-05T16:01:00',
    status: 'completed',
    description: 'Enfunde de 150 racimos. Se usó funda tratada color azul.'
  },
  {
    id: 'wl3',
    workerId: 'w1',
    name: 'Carlos Alberto Solís',
    fincaId: 'f1',
    lote: 'Lote 02',
    labor: 'deshije',
    cintas: ['amarillo'],
    date: '2025-11-06',
    checkIn: '2025-11-06T07:05:00',
    checkOut: '2025-11-06T16:00:00',
    status: 'completed',
    description: 'Desmache en hileras 1-5.'
  },
  // --- Este es el log que creará el Check-In ---
  {
    id: 'wl4',
    workerId: 'w1',
    name: 'Carlos Alberto Solís',
    fincaId: null, // Aún no sabe
    lote: null, // Aún no sabe
    labor: null, // Aún no sabe
    cintas: [], // Aún no sabe
    date: '2025-11-07',
    checkIn: '2025-11-07T07:00:00', // Creado por Portería
    checkOut: null, // Abierto
    status: 'pending', // Pendiente de llenar
    description: ''
  }
];

// --- CAMBIO: ACTUALIZAR MOCK DE PLANES A LA NUEVA ESTRUCTURA (steps) ---
export const MOCK_CONTAINMENT_PLANS = [
  // Plan de ejemplo para el productor p1, basado en la alerta a3
  {
    id: 'plan-a3',
    producerId: 'p1',
    fincaId: 'f1',
    alertId: 'a3',
    lote: 'Lote 03 (Producción)',
    diseaseName: 'Moko',
    description: 'Protocolo de contención y erradicación para Moko. Requiere acción inmediata y estricta bioseguridad.',
    status: 'active', // 'active' o 'completed'
    createdAt: '2024-04-25T10:00:00Z',
    steps: [ // <-- CORREGIDO DE 'phases' A 'steps'
      {
        id: 'step-1', // <-- Corregido de 'phase-1'
        title: 'Semana 1-2: Shock y Contención',
        tasks: [
          { 
            id: 'a3-moko-1.1', 
            text: 'Cuarentena: Delimitar y señalizar "Zona Roja" (foco) y "Zona Amarilla" (buffer 5-10m).', 
            status: 'completed', 
            completedAt: '2024-04-26T10:00:00Z',
            log: [
              { user: 'Juan Valdez', date: '2024-04-26T09:00:00Z', comment: 'Se compró cinta de peligro y estacas.' },
              { user: 'Juan Valdez', date: '2024-04-26T10:00:00Z', comment: 'Lote delimitado según mapa del técnico.' }
            ], 
            evidencePhoto: 'data:image/png;base64,EVIDENCIA-MOCK-1.2' // Foto de ejemplo
          },
          { 
            id: 'a3-moko-1.2', 
            text: 'Instalar pediluvios (cal, amonio) en un único punto de acceso a la Zona Roja.', 
            status: 'in_progress', 
            completedAt: null,
            log: [
              { user: 'Juan Valdez', date: '2024-04-27T11:00:00Z', comment: 'Construyendo los cajones. Se compró cal.' }
            ], 
            evidencePhoto: null 
          },
          { 
            id: 'a3-moko-1.3', 
            text: 'Erradicación (Paso 1): Aplicar herbicida sistémico (Glifosato 20%) a plantas enfermas y 5m a la redonda.', 
            status: 'pending', 
            completedAt: null,
            log: [], 
            evidencePhoto: null 
          },
          { 
            id: 'a3-moko-1.4', 
            text: 'Control de Vectores: Eliminar flor masculina (bellota) en Zona Amarilla para evitar transmisión por insectos.', 
            status: 'pending', 
            completedAt: null,
            log: [], 
            evidencePhoto: null 
          },
        ]
      },
      {
        id: 'step-2', // <-- Corregido de 'phase-2'
        title: 'Semana 2-4: Erradicación y Limpieza',
        tasks: [
          { id: 'a3-moko-2.1', text: 'Erradicación (Paso 2): Una vez secas, trocear plantas in situ. Aplicar cal a los residuos.', status: 'pending', completedAt: null, log: [], evidencePhoto: null },
          { id: 'a3-moko-2.2', text: 'Bioseguridad: Desinfección estricta de herramientas entre CADA planta en la zona de trabajo.', status: 'pending', completedAt: null, log: [], evidencePhoto: null },
          { id: 'a3-moko-2.3', text: 'Monitoreo: Inspección visual semanal de la Zona Amarilla buscando nuevos síntomas.', status: 'pending', completedAt: null, log: [], evidencePhoto: null },
        ]
      },
      // ... más pasos si los tienes
    ]
  }
];
