import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductosService } from '../../core/services/inventario/productos.service';
import { CategoriasService } from '../../core/services/inventario/categorias.service';
import { ProveedoresService } from '../../core/services/inventario/proveedores.service';

import { Producto } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/categoria.model';
import { Proveedor } from '../../core/models/proveedor.model';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html'
})
export class ProductosComponent implements OnInit {

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];
  loading = true;
  terminoBusqueda = '';
  mostrarFormulario = false;

  // formulario
  modoEdicion = false;
  producto: Producto = this.getEmptyProducto();

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private proveedoresService: ProveedoresService
  ) {}

  async ngOnInit() {
    await this.cargarCategorias();
    await this.cargarProveedores();
    await this.cargarProductos();
  }

  getEmptyProducto(): Producto {
    return {
      codigo: '',
      nombre: '',
      descripcion: '',
      id_categoria: null,
      id_proveedor: null,
      unidad_medida: 'Unidad',
      stock_actual: 0,
      stock_minimo: 0,
      precio_unitario: 0,
      precio_mayor: null,
      tiene_caducidad: false,
      fecha_vencimiento: null,
      tiene_garantia: false,
      meses_garantia: null
    };
  }

  // ============================
  // CARGAR CATEGORÍAS
  // ============================
  async cargarCategorias() {
    this.categorias = await this.categoriasService.getCategorias();
  }

  // ============================
  // CARGAR PROVEEDORES
  // ============================
  async cargarProveedores() {
    this.proveedores = await this.proveedoresService.getProveedores();
  }

  // ============================
  // LISTAR PRODUCTOS
  // ============================
  async cargarProductos() {
    this.loading = true;
    this.productos = await this.productosService.getProductos();
    this.filtrarProductos();
    this.loading = false;
  }

  filtrarProductos() {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = this.productos;
    } else {
      const termino = this.terminoBusqueda.toLowerCase();
      this.productosFiltrados = this.productos.filter(p =>
        p.codigo?.toLowerCase().includes(termino) ||
        p.nombre?.toLowerCase().includes(termino) ||
        p.descripcion?.toLowerCase().includes(termino)
      );
    }
  }

  // ============================
  // NUEVO
  // ============================
  nuevoProducto() {
    this.modoEdicion = false;
    this.mostrarFormulario = !this.mostrarFormulario;
    this.producto = this.getEmptyProducto();
  }

  // ============================
  // EDITAR
  // ============================
  editarProducto(p: Producto) {
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.producto = { ...p };
  }

  // ============================
  // GUARDAR
  // ============================
  async guardarProducto() {
    try {
      if (this.modoEdicion && this.producto.id_producto) {
        await this.productosService.updateProducto(this.producto.id_producto, this.producto);
        alert('Producto actualizado');
      } else {
        await this.productosService.addProducto(this.producto);
        alert('Producto creado');
      }

      this.producto = this.getEmptyProducto();
      this.modoEdicion = false;
      this.mostrarFormulario = false;
      this.cargarProductos();

    } catch (err) {
      console.error(err);
      alert('Error al guardar');
    }
  }

  // ============================
  // ELIMINAR
  // ============================
  async eliminarProducto(id: number) {
    if (!confirm('¿Deseas eliminar este producto?')) return;

    try {
      await this.productosService.deleteProducto(id);
      this.cargarProductos();
    } catch (err) {
      alert('Error al eliminar');
    }
  }

  // ============================
  // OBTENER NOMBRE DE CATEGORÍA
  // ============================
  getCategoriaNombre(id: number | null) {
    return this.categorias.find(c => c.id_categoria === id)?.nombre || '-';
  }

  // ============================
  // OBTENER NOMBRE DE PROVEEDOR
  // ============================
  getProveedorNombre(id: number | null) {
    return this.proveedores.find(p => p.id_proveedor === id)?.nombre || '-';
  }
}
