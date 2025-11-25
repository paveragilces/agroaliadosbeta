// src/components/ui/Button.jsx
import React from 'react';
import styles from './global-styles.module.css'; // Use global styles

function Button({
  variant = 'primary',
  onClick,
  children,
  type = 'button',
  className = '',
  ...props
}) {
  const baseClass = `${styles.btn} ${variant === 'secondary' ? styles.btnSecondary : styles.btnPrimary}`;

  return (
    <button
      type={type}
      className={`${baseClass} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
export default Button;
