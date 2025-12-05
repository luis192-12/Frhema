import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  mostrarModalMovimientoStock = false;
  productoMovimientoStock: Producto | null = null;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' = 'ENTRADA';
  cantidadMovimiento: number = 0;
  motivoMovimiento: string = '';
  referenciaMovimiento: string = '';
  producto: Producto = this.getEmptyProducto();

  // Unidades de medida predefinidas
  unidadesMedida: string[] = ['UND', 'M', 'KG', 'CAJA', 'L', 'M2', 'M3', 'PAR', 'SET', 'ROLLO', 'BOLSA', 'LITRO', 'GALON'];
  resumenCompras: Map<number, { cantidad_total: number; precio_unitario_promedio: number; precio_total_compra: number }> = new Map();

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private proveedoresService: ProveedoresService,
    private comprasService: ComprasService,
    private notificacionesService: NotificacionesService,
    private cdr: ChangeDetectorRef
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
      medidas: null,
      activo: true // Por defecto activo
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
      // Cargar todos los productos (incluyendo suspendidos) para mostrar en la tabla
      this.productos = await this.productosService.getProductos(true);
      
      // Validar y corregir stocks negativos
      const productosConStockCero: string[] = [];
      
      for (const producto of this.productos) {
        // Corregir stock negativo
        if (producto.stock_actual < 0) {
          console.warn(`Producto ${producto.nombre} tiene stock negativo (${producto.stock_actual}). Corrigiendo a 0.`);
          producto.stock_actual = 0;
        }
        
        // Normalizar campo activo: si es null o undefined, tratarlo como true por defecto
        // PERO si el stock es cero, debe ser false
        const stockActual = producto.stock_actual || 0;
        
        // Si el campo activo no existe o es null/undefined, determinar su valor basado en el stock
        if (producto.activo === null || producto.activo === undefined) {
          // Si no existe el campo, determinar el estado basado en el stock
          producto.activo = stockActual > 0 ? true : false;
          console.log(`Producto "${producto.nombre}": campo 'activo' no existe, establecido a ${producto.activo} basado en stock ${stockActual}`);
        }
        
        // SUSPENSIÓN AUTOMÁTICA: Si el producto tiene stock cero y está activo, suspenderlo automáticamente
        if (stockActual === 0 && producto.activo === true && producto.id_producto) {
          console.log(`[SUSPENSIÓN AUTOMÁTICA] Producto "${producto.nombre}" tiene stock ${stockActual} y está activo. Suspendiéndolo...`);
          try {
            // Intentar actualizar en Supabase
            await this.productosService.updateProducto(producto.id_producto, { activo: false });
            producto.activo = false;
            console.log(`✅ Producto "${producto.nombre}" suspendido automáticamente por stock cero`);
          } catch (error: any) {
            // Si el error es porque el campo no existe, solo actualizar localmente
            if (error?.message && (error.message.includes('column') || error.message.includes('activo') || error.message.includes('does not exist'))) {
              console.warn(`⚠️ Campo 'activo' no existe en Supabase. Actualizando solo localmente. Ejecuta el SQL para agregar el campo.`);
              producto.activo = false; // Actualizar localmente
            } else {
              console.error(`❌ Error al suspender producto ${producto.id_producto}:`, error);
            }
          }
        }
        
        // REACTIVACIÓN AUTOMÁTICA: Si el producto tiene stock > 0 y está suspendido, reactivarlo
        if (stockActual > 0 && producto.activo === false && producto.id_producto) {
          console.log(`[REACTIVACIÓN AUTOMÁTICA] Producto "${producto.nombre}" tiene stock ${stockActual} y está suspendido. Reactivándolo...`);
          try {
            // Intentar actualizar en Supabase
            await this.productosService.updateProducto(producto.id_producto, { activo: true });
            producto.activo = true;
            console.log(`✅ Producto "${producto.nombre}" reactivado automáticamente por tener stock`);
          } catch (error: any) {
            // Si el error es porque el campo no existe, solo actualizar localmente
            if (error?.message && (error.message.includes('column') || error.message.includes('activo') || error.message.includes('does not exist'))) {
              console.warn(`⚠️ Campo 'activo' no existe en Supabase. Actualizando solo localmente. Ejecuta el SQL para agregar el campo.`);
              producto.activo = true; // Actualizar localmente
            } else {
              console.error(`❌ Error al reactivar producto ${producto.id_producto}:`, error);
            }
          }
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
    // Cerrar el modal de movimiento de stock si está abierto
    this.mostrarModalMovimientoStock = false;
    this.productoMovimientoStock = null;
    // Abrir el modal de editar
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.producto = { ...p };
    // Asegurar que el stock nunca sea negativo al editar
    if (this.producto.stock_actual < 0) {
      this.producto.stock_actual = 0;
    }
  }

  // ============================
  // MOVIMIENTO DE STOCK (KARDEX)
  // ============================
  abrirModalMovimientoStock(producto: Producto) {
    console.log('Abriendo modal movimiento stock para:', producto.nombre);
    // Cerrar el modal de editar si está abierto
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    // Abrir el modal de movimiento de stock
    this.productoMovimientoStock = { ...producto };
    this.tipoMovimiento = 'ENTRADA';
    this.cantidadMovimiento = 0;
    this.motivoMovimiento = '';
    this.referenciaMovimiento = '';
    this.mostrarModalMovimientoStock = true;
    this.cdr.detectChanges(); // Forzar detección de cambios
    console.log('Modal movimiento stock:', {
      mostrar: this.mostrarModalMovimientoStock,
      producto: this.productoMovimientoStock?.nombre,
      tieneProducto: !!this.productoMovimientoStock
    });
  }

  cerrarModalMovimientoStock() {
    this.mostrarModalMovimientoStock = false;
    this.productoMovimientoStock = null;
    this.tipoMovimiento = 'ENTRADA';
    this.cantidadMovimiento = 0;
    this.motivoMovimiento = '';
    this.referenciaMovimiento = '';
  }

  // Método auxiliar para cálculos en el template
  calcularNuevoStockMovimiento(): number {
    if (!this.productoMovimientoStock) return 0;
    const stockActual = this.productoMovimientoStock.stock_actual || 0;
    const cantidad = this.cantidadMovimiento || 0;

    if (this.tipoMovimiento === 'ENTRADA') {
      return stockActual + cantidad;
    } else if (this.tipoMovimiento === 'SALIDA') {
      return Math.max(0, stockActual - cantidad);
    } else {
      // AJUSTE: establece el stock directamente
      return cantidad;
    }
  }

  async guardarMovimientoStock() {
    if (!this.productoMovimientoStock || !this.productoMovimientoStock.id_producto) return;

    if (this.cantidadMovimiento <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      const stockAntes = this.productoMovimientoStock.stock_actual || 0;
      let nuevoStock = stockAntes;
      let cantidadDelta = this.cantidadMovimiento;

      // Calcular el nuevo stock según el tipo de movimiento
      if (this.tipoMovimiento === 'ENTRADA') {
        nuevoStock = stockAntes + cantidadDelta;
      } else if (this.tipoMovimiento === 'SALIDA') {
        nuevoStock = Math.max(0, stockAntes - cantidadDelta);
        cantidadDelta = -cantidadDelta; // Negativo para salida
      } else {
        // AJUSTE: establece el stock directamente
        nuevoStock = cantidadDelta;
        cantidadDelta = cantidadDelta - stockAntes; // Delta real
      }

      // Asegurar que el stock no sea negativo
      nuevoStock = Math.max(0, nuevoStock);

      // 1. Actualizar stock en el producto
      await this.productosService.updateProducto(this.productoMovimientoStock.id_producto, { 
        stock_actual: nuevoStock 
      });

      // 2. Registrar movimiento en movimientos_stock (kardex)
      const { data: movimientoData, error: movimientoError } = await this.productosService.registrarMovimientoStock({
        id_producto: this.productoMovimientoStock.id_producto,
        tipo: this.tipoMovimiento,
        cantidad: Math.abs(cantidadDelta), // Siempre positivo en la BD
        stock_antes: stockAntes,
        stock_despues: nuevoStock,
        referencia: this.referenciaMovimiento || (this.motivoMovimiento ? `Ajuste: ${this.motivoMovimiento}` : 'Movimiento manual')
      });

      if (movimientoError) {
        console.error('Error al registrar movimiento:', movimientoError);
        // Continuar aunque falle el registro del movimiento
      }

      // 3. Actualizar el producto en la lista local
      const productoEnLista = this.productos.find(p => p.id_producto === this.productoMovimientoStock!.id_producto);
      if (productoEnLista && productoEnLista.id_producto) {
        productoEnLista.stock_actual = nuevoStock;
        
        // Si el stock es cero, suspender automáticamente
        if (nuevoStock === 0 && productoEnLista.activo !== false) {
          try {
            if (productoEnLista.id_producto) {
              await this.productosService.updateProducto(productoEnLista.id_producto, { activo: false });
              productoEnLista.activo = false;
            }
          } catch (error: any) {
            if (error?.message && (error.message.includes('column') || error.message.includes('activo'))) {
              productoEnLista.activo = false;
            }
          }
        } else if (nuevoStock > 0 && productoEnLista.activo === false) {
          // Si el stock > 0 y está suspendido, reactivarlo
          try {
            if (productoEnLista.id_producto) {
              await this.productosService.updateProducto(productoEnLista.id_producto, { activo: true });
              productoEnLista.activo = true;
            }
          } catch (error: any) {
            if (error?.message && (error.message.includes('column') || error.message.includes('activo'))) {
              productoEnLista.activo = true;
            }
          }
        }
      }

      const tipoTexto = this.tipoMovimiento === 'ENTRADA' ? 'entrada' : 
                       this.tipoMovimiento === 'SALIDA' ? 'salida' : 'ajuste';
      
      this.notificacionesService.agregarNotificacion({
        id: `movimiento-stock-${this.productoMovimientoStock.id_producto}-${Date.now()}`,
        tipo: 'info',
        titulo: 'Movimiento de Stock Registrado',
        mensaje: `Se registró una ${tipoTexto} de ${this.cantidadMovimiento} unidades para "${this.productoMovimientoStock.nombre}". Stock: ${stockAntes} → ${nuevoStock}`,
        producto: this.productoMovimientoStock,
        fecha: new Date(),
        leida: false
      });

      this.cerrarModalMovimientoStock();
      this.filtrarProductos();

    } catch (err) {
      console.error(err);
      alert('Error al registrar movimiento de stock: ' + (err instanceof Error ? err.message : 'Error desconocido'));
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
  // Este método prepara los datos del producto antes de guardarlos en Supabase.
  // IMPORTANTE: El campo 'activo' se calcula automáticamente basado en el stock:
  // - Si stock_actual > 0 → activo = true (producto disponible)
  // - Si stock_actual = 0 → activo = false (producto suspendido automáticamente)
  // Este campo reemplaza la funcionalidad de "eliminar" producto, ahora se suspenden en lugar de eliminarse.
  prepararDatosParaSupabase(producto: Producto): any {
    // Validar que stock_actual nunca sea negativo
    const stockActual = Math.max(0, producto.stock_actual || 0);
    
    // SUSPENSIÓN AUTOMÁTICA: Si stock es cero, suspender automáticamente
    // REACTIVACIÓN AUTOMÁTICA: Si stock > 0, activar automáticamente
    // Este campo 'activo' es un BOOLEAN que debe existir en la tabla 'productos' de Supabase
    const activo = stockActual > 0 ? true : false;
    
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
      meses_garantia: producto.meses_garantia || null,
      activo: activo // Campo BOOLEAN: true = activo/disponible, false = suspendido/no disponible
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

      // Notificación cuando el stock es cero (se suspenderá automáticamente)
      if (this.producto.stock_actual === 0) {
        this.notificacionesService.agregarNotificacion({
          id: `stock-cero-guardar-${this.producto.id_producto || Date.now()}`,
          tipo: 'stock_agotado',
          titulo: 'Producto Suspendido Automáticamente',
          mensaje: `El producto "${this.producto.nombre}" ha sido suspendido automáticamente por tener stock en CERO. Se reactivará cuando se actualice el stock.`,
          producto: this.producto,
          fecha: new Date(),
          leida: false
        });
      } else if (this.producto.stock_actual > 0 && this.producto.id_producto) {
        // Notificar reactivación si el producto estaba suspendido y ahora tiene stock
        const productoAnterior = this.productos.find(p => p.id_producto === this.producto.id_producto);
        if (productoAnterior && productoAnterior.activo === false) {
          this.notificacionesService.agregarNotificacion({
            id: `producto-reactivado-${this.producto.id_producto}`,
            tipo: 'info',
            titulo: 'Producto Reactivado',
            mensaje: `El producto "${this.producto.nombre}" ha sido reactivado automáticamente al actualizar el stock.`,
            producto: this.producto,
            fecha: new Date(),
            leida: false
          });
        }
      }

      // Generar código automáticamente si no existe (solo para productos nuevos)
      if (!this.modoEdicion && (!this.producto.codigo || this.producto.codigo.trim() === '')) {
        this.producto.codigo = this.generarCodigo();
      }

      // Preparar datos solo con campos que existen en Supabase
      const datosParaGuardar = this.prepararDatosParaSupabase(this.producto);

      try {
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
      } catch (err: any) {
        // Si el error es porque el campo 'activo' no existe, intentar guardar sin ese campo
        if (err?.message && (err.message.includes('column') || err.message.includes('activo') || err.message.includes('does not exist'))) {
          console.warn('Campo "activo" no existe en Supabase. Guardando sin ese campo...');
          // Eliminar el campo activo de los datos y volver a intentar
          const datosSinActivo = { ...datosParaGuardar };
          delete datosSinActivo.activo;
          
          if (this.modoEdicion && this.producto.id_producto) {
            await this.productosService.updateProducto(this.producto.id_producto, datosSinActivo);
            this.notificacionesService.agregarNotificacion({
              id: `producto-actualizado-sin-activo-${Date.now()}`,
              tipo: 'warning',
              titulo: 'Producto Actualizado (sin campo activo)',
              mensaje: `El producto "${this.producto.nombre}" se guardó correctamente, pero el campo 'activo' no existe en Supabase. Ejecuta el SQL para agregarlo.`,
              producto: this.producto,
              fecha: new Date(),
              leida: false
            });
          } else {
            await this.productosService.addProducto(datosSinActivo);
            this.notificacionesService.agregarNotificacion({
              id: `producto-creado-sin-activo-${Date.now()}`,
              tipo: 'warning',
              titulo: 'Producto Creado (sin campo activo)',
              mensaje: `El producto "${this.producto.nombre}" se creó correctamente, pero el campo 'activo' no existe en Supabase. Ejecuta el SQL para agregarlo.`,
              producto: this.producto,
              fecha: new Date(),
              leida: false
            });
          }
        } else {
          // Si es otro error, lanzarlo
          throw err;
        }
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
  // SUSPENDER/ACTIVAR PRODUCTO
  // ============================
  async cambiarEstadoProducto(producto: Producto) {
    if (!producto.id_producto) return;
    
    const nuevoEstado = !producto.activo;
    const accion = nuevoEstado ? 'activar' : 'suspender';
    
    // No pedir confirmación, cambiar directamente con el toggle
    try {
      await this.productosService.updateProducto(producto.id_producto, { activo: nuevoEstado });
      
      // Actualizar estado local
      producto.activo = nuevoEstado;
      
      this.notificacionesService.agregarNotificacion({
        id: `producto-${accion}-${producto.id_producto}-${Date.now()}`,
        tipo: nuevoEstado ? 'info' : 'warning',
        titulo: nuevoEstado ? 'Producto Activado' : 'Producto Suspendido',
        mensaje: `El producto "${producto.nombre}" ha sido ${nuevoEstado ? 'activado' : 'suspendido'} ${nuevoEstado ? 'y ahora está disponible para ventas' : 'y no aparecerá en el POS'}.`,
        producto: producto,
        fecha: new Date(),
        leida: false
      });
      
    } catch (err: any) {
      console.error(err);
      
      // Si el error es porque el campo no existe, mostrar mensaje específico
      if (err?.message && (err.message.includes('column') || err.message.includes('activo') || err.message.includes('does not exist'))) {
        // Actualizar localmente aunque falle en Supabase
        producto.activo = nuevoEstado;
        this.notificacionesService.agregarNotificacion({
          id: `producto-${accion}-local-${producto.id_producto}-${Date.now()}`,
          tipo: 'warning',
          titulo: 'Campo "activo" no existe en Supabase',
          mensaje: `El campo 'activo' no existe en la base de datos. El estado se actualizó solo localmente. Por favor, ejecuta el SQL para agregar el campo 'activo' a la tabla 'productos'.`,
          producto: producto,
          fecha: new Date(),
          leida: false
        });
      } else {
        // Revertir el estado si hay otro tipo de error
        producto.activo = !nuevoEstado;
        alert(`Error al ${accion} el producto: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
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
