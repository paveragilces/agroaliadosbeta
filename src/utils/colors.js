// Contenido para: src/utils/colors.js

/**
 * Convierte un color hexadecimal a un formato RGBA.
 * @param {string} hex - El color hexadecimal (ej. "#1f9d66").
 * @param {number} alpha - El valor de opacidad (de 0 a 1).
 * @returns {string} - El color en formato rgba (ej. "rgba(31, 157, 102, 1)").
 */
export const hexToRgba = (hex, alpha = 1) => {
  if (!hex) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const normalized = hex.replace('#', '');
  const isShort = normalized.length === 3;
  const value = isShort
    ? normalized
        .split('')
        .map(char => char + char)
        .join('')
    : normalized;

  const intVal = parseInt(value, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};