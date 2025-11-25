import React from 'react';

const AgroAliadosLogo = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 50" className={className} aria-label="AgroAliados Logo">
    <defs>
      {/* Gradiente Principal Tecnológico */}
      <linearGradient id="techGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" /> {/* Verde Luz */}
        <stop offset="100%" stopColor="#059669" /> {/* Verde Profundo */}
      </linearGradient>
      
      {/* Gradiente para el "Láser de Escaneo" */}
      <linearGradient id="scanLaser" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="transparent" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="transparent" />
      </linearGradient>
    </defs>
    
    {/* GRÁFICO: Ajusté el translate para pegarlo más al borde (x=5) */}
    <g transform="translate(5, 4)">
      {/* 1. EL ESCUDO */}
      <path 
        d="M20 2 C 20 2, 38 8, 38 20 C 38 30, 28 40, 20 44 C 12 40, 2 30, 2 20 C 2 8, 20 2, 20 2 Z" 
        fill="none" 
        stroke="url(#techGrad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* 2. EL CULTIVO (Hoja) */}
      <path 
        d="M20 36 C 20 36, 10 30, 10 20 C 10 14, 15 10, 20 10 C 25 10, 30 14, 30 20 C 30 30, 20 36, 20 36 Z" 
        fill="rgba(16, 185, 129, 0.25)" 
        stroke="none"
      />
      <path d="M20 36 L 20 14" stroke="url(#techGrad)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 28 L 28 22" stroke="url(#techGrad)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 22 L 12 18" stroke="url(#techGrad)" strokeWidth="1.5" strokeLinecap="round"/>

      {/* 3. EL LÁSER */}
      <rect x="6" y="10" width="28" height="2" fill="url(#scanLaser)" opacity="0.8">
        <animate attributeName="y" values="8;38;8" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
      </rect>
      
      {/* 4. NODOS */}
      <circle cx="20" cy="2" r="2" fill="#fff" />
      <circle cx="38" cy="20" r="1.5" fill="#34d399" />
      <circle cx="2" cy="20" r="1.5" fill="#34d399" />
      <circle cx="20" cy="44" r="2" fill="#fff" />
    </g>

    {/* TEXTO: Movido a x=48 (antes 55) para eliminar el espacio vacío */}
    <text x="48" y="33" fontFamily="'Inter', sans-serif" fontWeight="800" fontSize="26" fill="currentColor" letterSpacing="-0.02em">
      Agro<tspan fill="url(#techGrad)">Aliados</tspan>
    </text>
  </svg>
);

export default AgroAliadosLogo;