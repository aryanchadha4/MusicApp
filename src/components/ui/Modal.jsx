import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import HeaderBlock from './HeaderBlock';

export default function Modal({
  open,
  onClose,
  title,
  description,
  actions = null,
  children,
  size = 'md',
  presentation = 'sheet',
  eyebrow = 'Modal',
  showCloseButton = true,
  className = '',
  bodyClassName = '',
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const headerActions = actions || showCloseButton ? (
    <div className="ui-modal__header-actions">
      {actions}
      {showCloseButton ? (
        <button type="button" className="ui-modal__close" onClick={onClose}>
          Close
        </button>
      ) : null}
    </div>
  ) : null;

  return createPortal(
    <div
      className={['ui-modal-backdrop', presentation ? `ui-modal-backdrop--${presentation}` : ''].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label={title || eyebrow || 'Dialog'}
      onClick={onClose}
    >
      <div className={['ui-modal', size ? `ui-modal--${size}` : '', presentation ? `ui-modal--${presentation}` : '', className].filter(Boolean).join(' ')} onClick={(event) => event.stopPropagation()}>
        {presentation === 'sheet' ? <div className="ui-modal__handle" aria-hidden="true" /> : null}
        {(title || description || headerActions) ? (
          <HeaderBlock eyebrow={eyebrow} title={title} subtitle={description} actions={headerActions} className="ui-modal__header" />
        ) : null}
        <div className={['ui-modal__body', bodyClassName].filter(Boolean).join(' ')}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
