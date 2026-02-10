# WMS Checking & Packing Demo

Sistema de chequeo y packing para pedidos outbound. Funciona 100% offline.

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm run dev
```

La aplicación se abrirá automáticamente en http://localhost:5173

## Usuarios Demo

- **operario1** / 1234 (OPERARIO)
- **supervisor1** / 1234 (SUPERVISOR)
- **admin1** / 1234 (ADMIN)

## Sociedades Disponibles

- SBO_OPERACIONES
- SBO_AMBAR
- SBO_ACCURACY

## Funcionalidades

### Módulos Principales

1. **Login**: Autenticación con usuario, contraseña y selección de sociedad
2. **Lista de Pedidos**: Vista de todos los pedidos outbound con filtros
3. **Detalle de Packing**: Módulo principal de chequeo con scanner, etiquetas y validaciones
4. **Dashboard de Avance**: Reportes visuales con gráficos de progreso
5. **Reporte de Incidencias**: Análisis detallado de trueques, sobrantes, faltantes y diferencias de peso

### Características Principales

- ✅ Funciona completamente **offline** (sin backend ni base de datos externa)
- ✅ Persistencia en **IndexedDB** (los datos sobreviven al recargar el navegador)
- ✅ Multi-sociedad y multi-cliente con control de acceso por usuario
- ✅ Scanner con soporte para SKU, EAN, series, lotes y múltiples UOM
- ✅ Gestión de etiquetas/bultos con control de peso y balanza simulada
- ✅ Sistema de autorización por roles (ADMIN, SUPERVISOR, OPERARIO)
- ✅ Generación de PDF de etiquetas con códigos QR
- ✅ Reportes visuales con gráficos interactivos
- ✅ Exportación de incidencias a CSV

## Reset Demo Data

Usar el botón **"Reset demo data"** en el header para restaurar los datos iniciales.

## Stack Tecnológico

- **React 18** + **Vite** + **TypeScript**
- **TailwindCSS** (estilos modernos y responsive)
- **IndexedDB** con **Dexie.js** (persistencia offline)
- **Recharts** (gráficos y visualizaciones)
- **jsPDF** + **qrcode** (generación de etiquetas)
- **React Router** (navegación)
- **React Hot Toast** (notificaciones)

## Notas Importantes

- Todo el sistema funciona completamente **offline**
- Los datos persisten en **IndexedDB** del navegador
- Los datos iniciales (seeds) se cargan automáticamente al primer uso
- No se requiere ningún backend ni servicio externo
- La aplicación está optimizada para PC y tablet

## Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
├── pages/           # Páginas principales
├── services/        # Lógica de negocio y acceso a datos
├── hooks/           # Custom hooks
├── types/           # Definiciones TypeScript
├── seeds/           # Datos iniciales JSON
└── utils/           # Utilidades y helpers
```

## Flujos Principales

### 1. Escaneo de Productos

- Escanear EAN o SKU interno
- Validación automática contra el pedido
- Detección de trueques (productos incorrectos)
- Manejo de series (validación de unicidad global)
- Manejo de lotes
- Conversión automática de UOM (EA, PACK, MASTER)

### 2. Gestión de Etiquetas

- Crear etiquetas manualmente (formato: CLIENTE-PEDIDO-SEQ)
- Asignar productos escaneados a etiquetas
- Cerrar etiquetas con simulación de balanza
- Repack (mover productos entre etiquetas)
- Generación de PDF con QR

### 3. Incidencias

- **TRUEQUE**: Producto que no pertenece al pedido
- **SOBRANTE**: Cantidad chequeada mayor a la picada
- **FALTANTE**: Reportar productos faltantes
- **DIF_PESO**: Diferencia significativa entre peso teórico y real

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## Licencia

Proyecto de demostración para Accuracy WMS.
