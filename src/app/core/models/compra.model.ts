
export interface Compra {
  id_compra?: number;
  id_proveedor: number;
  id_usuario: string;   // auth.users.id
  fecha?: string;
  nro_documento?: string;
  total: number;
}
