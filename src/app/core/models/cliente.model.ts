  export interface Cliente {
    id_cliente?: number;
    nombre: string;
    tipo: string | null;  // natural / empresa
    documento?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  }
