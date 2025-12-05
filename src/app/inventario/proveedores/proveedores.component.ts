/*
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedoresService } from '../../core/services/inventario/proveedores.service';
import { Proveedor } from '../../core/models/proveedor.model';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html'
})
export class ProveedoresComponent implements OnInit {

  /**
   * ✅ NUEVO (para Supabase / BD):
   * Vamos a agregar estos campos a la tabla `proveedores` para conectar todo lo nuevo del UI:
   * - tipo_documento (text)      -> proveedor.tipoDocumento
   * - numero_documento (text)    -> proveedor.numeroDocumento
   * - correo (text)              -> proveedor.correo
   * - activo (bool) default true -> proveedor.activo (estado ON/OFF de la tabla)
   *
   * (Opcional si quieres búsqueda DNI/RUC real)
   * - fuente_consulta (text) -> 'manual' | 'dni' | 'ruc' (solo si deseas auditar cómo se creó)
   

  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  loading = true;

  terminoBusqueda = '';

  // Modal
  mostrarFormulario = false;
  editando = false;

  // Tabs: manual / dni / ruc
  modoBusqueda: 'manual' | 'dni' | 'ruc' = 'manual';

  // DNI/RUC search
  numeroDocumentoBusqueda = '';
  cargandoBusqueda = false;

  // Form actual (para crear/editar)
  proveedorActual: Proveedor = this.getEmptyProveedor();

  constructor(private proveedoresService: ProveedoresService) {}

  ngOnInit() {
    this.cargarProveedores();
  }

  // 🔧 modelo vacío con CAMPOS NUEVOS
  getEmptyProveedor(): Proveedor {
    return {
      id_proveedor: undefined,

      nombre: '',
      contacto: '',
      telefono: '',
      direccion: '',

      // ✅ Nuevos:
      tipoDocumento: '',
      numeroDocumento: '',
      correo: '',
      activo: true,
    };
  }

  // ============================
  // LISTAR
  // ============================
  async cargarProveedores() {
    this.loading = true;
    try {
      this.proveedores = await this.proveedoresService.getProveedores();

      // Por si la BD trae null, lo normalizamos para UI
      this.proveedores = (this.proveedores || []).map(p => ({
        ...p,
        activo: (p as any).activo ?? true,
        tipoDocumento: (p as any).tipoDocumento ?? '',
        numeroDocumento: (p as any).numeroDocumento ?? '',
        correo: (p as any).correo ?? ''
      }));

      this.filtrarProveedores();
    } finally {
      this.loading = false;
    }
  }

  filtrarProveedores() {
    const t = this.terminoBusqueda.trim().toLowerCase();

    if (!t) {
      this.proveedoresFiltrados = this.proveedores;
      return;
    }

    this.proveedoresFiltrados = this.proveedores.filter(p => {
      const nombre = (p.nombre || '').toLowerCase();
      const contacto = (p.contacto || '').toLowerCase();
      const telefono = (p.telefono || '').toLowerCase();
      const direccion = (p.direccion || '').toLowerCase();

      // ✅ Nuevos:
      const tipoDoc = ((p as any).tipoDocumento || '').toLowerCase();
      const numDoc = ((p as any).numeroDocumento || '').toLowerCase();
      const correo = ((p as any).correo || '').toLowerCase();

      return (
        nombre.includes(t) ||
        contacto.includes(t) ||
        telefono.includes(t) ||
        direccion.includes(t) ||
        tipoDoc.includes(t) ||
        numDoc.includes(t) ||
        correo.includes(t)
      );
    });
  }

  // ============================
  // UI: ABRIR/CERRAR MODAL
  // ============================
  nuevo() {
    // abre modal en modo crear
    this.editando = false;
    this.mostrarFormulario = true;
    this.modoBusqueda = 'manual';
    this.numeroDocumentoBusqueda = '';
    this.proveedorActual = this.getEmptyProveedor();
  }

  editar(p: Proveedor) {
    this.editando = true;
    this.mostrarFormulario = true;
    this.modoBusqueda = 'manual';
    this.numeroDocumentoBusqueda = '';
    // Guardamos una copia del proveedor original para poder restaurar si se cancela
    this.proveedorActual = { ...p };
  }

  cerrarModal(event: MouseEvent) {
    // si tocó fuera del modal (backdrop), cierra
    if ((event.target as HTMLElement)?.classList?.contains('fixed')) {
      this.cerrarModalDirecto();
    }
  }

  cerrarModalDirecto() {
    // Cierra el modal sin guardar cambios
    this.mostrarFormulario = false;
    this.editando = false;
    this.modoBusqueda = 'manual';
    this.numeroDocumentoBusqueda = '';
    this.proveedorActual = this.getEmptyProveedor();
  }

  // ============================
  // BUSCAR DNI / RUC (UI)
  // ============================
  async buscarDocumento() {
    const doc = (this.numeroDocumentoBusqueda || '').trim();

    // validación rápida
    if (this.modoBusqueda === 'dni' && doc.length !== 8) {
      alert('El DNI debe tener 8 dígitos.');
      return;
    }
    if (this.modoBusqueda === 'ruc' && doc.length !== 11) {
      alert('El RUC debe tener 11 dígitos.');
      return;
    }

    this.cargandoBusqueda = true;
    try {
      // ✅ Aquí lo conectaremos luego (RENIEC/SUNAT o tu API intermedia)
      // Por ahora solo auto-llenamos el tipo/numero para que el flujo funcione.
      this.proveedorActual.tipoDocumento = this.modoBusqueda.toUpperCase() as any; // DNI/RUC
      this.proveedorActual.numeroDocumento = doc;

      // Placeholder: si quieres, luego rellenamos proveedorActual.nombre/direccion etc.
      // this.proveedorActual.nombre = resultado.nombre;
      // this.proveedorActual.direccion = resultado.direccion;

    } catch (e) {
      console.error(e);
      alert('No se pudo buscar el documento.');
    } finally {
      this.cargandoBusqueda = false;
    }
  }

  // ============================
  // GUARDAR
  // ============================
  async guardar() {
    try {
      // validaciones mínimas
      if (!this.proveedorActual.nombre?.trim()) {
        alert('El nombre es obligatorio.');
        return;
      }
      if (!this.proveedorActual.tipoDocumento?.trim()) {
        alert('El tipo de documento es obligatorio.');
        return;
      }
      if (!this.proveedorActual.numeroDocumento?.trim()) {
        alert('El número de documento es obligatorio.');
        return;
      }

      if (this.editando && this.proveedorActual.id_proveedor) {
        await this.proveedoresService.updateProveedor(
          this.proveedorActual.id_proveedor,
          this.proveedorActual
        );
        alert('Proveedor actualizado');
      } else {
        await this.proveedoresService.addProveedor(this.proveedorActual);
        alert('Proveedor registrado');
      }

      this.cerrarModalDirecto();
      await this.cargarProveedores();

    } catch (err) {
      console.error(err);
      alert('Error al guardar');
    }
  }

  // ============================
  // ELIMINAR
  // ============================
  async eliminar(p: Proveedor) {
    const id = p.id_proveedor;
    if (!id) return;

    if (!confirm('¿Eliminar proveedor?')) return;

    try {
      await this.proveedoresService.deleteProveedor(id);
      await this.cargarProveedores();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  }

  // ============================
  // ESTADO ACTIVO (switch)
  // ============================
  async cambiarEstado(p: Proveedor, value: boolean) {
    const id = p.id_proveedor;
    if (!id) return;

    // update optimista en UI
    const prev = (p as any).activo;
    (p as any).activo = value;

    try {
      // ✅ se requiere campo `activo` en Supabase
      await this.proveedoresService.updateProveedor(id, { ...(p as any), activo: value });
    } catch (e) {
      console.error(e);
      (p as any).activo = prev; // rollback
      alert('No se pudo cambiar el estado.');
    }
  }

  // (si tu UI aún llama este método)
  exportarExcel() {
    // lo dejas como lo tengas en tu proyecto
    console.log('Exportar Excel (pendiente o existente)');
  }
}
*/
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedoresService } from '../../core/services/inventario/proveedores.service';
import { Proveedor } from '../../core/models/proveedor.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html'
})
export class ProveedoresComponent implements OnInit {

  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  loading = true;

  terminoBusqueda = '';

  mostrarFormulario = false;
  editando = false;

  modoBusqueda: 'manual' | 'dni' | 'ruc' = 'manual';
  numeroDocumentoBusqueda = '';
  cargandoBusqueda = false;

  proveedorActual: Proveedor = this.getEmptyProveedor();

  constructor(private proveedoresService: ProveedoresService) {}

  ngOnInit() {
    this.cargarProveedores();
  }

  getEmptyProveedor(): Proveedor {
    return {
      nombre: '',
      contacto: '',
      telefono: '',
      direccion: '',

      // Campos nuevos en snake_case
      tipo_documento: '',
      numero_documento: '',
      correo: '',
      activo: true
    };
  }

  async cargarProveedores() {
    this.loading = true;

    try {
      this.proveedores = await this.proveedoresService.getProveedores();

      // Normalizar campos (si vienen null)
      this.proveedores = this.proveedores.map(p => ({
        ...p,
        activo: p.activo ?? true,
        tipo_documento: p.tipo_documento ?? '',
        numero_documento: p.numero_documento ?? '',
        correo: p.correo ?? ''
      }));

      this.filtrarProveedores();

    } finally {
      this.loading = false;
    }
  }

  filtrarProveedores() {
    const t = this.terminoBusqueda.trim().toLowerCase();

    if (!t) {
      this.proveedoresFiltrados = this.proveedores;
      return;
    }

    this.proveedoresFiltrados = this.proveedores.filter(p =>
      (p.nombre || '').toLowerCase().includes(t) ||
      (p.contacto || '').toLowerCase().includes(t) ||
      (p.telefono || '').toLowerCase().includes(t) ||
      (p.direccion || '').toLowerCase().includes(t) ||
      (p.tipo_documento || '').toLowerCase().includes(t) ||
      (p.numero_documento || '').toLowerCase().includes(t) ||
      (p.correo || '').toLowerCase().includes(t)
    );
  }

  nuevo() {
    this.editando = false;
    this.mostrarFormulario = true;
    this.modoBusqueda = 'manual';
    this.numeroDocumentoBusqueda = '';
    this.proveedorActual = this.getEmptyProveedor();
  }

  editar(p: Proveedor) {
    this.editando = true;
    this.mostrarFormulario = true;
    this.modoBusqueda = 'manual';
    this.numeroDocumentoBusqueda = '';
    this.proveedorActual = { ...p };
  }

  cerrarModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.cerrarModalDirecto();
    }
  }

  cerrarModalDirecto() {
    this.mostrarFormulario = false;
    this.editando = false;
    this.modoBusqueda = 'manual';
    this.numeroDocumentoBusqueda = '';
    this.proveedorActual = this.getEmptyProveedor();
  }

  async buscarDocumento() {
    const doc = this.numeroDocumentoBusqueda.trim();

    if (this.modoBusqueda === 'dni' && doc.length !== 8) {
      alert('El DNI debe tener 8 dígitos.');
      return;
    }
    if (this.modoBusqueda === 'ruc' && doc.length !== 11) {
      alert('El RUC debe tener 11 dígitos.');
      return;
    }

    this.cargandoBusqueda = true;
    try {
      this.proveedorActual.tipo_documento = this.modoBusqueda.toUpperCase();
      this.proveedorActual.numero_documento = doc;
    } finally {
      this.cargandoBusqueda = false;
    }
  }

  async guardar() {
    try {
      if (!this.proveedorActual.nombre?.trim()) {
        alert('El nombre es obligatorio.');
        return;
      }
      if (!this.proveedorActual.tipo_documento?.trim()) {
        alert('El tipo de documento es obligatorio.');
        return;
      }
      if (!this.proveedorActual.numero_documento?.trim()) {
        alert('El número de documento es obligatorio.');
        return;
      }

      if (this.editando && this.proveedorActual.id_proveedor) {
        await this.proveedoresService.updateProveedor(
          this.proveedorActual.id_proveedor,
          this.proveedorActual
        );
        alert('Proveedor actualizado');
      } else {
        await this.proveedoresService.addProveedor(this.proveedorActual);
        alert('Proveedor registrado');
      }

      this.cerrarModalDirecto();
      await this.cargarProveedores();

    } catch (err) {
      console.error(err);
      alert('Error al guardar');
    }
  }

  async eliminar(p: Proveedor) {
    if (!p.id_proveedor) return;
    if (!confirm('¿Eliminar proveedor?')) return;

    try {
      await this.proveedoresService.deleteProveedor(p.id_proveedor);
      await this.cargarProveedores();

    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  }

  async cambiarEstado(p: Proveedor, value: boolean) {
    if (!p.id_proveedor) return;

    const prev = p.activo;
    p.activo = value;

    try {
      await this.proveedoresService.updateProveedor(p.id_proveedor, { activo: value });
    } catch (e) {
      console.error(e);
      p.activo = prev;
      alert('No se pudo cambiar el estado.');
    }
  }
  exportarExcel() {
    try {
      if (this.proveedoresFiltrados.length === 0) {
        alert('No hay proveedores para exportar.');
        return;
      }

      // Preparar los datos para exportar
      const datosExportar = this.proveedoresFiltrados.map(p => ({
        'ID': p.id_proveedor || '',
        'Nombre': p.nombre || '',
        'Contacto': p.contacto || '',
        'Teléfono': p.telefono || '',
        'Dirección': p.direccion || '',
        'Tipo Documento': p.tipo_documento || '',
        'Número Documento': p.numero_documento || '',
        'Correo': p.correo || '',
        'Estado': p.activo !== false ? 'Activo' : 'Inactivo'
      }));

      // Preparar datos con metadatos incluidos
      const fechaExportacion = new Date().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Definir encabezados
      const encabezados = ['ID', 'Nombre', 'Contacto', 'Teléfono', 'Dirección', 'Tipo Documento', 'Número Documento', 'Correo', 'Estado'];

      // Crear array con metadatos y datos
      const datosCompletos: any[] = [
        ['REPORTE DE PROVEEDORES'],
        ['FERRETERÍA RHEMA'],
        [`Fecha de Exportación: ${fechaExportacion}`],
        [`Total de Registros: ${this.proveedoresFiltrados.length}`],
        [], // Fila vacía
        encabezados, // Encabezados
        ...datosExportar.map(p => [
          p['ID'],
          p['Nombre'],
          p['Contacto'],
          p['Teléfono'],
          p['Dirección'],
          p['Tipo Documento'],
          p['Número Documento'],
          p['Correo'],
          p['Estado']
        ]) // Datos
      ];

      // Crear el libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Crear la hoja de trabajo desde los datos completos
      const ws = XLSX.utils.aoa_to_sheet(datosCompletos);

      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 8 },   // ID
        { wch: 30 },  // Nombre
        { wch: 25 },  // Contacto
        { wch: 15 },  // Teléfono
        { wch: 40 },  // Dirección
        { wch: 18 },  // Tipo Documento
        { wch: 20 },  // Número Documento
        { wch: 30 },  // Correo
        { wch: 12 }   // Estado
      ];
      ws['!cols'] = columnWidths;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');

      // Generar el nombre del archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `proveedores_${fecha}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);

      alert(`Archivo Excel exportado correctamente: ${nombreArchivo}\n\nTotal de registros: ${this.proveedoresFiltrados.length}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar el archivo Excel. Por favor, intente nuevamente.');
    }
  }

}
