import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClientesService } from '../../core/services/personas/clientes.service';
import { Cliente } from '../../core/models/cliente.model';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes-list.component.html'
})
export class ClientesListComponent implements OnInit {

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  loading = true;
  terminoBusqueda = '';
  mostrarFormulario = false;

  modoEdicion = false;
  cliente: Cliente = this.getEmptyCliente();

  constructor(private clientesService: ClientesService) {}

  ngOnInit() {
    this.cargarClientes();
  }

  getEmptyCliente(): Cliente {
    return {
      nombre: '',
      tipo: null,
      documento: '',
      telefono: '',
      direccion: ''
    };
  }

  // ============================
  // LISTAR
  // ============================
  async cargarClientes() {
    this.loading = true;
    this.clientes = await this.clientesService.getClientes();
    this.filtrarClientes();
    this.loading = false;
  }

  filtrarClientes() {
    if (!this.terminoBusqueda.trim()) {
      this.clientesFiltrados = this.clientes;
    } else {
      const termino = this.terminoBusqueda.toLowerCase();
      this.clientesFiltrados = this.clientes.filter(c =>
        c.nombre?.toLowerCase().includes(termino) ||
        c.documento?.toLowerCase().includes(termino) ||
        c.telefono?.toLowerCase().includes(termino) ||
        c.direccion?.toLowerCase().includes(termino)
      );
    }
  }

  // NUEVO
  nuevoCliente() {
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.cliente = this.getEmptyCliente();
  }

  // EDITAR
  editarCliente(c: Cliente) {
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.cliente = { ...c };
  }

  // CERRAR MODAL
  cerrarModalDirecto() {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.cliente = this.getEmptyCliente();
  }

  cerrarModal(event: MouseEvent) {
    if ((event.target as HTMLElement)?.classList?.contains('fixed')) {
      this.cerrarModalDirecto();
    }
  }

  // GUARDAR
  async guardarCliente() {
    try {
      if (this.modoEdicion && this.cliente.id_cliente) {
        await this.clientesService.updateCliente(this.cliente.id_cliente, this.cliente);
        alert('Cliente actualizado');
      } else {
        await this.clientesService.addCliente(this.cliente);
        alert('Cliente registrado');
      }

      this.cerrarModalDirecto();
      this.cargarClientes();

    } catch (err) {
      alert('Error al guardar');
      console.error(err);
    }
  }

  // ELIMINAR
  async eliminarCliente(id: number) {
    if (!confirm('¿Eliminar cliente?')) return;

    try {
      await this.clientesService.deleteCliente(id);
      this.cargarClientes();
    } catch (err) {
      alert('Error al eliminar');
    }
  }
}
