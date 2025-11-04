import '../design/tokens/design-tokens.css';
import React from 'react';

export const decorators = [
  (Story) => (
    <div style={{ padding: 24, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Story />
    </div>
  ),
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  a11y: { config: {} },
};