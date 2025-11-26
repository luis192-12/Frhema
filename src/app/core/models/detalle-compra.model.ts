export interface DetalleCompra {
  id_detalle_compra?: number;
  id_compra?: number;
  id_producto: number;
  cantidad: number;
  costo_unitario: number;
  subtotal?: number;
}
