import React from 'react';

export function Section({ title, children, right, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={`section${open ? ' open' : ''}`}>
      <div className="section-head" onClick={() => setOpen((o) => !o)}>
        <span className="caret">{open ? '▾' : '▸'}</span>
        <span className="section-title">{title}</span>
        {right && <span className="section-right" onClick={(e) => e.stopPropagation()}>{right}</span>}
      </div>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

export function Field({ label, children, hint, wide }) {
  return (
    <label className={`field${wide ? ' wide' : ''}`}>
      {label && <span className="field-label">{label}</span>}
      <span className="field-input">{children}</span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Num({ value, onChange, min = 0, max = 1, step = 0.01, suffix, precision = 3 }) {
  const v = Number(value ?? 0);
  return (
    <span className="num">
      <input
        type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        className="num-box" type="number" min={min} max={max} step={step}
        value={Number(v.toFixed(precision))}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {suffix && <em>{suffix}</em>}
    </span>
  );
}

export function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

export function Text({ value, onChange, placeholder, mono }) {
  return (
    <input
      className={mono ? 'mono' : ''}
      type="text" value={value ?? ''} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Area({ value, onChange, rows = 3, placeholder }) {
  return (
    <textarea rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}

export function Color({ value, onChange, allowNone }) {
  const v = value || '#ffffff';
  return (
    <span className="color-field">
      <input type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : '#ffffff'} onChange={(e) => onChange(e.target.value)} />
      <input className="mono" type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      {allowNone && <button className="mini" onClick={() => onChange(null)} title="Clear">✕</button>}
    </span>
  );
}

export function Toggle({ value, onChange, label }) {
  return (
    <button className={`toggle${value ? ' on' : ''}`} onClick={() => onChange(!value)}>
      <span className="knob" />
      {label && <em>{label}</em>}
    </button>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value ?? o}
          className={value === (o.value ?? o) ? 'active' : ''}
          onClick={() => onChange(o.value ?? o)}
          title={o.title}
        >
          {o.label ?? o}
        </button>
      ))}
    </div>
  );
}

export function AnchorPad({ value, onChange }) {
  const cells = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];
  return (
    <div className="anchor-pad">
      {cells.map((c) => (
        <button key={c} className={value === c ? 'active' : ''} onClick={() => onChange(c)} title={c} />
      ))}
    </div>
  );
}
