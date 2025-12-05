import { Injectable } from '@angular/core';
import { SupabaseClientService } from '../auth/supabase.client';
import { Producto } from '../../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private readonly TABLE = 'productos';
  private readonly TABLE_MOVIMIENTOS = 'movimientos_stock';

  constructor(private supabase: SupabaseClientService) {}

  // ============================
  // LISTAR
  // ============================
  async getProductos(mostrarSuspendidos: boolean = false): Promise<Producto[]> {
    try {
      let query = this.supabase.client
        .from(this.TABLE)
        .select('*');
      
      if (!mostrarSuspendidos) {
        query = query.or('activo.is.null,activo.eq.true');
      }
      
      const { data, error } = await query
        .order('id_producto', { ascending: true });

      if (error) {
        const errorMessage = error.message || '';
        if (errorMessage.includes('column') || errorMessage.includes('activo') || errorMessage.includes('does not exist')) {
          console.warn('Campo activo no existe en Supabase. Cargando todos los productos sin filtro.');
          const { data: dataSimple, error: errorSimple } = await this.supabase.client
            .from(this.TABLE)
            .select('*')
            .order('id_producto', { ascending: true });
          
          if (errorSimple) throw errorSimple;
          const productos = (dataSimple as Producto[]).filter(p => {
            if (mostrarSuspendidos) return true;
            return p.activo === null || p.activo === undefined || p.activo === true;
          });
          
          return productos;
        }
        throw error;
      }
      
      return data as Producto[];
    } catch (error) {
      console.error('Error al cargar productos:', error);
      return [];
    }
  }

  // ============================
  // CREAR
  // ============================
  async addProducto(producto: Producto) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert([producto])
      .select()
      .single();

    if (error) throw error;
    return data as Producto;
  }

  // ============================
  // ACTUALIZAR
  // ============================
  async updateProducto(id: number, producto: Partial<Producto>) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(producto)
      .eq('id_producto', id)
      .select()
      .single();

    if (error) throw error;
    return data as Producto;
  }

  // ============================
  // ELIMINAR
  // ============================
  async deleteProducto(id: number) {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id_producto', id);

    if (error) throw error;
    return true;
  }

  // ============================
  // PRODUCTOS CON STOCK CRÍTICO
  // ============================

  async getProductosStockCritico(limite?: number): Promise<Producto[]> {
    try {
      let query = this.supabase.client
        .from(this.TABLE)
        .select('*');
      
      try {
        query = query.or('activo.is.null,activo.eq.true');
      } catch (e) {
        console.warn('Campo activo no existe, cargando todos los productos');
      }
      
      if (limite !== undefined) {
        query = query.lte('stock_actual', limite);
      } else {
        query = query.lte('stock_actual', 3);
      }
      
      const { data, error } = await query
        .order('stock_actual', { ascending: true })
        .limit(20);

      if (error) {
        console.warn('Error en consulta con filtro activo, intentando sin filtro:', error);
        let querySimple = this.supabase.client
          .from(this.TABLE)
          .select('*');
        
        if (limite !== undefined) {
          querySimple = querySimple.lte('stock_actual', limite);
        } else {
          querySimple = querySimple.lte('stock_actual', 3);
        }
        
        const { data: dataSimple, error: errorSimple } = await querySimple
          .order('stock_actual', { ascending: true })
          .limit(20);
        
        if (errorSimple) throw errorSimple;
        
        const productos = (dataSimple as Producto[]).filter(p => {
          const stockActual = p.stock_actual || 0;
          const stockMinimo = p.stock_minimo || 0;
          const limiteUsar = limite !== undefined ? limite : (stockMinimo > 0 ? stockMinimo : 3);
          // Filtrar solo productos activos o sin campo activo (null)
          const esActivo = p.activo === null || p.activo === undefined || p.activo === true;
          return stockActual <= limiteUsar && esActivo;
        });
        
        return productos;
      }
      
      const productos = (data as Producto[]).filter(p => {
        const stockActual = p.stock_actual || 0;
        const stockMinimo = p.stock_minimo || 0;
        const limiteUsar = limite !== undefined ? limite : (stockMinimo > 0 ? stockMinimo : 3);
        return stockActual <= limiteUsar;
      });
      
      return productos;
    } catch (error) {
      console.error('Error al cargar productos con stock crítico:', error);
      return []; 
    }
  }

  // ============================
  // REGISTRAR MOVIMIENTO DE STOCK (KARDEX)
  // ============================
  async registrarMovimientoStock(movimiento: {
    id_producto: number;
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    cantidad: number;
    stock_antes: number;
    stock_despues: number;
    referencia?: string;
  }) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_MOVIMIENTOS)
      .insert([{
        id_producto: movimiento.id_producto,
        tipo: movimiento.tipo,
        cantidad: movimiento.cantidad,
        stock_antes: movimiento.stock_antes,
        stock_despues: movimiento.stock_despues,
        referencia: movimiento.referencia || null
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error };
  }
}
