/*
import { Injectable } from '@angular/core';
import { SupabaseClientService } from '../auth/supabase.client';
import { Venta } from '../../models/venta.model';
import { DetalleVenta } from '../../models/detalle-venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentasService {

  private TABLE = 'ventas';
  private TABLE_DET = 'detalle_ventas';
  private TABLE_MOV = 'movimientos_stock';

  constructor(private supabase: SupabaseClientService) {}

  // =========================================
  // LISTAR VENTAS
  // =========================================
  async getVentas(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        id_venta,
        fecha,
        total,
        tipo_comprobante,
        nro_comprobante,
        clientes ( nombre )
      `)
      .order('id_venta', { ascending: false });

    if (error) throw error;
    return data!;
  }

  // =========================================
  // LISTAR DETALLE
  // =========================================
  async getDetalle(id_venta: number): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_DET)
      .select(`
        id_detalle_venta,
        cantidad,
        precio_unitario,
        descuento,
        subtotal,
        productos ( nombre )
      `)
      .eq('id_venta', id_venta);

    if (error) throw error;
    return data!;
  }

  // =========================================
  // REGISTRAR VENTA + DETALLE
  // =========================================
  async registrarVenta(venta: Venta, detalles: DetalleVenta[]) {

    // 1️⃣ Crear venta
    const { data: ventaData, error: ventaError } = await this.supabase.client
      .from(this.TABLE)
      .insert([venta])
      .select()
      .single();

    if (ventaError) throw ventaError;

    const id_venta = ventaData.id_venta;

    // 2️⃣ Insertar detalles
    const detallesInsert = detalles.map(d => ({
      ...d,
      id_venta
    }));

    const { error: detalleError } = await this.supabase.client
      .from(this.TABLE_DET)
      .insert(detallesInsert);

    if (detalleError) throw detalleError;

    // El trigger ya descuenta stock automáticamente

    // 3️⃣ Registrar movimiento de stock opcional
    for (const det of detalles) {
      await this.supabase.client
        .from(this.TABLE_MOV)
        .insert([
          {
            id_producto: det.id_producto,
            tipo: 'VENTA',
            cantidad: det.cantidad,
            referencia: `Venta ${id_venta}`
          }
        ]);
    }

    return id_venta;
  }
}
*/
// src/app/core/services/ventas/ventas.service.ts
import { Injectable } from '@angular/core';
import { SupabaseClientService } from '../auth/supabase.client';
import { Venta } from '../../models/venta.model';
import { DetalleVenta } from '../../models/detalle-venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentasService {

  private TABLE = 'ventas';
  private TABLE_DET = 'detalle_ventas';
  private TABLE_MOV = 'movimientos_stock';

  constructor(private supabase: SupabaseClientService) {}

  // =========================================
  // LISTAR VENTAS
  // =========================================
  async getVentas(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        id_venta,
        fecha,
        total,
        tipo_comprobante,
        nro_comprobante,
        clientes ( nombre )
      `)
      .order('id_venta', { ascending: false });

    if (error) throw error;
    return data!;
  }

  // =========================================
  // LISTAR DETALLE
  // =========================================
  async getDetalle(id_venta: number): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_DET)
      .select(`
        id_detalle_venta,
        cantidad,
        precio_unitario,
        descuento,
        subtotal,
        productos ( nombre )
      `)
      .eq('id_venta', id_venta);

    if (error) throw error;
    return data!;
  }

  // =========================================
  // REGISTRAR VENTA + DETALLES
  // =========================================
  async registrarVenta(venta: Venta, detalles: DetalleVenta[]) {

    // 1️⃣ Registrar venta
    const { data: ventaData, error: ventaError } = await this.supabase.client
      .from(this.TABLE)
      .insert([{
        id_usuario: venta.id_usuario,
        id_cliente: venta.id_cliente,
        tipo_comprobante: venta.tipo_comprobante,
        nro_comprobante: venta.nro_comprobante,
        metodo_pago: venta.metodo_pago,
        total: venta.total
      }])
      .select()
      .single();

    if (ventaError) throw ventaError;

    const id_venta = ventaData.id_venta;

    // 2️⃣ Registrar detalle — SIN SUBTOTAL (lo calcula Supabase)
    const detallesInsert = detalles.map(d => ({
      id_venta,
      id_producto: d.id_producto,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      descuento: d.descuento
    }));

    const { error: detalleError } = await this.supabase.client
      .from(this.TABLE_DET)
      .insert(detallesInsert);

    if (detalleError) throw detalleError;

    // 3️⃣ Registrar movimientos de stock (opcional)
    for (const det of detalles) {
      await this.supabase.client
        .from(this.TABLE_MOV)
        .insert([{
          id_producto: det.id_producto,
          tipo: 'VENTA',
          cantidad: det.cantidad,
          referencia: `Venta ${id_venta}`
        }]);
    }

    return id_venta;
  }

  // =========================================
  // ESTADÍSTICAS DEL DASHBOARD
  // =========================================

  // Ventas de hoy (cantidad)
  async getVentasHoyCount(): Promise<number> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyStr = hoy.toISOString().split('T')[0];
    
    // Obtener el final del día de hoy
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);
    const finHoyStr = finHoy.toISOString().split('T')[0] + 'T23:59:59.999Z';

    const { count, error } = await this.supabase.client
      .from(this.TABLE)
      .select('id_venta', { count: 'exact', head: true })
      .gte('fecha', hoyStr)
      .lte('fecha', finHoyStr);

    if (error) throw error;
    return count || 0;
  }

  // Monto de ventas de hoy
  async getMontoHoy(): Promise<number> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyStr = hoy.toISOString().split('T')[0];

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('total')
      .gte('fecha', hoyStr);

    if (error) throw error;
    return data?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
  }

  // Ventas del mes (cantidad)
  async getVentasMesCount(): Promise<number> {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const inicioMesStr = inicioMes.toISOString().split('T')[0];

    const { count, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*', { count: 'exact', head: true })
      .gte('fecha', inicioMesStr);

    if (error) throw error;
    return count || 0;
  }

  // Monto de ventas del mes
  async getMontoMes(): Promise<number> {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const inicioMesStr = inicioMes.toISOString().split('T')[0];

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('total')
      .gte('fecha', inicioMesStr);

    if (error) throw error;
    return data?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
  }

  // Ventas recientes (hoy)
  async getVentasRecientes(): Promise<any[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyStr = hoy.toISOString().split('T')[0];
    
    // Obtener el final del día de hoy
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);
    const finHoyStr = finHoy.toISOString().split('T')[0] + 'T23:59:59.999Z';

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        id_venta,
        fecha,
        total,
        tipo_comprobante,
        nro_comprobante,
        metodo_pago,
        clientes ( nombre ),
        detalle_ventas (
          id_producto,
          cantidad,
          productos (
            stock_actual,
            nombre
          )
        )
      `)
      .gte('fecha', hoyStr)
      .lte('fecha', finHoyStr)
      .order('fecha', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }
}
