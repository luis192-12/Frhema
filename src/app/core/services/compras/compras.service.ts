import { Injectable } from '@angular/core';
import { SupabaseClientService } from '../auth/supabase.client';
import { Compra } from '../../models/compra.model';
import { DetalleCompra } from '../../models/detalle-compra.model';

@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  private readonly TABLE = 'compras';
  private readonly TABLE_DET = 'detalle_compras';

  constructor(private supabase: SupabaseClientService) {}

  // ============================
  // LISTAR COMPRAS
  // ============================
  async getCompras(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        id_compra,
        fecha,
        nro_documento,
        total,
        proveedores ( nombre )
      `)
      .order('id_compra', { ascending: false });

    if (error) throw error;
    return data!;
  }

  // ============================
  // LISTAR DETALLE DE UNA COMPRA
  // ============================
  async getDetalle(id_compra: number): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_DET)
      .select(`
        id_detalle_compra,
        cantidad,
        costo_unitario,
        subtotal,
        productos ( nombre )
      `)
      .eq('id_compra', id_compra);

    if (error) throw error;
    return data!;
  }

  // ============================
  // REGISTRAR COMPRA + DETALLE
  // ============================
  async registrarCompra(compra: Compra, detalles: DetalleCompra[]) {

    // 1️⃣ Crear compra
    const { data: compraData, error: compraError } = await this.supabase.client
      .from(this.TABLE)
      .insert([compra])
      .select()
      .single();

    if (compraError) throw compraError;

    const id_compra = compraData.id_compra;

    // 2️⃣ Insertar detalles
    const detallesInsert = detalles.map(d => ({
      ...d,
      id_compra
    }));

    const { error: detalleError } = await this.supabase.client
      .from(this.TABLE_DET)
      .insert(detallesInsert);

    if (detalleError) throw detalleError;

    // 3️⃣ Trigger ya aumenta el stock automáticamente

    return id_compra;
  }

  // ============================
  // OBTENER RESUMEN DE COMPRAS POR PRODUCTO
  // ============================
  async getResumenComprasPorProducto(id_producto: number): Promise<{
    cantidad_total: number;
    precio_unitario_promedio: number;
    precio_total_compra: number;
  }> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_DET)
      .select('cantidad, costo_unitario, subtotal')
      .eq('id_producto', id_producto);

    if (error) throw error;

    const cantidad_total = data?.reduce((sum, d) => sum + (d.cantidad || 0), 0) || 0;
    const precio_total_compra = data?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0;
    const precio_unitario_promedio = cantidad_total > 0 ? precio_total_compra / cantidad_total : 0;

    return {
      cantidad_total,
      precio_unitario_promedio,
      precio_total_compra
    };
  }
}
