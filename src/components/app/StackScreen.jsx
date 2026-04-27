import { Link } from 'react-router-dom';
import ScreenShell from './ScreenShell';

export default function StackScreen({
  backTo,
  backLabel = 'Back',
  eyebrow,
  title,
  subtitle,
  actions = null,
  children,
  className = '',
}) {
  const headerActions = (
    <div className="stack-screen__actions">
      {backTo ? (
        <Link to={backTo} className="stack-screen__back">
          {backLabel}
        </Link>
      ) : null}
      {actions}
    </div>
  );

  return (
    <ScreenShell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={headerActions}
      className={['stack-screen', className].filter(Boolean).join(' ')}
    >
      {children}
    </ScreenShell>
  );
}
