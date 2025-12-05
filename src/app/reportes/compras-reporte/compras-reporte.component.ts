import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../core/services/reportes/reportes.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-compras-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compras-reporte.component.html',
})
export class ComprasReporteComponent implements OnInit {

  desde: string = '';
  hasta: string = '';
  proveedorSeleccionado: number | null = null;

  proveedores: any[] = [];
  resultados: any[] = [];
  totalComprado: number = 0;

  constructor(private reportesService: ReportesService) {}

  async ngOnInit() {
    this.proveedores = await this.reportesService.getProveedores();
  }

  async filtrar() {
    const data = await this.reportesService.getComprasReporte(
      this.desde,
      this.hasta,
      this.proveedorSeleccionado
    );

    this.resultados = data.resultados;
    this.totalComprado = data.total;
  }

  formatear(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-PE');
  }

  exportarExcel() {
    try {
      if (this.resultados.length === 0) {
        alert('No hay compras para exportar.');
        return;
      }

      // Preparar los datos para exportar
      const datosExportar = this.resultados.map((item: any) => ({
        'Fecha': this.formatear(item.fecha),
        'Proveedor': item.proveedor || '---',
        'Documento': item.nro_documento || '---',
        'Producto': item.producto || '---',
        'Cantidad': item.cantidad || 0,
        'Costo Unitario': item.costo_unitario || 0,
        'Subtotal': item.subtotal || 0
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
      const encabezados = ['Fecha', 'Proveedor', 'Documento', 'Producto', 'Cantidad', 'Costo Unitario', 'Subtotal'];

      // Crear array con metadatos y datos
      const datosCompletos: any[] = [
        ['REPORTE DE COMPRAS'],
        ['FERRETERÍA RHEMA'],
        [`Fecha de Exportación: ${fechaExportacion}`],
        [`Total de Registros: ${this.resultados.length}`],
        [`Monto Total: S/ ${this.totalComprado.toFixed(2)}`],
        [], // Fila vacía
        encabezados, // Encabezados
        ...datosExportar.map((item: any) => [
          item['Fecha'],
          item['Proveedor'],
          item['Documento'],
          item['Producto'],
          item['Cantidad'],
          item['Costo Unitario'],
          item['Subtotal']
        ]) // Datos
      ];

      // Crear el libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Crear la hoja de trabajo desde los datos completos
      const ws = XLSX.utils.aoa_to_sheet(datosCompletos);

      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 12 },  // Fecha
        { wch: 25 },  // Proveedor
        { wch: 15 },  // Documento
        { wch: 30 },  // Producto
        { wch: 12 },  // Cantidad
        { wch: 15 },  // Costo Unitario
        { wch: 15 }   // Subtotal
      ];
      ws['!cols'] = columnWidths;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Compras');

      // Generar el nombre del archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte_compras_${fecha}.xlsx`;

      // Descargar el archivo
      XLSX.writeFile(wb, nombreArchivo);

      alert(`Archivo Excel exportado correctamente: ${nombreArchivo}\n\nTotal de registros: ${this.resultados.length}\nMonto total: S/ ${this.totalComprado.toFixed(2)}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar el archivo Excel. Por favor, intente nuevamente.');
    }
  }

  exportarPDF() {
    console.log("Exportar PDF aún no implementado");
  }
}
