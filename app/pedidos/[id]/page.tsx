'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/contexts/auth-context';
import type { Pedido, ApiResponse } from '@/types';
import { formatLempira } from '@/lib/format';

const ESTADO_COLORES: Record<string, string> = {
  pendiente: 'bg-warning/10 text-warning border-warning',
  pagado: 'bg-blue-500/10 text-blue-500 border-blue-500',
  enviado: 'bg-accent/10 text-accent border-accent',
  entregado: 'bg-success/10 text-success border-success',
  cancelado: 'bg-destructive/10 text-destructive border-destructive',
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function PedidoDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isNuevo = searchParams.get('nuevo') === 'true';

  useEffect(() => {
    async function fetchPedido() {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`/api/pedidos?id=${params.id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data: ApiResponse<Pedido> = await res.json();
        if (data.success && data.data) {
          setPedido(data.data);
        }
      } catch (error) {
        console.error('Error fetching pedido:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPedido();
  }, [params.id]);

  if (!usuario) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">Inicia sesion para ver tu pedido</h1>
            <Link href="/auth/login" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground">
              Iniciar sesion
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 w-48 rounded bg-muted" />
              <div className="mt-8 h-64 rounded-lg bg-muted" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">Pedido no encontrado</h1>
            <Link href="/pedidos" className="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground">
              Ver mis pedidos
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
          {/* Success message */}
          {isNuevo && (
            <div className="mb-8 rounded-lg bg-success/10 p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12 text-success">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-success">Pedido realizado con exito</h2>
              <p className="mt-1 text-sm text-success/80">
                Gracias por tu compra. Te enviaremos un correo con los detalles.
              </p>
            </div>
          )}

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Inicio</Link>
            <span>/</span>
            <Link href="/pedidos" className="hover:text-foreground">Mis pedidos</Link>
            <span>/</span>
            <span className="text-foreground">#{pedido.id}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Order Details */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="font-serif text-2xl font-bold">Pedido #{pedido.id}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Realizado el {new Date(pedido.creado_en).toLocaleDateString('es-HN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`self-start rounded-full border px-4 py-2 text-sm font-medium ${ESTADO_COLORES[pedido.estado] || 'bg-muted text-muted-foreground border-border'}`}>
                    {ESTADO_LABELS[pedido.estado] || pedido.estado}
                  </span>
                </div>

                {/* Items */}
                <div className="mt-8">
                  <h2 className="font-medium">Productos</h2>
                  <div className="mt-4 divide-y divide-border">
                    {pedido.items?.map((item) => (
                      <div key={item.id} className="flex gap-4 py-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                          {item.imagen_url ? (
                            <img src={item.imagen_url} alt={item.nombre_producto || ''}
                              className="h-full w-full object-contain p-1" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-6 w-6 text-muted-foreground/30">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.nombre_producto}</h3>
                          {item.nombre_variante && (
                            <p className="text-sm text-muted-foreground">{item.nombre_variante}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {item.cantidad} x {formatLempira(item.precio_unitario)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatLempira(item.cantidad * item.precio_unitario)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="font-medium">Resumen</h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatLempira(pedido.monto_total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envio</span>
                      <span className="text-success">Gratis</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatLempira(pedido.monto_total)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="font-medium">Necesitas ayuda?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Contacta a nuestro equipo de soporte para cualquier pregunta sobre tu pedido.
                  </p>
                  <a
                    href="mailto:soporte@tecnoworld.hn"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    soporte@tecnoworld.hn
                  </a>
                </div>

                <Link
                  href="/pedidos"
                  className="block w-full rounded-full border border-border py-3 text-center text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Ver todos mis pedidos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
