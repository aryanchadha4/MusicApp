export default function Spinner({ size = 'md', label = 'Loading', className = '' }) {
  const rootClassName = ['ui-spinner', size ? `ui-spinner--${size}` : '', className].filter(Boolean).join(' ');

  return (
    <span className={rootClassName} role="status" aria-label={label}>
      <span className="ui-spinner__ring" aria-hidden="true" />
    </span>
  );
}
