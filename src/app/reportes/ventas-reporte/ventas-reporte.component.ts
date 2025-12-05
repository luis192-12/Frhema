import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../core/services/ventas/ventas.service';
import { ClientesService } from '../../core/services/personas/clientes.service';
import { UsuariosService } from '../../core/services/configuracion/usuarios.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-ventas-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas-reporte.component.html',
})
export class VentasReporteComponent implements OnInit {

  ventas: any[] = [];
  clientes: any[] = [];
  usuarios: any[] = [];

  filtros = {
    fecha_inicio: '',
    fecha_fin: '',
    id_cliente: '',
    id_usuario: '',
    tipo_comprobante: ''
  };

  constructor(
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private usuariosService: UsuariosService
  ) {}

  async ngOnInit() {
    this.clientes = await this.clientesService.getClientes();
    this.usuarios = await this.usuariosService.getUsuarios();
    await this.cargarReporte();
  }

  async cargarReporte() {

    const filtrosConvertidos = {
      fecha_inicio: this.filtros.fecha_inicio || undefined,
      fecha_fin: this.filtros.fecha_fin || undefined,
      id_cliente: this.filtros.id_cliente ? Number(this.filtros.id_cliente) : undefined,
      id_usuario: this.filtros.id_usuario || undefined,
      tipo_comprobante: this.filtros.tipo_comprobante || undefined,
    };

    this.ventas = await this.ventasService.getReporteVentas(filtrosConvertidos);
  }

  formatFecha(fecha: string) {
    return new Date(fecha).toLocaleString();
  }

  exportarPDF() {
    console.log("Exportar PDF aún no implementado");
  }

  exportarExcel() {
    try {
      if (this.ventas.length === 0) {
        alert('No hay ventas para exportar.');
        return;
      }

      // Preparar los datos para exportar
      const datosExportar = this.ventas.map((v: any) => ({
        'Fecha': this.formatFecha(v.fecha),
        'Cliente': v.clientes?.nombre || '---',
        'Documento': v.clientes?.documento || '---',
        'Tipo Comprobante': v.tipo_comprobante || '',
        'Número Comprobante': v.nro_comprobante || '',
        'Total': v.total || 0,
        'Cajero': v.usuarios?.nombre_usuario || '---'
      }));

      // Preparar datos con metadatos incluidos
      const fechaExportacion = new Date().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calcular totales
      const totalVentas = this.ventas.reduce((sum: number, v: any) => sum + (v.total || 0), 0);

      const encabezados = ['Fecha', 'Cliente', 'Documento', 'Tipo Comprobante', 'Número Comprobante', 'Total', 'Cajero'];

      const datosCompletos: any[] = [
        ['REPORTE DE VENTAS'],
        ['FERRETERÍA RHEMA'],
        [`Fecha de Exportación: ${fechaExportacion}`],
        [`Total de Ventas: ${this.ventas.length}`],
        [`Monto Total: S/ ${totalVentas.toFixed(2)}`],
        [],
        encabezados,
        ...datosExportar.map((item: any) => [
          item['Fecha'],
          item['Cliente'],
          item['Documento'],
          item['Tipo Comprobante'],
          item['Número Comprobante'],
          item['Total'],
          item['Cajero']
        ])
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(datosCompletos);

      const columnWidths = [
        { wch: 20 },  // Fecha
        { wch: 30 },  // Cliente
        { wch: 15 },  // Documento
        { wch: 18 },  // Tipo Comprobante
        { wch: 20 },  // Número Comprobante
        { wch: 15 },  // Total
        { wch: 20 }   // Cajero
      ];
      ws['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `reporte_ventas_${fecha}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);

      alert(`Archivo Excel exportado correctamente: ${nombreArchivo}\n\nTotal de ventas: ${this.ventas.length}\nMonto total: S/ ${totalVentas.toFixed(2)}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar el archivo Excel. Por favor, intente nuevamente.');
    }
  }
}
