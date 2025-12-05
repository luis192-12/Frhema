/*
// src/app/core/services/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase.client';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private supabaseService: SupabaseClientService,
    private router: Router
  ) {}

  // ============================
  // LOGIN
  // ============================
  async login(email: string, password: string) {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    localStorage.setItem('session', JSON.stringify(data.session));

    return data.session;
  }

  // ============================
  // REGISTER
  // ============================
  async register(email: string, password: string, nombre_usuario: string) {
    const { data, error } = await this.supabaseService.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_usuario
        }
      }
    });

    if (error) throw error;

    return data;
  }

  // ============================
  // LOGOUT
  // ============================
  async logout() {
    await this.supabaseService.client.auth.signOut();
    localStorage.removeItem('session');
    this.router.navigate(['/']);
  }

  // ============================
  // GET SESSION
  // ============================
  getSession() {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getSession();
  }
}
*/

// src/app/core/services/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase.client';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private supabaseService: SupabaseClientService,
    private router: Router
  ) {}

  // ============================
  // LOGIN CORRECTO CON ROLES
  // ============================
  async login(email: string, password: string) {

    // 1️⃣ LOGIN en auth.users
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const user = data.user;
    if (!user) {
      throw new Error("No se pudo obtener el usuario.");
    }

    // 2️⃣ OBTENER PERFIL DE TABLA "usuarios"
    // Intentar con mejor manejo de errores y headers explícitos
    let perfil: any = null;
    let id_rol: number | null = null;

    try {
      const { data: perfilData, error: e2 } = await this.supabaseService.client
        .from("usuarios")
        .select("id_rol")
        .eq("id_usuario", user.id)
        .maybeSingle(); // Usar maybeSingle() en lugar de single() para evitar error si no existe

      if (e2) {
        console.warn("Error al obtener perfil del usuario:", e2);
        // Si es error 406, puede ser problema de RLS o headers
        if (e2.code === 'PGRST116' || e2.message?.includes('406')) {
          console.warn("Error 406: Posible problema de permisos RLS. Intentando continuar...");
          // Continuar sin rol, se asignará después
        } else {
          throw new Error(`Error al obtener perfil: ${e2.message}`);
        }
      } else {
        perfil = perfilData;
        id_rol = perfil?.id_rol ?? null;
      }
    } catch (err: any) {
      console.error("Error al consultar perfil de usuario:", err);
      // Si falla, continuar sin rol (el admin puede asignarlo después)
      id_rol = null;
    }

    // 3️⃣ GUARDAR SESSION
    localStorage.setItem("session", JSON.stringify(data.session));
    localStorage.setItem("token", data.session.access_token);
    localStorage.setItem("user_id", user.id);

    // 4️⃣ GUARDAR ROL EN LOCALSTORAGE
    // Si no tiene rol, guardar null (el admin puede asignarlo después)
    if (id_rol !== null) {
      localStorage.setItem("rol", id_rol.toString());
    } else {
      localStorage.removeItem("rol");
      // Si no tiene rol, lanzar error para que el admin lo asigne
      throw new Error("Usuario sin rol asignado. Contacte al administrador.");
    }

    return data.session;
  }


  // ============================
  // REGISTER
  // ============================
  async register(email: string, password: string, nombre_usuario: string) {
    const { data, error } = await this.supabaseService.client.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    const user = data.user;

    if (!user) {
      throw new Error("No se pudo crear el usuario en auth.");
    }


    

    // 🔥 INSERTAR PERFIL EN TABLA usuarios
    const { error: e2 } = await this.supabaseService.client
      .from("usuarios")
      .insert({
        id_usuario: user.id,           // uuid de auth.users
        nombre_usuario: nombre_usuario,
        id_rol: null,                  // SIN ROL de momento
        nombre: null,
        apellido: null
      });

    if (e2) throw e2;

    return data;
  }

  // ============================
  // REGISTER INTERNO (solo admin)
  // ============================
  async registerInternal(email: string, password: string) {

    const { data, error } = await this.supabaseService.client.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    const user = data.user;

    if (!user) {
      throw new Error("No se pudo crear el usuario en auth.");
    }

    // Solo devolvemos el objeto usuario para luego completar desde UsuariosService
    return { user };
  }



  // ============================
  // LOGOUT
  // ============================
  async logout() {
    await this.supabaseService.client.auth.signOut();
    localStorage.removeItem('session');
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    this.router.navigate(['/']);
  }

  // ============================
  // SESSION
  // ============================
  getSession() {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getSession();
  }
}
