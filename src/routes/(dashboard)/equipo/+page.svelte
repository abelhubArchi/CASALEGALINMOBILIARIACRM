<script>
  import { onMount } from 'svelte';
  import { Shield, Plus, Search, User, Users, Star, ArrowRight, Loader2, Image as ImageIcon, CheckCircle, Clock, Building2, MessageSquare, Send, X } from 'lucide-svelte';
  import { db, storage } from '#lib/firebase';
  import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, updateDoc, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { authState } from '#lib/authStore.svelte.js';

  let equipos = $state([]);
  let loading = $state(true);
  
  // Create Team Modal
  let showModal = $state(false);
  let nombreEquipo = $state('');
  let descripcionEquipo = $state('');
  let logoFile = $state(null);
  let logoPreview = $state('');
  let isSaving = $state(false);

  // My Team State
  let myTeamId = $derived(authState.profile?.equipoId || null);
  let myTeamData = $state(null);
  let solicitudesPendientes = $state([]); // Para el lider
  let viewMode = $state('list'); // 'list' o 'myTeam'

  // Team Features State
  let miembrosEquipo = $state([]);
  let propiedadesEquipo = $state([]);
  let chatMessages = $state([]);
  let newMessage = $state('');
  
  // Modals
  let showChatModal = $state(false);
  let showAddPropiedadModal = $state(false);
  let misInmuebles = $state([]); // Para seleccionar cual compartir

  onMount(async () => {
    await fetchEquipos();
    if (myTeamId) {
      await fetchMyTeam();
    } else {
      // Check if user has a pending request
      const reqQ = query(collection(db, 'equipo_solicitudes'), where('userId', '==', authState.user?.uid));
      const reqSnap = await getDocs(reqQ);
      if (!reqSnap.empty) {
        // user has pending request
      }
    }
  });

  const fetchEquipos = async () => {
    loading = true;
    try {
      const snap = await getDocs(collection(db, 'equipos'));
      equipos = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.ventas || 0) - (a.ventas || 0));
    } catch(e) { console.error(e); }
    finally { loading = false; }
  };

  const fetchMyTeam = async () => {
    if (!myTeamId) return;
    try {
      const docSnap = await getDoc(doc(db, 'equipos', myTeamId));
      if (docSnap.exists()) {
        myTeamData = { id: docSnap.id, ...docSnap.data() };
        
        // Si soy lider, obtengo solicitudes
        if (myTeamData.liderId === authState.user.uid) {
          const reqQ = query(collection(db, 'equipo_solicitudes'), where('equipoId', '==', myTeamId), where('status', '==', 'pendiente'));
          const reqSnap = await getDocs(reqQ);
          solicitudesPendientes = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        
        // Cargar Miembros
        const mQ = query(collection(db, 'usuarios'), where('equipoId', '==', myTeamId));
        const mSnap = await getDocs(mQ);
        miembrosEquipo = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Cargar Propiedades Exclusivas
        const pQ = query(collection(db, 'inmuebles'), where('equipoId', '==', myTeamId));
        const pSnap = await getDocs(pQ);
        propiedadesEquipo = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Listener del Chat
        const chatQ = query(collection(db, 'equipos', myTeamId, 'chat'), orderBy('createdAt', 'asc'));
        onSnapshot(chatQ, (snap) => {
          chatMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTimeout(() => {
            const chatBox = document.getElementById('teamChatBox');
            if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
          }, 100);
        });

      }
    } catch(e) { console.error("Error fetching my team", e); }
  };

  const loadMisInmuebles = async () => {
    if(misInmuebles.length > 0) { showAddPropiedadModal = true; return; }
    try {
      const q = query(collection(db, 'inmuebles'), where('agenteId', '==', authState.user.uid));
      const snap = await getDocs(q);
      misInmuebles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      showAddPropiedadModal = true;
    } catch(e) { console.error(e); }
  };

  const compartirPropiedad = async (propId) => {
    try {
      await updateDoc(doc(db, 'inmuebles', propId), { equipoId: myTeamData.id });
      showAddPropiedadModal = false;
      await fetchMyTeam(); // reload
      alert("¡Propiedad compartida con tu equipo!");
    } catch(e) { console.error(e); alert("Error"); }
  };

  const enviarMensaje = async () => {
    if(!newMessage.trim()) return;
    try {
      await addDoc(collection(db, 'equipos', myTeamData.id, 'chat'), {
        texto: newMessage,
        autorId: authState.user.uid,
        autorNombre: authState.profile.nombres,
        autorFoto: authState.profile.documentos?.foto || null,
        createdAt: serverTimestamp()
      });
      newMessage = '';
    } catch(e) { console.error(e); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      logoFile = file;
      logoPreview = URL.createObjectURL(file);
    }
  };

  const crearEquipo = async () => {
    if(!nombreEquipo) return;
    isSaving = true;
    try {
      let logoUrl = null;
      if (logoFile) {
        const fileRef = ref(storage, `equipos/${authState.user.uid}_${Date.now()}`);
        const snap = await uploadBytes(fileRef, logoFile);
        logoUrl = await getDownloadURL(snap.ref);
      }

      const docRef = await addDoc(collection(db, 'equipos'), {
        nombre: nombreEquipo,
        descripcion: descripcionEquipo,
        liderId: authState.user?.uid || 'unknown',
        liderNombre: authState.profile?.nombres || 'Agente',
        logo: logoUrl,
        miembros: 1,
        ventas: 0,
        createdAt: serverTimestamp()
      });

      // Actualizar perfil del usuario
      await updateDoc(doc(db, 'usuarios', authState.user.uid), {
        equipoId: docRef.id,
        equipoNombre: nombreEquipo
      });
      
      if(authState.profile) {
        authState.profile.equipoId = docRef.id;
        authState.profile.equipoNombre = nombreEquipo;
      }

      showModal = false;
      nombreEquipo = ''; descripcionEquipo = ''; logoFile = null; logoPreview = '';
      alert("¡Tu equipo ha sido creado y eres el Líder!");
      
      viewMode = 'myTeam';
      await fetchEquipos();
      await fetchMyTeam();
      
    } catch(e) { console.error(e); alert("Error creando equipo."); }
    finally { isSaving = false; }
  };

  const solicitarUnirse = async (eq) => {
    if (confirm(`¿Estás seguro que deseas solicitar unirte al equipo "${eq.nombre}"?`)) {
      try {
        await addDoc(collection(db, 'equipo_solicitudes'), {
          equipoId: eq.id,
          equipoNombre: eq.nombre,
          userId: authState.user.uid,
          userName: authState.profile.nombres,
          userFoto: authState.profile.documentos?.foto || null,
          status: 'pendiente',
          createdAt: serverTimestamp()
        });
        alert(`Solicitud enviada a ${eq.liderNombre}. Espera a que te acepte.`);
      } catch(e) {
        console.error(e); alert("Error enviando solicitud.");
      }
    }
  };

  const aceptarSolicitud = async (solicitud) => {
    try {
      // 1. Marcar aprobada
      await updateDoc(doc(db, 'equipo_solicitudes', solicitud.id), { status: 'aprobado' });
      // 2. Asignar equipo al usuario
      await updateDoc(doc(db, 'usuarios', solicitud.userId), {
        equipoId: myTeamData.id,
        equipoNombre: myTeamData.nombre
      });
      // 3. Subir contador del equipo
      await updateDoc(doc(db, 'equipos', myTeamData.id), {
        miembros: (myTeamData.miembros || 1) + 1
      });
      alert(`¡Has aceptado a ${solicitud.userName} en tu equipo!`);
      await fetchMyTeam();
    } catch(e) { console.error(e); alert("Error"); }
  };
</script>

<div class="p-4 md:p-8 font-sans h-full bg-[#f4f7f6] flex flex-col overflow-y-auto animate-in fade-in duration-500">
  
  <header class="mb-8 max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between md:items-end gap-6">
    <div class="flex items-center gap-4">
      <div class="p-4 bg-[#0c3641] text-casa-gold rounded-2xl shadow-lg">
        <Shield size={36} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-[#0c3641] tracking-tight">Equipos Casa Legal</h1>
        <p class="text-gray-500 text-sm md:text-base mt-1">Suma fuerzas. Comparte exclusivas y crece en red.</p>
      </div>
    </div>
    
    <div class="flex bg-gray-200 p-1 rounded-xl shrink-0 self-start md:self-auto">
      <button onclick={() => viewMode = 'list'} class="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all {viewMode === 'list' ? 'bg-white text-[#0c3641] shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Red de Equipos</button>
      {#if myTeamId}
        <button onclick={() => viewMode = 'myTeam'} class="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all {viewMode === 'myTeam' ? 'bg-[#0c3641] text-casa-gold shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Mi Equipo</button>
      {/if}
    </div>
  </header>

  <div class="max-w-6xl mx-auto w-full">
    
    {#if viewMode === 'list'}
      <!-- Explorador de Equipos -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-6">
          <div class="relative">
            <Search size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar equipos por nombre o líder..." class="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-sm outline-none focus:border-casa-teal shadow-sm font-medium text-gray-700" />
          </div>

          {#if loading}
            <div class="flex justify-center py-20"><Loader2 class="animate-spin text-casa-teal" size={40} /></div>
          {:else}
            <div class="space-y-4">
              {#each equipos as eq}
                <div class="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center group hover:shadow-md transition-all hover:border-casa-gold/50">
                  <div class="flex gap-4 items-center">
                    <div class="w-16 h-16 bg-gray-50 rounded-full border-2 border-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {#if eq.logo}
                        <img src={eq.logo} alt={eq.nombre} class="w-full h-full object-cover" />
                      {:else}
                        <Shield size={28} class="text-gray-400"/>
                      {/if}
                    </div>
                    <div>
                      <h3 class="font-bold text-lg text-[#0c3641]">{eq.nombre}</h3>
                      <p class="text-xs text-gray-500 mt-1 line-clamp-1">{eq.descripcion || 'Sin descripción'}</p>
                      <div class="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <span class="flex items-center gap-1"><User size={12}/> {eq.liderNombre}</span>
                        <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span class="flex items-center gap-1"><Users size={12}/> {eq.miembros} Asesores</span>
                      </div>
                    </div>
                  </div>
                  {#if !myTeamId}
                    <button onclick={() => solicitarUnirse(eq)} class="px-5 py-2.5 bg-gray-50 text-[#0c3641] border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-casa-teal hover:text-white hover:border-casa-teal transition-colors shrink-0">
                      Solicitar Unirse
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Sidebar Derecho - Ranking o Crear -->
        <div class="space-y-6">
          {#if !myTeamId}
            <div class="bg-gradient-to-br from-[#0c3641] to-casa-teal p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
              <div class="absolute top-0 right-0 p-4 opacity-10"><Plus size={100}/></div>
              <h3 class="text-2xl font-bold text-casa-gold mb-2 relative z-10">Funda tu Equipo</h3>
              <p class="text-sm text-gray-200 mb-6 relative z-10">Conviértete en líder, recluta talento bajo tu marca interna y multiplica tus comisiones.</p>
              <button onclick={() => showModal = true} class="w-full bg-casa-gold text-[#0c3641] py-3 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-white transition-colors relative z-10 shadow-lg">
                Crear Mi Equipo
              </button>
            </div>
          {/if}

          <!-- Ranking Top -->
          <div class="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100">
            <h3 class="font-bold text-[#0c3641] flex items-center gap-2 mb-4 border-b border-gray-100 pb-2"><Star size={16} class="text-casa-gold"/> Ranking Elite</h3>
            <div class="space-y-4">
              {#each equipos.slice(0,3) as eq, i}
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">#{i+1}</div>
                  <div class="flex-1">
                    <p class="font-bold text-sm text-[#0c3641]">{eq.nombre}</p>
                    <p class="text-[10px] uppercase text-gray-400 tracking-widest">{eq.ventas || 0} Ventas este mes</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    
    {:else if viewMode === 'myTeam' && myTeamData}
      <!-- Vista Mi Equipo -->
      <div class="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-500">
        
        <!-- Banner Equipo -->
        <div class="h-48 bg-[#0c3641] relative flex items-end p-8">
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-casa-teal/20 rounded-full blur-3xl"></div>
          
          <div class="relative z-10 flex items-center gap-6 w-full">
            <div class="w-24 h-24 bg-white rounded-full border-4 border-casa-gold shadow-2xl flex items-center justify-center overflow-hidden">
              {#if myTeamData.logo}
                <img src={myTeamData.logo} alt={myTeamData.nombre} class="w-full h-full object-cover" />
              {:else}
                <Shield size={40} class="text-gray-300"/>
              {/if}
            </div>
            <div class="flex-1">
              <h2 class="text-4xl font-black text-white tracking-tight">{myTeamData.nombre}</h2>
              <p class="text-casa-gold font-bold text-sm uppercase tracking-widest mt-1">Líder: {myTeamData.liderNombre}</p>
            </div>
          </div>
        </div>

        <div class="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50">
          
          <!-- Solicitudes Pendientes (Solo Lider) -->
          {#if myTeamData.liderId === authState.user.uid}
            <div class="md:col-span-3">
              <h3 class="font-bold text-[#0c3641] mb-4 flex items-center gap-2"><Clock size={18}/> Solicitudes de Ingreso Pendientes</h3>
              {#if solicitudesPendientes.length === 0}
                <div class="bg-white p-6 rounded-xl border border-gray-200 text-center text-sm font-medium text-gray-400 shadow-sm">No tienes solicitudes pendientes.</div>
              {:else}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each solicitudesPendientes as sol}
                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {#if sol.userFoto}<img src={sol.userFoto} alt={sol.userName} class="w-full h-full object-cover"/>{:else}<User size={18} class="text-gray-400"/>{/if}
                        </div>
                        <div>
                          <p class="font-bold text-sm text-[#0c3641]">{sol.userName}</p>
                          <p class="text-[10px] text-gray-400 uppercase tracking-widest">Quiere unirse</p>
                        </div>
                      </div>
                      <button onclick={() => aceptarSolicitud(sol)} class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors" title="Aceptar">
                        <CheckCircle size={16}/>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}

          <!-- Stats Equipo -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Miembros Activos</h4>
            <p class="text-4xl font-black text-[#0c3641]">{myTeamData.miembros}</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ventas Totales (Mes)</h4>
            <p class="text-4xl font-black text-casa-teal">{myTeamData.ventas || 0}</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-casa-gold">
            <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tu Rango</h4>
            <p class="text-xl font-black text-[#0c3641] mt-2">{myTeamData.liderId === authState.user.uid ? '👑 Team Leader' : '⭐ Agente Asociado'}</p>
          </div>

          <!-- Agentes y Propiedades del Equipo -->
          <div class="md:col-span-2 space-y-6">
            <div class="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-200">
              <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-[#0c3641] flex items-center gap-2"><Building2 size={18}/> Exclusivas del Equipo</h3>
                <button onclick={loadMisInmuebles} class="text-xs text-casa-teal font-bold bg-casa-teal/10 px-3 py-1 rounded-full hover:bg-casa-teal hover:text-white transition-colors cursor-pointer border-none">+ Añadir Propiedad</button>
              </div>
              
              {#if propiedadesEquipo.length === 0}
                <div class="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p class="text-gray-400 font-bold uppercase tracking-widest text-xs">Aún no hay propiedades exclusivas.</p>
                </div>
              {:else}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {#each propiedadesEquipo as prop}
                    <a href="/inmuebles/{prop.id}" class="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer block">
                      <div class="h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                        <img src={prop.fotoPrincipal} alt="Casa" class="w-full h-full object-cover"/>
                      </div>
                      <h4 class="font-bold text-sm text-[#0c3641] truncate">{prop.tituloPropiedad || prop.tipoInmueble}</h4>
                      <p class="text-xs text-gray-500 flex justify-between mt-1"><span>${prop.precioLista}</span> <span class="text-casa-teal font-bold">{prop.tipoOperacion}</span></p>
                      <p class="text-[9px] uppercase font-bold text-gray-400 mt-2 truncate">Por: {prop.agenteNombre}</p>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Muro y Miembros -->
          <div class="space-y-6">
            <div class="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-200">
              <h3 class="font-bold text-[#0c3641] mb-4 flex items-center gap-2"><Users size={18}/> Directorio del Equipo</h3>
              <div class="space-y-3">
                {#each miembrosEquipo as miembro}
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden {miembro.id === myTeamData.liderId ? 'border-2 border-casa-gold' : ''}">
                      {#if miembro.documentos?.foto}
                        <img src={miembro.documentos.foto} alt="Foto" class="w-full h-full object-cover"/>
                      {:else}
                        <User size={16} class="text-gray-400"/>
                      {/if}
                    </div>
                    <div>
                      <p class="font-bold text-sm text-[#0c3641]">{miembro.nombres}</p>
                      <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        {miembro.id === myTeamData.liderId ? 'Team Leader' : 'Agente'}
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <div class="bg-casa-dark p-6 rounded-[1.5rem] shadow-xl text-white">
              <h3 class="font-bold mb-2 flex items-center gap-2 text-casa-gold"><MessageSquare size={18}/> Muro Interno</h3>
              <p class="text-xs text-gray-300 mb-4">Chat exclusivo para agentes de {myTeamData.nombre}.</p>
              <button onclick={() => showChatModal = true} class="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-colors">Abrir Chat del Equipo</button>
            </div>
          </div>

        </div>
      </div>
    {/if}

  </div>
</div>

<!-- Create Team Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div class="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
      <div class="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-[#0c3641] flex items-center gap-2"><Shield size={24} class="text-casa-gold"/> Fundar Equipo</h2>
        <button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600 font-bold p-2 text-xl">&times;</button>
      </div>
      <div class="p-8 space-y-6">
        
        <!-- Logo Upload -->
        <div class="flex flex-col items-center justify-center mb-4">
          <div class="relative group cursor-pointer w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden hover:border-casa-teal transition-colors">
            {#if logoPreview}
              <img src={logoPreview} alt="Logo" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon class="text-white" size={24}/>
              </div>
            {:else}
              <div class="text-gray-400 flex flex-col items-center text-[10px] uppercase font-bold tracking-widest">
                <Plus size={20} class="mb-1"/> Logo
              </div>
            {/if}
            <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" onchange={handleLogoUpload} />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nombre de la Franquicia / Equipo</label>
          <input type="text" bind:value={nombreEquipo} class="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal shadow-sm font-bold text-[#0c3641]" placeholder="Ej. Equipo Dinamita, Luxury Real Estate..." />
        </div>
        <div>
          <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Eslogan o Descripción Corta</label>
          <textarea bind:value={descripcionEquipo} rows="2" class="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal shadow-sm resize-none font-medium text-gray-600" placeholder="Ej. Líderes en ventas de Zona Sur..."></textarea>
        </div>
      </div>
      <div class="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        <button onclick={() => showModal = false} class="px-6 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-200 transition-colors">Cancelar</button>
        <button onclick={crearEquipo} disabled={isSaving || !nombreEquipo} class="px-8 py-3 bg-[#0c3641] text-white rounded-xl font-bold text-sm shadow-xl hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50">
          {#if isSaving}<Loader2 size={16} class="animate-spin"/>{:else}<Shield size={16}/>{/if} Fundar Equipo Oficial
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Chat Modal -->
{#if showChatModal && myTeamData}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div class="bg-white rounded-[2rem] w-full max-w-xl h-[80vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
      <!-- Header -->
      <div class="p-6 bg-[#0c3641] text-white flex justify-between items-center shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-white rounded-full border-2 border-casa-gold overflow-hidden flex items-center justify-center">
            {#if myTeamData.logo}<img src={myTeamData.logo} alt="Logo" class="w-full h-full object-cover"/>{:else}<Shield class="text-gray-400" size={20}/>{/if}
          </div>
          <div>
            <h3 class="font-bold text-lg leading-tight">{myTeamData.nombre}</h3>
            <p class="text-xs text-casa-gold uppercase tracking-widest font-bold">Muro Privado</p>
          </div>
        </div>
        <button onclick={() => showChatModal = false} class="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
      </div>

      <!-- Messages -->
      <div id="teamChatBox" class="flex-1 p-6 overflow-y-auto bg-[#f4f7f6] space-y-4">
        {#if chatMessages.length === 0}
          <div class="text-center py-10 opacity-50">
            <MessageSquare size={48} class="mx-auto mb-4"/>
            <p class="text-sm font-bold uppercase tracking-widest">No hay mensajes aún.</p>
            <p class="text-xs">¡Rompe el hielo y saluda a tu equipo!</p>
          </div>
        {:else}
          {#each chatMessages as msg}
            <div class="flex gap-3 {msg.autorId === authState.user.uid ? 'flex-row-reverse' : ''}">
              <div class="w-8 h-8 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                {#if msg.autorFoto}<img src={msg.autorFoto} alt="" class="w-full h-full object-cover"/>{:else}<User size={16} class="text-gray-400 m-auto h-full"/>{/if}
              </div>
              <div class="max-w-[70%]">
                {#if msg.autorId !== authState.user.uid}
                  <p class="text-[10px] text-gray-500 font-bold ml-1 mb-1">{msg.autorNombre}</p>
                {/if}
                <div class="p-3 rounded-2xl {msg.autorId === authState.user.uid ? 'bg-casa-teal text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-[#0c3641] rounded-tl-sm'} shadow-sm">
                  <p class="text-sm">{msg.texto}</p>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Input -->
      <div class="p-4 bg-white border-t border-gray-100 shrink-0">
        <form onsubmit={(e) => { e.preventDefault(); enviarMensaje(); }} class="flex items-center gap-2">
          <input type="text" bind:value={newMessage} placeholder="Escribe un mensaje..." class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-casa-teal transition-colors" />
          <button type="submit" disabled={!newMessage.trim()} class="w-12 h-12 bg-[#0c3641] text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50">
            <Send size={18}/>
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Add Propiedad Modal -->
{#if showAddPropiedadModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div class="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden">
      <div class="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
        <h2 class="text-xl font-bold text-[#0c3641] flex items-center gap-2"><Building2 size={24} class="text-casa-teal"/> Selecciona una Propiedad</h2>
        <button onclick={() => showAddPropiedadModal = false} class="p-2 text-gray-400 hover:text-gray-800 rounded-full transition-colors"><X size={24}/></button>
      </div>
      <div class="flex-1 overflow-y-auto p-6 bg-[#f4f7f6]">
        {#if misInmuebles.length === 0}
          <div class="text-center py-10 text-gray-400">No tienes propiedades activas para compartir.</div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each misInmuebles as prop}
              <div class="bg-white border border-gray-200 p-4 rounded-xl flex flex-col hover:border-casa-teal transition-colors">
                <div class="h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  <img src={prop.fotoPrincipal} alt="Prop" class="w-full h-full object-cover" />
                </div>
                <h4 class="font-bold text-sm text-[#0c3641] truncate mb-2">{prop.tituloPropiedad || prop.tipoInmueble}</h4>
                <button onclick={() => compartirPropiedad(prop.id)} disabled={prop.equipoId === myTeamData.id} class="w-full py-2 {prop.equipoId === myTeamData.id ? 'bg-gray-100 text-gray-400' : 'bg-casa-teal text-white hover:bg-[#0c3641]'} rounded-lg text-xs font-bold uppercase tracking-widest transition-colors mt-auto">
                  {prop.equipoId === myTeamData.id ? 'Ya Compartida' : 'Compartir con Equipo'}
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
