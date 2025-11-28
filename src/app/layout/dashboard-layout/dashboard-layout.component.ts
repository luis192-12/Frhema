import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent {
  rol: number = Number(localStorage.getItem('rol'));
  nombreUsuario: string = localStorage.getItem('nombre_usuario') || 'Usuario';
  sidebarOpen = false;
  profileMenuOpen = false;
  notificationsMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu') && !target.closest('button[aria-label="Account"]')) {
      this.profileMenuOpen = false;
    }
    if (!target.closest('.notifications-menu') && !target.closest('button[aria-label="Notificaciones"]')) {
      this.notificationsMenuOpen = false;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
    if (this.profileMenuOpen) {
      this.notificationsMenuOpen = false;
    }
  }

  toggleNotificationsMenu() {
    this.notificationsMenuOpen = !this.notificationsMenuOpen;
    if (this.notificationsMenuOpen) {
      this.profileMenuOpen = false;
    }
  }

  closeProfileMenu() {
    this.profileMenuOpen = false;
  }

  closeNotificationsMenu() {
    this.notificationsMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // Helper para obtener iniciales del usuario
  getInitials(): string {
    const nombre = localStorage.getItem('nombre_usuario') || 'U';
    return nombre.charAt(0).toUpperCase();
  }
}

