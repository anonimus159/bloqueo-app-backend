import React, { useEffect, useRef } from 'react';
// @ts-ignore
import anime from 'animejs';
import { Bell, AlertTriangle, ShieldCheck, Clock, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const NotificationCenter: React.FC = () => {
  const { isNotificationCenterOpen, setNotificationCenterOpen, sales } = useAppStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifications = sales
    .filter(s => s.status === 'overdue' || s.status === 'locked')
    .slice(0, 5)
    .map(s => ({
      id: s.id,
      title: s.status === 'locked' ? 'Dispositivo Bloqueado' : 'Pago Atrasado',
      desc: `${s.customer_name} - ${s.device_brand} ${s.device_model}`,
      type: s.status,
      time: 'Reciente'
    }));

  useEffect(() => {
    if (isNotificationCenterOpen && dropdownRef.current) {
      anime({
        targets: dropdownRef.current,
        translateY: [-10, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutExpo'
      });

      const items = dropdownRef.current.querySelectorAll('.noti-item');
      if (items.length > 0) {
        anime({
          targets: items,
          translateX: [15, 0],
          opacity: [0, 1],
          delay: anime.stagger(40, { start: 100 }),
          duration: 400,
          easing: 'easeOutElastic(1, .8)'
        });
      }
    }
  }, [isNotificationCenterOpen]);

  if (!isNotificationCenterOpen) return null;

  const handleClose = () => {
    if (dropdownRef.current) {
      anime({
        targets: dropdownRef.current,
        translateY: [0, -10],
        opacity: [1, 0],
        duration: 150,
        easing: 'easeInQuad',
        complete: () => setNotificationCenterOpen(false)
      });
    } else {
      setNotificationCenterOpen(false);
    }
  };

  return (
    <>
      <div className="noti-backdrop" onClick={handleClose} />
      <div className="noti-dropdown" ref={dropdownRef}>
        <div className="noti-header">
          <div className="noti-title">
            <Bell size={14} /> Notificaciones
            <span className="noti-badge">{notifications.length}</span>
          </div>
          <button className="noti-close" onClick={handleClose}><X size={14} /></button>
        </div>
        <div className="noti-body">
          {notifications.length === 0 ? (
            <div className="noti-empty">
              <ShieldCheck size={24} className="noti-empty-icon" />
              <span>Todo está en orden. No hay alertas críticas.</span>
            </div>
          ) : (
            <div className="noti-list">
              {notifications.map((n) => (
                <div key={n.id} className="noti-item">
                  <div className={`noti-icon ${n.type}`}>
                    {n.type === 'locked' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="noti-content">
                    <div className="noti-item-title">{n.title}</div>
                    <div className="noti-item-desc">{n.desc}</div>
                    <div className="noti-item-time">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="noti-footer">
          <button className="noti-view-all" onClick={() => { handleClose(); useAppStore.getState().setView('alerts'); }}>
            Ver todas las alertas
          </button>
        </div>
      </div>
    </>
  );
};
