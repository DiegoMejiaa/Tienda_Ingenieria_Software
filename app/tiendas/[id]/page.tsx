'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { Tienda, ApiResponse } from '@/types';

interface StockItem {
  id_variante: number;
  id_tienda: number;
  cantidad: number;
  nombre_producto?: string;
  nombre_variante?: string;
  sku?: string;
}

export default function TiendaDetailPage() {
  const params = useParams();
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tiendaRes, stockRes] = await Promise.all([
          fetch(`/api/tiendas?id=${params.id}`),
          fetch(`/api/stock?id_tienda=${params.id}`),
        ]);
        
        const tiendaData: ApiResponse<Tienda> = await tiendaRes.json();
        const stockData: ApiResponse<StockItem[]> = await stockRes.json();
        
        if (tiendaData.success && tiendaData.data) {
          setTienda(tiendaData.data);
        }
        if (stockData.success && stockData.data) {
          setStock(stockData.data);
        }
      } catch (error) {
        console.error('Error fetching tienda:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-6 w-32 rounded bg-muted" />
              <div className="mt-8 h-48 rounded-lg bg-muted" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!tienda) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">Tienda no encontrada</h1>
            <p className="mt-2 text-muted-foreground">La tienda que buscas no existe.</p>
            <Link href="/tiendas" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
              Ver tiendas
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
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Inicio</Link>
            <span>/</span>
            <Link href="/tiendas" className="hover:text-foreground">Tiendas</Link>
            <span>/</span>
            <span className="text-foreground">{tienda.nombre}</span>
          </nav>

          {/* Store Info */}
          <div className="mt-8 rounded-lg border border-border bg-card p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-accent">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold">{tienda.nombre}</h1>
                  {tienda.ciudad && (
                    <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      {tienda.ciudad}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Lun - Sab: 8:00 AM - 6:00 PM
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  +504 2222-3333
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="mt-8">
            <h2 className="font-serif text-xl font-bold">Inventario disponible</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Productos disponibles en esta tienda
            </p>

            {stock.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-border py-12 text-center">
                <p className="text-muted-foreground">No hay informacion de stock disponible</p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-lg border border-border">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Producto</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Variante</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stock.map((item, index) => (
                      <tr key={index} className="bg-card">
                        <td className="px-4 py-3 text-sm">{item.nombre_producto || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.nombre_variante || '-'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.sku || '-'}</td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            item.cantidad > 10 
                              ? 'bg-success/10 text-success' 
                              : item.cantidad > 0 
                                ? 'bg-warning/10 text-warning' 
                                : 'bg-destructive/10 text-destructive'
                          }`}>
                            {item.cantidad} unidades
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
