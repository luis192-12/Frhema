import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';

import { ReportesService } from '../../core/services/reportes/reportes.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-inventario-reporte',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],  // 👈 ESTO CORRIGE NG0303
  templateUrl: './inventario-reporte.component.html',
  styleUrls: ['./inventario-reporte.component.css'],
})
export class InventarioReporteComponent implements OnInit {

  cargando = true;

  stockCritico: any[] = [];
  porVencer: any[] = [];
  sinMovimiento: any[] = [];
  inventarioCompleto: any[] = [];

  constructor(private reporteService: ReportesService) {}

  async ngOnInit() {
    this.cargando = true;

    try {
      this.stockCritico = await this.reporteService.getStockCritico();
      this.porVencer = await this.reporteService.getPorVencer();
      this.sinMovimiento = await this.reporteService.getSinMovimiento();
      this.inventarioCompleto = await this.reporteService.getInventarioCompleto();

    } catch (error) {
      console.error('Error cargando reportes de inventario', error);
    }

    this.cargando = false;
  }

  // =====================================================
  // 📦 EXPORTAR A EXCEL
  // =====================================================
  exportarExcel() {
    try {
      if (this.inventarioCompleto.length === 0) {
        alert('No hay productos para exportar.');
        return;
      }

      const datosExportar = this.inventarioCompleto.map((item: any) => ({
        'Código': item.codigo || '',
        'Nombre': item.nombre || '',
        'Categoría': item.categoria || '',
        'Unidad de Medida': item.unidad_medida || '',
        'Stock Actual': item.stock_actual || 0,
        'Stock Mínimo': item.stock_minimo || 0,
        'Precio Unitario': item.precio_unitario || 0,
        'Precio Mayor': item.precio_mayor || 0,
        'Estado': item.activo !== false ? 'Activo' : 'Inactivo',
        'Marca': item.marca || '',
        'Descripción': item.descripcion || ''
      }));

      const fechaExportacion = new Date().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const encabezados = ['Código', 'Nombre', 'Categoría', 'Unidad de Medida', 'Stock Actual', 'Stock Mínimo', 'Precio Unitario', 'Precio Mayor', 'Estado', 'Marca', 'Descripción'];

      const datosCompletos: any[] = [
        ['REPORTE DE INVENTARIO'],
        ['FERRETERÍA RHEMA'],
        [`Fecha de Exportación: ${fechaExportacion}`],
        [`Total de Productos: ${this.inventarioCompleto.length}`],
        [],
        encabezados,
        ...datosExportar.map((item: any) => [
          item['Código'],
          item['Nombre'],
          item['Categoría'],
          item['Unidad de Medida'],
          item['Stock Actual'],
          item['Stock Mínimo'],
          item['Precio Unitario'],
          item['Precio Mayor'],
          item['Estado'],
          item['Marca'],
          item['Descripción']
        ])
      ];

      const wb = XLSX.utils.book_new();
      
      const ws = XLSX.utils.aoa_to_sheet(datosCompletos);

      const columnWidths = [
        { wch: 15 },  // Código
        { wch: 30 },  // Nombre
        { wch: 20 },  // Categoría
        { wch: 15 },  // Unidad de Medida
        { wch: 12 },  // Stock Actual
        { wch: 12 },  // Stock Mínimo
        { wch: 15 },  // Precio Unitario
        { wch: 15 },  // Precio Mayor
        { wch: 12 },  // Estado
        { wch: 20 },  // Marca
        { wch: 40 }   // Descripción
      ];
      ws['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte_inventario_${fecha}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      alert(`Archivo Excel exportado correctamente: ${nombreArchivo}\n\nTotal de productos: ${this.inventarioCompleto.length}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar el archivo Excel. Por favor, intente nuevamente.');
    }
  }

  // =====================================================
  // 📄 EXPORTAR A PDF
  // =====================================================
  exportarPDF() {
    const doc = new jsPDF();
    doc.text('Reporte de Inventario', 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [['Código', 'Producto', 'Stock', 'Stock mínimo', 'Unidad']],
      body: this.inventarioCompleto.map(p => [
        p.codigo,
        p.nombre,
        p.stock_actual,
        p.stock_minimo,
        p.unidad_medida,
      ])
    });

    doc.save('reporte_inventario.pdf');
  }

  // =====================================================
  // 🗓 FORMATEO DE FECHAS
  // =====================================================
  fechaBonita(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-PE');
  }
}
