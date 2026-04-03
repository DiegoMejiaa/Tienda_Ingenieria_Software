'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Pedido, ItemPedido, ApiResponse } from '@/types';
import { apiFetch } from '@/lib/api-fetch';
import { formatLempira } from '@/lib/format';

const ESTADOS = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'] as const;

const ESTADO_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pendiente:  { color: '#f59e0b', bg: '#fffbeb', label: 'Pendiente'  },
  pagado:     { color: '#3b82f6', bg: '#eff6ff', label: 'Pagado'     },
  enviado:    { color: '#8b5cf6', bg: '#f5f3ff', label: 'Enviado'    },
  entregado:  { color: '#10b981', bg: '#f0fdf4', label: 'Entregado'  },
  cancelado:  { color: '#ef4444', bg: '#fef2f2', label: 'Cancelado'  },
};

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', paypal: 'PayPal', otro: 'Otro',
};

interface Pago { id: number; id_pedido: number; monto: number; metodo_pago: string; estado: string }
interface VentaDetalle extends Pedido { items?: ItemPedido[]; pagos?: Pago[] }

// ── Factura imprimible ────────────────────────────────────────────────────────
function Factura({ venta }: { venta: VentaDetalle }) {
  const pago = venta.pagos?.[0];
  const esSucursal = Number(venta.rol_usuario) === 2;
  const nombreCliente = venta.nombre_cliente
    ? `${venta.nombre_cliente} ${venta.apellido_cliente || ''}`.trim()
    : null;

  return (
    <div id="factura-admin" style={{ fontFamily: 'monospace', fontSize: 13, color: '#000', maxWidth: 340, margin: '0 auto', padding: 16 }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 8 }}>
        <p style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>TechHN</p>
        {venta.nombre_tienda && <p style={{ margin: '2px 0' }}>{venta.nombre_tienda}</p>}
        {esSucursal && <p style={{ margin: '2px 0', fontSize: 11 }}>Atendido por: {venta.nombre_usuario || 'N/A'}</p>}
      </div>
      <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
        <p style={{ margin: '2px 0' }}><strong>Venta #:</strong> {venta.id}</p>
        <p style={{ margin: '2px 0' }}><strong>Fecha:</strong> {new Date(venta.creado_en).toLocaleString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <p style={{ margin: '2px 0' }}><strong>Canal:</strong> {esSucursal ? `Sucursal — ${venta.nombre_tienda || ''}` : 'Venta en línea'}</p>
      </div>
      <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
        <p style={{ margin: '2px 0' }}><strong>Cliente:</strong> {nombreCliente || (esSucursal ? 'Sin nombre' : `${venta.nombre_usuario || ''} ${venta.apellido_usuario || ''}`.trim())}</p>
        {(venta.telefono_cliente || venta.telefono_usuario) && <p style={{ margin: '2px 0' }}><strong>Tel:</strong> {venta.telefono_cliente || venta.telefono_usuario}</p>}
        {(venta.correo_cliente || venta.correo_usuario) && <p style={{ margin: '2px 0', fontSize: 11 }}>{venta.correo_cliente || venta.correo_usuario}</p>}
      </div>
      <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
        <p style={{ fontWeight: 'bold', marginBottom: 4 }}>PRODUCTOS</p>
        {venta.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12 }}>{item.nombre_producto}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>{item.nombre_variante} x{item.cantidad}</p>
            </div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{formatLempira(item.precio_unitario * item.cantidad)}</p>
          </div>
        ))}
      </div>
      <div style={{ borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatLempira(venta.monto_total)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 16, marginTop: 4 }}><span>TOTAL</span><span>{formatLempira(venta.monto_total)}</span></div>
      </div>
      {pago && (
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
          <p style={{ margin: '2px 0' }}><strong>Forma de pago:</strong> {METODO_LABEL[pago.metodo_pago] || pago.metodo_pago}</p>
          <p style={{ margin: '2px 0' }}><strong>Estado pago:</strong> {pago.estado}</p>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <p style={{ margin: '2px 0' }}>Gracias por su compra</p>
        <p style={{ margin: '2px 0', fontSize: 11 }}>Venta #{venta.id}</p>
      </div>
    </div>
  );
}

export default function AdminVentasPage() {
  const [pedidos, setPedidos] = useState<VentaDetalle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCanal, setFiltroCanal] = useState<'todos' | 'online' | 'sucursal'>('todos');
  const [search, setSearch] = useState('');
  const [detalle, setDetalle] = useState<VentaDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchPedidos = async () => {
    setIsLoading(true);
    const url = filtroEstado ? `/api/pedidos?estado=${filtroEstado}` : '/api/pedidos';
    const res = await apiFetch(url);
    const data: ApiResponse<VentaDetalle[]> = await res.json();
    if (data.success && data.data) setPedidos(data.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchPedidos(); }, [filtroEstado]);

  const handleEstado = async (id: number, estado: string) => {
    setUpdatingId(id);
    await apiFetch('/api/pedidos', { method: 'PUT', body: JSON.stringify({ id, estado }) });
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: estado as Pedido['estado'] } : p));
    if (detalle?.id === id) setDetalle(prev => prev ? { ...prev, estado: estado as Pedido['estado'] } : prev);
    setUpdatingId(null);
  };

  const openDetalle = async (pedido: VentaDetalle) => {
    setLoadingDetalle(true);
    setDetalle(pedido);
    try {
      const [pedRes, pagRes] = await Promise.all([
        apiFetch(`/api/pedidos?id=${pedido.id}`),
        apiFetch(`/api/pagos?id_pedido=${pedido.id}`),
      ]);
      const pedData: ApiResponse<VentaDetalle> = await pedRes.json();
      const pagData: ApiResponse<Pago[]> = await pagRes.json();
      setDetalle({
        ...pedido,
        ...(pedData.success && pedData.data ? pedData.data : {}),
        pagos: pagData.success && pagData.data ? pagData.data : [],
      });
    } catch { /* ignore */ }
    finally { setLoadingDetalle(false); }
  };

  const handlePrint = () => {
    const contenido = document.getElementById('factura-admin');
    if (!contenido) return;
    const w = window.open('', '_blank', 'width=420,height=680');
    if (!w) return;
    w.document.write(`<html><head><title>Factura</title>
      <style>body{margin:0;padding:16px;font-family:monospace;font-size:13px}@media print{body{margin:0}}</style>
      </head><body>${contenido.innerHTML}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  // Filtrar por canal
  const porCanal = pedidos.filter(p => {
    if (filtroCanal === 'online')   return Number(p.rol_usuario) !== 2;
    if (filtroCanal === 'sucursal') return Number(p.rol_usuario) === 2;
    return true;
  });

  // Filtrar por búsqueda
  const filtered = porCanal.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const clienteNombre = p.nombre_cliente
      ? `${p.nombre_cliente} ${p.apellido_cliente || ''}`.toLowerCase()
      : `${p.nombre_usuario || ''} ${p.apellido_usuario || ''}`.toLowerCase();
    return clienteNombre.includes(q) || String(p.id).includes(q) || (p.nombre_tienda || '').toLowerCase().includes(q);
  });

  const counts = ESTADOS.reduce((acc, e) => { acc[e] = pedidos.filter(p => p.estado === e).length; return acc; }, {} as Record<string, number>);
  const totalFiltrado = filtered.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + Number(p.monto_total), 0);

  // Nombre del cliente a mostrar
  const clienteDisplay = (p: VentaDetalle) => {
    const esSucursal = Number(p.rol_usuario) === 2;
    if (p.nombre_cliente) return `${p.nombre_cliente} ${p.apellido_cliente || ''}`.trim();
    if (!esSucursal && p.nombre_usuario) return `${p.nombre_usuario} ${p.apellido_usuario || ''}`.trim();
    return 'Sin nombre';
  };

  const FILTER_STYLE: Record<string, { active: string; bg: string }> = {
    '': { active: 'var(--blue)', bg: 'var(--blue-light)' },
    pendiente: { active: '#f59e0b', bg: '#fffbeb' },
    pagado:    { active: '#3b82f6', bg: '#eff6ff' },
    enviado:   { active: '#8b5cf6', bg: '#f5f3ff' },
    entregado: { active: '#10b981', bg: '#f0fdf4' },
    cancelado: { active: '#ef4444', bg: '#fef2f2' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Ventas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} venta{filtered.length !== 1 ? 's' : ''} · {formatLempira(totalFiltrado)}
          </p>
        </div>
        {/* Filtro canal */}
        <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {([
            { key: 'todos',    label: 'Todas'     },
            { key: 'online',   label: 'En línea'  },
            { key: 'sucursal', label: 'Sucursal'  },
          ] as const).map(c => (
            <button key={c.key} onClick={() => setFiltroCanal(c.key)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={filtroCanal === c.key
                ? { backgroundColor: 'var(--card)', color: 'var(--blue)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { color: 'var(--text-muted)' }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros estado */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: '', label: 'Todos', count: porCanal.length }, ...ESTADOS.map(e => ({ key: e, label: ESTADO_STYLE[e].label, count: porCanal.filter(p => p.estado === e).length }))].map(f => {
          const isActive = filtroEstado === f.key;
          const style = FILTER_STYLE[f.key];
          return (
            <button key={f.key} onClick={() => setFiltroEstado(f.key)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={isActive
                ? { backgroundColor: style.bg, color: style.active, border: `1.5px solid ${style.active}` }
                : { backgroundColor: 'var(--card)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }}>
              {f.key && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isActive ? style.active : 'var(--text-muted)' }} />}
              {f.label}
              <span className="rounded-full px-1.5 py-0.5 text-xs"
                style={{ backgroundColor: isActive ? style.active + '20' : 'var(--bg-secondary)', color: isActive ? style.active : 'var(--text-muted)' }}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Buscador */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente, # o sucursal..." className="input pl-9" />
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin ventas con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Cliente</th>
                <th className="table-header hidden md:table-cell">Fecha</th>
                <th className="table-header hidden lg:table-cell">Canal</th>
                <th className="table-header hidden lg:table-cell">Pago</th>
                <th className="table-header">Estado</th>
                <th className="table-header hidden sm:table-cell text-right">Total</th>
                <th className="table-header text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(pedido => {
                const st = ESTADO_STYLE[pedido.estado];
                const esSucursal = Number(pedido.rol_usuario) === 2;
                return (
                  <tr key={pedido.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                          style={{ backgroundColor: esSucursal ? '#10b981' : 'var(--blue)' }}>
                          {clienteDisplay(pedido).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: clienteDisplay(pedido) === 'Sin nombre' ? 'var(--text-muted)' : 'var(--text)' }}>
                            {clienteDisplay(pedido)}
                          </p>
                          {(pedido.telefono_cliente || pedido.telefono_usuario) && (
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {pedido.telefono_cliente || pedido.telefono_usuario}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(pedido.creado_en).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={esSucursal
                          ? { backgroundColor: '#f0fdf4', color: '#10b981' }
                          : { backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                        {esSucursal ? `${pedido.nombre_tienda || 'Sucursal'}` : 'En línea'}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      {pedido.metodo_pago ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}>
                          {METODO_LABEL[pedido.metodo_pago] || pedido.metodo_pago}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td className="table-cell">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: st?.bg, color: st?.color }}>
                        {st?.label || pedido.estado}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {formatLempira(pedido.monto_total)}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDetalle(pedido)} className="btn-icon" title="Ver detalle / Factura">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        </button>
                        <select value={pedido.estado} onChange={e => handleEstado(pedido.id, e.target.value)}
                          disabled={updatingId === pedido.id} className="select py-1 px-2 text-xs w-auto" style={{ minWidth: 110 }}>
                          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_STYLE[e].label}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle + factura */}
      {detalle && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetalle(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Venta #{detalle.id}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {new Date(detalle.creado_en).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="btn-secondary text-xs px-3 py-1.5">Imprimir</button>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: ESTADO_STYLE[detalle.estado]?.bg, color: ESTADO_STYLE[detalle.estado]?.color }}>
                  {ESTADO_STYLE[detalle.estado]?.label || detalle.estado}
                </span>
                <button onClick={() => setDetalle(null)} className="btn-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              {/* Info cliente + cajero */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Cliente</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{clienteDisplay(detalle)}</p>
                  {(detalle.telefono_cliente || detalle.telefono_usuario) && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{detalle.telefono_cliente || detalle.telefono_usuario}</p>
                  )}
                  {(detalle.correo_cliente || detalle.correo_usuario) && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{detalle.correo_cliente || detalle.correo_usuario}</p>
                  )}
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    {Number(detalle.rol_usuario) === 2 ? 'Cajero / Sucursal' : 'Canal'}
                  </p>
                  {Number(detalle.rol_usuario) === 2 ? (
                    <>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{detalle.nombre_usuario || '—'}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#10b981' }}>{detalle.nombre_tienda || 'Sucursal'}</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold" style={{ color: '#3b82f6' }}>Venta en línea</p>
                  )}
                  {detalle.metodo_pago && (
                    <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Pago: {METODO_LABEL[detalle.metodo_pago] || detalle.metodo_pago}
                    </p>
                  )}
                </div>
              </div>

              {/* Cambiar estado */}
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--text-muted)' }}>Estado</p>
                <select value={detalle.estado} onChange={e => handleEstado(detalle.id, e.target.value)} className="select flex-1 py-1.5 text-sm">
                  {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_STYLE[e].label}</option>)}
                </select>
              </div>

              {/* Productos */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Productos</p>
                {loadingDetalle ? (
                  <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />)}</div>
                ) : detalle.items?.length ? (
                  <div className="space-y-2">
                    {detalle.items.map((item: ItemPedido, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                          {item.imagen_url
                            ? <img src={item.imagen_url} alt="" className="h-full w-full object-contain p-0.5" />
                            : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-5 w-5" style={{ color: 'var(--border)' }}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.nombre_producto}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.nombre_variante || item.sku} · x{item.cantidad}</p>
                        </div>
                        <p className="text-sm font-semibold shrink-0" style={{ color: 'var(--text)' }}>
                          {formatLempira(item.precio_unitario * item.cantidad)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin productos</p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--blue-light)', border: '1px solid var(--blue-muted)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--blue)' }}>Total de la venta</p>
                <p className="text-lg font-bold" style={{ color: 'var(--blue)' }}>{formatLempira(detalle.monto_total)}</p>
              </div>

              {/* Factura oculta para imprimir */}
              <div style={{ display: 'none' }}>
                <Factura venta={detalle} />
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
