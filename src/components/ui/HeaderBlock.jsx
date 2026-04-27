export default function HeaderBlock({
  eyebrow,
  title,
  subtitle,
  actions = null,
  titleAs: TitleTag = 'h2',
  className = '',
}) {
  const rootClassName = ['ui-header-block', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      <div className="ui-header-block__copy">
        {eyebrow ? <p className="ui-header-block__eyebrow">{eyebrow}</p> : null}
        <TitleTag className="ui-header-block__title">{title}</TitleTag>
        {subtitle ? <p className="ui-header-block__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ui-header-block__actions">{actions}</div> : null}
    </div>
  );
}
