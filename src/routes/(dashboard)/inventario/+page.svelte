<script>
  import { Search, Plus, Filter, MapPin, Bed, Bath, Maximize, Building, UserPlus, Home, Tag, Image as ImageIcon } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { db } from '#lib/firebase';
  import { collection, doc, updateDoc, arrayUnion, getDocs, query, orderBy } from 'firebase/firestore';
  import { onMount } from 'svelte';

  let properties = $state([]);
  let loading = $state(true);
  let searchQuery = $state('');
  let showFilters = $state(false);
  let activeFilters = $state({
    operacion: 'Todas', // Venta, Alquiler, Anticrético...
    inmueble: 'Todos', // Casa, Departamento, Lote...
    precioMin: '',
    precioMax: '',
    dormitorios: 'Todos', // 1, 2, 3, 4+
  });

  onMount(async () => {
    try {
      const q = query(collection(db, 'inmuebles'), orderBy('fechaCreacion', 'desc'));
      const querySnapshot = await getDocs(q);
      properties = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      loading = false;
    }
  });

  const filteredProperties = $derived(
    properties.filter(p => {
      // Búsqueda por texto libre
      const titulo = p.tituloPropiedad || (p.tipoInmueble ? p.tipoInmueble + ' en ' + p.zona : '');
      const matchSearch = titulo.toLowerCase().includes(searchQuery.toLowerCase()) || p.zona?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtros avanzados
      const matchOperacion = activeFilters.operacion === 'Todas' || p.tipoOperacion === activeFilters.operacion;
      const matchInmueble = activeFilters.inmueble === 'Todos' || p.tipoInmueble === activeFilters.inmueble;
      
      const precio = Number(p.precioLista);
      const min = activeFilters.precioMin ? Number(activeFilters.precioMin) : 0;
      const max = activeFilters.precioMax ? Number(activeFilters.precioMax) : Infinity;
      const matchPrecio = precio >= min && precio <= max;

      let matchDorms = true;
      if (activeFilters.dormitorios !== 'Todos') {
        const totalDorms = Number(p.dormitoriosSuite || 0) + Number(p.dormitoriosEstandar || 0);
        if (activeFilters.dormitorios === '4+') matchDorms = totalDorms >= 4;
        else matchDorms = totalDorms === Number(activeFilters.dormitorios);
      }

      return matchSearch && matchOperacion && matchInmueble && matchPrecio && matchDorms;
    })
  );

  const resetFilters = () => {
    activeFilters = { operacion: 'Todas', inmueble: 'Todos', precioMin: '', precioMax: '', dormitorios: 'Todos' };
    showFilters = false;
  };

  const conectarPropiedad = async (propId) => {
    if (!authState.user || !authState.profile) {
      alert("Debes iniciar sesión para conectar propiedades.");
      return;
    }
    
    if (authState.profile.matches?.includes(propId)) {
      alert("Ya has conectado con esta propiedad. Revisa tu Casa de Matches.");
      return;
    }

    try {
      const docRef = doc(db, 'usuarios', authState.user.uid);
      await updateDoc(docRef, {
        matches: arrayUnion(propId)
      });
      
      if (!authState.profile.matches) authState.profile.matches = [];
      authState.profile.matches.push(propId);
      
      alert("¡Propiedad conectada exitosamente a tu Casa de Matches!");
    } catch (error) {
      console.error(error);
      alert("Error al conectar: " + error.message);
    }
  };
</script>

<div class="p-8 md:p-12 font-sans h-full flex flex-col bg-casa-light overflow-y-auto">
  
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div class="flex items-center gap-4">
      <div class="p-4 bg-casa-dark/5 text-casa-dark rounded-2xl shadow-sm border border-gray-200">
        <Home size={36} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-extrabold text-casa-dark tracking-tight">Inventario Casa</h1>
        <p class="text-gray-500 text-lg mt-1">Explora propiedades de todos los agentes y conéctalas a tus matches.</p>
      </div>
    </div>
    <a href="/inmuebles/nuevo" class="bg-casa-dark text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 uppercase tracking-wider text-sm">
      <Plus size={18} /> Subir Inmueble
    </a>
  </div>

  <div class="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 mb-8 relative">
    <div class="relative flex-1">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input 
        type="text" 
        bind:value={searchQuery} 
        placeholder="Buscar por zona, tipo (Casa, Departamento) u operación (Venta, Alquiler)..." 
        class="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-casa-teal focus:bg-white outline-none transition-colors text-sm font-medium" 
      />
    </div>
    <button onclick={() => showFilters = !showFilters} class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 border border-gray-200 text-casa-dark rounded-xl hover:bg-gray-100 transition-colors font-bold text-sm {showFilters ? 'bg-gray-200' : ''}">
      <Filter size={16} /> Filtros Avanzados
    </button>
    
    <!-- Filtros Panel -->
    {#if showFilters}
      <div class="absolute top-[110%] right-0 w-full md:w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 animate-in fade-in slide-in-from-top-4">
        <h3 class="font-bold text-casa-dark mb-4 border-b border-gray-100 pb-2">Filtros de Búsqueda</h3>
        
        <div class="space-y-4">
          <div>
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Operación</label>
            <select bind:value={activeFilters.operacion} class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm">
              <option>Todas</option><option>Venta</option><option>Alquiler</option><option>Anticrético</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Tipo de Inmueble</label>
            <select bind:value={activeFilters.inmueble} class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm">
              <option>Todos</option><option>Casa</option><option>Departamento</option><option>Terreno/Lote</option><option>Oficina</option><option>Local comercial</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Precio Mín ($)</label>
              <input type="number" bind:value={activeFilters.precioMin} placeholder="0" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Precio Máx ($)</label>
              <input type="number" bind:value={activeFilters.precioMax} placeholder="Sin límite" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm" />
            </div>
          </div>
          <div>
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Dormitorios</label>
            <div class="flex gap-2">
              {#each ['Todos', '1', '2', '3', '4+'] as dorm}
                <button onclick={() => activeFilters.dormitorios = dorm} class="flex-1 py-2 text-xs font-bold rounded-lg border {activeFilters.dormitorios === dorm ? 'bg-casa-teal border-casa-teal text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'} transition-colors">
                  {dorm}
                </button>
              {/each}
            </div>
          </div>
        </div>
        
        <div class="mt-6 pt-4 border-t border-gray-100 flex justify-between gap-3">
          <button onclick={resetFilters} class="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors uppercase tracking-wider">Limpiar</button>
          <button onclick={() => showFilters = false} class="px-4 py-2 bg-casa-dark text-white rounded-lg text-xs font-bold uppercase tracking-wider flex-1 hover:bg-black transition-colors">Aplicar Filtros</button>
        </div>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-casa-teal"></div>
    </div>
  {:else if filteredProperties.length === 0}
    <div class="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
      <Home size={48} class="mx-auto text-gray-300 mb-4" />
      <h3 class="text-xl font-bold text-casa-dark mb-2">No hay propiedades en el inventario</h3>
      <p class="text-gray-500">Sé el primero en subir un inmueble para que toda la red lo vea.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
      {#each filteredProperties as prop}
        <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col relative">
          
          <a href="/inmuebles/{prop.id}" class="block">
            <div class="relative h-72 overflow-hidden bg-gray-100 p-2">
              <div class="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                <img src={prop.fotoPrincipal} alt="Portada" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />
                <div class="absolute inset-0 bg-gradient-to-t from-casa-dark/80 via-transparent to-black/40"></div>
                
                <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-full pr-4 p-1 flex items-center gap-2 shadow-lg border border-white/40">
                  {#if prop.agenteFoto}
                    <img src={prop.agenteFoto} alt="Agente" class="w-8 h-8 rounded-full object-cover border border-casa-gold" />
                  {:else}
                    <div class="w-8 h-8 rounded-full bg-casa-teal flex items-center justify-center text-white text-xs font-bold uppercase">
                      {prop.agenteNombre?.charAt(0) || 'A'}
                    </div>
                  {/if}
                  <span class="text-xs font-bold text-casa-dark">{prop.agenteNombre || 'Agente'}</span>
                </div>

                <div class="absolute bottom-4 left-4 flex gap-2">
                  <div class="bg-casa-gold text-casa-dark text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                    {prop.tipoOperacion}
                  </div>
                  <div class="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/20 flex items-center gap-1">
                    <Tag size={12}/> {prop.tipoInmueble}
                  </div>
                </div>

                {#if authState.profile?.matches?.includes(prop.id)}
                  <div class="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-bold p-2 rounded-full shadow-lg" title="Conectado">
                    <UserPlus size={16} />
                  </div>
                {/if}
              </div>
            </div>
            
            <div class="p-6 flex-1 flex flex-col relative pb-0">
              <h3 class="text-xl font-extrabold text-casa-dark mb-1 leading-tight line-clamp-1">{prop.tituloPropiedad || prop.tipoInmueble + ' en ' + prop.zona}</h3>
              <p class="text-gray-400 text-xs font-medium flex items-center gap-1.5 mb-5 uppercase tracking-wider">
                <MapPin size={14} class="text-casa-teal" /> {prop.ciudad}
              </p>
              
              {#if prop.tipoInmueble !== 'Terreno/Lote' && prop.tipoInmueble !== 'Terreno comercial'}
                <div class="flex items-center justify-between border-y border-gray-100 py-4 mb-5 flex-1">
                  <div class="flex flex-col items-center">
                    <span class="flex items-center gap-1.5 text-casa-dark font-bold text-lg"><Bed size={18} class="text-gray-400"/> {Number(prop.dormitoriosSuite || 0) + Number(prop.dormitoriosEstandar || 0)}</span>
                  </div>
                  <div class="w-px h-6 bg-gray-200"></div>
                  <div class="flex flex-col items-center">
                    <span class="flex items-center gap-1.5 text-casa-dark font-bold text-lg"><Bath size={18} class="text-gray-400"/> {prop.banosCompletos || 0}</span>
                  </div>
                  <div class="w-px h-6 bg-gray-200"></div>
                  <div class="flex flex-col items-center">
                    <span class="flex items-center gap-1.5 text-casa-dark font-bold text-lg"><Maximize size={18} class="text-gray-400"/> {prop.supConstruida || prop.supTerreno || 0}<span class="text-[10px] text-gray-400 uppercase">m²</span></span>
                  </div>
                </div>
              {:else}
                <div class="flex items-center justify-center border-y border-gray-100 py-4 mb-5 flex-1">
                  <span class="flex items-center gap-2 text-casa-dark font-bold text-xl"><Maximize size={20} class="text-gray-400"/> {prop.supTerreno || 0} <span class="text-xs text-gray-400 uppercase">m² Totales</span></span>
                </div>
              {/if}
            </div>
          </a>
          
          <div class="px-6 pb-6 mt-auto">
            <div class="flex items-center justify-between mt-auto pt-2">
              <div>
                <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Precio de {prop.tipoOperacion}</p>
                <span class="text-casa-teal font-black text-2xl">${prop.precioLista}</span>
              </div>
              
              <button 
                onclick={(e) => { e.preventDefault(); conectarPropiedad(prop.id); }}
                disabled={authState.profile?.matches?.includes(prop.id) || authState.user?.uid === prop.agenteId}
                class="bg-casa-dark text-white px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 hover:bg-black transition-all shadow-md disabled:opacity-50 disabled:bg-gray-400 group-hover:scale-105"
              >
                {#if authState.user?.uid === prop.agenteId}
                  Mi Captación
                {:else if authState.profile?.matches?.includes(prop.id)}
                  Conectado
                {:else}
                  <UserPlus size={16} /> Agregar a Casa
                {/if}
              </button>
            </div>
          </div>

        </div>
      {/each}
    </div>
  {/if}
</div>
