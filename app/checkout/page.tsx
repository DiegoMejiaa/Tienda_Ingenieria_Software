'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/contexts/auth-context';
import type { ApiResponse, Pedido } from '@/types';
import { formatLempira } from '@/lib/format';

type MetodoPago = 'tarjeta' | 'paypal';

export default function CheckoutPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { carrito, refreshCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('tarjeta');

  const items = carrito?.items || [];
  const total = carrito?.total || 0;

  const getAuthHeaders = (): Record<string, string> => {
    const token = sessionStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const crearPedido = async () => {
    const authHeaders = getAuthHeaders();
    const pedidoRes = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        id_usuario: usuario!.id,
        items: items.map((item) => ({ id_variante: item.id_variante, cantidad: item.cantidad })),
      }),
    });
    const pedidoData: ApiResponse<Pedido> = await pedidoRes.json();
    if (!pedidoData.success || !pedidoData.data) {
      throw new Error(pedidoData.error || 'Error al crear el pedido');
    }
    return pedidoData.data;
  };

  const registrarPago = async (idPedido: number, metodo: string) => {
    const authHeaders = getAuthHeaders();
    await fetch('/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ id_pedido: idPedido, monto: total, metodo_pago: metodo, estado: 'pagado' }),
    });
  };

  const handleTarjeta = async () => {
    if (!usuario || items.length === 0) return;
    setIsProcessing(true);
    setError('');
    try {
      const pedido = await crearPedido();
      await registrarPago(pedido.id, 'tarjeta');
      await refreshCart();
      router.push(`/pedidos/${pedido.id}?nuevo=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!usuario) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">Inicia sesion para continuar</h1>
            <p className="mt-2 text-muted-foreground">Necesitas una cuenta para realizar tu compra</p>
            <Link href="/auth/login" className="btn-primary mt-6 inline-flex px-8 py-3 transition-all duration-150 active:scale-95">
              Iniciar sesion
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">Tu carrito esta vacio</h1>
            <p className="mt-2 text-muted-foreground">Agrega productos para continuar con el checkout</p>
            <Link href="/productos" className="btn-primary mt-6 inline-flex px-8 py-3 transition-all duration-150 active:scale-95">
              Ver productos
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
        <main className="flex-1 bg-secondary">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-serif text-3xl font-bold">Checkout</h1>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {/* Resumen del pedido */}
              <div className="order-2 lg:order-1">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold">Resumen del pedido</h2>
                  <div className="mt-6 divide-y divide-border">
                    {items.map((item) => {
                      const precio = item.precio_oferta ?? item.precio ?? 0;
                      return (
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
                            {item.nombre_variante && <p className="text-sm text-muted-foreground">{item.nombre_variante}</p>}
                            <p className="text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                          </div>
                          <p className="font-semibold">{formatLempira(precio * item.cantidad)}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 space-y-3 border-t border-border pt-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatLempira(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Envio</span>
                      <span className="text-success">Gratis</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatLempira(total)}</span>
                    </div>
                    {metodoPago === 'paypal' && (
                      <p className="text-xs text-muted-foreground text-right">Pago procesado de forma segura via PayPal</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Formulario de pago */}
              <div className="order-1 lg:order-2">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-lg font-semibold">Metodo de pago</h2>

                  {/* Selector de método */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMetodoPago('tarjeta')}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-all duration-150 active:scale-95 ${
                        metodoPago === 'tarjeta' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                      </svg>
                      Tarjeta
                    </button>
                    <button
                      onClick={() => setMetodoPago('paypal')}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-all duration-150 active:scale-95 ${
                        metodoPago === 'paypal' ? 'border-[#0070ba] bg-[#0070ba]/5' : 'border-border hover:border-[#0070ba]/50'
                      }`}
                    >
                      {/* Logo PayPal SVG */}
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#0070ba]" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                      </svg>
                      PayPal
                    </button>
                  </div>

                  {/* Formulario tarjeta */}
                  {metodoPago === 'tarjeta' && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium">Numero de tarjeta</label>
                        <input type="text" placeholder="1234 5678 9012 3456"
                          className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium">Expiracion</label>
                          <input type="text" placeholder="MM/AA"
                            className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">CVV</label>
                          <input type="text" placeholder="123"
                            className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Nombre en la tarjeta</label>
                        <input type="text" placeholder="Juan Perez"
                          defaultValue={`${usuario.nombre} ${usuario.apellido}`}
                          className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
                      </div>
                    </div>
                  )}

                  {/* Info PayPal */}
                  {metodoPago === 'paypal' && (
                    <div className="mt-6 rounded-lg bg-[#0070ba]/5 border border-[#0070ba]/20 p-4 text-sm text-muted-foreground">
                      Seras redirigido a PayPal para completar tu pago de forma segura. El monto se cobrara en USD.
                    </div>
                  )}

                  {/* Dirección de envío */}
                  <div className="mt-6 border-t border-border pt-6">
                    <h3 className="font-medium">Direccion de envio</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium">Direccion</label>
                        <input type="text" placeholder="Calle Principal 123"
                          className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium">Ciudad</label>
                          <input type="text" placeholder="Ciudad"
                            className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Codigo postal</label>
                          <input type="text" placeholder="12345"
                            className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
                  )}

                  {/* Botón tarjeta */}
                  {metodoPago === 'tarjeta' && (
                    <button
                      onClick={handleTarjeta}
                      disabled={isProcessing}
                      className="btn-primary mt-6 w-full py-3"
                    >
                      {isProcessing ? 'Procesando...' : `Pagar ${formatLempira(total)}`}
                    </button>
                  )}

                  {/* Botones PayPal simulado */}
                  {metodoPago === 'paypal' && (
                    <div className="mt-6">
                      <button
                        onClick={handleTarjeta}
                        disabled={isProcessing}
                        className="w-full rounded-full bg-[#0070ba] py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#005ea6] disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? 'Procesando...' : (
                          <>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                            </svg>
                            Pagar con PayPal — {formatLempira(total)}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Al completar la compra aceptas nuestros terminos y condiciones
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
  );
}
