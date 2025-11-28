/*
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VentasService } from '../../core/services/ventas/ventas.service';
import { ClientesService } from '../../core/services/personas/clientes.service';
import { ProductosService } from '../../core/services/inventario/productos.service';

import { Venta } from '../../core/models/venta.model';
import { DetalleVenta } from '../../core/models/detalle-venta.model';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html'
})
export class PosComponent implements OnInit {

  clientes: any[] = [];
  productos: any[] = [];

  venta: Venta = {
    id_usuario: '',
    id_cliente: 0,
    tipo_comprobante: 'Boleta',
    nro_comprobante: '',
    metodo_pago: 'Efectivo',
    total: 0
  };

  carrito: DetalleVenta[] = [];

  formProducto = {
    id_producto: 0,
    cantidad: 1,
    descuento: 0
  };

  constructor(
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private productosService: ProductosService
  ) {}

  async ngOnInit() {
    this.venta.id_usuario = localStorage.getItem('user_id') ?? '';

    this.clientes = await this.clientesService.getClientes();
    this.productos = await this.productosService.getProductos();
  }

  // =====================================================
  // OBTENER NOMBRE DE PRODUCTO (CORRECCIÓN)
  // =====================================================
  getNombreProducto(id: number): string {
    const prod = this.productos.find(p => p.id_producto === id);
    return prod ? prod.nombre : '---';
  }

  // =====================================================
  // AGREGAR PRODUCTO AL CARRITO
  // =====================================================
  agregarProducto() {
    const prod = this.productos.find(p => p.id_producto == this.formProducto.id_producto);

    if (!prod) {
      alert('Seleccione un producto');
      return;
    }

    const precio = prod.precio_unitario;

    const detalle: DetalleVenta = {
      id_producto: prod.id_producto,
      cantidad: this.formProducto.cantidad,
      precio_unitario: precio,
      descuento: this.formProducto.descuento,
      subtotal: (precio * this.formProducto.cantidad) - this.formProducto.descuento
    };

    this.carrito.push(detalle);

    this.formProducto = { id_producto: 0, cantidad: 1, descuento: 0 };

    this.calcularTotal();
  }

  eliminar(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.venta.total = this.carrito.reduce((sum, x) => sum + (x.subtotal ?? 0), 0);
  }

  // =====================================================
  // PROCESAR VENTA
  // =====================================================
  async procesarVenta() {
    if (!this.venta.id_cliente) {
      alert('Seleccione cliente');
      return;
    }

    if (this.carrito.length === 0) {
      alert('Agregue productos');
      return;
    }

    try {
      const id = await this.ventasService.registrarVenta(this.venta, this.carrito);

      alert(`Venta procesada #${id}`);

      this.venta = {
        id_usuario: this.venta.id_usuario,
        id_cliente: 0,
        tipo_comprobante: 'Boleta',
        nro_comprobante: '',
        metodo_pago: 'Efectivo',
        total: 0
      };

      this.carrito = [];

    } catch (err) {
      console.error(err);
      alert('Error al procesar venta');
    }
  }
}
*/
// src/app/ventas/pos/pos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VentasService } from '../../core/services/ventas/ventas.service';
import { ClientesService } from '../../core/services/personas/clientes.service';
import { ProductosService } from '../../core/services/inventario/productos.service';

import { Venta } from '../../core/models/venta.model';
import { DetalleVenta } from '../../core/models/detalle-venta.model';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html'
})
export class PosComponent implements OnInit {

  clientes: any[] = [];
  productos: any[] = [];

  venta: Venta = {
    id_usuario: '',
    id_cliente: 0,
    tipo_comprobante: 'Boleta',
    nro_comprobante: '',
    metodo_pago: 'Efectivo',
    total: 0
  };

  carrito: DetalleVenta[] = [];

  formProducto = {
    id_producto: 0,
    cantidad: 1,
    descuento: 0
  };

  constructor(
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private productosService: ProductosService
  ) {}

  async ngOnInit() {

    // Validar sesión
    const uid = localStorage.getItem('user_id');

    if (!uid) {
      alert('Sesión expirada. Inicie sesión nuevamente.');
      window.location.href = '/';
      return;
    }

    this.venta.id_usuario = uid;

    // Cargar datos
    this.clientes = await this.clientesService.getClientes();
    this.productos = await this.productosService.getProductos();
  }

  getNombreProducto(id: number): string {
    const prod = this.productos.find(p => p.id_producto === id);
    return prod ? prod.nombre : '---';
  }

  agregarProducto() {
    const prod = this.productos.find(p => p.id_producto == this.formProducto.id_producto);

    if (!prod) {
      alert('Seleccione un producto');
      return;
    }

    if (this.formProducto.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const precio = prod.precio_unitario;

    const detalle: DetalleVenta = {
      id_producto: prod.id_producto,
      cantidad: this.formProducto.cantidad,
      precio_unitario: precio,
      descuento: this.formProducto.descuento,
      subtotal: (precio * this.formProducto.cantidad) - this.formProducto.descuento
    };

    this.carrito.push(detalle);

    this.formProducto = { id_producto: 0, cantidad: 1, descuento: 0 };

    this.calcularTotal();
  }

  eliminar(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.venta.total = this.carrito.reduce((sum, x) => sum + (x.subtotal ?? 0), 0);
  }

  limpiarVenta() {
    this.carrito = [];
    this.venta.total = 0;
    this.venta.id_cliente = 0;
    this.venta.tipo_comprobante = 'Boleta';
    this.venta.metodo_pago = 'Efectivo';
    this.venta.nro_comprobante = '';
    this.formProducto = { id_producto: 0, cantidad: 1, descuento: 0 };
  }

  async procesarVenta() {
    if (!this.venta.id_cliente || this.venta.id_cliente === 0) {
      alert('Seleccione cliente');
      return;
    }

    if (this.carrito.length === 0) {
      alert('Agregue productos');
      return;
    }

    try {
      const id = await this.ventasService.registrarVenta(this.venta, this.carrito);

      alert(`Venta procesada correctamente (#${id})`);

      this.limpiarVenta();

    } catch (err) {
      console.error(err);
      alert('Error al procesar venta. Revisa la consola.');
    }
  }
}
