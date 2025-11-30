export interface Producto {
  id_producto?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  id_categoria?: number | null;
  id_proveedor?: number | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  precio_unitario: number;
  precio_mayor?: number | null;
  tiene_caducidad: boolean;
  fecha_vencimiento?: string | null; // ISO format
  tiene_garantia: boolean;
  meses_garantia?: number | null;
  
  // Campos nuevos para ferretería 
  // - precio_compra (numeric, nullable) -> precio_compra
  // - marca (text, nullable) -> marca
  // - material (text, nullable) -> material
  // - peso (numeric, nullable) -> peso
  // - medidas (text, nullable) -> medidas
  precio_compra?: number | null;
  marca?: string | null;
  material?: string | null;
  peso?: number | null;
  medidas?: string | null;
  
  // Campo para eliminación lógica (soft delete)
  activo?: boolean;
}
