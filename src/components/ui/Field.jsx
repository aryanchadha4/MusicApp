export default function Field({ label, hint, error, className = '', children }) {
  const rootClassName = ['ui-field', error ? 'ui-field--error' : '', className].filter(Boolean).join(' ');

  return (
    <label className={rootClassName}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      {children}
      {hint ? <span className="ui-field__hint">{hint}</span> : null}
      {error ? <span className="ui-field__error">{error}</span> : null}
    </label>
  );
}
