import React from 'react';
import './glass-card.css';

export default function GlassCard({ children, style, title }) {
  return (
    <div className="glass-card" style={style}>
      {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
      <div>{children}</div>
    </div>
  );
}