<script>
  import { onMount } from 'svelte';
  import { db } from '#lib/firebase';
  import { collection, getDocs, query, orderBy } from 'firebase/firestore';
  import { authState } from '#lib/authStore.svelte.js';
  import { UserPlus, Star, Search, MapPin, Phone, User, Plus } from 'lucide-svelte';

  let asesores = $state([]);
  let loading = $state(true);
  let searchQuery = $state('');
  
  let isSuperAdmin = $derived(
    authState.user?.email === 'bolevel12@gmail.com' || 
    authState.user?.email?.endsWith('@casalegaladmin.com')
  );

  onMount(async () => {
    try {
      const q = query(collection(db, 'usuarios'), orderBy('fechaRegistro', 'desc'));
      const snapshot = await getDocs(q);
      asesores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching asesores:", error);
    } finally {
      loading = false;
    }
  });

  const filteredAsesores = $derived(
    asesores.filter(a => 
      `${a.nombres} ${a.apellidos}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ci.includes(searchQuery)
    )
  );

</script>

<div class="p-8 md:p-12 font-sans h-full flex flex-col bg-casa-light overflow-y-auto">
  
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div class="flex items-center gap-4">
      <div class="p-4 bg-casa-dark/5 text-casa-dark rounded-2xl shadow-sm border border-gray-200">
        <Star size={36} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-extrabold text-casa-dark tracking-tight">Casa de Talento</h1>
        <p class="text-gray-500 text-lg mt-1">Directorio de asesores y brokers de Casa Legal.</p>
      </div>
    </div>
    {#if isSuperAdmin}
      <button onclick={() => window.location.href='/talento/nuevo'} class="px-5 py-3 bg-casa-teal text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg hover:bg-[#0c3641] transition-colors flex items-center gap-2">
        <Plus size={18}/>
        Nuevo Asesor
      </button>
    {/if}
  </div>

  <div class="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 mb-8">
    <div class="relative flex-1">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input 
        type="text" 
        bind:value={searchQuery} 
        placeholder="Buscar asesor por nombre, correo o especialidad..." 
        class="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-casa-teal focus:bg-white outline-none transition-colors text-sm font-medium" 
      />
    </div>
  </div>

  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-casa-teal"></div>
    </div>
  {:else if filteredAsesores.length === 0}
    <div class="flex-1 flex flex-col items-center justify-center text-gray-400">
      <Star size={48} class="mb-4 opacity-50" />
      <p class="text-xl font-bold text-casa-dark">No hay asesores registrados aún</p>
      <p class="text-sm mt-2 text-gray-500">Dale clic a "Añadir Nuevo Asesor" para registrar talento.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each filteredAsesores as asesor}
        <a href="/talento/{asesor.id}" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden block">
          <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-casa-teal to-casa-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          {#if asesor.documentos?.foto}
            <img src={asesor.documentos.foto} alt="Foto" class="w-24 h-24 rounded-full object-cover shadow-md mb-4 border-[3px] border-casa-gold/30 group-hover:scale-105 transition-transform" />
          {:else}
            <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4 border-[3px] border-gray-200">
              <User size={32} />
            </div>
          {/if}

          <h3 class="text-lg font-bold text-casa-dark leading-tight">{asesor.nombres} {asesor.apellidos}</h3>
          <p class="text-casa-teal text-xs font-bold uppercase tracking-widest mb-3 mt-1">{asesor.rol}</p>
          
          <div class="w-full pt-4 border-t border-gray-100 flex flex-col gap-2 text-gray-500 text-xs text-left">
            <span class="flex items-center gap-2"><MapPin size={14} class="text-gray-400"/> {asesor.ciudad || 'No definida'}, {asesor.departamento}</span>
            <span class="flex items-center gap-2"><Phone size={14} class="text-gray-400"/> {asesor.telefono}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
