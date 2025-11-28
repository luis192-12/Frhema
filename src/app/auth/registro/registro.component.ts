// src/app/auth/registro/registro.component.ts
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  email = '';
  password = '';
  nombre_usuario = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async register() {
    try {
      await this.authService.register(this.email, this.password, this.nombre_usuario);
      alert('Usuario registrado. Revisa tu correo para confirmar.');
      this.router.navigate(['/']);
    } catch (err: any) {
      this.errorMessage = err.message;
    }
  }
}
