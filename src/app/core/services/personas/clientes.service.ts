import { Injectable } from '@angular/core';
import { SupabaseClientService } from '../auth/supabase.client';
import { Cliente } from '../../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private readonly TABLE = 'clientes';

  constructor(private supabase: SupabaseClientService) {}

  // ============================
  // LISTAR
  // ============================
  async getClientes(): Promise<Cliente[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .order('id_cliente', { ascending: true });

    if (error) throw error;
    return data as Cliente[];
  }

  // ============================
  // CREAR
  // ============================
  async addCliente(cliente: Cliente) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert([cliente])
      .select()
      .single();

    if (error) throw error;
    return data as Cliente;
  }

  // ============================
  // ACTUALIZAR
  // ============================
  async updateCliente(id: number, cliente: Partial<Cliente>) {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(cliente)
      .eq('id_cliente', id)
      .select()
      .single();

    if (error) throw error;
    return data as Cliente;
  }

  // ============================
  // ELIMINAR
  // ============================
  async deleteCliente(id: number) {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id_cliente', id);

    if (error) throw error;
    return true;
  }
}
