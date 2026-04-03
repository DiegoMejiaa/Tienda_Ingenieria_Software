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
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const crearPedido = async () => {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        id_usuario: usuario!.id,
        items: items.map(i => ({ id_variante: i.id_variante, cantidad: i.cantidad })),
      }),
    });
    const data: ApiResponse<Pedido> = await res.json();
    if (!data.success || !data.data) throw new Error(data.error || 'Error al crear el pedido');
    return data.data;
  };

  const registrarPago = async (idPedido: number, metodo: string) => {
    await fetch('/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ id_pedido: idPedido, monto: total, metodo_pago: metodo, estado: 'pagado' }),
    });
  };

  const handlePagar = async () => {
    if (!usuario || items.length === 0) return;
    setIsProcessing(true); setError('');
    try {
      const pedido = await crearPedido();
      await registrarPago(pedido.id, metodoPago);
      await refreshCart();
      router.push(`/pedidos/${pedido.id}?nuevo=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pedido');
    } finally { setIsProcessing(false); }
  };

  if (!usuario) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Inicia sesión para continuar</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Necesitas una cuenta para realizar tu compra</p>
            <Link href="/auth/login" className="btn-primary mt-6 inline-flex px-8 py-3">Iniciar sesión</Link>
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
        <main className="flex-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tu carrito está vacío</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Agrega productos para continuar</p>
            <Link href="/productos" className="btn-primary mt-6 inline-flex px-8 py-3">Ver productos</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>

        {/* Hero */}
        <div style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--blue-light)', border: '1px solid var(--blue-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="var(--blue)" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Checkout</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Completa tu compra de forma segura</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-5">

            {/* Resumen — izquierda */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="sticky top-24 rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--blue)' }} />
                <div className="p-5">
                  <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Resumen del pedido</h2>
                  <div className="space-y-3">
                    {items.map(item => {
                      const precio = item.precio_oferta ?? item.precio ?? 0;
                      return (
                        <div key={item.id} className="flex gap-3 rounded-xl p-3"
                          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg overflow-hidden"
                            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                            {item.imagen_url
                              ? <img src={item.imagen_url} alt={item.nombre_producto || ''} className="h-full w-full object-contain p-1" />
                              : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-6 w-6" style={{ color: 'var(--border)' }}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.nombre_producto}</p>
                            {item.nombre_variante && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.nombre_variante}</p>}
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>x{item.cantidad}</p>
                          </div>
                          <p className="text-sm font-bold shrink-0" style={{ color: 'var(--blue)' }}>{formatLempira(precio * item.cantidad)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                      <span style={{ color: 'var(--text)' }}>{formatLempira(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-muted)' }}>Envío</span>
                      <span style={{ color: '#10b981' }}>Gratis</span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: 'var(--blue-light)', border: '1px solid var(--blue-muted)' }}>
                    <span className="font-semibold" style={{ color: 'var(--blue)' }}>Total</span>
                    <span className="text-xl font-bold" style={{ color: 'var(--blue)' }}>{formatLempira(total)}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    Compra segura y protegida
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario — derecha */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--blue)' }} />
                <div className="p-6 space-y-6">

                  {/* Método de pago */}
                  <div>
                    <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Método de pago</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setMetodoPago('tarjeta')}
                        className="flex items-center justify-center gap-2 rounded-xl p-4 text-sm font-semibold transition-all"
                        style={metodoPago === 'tarjeta'
                          ? { backgroundColor: 'var(--blue-light)', color: 'var(--blue)', border: '2px solid var(--blue)' }
                          : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '2px solid var(--border)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                        </svg>
                        Tarjeta
                      </button>
                      <button onClick={() => setMetodoPago('paypal')}
                        className="flex items-center justify-center gap-2 rounded-xl p-4 text-sm font-semibold transition-all"
                        style={metodoPago === 'paypal'
                          ? { backgroundColor: '#e8f4fd', color: '#0070ba', border: '2px solid #0070ba' }
                          : { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '2px solid var(--border)' }}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill={metodoPago === 'paypal' ? '#0070ba' : 'currentColor'} xmlns="http://www.w3.org/2000/svg">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                        </svg>
                        PayPal
                      </button>
                    </div>
                  </div>

                  {/* Campos tarjeta */}
                  {metodoPago === 'tarjeta' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Número de tarjeta</label>
                        <input type="text" placeholder="1234 5678 9012 3456" className="input" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Expiración</label>
                          <input type="text" placeholder="MM/AA" className="input" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>CVV</label>
                          <input type="text" placeholder="123" className="input" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Nombre en la tarjeta</label>
                        <input type="text" defaultValue={`${usuario.nombre} ${usuario.apellido}`} className="input" />
                      </div>
                    </div>
                  )}

                  {/* Info PayPal */}
                  {metodoPago === 'paypal' && (
                    <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#e8f4fd', border: '1px solid #b3d9f5', color: '#0070ba' }}>
                      Serás redirigido a PayPal para completar tu pago de forma segura. El monto se cobrará en USD.
                    </div>
                  )}

                  {/* Dirección de envío */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Dirección de envío</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Dirección</label>
                        <input type="text" placeholder="Calle Principal 123" className="input" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Ciudad</label>
                          <input type="text" placeholder="Tegucigalpa" className="input" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Código postal</label>
                          <input type="text" placeholder="11101" className="input" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                      {error}
                    </div>
                  )}

                  {metodoPago === 'tarjeta' ? (
                    <button onClick={handlePagar} disabled={isProcessing} className="btn-primary w-full py-3 disabled:opacity-50">
                      {isProcessing ? 'Procesando...' : `Pagar ${formatLempira(total)}`}
                    </button>
                  ) : (
                    <button onClick={handlePagar} disabled={isProcessing}
                      className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#0070ba' }}>
                      {isProcessing ? 'Procesando...' : (
                        <>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
                          </svg>
                          Pagar con PayPal — {formatLempira(total)}
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Al completar la compra aceptas nuestros términos y condiciones
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
