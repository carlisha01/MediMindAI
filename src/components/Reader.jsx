import React from 'react';

export default function Reader({ title, children }) {
  return (
    <article className="reader" aria-label={title || 'Reader'}>
      {title && <h1 style={{ fontSize: 'var(--type-page)', marginBottom: '12px' }}>{title}</h1>}
      <div>{children}</div>
    </article>
  );
}