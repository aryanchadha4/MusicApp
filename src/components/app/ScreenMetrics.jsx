export default function ScreenMetrics({ items = [] }) {
  const visibleItems = items.filter((item) => item && item.label && item.value !== undefined && item.value !== null);

  if (visibleItems.length === 0) return null;

  return (
    <div className="screen-metrics" aria-label="Screen summary">
      {visibleItems.map((item) => (
        <div key={item.label} className="screen-metrics__item">
          <span className="screen-metrics__value">{item.value}</span>
          <span className="screen-metrics__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
