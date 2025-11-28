import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ComprasService } from '../../core/services/compras/compras.service';
import { ProveedoresService } from '../../core/services/inventario/proveedores.service';
import { ProductosService } from '../../core/services/inventario/productos.service';

import { Compra } from '../../core/models/compra.model';
import { DetalleCompra } from '../../core/models/detalle-compra.model';

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras-list.component.html',
})
export class ComprasListComponent implements OnInit {

  compras: any[] = [];
  proveedores: any[] = [];
  productos: any[] = [];

  // Compra actual
  compra: Compra = {
    id_proveedor: 0,
    id_usuario: '', // se cargará desde localStorage
    nro_documento: '',
    total: 0
  };

  detalles: DetalleCompra[] = [];

  nuevoDetalle: DetalleCompra = {
    id_producto: 0,
    cantidad: 1,
    costo_unitario: 0,
  };

  constructor(
    private comprasService: ComprasService,
    private proveedoresService: ProveedoresService,
    private productosService: ProductosService
  ) {}

  async ngOnInit() {
    this.compra.id_usuario = localStorage.getItem('user_id') ?? '';
    this.proveedores = await this.proveedoresService.getProveedores();
    this.productos = await this.productosService.getProductos();
    this.cargarCompras();
  }

  async cargarCompras() {
    this.compras = await this.comprasService.getCompras();
  }

  // =========================================
  // 🔍 OBTENER NOMBRE DE PRODUCTO POR ID
  // =========================================
  getNombreProducto(id: number): string {
    const p = this.productos.find(prod => prod.id_producto === id);
    return p ? p.nombre : '';
  }

  // ============================
  // AGREGAR DETALLE
  // ============================
  agregarDetalle() {
    if (!this.nuevoDetalle.id_producto) {
      alert('Seleccione un producto');
      return;
    }

    this.nuevoDetalle.subtotal = 
      this.nuevoDetalle.cantidad * this.nuevoDetalle.costo_unitario;

    this.detalles.push({ ...this.nuevoDetalle });

    this.nuevoDetalle = { id_producto: 0, cantidad: 1, costo_unitario: 0 };

    this.calcularTotal();
  }

  eliminarDetalle(index: number) {
    this.detalles.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.compra.total = this.detalles.reduce((sum, d) => sum + (d.subtotal ?? 0), 0);
  }

  // ============================
  // LIMPIAR FORMULARIO
  // ============================
  limpiarFormulario() {
    this.compra = {
      id_proveedor: 0,
      id_usuario: this.compra.id_usuario,
      nro_documento: '',
      total: 0
    };
    this.detalles = [];
    this.nuevoDetalle = {
      id_producto: 0,
      cantidad: 1,
      costo_unitario: 0
    };
  }

  // ============================
  // GUARDAR COMPRA
  // ============================
  async guardarCompra() {
    if (!this.compra.id_proveedor) {
      alert('Seleccione un proveedor');
      return;
    }

    if (this.detalles.length === 0) {
      alert('Agregue productos');
      return;
    }

    try {
      const id_compra = await this.comprasService.registrarCompra(this.compra, this.detalles);
      alert('Compra registrada #' + id_compra);

      this.limpiarFormulario();
      this.cargarCompras();

    } catch (err) {
      console.error(err);
      alert('Error al registrar compra');
    }
  }
}
