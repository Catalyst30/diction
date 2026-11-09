import React, { useEffect, useState } from 'react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number;
  onChange: (n: number) => void;
};

// Keeps digits and one dot, at most 2 decimals, and removes leading zeros.
const clean = (raw: string) => {
  let t = raw.replace(/[^0-9.]/g, '');
  const dot = t.indexOf('.');
  if (dot !== -1) t = t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  return t.replace(/^0+(?=\d)/, '');
};

// A money field that starts empty (not "0"), so typing 5000 never shows 05000.
export default function NumberField({ value, onChange, ...rest }: Props) {
  const [text, setText] = useState(value ? String(value) : '');

  useEffect(() => {
    if ((Number(text) || 0) !== value) setText(value ? String(value) : '');
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={rest.placeholder ?? '0'}
      value={text}
      onChange={(e) => {
        const t = clean(e.target.value);
        setText(t);
        onChange(Number(t) || 0);
      }}
    />
  );
}
