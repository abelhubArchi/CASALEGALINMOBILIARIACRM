---
name: adaptar-publicacion
description: Procedimiento estándar para adaptar e incorporar nuevos diseños de flyers o publicaciones (publicacion_X.svelte) en el módulo Generar Publicidad de Casa Legal.
---

# Procedimiento para Adaptar Nuevas Publicaciones

Cuando el usuario suba o mencione un nuevo diseño de flyer en `src/lib/components/publicaciones/` (por ejemplo, `publicacion_9.svelte`):

## 1. Reglas de Importaciones y Rutas
- **Alias de librerías:** Usar siempre `#lib` (declarado en `package.json`), **NUNCA** `$lib`.
  - Tipos: `import type { PostData } from '#lib/types';`
  - Logo por defecto: `logo = '/logoinmo.png'` o import desde `#lib/assets/logoinmo.png`.

## 2. Contrato Obligatorio de Props (Svelte 5)
Cada componente de flyer debe aceptar el contrato `PostData`:
```svelte
<script lang="ts">
  import type { PostData } from '#lib/types';

  let { data, logo = '/logoinmo.png' }: { data: PostData; logo?: string } = $props();

  const principal = $derived(data.fotos?.[0] || '');
  const mini1 = $derived(data.fotos?.[1] || principal);
  const mini2 = $derived(data.fotos?.[2] || mini1);
  const sitio = $derived(data.sitio ?? 'casalegalbolivia.com');
  const iniciales = $derived(
    (data.agente?.nombre || '')
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0] || '')
      .join('')
      .toUpperCase()
  );
</script>
```

### Campos disponibles en `data: PostData`:
- `data.tipo`: Tipo o título del inmueble (string, ej: `"Casa independiente"`, `"Departamento de Lujo"`)
- `data.condicion`: Etiqueta destacada o estado (string opcional, ej: `"A estrenar"`, `"Oportunidad"`)
- `data.operacion`: Tipo de operación (string opcional, ej: `"En venta"`, `"En alquiler"`, `"Anticrético"`)
- `data.fotos`: Array de 3 URLs `[principal, detalle1, detalle2]`
- `data.precio`: Cadena formateada de precio (string opcional, ej: `"$ 185.000"`)
- `data.ubicacion`: Zona y ciudad (string opcional, ej: `"Equipetrol, Santa Cruz"`)
- `data.dormitorios`: Cantidad de dormitorios (number)
- `data.banos`: Cantidad de baños (number)
- `data.metros`: Metros cuadrados (number)
- `data.parqueos`: Cantidad de parqueos (number)
- `data.agente`: `{ nombre, cargo, telefono, foto, url }`
- `data.sitio`: Dominio web (`"casalegalbolivia.com"`)

## 3. Dimensiones y Estructura Visual
- El contenedor raíz debe medir exactamente **1080px × 1080px**:
  ```css
  .post {
    position: relative;
    width: 1080px;
    height: 1080px;
    overflow: hidden;
    box-sizing: border-box;
  }
  ```
- Todas las imágenes `<img>` o `<image>` deben incluir `crossorigin="anonymous"` para permitir la exportación en alta definición sin bloqueos CORS.

## 4. Registro en el Catálogo (`index.ts`)
Abrir `src/lib/components/publicaciones/index.ts`:
1. Importar el nuevo componente:
   ```ts
   import PublicacionN from './publicacion_N.svelte';
   ```
2. Añadir el objeto a la lista `flyerTemplates`:
   ```ts
   {
     id: N,
     name: 'Nombre Atractivo del Estilo',
     tag: 'Etiqueta de Estilo',
     description: 'Descripción breve de la composición visual.',
     component: PublicacionN
   }
   ```
3. Exportar el componente en el bloque `export { ... }`.

## 5. Verificación
- Comprobar que compile sin errores de Vite.
- Verificar en la ruta de marketing `/inmuebles/[id]/marketing` que el nuevo diseño aparezca en el selector, responda a los controles de edición en vivo y se descargue correctamente en HD.
