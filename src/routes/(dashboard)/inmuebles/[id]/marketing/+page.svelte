<script>
  import {
    ArrowLeft,
    Sparkles,
    Download,
    LayoutTemplate,
    Smartphone,
    LayoutGrid,
    Copy,
    Check,
    FileText,
    Image as LucideImage,
    MapPin,
    Bed,
    Bath,
    Ruler,
    User,
    CheckCircle2,
    RefreshCw,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Sliders,
    Layers,
    DollarSign,
    Car,
    Phone,
    Globe,
    Briefcase,
    Camera,
    ArrowLeftRight,
    Tag,
    ChevronDown,
    ChevronUp
  } from 'lucide-svelte';
  import { page } from '$app/state';
  import { onMount, tick } from 'svelte';
  import { db } from '#lib/firebase';
  import { doc, getDoc } from 'firebase/firestore';
  import { authState } from '#lib/authStore.svelte.js';
  import logoInmo from '#lib/assets/logoinmo.png';
  import { flyerTemplates } from '#lib/components/publicaciones/index.ts';

  let property = $state(null);
  let loading = $state(true);
  let activeTab = $state('publicidad'); // 'publicidad' | 'copy'

  // Diseño seleccionado (1 al 8)
  let selectedDesignId = $state(1);

  // Selección de fotos para los 3 slots del flyer
  let activeSlot = $state(0); // 0 = principal, 1 = mini 1, 2 = mini 2
  let flyerPhotos = $state(['', '', '']);
  let customPhotoUrl = $state('');

  // Edición en vivo: Textos y características
  let editTipo = $state('CASA INDEPENDIENTE');
  let editCondicion = $state('A ESTRENAR');
  let editOperacion = $state('EN VENTA');
  let editPrecio = $state('$ 185.000');
  let editUbicacion = $state('Equipetrol, Santa Cruz');
  let editDormitorios = $state(4);
  let editBanos = $state(3);
  let editMetros = $state(280);
  let editParqueos = $state(2);
  let editCaracteristicas1 = $state([
    '4 Dormitorios',
    '3 Baños modernos',
    '280 m² Construidos',
    '2 Parqueos techados'
  ]);

  // Edición en vivo: Asesor y marca
  let userEditedAgentName = $state(false);
  let editAgenteNombre = $state('Asesor Casa Legal');
  let editAgenteCargo = $state('Asesor Inmobiliario Senior');
  let editAgenteTelefono = $state('+591 700 00000');
  let editAgenteFoto = $state('');
  let editSitio = $state('casalegalbolivia.com');

  // Zoom y visualización
  let previewScale = $state(0.52);
  let isDownloading = $state(false);
  let downloadStatus = $state('');
  let activeAccordion = $state('textos'); // 'fotos' | 'textos' | 'metricas' | 'asesor'

  // Para renderizado seguro Base64 en nodo de exportación
  let exportPhotos = $state(['', '', '']);
  let exportAgenteFoto = $state('');

  // Pestaña de Copywriting
  let copyPrompt = $state('');
  let generatedLongCopy = $state('');
  let isGeneratingCopy = $state(false);
  let textCopied = $state(false);

  // Lista de todas las fotos de la propiedad
  const allPropertyPhotos = $derived(
    property
      ? [property.fotoPrincipal, ...(property.fotosSecundarias || [])].filter(Boolean)
      : []
  );

  // Plantilla seleccionada
  const selectedTemplate = $derived(
    flyerTemplates.find((t) => t.id === selectedDesignId) || flyerTemplates[0]
  );

  // Datos reactivos combinados para los componentes de publicación
  const activePostData = $derived({
    tipo: editTipo || 'Propiedad Exclusiva',
    condicion: editCondicion || 'Elegante',
    operacion: editOperacion || 'En Venta',
    precio: editPrecio || '',
    ubicacion: editUbicacion || '',
    dormitorios: Number(editDormitorios) || 0,
    banos: Number(editBanos) || 0,
    metros: Number(editMetros) || 0,
    parqueos: Number(editParqueos) || 0,
    fotos: flyerPhotos,
    agente: {
      nombre: editAgenteNombre || 'Casa Legal',
      cargo: editAgenteCargo || 'Asesor Inmobiliario',
      telefono: editAgenteTelefono || '',
      foto: editAgenteFoto || '',
      url: ''
    },
    sitio: editSitio || 'casalegalbolivia.com'
  });

  // Datos para el nodo de exportación (con fotos ya convertidas a Base64)
  const exportPostData = $derived({
    ...activePostData,
    fotos: exportPhotos.length ? exportPhotos : flyerPhotos,
    agente: {
      ...activePostData.agente,
      foto: exportAgenteFoto || editAgenteFoto
    }
  });

  onMount(async () => {
    try {
      const propId = page.params.id;
      const docRef = doc(db, 'inmuebles', propId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        property = { id: snap.id, ...snap.data() };

        // 1. Asignar fotos iniciales
        const photos = [
          property.fotoPrincipal,
          ...(property.fotosSecundarias || [])
        ].filter(Boolean);

        flyerPhotos = [
          photos[0] || '',
          photos[1] || photos[0] || '',
          photos[2] || photos[1] || photos[0] || ''
        ];

        // 2. Asignar textos y datos del inmueble
        const tipoBase = property.tipoInmueble || 'Casa';
        editTipo = tipoBase;
        editCondicion = property.estadoInmueble || 'A estrenar';
        editOperacion = property.tipoOperacion || 'En venta';

        const pNum = Number(property.precioLista || 0);
        const moneda = property.moneda === 'BOB' ? 'Bs.' : '$';
        editPrecio = pNum > 0 ? `${moneda} ${pNum.toLocaleString('es-BO')}` : '$ 150.000';

        const locParts = [property.zona, property.ciudad].filter(Boolean);
        editUbicacion = locParts.join(', ') || 'Santa Cruz, Bolivia';

        editDormitorios =
          Number(property.dormitoriosSuite || 0) + Number(property.dormitoriosEstandar || 0) || 3;
        editBanos = Number(property.banosCompletos || 0) || 2;
        editMetros = Number(property.supConstruida || property.supTerreno || 0) || 180;
        editParqueos = Number(property.estacionamientos || 0) || 2;

        editCaracteristicas1 = [
          `${editDormitorios} Dormitorios`,
          `${editBanos} Baños`,
          `${editMetros} m² Superficie`,
          `${editParqueos} Parqueos`
        ];

        // 3. Asignar datos del asesor (priorizando el perfil del usuario conectado)
        applyAgentProfile();
      }
    } catch (error) {
      console.error('Error al cargar datos del inmueble para marketing:', error);
    } finally {
      loading = false;
    }
  });

  // Formatear nombre del asesor a solo Primer Nombre y Primer Apellido
  const formatPrimerNombrePrimerApellido = (nombres, apellidos, fallbackFull) => {
    if (nombres && apellidos) {
      const pNombre = nombres.trim().split(/\s+/)[0] || '';
      const pApellido = apellidos.trim().split(/\s+/)[0] || '';
      if (pNombre && pApellido) {
        return `${pNombre} ${pApellido}`;
      }
      if (pNombre) return pNombre;
    }

    const raw = (fallbackFull || nombres || '').trim();
    if (!raw) return 'Asesor Inmobiliario';

    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return words[0] || 'Asesor Inmobiliario';
    if (words.length === 2) return `${words[0]} ${words[1]}`;
    if (words.length === 3) {
      // 1 nombre + 2 apellidos (ej: Abel Escobar Larico -> Abel Escobar)
      return `${words[0]} ${words[1]}`;
    }
    // 2 nombres + 2 apellidos (ej: Abel Mauro Escobar Larico -> Abel Escobar)
    return `${words[0]} ${words[2]}`;
  };

  // Asignar datos del asesor (prioriza authState.profile, fallback a property)
  const applyAgentProfile = () => {
    const profile = authState.profile;

    if (profile && (profile.nombres || profile.apellidos || profile.nombre)) {
      if (!userEditedAgentName) {
        editAgenteNombre = formatPrimerNombrePrimerApellido(
          profile.nombres,
          profile.apellidos,
          profile.nombre
        );
      }
      editAgenteCargo = profile.cargo || 'Asesor Inmobiliario';
      editAgenteTelefono = profile.telefono || '+591 700 00000';
      editAgenteFoto =
        profile.documentos?.foto || profile.foto || property?.agenteFoto || '';
    } else if (property) {
      if (!userEditedAgentName) {
        editAgenteNombre = formatPrimerNombrePrimerApellido(
          null,
          null,
          property.agenteNombre
        );
      }
      editAgenteCargo = property.agenteCargo || 'Asesor Inmobiliario';
      editAgenteTelefono = property.agenteTelefono || '+591 700 00000';
      editAgenteFoto = property.agenteFoto || '';
    }
    editSitio = 'casalegalbolivia.com';
  };

  $effect(() => {
    // Sincronizar automáticamente cuando el perfil del usuario esté listo
    if (authState.profile && !userEditedAgentName) {
      applyAgentProfile();
    }
  });

  // Convertir URL a Base64 con soporte directo y proxies CORS de respaldo
  const imageUrlToBase64 = async (url) => {
    if (!url || url.startsWith('data:')) return url;

    // Intento 1: Fetch directo CORS
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {}

    // Intento 2: Proxy weserv.nl CDN
    try {
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {}

    // Intento 3: Proxy allorigins
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {}

    return url;
  };

  // Asignar foto al slot activo
  const assignPhotoToSlot = (photoUrl) => {
    if (!photoUrl) return;
    const next = [...flyerPhotos];
    next[activeSlot] = photoUrl;
    flyerPhotos = next;
  };

  // Intercambiar fotos
  const swapSlotPhotos = (fromIdx, toIdx) => {
    const next = [...flyerPhotos];
    const temp = next[fromIdx];
    next[fromIdx] = next[toIdx];
    next[toIdx] = temp;
    flyerPhotos = next;
  };

  // Restablecer valores de fábrica del inmueble
  const resetToPropertyDefaults = () => {
    if (!property) return;
    const tipoBase = property.tipoInmueble || 'Casa';
    editTipo = tipoBase;
    editCondicion = property.estadoInmueble || 'A estrenar';
    editOperacion = property.tipoOperacion || 'En venta';

    const pNum = Number(property.precioLista || 0);
    const moneda = property.moneda === 'BOB' ? 'Bs.' : '$';
    editPrecio = pNum > 0 ? `${moneda} ${pNum.toLocaleString('es-BO')}` : '$ 150.000';

    const locParts = [property.zona, property.ciudad].filter(Boolean);
    editUbicacion = locParts.join(', ') || 'Santa Cruz, Bolivia';

    editDormitorios =
      Number(property.dormitoriosSuite || 0) + Number(property.dormitoriosEstandar || 0) || 3;
    editBanos = Number(property.banosCompletos || 0) || 2;
    editMetros = Number(property.supConstruida || property.supTerreno || 0) || 180;
    editParqueos = Number(property.estacionamientos || 0) || 2;

    editCaracteristicas1 = [
      `${editDormitorios} Dormitorios`,
      `${editBanos} Baños`,
      `${editMetros} m² Superficie`,
      `${editParqueos} Parqueos`
    ];

    userEditedAgentName = false;
    applyAgentProfile();
  };

  // Sincronizar viñetas del Diseño 1 con las métricas
  const syncCaracteristicas1 = () => {
    editCaracteristicas1 = [
      `${editDormitorios} Dormitorios`,
      `${editBanos} Baños`,
      `${editMetros} m² Superficie`,
      `${editParqueos} Parqueos`
    ];
  };

  // Generador de Copywriting
  const generateLongCopy = async () => {
    isGeneratingCopy = true;
    await new Promise((resolve) => setTimeout(resolve, 600));
    const baseCopy = `🔥 ¡EXCLUSIVA OPORTUNIDAD INMOBILIARIA! 🔥\n\n${editTipo.toUpperCase()} en ${editOperacion.toUpperCase()} ubicado en ${editUbicacion}.\n\n✨ CARACTERÍSTICAS PRINCIPALES:\n🛏️ ${editDormitorios} Dormitorios amplios y luminosos\n🛁 ${editBanos} Baños de primera calidad\n📏 ${editMetros} m² de Superficie total\n🚗 ${editParqueos} Parqueos asignados\n\n💰 PRECIO: ${editPrecio}\n\n${copyPrompt ? `🎯 Nota destacada: ${copyPrompt}\n\n` : ''}📲 ¡Agenda tu visita exclusiva hoy mismo!\n👤 ${editAgenteNombre} · ${editAgenteCargo}\n📞 ${editAgenteTelefono}\n🌐 Casa Legal Inmobiliaria (${editSitio})`;
    generatedLongCopy = baseCopy;
    isGeneratingCopy = false;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLongCopy);
    textCopied = true;
    setTimeout(() => (textCopied = false), 2000);
  };

  // Descarga en Alta Resolución (1080x1080 / 2160x2160 HD)
  const downloadFlyerHD = async () => {
    if (isDownloading) return;
    isDownloading = true;
    downloadStatus = 'Convirtiendo fotos a HD...';

    try {
      // 1. Preparar versiones Base64 de las imágenes para evitar restricciones CORS
      const b64Photos = await Promise.all(
        flyerPhotos.map((url) => imageUrlToBase64(url))
      );
      exportPhotos = b64Photos;

      if (editAgenteFoto) {
        exportAgenteFoto = await imageUrlToBase64(editAgenteFoto);
      }

      downloadStatus = 'Renderizando publicación HD...';
      await tick();
      // Pequeña pausa para asegurar el repintado en DOM
      await new Promise((r) => setTimeout(r, 400));

      const node = document.getElementById('flyer-export-capture');
      if (!node) throw new Error('No se encontró el nodo de exportación');

      let dataUrl;
      try {
        const { toPng } = await import('html-to-image');
        dataUrl = await toPng(node, {
          quality: 0.98,
          pixelRatio: 2,
          width: 1080,
          height: 1080,
          skipAutoScale: true
        });
      } catch (err) {
        console.warn('toPng avisó fallo, recurriendo a html2canvas:', err);
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#0c3641',
          width: 1080,
          height: 1080
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      downloadStatus = 'Descargando archivo...';
      const cleanTitle = (property?.tituloPropiedad || editTipo || 'Flyer')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 30);
      const link = document.createElement('a');
      link.download = `CasaLegal_Diseno${selectedDesignId}_${cleanTitle}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar la imagen de alta definición:', error);
      alert('Hubo un problema al exportar el flyer. Por favor vuelve a intentar.');
    } finally {
      isDownloading = false;
      downloadStatus = '';
    }
  };
</script>

<svelte:head>
  <title>Marketing Inmobiliario | Casa Legal</title>
</svelte:head>

{#if loading}
  <div class="flex flex-col items-center justify-center min-h-screen bg-[#f8faf9]">
    <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0c3641]"></div>
    <p class="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">
      Cargando Estudio de Publicidad...
    </p>
  </div>
{:else if property}
  <div class="min-h-screen bg-[#0b1715] flex flex-col font-sans select-none text-slate-100">
    <!-- BARRA SUPERIOR DE HERRAMIENTAS -->
    <header class="bg-[#0e211e] border-b border-[#1b3d36] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
      <div class="flex items-center gap-4">
        <button
          type="button"
          onclick={() => history.back()}
          class="p-2.5 bg-[#14302a] text-emerald-300 rounded-xl hover:bg-[#1d463d] transition-all hover:scale-105"
          title="Regresar a la propiedad"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
            <h1 class="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
              Marketing Inmobiliario
            </h1>
            <span class="text-[10px] bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-bold px-2 py-0.5 rounded-full uppercase">
              Casa Legal
            </span>
          </div>
          <p class="text-[11px] text-emerald-400/80 truncate max-w-md font-medium">
            {property.tituloPropiedad || property.tipoInmueble} · {property.zona}
          </p>
        </div>
      </div>

      <!-- TABS PRINCIPALES -->
      <div class="flex bg-[#071311] p-1 rounded-xl border border-[#1b3d36]">
        <button
          type="button"
          onclick={() => (activeTab = 'publicidad')}
          class="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all {activeTab === 'publicidad'
            ? 'bg-gradient-to-r from-[#D4AF37] to-[#b89528] text-[#071915] shadow-lg font-black'
            : 'text-slate-400 hover:text-white'}"
        >
          <Sparkles size={15} /> Generar Publicidad (8 Diseños)
        </button>
        <button
          type="button"
          onclick={() => (activeTab = 'copy')}
          class="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all {activeTab === 'copy'
            ? 'bg-gradient-to-r from-[#D4AF37] to-[#b89528] text-[#071915] shadow-lg font-black'
            : 'text-slate-400 hover:text-white'}"
        >
          <FileText size={15} /> Copy de Venta (IA)
        </button>
      </div>

      <!-- BOTÓN DE DESCARGA -->
      <div class="flex items-center gap-3">
        {#if activeTab === 'publicidad'}
          <button
            type="button"
            onclick={downloadFlyerHD}
            disabled={isDownloading}
            class="px-6 py-2.5 bg-gradient-to-r from-[#185343] to-[#0c3641] hover:from-[#1e6653] hover:to-[#124b5a] text-[#E9CB7A] border border-[#D4AF37]/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl hover:shadow-[#D4AF37]/10 transition-all hover:scale-[1.02] disabled:opacity-60"
          >
            {#if isDownloading}
              <div class="animate-spin h-4 w-4 border-2 border-[#D4AF37] border-t-transparent rounded-full"></div>
              <span>{downloadStatus || 'Procesando...'}</span>
            {:else}
              <Download size={16} class="text-[#D4AF37]" />
              <span>Descargar Flyer HD (2160×2160)</span>
            {/if}
          </button>
        {/if}
      </div>
    </header>

    <!-- CUERPO PRINCIPAL -->
    {#if activeTab === 'publicidad'}
      <div class="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-65px)]">
        
        <!-- SIDEBAR DE CONTROLES Y EDICIÓN EN VIVO (IZQUIERDA) -->
        <aside class="w-full lg:w-[460px] xl:w-[490px] bg-[#0c1c19] border-r border-[#1a3832] flex flex-col overflow-y-auto">
          <div class="p-5 space-y-6">

            <!-- 1. SELECTOR DE LOS 8 DISEÑOS -->
            <div class="bg-[#091614] p-4 rounded-2xl border border-[#1b3d36] shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <LayoutGrid size={16} class="text-[#D4AF37]" />
                  <span class="text-xs font-black uppercase tracking-wider text-white">
                    1. Elige tu Diseño
                  </span>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1b3d36] text-[#D4AF37]">
                  8 Estilos Disponibles
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                {#each flyerTemplates as template}
                  <button
                    type="button"
                    onclick={() => (selectedDesignId = template.id)}
                    class="p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between {selectedDesignId === template.id
                      ? 'border-[#D4AF37] bg-gradient-to-br from-[#12382e] to-[#0a201b] text-white shadow-md ring-1 ring-[#D4AF37]/50'
                      : 'border-[#1b3d36] bg-[#0d221e]/60 text-slate-300 hover:border-[#2d6156] hover:bg-[#12312b]'}"
                  >
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black {selectedDesignId === template.id ? 'bg-[#D4AF37] text-[#061e17]' : 'bg-[#1b3d36] text-slate-400'}">
                        {template.id}
                      </span>
                      {#if selectedDesignId === template.id}
                        <CheckCircle2 size={14} class="text-[#D4AF37]" />
                      {/if}
                    </div>
                    <div>
                      <p class="text-xs font-bold leading-tight truncate">{template.name}</p>
                      <span class="text-[9px] uppercase tracking-wider text-[#D4AF37]/80 font-semibold block mt-0.5">
                        {template.tag}
                      </span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>

            <!-- 2. SELECTOR DE FOTOS PARA LOS SLOTS DEL FLYER -->
            <div class="bg-[#091614] p-4 rounded-2xl border border-[#1b3d36] shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Camera size={16} class="text-[#D4AF37]" />
                  <span class="text-xs font-black uppercase tracking-wider text-white">
                    2. Fotos en el Flyer
                  </span>
                </div>
                <button
                  type="button"
                  onclick={() => swapSlotPhotos(0, 1)}
                  class="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-bold"
                  title="Intercambiar orden"
                >
                  <ArrowLeftRight size={12} /> Invertir 1 y 2
                </button>
              </div>

              <!-- Vista de los 3 Slots -->
              <div class="grid grid-cols-3 gap-2">
                {#each [0, 1, 2] as slotIdx}
                  <button
                    type="button"
                    onclick={() => (activeSlot = slotIdx)}
                    class="group relative rounded-xl overflow-hidden border-2 transition-all aspect-square flex flex-col {activeSlot === slotIdx
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/40 shadow-lg'
                      : 'border-[#1b3d36] opacity-75 hover:opacity-100 hover:border-[#2b594f]'}"
                  >
                    {#if flyerPhotos[slotIdx]}
                      <img
                        src={flyerPhotos[slotIdx]}
                        alt="Slot {slotIdx + 1}"
                        class="w-full h-full object-cover"
                        crossorigin="anonymous"
                      />
                    {:else}
                      <div class="w-full h-full bg-[#112923] flex items-center justify-center text-slate-500">
                        <LucideImage size={20} />
                      </div>
                    {/if}
                    <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1.5 text-center">
                      <span class="text-[9px] font-black uppercase tracking-wider block text-white">
                        {slotIdx === 0 ? '★ Principal' : `Detalle ${slotIdx}`}
                      </span>
                    </div>
                    {#if activeSlot === slotIdx}
                      <span class="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37] ring-2 ring-black"></span>
                    {/if}
                  </button>
                {/each}
              </div>

              <div class="text-[10px] text-slate-400 bg-[#0c1f1b] p-2.5 rounded-xl border border-[#1b3d36] flex items-center justify-between">
                <span>Asignando a: <strong class="text-[#D4AF37] uppercase">{activeSlot === 0 ? 'Foto Principal' : `Foto Detalle ${activeSlot}`}</strong></span>
                <span class="text-[9px] text-slate-500">Toca abajo para elegir</span>
              </div>

              <!-- Galería de fotos del inmueble -->
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Fotos disponibles de la propiedad ({allPropertyPhotos.length})
                </p>
                {#if allPropertyPhotos.length > 0}
                  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#1b3d36]">
                    {#each allPropertyPhotos as photoUrl}
                      <button
                        type="button"
                        onclick={() => assignPhotoToSlot(photoUrl)}
                        class="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 {flyerPhotos[activeSlot] === photoUrl
                          ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/50'
                          : 'border-[#1b3d36] opacity-70 hover:opacity-100'}"
                      >
                        <img
                          src={photoUrl}
                          alt="Inmueble"
                          class="w-full h-full object-cover"
                          crossorigin="anonymous"
                        />
                      </button>
                    {/each}
                  </div>
                {:else}
                  <p class="text-xs text-amber-300 italic">No hay fotos secundarias registradas en este inmueble.</p>
                {/if}
              </div>

              <!-- Input para URL personalizada (opcional) -->
              <div class="pt-2 border-t border-[#1b3d36]">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  O pegar URL de imagen externa
                </label>
                <div class="flex gap-1.5">
                  <input
                    type="url"
                    bind:value={customPhotoUrl}
                    placeholder="https://..."
                    class="flex-1 p-2 bg-[#061411] border border-[#1b3d36] rounded-lg text-xs text-slate-200 outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onclick={() => {
                      if (customPhotoUrl) {
                        assignPhotoToSlot(customPhotoUrl);
                        customPhotoUrl = '';
                      }
                    }}
                    class="px-3 bg-[#17463b] text-[#D4AF37] rounded-lg text-xs font-bold hover:bg-[#1f594b]"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. PANEL DE EDICIÓN EN VIVO ("EDITAR EN VIVO") -->
            <div class="bg-[#091614] rounded-2xl border border-[#1b3d36] overflow-hidden shadow-sm">
              <div class="p-4 border-b border-[#1b3d36] flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Sliders size={16} class="text-[#D4AF37]" />
                  <span class="text-xs font-black uppercase tracking-wider text-white">
                    3. Edición en Vivo
                  </span>
                </div>
                <button
                  type="button"
                  onclick={resetToPropertyDefaults}
                  class="text-[10px] text-emerald-400 hover:text-white flex items-center gap-1 font-bold transition-colors"
                  title="Restablecer textos a valores originales"
                >
                  <RefreshCw size={11} /> Revertir
                </button>
              </div>

              <!-- ACORDEÓN: TITULARES Y TEXTOS -->
              <div class="border-b border-[#1b3d36]">
                <button
                  type="button"
                  onclick={() => (activeAccordion = activeAccordion === 'textos' ? '' : 'textos')}
                  class="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-[#0c1f1b]"
                >
                  <span class="flex items-center gap-2">
                    <Tag size={14} class="text-[#D4AF37]" /> Titular, Estado y Precio
                  </span>
                  {#if activeAccordion === 'textos'}<ChevronUp size={16}/>{:else}<ChevronDown size={16}/>{/if}
                </button>
                {#if activeAccordion === 'textos'}
                  <div class="p-4 space-y-3 bg-[#071412] text-xs">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Tipo / Titular Principal
                      </label>
                      <input
                        type="text"
                        bind:value={editTipo}
                        placeholder="ej: CASA INDEPENDIENTE"
                        class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white font-bold outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Condición / Sello
                        </label>
                        <input
                          type="text"
                          bind:value={editCondicion}
                          placeholder="A ESTRENAR"
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Operación
                        </label>
                        <select
                          bind:value={editOperacion}
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white font-bold outline-none focus:border-[#D4AF37]"
                        >
                          <option value="EN VENTA">EN VENTA</option>
                          <option value="EN ALQUILER">EN ALQUILER</option>
                          <option value="ANTICRÉTICO">ANTICRÉTICO</option>
                          <option value="OPORTUNIDAD">OPORTUNIDAD</option>
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Precio Publicado
                        </label>
                        <input
                          type="text"
                          bind:value={editPrecio}
                          placeholder="$ 185.000"
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-[#D4AF37] font-black outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Ubicación / Zona
                        </label>
                        <input
                          type="text"
                          bind:value={editUbicacion}
                          placeholder="Equipetrol, Santa Cruz"
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>
                {/if}
              </div>

              <!-- ACORDEÓN: MÉTRICAS Y CARACTERÍSTICAS -->
              <div class="border-b border-[#1b3d36]">
                <button
                  type="button"
                  onclick={() => (activeAccordion = activeAccordion === 'metricas' ? '' : 'metricas')}
                  class="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-[#0c1f1b]"
                >
                  <span class="flex items-center gap-2">
                    <Bed size={14} class="text-[#D4AF37]" /> Habitaciones, Baños y Metros
                  </span>
                  {#if activeAccordion === 'metricas'}<ChevronUp size={16}/>{:else}<ChevronDown size={16}/>{/if}
                </button>
                {#if activeAccordion === 'metricas'}
                  <div class="p-4 space-y-3 bg-[#071412] text-xs">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Dormitorios
                        </label>
                        <input
                          type="number"
                          bind:value={editDormitorios}
                          oninput={syncCaracteristicas1}
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white font-bold outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Baños
                        </label>
                        <input
                          type="number"
                          bind:value={editBanos}
                          oninput={syncCaracteristicas1}
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white font-bold outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Metros M²
                        </label>
                        <input
                          type="number"
                          bind:value={editMetros}
                          oninput={syncCaracteristicas1}
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white font-bold outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Parqueos
                        </label>
                        <input
                          type="number"
                          bind:value={editParqueos}
                          oninput={syncCaracteristicas1}
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white font-bold outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <!-- Viñetas especiales para Diseño 1 -->
                    {#if selectedDesignId === 1}
                      <div class="pt-3 border-t border-[#1b3d36] space-y-2">
                        <span class="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider block">
                          4 Viñetas para Diseño 1 (Curvas Esmeralda)
                        </span>
                        {#each [0, 1, 2, 3] as i}
                          <input
                            type="text"
                            bind:value={editCaracteristicas1[i]}
                            placeholder="Característica {i + 1}"
                            class="w-full p-2 bg-[#0b1c19] border border-[#1b3d36] rounded-lg text-xs text-white outline-none focus:border-[#D4AF37]"
                          />
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>

              <!-- ACORDEÓN: DATOS DEL ASESOR Y EMPRESA -->
              <div>
                <button
                  type="button"
                  onclick={() => (activeAccordion = activeAccordion === 'asesor' ? '' : 'asesor')}
                  class="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-[#0c1f1b]"
                >
                  <span class="flex items-center gap-2">
                    <User size={14} class="text-[#D4AF37]" /> Datos del Asesor y Contacto
                  </span>
                  {#if activeAccordion === 'asesor'}<ChevronUp size={16}/>{:else}<ChevronDown size={16}/>{/if}
                </button>
                {#if activeAccordion === 'asesor'}
                  <div class="p-4 space-y-3 bg-[#071412] text-xs">
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Nombre del Asesor
                      </label>
                      <input
                        type="text"
                        bind:value={editAgenteNombre}
                        placeholder="Nombre completo"
                        class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white font-bold outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Cargo / Rol
                        </label>
                        <input
                          type="text"
                          bind:value={editAgenteCargo}
                          placeholder="Asesor Inmobiliario"
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Teléfono / WhatsApp
                        </label>
                        <input
                          type="text"
                          bind:value={editAgenteTelefono}
                          placeholder="+591 700 00000"
                          class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Foto del Asesor (URL)
                      </label>
                      <input
                        type="url"
                        bind:value={editAgenteFoto}
                        placeholder="https://..."
                        class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                      />
                      {#if authState.profile?.documentos?.foto}
                        <button
                          type="button"
                          onclick={() => (editAgenteFoto = authState.profile.documentos.foto)}
                          class="mt-1.5 text-[10px] text-[#D4AF37] hover:underline font-bold"
                        >
                          Usar foto de mi perfil actual
                        </button>
                      {/if}
                    </div>
                    <div>
                      <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Sitio Web Oficial
                      </label>
                      <input
                        type="text"
                        bind:value={editSitio}
                        placeholder="casalegalbolivia.com"
                        class="w-full p-2.5 bg-[#0b1c19] border border-[#1b3d36] rounded-xl text-white outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                {/if}
              </div>

            </div>

          </div>
        </aside>

        <!-- CANVAS CENTRAL DE PREVISUALIZACIÓN EN VIVO (DERECHA) -->
        <main class="flex-1 bg-[#060e0d] flex flex-col items-center justify-between overflow-hidden relative">
          
          <!-- BARRA DE INFORMACIÓN Y ZOOM SUPERIOR -->
          <div class="w-full px-6 py-3 bg-[#0a1614]/80 backdrop-blur-md border-b border-[#1b3d36] flex items-center justify-between z-10">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-black">
                DISEÑO {selectedTemplate.id}
              </span>
              <div>
                <h2 class="text-xs font-bold text-white uppercase tracking-wider">
                  {selectedTemplate.name}
                </h2>
                <p class="text-[10px] text-slate-400">{selectedTemplate.description}</p>
              </div>
            </div>

            <!-- CONTROLES DE ZOOM -->
            <div class="flex items-center gap-2 bg-[#081512] border border-[#1b3d36] px-2 py-1 rounded-xl">
              <button
                type="button"
                onclick={() => (previewScale = Math.max(0.3, previewScale - 0.05))}
                class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#122b25]"
                title="Alejar"
              >
                <ZoomOut size={15} />
              </button>
              <span class="text-[11px] font-mono font-bold text-[#D4AF37] w-12 text-center">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                type="button"
                onclick={() => (previewScale = Math.min(0.85, previewScale + 0.05))}
                class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#122b25]"
                title="Acercar"
              >
                <ZoomIn size={15} />
              </button>
              <div class="w-[1px] h-4 bg-[#1b3d36] mx-1"></div>
              <button
                type="button"
                onclick={() => (previewScale = 0.52)}
                class="p-1 text-slate-400 hover:text-white rounded text-[10px] font-bold px-2 hover:bg-[#122b25]"
                title="Ajuste óptimo"
              >
                Auto
              </button>
            </div>
          </div>

          <!-- ÁREA CENTRAL DONDE SE RENDERIZA EL FLYER EN TIEMPO REAL -->
          <div class="flex-1 w-full flex items-center justify-center p-6 overflow-auto scrollbar-thin">
            <!-- Marco escalado -->
            <div
              class="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] bg-black rounded-lg overflow-hidden border border-[#D4AF37]/30 transition-all origin-center"
              style="width: {1080 * previewScale}px; height: {1080 * previewScale}px;"
            >
              <div
                class="origin-top-left"
                style="transform: scale({previewScale}); width: 1080px; height: 1080px;"
              >
                {#if selectedTemplate}
                  {#if selectedTemplate.id === 1}
                    <svelte:component
                      this={selectedTemplate.component}
                      data={activePostData}
                      caracteristicas={editCaracteristicas1}
                      logo={logoInmo}
                    />
                  {:else}
                    <svelte:component
                      this={selectedTemplate.component}
                      data={activePostData}
                      logo={logoInmo}
                    />
                  {/if}
                {/if}
              </div>
            </div>
          </div>

          <!-- BARRA INFERIOR DE ACCESO RÁPIDO A LOS 8 DISEÑOS -->
          <div class="w-full px-6 py-2.5 bg-[#0a1614]/90 backdrop-blur-md border-t border-[#1b3d36] flex items-center justify-center gap-2 overflow-x-auto">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 shrink-0">
              Cambio Rápido:
            </span>
            {#each flyerTemplates as t}
              <button
                type="button"
                onclick={() => (selectedDesignId = t.id)}
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 {selectedDesignId === t.id
                  ? 'bg-[#D4AF37] text-[#061e17] font-black shadow-md'
                  : 'bg-[#0f2722] text-slate-300 hover:bg-[#173831]'}"
              >
                #{t.id} {t.name}
              </button>
            {/each}
          </div>

        </main>

      </div>
    {:else}
      <!-- TAB DE COPYWRITING DE VENTA -->
      <div class="flex-1 flex items-center justify-center p-8 bg-[#071311]">
        <div class="w-full max-w-2xl bg-[#0c1f1b] border border-[#1b3d36] p-8 rounded-3xl shadow-2xl space-y-6">
          <div class="flex items-center justify-between border-b border-[#1b3d36] pb-4">
            <div>
              <h2 class="text-lg font-black text-white flex items-center gap-2">
                <FileText class="text-[#D4AF37]" size={20} /> Copywriter de Venta Automático
              </h2>
              <p class="text-xs text-slate-400">
                Genera texto profesional optimizado para WhatsApp, Facebook Ads e Instagram.
              </p>
            </div>
            <button
              type="button"
              onclick={copyToClipboard}
              disabled={!generatedLongCopy}
              class="px-4 py-2 bg-[#17463b] text-[#D4AF37] hover:bg-[#1f594b] rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40"
            >
              {#if textCopied}
                <Check size={16} class="text-emerald-400" /> Copiado
              {:else}
                <Copy size={16} /> Copiar al Portapapeles
              {/if}
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Instrucciones extra para el Copy (Opcional)
              </label>
              <textarea
                bind:value={copyPrompt}
                placeholder="Ej: Destacar que está a 2 cuadras de centros comerciales, financiamiento bancario disponible, etc."
                rows="3"
                class="w-full p-3.5 bg-[#061210] border border-[#1b3d36] rounded-xl text-sm text-slate-200 outline-none focus:border-[#D4AF37]"
              ></textarea>
            </div>

            <button
              type="button"
              onclick={generateLongCopy}
              disabled={isGeneratingCopy}
              class="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#b89528] text-[#071a15] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              {#if isGeneratingCopy}
                <div class="animate-spin h-5 w-5 border-2 border-[#071a15] border-t-transparent rounded-full"></div>
                <span>Creando texto...</span>
              {:else}
                <Sparkles size={16} /> Generar Copy de Venta
              {/if}
            </button>
          </div>

          <!-- RESULTADO DEL COPY -->
          <div>
            <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Texto Generado
            </label>
            <div class="bg-[#061210] p-5 rounded-2xl border border-[#1b3d36] whitespace-pre-wrap text-sm text-emerald-100 font-medium h-[280px] overflow-y-auto leading-relaxed scrollbar-thin">
              {generatedLongCopy || 'Haz clic en "Generar Copy de Venta" para redactar la descripción.'}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- NODO OCULTO 1:1 PARA EXPORTACIÓN EN ALTA RESOLUCIÓN (2160x2160 / 1080x1080) -->
  <div class="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0 select-none overflow-hidden" style="width: 1080px; height: 1080px;">
    <div id="flyer-export-capture" style="width: 1080px; height: 1080px; position: relative;">
      {#if selectedTemplate}
        {#if selectedTemplate.id === 1}
          <svelte:component
            this={selectedTemplate.component}
            data={exportPostData}
            caracteristicas={editCaracteristicas1}
            logo={logoInmo}
          />
        {:else}
          <svelte:component
            this={selectedTemplate.component}
            data={exportPostData}
            logo={logoInmo}
          />
        {/if}
      {/if}
    </div>
  </div>
{/if}
