import HeaderBlock from '../ui/HeaderBlock';

export default function ScreenShell({
  eyebrow,
  title,
  subtitle,
  actions = null,
  children,
  className = '',
}) {
  const rootClassName = ['screen-shell', className].filter(Boolean).join(' ');

  return (
    <section className={rootClassName}>
      <header className="screen-shell__header">
        <HeaderBlock eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions} />
      </header>
      <div className="screen-shell__content">{children}</div>
    </section>
  );
}
