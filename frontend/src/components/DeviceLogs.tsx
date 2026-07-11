import React, { useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs';
import { Terminal, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DeviceLogs: React.FC = () => {
  const { logs, clearLogs } = useAppStore();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && logs.length > 0) {
      const items = listRef.current.children;
      // Animate new logs coming in
      anime({
        targets: items,
        translateX: [-20, 0],
        opacity: [0, 1],
        delay: anime.stagger(50),
        duration: 600,
        easing: 'easeOutExpo'
      });
    }
  }, [logs]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div 
        style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
          opacity: 0,
          animation: 'fadeIn 0.5s ease-out forwards'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-glass)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={18} color="var(--cyan)" />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Terminal de Eventos</h2>
          </div>
          <button 
            onClick={clearLogs}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--t3)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: 'var(--r)',
              transition: 'background var(--dur)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--rose)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
          >
            <Trash2 size={14} /> Limpiar
          </button>
        </div>

        <div style={{ 
          background: 'var(--bg)', 
          padding: '20px', 
          height: '60vh', 
          overflowY: 'auto',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '13px'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--t3)', textAlign: 'center', padding: '40px' }}>
              Sin eventos recientes.
            </div>
          ) : (
            <div ref={listRef}>
              {logs.map((log, i) => (
                <div 
                  key={i + log}
                  className="log-item"
                  style={{
                    padding: '8px 12px',
                    borderLeft: '2px solid var(--border-focus)',
                    marginBottom: '8px',
                    background: 'var(--bg-input)',
                    borderRadius: '0 var(--r-sm) var(--r-sm) 0',
                    color: log.includes('Error') ? 'var(--rose)' : 
                           log.includes('bloqueado') ? 'var(--amber)' : 
                           log.includes('desbloqueado') ? 'var(--emerald)' : 'var(--t1)',
                    display: 'flex',
                    gap: '10px',
                    opacity: 0 // Will be animated by anime.js
                  }}
                >
                  <span style={{ color: 'var(--t3)', userSelect: 'none' }}>~</span>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </div>
    </div>
  );
};
