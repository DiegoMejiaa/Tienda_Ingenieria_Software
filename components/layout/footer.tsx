import Link from 'next/link';

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-white text-xs font-bold"
              style={{ backgroundColor: 'var(--blue)' }}
            >
              TW
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--text)' }}>TechHN</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Link href="/productos" className="transition-colors hover:text-[var(--blue)]" style={{ color: 'inherit' }}>Productos</Link>
            <Link href="/categorias" className="transition-colors hover:text-[var(--blue)]" style={{ color: 'inherit' }}>Categorías</Link>
            <Link href="/tiendas" className="transition-colors hover:text-[var(--blue)]" style={{ color: 'inherit' }}>Tiendas</Link>
            <Link href="/pedidos" className="transition-colors hover:text-[var(--blue)]" style={{ color: 'inherit' }}>Mis pedidos</Link>
          </nav>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 TechHN Honduras
          </p>
        </div>
      </div>
    </footer>
  );
}
