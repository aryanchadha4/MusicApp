import { Link } from 'react-router-dom';
import Spinner from './Spinner';

function getClassName({ variant, size, block, iconOnly, className }) {
  return [
    'ui-button',
    variant ? `ui-button--${variant}` : '',
    size ? `ui-button--${size}` : '',
    block ? 'ui-button--block' : '',
    iconOnly ? 'ui-button--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  block = false,
  iconOnly = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const classes = getClassName({ variant, size, block, iconOnly, className });
  const isDisabled = loading || disabled;
  const content = (
    <>
      {loading ? <Spinner size="sm" className="ui-button__spinner" label="Loading" /> : null}
      <span className="ui-button__label">{children}</span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        tabIndex={isDisabled ? -1 : props.tabIndex}
        {...props}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        tabIndex={isDisabled ? -1 : props.tabIndex}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button className={classes} disabled={isDisabled} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
