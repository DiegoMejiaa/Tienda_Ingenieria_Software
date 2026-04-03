'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/products/product-card';
import type { Producto, Categoria, Marca, ApiResponse } from '@/types';

export default function ProductosPage() {
  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get('categoria');
  const marcaParam = searchParams.get('marca');

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filtros, setFiltros] = useState({
    categoria: categoriaParam || '',
    marca: marcaParam || '',
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, marcasRes] = await Promise.all([
          fetch('/api/categorias'),
          fetch('/api/marcas'),
        ]);
        
        const catData: ApiResponse<Categoria[]> = await catRes.json();
        const marcasData: ApiResponse<Marca[]> = await marcasRes.json();
        
        if (catData.success && catData.data) setCategorias(catData.data);
        if (marcasData.success && marcasData.data) setMarcas(marcasData.data);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchProductos() {
      setIsLoading(true);
      try {
        let url = '/api/productos?activo=true';
        if (filtros.categoria) url += `&id_categoria=${filtros.categoria}`;
        if (filtros.marca) url += `&id_marca=${filtros.marca}`;

        const res = await fetch(url);
        const data: ApiResponse<Producto[]> = await res.json();
        
        if (data.success && data.data) {
          setProductos(data.data);
        }
      } catch (error) {
        console.error('Error fetching productos:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProductos();
  }, [filtros]);

  const clearFilters = () => {
    setFiltros({ categoria: '', marca: '' });
  };

  const hasFilters = filtros.categoria || filtros.marca;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold">Productos</h1>
              <p className="mt-1 text-muted-foreground">
                {isLoading ? 'Cargando...' : `${productos.length} productos encontrados`}
              </p>
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary sm:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              Filtros
              {hasFilters && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">!</span>}
            </button>
          </div>

          <div className="mt-8 flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden w-64 shrink-0 sm:block">
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Filtros</h2>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-sm text-accent hover:underline">
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Categoria */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Categoria</h3>
                  <div className="space-y-2">
                    {categorias.map((cat) => (
                      <label key={cat.id} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="categoria"
                          checked={filtros.categoria === String(cat.id)}
                          onChange={() => setFiltros({ ...filtros, categoria: String(cat.id) })}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm">{cat.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Marca */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Marca</h3>
                  <div className="space-y-2">
                    {marcas.map((marca) => (
                      <label key={marca.id} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="marca"
                          checked={filtros.marca === String(marca.id)}
                          onChange={() => setFiltros({ ...filtros, marca: String(marca.id) })}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm">{marca.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Filters */}
            {filtersOpen && (
              <div className="fixed inset-0 z-50 sm:hidden">
                <div className="absolute inset-0 bg-foreground/50" onClick={() => setFiltersOpen(false)} />
                <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-card p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-medium">Filtros</h2>
                    <button onClick={() => setFiltersOpen(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-sm font-medium">Categoria</h3>
                      <div className="space-y-2">
                        {categorias.map((cat) => (
                          <label key={cat.id} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              name="categoria-mobile"
                              checked={filtros.categoria === String(cat.id)}
                              onChange={() => setFiltros({ ...filtros, categoria: String(cat.id) })}
                              className="h-4 w-4 accent-primary"
                            />
                            <span className="text-sm">{cat.nombre}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-medium">Marca</h3>
                      <div className="space-y-2">
                        {marcas.map((marca) => (
                          <label key={marca.id} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              name="marca-mobile"
                              checked={filtros.marca === String(marca.id)}
                              onChange={() => setFiltros({ ...filtros, marca: String(marca.id) })}
                              className="h-4 w-4 accent-primary"
                            />
                            <span className="text-sm">{marca.nombre}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={clearFilters}
                      className="flex-1 rounded-full border border-border py-3 text-sm font-medium"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square rounded-lg bg-muted" />
                      <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
                      <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : productos.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-16 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="mx-auto h-12 w-12 text-muted-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <h3 className="mt-4 font-medium">No se encontraron productos</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Intenta ajustar los filtros de busqueda
                  </p>
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-sm font-medium text-accent hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {productos.map((producto) => (
                    <ProductCard key={producto.id} producto={producto} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
