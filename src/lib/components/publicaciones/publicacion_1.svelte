<!--
  PostPropiedad.svelte  ·  CASA LEGAL INMOBILIARIA
  Publicación cuadrada (1080×1080) para redes sociales. Svelte 5.

  Todo el contenido entra por props; el diseño es fijo.

  <PostPropiedad
    titulo={['ELEGANTE', 'CASA', 'EN VENTA']}
    caracteristicas={['5 Dormitorios', 'Sala de estar', 'Cocina equipada', 'Piscina']}
    fotos={[urlSuperior, urlPrincipal, urlInferior]}
    agente={{ nombre: 'Nombre Apellido', cargo: 'Asesor inmobiliario', telefono: '+591 700 00000', foto: urlAgente }}
  />
-->
<script>
  import logoDefault from '#lib/assets/logoinmo.png';

  let {
    data = null,
    titulo = ['ELEGANTE', 'CASA', 'EN VENTA'],
    tituloCaracteristicas = 'Características',
    caracteristicas = ['5 Dormitorios', 'Sala de estar', 'Cocina equipada', 'Piscina'],
    fotos = [],
    agente = { nombre: 'Nombre del agente', cargo: 'Asesor inmobiliario', telefono: '+000 123 456 7890', foto: '' },
    empresa = { nombre: 'CASA LEGAL', subtitulo: 'INMOBILIARIA', logo: logoDefault },
    redes = ['facebook', 'instagram', 'whatsapp']
  } = $props();

  const activeTitulo = $derived(
    data ? [
      (data.condicion || 'ELEGANTE').toUpperCase(),
      (data.tipo || 'CASA').toUpperCase(),
      (data.operacion || 'EN VENTA').toUpperCase()
    ] : titulo
  );

  const activeCaracteristicas = $derived(
    data ? [
      `${data.dormitorios ?? 0} Dormitorios`,
      `${data.banos ?? 0} Baños`,
      `${data.metros ?? 0} m² Superficie`,
      `${data.parqueos ?? 0} Parqueos`
    ] : caracteristicas
  );

  const activeFotos = $derived(data?.fotos?.length ? data.fotos : fotos);
  const activeAgente = $derived(data?.agente ? { ...agente, ...data.agente } : agente);
  const activeEmpresa = $derived({
    nombre: empresa?.nombre || 'CASA LEGAL',
    subtitulo: empresa?.subtitulo || 'INMOBILIARIA',
    logo: empresa?.logo || logoDefault
  });

  // Estructura fija de las 3 zonas de foto (coordenadas del viewBox 1000×1000)
  const zonas = [
    {
      id: 'superior',
      d: 'M690 64 C722 56 765 98 822 150 C845 172 838 192 802 208 L562 290 C532 301 514 292 520 268 C532 196 640 80 690 64 Z',
      box: [512, 52, 332, 258]
    },
    {
      id: 'principal',
      d: 'M455 398 L1000 205 L1000 712 L548 712 C490 706 455 540 455 398 Z',
      box: [450, 200, 550, 516]
    },
    {
      id: 'inferior',
      d: 'M562 762 C600 748 760 752 1000 752 L1000 985 L650 985 C596 985 562 925 551 806 C548 782 552 768 562 762 Z',
      box: [546, 746, 454, 244]
    }
  ];

  const uid = Math.random().toString(36).slice(2, 8);
  const items = $derived(activeCaracteristicas.slice(0, 4));
  const iniciales = $derived(
    (activeAgente.nombre || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  );
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<svg
  class="post"
  viewBox="0 0 1000 1000"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label="Publicación de propiedad: {activeTitulo.join(' ')}"
>
  <defs>
    <linearGradient id="verde-{uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#11402F" />
      <stop offset="1" stop-color="#06150F" />
    </linearGradient>
    <linearGradient id="oro-{uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E9CB7A" />
      <stop offset="0.5" stop-color="#C9A24B" />
      <stop offset="1" stop-color="#A67C2E" />
    </linearGradient>

    {#each zonas as z}
      <clipPath id="clip-{z.id}-{uid}"><path d={z.d} /></clipPath>
    {/each}
    <clipPath id="clip-agente-{uid}"><circle cx="96" cy="905" r="40" /></clipPath>
  </defs>

  <!-- Fondo -->
  <rect width="1000" height="1000" fill="#FFFFFF" />

  <!-- Panel verde con borde curvo dorado -->
  <path
    d="M0 0 H647 C492 160 412 380 417 520 C422 700 530 880 635 1000 H0 Z"
    fill="none"
    stroke="url(#oro-{uid})"
    stroke-width="4"
  />
  <path
    d="M0 0 H637 C480 160 400 380 405 520 C410 700 520 880 625 1000 H0 Z"
    fill="url(#verde-{uid})"
  />

  <!-- Logo y empresa -->
  <image href={activeEmpresa.logo || logoDefault} x="50" y="62" width="84" height="81" preserveAspectRatio="xMidYMid meet" />
  <text x="152" y="102" class="empresa-nombre" fill="url(#oro-{uid})">{activeEmpresa.nombre}</text>
  <text x="153" y="136" class="empresa-sub">{activeEmpresa.subtitulo}</text>

  <!-- Título -->
  <text x="50" y="345" class="t1">{activeTitulo[0]}</text>
  <text x="50" y="424" class="t2">{activeTitulo[1]}</text>
  <text x="50" y="494" class="t3" fill="url(#oro-{uid})">{activeTitulo[2]}</text>

  <!-- Características -->
  <text x="50" y="598" class="car-titulo" fill="url(#oro-{uid})">{tituloCaracteristicas}</text>
  {#each items as item, i}
    {@const y = 654 + i * 46}
    <polygon points="50,{y - 20} 76,{y - 10} 50,{y} 56,{y - 10}" fill="url(#oro-{uid})" />
    <text x="92" y={y} class="car-item">{item}</text>
  {/each}

  <!-- Fotos -->
  {#each zonas as z, i}
    {@const src = activeFotos[i]}
    <g clip-path="url(#clip-{z.id}-{uid})">
      <rect x={z.box[0]} y={z.box[1]} width={z.box[2]} height={z.box[3]} fill="#E7E5DF" />
      {#if src}
        <image
          href={src}
          x={z.box[0]}
          y={z.box[1]}
          width={z.box[2]}
          height={z.box[3]}
          preserveAspectRatio="xMidYMid slice"
          crossorigin="anonymous"
        />
      {/if}
    </g>
    <path d={z.d} fill="none" stroke="url(#oro-{uid})" stroke-width="5" stroke-linejoin="round" />
  {/each}

  <!-- Redes -->
  {#each redes.slice(0, 3) as red, i}
    {@const cx = 835 + i * 45}
    <g transform="translate({cx} 80)">
      <circle r="19" fill="#0A0A0A" />
      {#if red === 'facebook'}
        <path
          d="M2.5 11 V-1 H6.5 L7 -5.5 H2.5 V-8 C2.5 -9.4 3 -10 4.5 -10 H7 V-14 C6.4 -14.1 5 -14.2 3.7 -14.2 C0.4 -14.2 -1.8 -12.2 -1.8 -8.5 V-5.5 H-5.5 V-1 H-1.8 V11 Z"
          fill="#E9CB7A"
        />
      {:else if red === 'instagram'}
        <rect x="-9" y="-9" width="18" height="18" rx="5" fill="none" stroke="#E9CB7A" stroke-width="2" />
        <circle r="4.2" fill="none" stroke="#E9CB7A" stroke-width="2" />
        <circle cx="5.6" cy="-5.6" r="1.2" fill="#E9CB7A" />
      {:else if red === 'whatsapp'}
        <path
          d="M-9 10 L-7 4 A9.5 9.5 0 1 1 -3 8 Z"
          fill="none"
          stroke="#E9CB7A"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M-3.6 -4 C-4.4 -2 -3 1 0 4 C3 6.4 5.2 6.4 6 5.2 L6 3.6 L3.4 2.4 L2.2 3.4 C0.8 2.8 -1.4 0.6 -2 -1 L-1 -2.2 L-2.2 -4.8 Z"
          fill="#E9CB7A"
        />
      {/if}
    </g>
  {/each}

  <!-- Agente -->
  <circle cx="96" cy="905" r="45" fill="none" stroke="url(#oro-{uid})" stroke-width="4" />
  <circle cx="96" cy="905" r="40" fill="#0A0A0A" />
  {#if activeAgente.foto}
    <image
      href={activeAgente.foto}
      x="56"
      y="865"
      width="80"
      height="80"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#clip-agente-{uid})"
      crossorigin="anonymous"
    />
  {:else}
    <text x="96" y="915" class="iniciales" text-anchor="middle">{iniciales}</text>
  {/if}

  <text x="160" y="888" class="ag-nombre">{activeAgente.nombre}</text>
  {#if activeAgente.cargo}
    <text x="160" y="912" class="ag-cargo" fill="url(#oro-{uid})">{activeAgente.cargo}</text>
  {/if}
  <!-- Teléfono -->
  <g transform="translate(160 925)">
    <path
      d="M4 6 C3 16 14 27 24 24 L24 18 L17 15.5 L14.5 18 C11.5 16.5 9 13.5 8 10.5 L10.5 8 L8 1 L4 2 Z"
      fill="url(#oro-{uid})"
      transform="translate(0 0) scale(.9)"
    />
    <text x="30" y="21" class="ag-tel">{activeAgente.telefono}</text>
  </g>
</svg>

<style>
  .post {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
  }

  .empresa-nombre {
    font-size: 36px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .empresa-sub {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 4.5px;
    fill: #ffffff;
  }

  .t1 {
    font-size: 64px;
    font-weight: 400;
    fill: #ffffff;
  }
  .t2 {
    font-size: 84px;
    font-weight: 800;
    fill: #ffffff;
  }
  .t3 {
    font-size: 58px;
    font-weight: 500;
  }

  .car-titulo {
    font-size: 32px;
    font-weight: 600;
  }
  .car-item {
    font-size: 25px;
    font-weight: 500;
    fill: #ffffff;
  }

  .ag-nombre {
    font-size: 25px;
    font-weight: 700;
    fill: #ffffff;
  }
  .ag-cargo {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 1.5px;
  }
  .ag-tel {
    font-size: 27px;
    font-weight: 600;
    fill: #ffffff;
  }
  .iniciales {
    font-size: 28px;
    font-weight: 700;
    fill: #E9CB7A;
  }
</style>
