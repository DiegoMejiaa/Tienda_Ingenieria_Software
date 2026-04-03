'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import { formatLempira } from '@/lib/format';

export default function CarritoPage() {
  const { usuario } = useAuth();
  const { carrito, isLoading, updateQuantity, removeItem } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

  const handleUpdateQuantity = async (id_item: number, cantidad: number) => {
    setUpdatingItems((prev) => new Set(prev).add(id_item));
    await updateQuantity(id_item, cantidad);
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      next.delete(id_item);
      return next;
    });
  };

  const handleRemove = async (id_item: number) => {
    setUpdatingItems((prev) => new Set(prev).add(id_item));
    await removeItem(id_item);
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      next.delete(id_item);
      return next;
    });
  };

  if (!usuario) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="mx-auto h-16 w-16 text-muted-foreground">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <h1 className="mt-6 text-2xl font-bold">Inicia sesion para ver tu carrito</h1>
            <p className="mt-2 text-muted-foreground">
              Necesitas una cuenta para agregar productos al carrito
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth/login" className="btn-primary px-8 py-3 transition-all duration-150 active:scale-95">
                Iniciar sesion
              </Link>
              <Link href="/auth/registro" className="btn-secondary px-8 py-3 transition-all duration-150 active:scale-95">
                Crear cuenta
              </Link>
            </div>
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
            <h1 className="font-serif text-3xl font-bold">Tu carrito</h1>
            <div className="mt-8 animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 rounded-lg border border-border p-4">
                  <div className="h-24 w-24 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-1/4 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = carrito?.items || [];
  const total = carrito?.total || 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-bold">Tu carrito</h1>

          {items.length === 0 ? (
            <div className="mt-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="mx-auto h-16 w-16 text-muted-foreground">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold">Tu carrito esta vacio</h2>
              <p className="mt-2 text-muted-foreground">
                Agrega productos para comenzar a comprar
              </p>
              <Link href="/productos" className="btn-primary mt-6 inline-flex px-8 py-3 transition-all duration-150 active:scale-95">
                Ver productos
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              {/* Items */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {items.map((item) => {
                    const precioUnitario = item.precio_oferta ?? item.precio ?? 0;
                    const isUpdating = updatingItems.has(item.id);
                    
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-4 rounded-lg border border-border bg-card p-4 transition-opacity ${isUpdating ? 'opacity-50' : ''}`}

                      >
                        {/* Imagen del producto */}
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-secondary overflow-hidden">
                          {item.imagen_url ? (
                            <img src={item.imagen_url} alt={item.nombre_producto || ''}
                              className="h-full w-full object-contain p-2" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-8 w-8 text-muted-foreground/30">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{item.nombre_producto}</h3>
                              {item.nombre_variante && (
                                <p className="text-sm text-muted-foreground">{item.nombre_variante}</p>
                              )}
                              <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                            </div>
                            <p className="font-semibold">{formatLempira(precioUnitario * item.cantidad)}</p>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                                disabled={item.cantidad <= 1 || isUpdating}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-all duration-150 hover:bg-secondary active:scale-90 cursor-pointer disabled:opacity-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                </svg>
                              </button>
                              <span className="w-8 text-center">{item.cantidad}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                                disabled={isUpdating}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-all duration-150 hover:bg-secondary active:scale-90 cursor-pointer disabled:opacity-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemove(item.id)}
                              disabled={isUpdating}
                              className="text-sm text-destructive hover:underline disabled:opacity-50 transition-all duration-150 active:scale-95"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold">Resumen del pedido</h2>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatLempira(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envio</span>
                      <span>Calculado al checkout</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatLempira(total)}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="btn-primary mt-6 block w-full py-3 text-center transition-all duration-150 active:scale-95"
                  >
                    Proceder al checkout
                  </Link>

                  <Link
                    href="/productos"
                    className="mt-3 block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95"
                  >
                    Continuar comprando
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

