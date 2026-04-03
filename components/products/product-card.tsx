'use client';

import Link from 'next/link';
import type { Producto } from '@/types';

export function ProductCard({ producto }: { producto: Producto }) {
  return (
    <Link
      href={`/productos/${producto.id}`}
      className="group block rounded-xl transition-all duration-200"
      style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgb(37 99 235 / 0.12)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.transform = 'none';
      }}
    >
      <div
        className="aspect-square overflow-hidden rounded-t-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="h-full w-full object-contain p-4 transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="h-16 w-16" style={{ color: 'var(--border)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        )}
      </div>
      <div className="p-4">
        {producto.nombre_marca && (
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--blue)' }}>
            {producto.nombre_marca}
          </p>
        )}
        <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
          {producto.nombre}
        </h3>
        {producto.nombre_categoria && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {producto.nombre_categoria}
          </p>
        )}
      </div>
    </Link>
  );
}
