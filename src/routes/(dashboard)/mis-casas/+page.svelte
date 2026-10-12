<script>
  import { Home, UserPlus, Megaphone, MapPin, Building, Plus, X, Share2, Link as LinkIcon, Save, Image as ImageIcon, Copy, ExternalLink, Loader2, Phone, Check } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { db, storage } from '#lib/firebase';
  import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, setDoc, getDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getDualPrice } from '#lib/currency';

  let currentTab = $state('mis-inmuebles');
  let misInmuebles = $state([]);
  let matches = $state([]);
  let loading = $state(true);

  // Marketing Data (only needed to get WhatsApp for sharing links)
  let agentWhatsapp = $state('');

  let shortUrlLoading = $state({});
  let shortUrlCopied = $state({});

  const cargarDatos = async () => {
    if (!authState.user) return;
    loading = true;
    try {
      const qMisInmuebles = query(collection(db, 'inmuebles'), where('agenteId', '==', authState.user.uid));
      const snapMis = await getDocs(qMisInmuebles);
      misInmuebles = snapMis.docs.map(doc => ({ id: doc.id, ...doc.data(), vistas: doc.data().vistas || 0, leads: doc.data().leads || 0 }));

      if (authState.profile?.matches && authState.profile.matches.length > 0) {
        const snapMatches = await getDocs(collection(db, 'inmuebles'));
        const todos = snapMatches.docs.map(d => ({ id: d.id, ...d.data(), vistas: d.data().vistas || 0, leads: d.data().leads || 0 }));
        matches = todos.filter(p => authState.profile.matches.includes(p.id));
      } else {
        matches = [];
      }

      // Cargar info de marketing para Whatsapp
      const docMkt = await getDoc(doc(db, 'marketing_agentes', authState.user.uid));
      if (docMkt.exists()) {
        agentWhatsapp = docMkt.data().whatsapp || '';
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  };

  onMount(cargarDatos);

  const desconectarMatch = async (propId) => {
    if (!confirm('¿Estás seguro de desconectar esta propiedad?')) return;
    try {
      const docRef = doc(db, 'usuarios', authState.user.uid);
      await updateDoc(docRef, { matches: arrayRemove(propId) });
      authState.profile.matches = authState.profile.matches.filter(id => id !== propId);
      matches = matches.filter(p => p.id !== propId);
    } catch (error) {
      alert("Error al desconectar: " + error.message);
    }
  };

  const generarLinkWhatsApp = async (prop) => {
    shortUrlLoading[prop.id] = true;
    try {
      const agentePhone = agentWhatsapp || authState.profile?.telefono || '';
      if (!agentePhone) {
        alert("Por favor, configura tu número de WhatsApp en la pestaña 'Mi Marketing' primero.");
        return;
      }
      
      const linkPublico = `${window.location.origin}/inmuebles/${prop.id}`;
      const texto = `Hola ${authState.profile?.nombres || ''}, me interesa la propiedad: ${prop.tituloPropiedad || prop.tipoInmueble} por $${prop.precioLista}. Link: ${linkPublico}`;
      
      const whatsappUrl = `https://wa.me/${agentePhone}?text=${encodeURIComponent(texto)}`;
      let finalUrl = whatsappUrl;
      
      try {
        const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(whatsappUrl)}`);
        const data = await res.json();
        if (data.shorturl) finalUrl = data.shorturl;
      } catch (err) {
        console.warn("Fallo al acortar link (CORS). Usando link largo.", err);
      }
      
      // Fallback para IPs Locales HTTP donde navigator.clipboard se bloquea
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(finalUrl);
      } else {
        let textArea = document.createElement("textarea");
        textArea.value = finalUrl;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      shortUrlCopied[prop.id] = true;
      setTimeout(() => shortUrlCopied[prop.id] = false, 3000);
      
    } catch (e) {
      console.error(e);
      alert("Error al generar el link. Inténtalo de nuevo.");
    } finally {
      shortUrlLoading[prop.id] = false;
    }
  const cambiarEstadoPropiedad = async (propId, nuevoEstado) => {
    try {
      await updateDoc(doc(db, 'inmuebles', propId), { estado: nuevoEstado });
      const idx = misInmuebles.findIndex(p => p.id === propId);
      if (idx !== -1) {
        misInmuebles[idx].estado = nuevoEstado;
      }
      if (nuevoEstado === 'Vendido') {
        alert("🎉 ¡Felicidades por la venta! Marcaste el inmueble como VENDIDO. Esto sumará +100 PTS a tu Casa Legal Score.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al actualizar estado: " + e.message);
    }
  };
</script>

<div class="p-8 md:p-12 font-sans h-full flex flex-col bg-casa-light overflow-y-auto">
  
  <div class="flex items-center gap-4 mb-10">
    <div class="p-4 bg-casa-dark/5 text-casa-dark rounded-2xl shadow-sm border border-gray-200">
      <Building size={36} strokeWidth={1.5} />
    </div>
    <div>
      <h1 class="text-4xl font-extrabold text-casa-dark tracking-tight">Mis Casas</h1>
      <p class="text-gray-500 text-lg mt-1">Gestión de tu inventario propio, matches y marketing personal.</p>
    </div>
  </div>

  <div class="flex gap-4 mb-8 border-b border-gray-200 pb-px">
    <button onclick={() => currentTab = 'mis-inmuebles'} class="pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all relative {currentTab === 'mis-inmuebles' ? 'text-casa-teal' : 'text-gray-400 hover:text-gray-600'}">
      <span class="flex items-center gap-2"><Home size={18}/> Mis Inmuebles</span>
      {#if currentTab === 'mis-inmuebles'}<div class="absolute bottom-0 left-0 w-full h-1 bg-casa-teal rounded-t-full"></div>{/if}
    </button>
    <button onclick={() => currentTab = 'matches'} class="pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all relative {currentTab === 'matches' ? 'text-casa-teal' : 'text-gray-400 hover:text-gray-600'}">
      <span class="flex items-center gap-2"><UserPlus size={18}/> Casa de Matches</span>
      {#if currentTab === 'matches'}<div class="absolute bottom-0 left-0 w-full h-1 bg-casa-teal rounded-t-full"></div>{/if}
    </button>
  </div>

  <div class="flex-1 animate-in fade-in duration-500">
    {#if loading}
      <div class="flex items-center justify-center py-20"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-casa-teal"></div></div>
    
    {:else if currentTab === 'mis-inmuebles'}
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-casa-dark">Propiedades que yo capté</h2>
        <a href="/inmuebles/nuevo" class="bg-casa-dark text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-md text-xs uppercase tracking-wider">
          <Plus size={16} /> Subir Nuevo
        </a>
      </div>
      {#if misInmuebles.length === 0}
        <div class="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100"><p class="text-gray-400 font-bold uppercase tracking-widest">No has captado ningún inmueble aún.</p></div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {#each misInmuebles as prop}
            {@const prices = getDualPrice(prop.precioLista, prop.moneda)}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-lg transition-shadow flex flex-col">
              <a href="/inmuebles/{prop.id}" class="p-4 flex gap-4 border-b border-gray-100/50">
                <img src={prop.fotoPrincipal} alt="Portada" class="w-32 h-32 object-cover rounded-xl border border-gray-200 group-hover:opacity-90 transition-opacity" />
                <div class="flex-1 flex flex-col justify-center">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="bg-gray-100 text-casa-dark text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">{prop.tipoOperacion}</span>
                    <span class="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider {prop.estado === 'Vendido' ? 'bg-purple-100 text-purple-700 font-black' : prop.estado === 'Reservado' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}">
                      {prop.estado || 'Activo'}
                    </span>
                  </div>
                  <h3 class="font-bold text-casa-dark leading-tight mb-1 line-clamp-2">{prop.tituloPropiedad || prop.tipoInmueble + ' en ' + prop.zona}</h3>
                  <p class="text-xs text-gray-500 flex items-center gap-1 mb-2"><MapPin size={12}/> {prop.ciudad}</p>
                  <div class="flex flex-col">
                    <span class="text-casa-teal font-black text-lg leading-tight">{prices.usdFormatted} <span class="text-[9px] uppercase font-bold text-gray-400">USD</span></span>
                    <span class="text-xs font-bold text-[#D4AF37] font-mono">{prices.bobFormatted}</span>
                  </div>
                </div>
              </a>
              
              <!-- Selector rápido de estado para Casa Legal Score -->
              <div class="px-3 py-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs">
                <span class="text-[10px] uppercase font-bold text-gray-400">Estado:</span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    onclick={() => cambiarEstadoPropiedad(prop.id, 'Activo')}
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all {prop.estado === 'Activo' || !prop.estado ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                  >
                    Activo
                  </button>
                  <button
                    type="button"
                    onclick={() => cambiarEstadoPropiedad(prop.id, 'Reservado')}
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all {prop.estado === 'Reservado' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                  >
                    Reservado
                  </button>
                  <button
                    type="button"
                    onclick={() => cambiarEstadoPropiedad(prop.id, 'Vendido')}
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all {prop.estado === 'Vendido' ? 'bg-purple-600 text-white shadow-xs' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}"
                    title="Marcar como Vendido (+100 PTS Score)"
                  >
                    🎉 Vendido (+100)
                  </button>
                </div>
              </div>

              <div class="p-3 bg-gray-50 flex items-center justify-between">
                <div class="flex gap-4">
                  <div class="text-[10px] text-gray-400 uppercase font-bold">Vistas: <span class="text-casa-dark">{prop.vistas}</span></div>
                  <div class="text-[10px] text-gray-400 uppercase font-bold">Leads: <span class="text-casa-dark">{prop.leads}</span></div>
                </div>
                <div class="flex gap-2">
                  <button onclick={(e) => { e.preventDefault(); generarLinkWhatsApp(prop); }} disabled={shortUrlLoading[prop.id]} class="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-green-200 transition-all shadow-sm disabled:opacity-50" title="Copiar Link Corto WA">
                    {#if shortUrlLoading[prop.id]}<Loader2 size={14} class="animate-spin"/>{:else if shortUrlCopied[prop.id]}<Check size={14}/>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>{/if} WA
                  </button>
                  <button onclick={(e) => { e.preventDefault(); goto(`/inmuebles/${prop.id}/marketing`); }} class="bg-casa-gold text-casa-dark px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:brightness-110 transition-all shadow-sm">
                    <Megaphone size={14}/> Mkt
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

    {:else if currentTab === 'matches'}
      <div class="mb-6">
        <h2 class="text-xl font-bold text-casa-dark">Propiedades de otros agentes listas para vender</h2>
      </div>
      {#if matches.length === 0}
        <div class="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100"><p class="text-gray-400 font-bold uppercase tracking-widest">No tienes matches. Ve al inventario y conecta.</p></div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {#each matches as prop}
            {@const prices = getDualPrice(prop.precioLista, prop.moneda)}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-lg transition-shadow flex flex-col">
              <a href="/inmuebles/{prop.id}" class="p-4 flex gap-4 h-full border-b border-gray-100/50">
                <img src={prop.fotoPrincipal} alt="Portada" class="w-24 h-24 object-cover rounded-xl border border-gray-200 group-hover:opacity-90 transition-opacity" />
                <div class="flex-1 flex flex-col justify-center pr-6">
                  <h3 class="font-bold text-sm text-casa-dark leading-tight mb-1 line-clamp-2">{prop.tituloPropiedad || prop.tipoInmueble + ' en ' + prop.zona}</h3>
                  <p class="text-[10px] text-gray-400 uppercase font-bold mb-1">De: {prop.agenteNombre}</p>
                  <div class="flex flex-col">
                    <span class="text-casa-teal font-black text-sm leading-tight">{prices.usdFormatted} <span class="text-[8px] uppercase font-bold text-gray-400">USD</span></span>
                    <span class="text-[11px] font-bold text-[#D4AF37] font-mono">{prices.bobFormatted}</span>
                  </div>
                </div>
              </a>
              <button onclick={(e) => { e.preventDefault(); desconectarMatch(prop.id); }} class="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors bg-white/80 backdrop-blur rounded-full p-1.5 shadow-sm" title="Desconectar">
                <X size={16} />
              </button>
              <div class="p-3 bg-gray-50 flex items-center justify-between">
                <div class="flex gap-4">
                  <div class="text-[10px] text-gray-400 uppercase font-bold">Vistas: <span class="text-casa-dark">{prop.vistas}</span></div>
                  <div class="text-[10px] text-gray-400 uppercase font-bold">Leads: <span class="text-casa-dark">{prop.leads}</span></div>
                </div>
                <div class="flex gap-2">
                  <button onclick={(e) => { e.preventDefault(); generarLinkWhatsApp(prop); }} disabled={shortUrlLoading[prop.id]} class="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-green-200 transition-all shadow-sm disabled:opacity-50" title="Copiar Link Corto WA">
                    {#if shortUrlLoading[prop.id]}<Loader2 size={14} class="animate-spin"/>{:else if shortUrlCopied[prop.id]}<Check size={14}/>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>{/if} WA
                  </button>
                  <button onclick={(e) => { e.preventDefault(); goto(`/inmuebles/${prop.id}/marketing`); }} class="bg-casa-gold text-casa-dark px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:brightness-110 transition-all shadow-sm">
                    <Megaphone size={14}/> Mkt
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
