import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { NotificacionesService, Notificacion } from '../../core/services/notificaciones/notificaciones.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  rol: number = Number(localStorage.getItem('rol'));
  nombreUsuario: string = localStorage.getItem('nombre_usuario') || 'Usuario';
  sidebarOpen = false;
  profileMenuOpen = false;
  notificationsMenuOpen = false;
  
  notificaciones: Notificacion[] = [];
  cantidadNoLeidas: number = 0;
  private notificacionesSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit() {
    // Suscribirse a las notificaciones
    this.notificacionesSubscription = this.notificacionesService.notificaciones$.subscribe(notificaciones => {
      this.notificaciones = notificaciones;
      this.cantidadNoLeidas = this.notificacionesService.getCantidadNoLeidas();
    });
    
    // Cargar notificaciones iniciales
    this.notificacionesService.cargarNotificacionesStock();
  }

  ngOnDestroy() {
    if (this.notificacionesSubscription) {
      this.notificacionesSubscription.unsubscribe();
    }
  }

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

  // ============================
  // NOTIFICACIONES
  // ============================
  marcarComoLeida(notificacion: Notificacion) {
    this.notificacionesService.marcarComoLeida(notificacion.id);
  }

  marcarTodasComoLeidas() {
    this.notificacionesService.marcarTodasComoLeidas();
  }

  eliminarNotificacion(notificacion: Notificacion, event: Event) {
    event.stopPropagation();
    this.notificacionesService.eliminarNotificacion(notificacion.id);
  }

  getIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'stock_agotado':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'stock_critico':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getColorTipo(tipo: string): string {
    switch (tipo) {
      case 'stock_agotado':
        return 'text-red-600 bg-red-50';
      case 'stock_critico':
        return 'text-orange-600 bg-orange-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  }
}

