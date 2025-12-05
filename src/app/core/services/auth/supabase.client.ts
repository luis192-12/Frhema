// src/app/core/services/auth/supabase.client.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseClientService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          // Deshabilitar el uso de Navigator LockManager para evitar conflictos
          // Esto previene el error "Acquiring an exclusive Navigator LockManager lock"
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Configuración para evitar locks conflictivos
          flowType: 'pkce'
        },
        // Configuración global para evitar problemas de locks
        global: {
          headers: {
            'x-client-info': 'angular-client'
          }
        }
      }
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}

