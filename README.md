# Ferretería Rhema — Sistema de Gestión de Inventario (Web)

Sistema web para **automatizar inventario, ventas, compras y reportes** de la *Ferretería Rhema* (Andahuaylas, Apurímac), mejorando el control de stock, reduciendo errores manuales y facilitando la toma de decisiones.

---

## 📌 Descripción general
**Ferretería Rhema** es una plataforma web accesible desde navegador (PC / móvil) orientada a:
- Centralizar información de productos, ventas, compras y usuarios.
- Actualizar stock automáticamente en cada movimiento.
- Generar alertas (stock mínimo, vencimientos).
- Emitir comprobantes (boleta/factura) y reportes exportables.

---

## ✨ Funcionalidades (alcance)
### Inventario / Productos
- Registro de productos (código, nombre, categoría, proveedor, stock, precios, etc.).
- Clasificación por tipo, marca y unidad de medida.
- **Alertas** de stock mínimo.
- Registro de **fecha de caducidad** (y alertas de vencimiento).

### Ventas (POS)
- Registro de ventas con distintos métodos de pago (efectivo, tarjeta u otros).
- Generación de comprobantes (boleta/factura).
- Historial de ventas y trazabilidad por usuario responsable.

### Compras y Proveedores
- Registro de compras (productos, cantidades, precios).
- Gestión de proveedores (datos y **historial** de compras).

### Usuarios y Seguridad
- Gestión de usuarios con roles: **Administrador, Cajero, Almacenero**.
- Restricción de acceso por rol.

### Reportes
- Reportes diarios/semanales/mensuales (ventas, inventario, compras).
- Exportación de reportes a **PDF / Excel**.

---

## 🧑‍💼 Roles del sistema
- **Administrador:** configuración general, usuarios, reportes y auditoría.
- **Cajero:** ventas, comprobantes y operaciones de caja.
- **Almacenero:** productos, inventario, stock y alertas.

---

## 🧱 Arquitectura (alto nivel)
Aplicación web moderna basada en:
- **Frontend:** Angular + Tailwind CSS
- **Backend (Cloud):** Supabase  
  - Postgres (Base de datos relacional)
  - Supabase Auth (roles y acceso)
  - Storage (archivos, si aplica)
  - (Opcional) Edge Functions (automatizaciones: alertas/reportes)
- **Despliegue:** Hosting (usanso el servicio de Github)

> Nota: **La integración con SUNAT aún no está implementada**, se agregará cuando esté lista.

---

## 🧰 Tecnologías usadas
- **Angular** (Angular CLI)
- **Tailwind CSS**
- **Supabase** (Postgres, Auth, Storage, Edge Functions si aplica)
- **Git/GitHub** (flujo por ramas + Pull Requests)

---

## ✅ Requisitos (No funcionales clave)
- Venta/compra debe ejecutarse en **< 3 segundos** (operaciones críticas).
- Disponibilidad mínima esperada: **99%** en horario comercial.
- Validaciones de datos obligatorios y control de acceso por rol.

---

## 🌐 Enlace de la aplicación
- Demo / Web: **[Ver la aplicación](https://cristhianhuamanyauris.github.io/Frhema/)**

---

## 🚀 Instalación y ejecución (local)

### Prerrequisitos
- Node.js (recomendado versión moderna LTS)
- Angular CLI (versión del proyecto):
  ```bash
  npm install -g @angular/cli@18
