/*
import { Injectable } from '@angular/core';
import { SupabaseClientService } from '../auth/supabase.client';
import { Proveedor } from '../../models/proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private readonly TABLE = 'proveedores';

  constructor(private supabase: SupabaseClientService) {}

  // ===========================
  // LISTAR
  // ===========================
  async getProveedores(): Promise<Proveedor[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .order('id_proveedor', { ascending: true });

    if (error) throw error;
    return data as Proveedor[];
  }

  // ===========================
  // CREAR
  // ===========================
  async addProveedor(proveedor: Proveedor) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert([proveedor])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===========================
  // EDITAR
  // ===========================
  async updateProveedor(id: number, proveedor: Partial<Proveedor>) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(proveedor)
      .eq('id_proveedor', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===========================
  // ELIMINAR
  // ===========================
  async deleteProveedor(id: number) {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id_proveedor', id);

    if (error) throw error;
    return true;
  }
}
*/
import { Injectable } from '@angular/core';
import { SupabaseClientService } from '../auth/supabase.client';
import { Proveedor } from '../../models/proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private readonly TABLE = 'proveedores';

  constructor(private supabase: SupabaseClientService) {}

  async getProveedores(): Promise<Proveedor[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .order('id_proveedor', { ascending: true });

    if (error) throw error;
    return data as Proveedor[];
  }

  async addProveedor(proveedor: Proveedor) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert([proveedor])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProveedor(id: number, proveedor: Partial<Proveedor>) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(proveedor)
      .eq('id_proveedor', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProveedor(id: number) {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id_proveedor', id);

    if (error) throw error;
    return true;
  }
}
