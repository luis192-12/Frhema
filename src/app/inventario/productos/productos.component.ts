import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductosService } from '../../core/services/inventario/productos.service';
import { CategoriasService } from '../../core/services/inventario/categorias.service';
import { ProveedoresService } from '../../core/services/inventario/proveedores.service';
import { ComprasService } from '../../core/services/compras/compras.service';
import { NotificacionesService } from '../../core/services/notificaciones/notificaciones.service';

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
  modoEdicion = false;
  producto: Producto = this.getEmptyProducto();

  // Unidades de medida predefinidas
  unidadesMedida: string[] = ['UND', 'M', 'KG', 'CAJA', 'L', 'M2', 'M3', 'PAR', 'SET', 'ROLLO', 'BOLSA', 'LITRO', 'GALON'];
  resumenCompras: Map<number, { cantidad_total: number; precio_unitario_promedio: number; precio_total_compra: number }> = new Map();

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private proveedoresService: ProveedoresService,
    private comprasService: ComprasService,
    private notificacionesService: NotificacionesService
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
      unidad_medida: 'UND',
      stock_actual: 0,
      stock_minimo: 0,
      precio_unitario: 0,
      precio_mayor: null,
      tiene_caducidad: false,
      fecha_vencimiento: null,
      tiene_garantia: false,
      meses_garantia: null,
      precio_compra: null,
      marca: null,
      material: null,
      peso: null,
      medidas: null
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
    try {
      this.productos = await this.productosService.getProductos();
      
      // Validar y corregir stocks negativos
      const productosConStockCero: string[] = [];
      
      for (const producto of this.productos) {
        // Corregir stock negativo
        if (producto.stock_actual < 0) {
          console.warn(`Producto ${producto.nombre} tiene stock negativo (${producto.stock_actual}). Corrigiendo a 0.`);
          producto.stock_actual = 0;
        }
        
        // Detectar productos con stock cero
        if (producto.stock_actual === 0) {
          productosConStockCero.push(producto.nombre);
        }
        
        if (producto.id_producto) {
          try {
            const resumen = await this.comprasService.getResumenComprasPorProducto(producto.id_producto);
            this.resumenCompras.set(producto.id_producto, resumen);
          } catch (error) {
            console.error(`Error al cargar resumen de compras para producto ${producto.id_producto}:`, error);
            // Si hay error, inicializar con valores por defecto
            this.resumenCompras.set(producto.id_producto, {
              cantidad_total: 0,
              precio_unitario_promedio: producto.precio_compra || 0,
              precio_total_compra: 0
            });
          }
        }
      }
      
      // Agregar notificaciones para productos con stock cero
      if (productosConStockCero.length > 0) {
        productosConStockCero.forEach((nombreProducto, index) => {
          const producto = this.productos.find(p => p.nombre === nombreProducto);
          if (producto) {
            this.notificacionesService.agregarNotificacion({
              id: `stock-cero-cargar-${producto.id_producto || index}`,
              tipo: 'stock_agotado',
              titulo: 'Producto con Stock CERO',
              mensaje: `El producto "${nombreProducto}" tiene stock en CERO. No se podrán realizar ventas hasta que se reponga stock.`,
              producto: producto,
              fecha: new Date(),
              leida: false
            });
          }
        });
      }
      
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      this.filtrarProductos();
      this.loading = false;
    }
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
  // GENERAR CÓDIGO AUTOMÁTICO
  // ============================
  generarCodigo(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 10; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
  }

  // ============================
  // NUEVO
  // ============================
  nuevoProducto() {
    this.modoEdicion = false;
    this.mostrarFormulario = !this.mostrarFormulario;
    this.producto = this.getEmptyProducto();
    // Generar código automáticamente solo para productos nuevos
    if (!this.modoEdicion) {
      this.producto.codigo = this.generarCodigo();
    }
  }

  // ============================
  // EDITAR
  // ============================
  editarProducto(p: Producto) {
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.producto = { ...p };
    // Asegurar que el stock nunca sea negativo al editar
    if (this.producto.stock_actual < 0) {
      this.producto.stock_actual = 0;
    }
  }

  // ============================
  // VALIDAR STOCK
  // ============================
  validarStock() {
    // Asegurar que el stock nunca sea negativo
    if (this.producto.stock_actual < 0) {
      this.producto.stock_actual = 0;
      this.notificacionesService.agregarNotificacion({
        id: `stock-negativo-${Date.now()}`,
        tipo: 'error',
        titulo: 'Stock Negativo Corregido',
        mensaje: `El stock de "${this.producto.nombre || 'producto'}" no puede ser negativo. Se ha ajustado a 0.`,
        producto: this.producto,
        fecha: new Date(),
        leida: false
      });
    }
    
    // Notificación cuando el stock llega a cero
    if (this.producto.stock_actual === 0 && this.producto.nombre) {
      this.notificacionesService.agregarNotificacion({
        id: `stock-cero-${this.producto.id_producto || Date.now()}`,
        tipo: 'stock_agotado',
        titulo: 'Stock en CERO',
        mensaje: `El producto "${this.producto.nombre}" tiene stock en CERO. No se podrán realizar ventas hasta que se reponga stock.`,
        producto: this.producto,
        fecha: new Date(),
        leida: false
      });
    }
  }

  // ============================
  // PREPARAR DATOS PARA SUPABASE
  // ============================
  prepararDatosParaSupabase(producto: Producto): any {
    // Validar que stock_actual nunca sea negativo
    const stockActual = Math.max(0, producto.stock_actual || 0);
    
    const datos: any = {
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || null,
      id_categoria: producto.id_categoria,
      id_proveedor: producto.id_proveedor,
      unidad_medida: producto.unidad_medida,
      stock_actual: stockActual,
      stock_minimo: 0,
      precio_unitario: producto.precio_unitario,
      precio_mayor: producto.precio_mayor || null,
      tiene_caducidad: producto.tiene_caducidad,
      fecha_vencimiento: producto.fecha_vencimiento || null,
      tiene_garantia: producto.tiene_garantia,
      meses_garantia: producto.meses_garantia || null
    };

    // Campos nuevos que van a Supabase
    if (producto.precio_compra !== null && producto.precio_compra !== undefined) {
      datos.precio_compra = producto.precio_compra; // Va a Supabase
    } else {
      datos.precio_compra = null;
    }
    if (producto.marca) {
      datos.marca = producto.marca; // Va a Supabase
    }

    return datos;
  }

  // ============================
  // GUARDAR
  // ============================
  async guardarProducto() {
    try {
      // Validar que el stock no sea negativo
      if (this.producto.stock_actual < 0) {
        this.producto.stock_actual = 0;
        this.notificacionesService.agregarNotificacion({
          id: `stock-negativo-guardar-${Date.now()}`,
          tipo: 'error',
          titulo: 'Stock Negativo Corregido',
          mensaje: `El stock de "${this.producto.nombre || 'producto'}" no puede ser negativo. Se ha ajustado a 0.`,
          producto: this.producto,
          fecha: new Date(),
          leida: false
        });
      }

      // Notificación cuando el stock es cero
      if (this.producto.stock_actual === 0) {
        this.notificacionesService.agregarNotificacion({
          id: `stock-cero-guardar-${this.producto.id_producto || Date.now()}`,
          tipo: 'stock_agotado',
          titulo: 'Producto con Stock CERO',
          mensaje: `El producto "${this.producto.nombre}" se guardará con stock en CERO. No se podrán realizar ventas hasta que se reponga stock.`,
          producto: this.producto,
          fecha: new Date(),
          leida: false
        });
      }

      // Generar código automáticamente si no existe (solo para productos nuevos)
      if (!this.modoEdicion && (!this.producto.codigo || this.producto.codigo.trim() === '')) {
        this.producto.codigo = this.generarCodigo();
      }

      // Preparar datos solo con campos que existen en Supabase
      const datosParaGuardar = this.prepararDatosParaSupabase(this.producto);

      if (this.modoEdicion && this.producto.id_producto) {
        await this.productosService.updateProducto(this.producto.id_producto, datosParaGuardar);
        this.notificacionesService.agregarNotificacion({
          id: `producto-actualizado-${Date.now()}`,
          tipo: 'info',
          titulo: 'Producto Actualizado',
          mensaje: `El producto "${this.producto.nombre}" ha sido actualizado correctamente.`,
          producto: this.producto,
          fecha: new Date(),
          leida: false
        });
      } else {
        await this.productosService.addProducto(datosParaGuardar);
        this.notificacionesService.agregarNotificacion({
          id: `producto-creado-${Date.now()}`,
          tipo: 'info',
          titulo: 'Producto Creado',
          mensaje: `El producto "${this.producto.nombre}" ha sido creado correctamente.`,
          producto: this.producto,
          fecha: new Date(),
          leida: false
        });
      }

      this.producto = this.getEmptyProducto();
      this.modoEdicion = false;
      this.mostrarFormulario = false;
      this.cargarProductos();

    } catch (err) {
      console.error(err);
      alert('Error al guardar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  }

  // ============================
  // ELIMINAR
  // ============================
  async eliminarProducto(id: number) {
    const producto = this.productos.find(p => p.id_producto === id);
    const nombreProducto = producto?.nombre || 'producto';
    
    if (!confirm(`¿Deseas eliminar el producto "${nombreProducto}"?`)) return;

    try {
      await this.productosService.deleteProducto(id);
      this.notificacionesService.agregarNotificacion({
        id: `producto-eliminado-${Date.now()}`,
        tipo: 'info',
        titulo: 'Producto Eliminado',
        mensaje: `El producto "${nombreProducto}" ha sido eliminado correctamente.`,
        producto: producto,
        fecha: new Date(),
        leida: false
      });
      this.cargarProductos();
    } catch (err: any) {
      let mensajeError = 'Error desconocido al eliminar el producto';
      
      if (err?.message) {
        if (err.message.includes('foreign key') || 
            err.message.includes('violates foreign key') ||
            err.message.includes('still referenced') ||
            err.message.includes('constraint')) {
          mensajeError = `No se puede eliminar el producto "${nombreProducto}" porque está siendo utilizado en ventas o compras registradas. Para eliminarlo, primero debes eliminar o modificar esos registros en Supabase.`;
        } else {
          mensajeError = err.message;
        }
      }
      
      console.error('Error al eliminar producto:', err);
      
      this.notificacionesService.agregarNotificacion({
        id: `error-eliminar-${Date.now()}`,
        tipo: 'error',
        titulo: 'Error al Eliminar Producto',
        mensaje: mensajeError,
        producto: producto,
        fecha: new Date(),
        leida: false
      });
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

  // ============================
  // OBTENER STOCK ACTUAL (siempre positivo)
  // ============================
  getStockActual(p: Producto): number {
    return Math.max(0, p.stock_actual || 0);
  }

  // ============================
  // CALCULAR TOTALES
  // ============================
  getTotalStock(): number {
    return this.productos.reduce((sum, p) => sum + Math.max(0, p.stock_actual || 0), 0);
  }

  getCapitalInvertido(): number {
    return this.productos.reduce((sum, p) => {
      const precio = Math.max(0, p.precio_compra || 0);
      const stock = Math.max(0, p.stock_actual || 0);
      return sum + (precio * stock);
    }, 0);
  }

  getValorVenta(): number {
    return this.productos.reduce((sum, p) => {
      const precio = Math.max(0, p.precio_unitario || 0);
      const stock = Math.max(0, p.stock_actual || 0);
      return sum + (precio * stock);
    }, 0);
  }

  // ============================
  // CALCULAR VALOR TOTAL DEL PRODUCTO (precio * stock)
  // ============================
  getValorTotalProducto(producto: Producto): number {
    return (producto.precio_unitario || 0) * (producto.stock_actual || 0);
  }

  // ============================
  // OBTENER RESUMEN DE COMPRAS
  // ============================
  getResumenCompras(id_producto?: number): { cantidad_total: number; precio_unitario_promedio: number; precio_total_compra: number } {
    if (!id_producto) {
      return { cantidad_total: 0, precio_unitario_promedio: 0, precio_total_compra: 0 };
    }
    return this.resumenCompras.get(id_producto) || { cantidad_total: 0, precio_unitario_promedio: 0, precio_total_compra: 0 };
  }

  // ============================
  // BLOQUE COMPRA - Funciones para mostrar datos de compras históricas
  // ============================

  getIngresoComprado(p: Producto): number {
    const r = this.getResumenCompras(p.id_producto);
    if (r.cantidad_total > 0) {
      return Math.max(0, r.cantidad_total);
    }
    // Si no hay compras, usar stock_actual pero asegurar que nunca sea negativo
    const stock = Math.max(0, p.stock_actual || 0);
    return stock;
  }

  getPrecioCompraPromedio(p: Producto): number {
    const r = this.getResumenCompras(p.id_producto);
    if (r.precio_unitario_promedio > 0) {
      return Math.max(0, r.precio_unitario_promedio);
    }
    return Math.max(0, p.precio_compra || 0);
  }

  getTotalCompraHistorica(p: Producto): number {
    const r = this.getResumenCompras(p.id_producto);
    if (r.precio_total_compra > 0) {
      return Math.max(0, r.precio_total_compra);
    }
    const ingreso = this.getIngresoComprado(p);
    const precio = this.getPrecioCompraPromedio(p);
    return Math.max(0, ingreso * precio);
  }

  // ============================
  // BLOQUE VENTA
  // ============================

  getTotalVentaNormal(p: Producto): number {
    const precio = Math.max(0, p.precio_unitario || 0);
    const stock = Math.max(0, p.stock_actual || 0);
    return precio * stock;
  }

  getTotalVentaMayor(p: Producto): number {
    const precio = Math.max(0, p.precio_mayor || 0);
    const stock = Math.max(0, p.stock_actual || 0);
    return precio * stock;
  }

  // ============================
  // MARGEN POTENCIAL
  // ============================

  getCostoStockActual(p: Producto): number {
    const precio = this.getPrecioCompraPromedio(p);
    const stock = Math.max(0, p.stock_actual || 0);
    return Math.max(0, precio * stock);
  }

  getMargenPotencialNormal(p: Producto): number {
    const venta = this.getTotalVentaNormal(p);
    const costo = this.getCostoStockActual(p);
    return venta - costo;
  }

  getMargenPotencialMayor(p: Producto): number {
    const venta = this.getTotalVentaMayor(p);
    const costo = this.getCostoStockActual(p);
    return venta - costo;
  }
}
