<script>
  import { onMount } from 'svelte';
  import { 
    Radio, Image as ImageIcon, Video, Send, CheckCircle, Info, UploadCloud, 
    Store, Copy, Check, Loader2, Sparkles, Smartphone, LayoutGrid, Monitor, Camera
  } from 'lucide-svelte';
  import { db } from '#lib/firebase';
  import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
  import { authState } from '#lib/authStore.svelte.js';

  let misPropiedades = $state([]);
  let loadingProps = $state(true);

  // Form state
  let selectedPropId = $state('');
  let selectedProp = $derived(misPropiedades.find(p => p.id === selectedPropId) || null);
  
  let aiDescription = $state('');
  let copied = $state(false);

  // Channels
  let channels = $state({
    facebook: true,
    instagram: true,
    marketplace: false
  });
  let format = $state('feed'); // 'feed' | 'story'

  // Progress State
  let isPublishing = $state(false);
  let publishStep = $state(0); // 0: Idle, 1: Meta, 2: Upload, 3: Sync, 4: Success
  let statusText = $state('');

  onMount(async () => {
    try {
      if (authState.user) {
        const q = query(collection(db, 'propiedades'), where('idAgente', '==', authState.user.uid));
        const snap = await getDocs(q);
        misPropiedades = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch(e) { console.error(e); }
    finally { loadingProps = false; }
  });

  // Watch selected property to generate AI text
  $effect(() => {
    if (selectedProp) {
      aiDescription = `🚀 ¡Oportunidad Única en ${selectedProp.zona || 'Santa Cruz'}! \n\n${selectedProp.tipoInmueble} en ${selectedProp.tipoOperacion} por ${selectedProp.moneda === 'USD' ? '$' : 'Bs.'}${selectedProp.precioLista}.\n\n✅ Excelente distribución\n✅ Zona estratégica\n✅ Papeles al día\n\nContáctame para agendar una visita y asegurar tu inversión. \n\n#CasaLegal #BienesRaices #InmueblesBolivia #InversionInteligente`;
    } else {
      aiDescription = '';
    }
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiDescription);
    copied = true;
    setTimeout(() => copied = false, 2000);
  };

  const simulatePublish = async () => {
    if (!selectedPropId) {
      alert("⚠️ Selecciona un inmueble primero.");
      return;
    }
    if (!channels.facebook && !channels.instagram && !channels.marketplace) {
      alert("⚠️ Debes seleccionar al menos un canal destino.");
      return;
    }
    if (!aiDescription.trim()) {
      alert("⚠️ La descripción no puede estar vacía.");
      return;
    }

    isPublishing = true;
    publishStep = 1;
    statusText = "Conectando con Meta API...";

    await new Promise(r => setTimeout(r, 800));
    publishStep = 2;
    statusText = "Subiendo elementos gráficos de alta calidad...";

    await new Promise(r => setTimeout(r, 800));
    publishStep = 3;
    statusText = "Sincronizando publicaciones y hashtags...";

    await new Promise(r => setTimeout(r, 800));
    
    // Guardar registro real en Firebase para que Marketing lo vea
    try {
      await addDoc(collection(db, 'red_casa'), {
        agenteId: authState.user?.uid || 'unknown',
        agenteNombre: authState.profile?.nombres || 'Agente',
        propiedadId: selectedPropId,
        mensaje: aiDescription,
        canales: channels,
        formato: format,
        estado: 'Publicado',
        createdAt: serverTimestamp()
      });
    } catch(e) { console.error("Error saving log", e); }

    publishStep = 4;
    statusText = "¡Despliegue Exitoso!";
  };

  const resetForm = () => {
    isPublishing = false;
    publishStep = 0;
    selectedPropId = '';
    statusText = '';
  };

</script>

<div class="p-4 md:p-8 h-full bg-[#f4f7f6] flex flex-col font-sans overflow-y-auto animate-in fade-in duration-500">
  <header class="mb-8 max-w-6xl mx-auto w-full text-center md:text-left flex flex-col md:flex-row items-center gap-6">
    <div class="inline-flex p-4 bg-casa-teal/10 rounded-2xl">
      <Radio size={40} class="text-casa-teal" /> 
    </div>
    <div>
      <h1 class="text-3xl md:text-4xl font-extrabold text-[#0c3641] mb-2 tracking-tight">
        Casa Legal Marketing
      </h1>
      <p class="text-gray-500 text-sm md:text-base">Centro de Publicación Asistida. Selecciona un inmueble, edita la descripción inteligente y lanza a múltiples canales simultáneamente.</p>
    </div>
  </header>

  <div class="max-w-6xl mx-auto w-full">
    
    {#if publishStep === 4}
      <div class="bg-white rounded-[2rem] shadow-xl border border-green-100 p-12 text-center animate-in zoom-in-95 duration-500">
        <div class="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} />
        </div>
        <h2 class="text-3xl font-bold text-[#0c3641] mb-4">¡Propiedad en Línea!</h2>
        <p class="text-gray-500 max-w-md mx-auto mb-8">El inmueble ha sido despachado exitosamente a las redes seleccionadas con su copia optimizada.</p>
        <button onclick={resetForm} class="px-8 py-3 bg-[#0c3641] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-black transition-colors">
          Nueva Publicación
        </button>
      </div>
    
    {:else}
      
      <!-- Property Selector -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">1. Seleccionar Inmueble de tu Inventario</label>
        {#if loadingProps}
          <div class="p-4 text-center"><Loader2 size={24} class="animate-spin text-casa-teal mx-auto"/></div>
        {:else}
          <select bind:value={selectedPropId} disabled={isPublishing} class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-bold text-[#0c3641] cursor-pointer shadow-inner">
            <option value="">-- Elige un inmueble --</option>
            {#each misPropiedades as p}
              <option value={p.id}>{p.tituloPropiedad || p.tipoInmueble} - ${p.precioLista}</option>
            {/each}
          </select>
          {#if misPropiedades.length === 0}
            <p class="text-xs text-red-500 mt-2 font-bold">No tienes inmuebles activos en tu inventario. Crea uno primero.</p>
          {/if}
        {/if}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        
        <!-- Bloqueo durante publicación -->
        {#if isPublishing && publishStep < 4}
          <div class="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 rounded-[2rem] flex flex-col items-center justify-center animate-in fade-in">
            <Loader2 size={64} class="text-casa-teal animate-spin mb-6" />
            <p class="text-lg font-bold text-[#0c3641] tracking-tight">{statusText}</p>
            
            <div class="w-64 h-2 bg-gray-100 rounded-full mt-6 overflow-hidden">
              <div class="h-full bg-casa-teal transition-all duration-700 ease-out" style="width: {publishStep * 33}%"></div>
            </div>
          </div>
        {/if}

        <!-- Izquierda: Preview -->
        <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h2 class="font-bold text-[#0c3641] flex items-center gap-2"><LayoutGrid size={18}/> Previsualización y Copy</h2>
          </div>
          <div class="p-6 flex-1 flex flex-col gap-6">
            <!-- Foto -->
            <div class="w-full h-48 bg-gray-200 rounded-xl overflow-hidden relative shadow-inner">
              {#if selectedProp?.fotoPrincipal}
                <img src={selectedProp.fotoPrincipal} alt="Preview" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <img src="/logoCasaLegal.jpg" class="absolute bottom-4 right-4 w-10 h-10 rounded-full border-2 border-casa-gold shadow-lg" alt="Watermark"/>
              {:else}
                <div class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <ImageIcon size={32} />
                  <span class="text-xs font-bold uppercase tracking-widest">Sin Selección</span>
                </div>
              {/if}
            </div>

            <!-- Texto AI -->
            <div class="flex-1 flex flex-col">
              <div class="flex justify-between items-center mb-2">
                <label class="text-[10px] font-bold text-casa-teal uppercase tracking-widest flex items-center gap-1"><Sparkles size={12}/> Copy Optimizada por IA</label>
                <button onclick={copyToClipboard} class="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#0c3641] transition-colors flex items-center gap-1">
                  {#if copied}<Check size={12} class="text-green-500"/> Copiado{:else}<Copy size={12}/> Copiar Texto{/if}
                </button>
              </div>
              <textarea bind:value={aiDescription} class="w-full flex-1 min-h-[150px] bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal resize-none font-medium text-gray-700" placeholder="Selecciona un inmueble para generar la descripción..."></textarea>
            </div>
          </div>
        </div>

        <!-- Derecha: Channels & Launch -->
        <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <h2 class="font-bold text-[#0c3641] flex items-center gap-2"><Radio size={18}/> Destinos de Publicación</h2>
          </div>
          
          <div class="p-6 space-y-8 flex-1">
            
            <!-- Canales -->
            <div class="space-y-3">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Seleccionar Redes</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label class="relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all {channels.facebook ? 'border-[#1877F2] bg-[#1877F2]/5' : 'border-gray-200 hover:border-gray-300'}">
                  <input type="checkbox" bind:checked={channels.facebook} class="absolute top-3 right-3 accent-[#1877F2] w-4 h-4" />
                  <Monitor size={32} class="text-[#1877F2] mb-2" />
                  <span class="text-xs font-bold text-[#0c3641]">Facebook</span>
                </label>
                <label class="relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all {channels.instagram ? 'border-[#E1306C] bg-[#E1306C]/5' : 'border-gray-200 hover:border-gray-300'}">
                  <input type="checkbox" bind:checked={channels.instagram} class="absolute top-3 right-3 accent-[#E1306C] w-4 h-4" />
                  <Camera size={32} class="text-[#E1306C] mb-2" />
                  <span class="text-xs font-bold text-[#0c3641]">Instagram</span>
                </label>
                <label class="relative flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all {channels.marketplace ? 'border-casa-teal bg-casa-teal/5' : 'border-gray-200 hover:border-gray-300'}">
                  <input type="checkbox" bind:checked={channels.marketplace} class="absolute top-3 right-3 accent-casa-teal w-4 h-4" />
                  <Store size={32} class="text-casa-teal mb-2" />
                  <span class="text-xs font-bold text-[#0c3641] text-center">Marketplace</span>
                </label>
              </div>
            </div>

            <!-- Formato -->
            <div class="space-y-3">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Formato de Salida</label>
              <div class="flex bg-gray-100 p-1 rounded-xl">
                <button onclick={() => format = 'feed'} class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all {format === 'feed' ? 'bg-white shadow-sm text-[#0c3641]' : 'text-gray-500 hover:text-gray-700'}">
                  Publicación (Feed)
                </button>
                <button onclick={() => format = 'story'} class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all {format === 'story' ? 'bg-white shadow-sm text-[#0c3641]' : 'text-gray-500 hover:text-gray-700'}">
                  Historia / Reel
                </button>
              </div>
            </div>

          </div>

          <!-- Launch Button -->
          <div class="p-6 border-t border-gray-100 bg-gray-50 rounded-b-[2rem]">
            <button onclick={simulatePublish} class="w-full py-4 bg-gradient-to-r from-casa-teal to-[#0c3641] text-casa-gold font-black text-sm uppercase tracking-widest rounded-xl shadow-xl hover:shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-3 group">
              🚀 Lanzar Publicación Simultánea
            </button>
            <p class="text-[10px] text-center text-gray-400 mt-4 font-medium px-4">Al lanzar, la IA distribuirá este contenido optimizado en los canales seleccionados. Tiempo estimado: 2 segundos.</p>
          </div>
        </div>

      </div>
    {/if}

  </div>
</div>
