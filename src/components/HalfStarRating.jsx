import React, { useCallback, useRef, useState } from 'react';

const clampSegment = (rel) => {
  if (rel <= 0) return 0;
  const seg = Math.min(9, Math.max(0, Math.floor(rel * 10)));
  return seg;
};

const relFromClientX = (el, clientX) => {
  const r = el.getBoundingClientRect();
  if (r.width <= 0) return 0;
  return (clientX - r.left) / r.width;
};

const clientXToRating = (el, clientX) => {
  const rel = relFromClientX(el, clientX);
  return (clampSegment(rel) + 1) * 0.5;
};

export function ReadOnlyStarRow({ value, size = 18 }) {
  const v = Number(value) || 0;
  return (
    <span className="half-star-rating half-star-rating--readonly" style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarGlyph key={i} index={i} effective={v} size={size} />
      ))}
    </span>
  );
}

function StarGlyph({ index, effective, size }) {
  const full = effective >= index;
  const half = !full && effective >= index - 0.5;
  const fillWidth = full ? '100%' : half ? '50%' : '0%';

  return (
    <span
      className="half-star-glyph"
      style={{
        position: 'relative',
        display: 'inline-block',
        fontSize: size,
        lineHeight: 1,
        width: '1em',
        height: '1em',
        verticalAlign: 'middle',
      }}
      aria-hidden
    >
      <span style={{ color: 'var(--color-fg-muted)', opacity: 0.35 }}>★</span>
      {fillWidth !== '0%' && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            overflow: 'hidden',
            width: fillWidth,
            color: 'var(--color-accent)',
            pointerEvents: 'none',
          }}
        >
          ★
        </span>
      )}
    </span>
  );
}

export default function HalfStarRating({ value, onChange, disabled = false, size = 30 }) {
  const barRef = useRef(null);
  const [hoverRating, setHoverRating] = useState(null);

  const effective = hoverRating ?? value;

  const updateHover = useCallback(
    (clientX) => {
      if (disabled || !barRef.current) return;
      setHoverRating(clientXToRating(barRef.current, clientX));
    },
    [disabled]
  );

  const commit = useCallback(
    (clientX) => {
      if (disabled || !barRef.current) return;
      const r = clientXToRating(barRef.current, clientX);
      onChange(r);
    },
    [disabled, onChange]
  );

  return (
    <div
      ref={barRef}
      className="half-star-rating"
      role="slider"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value > 0 ? value : undefined}
      aria-label="Rating"
      aria-disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseMove={(e) => !disabled && updateHover(e.clientX)}
      onMouseLeave={() => setHoverRating(null)}
      onClick={(e) => !disabled && commit(e.clientX)}
      onTouchStart={(e) => {
        if (disabled || !e.touches[0]) return;
        updateHover(e.touches[0].clientX);
      }}
      onTouchMove={(e) => {
        if (disabled || !e.touches[0]) return;
        updateHover(e.touches[0].clientX);
      }}
      onTouchEnd={(e) => {
        if (disabled) return;
        const t = e.changedTouches?.[0];
        if (t && barRef.current) commit(t.clientX);
        setHoverRating(null);
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <StarGlyph key={i} index={i} effective={effective} size={size} />
      ))}
    </div>
  );
}
