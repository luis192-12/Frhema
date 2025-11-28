import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../../core/services/inventario/categorias.service';
import { Categoria } from '../../core/models/categoria.model';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html'
})
export class CategoriasComponent implements OnInit {

  categorias: Categoria[] = [];
  loading = true;

  // Formulario
  modoEdicion = false;
  mostrarFormulario = false;
  categoria: Categoria = this.getEmptyCategoria();

  constructor(private categoriasService: CategoriasService) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  getEmptyCategoria(): Categoria {
    return {
      nombre: '',
      descripcion: ''
    };
  }

  // ============================
  // LISTAR
  // ============================
  async cargarCategorias() {
    this.loading = true;
    this.categorias = await this.categoriasService.getCategorias();
    this.loading = false;
  }

  // ============================
  // NUEVA
  // ============================
  nuevaCategoria() {
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.categoria = this.getEmptyCategoria();
  }

  // ============================
  // EDITAR
  // ============================
  editarCategoria(cat: Categoria) {
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.categoria = { ...cat };
  }

  // ============================
  // CERRAR MODAL
  // ============================
  cerrarModalDirecto() {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.categoria = this.getEmptyCategoria();
  }

  cerrarModal(event: MouseEvent) {
    // Si se hizo clic en el backdrop (fondo), cerrar el modal
    if ((event.target as HTMLElement)?.classList?.contains('fixed')) {
      this.cerrarModalDirecto();
    }
  }

  // ============================
  // GUARDAR
  // ============================
  async guardarCategoria() {
    try {
      if (this.modoEdicion && this.categoria.id_categoria) {
        await this.categoriasService.updateCategoria(
          this.categoria.id_categoria,
          this.categoria
        );
        alert('Categoría actualizada');
      } else {
        await this.categoriasService.addCategoria(this.categoria);
        alert('Categoría creada');
      }

      this.cerrarModalDirecto();
      this.cargarCategorias();

    } catch (err) {
      alert('Error al guardar categoría');
      console.error(err);
    }
  }

  // ============================
  // ELIMINAR
  // ============================
  async eliminarCategoria(id: number) {
    if (!confirm('¿Eliminar categoría?')) return;

    try {
      await this.categoriasService.deleteCategoria(id);
      this.cargarCategorias();
    } catch (err) {
      alert('Error al eliminar');
    }
  }
}
