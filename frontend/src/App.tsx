import { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Lock,
  Unlock,
  Search,
  Send,
  AlertTriangle,
  DollarSign,
  User,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  Home,
  Clock,
  TrendingUp,
  Sun,
  Moon,
  PanelLeft,
  Zap,
  BarChart2,
  Activity,
  Edit,
  LogOut,
  Laptop,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = (typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:3000'
  : 'https://bloqueo-app-backend.onrender.com';

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════

type Theme = 'dark' | 'light';
type ActiveView = 'dashboard' | 'credits' | 'calendar' | 'alerts';
type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

interface Device {
  id: string; serial_number: string; imei: string;
  brand: string; model: string;
  status: 'active' | 'locked' | 'suspended';
  customer_name: string; customer_phone: string; last_sync_at: string;
  device_type?: 'android' | 'ios';
  udid?: string;
  push_magic?: string;
}

interface Installment {
  number: number; due_date: string; amount: number;
  paid: boolean; paid_at?: string; overdue: boolean; days_overdue: number;
}

interface CreditSale {
  id: string; device_brand: string; device_model: string;
  serial_number: string; imei: string;
  customer_name: string; customer_phone: string;
  sale_price: number; down_payment: number;
  frequency: PaymentFrequency; total_installments: number;
  installment_amount: number; start_date: string;
  installments: Installment[];
  status: 'active' | 'completed' | 'overdue' | 'locked';
}

// ══════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════

const FREQ_LABELS: Record<PaymentFrequency, string> = {
  weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual',
};
const FREQ_DAYS: Record<PaymentFrequency, number> = {
  weekly: 7, biweekly: 15, monthly: 30,
};
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function generateInstallments(
  startDate: string, frequency: PaymentFrequency, count: number, amount: number
): Installment[] {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(startDate);
  const days = FREQ_DAYS[frequency];
  return Array.from({ length: count }, (_, i) => {
    const due = new Date(start);
    due.setDate(due.getDate() + days * (i + 1));
    const dueStr = due.toISOString().split('T')[0];
    const diff = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
    return { number: i + 1, due_date: dueStr, amount, paid: false, overdue: diff > 0, days_overdue: diff };
  });
}

function fmtCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}
function fmtDate(d: string) {
  if (!d || typeof d !== 'string') return '';
  const parts = d.split('-');
  if (parts.length < 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
function getDueSeverity(sale: CreditSale): 'ok' | 'warning' | 'alert' {
  if (!sale || !Array.isArray(sale.installments)) return 'ok';
  const ov = sale.installments.filter(i => i && !i.paid && i.overdue);
  if (!ov.length) return 'ok';
  return Math.max(...ov.map(i => i.days_overdue || 0)) >= 2 ? 'alert' : 'warning';
}

// Persistence
function loadSales(): CreditSale[] {
  try {
    const raw = localStorage.getItem('fc_sales');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s: any) => s && typeof s === 'object' && Array.isArray(s.installments));
  } catch {
    return [];
  }
}
function saveSales(s: CreditSale[]) {
  if (Array.isArray(s)) {
    localStorage.setItem('fc_sales', JSON.stringify(s));
  }
}
function loadTheme(): Theme {
  return (localStorage.getItem('fc_theme') as Theme) || 'dark';
}

// ══════════════════════════════════════════════════════════
// App
// ══════════════════════════════════════════════════════════

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('fc_token'));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [view, setView] = useState<ActiveView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sales, setSales] = useState<CreditSale[]>(loadSales);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [cmdType, setCmdType] = useState<'lock' | 'unlock' | 'wipe'>('lock');
  const [cmdPayload, setCmdPayload] = useState('Por favor, realice el pago de su cuota para reactivar el terminal.');
  const [logs, setLogs] = useState<string[]>(['Sistema listo y escuchando.', 'Servidor iniciado correctamente.']);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMdmModal, setShowMdmModal] = useState(false);
  const [showAndroidMdmModal, setShowAndroidMdmModal] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<CreditSale | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calDate, setCalDate] = useState(new Date());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('fc_token', data.token);
        setAuthToken(data.token);
      } else {
        setLoginError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fc_token');
    setAuthToken(null);
  };


  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fc_theme', theme);
  }, [theme]);

  // ── Animated theme toggle ────────────────────────────────
  const toggleTheme = (e: React.MouseEvent) => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    const x = e.clientX;
    const y = e.clientY;

    // Set click origin for CSS animation
    document.documentElement.style.setProperty('--ripple-x', `${x}px`);
    document.documentElement.style.setProperty('--ripple-y', `${y}px`);

    // Use View Transitions API if available (modern browsers)
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {
        setTheme(nextTheme);
      });
    } else {
      // Fallback: CSS overlay ripple
      const overlay = document.createElement('div');
      overlay.className = `theme-ripple-overlay ${nextTheme}`;
      overlay.style.cssText = `--ox:${x}px;--oy:${y}px`;
      document.body.appendChild(overlay);
      overlay.addEventListener('animationend', () => {
        setTheme(nextTheme);
        overlay.remove();
      }, { once: true });
    }
  };

  // Persist sales
  useEffect(() => { saveSales(sales); }, [sales]);

  // Recalculate overdue
  useEffect(() => {
    const refresh = () => setSales(prev => prev.map(sale => {
      const insts = sale.installments.map(i => {
        if (i.paid) return i;
        const today = new Date(); today.setHours(0,0,0,0);
        const due = new Date(i.due_date); due.setHours(0,0,0,0);
        const d = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
        return { ...i, overdue: d > 0, days_overdue: d };
      });
      const allPaid = insts.every(i => i.paid);
      const crit = insts.some(i => !i.paid && i.days_overdue >= 2);
      return { ...sale, installments: insts, status: allPaid ? 'completed' : crit ? 'overdue' : sale.status === 'locked' ? 'locked' : 'active' };
    }));
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, []);

  // Fetch backend devices
  const fetchDevices = async () => {
    if (!authToken) return;
    try {
      const r = await fetch(`${API_URL}/api/v1/devices`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (r.ok) setDevices(await r.json());
      else if (r.status === 401 || r.status === 403) setAuthToken(null);
    } catch { /* offline */ }
  };
  useEffect(() => { 
    if (!authToken) return;
    fetchDevices(); 
    const id = setInterval(fetchDevices, 8000); 
    return () => clearInterval(id); 
  }, [authToken]);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('es-CO');
    setLogs(prev => [`${msg}`, ...prev.slice(0, 49)]);
    void ts;
  };

  const syncDeviceWithBackend = async (sale: CreditSale) => {
    if (!authToken) return;
    try {
      const unpaid = sale.installments.filter(i => !i.paid);
      const nextDeadline = unpaid.length > 0 
        ? unpaid.reduce((earliest, inst) => inst.due_date < earliest ? inst.due_date : earliest, unpaid[0].due_date)
        : null;

      const res = await fetch(`${API_URL}/api/v1/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          serial_number: sale.serial_number,
          imei: sale.imei,
          brand: sale.device_brand,
          model: sale.device_model,
          customer_name: sale.customer_name,
          customer_phone: sale.customer_phone,
          next_payment_deadline: nextDeadline
        })
      });

      if (res.ok) {
        addLog(`✓ Equipo ${sale.serial_number} sincronizado con el servidor.`);
        fetchDevices();
      } else {
        const errData = await res.json();
        addLog(`✗ Error al sincronizar equipo en el sistema: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      addLog(`✗ Error de red al sincronizar el equipo con el sistema.`);
    }
  };

  const handleCommand = async () => {
    if (!selectedDevice) return;
    addLog(`Enviando ${cmdType.toUpperCase()} → ${selectedDevice.serial_number}`);
    try {
      const r = await fetch(`${API_URL}/api/v1/devices/${selectedDevice.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ type: cmdType, payload: { message: cmdPayload } }),
      });
      if (r.ok) { addLog(`✓ Comando ejecutado: ${selectedDevice.serial_number}`); fetchDevices(); }
      else addLog(`✗ Error del servidor al ejecutar comando.`);
    } catch { addLog(`✗ Sin conexión al backend.`); }
  };

  const executeActionOnSale = async (sale: CreditSale, action: 'lock' | 'unlock') => {
    // UI Update (Optimistic)
    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, status: action === 'lock' ? 'locked' : 'active' } : s));
    addLog(`⏳ Enviando ${action === 'lock' ? 'bloqueo' : 'desbloqueo'} a: ${sale.customer_name} (${sale.serial_number || 'Sin S/N'})`);
    
    // Buscar el dispositivo real conectado por número de serie
    const targetDev = devices.find(d => d.serial_number === sale.serial_number);
    if (!targetDev) {
      addLog(`✗ Dispositivo no en red: El equipo ${sale.serial_number || '?'} no se ha reportado.`);
      return;
    }
    
    try {
      const r = await fetch(`${API_URL}/api/v1/devices/${targetDev.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ type: action, payload: { source: 'panel_empresa' } }),
      });
      if (r.ok) {
        addLog(`✓ Acción confirmada: ${action === 'lock' ? 'Bloqueo' : 'Desbloqueo'} aplicado a ${sale.serial_number}`);
        fetchDevices();
      } else {
        addLog(`✗ Error servidor: No se pudo ejecutar orden en ${sale.serial_number}`);
      }
    } catch {
      addLog(`✗ Error red: No se pudo contactar al servidor para ${sale.serial_number}`);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const safeSales = Array.isArray(sales) ? sales : [];
    return {
      total: safeSales.length,
      active: safeSales.filter(s => s && s.status === 'active').length,
      overdue: safeSales.filter(s => s && s.status === 'overdue').length,
      completed: safeSales.filter(s => s && s.status === 'completed').length,
      collected: safeSales.reduce((a, s) => {
        if (!s || !Array.isArray(s.installments)) return a;
        return a + s.installments.filter(i => i && i.paid).reduce((x, i) => x + (i.amount || 0), 0);
      }, 0),
      alertCount: safeSales.filter(s => s && getDueSeverity(s) === 'alert').length,
    };
  }, [sales]);

  // Calendar
  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth();
  const calDays = new Date(calYear, calMonth + 1, 0).getDate();
  const calFirst = new Date(calYear, calMonth, 1).getDay();

  const paysByDate = useMemo(() => {
    const m: Record<string, { sale: CreditSale; inst: Installment }[]> = {};
    const safeSales = Array.isArray(sales) ? sales : [];
    safeSales.forEach(s => {
      if (s && Array.isArray(s.installments)) {
        s.installments.forEach(i => {
          if (i && i.due_date) {
            if (!m[i.due_date]) m[i.due_date] = [];
            m[i.due_date].push({ sale: s, inst: i });
          }
        });
      }
    });
    return m;
  }, [sales]);

  const filteredDevices = useMemo(() => {
    const safeDevices = Array.isArray(devices) ? devices : [];
    const term = (searchTerm || '').toLowerCase();
    return safeDevices.filter(d => {
      if (!d) return false;
      const serial = (d.serial_number || '').toLowerCase();
      const name = (d.customer_name || '').toLowerCase();
      const brand = (d.brand || '').toLowerCase();
      return serial.includes(term) || name.includes(term) || brand.includes(term);
    });
  }, [devices, searchTerm]);

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Panel', icon: <Home size={17} /> },
    { id: 'credits',   label: 'Créditos', icon: <CreditCard size={17} /> },
    { id: 'calendar',  label: 'Calendario', icon: <Calendar size={17} /> },
    { id: 'alerts',    label: 'Alertas', icon: <Bell size={17} />, badge: stats.alertCount || undefined },
  ];

  const viewTitles: Record<ActiveView, string> = {
    dashboard: 'Panel de Control',
    credits:   'Ventas a Crédito',
    calendar:  'Calendario de Pagos',
    alerts:    'Alertas de Mora',
  };

  if (!authToken) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="panel" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', background: 'var(--indigo-dim)', color: 'var(--indigo)', padding: '12px', borderRadius: '50%', marginBottom: '16px' }}>
              <Lock size={24} />
            </div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>FinControl</h2>
            <p style={{ color: 'var(--t3)', margin: '4px 0 0 0', fontSize: '13px' }}>Inicia sesión para continuar</p>
          </div>
          {loginError && (
            <div style={{ background: 'var(--rose-dim)', color: 'var(--rose)', padding: '10px', borderRadius: 'var(--r)', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} /> {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Correo electrónico</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="field-input" required />
            </div>
            <div>
              <label className="field-label">Contraseña</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="field-input" required />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '10px' }}>
              Entrar al Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"><Smartphone size={18} /></div>
          {sidebarOpen && (
            <div className="brand-text">
              <span className="brand-name">FinControl</span>
              <span className="brand-tagline">Sistema de Créditos</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
              {item.badge && sidebarOpen  && <span className="nav-badge">{item.badge}</span>}
              {item.badge && !sidebarOpen && <span className="nav-badge-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Theme toggle inside sidebar when open */}
          {sidebarOpen && (
            <button
              className="nav-item theme-btn"
              onClick={toggleTheme}
              title="Cambiar tema"
              id="theme-toggle-sidebar"
            >
              <span className="nav-icon theme-icon-wrap">
                <span className={`theme-icon-inner ${theme === 'dark' ? 'show-sun' : 'show-moon'}`}>
                  <Sun size={17} className="icon-sun" />
                  <Moon size={17} className="icon-moon" />
                </span>
              </span>
              <span className="nav-label">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
              <span className="theme-pill">{theme === 'dark' ? '☀' : '🌙'}</span>
            </button>
          )}
          {!sidebarOpen && (
            <button
              className="icon-btn theme-btn-mini"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              id="theme-toggle-mini"
              style={{ width:'100%', borderRadius:'var(--r)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Colapsar' : 'Expandir'}
          >
            <PanelLeft size={15} style={{ transform: sidebarOpen ? 'none' : 'scaleX(-1)' }} />
            {sidebarOpen && <span>Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────── */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{viewTitles[view]}</h1>
          </div>
          <div className="topbar-right">
            {/* Theme toggle in topbar when sidebar closed - hidden, now in sidebar */}
            {false && (
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title="Cambiar tema"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            {view === 'credits' && (
              <button className="btn-primary" onClick={() => setShowModal(true)} id="btn-register-sale">
                <Plus size={15} /> Registrar Venta
              </button>
            )}
            <div className="topbar-user">
              <div className="user-avatar"><User size={12} /></div>
              <div>
                <div className="user-name">Administrador</div>
              </div>
            </div>
            <button 
              className="btn-outline" 
              onClick={handleLogout} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '13px', marginLeft: '12px' }}
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* ─── View Content ─────────────────────────────────── */}
        <div className="view-content">

          {/* ══ DASHBOARD ══════════════════════════════════════ */}
          {view === 'dashboard' && (
            <div className="view-fade">
              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card accent-indigo">
                  <div className="stat-icon"><Smartphone size={20} /></div>
                  <div className="stat-info">
                    <p className="stat-label">Total créditos</p>
                    <p className="stat-value">{stats.total}</p>
                    <span className="stat-sub">{stats.completed} completados</span>
                  </div>
                </div>
                <div className="stat-card accent-emerald">
                  <div className="stat-icon"><ShieldCheck size={20} /></div>
                  <div className="stat-info">
                    <p className="stat-label">Al corriente</p>
                    <p className="stat-value">{stats.active}</p>
                    <span className="stat-sub">Sin mora activa</span>
                  </div>
                </div>
                <div className="stat-card accent-rose">
                  <div className="stat-icon"><AlertTriangle size={20} /></div>
                  <div className="stat-info">
                    <p className="stat-label">En mora</p>
                    <p className="stat-value">{stats.overdue}</p>
                    <span className="stat-sub">{stats.alertCount} críticas</span>
                  </div>
                </div>
                <div className="stat-card accent-violet">
                  <div className="stat-icon"><TrendingUp size={20} /></div>
                  <div className="stat-info">
                    <p className="stat-label">Recaudado</p>
                    <p className="stat-value" style={{ fontSize: stats.collected > 9999999 ? '16px' : '22px' }}>
                      {fmtCOP(stats.collected)}
                    </p>
                    <span className="stat-sub">Total cobrado</span>
                  </div>
                </div>
              </div>

              <div className="grid-2col">
                {/* Command console */}
                <div className="panel">
                  <div className="panel-header">
                    <Zap size={16} className="text-indigo" />
                    <span>Consola de Comandos</span>
                    {selectedDevice && (
                      <span className="panel-header-sub">
                        {selectedDevice.brand} {selectedDevice.model}
                      </span>
                    )}
                  </div>
                  <div className="panel-body">
                    <label className="field-label">Dispositivo seleccionado</label>
                    <div className="device-display">
                      {selectedDevice
                        ? <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '9px', background: selectedDevice.device_type === 'ios' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: selectedDevice.device_type === 'ios' ? '#818CF8' : '#34D399', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                {selectedDevice.device_type || 'android'}
                              </span>
                              <span>{selectedDevice.brand} {selectedDevice.model}</span>
                            </div>
                            <span className="code-chip">{selectedDevice.serial_number}</span>
                          </>
                        : <span className="placeholder-text">Ninguno — seleccione de la tabla inferior</span>
                      }
                    </div>

                    <label className="field-label mt-4">Acción a ejecutar</label>
                    <div className="action-group">
                      <button onClick={() => setCmdType('lock')} className={`action-btn ${cmdType==='lock'?'active-red':''}`}><Lock size={12}/> Bloquear</button>
                      <button onClick={() => setCmdType('unlock')} className={`action-btn ${cmdType==='unlock'?'active-green':''}`}><Unlock size={12}/> Liberar</button>
                      <button onClick={() => setCmdType('wipe')} className={`action-btn ${cmdType==='wipe'?'active-amber':''}`}><AlertTriangle size={12}/> Borrar</button>
                    </div>

                    <label className="field-label mt-4">Mensaje en pantalla</label>
                    <textarea rows={2} value={cmdPayload} onChange={e => setCmdPayload(e.target.value)} className="field-input" />

                    <button onClick={handleCommand} disabled={!selectedDevice} className="btn-primary w-full mt-4" id="btn-send-command">
                      <Send size={14}/> Transmitir Comando
                    </button>
                  </div>
                </div>

                {/* Activity log */}
                <div className="panel">
                  <div className="panel-header">
                    <Activity size={16} className="text-emerald" />
                    <span>Registro de Actividad</span>
                    <div className="live-dot" style={{ marginLeft: 'auto' }} />
                  </div>
                  <div className="panel-body" style={{ padding: '14px' }}>
                    <div className="log-console">
                      {logs.map((log, i) => (
                        <div key={i} className="log-line">
                          <span className="log-ts">›</span>
                          <span className="log-msg">{log}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4" style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'var(--t3)' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--emerald)', display:'inline-block' }}/>
                        Escucha activa
                      </span>
                      <span>Firma ECDSA P-256</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Devices table */}
              <div className="panel mt-6" id="devices-table">
                <div className="panel-header">
                  <BarChart2 size={16} className="text-indigo" />
                  <span>Dispositivos — Backend</span>
                  <div style={{ marginLeft:'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      className="btn-outline" 
                      onClick={() => setShowAndroidMdmModal(true)}
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={12} />
                      Inscribir Android
                    </button>
                    <button 
                      className="btn-outline" 
                      onClick={() => setShowMdmModal(true)}
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={12} />
                      Inscribir iPhone
                    </button>
                    <div className="search-wrap">
                      <Search size={13} />
                      <input
                        placeholder="Buscar por serie, marca o cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        id="device-search"
                      />
                    </div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Dispositivo</th>
                        <th>Serie / IMEI</th>
                        <th>Cliente</th>
                        <th>Último Check-In</th>
                        <th>Estado</th>
                        <th style={{ textAlign:'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDevices.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'var(--t3)', fontSize:'12px' }}>
                          Sin dispositivos conectados al backend.
                        </td></tr>
                      ) : filteredDevices.map(dev => (
                        <tr
                          key={dev.id}
                          className={selectedDevice?.id === dev.id ? 'selected' : ''}
                          onClick={() => setSelectedDevice(dev)}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '9px', background: dev.device_type === 'ios' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: dev.device_type === 'ios' ? '#818CF8' : '#34D399', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                {dev.device_type || 'android'}
                              </span>
                              <div>
                                <div className="cell-title">{dev.brand}</div>
                                <div className="cell-sub">{dev.model}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="code-chip">{dev.serial_number}</span></td>
                          <td>
                            <div className="cell-title">{dev.customer_name}</div>
                            <div className="cell-sub">{dev.customer_phone}</div>
                          </td>
                          <td className="cell-muted">{dev.last_sync_at}</td>
                          <td>
                            {dev.status === 'active'    && <span className="badge badge-emerald"><CheckCircle2 size={9}/> Al corriente</span>}
                            {dev.status === 'locked'    && <span className="badge badge-rose"><XCircle size={9}/> Bloqueado</span>}
                            {dev.status === 'suspended' && <span className="badge badge-amber"><AlertTriangle size={9}/> Mora</span>}
                          </td>
                          <td style={{ textAlign:'right' }}>
                            <button
                              className={`icon-btn ${dev.status === 'locked' ? 'success' : 'danger'}`}
                              onClick={e => { e.stopPropagation(); setSelectedDevice(dev); setCmdType(dev.status === 'locked' ? 'unlock' : 'lock'); }}
                              title={dev.status === 'locked' ? 'Desbloquear' : 'Bloquear'}
                            >
                              {dev.status === 'locked' ? <Unlock size={13}/> : <Lock size={13}/>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ CREDITS ════════════════════════════════════════ */}
          {view === 'credits' && (
            <div className="view-fade">
              {sales.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon-wrap"><CreditCard size={28} /></div>
                  <p className="empty-title">Sin ventas registradas</p>
                  <p className="empty-sub">Registra tu primera venta a crédito para comenzar a gestionar pagos y cuotas.</p>
                  <button className="btn-primary mt-4" onClick={() => setShowModal(true)} id="btn-empty-register">
                    <Plus size={15}/> Registrar Primera Venta
                  </button>
                </div>
              ) : (
                <div className="credits-list">
                  {sales.map(sale => {
                    const sev = getDueSeverity(sale);
                    const paid = sale.installments.filter(i => i.paid).length;
                    const prog = (paid / sale.total_installments) * 100;
                    const overdueInsts = sale.installments.filter(i => !i.paid && i.overdue);
                    return (
                      <div key={sale.id} className={`credit-card severity-${sev}`}>
                        {/* Header */}
                        <div className="credit-header">
                          <div className="credit-device-info">
                            <div className="credit-device-icon"><Smartphone size={16}/></div>
                            <div>
                              <div className="credit-device-name">{sale.device_brand} {sale.device_model}</div>
                              <div className="credit-device-serial">{sale.serial_number || 'Sin serie'}</div>
                            </div>
                          </div>
                          <div className="credit-badges" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {sev === 'alert'   && <span className="badge badge-rose"><AlertTriangle size={9}/> +2 días mora</span>}
                            {sev === 'warning' && <span className="badge badge-amber"><Clock size={9}/> Vencida</span>}
                            {sev === 'ok'      && <span className="badge badge-emerald"><CheckCircle2 size={9}/> Al corriente</span>}
                            <span className={`badge ${
                              sale.status === 'completed' ? 'badge-violet' :
                              sale.status === 'overdue'   ? 'badge-rose' :
                              sale.status === 'locked'    ? 'badge-rose' : 'badge-indigo'
                            }`}>
                              {sale.status === 'completed' ? 'Completado' :
                               sale.status === 'overdue'   ? 'En mora' :
                               sale.status === 'locked'    ? 'Bloqueado' : 'Activo'}
                            </span>
                            <button
                              className="icon-btn"
                              title="Editar Venta"
                              style={{ width: '22px', height: '22px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              onClick={() => {
                                setSaleToEdit(sale);
                                setShowModal(true);
                              }}
                            >
                              <Edit size={12}/>
                            </button>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="credit-body">
                          <div className="credit-info-grid">
                            <div className="credit-info-item">
                              <p className="info-label">Cliente</p>
                              <p className="info-value">{sale.customer_name}</p>
                              <p className="info-sub">{sale.customer_phone}</p>
                            </div>
                            <div className="credit-info-item">
                              <p className="info-label">Precio total</p>
                              <p className="info-value">{fmtCOP(sale.sale_price)}</p>
                              {sale.down_payment > 0 && <p className="info-sub">Inicial: {fmtCOP(sale.down_payment)}</p>}
                            </div>
                            <div className="credit-info-item">
                              <p className="info-label">Cuota {FREQ_LABELS[sale.frequency]}</p>
                              <p className="info-value">{fmtCOP(sale.installment_amount)}</p>
                              <p className="info-sub">{sale.total_installments} cuotas</p>
                            </div>
                            <div className="credit-info-item">
                              <p className="info-label">Progreso</p>
                              <p className="info-value">{paid} <span style={{ fontSize:'12px', fontWeight:500 }}>/ {sale.total_installments}</span></p>
                              <p className="info-sub">{prog.toFixed(0)}% pagado</p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="progress-wrap">
                            <div className="progress-fill" style={{ width: `${prog}%` }} />
                          </div>

                          {/* Overdue strip */}
                          {overdueInsts.length > 0 && (
                            <div className="overdue-strip">
                              <AlertTriangle size={14}/>
                              <span>
                                {overdueInsts.length} cuota(s) vencida(s) —
                                máx. <strong>{Math.max(...overdueInsts.map(i=>i.days_overdue))} día(s)</strong> de retraso
                              </span>
                              {sale.status === 'locked' ? (
                                <button className="btn-primary" style={{ marginLeft:'auto', background:'var(--emerald)' }} onClick={() => executeActionOnSale(sale, 'unlock')}>
                                  <Unlock size={11}/> Desbloquear
                                </button>
                              ) : sev === 'alert' && (
                                <button className="btn-danger" style={{ marginLeft:'auto' }} onClick={() => executeActionOnSale(sale, 'lock')}>
                                  <Lock size={11}/> Bloquear
                                </button>
                              )}
                            </div>
                          )}

                          {/* Installment dots */}
                          <div style={{ marginBottom:'8px' }}>
                            <p className="field-label">Cuotas — click para marcar como pagada</p>
                            <div className="installments-track">
                              {sale.installments.map(inst => {
                                const cls = inst.paid ? 'paid'
                                  : inst.overdue ? (inst.days_overdue >= 2 ? 'overdue-crit' : 'overdue-warn')
                                  : 'pending';
                                return (
                                  <div
                                    key={inst.number}
                                    className={`inst-dot ${cls}`}
                                    title={`Cuota ${inst.number} — ${fmtDate(inst.due_date)} — ${fmtCOP(inst.amount)}${inst.paid ? ' ✓' : inst.overdue ? ` (${inst.days_overdue}d)` : ''}`}
                                    onClick={() => {
                                      if (inst.paid) return;
                                      const updatedSale = {
                                        ...sale,
                                        installments: sale.installments.map(i =>
                                          i.number === inst.number
                                            ? { ...i, paid: true, paid_at: new Date().toISOString(), overdue: false, days_overdue: 0 }
                                            : i
                                        )
                                      };
                                      setSales(prev => prev.map(s => s.id === sale.id ? updatedSale : s));
                                      addLog(`✓ Pago registrado: Cuota ${inst.number} — ${sale.customer_name}`);
                                      syncDeviceWithBackend(updatedSale);
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                          <div className="inst-legend">
                            <div className="legend-item"><span className="legend-dot paid"/><span>Pagada</span></div>
                            <div className="legend-item"><span className="legend-dot pending"/><span>Pendiente</span></div>
                            <div className="legend-item"><span className="legend-dot overdue-warn"/><span>Vencida</span></div>
                            <div className="legend-item"><span className="legend-dot overdue-crit"/><span>Crítica +2d</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ CALENDAR ═══════════════════════════════════════ */}
          {view === 'calendar' && (
            <div className="view-fade">
              <div className="grid-2col">
                <div className="panel">
                  <div className="calendar-nav">
                    <span className="calendar-month">{MONTHS[calMonth]} {calYear}</span>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <button className="icon-btn" onClick={() => { setCalDate(new Date(calYear, calMonth-1)); setSelectedDay(null); }}><ChevronLeft size={15}/></button>
                      <button className="icon-btn" onClick={() => { setCalDate(new Date()); setSelectedDay(null); }} title="Hoy" style={{ fontSize:'10px', width:'auto', padding:'0 10px' }}>Hoy</button>
                      <button className="icon-btn" onClick={() => { setCalDate(new Date(calYear, calMonth+1)); setSelectedDay(null); }}><ChevronRight size={15}/></button>
                    </div>
                  </div>
                  <div className="calendar-grid">
                    {['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d => (
                      <div key={d} className="cal-day-name">{d}</div>
                    ))}
                    {Array.from({ length: calFirst }, (_, i) => <div key={`e${i}`} className="cal-cell empty"/>)}
                    {Array.from({ length: calDays }, (_, i) => {
                      const day = i + 1;
                      const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const items = paysByDate[ds] || [];
                      const today = new Date();
                      const isToday = today.getFullYear()===calYear && today.getMonth()===calMonth && today.getDate()===day;
                      const hasOv = items.some(p => !p.inst.paid && p.inst.overdue);
                      const isSelected = selectedDay === ds;
                      return (
                        <div
                          key={day}
                          className={`cal-cell ${isToday?'today':''} ${hasOv?'has-overdue-dots':''} ${items.length&&!hasOv?'has-payment-dots':''}`}
                          style={{
                            cursor: 'pointer',
                            outline: isSelected ? '2px solid var(--indigo)' : undefined,
                            outlineOffset: '-2px',
                            minHeight: '65px'
                          }}
                          onClick={() => setSelectedDay(isSelected ? null : ds)}
                        >
                          <span className="cal-day-num">{day}</span>
                          <div className="cal-dots" style={{ display:'flex', flexDirection:'column', gap:'2px', width:'100%', marginTop:'2px' }}>
                            {items.slice(0, 2).map((p, idx) => (
                              <div
                                key={idx}
                                style={{
                                  fontSize: '8px',
                                  lineHeight: '10px',
                                  padding: '1px 3px',
                                  borderRadius: '3px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  background: p.inst.paid ? 'rgba(16, 185, 129, 0.12)' : p.inst.overdue ? 'rgba(244, 63, 94, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                                  color: p.inst.paid ? 'var(--emerald)' : p.inst.overdue ? 'var(--rose)' : 'var(--indigo-light)',
                                  maxWidth: '100%',
                                  textAlign: 'center'
                                }}
                                title={`${p.sale.customer_name} - ${p.sale.device_brand} ${p.sale.device_model}`}
                              >
                                {p.sale.device_brand}
                              </div>
                            ))}
                            {items.length > 2 && (
                              <span style={{ fontSize:'8px', color:'var(--t3)', textAlign:'center' }}>
                                +{items.length - 2} más
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={15} className="text-emerald"/>
                      <span>{selectedDay ? `Pagos del ${fmtDate(selectedDay)}` : `Pagos de ${MONTHS[calMonth]}`}</span>
                    </div>
                    <span className="panel-header-sub">
                      {selectedDay ? (
                        <button
                          onClick={() => setSelectedDay(null)}
                          style={{
                            background: 'rgba(99, 102, 241, 0.12)',
                            border: 'none',
                            color: 'var(--indigo-light)',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                          }}
                        >
                          Ver todo el mes
                        </button>
                      ) : (
                        `${Object.entries(paysByDate).filter(([d]) => {
                          const [y,m] = d.split('-');
                          return +y===calYear && +m-1===calMonth;
                        }).reduce((a,[,v])=>a+v.length,0)} cuotas`
                      )}
                    </span>
                  </div>
                  <div className="payments-list">
                    {selectedDay ? (
                      (paysByDate[selectedDay] || []).map((p, idx) => (
                        <div key={`${selectedDay}-${idx}`} className={`payment-item ${p.inst.paid?'is-paid':''} ${p.inst.overdue&&!p.inst.paid?'is-overdue':''}`}>
                          <span className="pi-date">{fmtDate(selectedDay)}</span>
                          <div className="pi-info">
                            <span className="pi-name">{p.sale.customer_name}</span>
                            <span className="pi-device">{p.sale.device_brand} {p.sale.device_model}</span>
                          </div>
                          <span className="pi-amount">{fmtCOP(p.inst.amount)}</span>
                          {p.inst.paid
                            ? <span className="badge badge-emerald"><CheckCircle2 size={9}/> Pagada</span>
                            : p.inst.overdue
                              ? <span className="badge badge-rose"><AlertTriangle size={9}/> {p.inst.days_overdue}d</span>
                              : <span className="badge badge-neutral"><Clock size={9}/> Pendiente</span>
                          }
                        </div>
                      ))
                    ) : (
                      Object.entries(paysByDate)
                        .filter(([d]) => { const [y,m] = d.split('-'); return +y===calYear && +m-1===calMonth; })
                        .sort(([a],[b]) => a.localeCompare(b))
                        .flatMap(([date, items]) =>
                          items.map((p, idx) => (
                            <div key={`${date}-${idx}`} className={`payment-item ${p.inst.paid?'is-paid':''} ${p.inst.overdue&&!p.inst.paid?'is-overdue':''}`}>
                              <span className="pi-date">{fmtDate(date)}</span>
                              <div className="pi-info">
                                <span className="pi-name">{p.sale.customer_name}</span>
                                <span className="pi-device">{p.sale.device_brand} {p.sale.device_model}</span>
                              </div>
                              <span className="pi-amount">{fmtCOP(p.inst.amount)}</span>
                              {p.inst.paid
                                ? <span className="badge badge-emerald"><CheckCircle2 size={9}/> Pagada</span>
                                : p.inst.overdue
                                  ? <span className="badge badge-rose"><AlertTriangle size={9}/> {p.inst.days_overdue}d</span>
                                  : <span className="badge badge-neutral"><Clock size={9}/> Pendiente</span>
                              }
                            </div>
                          ))
                        )
                    )}

                    {selectedDay && (!paysByDate[selectedDay] || paysByDate[selectedDay].length === 0) && (
                      <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--t3)', fontSize:'12px' }}>
                        Sin pagos programados para el {fmtDate(selectedDay)}.
                      </div>
                    )}
                    {!selectedDay && Object.entries(paysByDate).filter(([d]) => {
                      const [y,m] = d.split('-'); return +y===calYear && +m-1===calMonth;
                    }).length === 0 && (
                      <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--t3)', fontSize:'12px' }}>
                        Sin pagos programados en {MONTHS[calMonth]}.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ALERTS ═════════════════════════════════════════ */}
          {view === 'alerts' && (
            <div className="view-fade">
              <div className="alerts-list">
                {sales.filter(s => getDueSeverity(s) !== 'ok').length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-wrap" style={{ background:'var(--emerald-dim)', color:'var(--emerald)' }}>
                      <ShieldCheck size={28}/>
                    </div>
                    <p className="empty-title">Todo al corriente</p>
                    <p className="empty-sub">No hay alertas de mora activas. Todos los clientes están al día con sus pagos.</p>
                  </div>
                ) : (
                  sales
                    .filter(s => getDueSeverity(s) !== 'ok')
                    .sort((a) => getDueSeverity(a)==='alert' ? -1 : 1)
                    .map(sale => {
                      const sev = getDueSeverity(sale);
                      const ov = sale.installments.filter(i => !i.paid && i.overdue);
                      const maxD = Math.max(...ov.map(i => i.days_overdue));
                      return (
                        <div key={sale.id} className={`alert-card ${sev === 'alert' ? 'critical' : 'warning'}`}>
                          <div className="alert-accent"/>
                          <div className="alert-icon">
                            {sev === 'alert' ? <AlertTriangle size={22}/> : <Clock size={22}/>}
                          </div>
                          <div className="alert-body">
                            <div className="alert-severity-label">
                              {sev === 'alert' ? '⚠ Mora Crítica — Acción Requerida' : '● Pago Atrasado'}
                            </div>
                            <div className="alert-customer">{sale.customer_name}</div>
                            <div className="alert-device-info">
                              {sale.device_brand} {sale.device_model}
                              {sale.serial_number && <> · <span className="code-chip">{sale.serial_number}</span></>}
                              {' '} · {sale.customer_phone}
                            </div>
                            <div className="alert-detail">
                              <strong>{ov.length}</strong> cuota(s) vencida(s) — máximo retraso: <strong>{maxD} día(s)</strong>
                            </div>
                            <div className="overdue-tags">
                              {ov.map(inst => (
                                <span key={inst.number} className="overdue-tag">
                                  C{inst.number} · {fmtDate(inst.due_date)} · {fmtCOP(inst.amount)} · {inst.days_overdue}d
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="alert-actions">
                            {sale.status === 'locked' ? (
                              <button className="btn-primary" id={`btn-unblock-${sale.id}`} onClick={() => executeActionOnSale(sale, 'unlock')} style={{ background: 'var(--emerald)' }}>
                                <Unlock size={13}/> Desbloquear
                              </button>
                            ) : sev === 'alert' && (
                              <button className="btn-danger" id={`btn-block-${sale.id}`} onClick={() => executeActionOnSale(sale, 'lock')}>
                                <Lock size={13}/> Bloquear
                              </button>
                            )}
                            <button className="btn-outline" id={`btn-pay-${sale.id}`} onClick={() => {
                              const oldest = ov.sort((a,b)=>a.number-b.number)[0];
                              if (!oldest) return;
                              setSales(prev => prev.map(s => {
                                if (s.id !== sale.id) return s;
                                return { ...s, installments: s.installments.map(i =>
                                  i.number === oldest.number
                                    ? {...i, paid:true, paid_at:new Date().toISOString(), overdue:false, days_overdue:0}
                                    : i
                                )};
                              }));
                              addLog(`✓ Pago registrado: Cuota ${oldest.number} — ${sale.customer_name}`);
                            }}>
                              <CheckCircle2 size={13}/> Registrar Pago
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── MODAL ────────────────────────────────────────────── */}
      {showModal && (
        <RegisterModal
          saleToEdit={saleToEdit}
          onClose={() => {
            setShowModal(false);
            setSaleToEdit(null);
          }}
          onSave={async (sale) => {
            if (saleToEdit) {
              // Actualizar venta existente
              setSales(prev => {
                const updated = prev.map(s => s.id === saleToEdit.id ? sale : s);
                saveSales(updated);
                return updated;
              });
              addLog(`✓ Venta editada: ${sale.customer_name} — ${sale.device_brand} ${sale.device_model}`);
              syncDeviceWithBackend(sale);
            } else {
              // Registrar nueva venta
              setSales(prev => {
                const updated = [...prev, sale];
                saveSales(updated);
                return updated;
              });
              addLog(`✓ Nueva venta: ${sale.customer_name} — ${sale.device_brand} ${sale.device_model}`);
              syncDeviceWithBackend(sale);
            }
            setShowModal(false);
            setSaleToEdit(null);
          }}
        />
      )}

      <MdmEnrollModal
        isOpen={showMdmModal}
        onClose={() => setShowMdmModal(false)}
        apiUrl={API_URL}
      />

      <AndroidMdmEnrollModal
        isOpen={showAndroidMdmModal}
        onClose={() => setShowAndroidMdmModal(false)}
        apiUrl={API_URL}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Register Sale Modal
// ══════════════════════════════════════════════════════════

function RegisterModal({ onClose, onSave, saleToEdit }: { onClose: () => void; onSave: (s: CreditSale) => void; saleToEdit?: CreditSale | null }) {
  const [f, setF] = useState({
    device_brand: saleToEdit?.device_brand || '',
    device_model: saleToEdit?.device_model || '',
    serial_number: saleToEdit?.serial_number || '',
    imei: saleToEdit?.imei || '',
    customer_name: saleToEdit?.customer_name || '',
    customer_phone: saleToEdit?.customer_phone || '',
    sale_price: saleToEdit?.sale_price.toString() || '',
    down_payment: saleToEdit?.down_payment.toString() || '0',
    frequency: saleToEdit?.frequency || 'monthly' as PaymentFrequency,
    total_installments: saleToEdit?.total_installments.toString() || '12',
    start_date: saleToEdit?.start_date || new Date().toISOString().split('T')[0],
  });

  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const price  = parseFloat(f.sale_price) || 0;
  const down   = parseFloat(f.down_payment) || 0;
  const remain = price - down;
  const count  = Math.max(1, parseInt(f.total_installments) || 1);
  const quot   = remain > 0 ? Math.ceil(remain / count) : 0;

  const firstPayDate = () => {
    const d = new Date(f.start_date);
    d.setDate(d.getDate() + FREQ_DAYS[f.frequency]);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.device_brand || !f.customer_name || !f.sale_price) return;
    const insts = saleToEdit && saleToEdit.total_installments === count
      ? saleToEdit.installments
      : generateInstallments(f.start_date, f.frequency, count, quot);
    onSave({
      id: saleToEdit?.id || `sale-${Date.now()}`,
      device_brand: f.device_brand, device_model: f.device_model,
      serial_number: f.serial_number, imei: f.imei,
      customer_name: f.customer_name, customer_phone: f.customer_phone,
      sale_price: price, down_payment: down,
      frequency: f.frequency, total_installments: count,
      installment_amount: quot, start_date: f.start_date,
      installments: insts, status: saleToEdit?.status || 'active',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div className="modal-header-icon"><CreditCard size={18}/></div>
            <span>{saleToEdit ? 'Editar Venta a Crédito' : 'Registrar Venta a Crédito'}</span>
          </div>
          <button className="icon-btn" onClick={onClose} id="modal-close"><X size={16}/></button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Dispositivo */}
          <div className="modal-section">
            <div className="modal-section-title"><Smartphone size={13}/> Información del Dispositivo</div>
            <div className="form-grid">
              <div>
                <label className="field-label">Marca *</label>
                <input id="inp-brand" required className="field-input" value={f.device_brand} onChange={e => set('device_brand', e.target.value)} placeholder="Samsung, Xiaomi, Motorola…"/>
              </div>
              <div>
                <label className="field-label">Modelo *</label>
                <input id="inp-model" required className="field-input" value={f.device_model} onChange={e => set('device_model', e.target.value)} placeholder="Galaxy A54, Redmi Note 12…"/>
              </div>
              <div>
                <label className="field-label">Número de Serie</label>
                <input id="inp-serial" className="field-input" value={f.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="REF-XXX-001"/>
              </div>
              <div>
                <label className="field-label">IMEI</label>
                <input id="inp-imei" className="field-input" value={f.imei} onChange={e => set('imei', e.target.value)} placeholder="358901234567890"/>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="modal-section">
            <div className="modal-section-title"><User size={13}/> Información del Cliente</div>
            <div className="form-grid">
              <div>
                <label className="field-label">Nombre Completo *</label>
                <input id="inp-name" required className="field-input" value={f.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Juan García López"/>
              </div>
              <div>
                <label className="field-label">Teléfono / WhatsApp</label>
                <input id="inp-phone" className="field-input" value={f.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="+57 300 000 0000"/>
              </div>
            </div>
          </div>

          {/* Financiamiento */}
          <div className="modal-section">
            <div className="modal-section-title"><DollarSign size={13}/> Plan de Financiamiento</div>
            <div className="form-grid">
              <div>
                <label className="field-label">Precio de Venta (COP) *</label>
                <input id="inp-price" type="number" required className="field-input" value={f.sale_price} onChange={e => set('sale_price', e.target.value)} placeholder="1200000"/>
              </div>
              <div>
                <label className="field-label">Cuota Inicial (COP)</label>
                <input id="inp-down" type="number" className="field-input" value={f.down_payment} onChange={e => set('down_payment', e.target.value)} placeholder="0"/>
              </div>
              <div>
                <label className="field-label">Frecuencia de Pago</label>
                <select id="inp-freq" className="field-input" value={f.frequency} onChange={e => set('frequency', e.target.value)}>
                  <option value="weekly">Semanal — cada 7 días</option>
                  <option value="biweekly">Quincenal — cada 15 días</option>
                  <option value="monthly">Mensual — cada 30 días</option>
                </select>
              </div>
              <div>
                <label className="field-label">Número de Cuotas</label>
                <input id="inp-count" type="number" min="1" max="60" className="field-input" value={f.total_installments} onChange={e => set('total_installments', e.target.value)}/>
              </div>
              <div>
                <label className="field-label">Fecha de Inicio</label>
                <input id="inp-date" type="date" className="field-input" value={f.start_date} onChange={e => set('start_date', e.target.value)}/>
              </div>
            </div>

            {/* Summary */}
            {price > 0 && (
              <div className="finance-summary">
                <div className="finance-summary-header">Resumen del plan</div>
                <div className="finance-summary-grid">
                  <div className="finance-summary-item">
                    <div className="fs-label">Saldo a financiar</div>
                    <div className="fs-value">{fmtCOP(remain)}</div>
                  </div>
                  <div className="finance-summary-item">
                    <div className="fs-label">Valor de cada cuota</div>
                    <div className="fs-value highlight">{fmtCOP(quot)}</div>
                  </div>
                  <div className="finance-summary-item">
                    <div className="fs-label">Total cuotas</div>
                    <div className="fs-value">{count} {FREQ_LABELS[f.frequency].toLowerCase()}(es)</div>
                  </div>
                  <div className="finance-summary-item">
                    <div className="fs-label">Primer pago</div>
                    <div className="fs-value">{fmtDate(firstPayDate())}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
          <button
            type="submit"
            id="btn-save-sale"
            className="btn-primary"
            onClick={handleSubmit as any}
            disabled={!f.device_brand || !f.customer_name || !f.sale_price}
          >
            {saleToEdit ? <CheckCircle2 size={15}/> : <Plus size={15}/>}
            {saleToEdit ? ' Guardar Cambios' : ' Registrar Venta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// iOS MDM Enrollment Modal
// ══════════════════════════════════════════════════════════
interface MdmEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
}

function MdmEnrollModal({ isOpen, onClose, apiUrl }: MdmEnrollModalProps) {
  if (!isOpen) return null;

  const enrollUrl = `${apiUrl}/api/v1/mdm/enroll`;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '450px', padding: '24px' }}>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--indigo-dim)', color: 'var(--indigo)', padding: '6px', borderRadius: '6px' }}>
              <Laptop size={16} />
            </div>
            <h2 className="modal-title" style={{ fontSize: '16px', margin: 0 }}>Inscripción de Dispositivo iOS</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16}/></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', padding: '10px 0' }}>
          <p style={{ color: 'var(--t3)', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
            Escanee este código QR con la cámara del iPhone o iPad para descargar e instalar el perfil de control y supervisión de MDM.
          </p>

          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <QRCodeSVG value={enrollUrl} size={180} />
          </div>

          <div className="code-chip" style={{ wordBreak: 'break-all', fontSize: '11px', padding: '8px 12px' }}>
            {enrollUrl}
          </div>

          <div style={{ width: '100%', textAlign: 'left', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--t1)' }}>Pasos en el iPhone:</strong>
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--t2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Escanee el código QR y descargue el perfil en Safari.</li>
              <li>Vaya a <strong>Ajustes &gt; Perfil descargado</strong>.</li>
              <li>Pulse <strong>Instalar</strong> y autorice la administración del sistema.</li>
            </ol>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn-primary w-full" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Android MDM Enrollment Modal
// ══════════════════════════════════════════════════════════
interface AndroidMdmEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
}

function AndroidMdmEnrollModal({ isOpen, onClose, apiUrl }: AndroidMdmEnrollModalProps) {
  if (!isOpen) return null;

  const downloadUrl = `${apiUrl}/app-debug.apk`;
  const checksum = "PV5Go8TLPphfhPeto1hKR7kzIySrFy2HSBvdP1oBUA4";
  
  const qrPayload = {
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.codecraft.control/com.codecraft.control.DeviceAdminRcvr",
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": downloadUrl,
    "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": checksum,
    "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true
  };

  const qrString = JSON.stringify(qrPayload);

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '6px', borderRadius: '6px' }}>
              <Smartphone size={16} />
            </div>
            <h2 className="modal-title" style={{ fontSize: '16px', margin: 0 }}>Inscripción de Dispositivo Android</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16}/></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', padding: '10px 0' }}>
          <p style={{ color: 'var(--t3)', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
            Toque 6 veces seguidas la pantalla de bienvenida del celular restablecido de fábrica y escanee este código QR para autoinstalar la app de protección.
          </p>

          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <QRCodeSVG value={qrString} size={180} />
          </div>

          <div style={{ width: '100%', textAlign: 'left', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--t1)' }}>Instrucciones de Provisión:</strong>
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--t2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Enciende el celular Android en su pantalla de bienvenida inicial.</li>
              <li>Toca <strong>6 veces seguidas</strong> la pantalla en el mismo punto vacío.</li>
              <li>Conéctate a una red Wi-Fi cuando el asistente lo solicite.</li>
              <li>Apunta la cámara para escanear este código QR.</li>
              <li>El sistema descargará e instalará la app como administrador absoluto.</li>
            </ol>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn-primary w-full" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  );
}

