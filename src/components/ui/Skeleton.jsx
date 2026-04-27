export default function Skeleton({ className = '', style, variant = 'line' }) {
  const rootClassName = ['ui-skeleton', variant ? `ui-skeleton--${variant}` : '', className].filter(Boolean).join(' ');
  return <span className={rootClassName} style={style} aria-hidden="true" />;
}
