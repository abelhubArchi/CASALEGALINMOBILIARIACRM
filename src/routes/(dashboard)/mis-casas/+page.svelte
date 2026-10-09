<script>
  import { Home, UserPlus, Megaphone, MapPin, Building, Plus, X, Share2, Link as LinkIcon, Save, Image as ImageIcon, Copy, ExternalLink, Loader2, Phone, Check } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { db, storage } from '#lib/firebase';
  import { collection, query, where, getDocs, doc, updateDoc, arrayRemove, setDoc, getDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let currentTab = $state('mis-inmuebles');
  let misInmuebles = $state([]);
  let matches = $state([]);
  let loading = $state(true);

  // Marketing Data
  let marketingData = $state({
    whatsapp: '', instagram: '', facebook: '', tiktok: '', fondoUrl: null, fondoFile: null, vistas: 0, leads: 0
  });
  let isSavingMarketing = $state(false);
  let publicLink = $derived(authState.user ? `${window.location.origin}/agente/${authState.user.uid}` : '');
  let linkCopied = $state(false);

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

      // Cargar info de marketing
      const docMkt = await getDoc(doc(db, 'marketing_agentes', authState.user.uid));
      if (docMkt.exists()) {
        const d = docMkt.data();
        marketingData.whatsapp = d.whatsapp || '';
        marketingData.instagram = d.instagram || '';
        marketingData.facebook = d.facebook || '';
        marketingData.tiktok = d.tiktok || '';
        marketingData.fondoUrl = d.fondoUrl || null;
        marketingData.vistas = d.vistas || 0;
        marketingData.leads = d.leads || 0;
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

  const handleFondoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      marketingData.fondoFile = file;
      marketingData.fondoUrl = URL.createObjectURL(file);
    }
  };

  const guardarMarketing = async () => {
    if (!authState.user) return;
    isSavingMarketing = true;
    try {
      let finalFondoUrl = marketingData.fondoUrl;
      if (marketingData.fondoFile) {
        const fileRef = ref(storage, `agentes/${authState.user.uid}/fondo_${Date.now()}`);
        await uploadBytes(fileRef, marketingData.fondoFile);
        finalFondoUrl = await getDownloadURL(fileRef);
      }

      await setDoc(doc(db, 'marketing_agentes', authState.user.uid), {
        whatsapp: marketingData.whatsapp,
        instagram: marketingData.instagram,
        facebook: marketingData.facebook,
        tiktok: marketingData.tiktok,
        fondoUrl: finalFondoUrl,
        agenteNombre: authState.profile?.nombres + " " + authState.profile?.apellidos,
        agenteFoto: authState.profile?.documentos?.foto || '',
        updatedAt: new Date()
      });

      alert("Tarjeta Digital actualizada con éxito.");
    } catch (error) {
      console.error(error); alert("Error al guardar: " + error.message);
    } finally {
      isSavingMarketing = false;
    }
  };

  const copyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(publicLink);
    } else {
      let ta = document.createElement("textarea");
      ta.value = publicLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    linkCopied = true;
    setTimeout(() => linkCopied = false, 2000);
  };

  let shortUrlLoading = $state({});
  let shortUrlCopied = $state({});

  const generarLinkWhatsApp = async (prop) => {
    shortUrlLoading[prop.id] = true;
    try {
      const agentePhone = marketingData.whatsapp || authState.profile?.telefono || '';
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
    <button onclick={() => currentTab = 'marketing'} class="pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all relative {currentTab === 'marketing' ? 'text-casa-teal' : 'text-gray-400 hover:text-gray-600'}">
      <span class="flex items-center gap-2"><Megaphone size={18}/> Mi Marketing</span>
      {#if currentTab === 'marketing'}<div class="absolute bottom-0 left-0 w-full h-1 bg-casa-teal rounded-t-full"></div>{/if}
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
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-lg transition-shadow flex flex-col">
              <a href="/inmuebles/{prop.id}" class="p-4 flex gap-4 border-b border-gray-100/50">
                <img src={prop.fotoPrincipal} alt="Portada" class="w-32 h-32 object-cover rounded-xl border border-gray-200 group-hover:opacity-90 transition-opacity" />
                <div class="flex-1 flex flex-col justify-center">
                  <span class="bg-gray-100 text-casa-dark text-[9px] font-extrabold px-2 py-1 rounded uppercase tracking-widest w-fit mb-1">{prop.tipoOperacion}</span>
                  <h3 class="font-bold text-casa-dark leading-tight mb-1 line-clamp-2">{prop.tituloPropiedad || prop.tipoInmueble + ' en ' + prop.zona}</h3>
                  <p class="text-xs text-gray-500 flex items-center gap-1 mb-2"><MapPin size={12}/> {prop.ciudad}</p>
                  <span class="text-casa-teal font-black text-lg">${prop.precioLista}</span>
                </div>
              </a>
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
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-lg transition-shadow flex flex-col">
              <a href="/inmuebles/{prop.id}" class="p-4 flex gap-4 h-full border-b border-gray-100/50">
                <img src={prop.fotoPrincipal} alt="Portada" class="w-24 h-24 object-cover rounded-xl border border-gray-200 group-hover:opacity-90 transition-opacity" />
                <div class="flex-1 flex flex-col justify-center pr-6">
                  <h3 class="font-bold text-sm text-casa-dark leading-tight mb-1 line-clamp-2">{prop.tituloPropiedad || prop.tipoInmueble + ' en ' + prop.zona}</h3>
                  <p class="text-[10px] text-gray-400 uppercase font-bold mb-2">De: {prop.agenteNombre}</p>
                  <span class="text-casa-teal font-black text-sm">${prop.precioLista}</span>
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

    {:else if currentTab === 'marketing'}
      <div class="max-w-4xl mx-auto space-y-8">
        
        <!-- Tarjeta Digital Config -->
        <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div class="p-8 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold text-casa-dark flex items-center gap-2"><Share2 class="text-casa-teal"/> Mi Tarjeta de Presentación Digital</h2>
              <p class="text-sm text-gray-500 mt-1">Configura tus redes sociales para tu Landing Page tipo LinkTree, estilo Casa Legal.</p>
            </div>
            {#if publicLink}
              <div class="flex items-center gap-2">
                <a href={publicLink} target="_blank" class="p-2.5 bg-white text-casa-teal rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors" title="Ver Landing"><ExternalLink size={18}/></a>
                <button onclick={copyLink} class="px-4 py-2.5 bg-casa-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm hover:bg-black transition-colors">
                  {#if linkCopied}<Check size={16}/> Copiado{:else}<Copy size={16}/> Copiar Link{/if}
                </button>
              </div>
            {/if}
          </div>
          
          <!-- Analytics de Mi Marketing -->
          <div class="px-8 pt-6 pb-2 grid grid-cols-2 gap-4">
            <div class="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p class="text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1">Vistas de tu Landing Page</p>
                <p class="text-3xl font-black text-blue-600">{marketingData.vistas}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
            </div>
            <div class="bg-green-50/50 border border-green-100 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p class="text-[10px] uppercase font-bold tracking-widest text-green-400 mb-1">Clics en Contacto (Leads)</p>
                <p class="text-3xl font-black text-green-600">{marketingData.leads}</p>
              </div>
              <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>
              </div>
            </div>
          </div>

          <form onsubmit={(e) => { e.preventDefault(); guardarMarketing(); }} class="p-8 space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp (Solo números con código ej: 59170000000)</label>
                <div class="relative">
                  <Phone size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" bind:value={marketingData.whatsapp} placeholder="591..." class="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Instagram (Link del perfil)</label>
                <div class="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  <input type="text" bind:value={marketingData.instagram} placeholder="https://instagram.com/tuusuario" class="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Facebook (Link del perfil/página)</label>
                <div class="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  <input type="text" bind:value={marketingData.facebook} placeholder="https://facebook.com/tuusuario" class="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">TikTok (Link del perfil)</label>
                <div class="relative">
                  <LinkIcon size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" bind:value={marketingData.tiktok} placeholder="https://tiktok.com/@tuusuario" class="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                </div>
              </div>
            </div>

            <div class="border-t border-gray-100 pt-8">
              <label class="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Fondo Personalizado (Aparecerá en tu tarjeta)</label>
              <div class="flex items-center gap-6">
                {#if marketingData.fondoUrl}
                  <div class="w-48 h-32 rounded-2xl overflow-hidden border border-gray-200 shadow-sm shrink-0">
                    <img src={marketingData.fondoUrl} alt="Fondo" class="w-full h-full object-cover" />
                  </div>
                {/if}
                <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group">
                  <ImageIcon size={24} class="text-gray-400 mb-2 group-hover:scale-110 transition-transform"/>
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Subir nuevo fondo</span>
                  <input type="file" accept="image/*" class="hidden" onchange={handleFondoChange} />
                </label>
              </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={isSavingMarketing} class="px-8 py-3.5 bg-casa-teal text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#0d3641] transition-colors shadow-lg uppercase tracking-wider text-sm disabled:opacity-50">
                {#if isSavingMarketing}<Loader2 size={18} class="animate-spin" /> Guardando...{:else}<Save size={18} /> Guardar Mi Tarjeta Digital{/if}
              </button>
            </div>
          </form>
        </div>

      </div>
    {/if}
  </div>
</div>
