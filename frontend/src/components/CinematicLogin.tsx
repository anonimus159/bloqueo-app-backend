import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs';
import { Smartphone, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const API_URL = (typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:3000'
  : 'https://bloqueo-app-backend.onrender.com';

export const CinematicLogin: React.FC = () => {
  const { setAuthToken } = useAppStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const tl = anime.timeline({ easing: 'easeOutExpo' });

    tl.add({
      targets: glowRef.current,
      opacity: [0, 0.5],
      scale: [0.8, 1],
      duration: 1500,
    })
    .add({
      targets: cardRef.current,
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1200,
      easing: 'easeOutElastic(1, .8)'
    }, '-=1200')
    .add({
      targets: elementsRef.current.filter(Boolean),
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      duration: 800,
    }, '-=800');

    anime({
      targets: glowRef.current,
      translateY: [-20, 20],
      translateX: [-10, 10],
      scale: [1, 1.05],
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
      duration: 5000
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    
    // Anime button click feedback
    anime({
      targets: elementsRef.current[elementsRef.current.length - 1],
      scale: [1, 0.95, 1],
      duration: 400,
      easing: 'easeInOutQuad'
    });

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAuthToken(data.token);
      } else {
        setError(data.error || 'Credenciales inválidas');
        // Glitch effect on error
        anime({
          targets: cardRef.current,
          translateX: [
            { value: -10, duration: 50 },
            { value: 10, duration: 50 },
            { value: -5, duration: 50 },
            { value: 5, duration: 50 },
            { value: 0, duration: 50 }
          ],
          rotate: [
            { value: -1, duration: 50 },
            { value: 1, duration: 50 },
            { value: 0, duration: 50 }
          ],
          easing: 'linear'
        });
        anime({
          targets: '.login-input',
          borderColor: ['var(--border)', 'var(--rose)', 'var(--border)', 'var(--rose)'],
          duration: 300,
          easing: 'linear'
        });
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      anime({
        targets: cardRef.current,
        translateX: [
          { value: -10, duration: 50 },
          { value: 10, duration: 50 },
          { value: 0, duration: 50 }
        ],
        easing: 'linear'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-wrapper app-shell" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div 
        ref={glowRef}
        className="login-glow"
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, var(--indigo-glow) 0%, transparent 70%)',
          filter: 'blur(60px)',
          opacity: 0,
          zIndex: 0
        }}
      />

      <div 
        ref={cardRef}
        className="login-card"
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--border-hi)',
          borderRadius: 'var(--r-xl)',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-lg), 0 0 40px rgba(79, 70, 229, 0.1)',
          position: 'relative',
          zIndex: 10,
          opacity: 0
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }} ref={el => elementsRef.current[0] = el}>
          <div 
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, var(--indigo) 0%, var(--violet) 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#fff',
              boxShadow: '0 8px 24px var(--indigo-glow)'
            }}
          >
            <Smartphone size={28} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            FinControl
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: '14px' }}>
            Accede al panel de control premium
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--rose-dim)',
              color: 'var(--rose)',
              padding: '12px',
              borderRadius: 'var(--r)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              border: '1px solid rgba(244, 63, 94, 0.2)'
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div ref={el => elementsRef.current[1] = el} style={{ opacity: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--t2)', marginBottom: '8px' }}>
              CORREO ELECTRÓNICO
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@codecraft.com"
                className="login-input"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--t1)',
                  padding: '12px 16px 12px 42px',
                  borderRadius: 'var(--r)',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'box-shadow var(--dur)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--indigo)';
                  e.target.style.boxShadow = '0 0 0 3px var(--indigo-dim)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div ref={el => elementsRef.current[2] = el} style={{ opacity: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--t2)', marginBottom: '8px' }}>
              CONTRASEÑA
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="login-input"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--t1)',
                  padding: '12px 16px 12px 42px',
                  borderRadius: 'var(--r)',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'box-shadow var(--dur)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--indigo)';
                  e.target.style.boxShadow = '0 0 0 3px var(--indigo-dim)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <button
            ref={el => elementsRef.current[3] = el}
            disabled={isLoggingIn}
            type="submit"
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, var(--indigo) 0%, var(--violet) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--r)',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px var(--indigo-glow)',
              cursor: isLoggingIn ? 'not-allowed' : 'pointer',
              opacity: 0,
              transition: 'box-shadow 0.2s ease-in-out'
            }}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 20px var(--indigo-glow)'}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 14px var(--indigo-glow)'}
          >
            {isLoggingIn ? (
              <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>Ingresar <ArrowRight size={18} /></>
            )}
          </button>
        </form>
        
        <style>
          {`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}
        </style>
      </div>
    </div>
  );
};
