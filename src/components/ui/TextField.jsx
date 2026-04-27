import Field from './Field';

export default function TextField({
  as = 'input',
  label,
  hint,
  error,
  className = '',
  inputClassName = '',
  children,
  ...props
}) {
  const controlClassName = ['ui-input', as === 'textarea' ? 'ui-input--textarea' : '', inputClassName]
    .filter(Boolean)
    .join(' ');

  const control =
    as === 'textarea' ? (
      <textarea className={controlClassName} {...props} />
    ) : as === 'select' ? (
      <select className={controlClassName} {...props}>
        {children}
      </select>
    ) : (
      <input className={controlClassName} {...props} />
    );

  if (!label && !hint && !error) {
    return control;
  }

  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {control}
    </Field>
  );
}
