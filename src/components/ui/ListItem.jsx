import { Link } from 'react-router-dom';

export default function ListItem({
  to,
  leading = null,
  title,
  subtitle = null,
  meta = null,
  trailing = null,
  interactive = false,
  className = '',
  children = null,
  ...props
}) {
  const Component = to ? Link : 'div';
  const rootClassName = [
    'ui-list-item',
    interactive || to ? 'ui-list-item--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const componentProps = to ? { to, ...props } : props;

  return (
    <Component className={rootClassName} {...componentProps}>
      {leading ? <div className="ui-list-item__leading">{leading}</div> : null}
      <div className="ui-list-item__body">
        {title ? <div className="ui-list-item__title">{title}</div> : null}
        {subtitle ? <div className="ui-list-item__subtitle">{subtitle}</div> : null}
        {meta ? <div className="ui-list-item__meta">{meta}</div> : null}
        {children}
      </div>
      {trailing ? <div className="ui-list-item__trailing">{trailing}</div> : null}
    </Component>
  );
}
