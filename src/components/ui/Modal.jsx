import React, { useEffect } from 'react';
import './Modal.css';

/**
 * Componente Modal
 */
const Modal = ({ title, children, message, type = 'info', onClose, size }) => {
  const titleMap = {
    success: 'Éxito',
    error: 'Error',
    info: 'Aviso',
  };
  
  const modalTitle = title || titleMap[type];

  const modalContentClasses = `
    modalContent
    ${size === 'large' ? 'large' : ''}
  `;

  const modalTitleClasses = `
    modalTitle
    ${title ? 'info' : type}
  `;

  const modalBodyClasses = `
    modalBody
    ${size === 'large' ? 'left' : ''}
  `;

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className={modalContentClasses} onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <h2 className={modalTitleClasses}>
            {modalTitle}
          </h2>
          <button className="modalClose" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className={modalBodyClasses}>
          {message && <p>{message}</p>}
          {children}
        </div>
        <footer className="modalFooter">
          <button className="modalButton" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Modal;
