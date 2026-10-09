<script>
  import { ArrowLeft, Sparkles, Download, LayoutTemplate, Smartphone, LayoutGrid, Copy, Check, FileText, Image as LucideImage, MapPin, Bed, Bath, Ruler, User } from 'lucide-svelte';
  import { page } from '$app/state';
  import { onMount, tick } from 'svelte';
  import { db } from '#lib/firebase';
  import { doc, getDoc } from 'firebase/firestore';
  import { authState } from '#lib/authStore.svelte.js';
  import html2canvas from 'html2canvas';
  import LogoCasaLegal from '#lib/assets/estiloCasaLegal/logoCasaLegal.jpg';

  let property = $state(null);
  let loading = $state(true);
  
  let studioTab = $state('flyer');
  let selectedFormat = $state('facebook'); 
  let selectedStyle = $state(1); // 1 al 10
  let selectedImage = $state(''); 
  let customHeadline = $state('GRAN OPORTUNIDAD'); 
  
  let copyPrompt = $state('');
  let generatedLongCopy = $state('');
  let isGeneratingCopy = $state(false);
  let textCopied = $state(false);
  let isDownloading = $state(false);

  let canvasWidth = $derived(1080);
  let canvasHeight = $derived(selectedFormat === 'tiktok' ? 1920 : 1080);
  let previewScale = $derived(selectedFormat === 'tiktok' ? 0.35 : 0.45);

  let agentPhoto = $derived(authState.profile?.documentos?.foto || null);

  onMount(async () => {
    try {
      const propId = page.params.id;
      const docRef = doc(db, 'inmuebles', propId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        property = { id: snap.id, ...snap.data() };
        selectedImage = property.fotoPrincipal;
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  });

  const generateLongCopy = async () => {
    isGeneratingCopy = true;
    await new Promise(resolve => setTimeout(resolve, 600)); 
    const baseCopy = `🔥 ¡NUEVA PROPIEDAD! 🔥\n\nIncreíble ${property.tipoInmueble} en ${property.tipoOperacion.toLowerCase()} ubicado en ${property.zona}, ${property.ciudad}.\n\n✨ CARACTERÍSTICAS:\n🛏️ ${property.dormitoriosSuite + property.dormitoriosEstandar} Habitaciones\n🛁 ${property.banosCompletos} Baños\n📏 ${property.supConstruida || property.supTerreno} m² Área\n🚗 ${property.estacionamientos} Parqueos\n\n💰 PRECIO OFICIAL: $${property.precioLista}\n\n${copyPrompt ? `🎯 Nota: ${copyPrompt}\n\n` : ''}📲 ¡Escríbeme para agendar tu visita!\n👤 ${property.agenteNombre} - Casa Legal Inmobiliaria`;
    generatedLongCopy = baseCopy;
    isGeneratingCopy = false;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLongCopy);
    textCopied = true;
    setTimeout(() => textCopied = false, 2000);
  };

  // Convertir imagen a Base64 para evitar bloqueos CORS en html2canvas
  const getBase64Image = async (url) => {
    if (!url) return '';
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("No se pudo convertir a base64, usando URL original:", e);
      return url; // fallback
    }
  };

  const downloadFlyer = async () => {
    isDownloading = true;
    await tick();
    
    // Preparar imágenes seguras en el nodo oculto
    const flyerElement = document.getElementById('flyer-render-node');
    const images = flyerElement.getElementsByTagName('img');
    for (let img of images) {
      if (img.src && img.src.startsWith('http') && !img.src.includes('logoCasaLegal')) {
        img.src = await getBase64Image(img.src);
      }
    }

    try {
      const canvas = await html2canvas(flyerElement, { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0c3641',
        width: canvasWidth, 
        height: canvasHeight 
      });
      const url = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = `Flyer_Estilo${selectedStyle}_${property.id.substring(0,5)}.jpg`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error al descargar la imagen. Por favor intenta de nuevo.");
    } finally {
      isDownloading = false;
    }
  };

  const allPhotos = $derived(property ? [property.fotoPrincipal, ...(property.fotosSecundarias || [])] : []);
  const stylesList = [1,2,3,4,5,6,7,8,9,10];
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-screen bg-[#f4f7f6]">
    <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0c3641]"></div>
  </div>
{:else if property}
  <div class="min-h-screen bg-[#f4f7f6] flex flex-col font-sans">
    
    <header class="bg-white px-8 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div class="flex items-center gap-4">
        <button type="button" onclick={() => history.back()} class="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-200">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 class="text-xl font-extrabold text-[#0c3641] flex items-center gap-2">Studio de Flyers V2</h1>
          <p class="text-[11px] text-gray-500 uppercase font-bold">Renderizado Perfecto</p>
        </div>
      </div>
      
      <div class="flex bg-gray-100 p-1 rounded-xl">
        <button onclick={() => studioTab = 'flyer'} class="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all {studioTab === 'flyer' ? 'bg-white text-[#0c3641] shadow' : 'text-gray-500'}">
          <LucideImage size={16}/> Diseños Pro (10)
        </button>
        <button onclick={() => studioTab = 'copy'} class="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all {studioTab === 'copy' ? 'bg-white text-[#0c3641] shadow' : 'text-gray-500'}">
          <FileText size={16}/> Copy de Venta
        </button>
      </div>

      {#if studioTab === 'flyer'}
        <button onclick={downloadFlyer} disabled={isDownloading} class="px-6 py-3 bg-[#0c3641] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50">
          {#if isDownloading}<div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> Procesando Foto...{:else}<Download size={16} /> Descargar HD{/if}
        </button>
      {:else}
        <div class="w-32"></div>
      {/if}
    </header>

    <div class="flex-1 flex overflow-hidden">
      
      <!-- CONTROLES -->
      <div class="w-full lg:w-[400px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div class="p-6 space-y-6">
          
          {#if studioTab === 'flyer'}
            <div>
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Formato</h3>
              <div class="flex gap-2">
                <button onclick={() => selectedFormat = 'facebook'} class="flex-1 py-3 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 {selectedFormat === 'facebook' ? 'border-[#0c3641] bg-[#0c3641]/5 text-[#0c3641]' : 'border-gray-200 text-gray-500'}">
                  <LayoutGrid size={20}/> <span class="text-[10px] font-bold uppercase">Cuadrado</span>
                </button>
                <button onclick={() => selectedFormat = 'tiktok'} class="flex-1 py-3 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 {selectedFormat === 'tiktok' ? 'border-[#0c3641] bg-[#0c3641]/5 text-[#0c3641]' : 'border-gray-200 text-gray-500'}">
                  <Smartphone size={20}/> <span class="text-[10px] font-bold uppercase">Vertical</span>
                </button>
              </div>
            </div>

            <div>
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Titular Personalizado</h3>
              <input type="text" bind:value={customHeadline} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0c3641] outline-none text-sm font-black text-gray-700 uppercase" maxlength="25"/>
            </div>

            <div>
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Foto del Inmueble</h3>
              <div class="flex gap-2 overflow-x-auto pb-2">
                {#each allPhotos as foto}
                  <button type="button" onclick={() => selectedImage = foto} class="shrink-0 w-20 h-20 rounded-lg overflow-hidden border-[3px] {selectedImage === foto ? 'border-[#D4AF37]' : 'border-transparent opacity-50'}">
                    <img src={foto} alt="Thumb" class="w-full h-full object-cover" crossorigin="anonymous" />
                  </button>
                {/each}
              </div>
            </div>

            <div>
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Colección de 10 Diseños Profesionales</h3>
              <div class="grid grid-cols-2 gap-3">
                {#each stylesList as styleId}
                  <button onclick={() => selectedStyle = styleId} class="p-3 rounded-xl border-2 text-left transition-all {selectedStyle === styleId ? 'border-[#D4AF37] bg-[#0c3641] text-white' : 'border-gray-200 bg-gray-50 text-[#0c3641]'}">
                    <span class="text-xs font-bold uppercase tracking-wider block text-center">Diseño {styleId}</span>
                  </button>
                {/each}
              </div>
            </div>

          {:else}
            <!-- COPYWRITER -->
            <div class="animate-in fade-in">
              <div class="space-y-4">
                <label class="text-xs font-bold text-gray-400 uppercase block">Instrucciones extra (Opcional)</label>
                <textarea bind:value={copyPrompt} placeholder="Ej: Se aceptan mascotas..." rows="3" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#0c3641] outline-none text-sm"></textarea>
                <button onclick={generateLongCopy} disabled={isGeneratingCopy} class="w-full py-4 bg-[#D4AF37] text-[#0c3641] rounded-xl text-sm font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50">
                  {#if isGeneratingCopy}<div class="animate-spin h-5 w-5 border-2 border-[#0c3641] border-t-transparent rounded-full"></div>{:else}<FileText size={18}/> Generar Texto{/if}
                </button>
              </div>
            </div>
          {/if}
          
        </div>
      </div>

      <!-- ÁREA DEL FLYER (PREVIEW) -->
      <div class="flex-1 bg-gray-300 flex items-center justify-center overflow-y-auto py-12" style="background-image: radial-gradient(circle, #a0aec0 1px, transparent 1px); background-size: 20px 20px;">
        {#if studioTab === 'flyer'}
          <div class="relative shadow-2xl bg-white overflow-hidden origin-top" style="width: {canvasWidth * previewScale}px; height: {canvasHeight * previewScale}px;">
            <div style="transform: scale({previewScale}); transform-origin: top left; width: {canvasWidth}px; height: {canvasHeight}px;">
              {@render flyerContent()}
            </div>
          </div>
        {:else}
          <div class="w-full max-w-2xl bg-white p-10 rounded-[2rem] shadow-xl">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-bold text-[#0c3641]">Texto Listo</h3>
              <button onclick={copyToClipboard} class="px-4 py-2 bg-gray-100 text-[#0c3641] rounded-lg text-sm font-bold flex items-center gap-2">
                {#if textCopied}<Check size={16} class="text-green-600"/> Copiado{:else}<Copy size={16}/> Copiar{/if}
              </button>
            </div>
            <div class="bg-gray-50 p-6 rounded-2xl whitespace-pre-wrap text-[#0c3641] font-medium border border-gray-200 h-[60vh] overflow-y-auto">{generatedLongCopy || 'Genera el texto primero.'}</div>
          </div>
        {/if}
      </div>

    </div>
  </div>

  <!-- NODO OCULTO DE RENDERIZADO 1:1 PERFECTO PARA HTML2CANVAS -->
  <!-- Esto garantiza que html2canvas no se maree con el transform scale del preview -->
  <div class="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none">
    <div id="flyer-render-node" style="width: {canvasWidth}px; height: {canvasHeight}px;">
      {@render flyerContent()}
    </div>
  </div>
{/if}

<!-- SNIPPET DEL CONTENIDO DEL FLYER (USADO EN PREVIEW Y EN NODO OCULTO) -->
{#snippet flyerContent()}
  <div class="w-full h-full bg-[#0c3641] font-sans flex flex-col relative overflow-hidden">
    
    <!-- LÓGICA DE LOS 10 ESTILOS -->
    
    {#if selectedStyle === 1}
      <!-- Estilo 1: Bloques Sólidos (El más robusto) -->
      <div class="h-[60%] w-full relative border-b-[15px] border-[#D4AF37]">
        <img src={selectedImage} class="w-full h-full object-cover" crossorigin="anonymous" />
        <div class="absolute top-10 left-10 bg-white p-4 rounded-xl"><img src={LogoCasaLegal} class="h-16" crossorigin="anonymous"/></div>
        <div class="absolute top-10 right-10 bg-[#D4AF37] px-8 py-3 rounded-full font-black text-[#0c3641] text-3xl uppercase">{property.tipoOperacion}</div>
      </div>
      <div class="h-[40%] w-full bg-[#0c3641] p-12 flex flex-col justify-between">
        <h1 class="text-[#D4AF37] text-[80px] font-black uppercase leading-[1.1] truncate">{customHeadline}</h1>
        <p class="text-white text-4xl font-light italic truncate">{property.tituloPropiedad}</p>
        <div class="flex justify-between items-end mt-4">
          <div>
            <p class="text-gray-300 text-3xl font-bold mb-6"><MapPin size={32} class="inline"/> {property.zona}</p>
            <div class="flex gap-8 text-white text-3xl font-bold">
              <span>{property.dormitoriosSuite + property.dormitoriosEstandar} <Bed size={32} class="inline text-[#D4AF37]"/></span>
              <span>{property.banosCompletos} <Bath size={32} class="inline text-[#D4AF37]"/></span>
              <span>{property.supConstruida || property.supTerreno}m² <Ruler size={32} class="inline text-[#D4AF37]"/></span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[#D4AF37] text-2xl font-bold uppercase mb-2">Precio Inicial</p>
            <p class="text-white text-[80px] font-black leading-none">${property.precioLista}</p>
          </div>
        </div>
      </div>

    {:else if selectedStyle === 2}
      <!-- Estilo 2: Todo Blanco -->
      <div class="w-full h-full bg-white border-[30px] border-[#0c3641] flex flex-col p-12">
        <div class="flex justify-between items-center mb-8">
          <img src={LogoCasaLegal} class="h-20" crossorigin="anonymous" />
          <p class="text-[#0c3641] text-4xl font-black uppercase tracking-widest">{property.tipoOperacion}</p>
        </div>
        <div class="flex-1 rounded-[3rem] overflow-hidden border-8 border-[#D4AF37] relative">
          <img src={selectedImage} class="w-full h-full object-cover" crossorigin="anonymous" />
          <div class="absolute bottom-8 right-8 bg-white px-10 py-4 rounded-3xl font-black text-6xl text-[#0c3641] border-4 border-[#D4AF37]">${property.precioLista}</div>
        </div>
        <div class="mt-8">
          <h1 class="text-[#0c3641] text-[85px] font-black uppercase leading-none truncate">{customHeadline}</h1>
          <p class="text-gray-500 text-4xl font-bold mt-2 truncate">{property.tituloPropiedad}</p>
          <div class="flex justify-between items-center mt-6">
            <p class="text-[#D4AF37] text-3xl font-black"><MapPin size={32} class="inline"/> {property.zona}</p>
            <div class="flex gap-6 text-[#0c3641] text-3xl font-bold bg-gray-100 px-8 py-4 rounded-2xl">
              <span>{property.dormitoriosSuite + property.dormitoriosEstandar} <Bed size={32} class="inline"/></span>
              <span>{property.banosCompletos} <Bath size={32} class="inline"/></span>
              <span>{property.supConstruida || property.supTerreno}m²</span>
            </div>
          </div>
        </div>
      </div>

    {:else if selectedStyle === 3}
      <!-- Estilo 3: Minimalista Oro -->
      <div class="w-full h-full bg-[#D4AF37] flex flex-col items-center justify-center p-12">
        <div class="w-full h-[90%] bg-[#0c3641] rounded-[4rem] flex flex-col p-12 relative overflow-hidden shadow-2xl">
          <img src={selectedImage} class="absolute inset-0 w-full h-full object-cover opacity-50" crossorigin="anonymous" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#0c3641] to-[#0c3641]/20"></div>
          <div class="relative z-10 flex flex-col h-full justify-between">
            <div class="flex justify-between items-center">
              <div class="bg-white p-4 rounded-2xl"><img src={LogoCasaLegal} class="h-16" crossorigin="anonymous" /></div>
              <p class="text-[#D4AF37] text-4xl font-black uppercase">{property.tipoOperacion}</p>
            </div>
            <div class="text-center">
              <h1 class="text-white text-[110px] font-black uppercase leading-[1] mb-4 truncate">{customHeadline}</h1>
              <p class="text-[#D4AF37] text-5xl font-bold mb-8">${property.precioLista}</p>
              <div class="flex justify-center gap-10 text-white text-3xl font-bold border-t border-[#D4AF37]/50 pt-8">
                <span><Bed size={32} class="inline text-[#D4AF37]"/> {property.dormitoriosSuite + property.dormitoriosEstandar}</span>
                <span><Bath size={32} class="inline text-[#D4AF37]"/> {property.banosCompletos}</span>
                <span><MapPin size={32} class="inline text-[#D4AF37]"/> {property.zona}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    {:else if selectedStyle === 4}
      <!-- Estilo 4: Mitad y Mitad Vertical -->
      <div class="w-full h-full flex flex-row bg-white">
        <div class="w-[50%] h-full relative">
          <img src={selectedImage} class="w-full h-full object-cover" crossorigin="anonymous" />
          <div class="absolute top-10 left-10 bg-white p-4 rounded-xl"><img src={LogoCasaLegal} class="h-16" crossorigin="anonymous" /></div>
        </div>
        <div class="w-[50%] h-full bg-[#0c3641] p-12 flex flex-col justify-center gap-8 text-white border-l-[15px] border-[#D4AF37]">
          <p class="text-[#D4AF37] text-3xl font-black uppercase tracking-[0.3em]">{property.tipoOperacion}</p>
          <h1 class="text-white text-[80px] font-black uppercase leading-[1.1]">{customHeadline}</h1>
          <p class="text-2xl font-light italic text-gray-300">{property.tituloPropiedad}</p>
          <p class="text-[75px] font-black text-[#D4AF37] leading-none my-6">${property.precioLista}</p>
          <div class="flex flex-col gap-4 text-3xl font-bold">
            <span class="flex items-center gap-4"><Check class="text-[#D4AF37]" size={40}/> {property.dormitoriosSuite + property.dormitoriosEstandar} Cuartos</span>
            <span class="flex items-center gap-4"><Check class="text-[#D4AF37]" size={40}/> {property.banosCompletos} Baños</span>
            <span class="flex items-center gap-4"><Check class="text-[#D4AF37]" size={40}/> {property.zona}</span>
          </div>
        </div>
      </div>

    {:else if selectedStyle === 5}
      <!-- Estilo 5: Marco Teal y Blanco -->
      <div class="w-full h-full bg-[#0c3641] p-12">
        <div class="w-full h-full bg-white flex flex-col relative overflow-hidden">
          <div class="h-[65%] w-full relative">
            <img src={selectedImage} class="w-full h-full object-cover" crossorigin="anonymous" />
            <div class="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white to-transparent"></div>
          </div>
          <div class="h-[35%] w-full bg-white p-12 flex flex-col items-center justify-end text-center z-10">
            <h1 class="text-[#0c3641] text-[90px] font-black uppercase leading-none mb-2">{customHeadline}</h1>
            <p class="text-[#D4AF37] text-5xl font-black mb-6">${property.precioLista}</p>
            <div class="flex justify-center gap-12 text-[#0c3641] text-3xl font-bold border-t-4 border-[#0c3641] pt-6 w-[80%]">
              <span>{property.dormitoriosSuite + property.dormitoriosEstandar} Hab</span>
              <span>{property.banosCompletos} Baños</span>
              <span>{property.zona}</span>
            </div>
          </div>
          <div class="absolute top-10 right-10 bg-[#0c3641] p-4 rounded-xl"><img src={LogoCasaLegal} class="h-16" crossorigin="anonymous" /></div>
        </div>
      </div>

    {:else if selectedStyle === 6}
      <!-- Estilo 6: Dark Mode Elegante -->
      <div class="w-full h-full bg-[#111111] flex flex-col">
        <div class="h-[15%] flex justify-between items-center px-12 border-b-[8px] border-[#D4AF37]">
          <img src={LogoCasaLegal} class="h-16 filter invert brightness-0" crossorigin="anonymous" />
          <p class="text-[#D4AF37] text-3xl font-black uppercase tracking-widest">{property.tipoOperacion}</p>
        </div>
        <div class="h-[45%] w-full">
          <img src={selectedImage} class="w-full h-full object-cover grayscale opacity-80" crossorigin="anonymous" />
        </div>
        <div class="h-[40%] w-full p-12 flex justify-between text-white bg-[#111111]">
          <div class="w-[60%] flex flex-col justify-center">
            <h1 class="text-[#D4AF37] text-[80px] font-black uppercase leading-none mb-4">{customHeadline}</h1>
            <p class="text-3xl font-light italic mb-8">{property.tituloPropiedad}</p>
            <p class="text-[70px] font-black leading-none">${property.precioLista}</p>
          </div>
          <div class="w-[35%] border-l-2 border-gray-700 pl-8 flex flex-col justify-center gap-6 text-2xl font-bold text-gray-300">
            <span>{property.dormitoriosSuite + property.dormitoriosEstandar} <Bed class="inline"/></span>
            <span>{property.banosCompletos} <Bath class="inline"/></span>
            <span>{property.supConstruida || property.supTerreno}m² <Ruler class="inline"/></span>
            <span class="text-[#D4AF37]"><MapPin class="inline"/> {property.zona}</span>
          </div>
        </div>
      </div>

    {:else if selectedStyle === 7}
      <!-- Estilo 7: Full Oro -->
      <div class="w-full h-full bg-[#D4AF37] p-10 flex flex-col">
        <div class="w-full h-[50%] relative rounded-[2rem] overflow-hidden border-8 border-white shadow-2xl mb-10">
          <img src={selectedImage} class="w-full h-full object-cover" crossorigin="anonymous" />
        </div>
        <div class="flex-1 bg-white rounded-[2rem] p-12 flex flex-col shadow-2xl relative">
          <div class="absolute -top-12 right-12 bg-[#0c3641] text-white px-8 py-4 rounded-full font-black text-4xl shadow-xl">${property.precioLista}</div>
          <div class="flex justify-between items-start mb-auto">
            <img src={LogoCasaLegal} class="h-20" crossorigin="anonymous" />
            <p class="text-[#0c3641] text-2xl font-black uppercase bg-gray-100 px-6 py-2 rounded-full">{property.tipoOperacion}</p>
          </div>
          <h1 class="text-[#0c3641] text-[75px] font-black uppercase leading-[1] mt-8">{customHeadline}</h1>
          <div class="mt-auto flex justify-between text-[#0c3641] text-3xl font-bold pt-8 border-t-[6px] border-[#D4AF37]">
            <span><Bed size={36} class="inline"/> {property.dormitoriosSuite}</span>
            <span><Bath size={36} class="inline"/> {property.banosCompletos}</span>
            <span><MapPin size={36} class="inline"/> {property.zona}</span>
          </div>
        </div>
      </div>

    {:else if selectedStyle === 8}
      <!-- Estilo 8: Doble Cuadrícula -->
      <div class="w-full h-full flex flex-col bg-white">
        <div class="h-[50%] w-full flex">
          <div class="w-[50%] h-full bg-[#0c3641] p-12 flex flex-col justify-center text-white">
            <img src={LogoCasaLegal} class="h-16 mb-12 filter brightness-0 invert" crossorigin="anonymous" />
            <h1 class="text-[#D4AF37] text-[70px] font-black uppercase leading-tight mb-4">{customHeadline}</h1>
            <p class="text-3xl font-light italic">{property.zona}</p>
          </div>
          <div class="w-[50%] h-full">
            <img src={selectedImage} class="w-full h-full object-cover" crossorigin="anonymous" />
          </div>
        </div>
        <div class="h-[50%] w-full flex">
          <div class="w-[50%] h-full">
            <img src={property.fotosSecundarias?.[0] || selectedImage} class="w-full h-full object-cover" crossorigin="anonymous" />
          </div>
          <div class="w-[50%] h-full bg-[#D4AF37] p-12 flex flex-col justify-center text-[#0c3641]">
            <p class="text-2xl font-black uppercase tracking-widest mb-2">{property.tipoOperacion}</p>
            <p class="text-[75px] font-black leading-none mb-8">${property.precioLista}</p>
            <div class="flex flex-col gap-4 text-3xl font-bold bg-white/20 p-6 rounded-2xl">
              <span>Habitaciones: {property.dormitoriosSuite + property.dormitoriosEstandar}</span>
              <span>Baños: {property.banosCompletos}</span>
            </div>
          </div>
        </div>
      </div>

    {:else if selectedStyle === 9}
      <!-- Estilo 9: Tarjeta Flotante -->
      <div class="w-full h-full relative bg-[#0c3641]">
        <img src={selectedImage} class="absolute inset-0 w-full h-full object-cover opacity-60" crossorigin="anonymous" />
        <div class="absolute inset-16 bg-white/95 backdrop-blur-md rounded-[3rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl border-[8px] border-[#D4AF37]">
          <img src={LogoCasaLegal} class="h-24 mb-12" crossorigin="anonymous" />
          <p class="text-[#0c3641] text-3xl font-black uppercase tracking-[0.4em] mb-4">{property.tipoOperacion}</p>
          <h1 class="text-[#D4AF37] text-[100px] font-black uppercase leading-none mb-8">{customHeadline}</h1>
          <p class="text-gray-600 text-4xl font-light italic mb-12">{property.tituloPropiedad}</p>
          <p class="text-[#0c3641] text-[90px] font-black mb-12">${property.precioLista}</p>
          <div class="flex gap-12 text-[#0c3641] text-4xl font-bold">
            <span class="flex items-center gap-3"><Bed size={40} class="text-[#D4AF37]"/> {property.dormitoriosSuite}</span>
            <span class="flex items-center gap-3"><Bath size={40} class="text-[#D4AF37]"/> {property.banosCompletos}</span>
          </div>
        </div>
      </div>

    {:else}
      <!-- Estilo 10: Inmobiliario Clásico -->
      <div class="w-full h-full flex flex-col bg-white border-[15px] border-[#0c3641]">
        <div class="h-[200px] w-full flex justify-between items-center px-12 bg-[#0c3641]">
          <img src={LogoCasaLegal} class="h-20 filter brightness-0 invert" crossorigin="anonymous" />
          <h1 class="text-[#D4AF37] text-[60px] font-black uppercase">{customHeadline}</h1>
        </div>
        <div class="h-[600px] w-full border-y-[15px] border-[#D4AF37]">
          <img src={selectedImage} class="w-full h-full object-cover" crossorigin="anonymous" />
        </div>
        <div class="flex-1 w-full p-10 flex justify-between items-center bg-gray-50">
          <div class="flex flex-col gap-4 w-[60%]">
            <p class="text-[#0c3641] text-4xl font-black uppercase tracking-widest">{property.tipoOperacion} EN {property.zona}</p>
            <div class="flex gap-8 text-gray-600 text-3xl font-bold mt-2">
              <span class="flex items-center gap-2"><Bed size={32}/> {property.dormitoriosSuite + property.dormitoriosEstandar}</span>
              <span class="flex items-center gap-2"><Bath size={32}/> {property.banosCompletos}</span>
              <span class="flex items-center gap-2"><Ruler size={32}/> {property.supConstruida || property.supTerreno}m²</span>
            </div>
          </div>
          <div class="w-[35%] text-right bg-[#0c3641] text-white p-8 rounded-2xl">
            <p class="text-[#D4AF37] text-2xl font-bold uppercase mb-2">Precio</p>
            <p class="text-6xl font-black">${property.precioLista}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- LA FOTO DEL AGENTE ESQUINADA (Común para todos los estilos) -->
    {#if agentPhoto}
      <div class="absolute bottom-10 right-10 z-50 flex items-center gap-4 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-2xl border-4 border-[#D4AF37]">
        <div class="text-right pl-4">
          <p class="text-[#0c3641] font-black text-xl uppercase leading-tight">{property.agenteNombre}</p>
          <p class="text-gray-500 font-bold text-sm tracking-widest">CASA LEGAL</p>
        </div>
        <img src={agentPhoto} alt="Agente" class="w-24 h-24 rounded-full object-cover border-4 border-[#0c3641]" crossorigin="anonymous" />
      </div>
    {/if}

  </div>
{/snippet}
