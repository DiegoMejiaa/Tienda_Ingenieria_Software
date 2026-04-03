'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Turno {
  id: number;
  id_tienda: number;
  id_usuario: number;
  hora_inicio: string;
  hora_fin: string | null;
  efectivo_inicial: number;
  efectivo_final: number | null;
  nombre_tienda?: string;
  nombre_cajero?: string;
}

interface TurnoContextType {
  turno: Turno | null;
  isLoading: boolean;
  iniciarTurno: (id_tienda: number, id_usuario: number, efectivo_inicial: number) => Promise<boolean>;
  cerrarTurno: (efectivo_final: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const TurnoContext = createContext<TurnoContextType | null>(null);

function getHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function TurnoProvider({ children, userId }: { children: ReactNode; userId: number }) {
  const [turno, setTurno] = useState<Turno | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTurnoActivo = async () => {
    try {
      // Busca turno activo del usuario (hora_fin IS NULL)
      const res = await fetch('/api/turnos', { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        const activo = (data.data as Turno[]).find(
          t => t.id_usuario === userId && t.hora_fin === null
        );
        setTurno(activo || null);
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (userId) fetchTurnoActivo();
  }, [userId]);

  const iniciarTurno = async (id_tienda: number, id_usuario: number, efectivo_inicial: number) => {
    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ id_tienda, id_usuario, efectivo_inicial }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Fetch again to get nombre_tienda
        await fetchTurnoActivo();
        return true;
      }
      return false;
    } catch { return false; }
  };

  const cerrarTurno = async (efectivo_final: number) => {
    if (!turno) return false;
    try {
      const res = await fetch('/api/turnos', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ id: turno.id, cerrar: true, efectivo_final }),
      });
      const data = await res.json();
      if (data.success) { setTurno(null); return true; }
      return false;
    } catch { return false; }
  };

  return (
    <TurnoContext.Provider value={{ turno, isLoading, iniciarTurno, cerrarTurno, refetch: fetchTurnoActivo }}>
      {children}
    </TurnoContext.Provider>
  );
}

export function useTurno() {
  const ctx = useContext(TurnoContext);
  if (!ctx) throw new Error('useTurno debe usarse dentro de TurnoProvider');
  return ctx;
}
