'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { Tienda, ApiResponse } from '@/types';

export default function TiendasPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTiendas() {
      try {
        const res = await fetch('/api/tiendas');
        const data: ApiResponse<Tienda[]> = await res.json();
        if (data.success && data.data) {
          setTiendas(data.data);
        }
      } catch (error) {
        console.error('Error fetching tiendas:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTiendas();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="bg-secondary py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">Nuestras Tiendas</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Visitanos en cualquiera de nuestras ubicaciones para una experiencia de compra personalizada
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-border p-6">
                  <div className="h-6 w-1/2 rounded bg-muted" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
                  <div className="mt-6 h-10 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : tiendas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="mx-auto h-12 w-12 text-muted-foreground">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
              <h3 className="mt-4 font-medium">No hay tiendas disponibles</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pronto tendremos tiendas fisicas cerca de ti
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tiendas.map((tienda) => (
                <div
                  key={tienda.id}
                  className="rounded-lg border border-border bg-card p-6 transition-all hover:border-accent hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-accent">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{tienda.nombre}</h2>
                      {tienda.ciudad && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          {tienda.ciudad}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Lun - Sab: 8:00 AM - 6:00 PM
                  </div>

                  <Link
                    href={`/tiendas/${tienda.id}`}
                    className="mt-4 block w-full rounded-full border border-border py-2 text-center text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    Ver detalles y stock
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
