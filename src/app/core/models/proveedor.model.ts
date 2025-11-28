
/*
export interface Proveedor {
  id_proveedor?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
  
  // CAMPOS NUEVOS - Agregar a la tabla `proveedores` en Supabase:
  // - tipo_documento (text)      -> tipoDocumento
  // - numero_documento (text)    -> numeroDocumento
  // - correo (text)               -> correo
  // - activo (boolean, default true) -> activo
  tipoDocumento?: string;
  numeroDocumento?: string;
  correo?: string;
  activo?: boolean;
}
*/
export interface Proveedor {
  id_proveedor?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;

  // Campos nuevos en snake_case (compatible Supabase)
  tipo_documento?: string;
  numero_documento?: string;
  correo?: string;
  activo?: boolean;
}
