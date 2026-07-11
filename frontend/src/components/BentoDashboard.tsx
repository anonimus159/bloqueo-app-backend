import React, { useMemo, useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs';
import {
  Activity,
  Users,
  TrendingUp,
  AlertTriangle,
  Lock,
  DollarSign,
  Plus,
  Smartphone
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useAppStore } from '../store/useAppStore';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#6366f1']; // Emerald, Amber, Rose, Indigo

export const BentoDashboard: React.FC = () => {
  const { sales, setView } = useAppStore();
  const gridRef = useRef<HTMLDivElement>(null);

  // Handle Parallax Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, card: HTMLDivElement) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = (y - centerY) / 20;
    const tiltY = (centerX - x) / 20;

    anime({
      targets: card,
      rotateX: tiltX,
      rotateY: tiltY,
      scale: 1.02,
      duration: 100,
      easing: 'linear'
    });
  };

  const handleMouseLeave = (card: HTMLDivElement) => {
    anime({
      targets: card,
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 600,
      easing: 'easeOutElastic(1, .8)'
    });
  };

  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.bento-card');
      anime({
        targets: cards,
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: 'easeOutElastic(1, .8)'
      });
    }
  }, []);

  const stats = useMemo(() => {
    const total = sales.length;
    const completedCount = sales.filter(s => s.status === 'completed').length;
    const activeCount = sales.filter(s => s.status === 'active').length;
    const overdueCount = sales.filter(s => s.status === 'overdue').length;
    const lockedCount = sales.filter(s => s.status === 'locked').length;
    
    const collected = sales.reduce((acc, sale) => {
      const paid = sale.installments.filter(i => i.paid).reduce((sum, i) => sum + i.amount, 0);
      return acc + sale.down_payment + paid;
    }, 0);
    
    const pending = sales.reduce((acc, sale) => {
      const unpaid = sale.installments.filter(i => !i.paid).reduce((sum, i) => sum + i.amount, 0);
      return acc + unpaid;
    }, 0);

    return { total, completedCount, activeCount, overdueCount, lockedCount, collected, pending };
  }, [sales]);

  const { activeCount, overdueCount, completedCount, lockedCount, collected: recaudadoTotal } = stats;

  // Data for Charts
  const deviceStatusData = [
    { name: 'Activos', value: activeCount },
    { name: 'En Mora', value: overdueCount },
    { name: 'Pagados', value: completedCount },
    { name: 'Bloqueados', value: lockedCount }
  ].filter(d => d.value > 0);

  // Compute Brand Distribution
  const brandData = useMemo(() => {
    const safeSales = Array.isArray(sales) ? sales : [];
    const brands: Record<string, number> = {};
    safeSales.forEach(s => {
      const b = (s as any).device_brand || 'Otro';
      brands[b] = (brands[b] || 0) + 1;
    });
    return Object.keys(brands).map(key => ({
      brand: key,
      count: brands[key],
      fullMark: safeSales.length
    }));
  }, [sales]);

  // Mock timeline data for revenue if no real dates exist
  const revenueData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'];
    return months.map((m) => ({
      name: m,
      Recaudado: Math.floor(Math.random() * 5000000) + 1000000,
      Proyectado: Math.floor(Math.random() * 6000000) + 1500000,
    }));
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

  return (
    <div 
      ref={gridRef}
      className="bento-dashboard"
      style={{ padding: '24px' }}
    >
      {/* Row 1: Key Metrics */}
      <div className="bento-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {[
          { icon: <Users size={20} color="var(--indigo)" />, label: 'Clientes Activos', value: activeCount, color: 'var(--indigo)' },
          { icon: <TrendingUp size={20} color="var(--emerald)" />, label: 'Ingresos Mensuales', value: formatCurrency(recaudadoTotal), color: 'var(--emerald)' },
          { icon: <AlertTriangle size={20} color="var(--amber)" />, label: 'Equipos en Mora', value: overdueCount, color: 'var(--amber)' },
          { icon: <Lock size={20} color="var(--rose)" />, label: 'Dispositivos Bloqueados', value: lockedCount, color: 'var(--rose)' }
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bento-card stat-card" 
            style={{ ...cardStyle, perspective: '1000px', transformStyle: 'preserve-3d' }}
            onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
            onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ background: `color-mix(in srgb, ${stat.color} 15%, transparent)`, padding: '10px', borderRadius: '12px' }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--t3)', fontWeight: 500 }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--t1)', marginTop: '4px', letterSpacing: '-0.5px' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className="bento-row" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Area Chart: Revenue */}
        <div className="bento-card" style={{ ...cardStyle, flex: '2 1 500px', minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Activity size={18} color="var(--indigo)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Flujo de Recaudo</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRecaudado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--emerald)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--emerald)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--t3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--t3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000000)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-glass)', borderColor: 'var(--border)', borderRadius: 'var(--r)' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Area type="monotone" dataKey="Recaudado" stroke="var(--emerald)" fillOpacity={1} fill="url(#colorRecaudado)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Status */}
        <div className="bento-card" style={{ ...cardStyle, flex: '1 1 300px', minWidth: '250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <DollarSign size={18} color="var(--emerald)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Distribución de Cartera</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            {deviceStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {deviceStatusData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-glass)', borderColor: 'var(--border)', borderRadius: 'var(--r)' }}
                    itemStyle={{ color: 'var(--t1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>

        {/* Radar Chart: Brands */}
        <div className="bento-card" style={{ ...cardStyle, flex: '1 1 300px', minWidth: '250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Smartphone size={18} color="var(--indigo)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Marcas de Dispositivos</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            {brandData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={brandData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="brand" tick={{ fill: 'var(--t3)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                  <Radar name="Dispositivos" dataKey="count" stroke="var(--indigo)" fill="var(--indigo)" fillOpacity={0.5} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-glass)', borderColor: 'var(--border)', borderRadius: 'var(--r)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}>
                No hay datos
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Row 3: Quick Actions */}
      <div className="bento-row" style={{ display: 'flex', gap: '20px', marginTop: '24px' }}>
        <div className="bento-card" style={{ ...cardStyle, flex: 1 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Acciones Rápidas</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setView('credits')}>
              <Plus size={16} /> Nueva Venta
            </button>
            <button className="btn-outline" onClick={() => {
              const el = document.getElementById('btn-register-sale');
              if(el) el.click();
            }}>
              <Users size={16} /> Buscar Cliente
            </button>
            <button className="btn-outline" style={{ color: 'var(--rose)', borderColor: 'var(--rose-dim)' }} onClick={() => setView('alerts')}>
              <AlertTriangle size={16} /> Ver Mora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  padding: '24px',
  boxShadow: 'var(--shadow)',
  backdropFilter: 'blur(20px)',
  position: 'relative',
  overflow: 'hidden'
};
