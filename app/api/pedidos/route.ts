import { NextRequest } from 'next/server';
import { getConnection, sql } from '@/lib/db';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, createdResponse, authError } from '@/lib/api-response';

const ESTADOS_VALIDOS = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const id_usuario = searchParams.get('id_usuario');
    const estado = searchParams.get('estado');
    const pool = await getConnection();
    if (id) {
      const pedido = await pool.request().input('id', sql.BigInt, id).query('SELECT * FROM pedidos WHERE id = @id');
      if (pedido.recordset.length === 0) return errorResponse('Pedido no encontrado', 404);
      const items = await pool.request().input('id_pedido', sql.BigInt, id).query(`
        SELECT ip.*, v.sku, v.nombre_variante, p.nombre as nombre_producto, p.imagen_url
        FROM items_pedido ip
        JOIN variantes_producto v ON ip.id_variante = v.id
        JOIN productos p ON v.id_producto = p.id
        WHERE ip.id_pedido = @id_pedido`);
      return successResponse({ ...pedido.recordset[0], items: items.recordset });
    }
    const req = pool.request();
    let query = `SELECT p.*, 
      u.nombre as nombre_usuario, u.apellido as apellido_usuario, u.correo as correo_usuario, u.telefono as telefono_usuario, u.id_rol as rol_usuario,
      c.nombre as nombre_cliente, c.apellido as apellido_cliente, c.telefono as telefono_cliente, c.correo as correo_cliente,
      t.nombre as nombre_tienda,
      pg.metodo_pago
      FROM pedidos p 
      LEFT JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN usuarios c ON p.id_cliente = c.id
      LEFT JOIN turnos tu ON tu.id_usuario = p.id_usuario 
        AND tu.hora_inicio <= p.creado_en 
        AND (tu.hora_fin IS NULL OR tu.hora_fin >= p.creado_en)
      LEFT JOIN tiendas t ON tu.id_tienda = t.id
      LEFT JOIN (SELECT id_pedido, MIN(metodo_pago) as metodo_pago FROM pagos GROUP BY id_pedido) pg ON pg.id_pedido = p.id
      WHERE 1=1`;
    if (id_usuario) { req.input('id_usuario', sql.BigInt, id_usuario); query += ' AND p.id_usuario = @id_usuario'; }
    if (estado)     { req.input('estado', sql.NVarChar, estado);       query += ' AND p.estado = @estado'; }
    query += ' ORDER BY p.creado_en DESC';
    const result = await req.query(query);
    return successResponse(result.recordset);
  } catch (e) { const a = authError(e); if (a) return errorResponse(a, 403); return errorResponse('Error al obtener los pedidos'); }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);
    const { id_usuario, id_cliente, cliente_nombre, cliente_telefono, cliente_correo, items } = await request.json();
    if (!id_usuario || !items?.length) return errorResponse('id_usuario e items son requeridos', 400);
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      let monto_total = 0;
      const itemsConPrecio: { id_variante: number; cantidad: number; precio_unitario: number }[] = [];
      for (const item of items) {
        const variante = await transaction.request().input('id', sql.BigInt, item.id_variante)
          .query('SELECT precio, precio_oferta FROM variantes_producto WHERE id = @id AND activo = 1');
        if (variante.recordset.length === 0) { await transaction.rollback(); return errorResponse(`Variante ${item.id_variante} no encontrada o inactiva`, 404); }
        const precio_unitario = variante.recordset[0].precio_oferta ?? variante.recordset[0].precio;
        monto_total += precio_unitario * item.cantidad;
        itemsConPrecio.push({ id_variante: item.id_variante, cantidad: item.cantidad, precio_unitario });
      }
      const pedidoResult = await transaction.request()
        .input('id_usuario', sql.BigInt, id_usuario)
        .input('id_cliente', sql.BigInt, id_cliente ?? null)
        .input('cliente_nombre', sql.NVarChar, cliente_nombre ?? null)
        .input('cliente_telefono', sql.NVarChar, cliente_telefono ?? null)
        .input('cliente_correo', sql.NVarChar, cliente_correo ?? null)
        .input('estado', sql.NVarChar, 'pendiente')
        .input('monto_total', sql.Decimal(10, 2), monto_total)
        .query(`INSERT INTO pedidos (id_usuario, id_cliente, cliente_nombre, cliente_telefono, cliente_correo, estado, monto_total) 
                OUTPUT INSERTED.* 
                VALUES (@id_usuario, @id_cliente, @cliente_nombre, @cliente_telefono, @cliente_correo, @estado, @monto_total)`);
      const pedido = pedidoResult.recordset[0];
      for (const item of itemsConPrecio) {
        await transaction.request()
          .input('id_pedido', sql.BigInt, pedido.id)
          .input('id_variante', sql.BigInt, item.id_variante)
          .input('cantidad', sql.Int, item.cantidad)
          .input('precio_unitario', sql.Decimal(10, 2), item.precio_unitario)
          .query('INSERT INTO items_pedido (id_pedido, id_variante, cantidad, precio_unitario) VALUES (@id_pedido, @id_variante, @cantidad, @precio_unitario)');

        // Descontar del inventario (resta de la tienda con más stock disponible)
        const stockResult = await transaction.request()
          .input('id_variante_s', sql.BigInt, item.id_variante)
          .query('SELECT id_variante, id_tienda, cantidad FROM niveles_stock WHERE id_variante = @id_variante_s AND cantidad > 0 ORDER BY cantidad DESC');

        let restante = item.cantidad;
        for (const stockRow of stockResult.recordset) {
          if (restante <= 0) break;
          const descontar = Math.min(restante, stockRow.cantidad);
          await transaction.request()
            .input('id_variante_d', sql.BigInt, stockRow.id_variante)
            .input('id_tienda_d', sql.BigInt, stockRow.id_tienda)
            .input('descontar', sql.Int, descontar)
            .query('UPDATE niveles_stock SET cantidad = cantidad - @descontar WHERE id_variante = @id_variante_d AND id_tienda = @id_tienda_d');
          restante -= descontar;
        }
      }
      await transaction.request().input('id_usuario', sql.BigInt, id_usuario)
        .query('DELETE ic FROM items_carrito ic JOIN carritos_compra cc ON ic.id_carrito = cc.id WHERE cc.id_usuario = @id_usuario');
      await transaction.commit();
      return createdResponse({ ...pedido, items: itemsConPrecio });
    } catch (err) { await transaction.rollback(); throw err; }
  } catch (e) { const a = authError(e); if (a) return errorResponse(a, 403); return errorResponse('Error al crear el pedido'); }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = requireAuth(request);
    const { id, estado } = await request.json();
    if (!id || !estado) return errorResponse('id y estado son requeridos', 400);
    if (!ESTADOS_VALIDOS.includes(estado)) return errorResponse(`Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}`, 400);
    const pool = await getConnection();

    // Clientes solo pueden cancelar sus propios pedidos
    const isAdminOrCajero = payload.id_rol === 1 || payload.id_rol === 2;
    if (!isAdminOrCajero) {
      if (estado !== 'cancelado') return errorResponse('Solo puedes cancelar tus pedidos', 403);
      const check = await pool.request().input('id', sql.BigInt, id).input('id_usuario', sql.BigInt, payload.id)
        .query('SELECT id FROM pedidos WHERE id = @id AND id_usuario = @id_usuario');
      if (check.recordset.length === 0) return errorResponse('Pedido no encontrado o no autorizado', 403);
    }

    const result = await pool.request().input('id', sql.BigInt, id).input('estado', sql.NVarChar, estado)
      .query('UPDATE pedidos SET estado = @estado OUTPUT INSERTED.* WHERE id = @id');
    if (result.recordset.length === 0) return errorResponse('Pedido no encontrado', 404);
    return successResponse(result.recordset[0]);
  } catch (e) { const a = authError(e); if (a) return errorResponse(a, 403); return errorResponse('Error al actualizar el pedido'); }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return errorResponse('id es requerido', 400);
    const pool = await getConnection();
    const found = await pool.request().input('id', sql.BigInt, id).query('SELECT estado FROM pedidos WHERE id = @id');
    if (found.recordset.length === 0) return errorResponse('Pedido no encontrado', 404);
    if (found.recordset[0].estado !== 'pendiente') return errorResponse('Solo se pueden eliminar pedidos en estado pendiente', 400);
    await pool.request().input('id', sql.BigInt, id).query('DELETE FROM pedidos WHERE id = @id');
    return successResponse({ message: 'Pedido eliminado' });
  } catch (e) { const a = authError(e); if (a) return errorResponse(a, 403); return errorResponse('Error al eliminar el pedido'); }
}
