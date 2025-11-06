import React, { useState } from 'react';

export default function ChatComposer({ onSend }) {
  const [value, setValue] = useState('');
  return (
    <div className="chat-composer" role="region" aria-label="Chat composer">
      <input
        aria-label="Message"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask a question..."
        style={{ flex: 1, border: 'none', background: 'transparent' }}
      />
      <button
        onClick={() => {
          if (!value.trim()) return;
          onSend?.(value);
          setValue('');
        }}
        style={{
          background: 'var(--accent-1)',
          color: 'var(--on-accent-1, #fff)',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '8px',
        }}
      >
        Send
      </button>
    </div>
  );
}