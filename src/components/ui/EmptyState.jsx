import React from 'react';
import Icon from './Icon';
import './EmptyState.css';

/**
 * Componente de Estado Vacío con estética premium
 */
const EmptyState = ({ iconPath, title, message, className = '', children, eyebrow = 'Sin registros', hint }) => {
  return (
    <div className={`emptyStateContainer surface-card ${className}`.trim()}>
      <div className="emptyStateHalo" aria-hidden="true" />
      <div className="emptyStateIcon">
        <Icon path={iconPath} size={60} />
      </div>
      <div className="emptyStateCopy">
        <span className="emptyStateEyebrow">{eyebrow}</span>
        <h2 className="emptyStateTitle">{title}</h2>
        <p className="emptyStateMessage">{message}</p>
        {hint && <p className="emptyStateHint">{hint}</p>}
      </div>
      {children && <div className="emptyStateActions">{children}</div>}
    </div>
  );
};

export default EmptyState;
