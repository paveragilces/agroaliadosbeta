// Contenido para: src/config/roles.js
import { User, Briefcase, ClipboardCheck } from 'lucide-react';

export const ROLE_META = {
  producer: {
    label: 'Productor',
    accent: '#1f9d66',
    icon: User, // Componente de Lucide
  },
  manager: {
    label: 'Gerencia',
    accent: '#0f5d3b',
    icon: Briefcase, // Componente de Lucide
  },
  technician: {
    label: 'Técnico',
    accent: '#1f6feb',
    icon: ClipboardCheck, // Componente de Lucide
  },
  worker: {
    label: 'Trabajador',
    accent: '#ff7a45',
    icon: User, // Componente de Lucide
  },
  default: {
    label: 'Usuario',
    accent: '#2f855a',
    icon: User, // Componente de Lucide
  },
};