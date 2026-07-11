import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import anime from 'animejs';
import { Search, Smartphone, ShieldCheck, User, Settings, Lock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setView, sales } = useAppStore();
  const [query, setQuery] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      if (overlayRef.current && containerRef.current) {
        anime({
          targets: overlayRef.current,
          opacity: [0, 1],
          duration: 200,
          easing: 'linear'
        });
        anime({
          targets: containerRef.current,
          translateY: [20, 0],
          scale: [0.95, 1],
          opacity: [0, 1],
          duration: 350,
          easing: 'easeOutElastic(1, .8)'
        });
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items.length > 0) {
        anime({
          targets: items,
          translateY: [10, 0],
          opacity: [0, 1],
          delay: anime.stagger(30),
          duration: 300,
          easing: 'easeOutExpo'
        });
      }
    }
  }, [query, isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const handleClose = () => {
    if (overlayRef.current && containerRef.current) {
      anime({
        targets: overlayRef.current,
        opacity: [1, 0],
        duration: 150,
        easing: 'linear'
      });
      anime({
        targets: containerRef.current,
        translateY: [0, 10],
        scale: [1, 0.98],
        opacity: [1, 0],
        duration: 150,
        easing: 'easeInQuad',
        complete: () => {
          setCommandPaletteOpen(false);
          setQuery('');
        }
      });
    } else {
      setCommandPaletteOpen(false);
      setQuery('');
    }
  };

  const executeCommand = (action: () => void) => {
    handleClose();
    setTimeout(action, 200); // Wait for closing animation
  };

  const filteredSales = sales.filter(s => 
    s.customer_name.toLowerCase().includes(query.toLowerCase()) ||
    s.serial_number.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="cmd-overlay" ref={overlayRef} onClick={handleClose}>
      <div 
        className="cmd-container" 
        ref={containerRef} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmd-header">
          <Search size={18} className="cmd-icon" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Buscar dispositivos, comandos o clientes... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="cmd-esc">ESC</div>
        </div>

        <div className="cmd-body">
          {query.length > 0 && (
            <div className="cmd-section">
              <div className="cmd-section-title">Resultados ({filteredSales.length})</div>
              <ul ref={listRef} className="cmd-list">
                {filteredSales.map(sale => (
                  <li 
                    key={sale.id} 
                    className="cmd-item"
                    onClick={() => executeCommand(() => setView('credits'))}
                  >
                    <div className="cmd-item-icon" style={{ background: 'var(--indigo-dim)', color: 'var(--indigo)' }}>
                      <Smartphone size={15} />
                    </div>
                    <div className="cmd-item-info">
                      <span className="cmd-item-title">{sale.customer_name}</span>
                      <span className="cmd-item-sub">{sale.device_brand} {sale.device_model} • SN: {sale.serial_number}</span>
                    </div>
                  </li>
                ))}
                {filteredSales.length === 0 && (
                  <div className="cmd-empty">No se encontraron dispositivos ni clientes.</div>
                )}
              </ul>
            </div>
          )}

          {query.length === 0 && (
            <div className="cmd-section">
              <div className="cmd-section-title">Acciones Rápidas</div>
              <ul ref={listRef} className="cmd-list">
                <li className="cmd-item" onClick={() => executeCommand(() => setView('credits'))}>
                  <div className="cmd-item-icon"><User size={15} /></div>
                  <div className="cmd-item-info">
                    <span className="cmd-item-title">Ir a Clientes y Créditos</span>
                  </div>
                </li>
                <li className="cmd-item" onClick={() => executeCommand(() => setView('dashboard'))}>
                  <div className="cmd-item-icon"><ShieldCheck size={15} /></div>
                  <div className="cmd-item-info">
                    <span className="cmd-item-title">Ver Resumen de Seguridad</span>
                  </div>
                </li>
                <li className="cmd-item" onClick={() => executeCommand(() => setView('alerts'))}>
                  <div className="cmd-item-icon"><Lock size={15} /></div>
                  <div className="cmd-item-info">
                    <span className="cmd-item-title">Revisar Dispositivos Bloqueados</span>
                  </div>
                </li>
                <li className="cmd-item" onClick={() => executeCommand(() => setView('dashboard'))}>
                  <div className="cmd-item-icon"><Settings size={15} /></div>
                  <div className="cmd-item-info">
                    <span className="cmd-item-title">Ajustes del Sistema</span>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
