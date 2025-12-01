// src/app/ventas/pos/pos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VentasService } from '../../core/services/ventas/ventas.service';
import { ClientesService } from '../../core/services/personas/clientes.service';
import { ProductosService } from '../../core/services/inventario/productos.service';

import { Venta } from '../../core/models/venta.model';
import { DetalleVenta } from '../../core/models/detalle-venta.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html'
})
export class PosComponent implements OnInit {

  clientes: any[] = [];
  productos: any[] = [];

  aplicarIgv: boolean = false; // IGV opcional

 incluirIGV: boolean = false;
  igv: number = 0;
  base_imponible: number = 0;
  total_con_igv: number = 0;

  venta: Venta = {
    id_usuario: '',
    id_cliente: 0,
    tipo_comprobante: 'Boleta',
    nro_comprobante: '',
    metodo_pago: 'Efectivo',
    total: 0,
    base_imponible: 0,
    igv: 0
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

    const uid = localStorage.getItem('user_id');

    if (!uid) {
      alert('Sesión expirada. Inicie sesión nuevamente.');
      window.location.href = '/';
      return;
    }

    this.venta.id_usuario = uid;

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
  const totalSinIGV = this.carrito.reduce((sum, x) => sum + (x.subtotal ?? 0), 0);

  if (this.incluirIGV) {
    // IGV 18%
    this.base_imponible = totalSinIGV / 1.18;
    this.igv = totalSinIGV - this.base_imponible;
    this.total_con_igv = totalSinIGV;

    this.venta.total = this.total_con_igv;
  } else {
    // Sin IGV
    this.base_imponible = totalSinIGV;
    this.igv = 0;
    this.total_con_igv = totalSinIGV;

    this.venta.total = totalSinIGV;
  }
}


  limpiarVenta() {
    this.carrito = [];
    this.venta.total = 0;
    this.venta.base_imponible = 0;
    this.venta.igv = 0;
    this.venta.id_cliente = 0;
    this.venta.tipo_comprobante = 'Boleta';
    this.venta.metodo_pago = 'Efectivo';
    this.venta.nro_comprobante = '';
    this.formProducto = { id_producto: 0, cantidad: 1, descuento: 0 };
    this.aplicarIgv = false;
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
///////////////////// GENERAR COMPROBANTE PDF //////////////////////////
generarComprobantePDF() {
  if (this.venta.tipo_comprobante === 'No desea') {
    alert('No se generará comprobante.');
    return;
  }

  // 🔍 FIX: obtener cliente correctamente
  const cliente = this.clientes.find(
    c => Number(c.id_cliente) === Number(this.venta.id_cliente)
  );

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200]
  });

  doc.setFontSize(10);
  doc.text("FERRETERÍA RHEMA", 40, 10, { align: "center" });
  doc.text("RUC: 12345678901", 40, 15, { align: "center" });
  doc.text("----------------------------------------", 2, 20);

  doc.text(`Comprobante: ${this.venta.tipo_comprobante}`, 2, 26);
  doc.text(`Número: ${this.venta.nro_comprobante || '---'}`, 2, 31);

  // 👇 AQUI YA NO SALDRÁ UNDEFINED
  doc.text(`Cliente: ${cliente?.nombre || 'No seleccionado'}`, 2, 36);

  doc.text("----------------------------------------", 2, 42);

  autoTable(doc, {
    startY: 45,
    head: [['Prod', 'Cant', 'P.Unit', 'Sub']],
    body: this.carrito.map(item => [
      this.getNombreProducto(item.id_producto),
      item.cantidad.toString(),
      "S/ " + item.precio_unitario.toFixed(2),
      "S/ " + (item.subtotal ?? 0).toFixed(2)
    ]),
    theme: 'plain',
    styles: { fontSize: 8 }
  });

  let y = (doc as any).lastAutoTable.finalY + 5;

  doc.text("----------------------------------------", 2, y);
  y += 5;

  doc.setFontSize(12);
  doc.text(`TOTAL: S/ ${this.venta.total.toFixed(2)}`, 2, y);

  const nombre = `${this.venta.tipo_comprobante}-${Date.now()}.pdf`;
  doc.save(nombre);
}


}
