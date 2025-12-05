import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login() {
    this.errorMessage = '';
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Error en login:', err);
      
      // Mensajes de error más específicos
      if (err.message?.includes('sin rol asignado')) {
        this.errorMessage = "Usuario sin rol asignado. Contacte al administrador.";
      } else if (err.message?.includes('Invalid login credentials') || err.message?.includes('Email not confirmed')) {
        this.errorMessage = "Credenciales incorrectas o email no confirmado.";
      } else if (err.message?.includes('406') || err.message?.includes('Not Acceptable')) {
        this.errorMessage = "Error de permisos. Contacte al administrador del sistema.";
      } else {
        this.errorMessage = err.message || "Error al iniciar sesión. Intente nuevamente.";
      }
    }
  }

}
