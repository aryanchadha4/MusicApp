export default function Card({ as: Component = 'section', tone = 'default', className = '', children, ...props }) {
  const rootClassName = ['ui-card', tone ? `ui-card--${tone}` : '', className].filter(Boolean).join(' ');

  return (
    <Component className={rootClassName} {...props}>
      {children}
    </Component>
  );
}
