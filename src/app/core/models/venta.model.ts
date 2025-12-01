export interface Venta {
  id_venta?: number;
  id_cliente?: number;
  id_usuario: string;		  // viene de localStorage
  tipo_comprobante?: string;
  nro_comprobante?: string;
  metodo_pago?: string;
  total: number;

  base_imponible: number;
  igv: number;

  
}
