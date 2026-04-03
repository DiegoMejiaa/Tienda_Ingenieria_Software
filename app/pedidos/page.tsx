'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import type { Pedido, ApiResponse } from '@/types';

const ESTADO_COLORES: Record<string, string> = {
  pendiente: 'bg-warning/10 text-warning',
  pagado: 'bg-blue-500/10 text-blue-500',
  enviado: 'bg-accent/10 text-accent',
  entregado: 'bg-success/10 text-success',
  cancelado: 'bg-destructive/10 text-destructive',
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function PedidosPage() {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPedidos() {
      if (!usuario) return;
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`/api/pedidos?id_usuario=${usuario.id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data: ApiResponse<Pedido[]> = await res.json();
        if (data.success && data.data) {
          setPedidos(data.data);
        }
      } catch (error) {
        console.error('Error fetching pedidos:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPedidos();
  }, [usuario]);

  if (!usuario) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">Inicia sesion para ver tus pedidos</h1>
            <Link href="/auth/login" className="btn-primary mt-6 inline-flex px-8 py-3 transition-all duration-150 active:scale-95">
              Iniciar sesion
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-bold">Mis pedidos</h1>
          <p className="mt-2 text-muted-foreground">
            Revisa el estado de tus compras
          </p>

          {isLoading ? (
            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-24 rounded bg-muted" />
                    <div className="h-6 w-20 rounded-full bg-muted" />
                  </div>
                  <div className="mt-4 h-4 w-48 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : pedidos.length === 0 ? (
            <div className="mt-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="mx-auto h-16 w-16 text-muted-foreground">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold">No tienes pedidos</h2>
              <p className="mt-2 text-muted-foreground">
                Cuando realices una compra, aparecera aqui
              </p>
              <Link href="/productos" className="btn-primary mt-6 inline-flex px-8 py-3 transition-all duration-150 active:scale-95">
                Ir a comprar
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {pedidos.map((pedido) => (
                <Link
                  key={pedido.id}
                  href={`/pedidos/${pedido.id}`}
                  className="block rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="font-semibold">Pedido #{pedido.id}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_COLORES[pedido.estado] || 'bg-muted text-muted-foreground'}`}>
                          {ESTADO_LABELS[pedido.estado] || pedido.estado}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(pedido.creado_en).toLocaleDateString('es-HN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end">
                      <p className="text-lg font-semibold">L {pedido.monto_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <span className="text-sm text-accent">Ver detalles</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
