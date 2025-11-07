// En: src/components/ui/ColorPaletteSelector/ColorPaletteSelector.jsx
// --- NUEVO ARCHIVO ---

import React from 'react';
import Icon from '../Icon';
import { ICONS } from '../../../config/icons';
import './ColorPaletteSelector.css';

/**
 * Componente de UI para seleccionar múltiples colores de una paleta.
 * @param {Array} options - Array de objetos { value, label, color (hex) }
 * @param {Array} selected - Array de 'values' seleccionados
 * @param {Function} onChange - Función que devuelve el nuevo array de 'values'
 */
const ColorPaletteSelector = ({ options, selected, onChange }) => {

  const handleToggle = (colorValue) => {
    // Revisa si el color ya está seleccionado
    if (selected.includes(colorValue)) {
      // Si está, lo quita (deselecciona)
      onChange(selected.filter(v => v !== colorValue));
    } else {
      // Si no está, lo añade (selecciona)
      onChange([...selected, colorValue]);
    }
  };

  return (
    <div className="color-palette-grid">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            type="button"
            key={option.value}
            className={`color-swatch ${isSelected ? 'selected' : ''}`}
            // Definimos la variable CSS '--swatch-color'
            style={{ '--swatch-color': option.color }} 
            title={option.label}
            onClick={() => handleToggle(option.value)}
          >
            {isSelected && <Icon path={ICONS.checkCircle} size={16} />}
            <span className="color-swatch-label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ColorPaletteSelector;