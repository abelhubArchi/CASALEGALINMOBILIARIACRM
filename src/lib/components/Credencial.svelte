<script>
  import { onMount } from 'svelte';
  import logoInmo from '../assets/logoinmo.png';
  import { toPng } from 'html-to-image';
  import jsPDF from 'jspdf';
  import { 
    Download, 
    Printer, 
    Edit3, 
    Sparkles, 
    RotateCcw, 
    Upload, 
    Check, 
    User, 
    Briefcase,
    ShieldCheck,
    PenTool,
    Phone,
    MapPin,
    Calendar,
    Hash,
    ChevronDown,
    ChevronUp
  } from 'lucide-svelte';

  let { asesor = {}, showButtons = true } = $props();

  let credencialElement;
  let downloading = $state(false);

  // Panel de edición de la credencial
  let showEditPanel = $state(false);
  let nombreEditable = $state('');
  let funcionEditable = $state('ASESOR INMOBILIARIO');
  let credencialNumEditable = $state('CLI-VERIFICADO');
  let validaHastaEditable = $state('DICIEMBRE 2027');
  let telefonoEditable = $state('+591 70000000');
  let ciudadEditable = $state('La Paz - El Alto');
  let signaturePreview = $state(null);
  let prevAsesor = $state(null);

  // Sincronizar datos reactivamente al recibir o cambiar el objeto asesor
  $effect(() => {
    if (asesor !== prevAsesor) {
      prevAsesor = asesor;
      const full = (asesor.nombreCompleto || `${asesor.nombres || ''} ${asesor.apellidos || ''}`).trim();
      nombreEditable = full || 'NOMBRE DEL TITULAR';
      
      const rawRol = asesor.rol || asesor.cargo || asesor.funcion || '';
      if (rawRol.toUpperCase().includes('LIDER') || rawRol.toUpperCase().includes('LÍDER')) {
        funcionEditable = 'LÍDER DE EQUIPO';
      } else if (rawRol.toUpperCase().includes('BROKER')) {
        funcionEditable = 'BROKER ASOCIADO';
      } else if (rawRol.toUpperCase().includes('DIRECTOR')) {
        funcionEditable = 'DIRECTOR COMERCIAL';
      } else if (rawRol) {
        funcionEditable = rawRol.toUpperCase();
      } else {
        funcionEditable = 'ASESOR INMOBILIARIO';
      }

      credencialNumEditable = asesor.ci ? `CLI-${asesor.ci}` : (asesor.credencialNum || 'CLI-VERIFICADO');
      validaHastaEditable = asesor.validaHasta || 'DICIEMBRE 2027';
      telefonoEditable = asesor.telefono || '+591 70000000';
      ciudadEditable = asesor.departamento || asesor.ciudad || 'La Paz - El Alto';
      signaturePreview = asesor.firma || asesor.documentos?.firma || null;
    }
  });

  // Cálculo dinámico de tamaño de letra para que el NOMBRE NUNCA tenga salto de línea
  let nameFontSize = $derived.by(() => {
    const len = (nombreEditable || '').trim().length;
    if (len <= 14) return '21px';
    if (len <= 18) return '18.5px';
    if (len <= 22) return '16.5px';
    if (len <= 26) return '15px';
    if (len <= 30) return '13.5px';
    return '12px';
  });

  // Cálculo de tamaño para la FUNCIÓN / ROL (visualmente más grande y destacada)
  let roleFontSize = $derived.by(() => {
    const len = (funcionEditable || '').trim().length;
    if (len <= 18) return '13.5px';
    if (len <= 24) return '12px';
    return '11px';
  });

  // Roles predefinidos de liderazgo y asesoría en Casa Legal
  const rolePresets = [
    'ASESOR INMOBILIARIO',
    'LÍDER DE EQUIPO',
    'TEAM LEADER',
    'DIRECTOR COMERCIAL',
    'BROKER ASOCIADO',
    'GERENTE DE VENTAS',
    'SOCIO MASTER',
    'ASESOR SENIOR'
  ];

  const resetData = () => {
    const full = (asesor.nombreCompleto || `${asesor.nombres || ''} ${asesor.apellidos || ''}`).trim();
    nombreEditable = full || 'NOMBRE DEL TITULAR';
    funcionEditable = 'ASESOR INMOBILIARIO';
    credencialNumEditable = asesor.ci ? `CLI-${asesor.ci}` : 'CLI-VERIFICADO';
    validaHastaEditable = 'DICIEMBRE 2027';
    telefonoEditable = asesor.telefono || '+591 70000000';
    ciudadEditable = asesor.departamento || asesor.ciudad || 'La Paz - El Alto';
    signaturePreview = asesor.firma || asesor.documentos?.firma || null;
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      signaturePreview = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  onMount(() => {
    if (!window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
      document.querySelectorAll('.card').forEach(c => {
        c.addEventListener('pointermove', e => {
          const b = c.getBoundingClientRect();
          const x = (e.clientX - b.left) / b.width;
          const y = (e.clientY - b.top) / b.height;
          c.style.setProperty('--mx', x * 100 + '%');
          c.style.setProperty('--my', y * 100 + '%');
          c.style.transform = `rotateY(${(x - .5) * 12}deg) rotateX(${(.5 - y) * 10}deg)`;
        });
        c.addEventListener('pointerleave', () => {
          c.style.transform = '';
          c.style.setProperty('--mx', '50%');
          c.style.setProperty('--my', '30%');
        });
      });
    }
  });

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const imageUrlToBase64 = async (url) => {
    if (!url || url.startsWith('data:')) return url;

    // Intento 1: Direct Fetch
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        return await blobToBase64(blob);
      }
    } catch (e) {}

    // Intento 2: Proxy weserv.nl (Global CORS CDN)
    try {
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        return await blobToBase64(blob);
      }
    } catch (e) {}

    // Intento 3: Proxy AllOrigins
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        return await blobToBase64(blob);
      }
    } catch (err) {}

    return url;
  };

  const downloadPDF = async () => {
    if (typeof window === 'undefined' || !credencialElement || downloading) return;
    downloading = true;

    const images = credencialElement.querySelectorAll('img');
    const originalSrcs = [];

    try {
      // 1. Convertir imágenes externas a Base64
      for (const img of images) {
        originalSrcs.push({ img, src: img.src });
        if (img.src && !img.src.startsWith('data:')) {
          const base64 = await imageUrlToBase64(img.src);
          if (base64 && base64.startsWith('data:')) {
            img.src = base64;
          }
        }
      }

      // 2. Desactivar transformaciones 3D temporalmente para captura plana
      const cards = credencialElement.querySelectorAll('.card');
      const savedTransforms = [];
      const savedTransitions = [];

      cards.forEach((c) => {
        savedTransforms.push(c.style.transform);
        savedTransitions.push(c.style.transition);
        c.style.transform = 'none';
        c.style.transition = 'none';
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // 3. Renderizar DOM a PNG sin crash por CORS
      const dataUrl = await toPng(credencialElement, {
        quality: 0.98,
        pixelRatio: 2.5,
        cacheBust: false,
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      });

      // 4. Restaurar transformaciones
      cards.forEach((c, i) => {
        c.style.transform = savedTransforms[i] || '';
        c.style.transition = savedTransitions[i] || '';
      });

      // 5. Crear documento PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 10, 15, pdfWidth, pdfHeight);
      const safeNombre = (nombreEditable || 'Asesor').replace(/[^a-zA-Z0-9]/g, '_');
      const safeRol = (funcionEditable || 'Credencial').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Credencial_${safeNombre}_${safeRol}.pdf`;
      pdf.save(filename);

    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("No se pudo descargar el PDF automáticamente. Puedes usar el botón 'Imprimir' para guardar como PDF.");
    } finally {
      // 6. Restaurar URLs de las imágenes
      originalSrcs.forEach(({ img, src }) => {
        img.src = src;
      });
      downloading = false;
    }
  };

  const printCredencial = () => {
    window.print();
  };
</script>

<div class="flex flex-col items-center gap-6 w-full h-auto min-h-[600px] overflow-visible py-4 font-sans">
{#if showButtons}
  <!-- BARRA DE ACCIÓN SUPERIOR -->
  <div class="bar w-full max-w-4xl flex flex-col sm:flex-row gap-3 justify-between items-center p-3 sm:p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-casa-gold/30 shadow-lg text-sm print:hidden">
    <div class="flex items-center gap-2.5">
      <div class="p-2 bg-casa-gold/15 text-casa-dark rounded-xl border border-casa-gold/30">
        <ShieldCheck size={20} class="text-[#8c6a26]" />
      </div>
      <div>
        <span class="block text-xs font-black uppercase tracking-wider text-[#0c3641]">
          Credencial Oficial Casa Legal
        </span>
        <span class="text-[11px] text-gray-500 font-medium">
          {nombreEditable || 'Titular'} • <strong class="text-[#8c6a26]">{funcionEditable}</strong>
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-wrap justify-center">
      <!-- Botón para alternar panel de edición -->
      <button 
        type="button"
        onclick={() => showEditPanel = !showEditPanel}
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border {showEditPanel ? 'bg-[#0c3641] text-white border-[#0c3641] shadow-md' : 'bg-amber-50 text-[#8c6a26] border-casa-gold/50 hover:bg-amber-100'}"
      >
        <Edit3 size={14} />
        {showEditPanel ? 'Cerrar Edición' : 'Personalizar / Editar'}
        {#if showEditPanel}
          <ChevronUp size={14} />
        {:else}
          <ChevronDown size={14} />
        {/if}
      </button>

      <!-- Botón Descargar PDF -->
      <button 
        type="button"
        onclick={downloadPDF} 
        disabled={downloading} 
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#d9b25a] via-[#e8c875] to-[#c79a3c] text-[#0c3641] font-black text-xs uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
      >
        <Download size={14} />
        {downloading ? 'Generando...' : 'Descargar PDF'}
      </button>

      <!-- Botón Imprimir -->
      <button 
        type="button"
        onclick={printCredencial} 
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
      >
        <Printer size={14} />
        Imprimir
      </button>
    </div>
  </div>

  <!-- PANEL DE EDICIÓN FLOTANTE / EXPANDIBLE -->
  {#if showEditPanel}
    <div class="edit-panel w-full max-w-4xl bg-gradient-to-br from-white via-[#faf8f2] to-[#f4ede0] p-6 rounded-3xl border-2 border-casa-gold/40 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-300 print:hidden space-y-5">
      <div class="flex items-center justify-between border-b border-casa-gold/20 pb-4">
        <div class="flex items-center gap-2.5">
          <Sparkles size={20} class="text-[#8c6a26]" />
          <div>
            <h3 class="text-base font-extrabold text-[#0c3641]">Personalización en Tiempo Real de la Credencial</h3>
            <p class="text-xs text-gray-500">Modifica el nombre, asigna roles de líder o asesor y añade firma. Los cambios se visualizan inmediatamente.</p>
          </div>
        </div>
        <button 
          type="button" 
          onclick={resetData} 
          class="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors"
          title="Restablecer valores originales"
        >
          <RotateCcw size={13} /> Restablecer
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- NOMBRE DEL TITULAR (Sin salto de línea) -->
        <div class="space-y-1.5">
          <label class="block text-xs font-black uppercase tracking-wider text-[#0c3641] flex items-center justify-between">
            <span class="flex items-center gap-1.5"><User size={14} class="text-[#8c6a26]"/> Nombre en Credencial</span>
            <span class="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
              ✓ Sin salto de línea (Ajuste automático)
            </span>
          </label>
          <input 
            type="text" 
            bind:value={nombreEditable} 
            placeholder="Ej: LIC. CARLOS EDUARDO GUTIÉRREZ"
            class="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-casa-gold focus:ring-2 focus:ring-casa-gold/20 rounded-xl font-bold text-gray-800 text-sm uppercase tracking-wide transition-all shadow-sm outline-none"
          />
          <p class="text-[11px] text-gray-500">
            El texto se adapta automáticamente a una sola línea para evitar cortes en el frente de la credencial.
          </p>
        </div>

        <!-- FUNCIÓN / ROL -->
        <div class="space-y-1.5">
          <label class="block text-xs font-black uppercase tracking-wider text-[#0c3641] flex items-center justify-between">
            <span class="flex items-center gap-1.5"><Briefcase size={14} class="text-[#8c6a26]"/> Función o Cargo</span>
            <span class="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
              Formato Destacado
            </span>
          </label>
          <input 
            type="text" 
            bind:value={funcionEditable} 
            placeholder="Ej: LÍDER DE EQUIPO"
            class="w-full px-4 py-2.5 bg-white border border-gray-300 focus:border-casa-gold focus:ring-2 focus:ring-casa-gold/20 rounded-xl font-extrabold text-[#0c3641] text-sm uppercase tracking-wider transition-all shadow-sm outline-none"
          />
          <!-- PRESETS DE CARGOS RÁPIDOS -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider self-center mr-1">Rápidos:</span>
            {#each rolePresets as preset}
              <button 
                type="button"
                onclick={() => funcionEditable = preset}
                class="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border transition-all {funcionEditable === preset ? 'bg-[#0c3641] text-casa-gold border-[#0c3641] shadow-xs' : 'bg-white text-gray-600 border-gray-200 hover:border-casa-gold hover:text-[#0c3641]'}"
              >
                {preset}
              </button>
            {/each}
          </div>
        </div>

        <!-- CREDENCIAL N° Y VALIDEZ -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
              <Hash size={12} class="text-[#8c6a26]"/> N° Credencial
            </label>
            <input 
              type="text" 
              bind:value={credencialNumEditable} 
              placeholder="CLI-VERIFICADO"
              class="w-full px-3 py-2 bg-white border border-gray-300 focus:border-casa-gold rounded-xl font-bold text-xs uppercase text-gray-800 shadow-sm outline-none"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
              <Calendar size={12} class="text-[#8c6a26]"/> Válida Hasta
            </label>
            <input 
              type="text" 
              bind:value={validaHastaEditable} 
              placeholder="DICIEMBRE 2027"
              class="w-full px-3 py-2 bg-white border border-gray-300 focus:border-casa-gold rounded-xl font-bold text-xs uppercase text-gray-800 shadow-sm outline-none"
            />
          </div>
        </div>

        <!-- TELÉFONO Y CIUDAD -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
              <Phone size={12} class="text-[#8c6a26]"/> Teléfono
            </label>
            <input 
              type="text" 
              bind:value={telefonoEditable} 
              placeholder="+591 70000000"
              class="w-full px-3 py-2 bg-white border border-gray-300 focus:border-casa-gold rounded-xl font-bold text-xs text-gray-800 shadow-sm outline-none"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
              <MapPin size={12} class="text-[#8c6a26]"/> Sede / Ciudad
            </label>
            <input 
              type="text" 
              bind:value={ciudadEditable} 
              placeholder="La Paz - El Alto"
              class="w-full px-3 py-2 bg-white border border-gray-300 focus:border-casa-gold rounded-xl font-bold text-xs text-gray-800 shadow-sm outline-none"
            />
          </div>
        </div>
      </div>

      <!-- SECCIÓN FIRMA BLANCA Y DIGITAL -->
      <div class="p-3.5 bg-amber-500/10 rounded-2xl border border-casa-gold/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-white rounded-xl text-[#0c3641] shadow-xs border border-casa-gold/30">
            <PenTool size={16} />
          </div>
          <div>
            <h4 class="text-xs font-black uppercase tracking-wider text-[#0c3641]">Cuadro de Firma Blanco Institucional</h4>
            <p class="text-[11px] text-gray-600">
              El reverso cuenta con un área blanca limpia con línea de seguridad para firma física con bolígrafo, o puedes cargar una firma digitalizada.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <label class="cursor-pointer px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
            <Upload size={13} />
            <span>{signaturePreview ? 'Cambiar Firma Digital' : 'Cargar Firma PNG/JPG'}</span>
            <input type="file" accept="image/*" onchange={handleSignatureUpload} class="hidden" />
          </label>
          {#if signaturePreview}
            <button 
              type="button" 
              onclick={() => signaturePreview = null} 
              class="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold border border-red-200 transition-colors"
              title="Quitar firma digital (volver al cuadro en blanco)"
            >
              Quitar
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/if}

  <!-- CONTENEDOR 3D DE LAS TARJETAS (STAGE) -->
  <div class="stage" bind:this={credencialElement}>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#8c6a26"/><stop offset=".3" stop-color="#f3d98c"/><stop offset=".55" stop-color="#c79a3c"/><stop offset=".8" stop-color="#fff0b8"/><stop offset="1" stop-color="#8c6a26"/>
        </linearGradient>
        <linearGradient id="gf" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="340" y2="540">
          <stop offset="0" stop-color="#8c6a26"/><stop offset=".25" stop-color="#f3d98c"/><stop offset=".5" stop-color="#b98a30"/><stop offset=".75" stop-color="#fff0b8"/><stop offset="1" stop-color="#8c6a26"/>
        </linearGradient>
        <path id="dm" d="M0-4.5 4.5 0 0 4.5-4.5 0Z" fill="url(#gf)"/>
        <symbol id="frm" viewBox="0 0 340 540">
          <path d="M26 10H314L330 26V514L314 530H26L10 514V26Z" fill="none" stroke="url(#gf)" stroke-width="1.3"/>
          <path d="M31 17H309L323 31V509L309 523H31L17 509V31Z" fill="none" stroke="url(#gf)" stroke-width=".6" opacity=".75"/>
          <use href="#dm" x="170" y="10"/><use href="#dm" x="170" y="530"/><use href="#dm" x="10" y="270"/><use href="#dm" x="330" y="270"/>
          <g fill="none" stroke="url(#gf)" stroke-width=".7">
            <circle cx="31" cy="31" r="3"/><circle cx="309" cy="31" r="3"/><circle cx="31" cy="509" r="3"/><circle cx="309" cy="509" r="3"/>
            <path d="M40 17Q40 40 17 40M300 17Q300 40 323 40M40 523Q40 500 17 500M300 523Q300 500 323 500" opacity=".6"/>
          </g>
        </symbol>
      </defs>
    </svg>

    <!-- FRENTE DE LA CREDENCIAL -->
    <section class="card front" aria-label="Frente">
      <div class="guil"></div>
      <svg class="frame"><use href="#frm"/></svg>
      <div class="logo-ring">
        <svg viewBox="-60 -60 120 120">
          <defs><path id="rc" d="M0-47a47 47 0 1 1-.01 0"/></defs>
          <circle r="57" fill="none" stroke="url(#gg)" stroke-width=".9"/>
          <circle r="39" fill="none" stroke="url(#gg)" stroke-width=".6"/>
          <text font-size="5.4" font-family="Montserrat,Arial,sans-serif" font-weight="500" fill="url(#gg)">
            <textPath href="#rc" textLength="293" lengthAdjust="spacing">CASA LEGAL INMOBILIARIA • CASA LEGAL INMOBILIARIA •</textPath>
          </text>
        </svg>
        <img src={logoInmo} alt="Casa Legal Inmobiliaria" style="width:54px;height:54px;object-fit:contain;mix-blend-mode:multiply;border-radius:50%;filter:drop-shadow(0 2px 6px rgba(0,0,0,.5)); font-size:0;">
      </div>
      <div class="brand">CASA LEGAL</div>
      <div class="sub">INMOBILIARIA</div>
      
      <div class="photo">
        <div class="in">
          {#if asesor.foto || asesor.documentos?.foto}
            <img src={asesor.foto || asesor.documentos?.foto} alt="Foto" style="display:block;" />
          {:else}
            <svg viewBox="0 0 100 100" fill="#a09984"><circle cx="50" cy="38" r="19"/><path d="M8 100c0-26 18-38 42-38s42 12 42 38z"/></svg>
          {/if}
        </div>
      </div>
      
      <!-- NOMBRE: 100% SIN SALTO DE LÍNEA Y ESCALADO DINÁMICO -->
      <div class="name" style="font-size: {nameFontSize};" title={nombreEditable}>
        {nombreEditable || 'NOMBRE DEL TITULAR'}
      </div>

      <!-- FUNCIÓN: MÁS GRANDE, DESTACADA Y PRESTIGIOSA -->
      <div class="role-badge" title={funcionEditable}>
        <span class="role-text" style="font-size: {roleFontSize};">
          {funcionEditable || 'ASESOR INMOBILIARIO'}
        </span>
      </div>

      <div class="orn"><i></i></div>
      
      <div class="foot">
        <svg class="chip" viewBox="0 0 36 27">
          <rect x=".5" y=".5" width="35" height="26" rx="5" fill="url(#gg)"/>
          <g stroke="#4a3510" stroke-width=".8" fill="none" opacity=".8">
            <path d="M0 9h11v9H0M25 9h11M25 18h11M11 9V0M11 18v9M25 9V0M25 18v9M11 13.5h14"/>
            <rect x="11" y="9" width="14" height="9" rx="2"/>
          </g>
        </svg>
        <div class="meta">
          <div><small>Credencial n.°</small><span>{credencialNumEditable}</span></div>
          <div><small>Válida hasta</small><span>{validaHastaEditable}</span></div>
        </div>
      </div>
      <div class="sheen"></div><div class="sweep"></div>
    </section>

    <!-- REVERSO DE LA CREDENCIAL -->
    <section class="card back" aria-label="Reverso">
      <div class="guil"></div>
      <svg class="frame"><use href="#frm"/></svg>
      <div class="band">CASA LEGAL INMOBILIARIA</div>
      <div class="qrw">
        <div class="qr">
          <svg viewBox="0 0 29 29" shape-rendering="crispEdges"><path d="M0 0h1v1h-1zM1 0h1v1h-1zM2 0h1v1h-1zM3 0h1v1h-1zM4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM9 0h1v1h-1zM12 0h1v1h-1zM15 0h1v1h-1zM16 0h1v1h-1zM18 0h1v1h-1zM22 0h1v1h-1zM23 0h1v1h-1zM24 0h1v1h-1zM25 0h1v1h-1zM26 0h1v1h-1zM27 0h1v1h-1zM28 0h1v1h-1zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM11 1h1v1h-1zM13 1h1v1h-1zM14 1h1v1h-1zM16 1h1v1h-1zM18 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM10 2h1v1h-1zM11 2h1v1h-1zM13 2h1v1h-1zM15 2h1v1h-1zM19 2h1v1h-1zM20 2h1v1h-1zM22 2h1v1h-1zM24 2h1v1h-1zM25 2h1v1h-1zM26 2h1v1h-1zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM8 3h1v1h-1zM9 3h1v1h-1zM10 3h1v1h-1zM16 3h1v1h-1zM17 3h1v1h-1zM22 3h1v1h-1zM24 3h1v1h-1zM25 3h1v1h-1zM26 3h1v1h-1zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM11 4h1v1h-1zM12 4h1v1h-1zM15 4h1v1h-1zM16 4h1v1h-1zM18 4h1v1h-1zM19 4h1v1h-1zM20 4h1v1h-1zM22 4h1v1h-1zM24 4h1v1h-1zM25 4h1v1h-1zM26 4h1v1h-1zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h1v1h-1zM12 5h1v1h-1zM15 5h1v1h-1zM18 5h1v1h-1zM20 5h1v1h-1zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM23 6h1v1h-1zM24 6h1v1h-1zM25 6h1v1h-1zM26 6h1v1h-1zM27 6h1v1h-1zM28 6h1v1h-1zM8 7h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM11 7h1v1h-1zM12 7h1v1h-1zM14 7h1v1h-1zM15 7h1v1h-1zM16 7h1v1h-1zM0 8h1v1h-1zM6 8h1v1h-1zM8 8h1v1h-1zM9 8h1v1h-1zM10 8h1v1h-1zM16 8h1v1h-1zM17 8h1v1h-1zM18 8h1v1h-1zM19 8h1v1h-1zM21 8h1v1h-1zM22 8h1v1h-1zM25 8h1v1h-1zM26 8h1v1h-1zM27 8h1v1h-1zM0 9h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM5 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM18 9h1v1h-1zM19 9h1v1h-1zM23 9h1v1h-1zM24 9h1v1h-1zM26 9h1v1h-1zM27 9h1v1h-1zM1 10h1v1h-1zM2 10h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM9 10h1v1h-1zM10 10h1v1h-1zM11 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM17 10h1v1h-1zM22 10h1v1h-1zM23 10h1v1h-1zM24 10h1v1h-1zM2 11h1v1h-1zM4 11h1v1h-1zM5 11h1v1h-1zM8 11h1v1h-1zM10 11h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM18 11h1v1h-1zM20 11h1v1h-1zM24 11h1v1h-1zM25 11h1v1h-1zM0 12h1v1h-1zM3 12h1v1h-1zM4 12h1v1h-1zM5 12h1v1h-1zM6 12h1v1h-1zM9 12h1v1h-1zM10 12h1v1h-1zM12 12h1v1h-1zM13 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM20 12h1v1h-1zM22 12h1v1h-1zM23 12h1v1h-1zM28 12h1v1h-1zM1 13h1v1h-1zM2 13h1v1h-1zM3 13h1v1h-1zM4 13h1v1h-1zM7 13h1v1h-1zM8 13h1v1h-1zM9 13h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM12 13h1v1h-1zM16 13h1v1h-1zM18 13h1v1h-1zM19 13h1v1h-1zM20 13h1v1h-1zM22 13h1v1h-1zM23 13h1v1h-1zM24 13h1v1h-1zM27 13h1v1h-1zM28 13h1v1h-1zM1 14h1v1h-1zM2 14h1v1h-1zM3 14h1v1h-1zM4 14h1v1h-1zM5 14h1v1h-1zM6 14h1v1h-1zM11 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM20 14h1v1h-1zM23 14h1v1h-1zM25 14h1v1h-1zM26 14h1v1h-1zM0 15h1v1h-1zM2 15h1v1h-1zM7 15h1v1h-1zM11 15h1v1h-1zM15 15h1v1h-1zM19 15h1v1h-1zM21 15h1v1h-1zM22 15h1v1h-1zM24 15h1v1h-1zM26 15h1v1h-1zM28 15h1v1h-1zM1 16h1v1h-1zM6 16h1v1h-1zM7 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1zM19 16h1v1h-1zM23 16h1v1h-1zM25 16h1v1h-1zM26 16h1v1h-1zM0 17h1v1h-1zM3 17h1v1h-1zM4 17h1v1h-1zM7 17h1v1h-1zM8 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM17 17h1v1h-1zM18 17h1v1h-1zM19 17h1v1h-1zM20 17h1v1h-1zM22 17h1v1h-1zM23 17h1v1h-1zM24 17h1v1h-1zM26 17h1v1h-1zM27 17h1v1h-1zM28 17h1v1h-1zM0 18h1v1h-1zM1 18h1v1h-1zM5 18h1v1h-1zM6 18h1v1h-1zM7 18h1v1h-1zM8 18h1v1h-1zM9 18h1v1h-1zM15 18h1v1h-1zM19 18h1v1h-1zM20 18h1v1h-1zM22 18h1v1h-1zM24 18h1v1h-1zM25 18h1v1h-1zM28 18h1v1h-1zM0 19h1v1h-1zM3 19h1v1h-1zM4 19h1v1h-1zM5 19h1v1h-1zM7 19h1v1h-1zM9 19h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM19 19h1v1h-1zM21 19h1v1h-1zM22 19h1v1h-1zM24 19h1v1h-1zM0 20h1v1h-1zM2 20h1v1h-1zM5 20h1v1h-1zM6 20h1v1h-1zM8 20h1v1h-1zM9 20h1v1h-1zM14 20h1v1h-1zM15 20h1v1h-1zM17 20h1v1h-1zM20 20h1v1h-1zM21 20h1v1h-1zM22 20h1v1h-1zM23 20h1v1h-1zM24 20h1v1h-1zM26 20h1v1h-1zM27 20h1v1h-1zM28 20h1v1h-1zM8 21h1v1h-1zM9 21h1v1h-1zM10 21h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM14 21h1v1h-1zM17 21h1v1h-1zM18 21h1v1h-1zM20 21h1v1h-1zM24 21h1v1h-1zM25 21h1v1h-1zM0 22h1v1h-1zM1 22h1v1h-1zM2 22h1v1h-1zM3 22h1v1h-1zM4 22h1v1h-1zM5 22h1v1h-1zM6 22h1v1h-1zM9 22h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM19 22h1v1h-1zM20 22h1v1h-1zM22 22h1v1h-1zM24 22h1v1h-1zM25 22h1v1h-1zM26 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM9 23h1v1h-1zM10 23h1v1h-1zM14 23h1v1h-1zM15 23h1v1h-1zM16 23h1v1h-1zM19 23h1v1h-1zM20 23h1v1h-1zM24 23h1v1h-1zM0 24h1v1h-1zM2 24h1v1h-1zM3 24h1v1h-1zM4 24h1v1h-1zM6 24h1v1h-1zM9 24h1v1h-1zM11 24h1v1h-1zM13 24h1v1h-1zM14 24h1v1h-1zM17 24h1v1h-1zM18 24h1v1h-1zM19 24h1v1h-1zM20 24h1v1h-1zM21 24h1v1h-1zM22 24h1v1h-1zM23 24h1v1h-1zM24 24h1v1h-1zM25 24h1v1h-1zM0 25h1v1h-1zM2 25h1v1h-1zM3 25h1v1h-1zM4 25h1v1h-1zM6 25h1v1h-1zM14 25h1v1h-1zM17 25h1v1h-1zM18 25h1v1h-1zM21 25h1v1h-1zM25 25h1v1h-1zM26 25h1v1h-1zM27 25h1v1h-1zM0 26h1v1h-1zM2 26h1v1h-1zM3 26h1v1h-1zM4 26h1v1h-1zM6 26h1v1h-1zM10 26h1v1h-1zM13 26h1v1h-1zM14 26h1v1h-1zM15 26h1v1h-1zM16 26h1v1h-1zM17 26h1v1h-1zM19 26h1v1h-1zM20 26h1v1h-1zM21 26h1v1h-1zM22 26h1v1h-1zM23 26h1v1h-1zM24 26h1v1h-1zM25 26h1v1h-1zM26 26h1v1h-1zM27 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM12 27h1v1h-1zM16 27h1v1h-1zM17 27h1v1h-1zM18 27h1v1h-1zM22 27h1v1h-1zM23 27h1v1h-1zM25 27h1v1h-1zM26 27h1v1h-1zM28 27h1v1h-1zM0 28h1v1h-1zM1 28h1v1h-1zM2 28h1v1h-1zM3 28h1v1h-1zM4 28h1v1h-1zM5 28h1v1h-1zM6 28h1v1h-1zM8 28h1v1h-1zM12 28h1v1h-1zM15 28h1v1h-1zM19 28h1v1h-1zM24 28h1v1h-1zM26 28h1v1h-1z" fill="#06231b"/></svg>
        </div>
      </div>
      <div class="vt">Escanea para verificar esta credencial</div>
      <div class="web">casalegalbolivia.com</div>
      <div class="contact">
        <div><i></i><span>{telefonoEditable}</span></div>
        <div><i></i><span>contacto@casalegalbolivia.com</span></div>
        <div><i></i><span>{ciudadEditable}, Bolivia</span></div>
      </div>
      
      <!-- CUADRO DE FIRMA BLANCO INSTITUCIONAL -->
      <div class="sign-wrapper">
        <div class="sign-box">
          {#if signaturePreview}
            <img src={signaturePreview} alt="Firma del Titular" class="sign-img" />
          {:else}
            <div class="sign-guide-line"></div>
          {/if}
          <span class="sign-label">FIRMA DEL TITULAR</span>
        </div>
        <div class="sign-sublabel">Autorización Oficial • Casa Legal Bolivia</div>
      </div>

      <p class="legal">Esta credencial es personal e intransferible. Identifica a su titular como representante de Casa Legal Inmobiliaria. Si la encuentras, devuélvela a la dirección indicada.</p>
      <div class="sheen"></div><div class="sweep"></div>
    </section>
  </div>
</div>



<style>
  :global(:root) {
    --gold: linear-gradient(135deg, #7d5d20 0%, #d9b25a 24%, #fff1bd 46%, #c79a3c 66%, #8c6a26 84%, #e8c875 100%);
    --gt: #dfbc66;
    --g3: #fbe9ae;
    --ivory: #f6f1e3;
    --deep: #010906;
    --serif: "Cinzel", "Palatino Linotype", Georgia, serif;
    --sans: "Montserrat", "Helvetica Neue", Arial, sans-serif;
  }
  
  .stage {
    display: flex;
    gap: 40px;
    flex-wrap: wrap;
    justify-content: center;
    perspective: 1100px;
    color: var(--ivory);
    font-family: var(--sans);
  }
  
  .card {
    --mx: 50%;
    --my: 30%;
    position: relative;
    width: 340px;
    height: 540px;
    border-radius: 22px;
    overflow: hidden;
    isolation: isolate;
    background: radial-gradient(ellipse at 50% 26%, #0c3a2d 0%, #072219 38%, #020d09 72%, #010604 100%);
    box-shadow: 0 40px 70px -28px #000, 0 0 0 1px #000, 0 0 40px -10px rgba(217,178,90,.18);
    transition: transform .25s ease-out;
    will-change: transform;
  }
  
  .card:hover {
    transform: rotateY(0deg) rotateX(0deg);
  }
  
  .card > * {
    position: relative;
    z-index: 2;
  }
  
  .guil {
    position: absolute !important;
    inset: 0;
    z-index: 0 !important;
    background: repeating-radial-gradient(circle at 18% 22%, transparent 0 6px, rgba(223,188,102,.075) 6px 7px),
                repeating-radial-gradient(circle at 84% 74%, transparent 0 6px, rgba(223,188,102,.075) 6px 7px);
    -webkit-mask: radial-gradient(ellipse at 50% 50%, #000 20%, transparent 78%);
    mask: radial-gradient(ellipse at 50% 50%, #000 20%, transparent 78%);
  }
  
  .frame {
    position: absolute !important;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 3 !important;
    pointer-events: none;
  }
  
  .sheen {
    position: absolute !important;
    inset: 0;
    z-index: 5 !important;
    pointer-events: none;
    background: radial-gradient(circle at var(--mx) var(--my), rgba(255,240,190,.26), transparent 42%),
                linear-gradient(115deg, transparent 30%, rgba(120,255,214,.06) 45%, rgba(255,214,120,.09) 55%, transparent 70%);
    mix-blend-mode: soft-light;
  }
  
  .sweep {
    position: absolute !important;
    inset: 0;
    z-index: 6 !important;
    pointer-events: none;
    background: linear-gradient(105deg, transparent 42%, rgba(255,238,180,.38) 50%, transparent 58%);
    transform: translateX(-130%);
    animation: sweep 1.9s .5s cubic-bezier(.3,.6,.2,1) 1 forwards;
  }
  
  @keyframes sweep {
    to { transform: translateX(130%) }
  }
  
  .front {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 30px 0;
  }
  
  .logo-ring {
    width: 104px;
    height: 104px;
    display: grid;
    place-items: center;
    flex: none;
    box-shadow: none !important;
    --tw-ring-shadow: none !important;
    --tw-ring-offset-shadow: none !important;
  }
  
  .logo-ring svg {
    position: absolute;
    width: 104px;
    height: 104px;
  }
  
  .brand {
    font-family: var(--serif);
    font-weight: 700;
    font-size: 23px;
    letter-spacing: .16em;
    margin-top: 4px;
    padding-left: .16em;
    background: var(--gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .sub {
    font-size: 8.5px;
    letter-spacing: .62em;
    color: var(--gt);
    margin-top: 3px;
    padding-left: .62em;
    font-weight: 500;
  }
  
  .photo {
    margin-top: 14px;
    width: 148px;
    height: 186px;
    border-radius: 74px 74px 14px 14px;
    padding: 3px;
    background: var(--gold);
    position: relative;
    box-shadow: 0 0 0 5px #05160f, 0 0 0 6px rgba(223,188,102,.7), 0 18px 30px -10px #000;
    flex: none;
  }
  
  .photo .in {
    width: 100%;
    height: 100%;
    border-radius: 71px 71px 11px 11px;
    background: linear-gradient(#e9e4d6, #c9c2ac);
    overflow: hidden;
    display: grid;
    place-items: end center;
  }
  
  .photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .photo svg {
    width: 80%;
  }
  
  .name {
    font-family: var(--serif);
    font-weight: 700;
    letter-spacing: .05em;
    line-height: 1.15;
    margin-top: 16px;
    text-align: center;
    background: var(--gold);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    width: 100%;
    max-width: 280px;
    white-space: nowrap !important;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
    display: block;
  }
  
  .role-badge {
    margin-top: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 280px;
    padding: 3px 14px;
    border-radius: 9999px;
    background: rgba(12, 58, 45, 0.65);
    border: 1px solid rgba(223, 188, 102, 0.55);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 240, 190, 0.2);
    white-space: nowrap !important;
  }

  .role-text {
    font-weight: 800;
    letter-spacing: .22em;
    color: #fff6da;
    text-align: center;
    text-transform: uppercase;
    white-space: nowrap !important;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 250px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.9), 0 0 10px rgba(223, 188, 102, 0.4);
  }
  
  .orn {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 11px 0 10px;
    width: 150px;
  }
  
  .orn::before, .orn::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #d9b25a);
  }
  
  .orn::after {
    transform: scaleX(-1);
  }
  
  .orn i {
    width: 5px;
    height: 5px;
    background: var(--gold);
    transform: rotate(45deg);
  }
  
  .foot {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  
  .chip {
    width: 36px;
    height: 27px;
    flex: none;
  }
  
  .meta {
    display: grid;
    grid-template-columns: auto auto;
    gap: 4px 20px;
    font-size: 10px;
  }
  
  .meta small {
    display: block;
    font-size: 8px;
    letter-spacing: .12em;
    color: var(--gt);
    margin-bottom: 1px;
  }
  
  .meta span {
    font-weight: 500;
    letter-spacing: .08em;
  }
  
  .back {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 32px;
    text-align: center;
  }
  
  .band {
    position: absolute !important;
    left: 17px;
    right: 17px;
    top: 36px;
    height: 38px;
    background: linear-gradient(#000, #07130e);
    display: grid;
    place-items: center;
    font-family: var(--serif);
    font-size: 9.5px;
    letter-spacing: .5em;
    padding-left: .5em;
    color: var(--gt);
    border-block: 1px solid rgba(223,188,102,.55);
    box-shadow: 0 0 0 3px #010604, 0 0 0 4px rgba(223,188,102,.25);
  }
  
  .qrw {
    position: relative;
    margin-top: 100px;
    padding: 9px;
    background: var(--ivory);
    border-radius: 6px;
    box-shadow: 0 14px 28px -10px #000;
  }
  
  .qrw::before {
    content: "";
    position: absolute;
    inset: -7px;
    border-radius: 10px;
    border: 1px solid rgba(223,188,102,.8);
    -webkit-mask: linear-gradient(90deg, #000 22px, transparent 22px calc(100% - 22px), #000 0), linear-gradient(#000 22px, transparent 22px calc(100% - 22px), #000 0);
    -webkit-mask-composite: source-over;
    mask: linear-gradient(90deg, #000 22px, transparent 22px calc(100% - 22px), #000 0), linear-gradient(#000 22px, transparent 22px calc(100% - 22px), #000 0);
  }
  
  .qr {
    width: 132px;
    height: 132px;
  }
  
  .qr svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  
  .vt {
    font-size: 9.5px;
    color: #aebfb7;
    margin-top: 16px;
    letter-spacing: .04em;
  }
  
  .web {
    font-size: 12px;
    letter-spacing: .16em;
    margin-top: 5px;
    color: var(--g3);
    font-weight: 500;
  }
  
  .contact {
    margin-top: 16px;
    display: grid;
    gap: 8px;
    font-size: 11px;
    letter-spacing: .04em;
  }
  
  .contact div {
    display: flex;
    gap: 9px;
    justify-content: center;
    align-items: center;
  }
  
  .contact i {
    width: 4px;
    height: 4px;
    transform: rotate(45deg);
    background: var(--gold);
    flex: none;
  }
  
  /* CUADRO DE FIRMA BLANCO INSTITUCIONAL */
  .sign-wrapper {
    width: 220px;
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
  }

  .sign-box {
    width: 100%;
    height: 52px;
    background: #ffffff !important;
    border-radius: 6px;
    border: 1.5px solid #dfbc66;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.06), 0 4px 14px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding: 4px 8px 4px;
    position: relative;
    overflow: hidden;
    background-image: 
      radial-gradient(circle at 50% 50%, rgba(223, 188, 102, 0.08) 0%, transparent 65%),
      repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0, 0, 0, 0.015) 8px, rgba(0, 0, 0, 0.015) 16px) !important;
  }

  .sign-img {
    max-height: 34px;
    max-width: 90%;
    object-fit: contain;
    mix-blend-mode: multiply;
    margin-bottom: 2px;
  }

  .sign-guide-line {
    width: 85%;
    height: 1px;
    border-top: 1px dashed #64748b;
    margin-bottom: 4px;
    opacity: 0.75;
  }

  .sign-label {
    font-size: 7.5px;
    font-weight: 800;
    letter-spacing: .2em;
    color: #0f172a !important;
    text-transform: uppercase;
    line-height: 1;
  }

  .sign-sublabel {
    font-size: 7px;
    letter-spacing: .12em;
    color: #9fb2a9;
    margin-top: 4px;
    text-transform: uppercase;
  }
  
  .legal {
    font-size: 8px;
    line-height: 1.55;
    color: #9fb2a9;
    margin-top: 10px;
    max-width: 236px;
  }
  
  @media print {
    @page { size: A4; margin: 12mm; }
    .bar, .edit-panel, .print\:hidden { display: none !important; }
    .stage { gap: 10mm; perspective: none; }
    .card { transform: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; box-shadow: none; }
    .sheen, .sweep { display: none; }
  }
</style>
