import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ComprasService } from '../../core/services/compras/compras.service';
import { ProveedoresService } from '../../core/services/inventario/proveedores.service';
import { ProductosService } from '../../core/services/inventario/productos.service';
import { CategoriasService } from '../../core/services/inventario/categorias.service';

import { Compra } from '../../core/models/compra.model';
import { DetalleCompra } from '../../core/models/detalle-compra.model';
import { Producto } from '../../core/models/producto.model';
import { Proveedor } from '../../core/models/proveedor.model';

@Component({
  selector: 'app-compras-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf],
  templateUrl: './compras-list.component.html',
})
export class ComprasListComponent implements OnInit {

  compras: any[] = [];
  proveedores: any[] = [];
  productos: any[] = [];
  categorias: any[] = [];

  // Compra actual
  compra: Compra = {
    id_proveedor: 0,
    id_usuario: '',
    nro_documento: '',
    total: 0
  };

  detalles: DetalleCompra[] = [];

  nuevoDetalle: DetalleCompra = {
    id_producto: 0,
    cantidad: 1,
    costo_unitario: 0,
  };

  // Modal de nuevo producto
  mostrarModalNuevoProducto = false;
  nuevoProducto: Partial<Producto> = {
    nombre: '',
    codigo: '',
    id_categoria: null,
    unidad_medida: 'UND',
    marca: '',
    precio_unitario: 0,
    precio_mayor: 0,
    precio_compra: 0,
    stock_actual: 0,
    stock_minimo: 0,
    activo: true
  };

  // Modal de nuevo proveedor
  mostrarModalNuevoProveedor = false;
  nuevoProveedor: Partial<Proveedor> = {
    nombre: '',
    tipo_documento: '',
    numero_documento: '',
    telefono: '',
    correo: '',
    direccion: '',
    activo: true
  };

  // Unidades de medida predefinidas
  unidadesMedida: string[] = ['UND', 'M', 'KG', 'CAJA', 'L', 'M2', 'M3', 'PAR', 'SET', 'ROLLO', 'BOLSA', 'LITRO', 'GALON'];

  constructor(
    private comprasService: ComprasService,
    private proveedoresService: ProveedoresService,
    private productosService: ProductosService,
    private categoriasService: CategoriasService
  ) {}

  async ngOnInit() {
    this.compra.id_usuario = localStorage.getItem('user_id') ?? '';
    // Inicializar fecha con la fecha y hora actual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.compra.fecha = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    this.proveedores = await this.proveedoresService.getProveedores();
    this.categorias = await this.categoriasService.getCategorias();
    // Cargar todos los productos (incluyendo suspendidos) para poder comprarlos y reactivarlos
    this.productos = await this.productosService.getProductos(true);
    this.cargarCompras();
  }

  async cargarCompras() {
    this.compras = await this.comprasService.getCompras();
  }

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

    const subtotal =
      this.nuevoDetalle.cantidad * this.nuevoDetalle.costo_unitario;

    this.detalles.push({
      id_producto: this.nuevoDetalle.id_producto,
      cantidad: this.nuevoDetalle.cantidad,
      costo_unitario: this.nuevoDetalle.costo_unitario,
      subtotal   // <-- solo para mostrarlo en la tabla
    });

    this.nuevoDetalle = { id_producto: 0, cantidad: 1, costo_unitario: 0 };

    this.calcularTotal();
  }

  eliminarDetalle(index: number) {
    this.detalles.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.compra.total = this.detalles.reduce(
      (sum, d) => sum + (d.subtotal ?? 0),
      0
    );
  }

  limpiarFormulario() {
    // Reinicializar fecha con la fecha y hora actual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    this.compra = {
      id_proveedor: 0,
      id_usuario: this.compra.id_usuario,
      nro_documento: '',
      total: 0,
      fecha: `${year}-${month}-${day}T${hours}:${minutes}`
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
      const id_compra = await this.comprasService.registrarCompra(
        this.compra,
        this.detalles
      );

      alert('Compra registrada #' + id_compra);

      this.limpiarFormulario();
      this.cargarCompras();

    } catch (err) {
      console.error(err);
      alert('Error al registrar compra');
    }
  }

  // ============================
  // NUEVO PRODUCTO RÁPIDO
  // ============================
  abrirModalNuevoProducto() {
    this.nuevoProducto = {
      nombre: '',
      codigo: this.generarCodigo(),
      id_categoria: null,
      unidad_medida: 'UND',
      marca: '',
      precio_unitario: 0,
      precio_mayor: 0,
      precio_compra: 0,
      stock_actual: 0,
      stock_minimo: 0,
      activo: true
    };
    this.mostrarModalNuevoProducto = true;
  }

  cerrarModalNuevoProducto() {
    this.mostrarModalNuevoProducto = false;
    this.nuevoProducto = {
      nombre: '',
      codigo: '',
      id_categoria: null,
      unidad_medida: 'UND',
      marca: '',
      precio_unitario: 0,
      precio_mayor: 0,
      precio_compra: 0,
      stock_actual: 0,
      stock_minimo: 0,
      activo: true
    };
  }

  generarCodigo(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${timestamp}${random}`.substring(0, 10);
  }

  async guardarNuevoProducto() {
    if (!this.nuevoProducto.nombre || !this.nuevoProducto.nombre.trim()) {
      alert('El nombre del producto es requerido');
      return;
    }

    if (!this.nuevoProducto.id_categoria) {
      alert('Seleccione una categoría');
      return;
    }

    if (!this.nuevoProducto.unidad_medida) {
      alert('Seleccione una unidad de medida');
      return;
    }

    if (!this.nuevoProducto.precio_unitario || this.nuevoProducto.precio_unitario <= 0) {
      alert('El precio de venta es requerido y debe ser mayor a 0');
      return;
    }

    try {
      // Crear el producto
      const productoGuardado = await this.productosService.addProducto(this.nuevoProducto as Producto);

      // Validar que el producto se creó correctamente con un ID
      if (!productoGuardado.id_producto) {
        throw new Error('El producto se creó pero no se obtuvo un ID válido');
      }

      // Actualizar la lista de productos
      this.productos = await this.productosService.getProductos(true);

      // Seleccionar automáticamente el producto recién creado
      this.nuevoDetalle.id_producto = productoGuardado.id_producto;
      
      // Si se ingresó un precio de compra, usarlo
      if (this.nuevoProducto.precio_compra && this.nuevoProducto.precio_compra > 0) {
        this.nuevoDetalle.costo_unitario = this.nuevoProducto.precio_compra;
      }

      // Cerrar el modal
      this.cerrarModalNuevoProducto();

      alert(`Producto "${productoGuardado.nombre}" creado exitosamente y seleccionado.`);

    } catch (err: any) {
      console.error('Error al crear producto:', err);
      alert('Error al crear el producto: ' + (err.message || 'Error desconocido'));
    }
  }

  // ============================
  // NUEVO PROVEEDOR RÁPIDO
  // ============================
  abrirModalNuevoProveedor() {
    this.nuevoProveedor = {
      nombre: '',
      tipo_documento: '',
      numero_documento: '',
      telefono: '',
      correo: '',
      direccion: '',
      activo: true
    };
    this.mostrarModalNuevoProveedor = true;
  }

  cerrarModalNuevoProveedor() {
    this.mostrarModalNuevoProveedor = false;
    this.nuevoProveedor = {
      nombre: '',
      tipo_documento: '',
      numero_documento: '',
      telefono: '',
      correo: '',
      direccion: '',
      activo: true
    };
  }

  async guardarNuevoProveedor() {
    if (!this.nuevoProveedor.nombre || !this.nuevoProveedor.nombre.trim()) {
      alert('El nombre del proveedor es requerido');
      return;
    }

    if (!this.nuevoProveedor.tipo_documento || !this.nuevoProveedor.tipo_documento.trim()) {
      alert('El tipo de documento es requerido');
      return;
    }

    if (!this.nuevoProveedor.numero_documento || !this.nuevoProveedor.numero_documento.trim()) {
      alert('El número de documento es requerido');
      return;
    }

    try {
      // Crear el proveedor con validación de campos requeridos
      const proveedorParaGuardar: Proveedor = {
        nombre: this.nuevoProveedor.nombre,
        tipo_documento: this.nuevoProveedor.tipo_documento,
        numero_documento: this.nuevoProveedor.numero_documento,
        telefono: this.nuevoProveedor.telefono || '',
        correo: this.nuevoProveedor.correo || '',
        direccion: this.nuevoProveedor.direccion || '',
        activo: this.nuevoProveedor.activo ?? true
      };

      const proveedorGuardado = await this.proveedoresService.addProveedor(proveedorParaGuardar);

      // Actualizar la lista de proveedores
      this.proveedores = await this.proveedoresService.getProveedores();

      // Seleccionar automáticamente el proveedor recién creado
      if (proveedorGuardado.id_proveedor) {
        this.compra.id_proveedor = proveedorGuardado.id_proveedor;
      }

      // Cerrar el modal
      this.cerrarModalNuevoProveedor();

      alert(`Proveedor "${proveedorGuardado.nombre}" creado exitosamente y seleccionado.`);

    } catch (err: any) {
      console.error('Error al crear proveedor:', err);
      alert('Error al crear el proveedor: ' + (err.message || 'Error desconocido'));
    }
  }
}
