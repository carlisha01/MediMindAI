import React, { useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import Reader from '../components/Reader';
import ChatComposer from '../components/ChatComposer';

export default {
  title: 'Design/Theme Playground',
  component: GlassCard,
};

const themes = ['material-dynamic', 'dark-analytics', 'editorial-hybrid'];

export const Playground = (args) => {
  useEffect(() => {
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'material-dynamic');
    }
  }, []);

  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
  };

  const onSend = (msg) => {
    alert(`Message sent: ${msg}`);
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label htmlFor="theme-select">Theme</label>
        <select
          id="theme-select"
          onChange={(e) => applyTheme(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8 }}
        >
          {themes.map((t) => (
            <option value={t} key={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <GlassCard title="Analytics Panel">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 120, height: 80, background: 'var(--chart-1)' }} />
          <div style={{ width: 120, height: 80, background: 'var(--chart-2)' }} />
          <div style={{ width: 120, height: 80, background: 'var(--chart-3)' }} />
        </div>
      </GlassCard>

      <Reader title="Editorial Reader">
        <p>
          This is a sample reader paragraph demonstrating typographic scale and the editorial hybrid
          theme. Use the theme selector to view the editorial reader styling.
        </p>
      </Reader>

      <div>
        <ChatComposer onSend={onSend} />
      </div>
    </div>
  );
};

Playground.storyName = 'Theme Playground';