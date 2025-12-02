import { Rol } from './rol.model';

export interface Usuario {
  id_usuario: string;       // uuid de auth.users
  nombre_usuario: string;
  id_rol?: number | null;
  nombre?: string | null;
  apellido?: string | null;

  // cuando hagamos join con roles
  rol?: Rol | null;
   // ⭐ NUEVO
  esSuperadmin?: boolean;
}
