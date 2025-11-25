import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Componente de Icono SVG Genérico con soporte para lucide-react.
 * Si se pasa un `name` y existe en lucide, se renderiza el icono vectorial,
 * de lo contrario cae al path SVG tradicional.
 */
const Icon = ({
  name,
  path,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
  className = '',
  ...rest
}) => {
  if (name && LucideIcons[name]) {
    const LucideComponent = LucideIcons[name];
    return (
      <LucideComponent
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        className={className}
        {...rest}
      />
    );
  }

  if (path) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        style={{ flexShrink: 0 }}
        className={className}
        {...rest}
      >
        <path d={path} />
      </svg>
    );
  }

  return null;
};

export default Icon;
