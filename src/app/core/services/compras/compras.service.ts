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

    // 1️⃣ Insertar la compra
    const compraDataToInsert: any = {
      id_proveedor: compra.id_proveedor,
      id_usuario: compra.id_usuario,
      nro_documento: compra.nro_documento,
      total: compra.total
    };

    // Si hay fecha personalizada, convertirla al formato correcto
    if (compra.fecha) {
      // Convertir de datetime-local (YYYY-MM-DDTHH:mm) a ISO string para PostgreSQL
      compraDataToInsert.fecha = new Date(compra.fecha).toISOString();
    }

    const { data: compraData, error: compraError } = await this.supabase.client
      .from(this.TABLE)
      .insert(compraDataToInsert)
      .select("id_compra")
      .single();

    if (compraError) throw compraError;

    const id_compra = compraData.id_compra;

    // 2️⃣ Insertar cada detalle SIN SUBTOTAL
    const detallesInsert = detalles.map(d => ({
      id_compra,
      id_producto: d.id_producto,
      cantidad: d.cantidad,
      costo_unitario: d.costo_unitario
      // subtotal NO se envía porque es generated column
    }));

    const { error: detError } = await this.supabase.client
      .from(this.TABLE_DET)
      .insert(detallesInsert);

    if (detError) throw detError;

    return id_compra;
  }

  // ============================
  // RESUMEN DE COMPRAS POR PRODUCTO
  // ============================
  async getResumenComprasPorProducto(id_producto: number) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_DET)
      .select('cantidad, costo_unitario, subtotal')
      .eq('id_producto', id_producto);

    if (error) throw error;

    const cantidad_total =
      data?.reduce((sum, d) => sum + (d.cantidad || 0), 0) || 0;

    const precio_total_compra =
      data?.reduce((sum, d) => sum + (d.subtotal || 0), 0) || 0;

    const precio_unitario_promedio =
      cantidad_total > 0 ? precio_total_compra / cantidad_total : 0;

    return {
      cantidad_total,
      precio_unitario_promedio,
      precio_total_compra
    };
  }
}
