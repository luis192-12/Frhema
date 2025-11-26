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
  loading = true;

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
    this.loading = false;
  }

  // NUEVO
  nuevoCliente() {
    this.modoEdicion = false;
    this.cliente = this.getEmptyCliente();
  }

  // EDITAR
  editarCliente(c: Cliente) {
    this.modoEdicion = true;
    this.cliente = { ...c };
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

      this.cliente = this.getEmptyCliente();
      this.modoEdicion = false;
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
