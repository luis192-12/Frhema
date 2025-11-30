import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { VentasService } from '../../core/services/ventas/ventas.service';
import { ProductosService } from '../../core/services/inventario/productos.service';
import { Producto } from '../../core/models/producto.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  
  // Métricas principales
  ventasHoy: number = 0;
  montoHoy: number = 0;
  ventasMes: number = 0;
  montoMes: number = 0;

  // Ventas recientes
  ventasRecientes: any[] = [];

  // Productos con stock crítico
  productosStockCritico: Producto[] = [];

  loading = true;

  constructor(
    private ventasService: VentasService,
    private productosService: ProductosService
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    try {
      this.loading = true;

      // Cargar métricas principales
      this.ventasHoy = await this.ventasService.getVentasHoyCount();
      this.montoHoy = await this.ventasService.getMontoHoy();
      this.ventasMes = await this.ventasService.getVentasMesCount();
      this.montoMes = await this.ventasService.getMontoMes();

      // Cargar ventas recientes
      this.ventasRecientes = await this.ventasService.getVentasRecientes();

      // Cargar productos con stock crítico
      this.productosStockCritico = await this.productosService.getProductosStockCritico(3);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      this.loading = false;
    }
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  // Formatear moneda
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(valor);
  }

  // Obtener nombre del cliente
  getNombreCliente(venta: any): string {
    return venta.clientes?.nombre || 'Cliente General';
  }
}
