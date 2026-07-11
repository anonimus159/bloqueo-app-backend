import { create } from 'zustand';

export type Theme = 'dark' | 'light';
export type ActiveView = 'dashboard' | 'credits' | 'calendar' | 'alerts';
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface Device {
  id: string;
  serial_number: string;
  imei: string;
  brand: string;
  model: string;
  status: 'active' | 'locked' | 'suspended';
  customer_name: string;
  customer_phone: string;
  last_sync_at: string;
  device_type?: 'android' | 'ios';
  udid?: string;
  push_magic?: string;
}

export interface Installment {
  number: number;
  due_date: string;
  amount: number;
  paid: boolean;
  paid_at?: string;
  overdue: boolean;
  days_overdue: number;
}

export interface CreditSale {
  id: string;
  device_brand: string;
  device_model: string;
  serial_number: string;
  imei: string;
  customer_name: string;
  customer_phone: string;
  sale_price: number;
  down_payment: number;
  frequency: PaymentFrequency;
  total_installments: number;
  installment_amount: number;
  start_date: string;
  installments: Installment[];
  status: 'active' | 'completed' | 'overdue' | 'locked';
}

interface AppState {
  // Auth
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  logout: () => void;

  // UI State
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  view: ActiveView;
  setView: (view: ActiveView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isNotificationCenterOpen: boolean;
  setNotificationCenterOpen: (open: boolean) => void;
  
  // Data State
  devices: Device[];
  setDevices: (devices: Device[]) => void;
  sales: CreditSale[];
  setSales: (sales: CreditSale[] | ((prev: CreditSale[]) => CreditSale[])) => void;
  selectedDevice: Device | null;
  setSelectedDevice: (device: Device | null) => void;
  
  // Logs
  logs: string[];
  addLog: (msg: string) => void;
  clearLogs: () => void;
}

// Helpers
const loadSales = (): CreditSale[] => {
  try {
    const raw = localStorage.getItem('fc_sales');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s: any) => s && typeof s === 'object' && Array.isArray(s.installments));
  } catch {
    return [];
  }
};

const saveSales = (s: CreditSale[]) => {
  if (Array.isArray(s)) {
    localStorage.setItem('fc_sales', JSON.stringify(s));
  }
};

const loadTheme = (): Theme => {
  return (localStorage.getItem('fc_theme') as Theme) || 'dark';
};

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  authToken: localStorage.getItem('fc_token'),
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('fc_token', token);
    } else {
      localStorage.removeItem('fc_token');
    }
    set({ authToken: token });
  },
  logout: () => {
    localStorage.removeItem('fc_token');
    set({ authToken: null });
  },

  // UI
  theme: loadTheme(),
  setTheme: (theme) => {
    localStorage.setItem('fc_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },
  view: 'dashboard',
  setView: (view) => set({ view }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set((state) => ({ 
    sidebarOpen: typeof open === 'function' ? open(state.sidebarOpen) : open 
  })),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  isNotificationCenterOpen: false,
  setNotificationCenterOpen: (open) => set({ isNotificationCenterOpen: open }),

  // Data
  devices: [],
  setDevices: (devices) => set({ devices }),
  sales: loadSales(),
  setSales: (updater) => {
    set((state) => {
      const newSales = typeof updater === 'function' ? updater(state.sales) : updater;
      saveSales(newSales);
      return { sales: newSales };
    });
  },
  selectedDevice: null,
  setSelectedDevice: (selectedDevice) => set({ selectedDevice }),

  // Logs
  logs: ['Sistema listo y escuchando.', 'Servidor iniciado correctamente.'],
  addLog: (msg) => {
    const ts = new Date().toLocaleTimeString('es-CO');
    set((state) => ({ logs: [`[${ts}] ${msg}`, ...state.logs.slice(0, 49)] }));
  },
  clearLogs: () => set({ logs: [] })
}));
