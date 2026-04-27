function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'MD';
  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

export default function Avatar({ src = '', name = '', size = 'md', className = '', alt = '' }) {
  const rootClassName = ['ui-avatar', size ? `ui-avatar--${size}` : '', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} aria-hidden={alt ? undefined : 'true'}>
      {src ? <img src={src} alt={alt || `${name || 'User'} avatar`} className="ui-avatar__image" /> : null}
      {!src ? <span className="ui-avatar__fallback">{getInitials(name)}</span> : null}
    </div>
  );
}
