/*
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsuariosService } from '../../core/services/configuracion/usuarios.service';
import { RolesService } from '../../core/services/configuracion/roles.service';

import { Usuario } from '../../core/models/usuario.model';
import { Rol } from '../../core/models/rol.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {

  usuarios: (Usuario & { roles?: Rol | null })[] = [];
  roles: Rol[] = [];
  loading = true;

  constructor(
    private usuariosService: UsuariosService,
    private rolesService: RolesService
  ) {}

  async ngOnInit() {
    await this.cargarRoles();
    await this.cargarUsuarios();
  }

  async cargarRoles() {
    this.roles = await this.rolesService.getRoles();
  }

  async cargarUsuarios() {
    this.loading = true;
    this.usuarios = await this.usuariosService.getUsuarios();
    this.loading = false;
  }

  // Actualizar el rol de un usuario
  async guardarRol(usuario: Usuario & { roles?: Rol | null }) {
    try {
      await this.usuariosService.actualizarRolUsuario(
        usuario.id_usuario,
        usuario.id_rol ?? null
      );

      alert('Rol actualizado correctamente');

      // Si el usuario que se actualizó es el que está logueado,
      // lo ideal es que vuelva a iniciar sesión para refrescar su rol en localStorage.
      const currentUserId = localStorage.getItem('user_id');
      if (currentUserId && currentUserId === usuario.id_usuario) {
        console.warn('Has cambiado tu propio rol. Vuelve a iniciar sesión para aplicar cambios.');
      }

    } catch (err) {
      console.error(err);
      alert('Error al actualizar rol');
    }
  }
}
*/
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsuariosService } from '../../core/services/configuracion/usuarios.service';
import { RolesService } from '../../core/services/configuracion/roles.service';

import { Usuario } from '../../core/models/usuario.model';
import { Rol } from '../../core/models/rol.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {

  usuarios: (Usuario & { roles?: Rol | null })[] = [];
  roles: Rol[] = [];
  loading = true;

  // UUID del Superadmin (INMUTABLE)
  SUPERADMIN_ID = 'e3a3f8f6-ded6-45fa-a2e3-5d873e6fab34';

  constructor(
    private usuariosService: UsuariosService,
    private rolesService: RolesService
  ) {}

  async ngOnInit() {
    await this.cargarRoles();
    await this.cargarUsuarios();
  }

  async cargarRoles() {
    this.roles = await this.rolesService.getRoles();
  }

  async cargarUsuarios() {
    this.loading = true;

    // Cargar todos los usuarios
    const data = await this.usuariosService.getUsuarios();

    // Marcar superadmin como no editable
    this.usuarios = data.map(u => ({
      ...u,
      esSuperadmin: u.id_usuario === this.SUPERADMIN_ID
    }));

    this.loading = false;
  }

  // =====================================
  //   ⚠️ PROTECCIÓN DEL SUPERADMIN
  // =====================================
  async guardarRol(usuario: Usuario & { roles?: Rol | null, esSuperadmin?: boolean }) {

    if (usuario.esSuperadmin) {
      alert('⚠️ El superadmin no puede cambiar de rol.');
      return;
    }

    try {
      await this.usuariosService.actualizarRolUsuario(
        usuario.id_usuario,
        usuario.id_rol ?? null
      );

      alert('Rol actualizado correctamente');

      // Si el usuario modificado es el actual
      const currentUserId = localStorage.getItem('user_id');
      if (currentUserId && currentUserId === usuario.id_usuario) {
        console.warn('Has cambiado tu propio rol. Vuelve a iniciar sesión para aplicar cambios.');
      }

    } catch (err) {
      console.error(err);
      alert('Error al actualizar rol');
    }
  }
}
