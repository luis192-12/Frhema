import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VentasService } from '../../core/services/ventas/ventas.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial.component.html'
})
export class HistorialComponent implements OnInit {

  ventas: any[] = [];            // datos originales
  ventasFiltradas: any[] = [];   // datos que se muestran
  detalle: any[] = [];

  mostrandoDetalle = false;
  ventaSeleccionada: any = null;

  filtroNombre: string = '';
  filtroFecha: string = '';

  loading = true;

  constructor(private ventasService: VentasService) {}

  async ngOnInit() {
    await this.cargarVentas();
  }

  // ============================
  // CARGAR TODAS LAS VENTAS
  // ============================
  async cargarVentas() {
    this.loading = true;

    const data = await this.ventasService.getVentas();

    // Asegurar array válido
    this.ventas = Array.isArray(data) ? data : [];
    this.ventasFiltradas = [...this.ventas];

    this.loading = false;
  }

  // ============================
  // FILTRO POR NOMBRE
  // ============================
  filtrarPorNombre() {
    const nombre = this.filtroNombre.toLowerCase().trim();

    if (!nombre) {
      this.ventasFiltradas = [...this.ventas];
      return;
    }

    this.ventasFiltradas = this.ventas.filter(v =>
      v.clientes?.nombre?.toLowerCase().includes(nombre)
    );
  }

  // ============================
  // FILTRO POR FECHA
  // ============================
  filtrarPorFecha() {
    const fecha = this.filtroFecha.trim();

    if (!fecha) {
      this.ventasFiltradas = [...this.ventas];
      return;
    }

    this.ventasFiltradas = this.ventas.filter(v =>
      v.fecha?.substring(0, 10) === fecha
    );
  }

  // ============================
  // LIMPIAR TODOS LOS FILTROS
  // ============================
  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroFecha = '';
    this.ventasFiltradas = [...this.ventas];
  }

  // ============================
  // VER DETALLE
  // ============================
  async verDetalle(venta: any) {
    this.ventaSeleccionada = venta;
    this.detalle = await this.ventasService.getDetalle(venta.id_venta);
    this.mostrandoDetalle = true;
  }

  // ============================
  // CERRAR DETALLE
  // ============================
  cerrarDetalle() {
    this.mostrandoDetalle = false;
    this.detalle = [];
    this.ventaSeleccionada = null;
  }

}
