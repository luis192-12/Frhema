import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProductosService } from '../inventario/productos.service';
import { Producto } from '../../models/producto.model';

export interface Notificacion {
  id: string;
  tipo: 'stock_critico' | 'stock_agotado' | 'info' | 'warning' | 'error';
  titulo: string;
  mensaje: string;
  producto?: Producto;
  fecha: Date;
  leida: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private notificaciones: Notificacion[] = [];
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  public notificaciones$: Observable<Notificacion[]> = this.notificacionesSubject.asObservable();

  constructor(private productosService: ProductosService) {
    this.cargarNotificacionesStock();       // Cargar notificaciones iniciales
    setInterval(() => this.cargarNotificacionesStock(), 5 * 60 * 1000); // Actualizar notificaciones cada 5 minutos 
  }

  // ============================
  // CARGAR NOTIFICACIONES DE STOCK CRÍTICO
  // ============================
  async cargarNotificacionesStock() {
    try {
      const productosCriticos = await this.productosService.getProductosStockCritico();
      
      this.notificaciones = this.notificaciones.filter(n => 
        (n.tipo !== 'stock_critico' && n.tipo !== 'stock_agotado') || n.leida
      );
      
      productosCriticos.forEach(producto => {
        const stock = producto.stock_actual || 0;
        const stockMinimo = producto.stock_minimo || 0;
        const tipo = stock === 0 ? 'stock_agotado' : 'stock_critico';
        const titulo = stock === 0 ? 'Producto Agotado' : 'Stock Crítico';
        const mensaje = stock === 0 
          ? `${producto.nombre} se ha agotado. Stock: ${stock}`
          : `${producto.nombre} tiene stock bajo. Stock actual: ${stock}${stockMinimo > 0 ? ` (Mínimo: ${stockMinimo})` : ''}`;

        this.agregarNotificacion({
          id: `stock-${producto.id_producto}`,
          tipo,
          titulo,
          mensaje,
          producto,
          fecha: new Date(),
          leida: false
        });
      });

      this.actualizarNotificaciones();
    } catch (error) {
      console.error('Error al cargar notificaciones de stock:', error);
    }
  }

  // ============================
  // AGREGAR NOTIFICACIÓN
  // ============================
  agregarNotificacion(notificacion: Notificacion) {
    const existe = this.notificaciones.some(n => 
      n.producto?.id_producto === notificacion.producto?.id_producto && 
      n.tipo === notificacion.tipo &&
      !n.leida
    );
    
    if (!existe) {
      this.notificaciones.unshift(notificacion);
      if (this.notificaciones.length > 50) {
        this.notificaciones = this.notificaciones.slice(0, 50);
      }
      this.actualizarNotificaciones();
    }
  }

  // ============================
  // OBTENER NOTIFICACIONES NO LEÍDAS
  // ============================
  getNotificacionesNoLeidas(): Notificacion[] {
    return this.notificaciones.filter(n => !n.leida);
  }

  // ============================
  // CONTAR NOTIFICACIONES NO LEÍDAS
  // ============================
  getCantidadNoLeidas(): number {
    return this.getNotificacionesNoLeidas().length;
  }

  // ============================
  // MARCAR COMO LEÍDA
  // ============================
  marcarComoLeida(id: string) {
    const notificacion = this.notificaciones.find(n => n.id === id);
    if (notificacion) {
      notificacion.leida = true;
      this.actualizarNotificaciones();
    }
  }

  // ============================
  // MARCAR TODAS COMO LEÍDAS
  // ============================
  marcarTodasComoLeidas() {
    this.notificaciones.forEach(n => n.leida = true);
    this.actualizarNotificaciones();
  }

  // ============================
  // ELIMINAR NOTIFICACIÓN
  // ============================
  eliminarNotificacion(id: string) {
    this.notificaciones = this.notificaciones.filter(n => n.id !== id);
    this.actualizarNotificaciones();
  }

  // ============================
  // OBTENER TODAS LAS NOTIFICACIONES
  // ============================
  getNotificaciones(): Notificacion[] {
    return this.notificaciones;
  }

  // ============================
  // ACTUALIZAR OBSERVABLE
  // ============================
  private actualizarNotificaciones() {
    this.notificacionesSubject.next([...this.notificaciones]);
  }
}

