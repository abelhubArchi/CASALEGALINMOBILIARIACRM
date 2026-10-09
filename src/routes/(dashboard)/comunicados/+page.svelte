<script>
  import { onMount } from 'svelte';
  import { Megaphone, Bell, Calendar, ChevronRight } from 'lucide-svelte';
  import { db } from '#lib/firebase';
  import { collection, getDocs, query, orderBy } from 'firebase/firestore';

  let comunicados = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const snap = await getDocs(collection(db, 'comunicados'));
      comunicados = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
    } catch(e) { console.error(e); }
    finally { loading = false; }
  });

  const formatDate = (ts) => {
    if(!ts) return 'Reciente';
    const date = ts.toDate();
    return new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
  };
</script>

<div class="p-8 font-sans h-full bg-casa-light flex flex-col overflow-y-auto">
  <header class="mb-10">
    <h1 class="text-3xl font-extrabold text-[#0c3641] flex items-center gap-3">
      <Megaphone size={32} class="text-casa-gold" /> 
      Casa Comunicados
    </h1>
    <p class="text-gray-500 mt-2">Mantente al tanto de las últimas noticias, eventos y actualizaciones de la red.</p>
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 space-y-6">
      
      {#if loading}
        <div class="flex justify-center py-20"><div class="animate-spin w-10 h-10 border-4 border-casa-teal border-t-transparent rounded-full"></div></div>
      {:else if comunicados.length === 0}
        <div class="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100">
          <Megaphone size={48} class="text-gray-300 mx-auto mb-4" />
          <h3 class="text-xl font-bold text-[#0c3641] mb-2">Sin Comunicados</h3>
          <p class="text-gray-500">No hay anuncios oficiales por el momento.</p>
        </div>
      {:else}
        {#each comunicados as c, i}
          <div class="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4" style="animation-delay: {i * 100}ms">
            <div class="absolute top-0 right-0 w-2 h-full {c.urgente ? 'bg-red-500' : 'bg-casa-teal'}"></div>
            <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              <Calendar size={14}/> {formatDate(c.createdAt)}
              {#if c.urgente}<span class="px-2 py-0.5 bg-red-100 text-red-600 rounded ml-2">Urgente</span>{/if}
            </div>
            <h2 class="text-2xl font-bold text-[#0c3641] mb-4">{c.titulo}</h2>
            <p class="text-gray-600 leading-relaxed mb-6 whitespace-pre-line">{c.contenido}</p>
            <button class="text-casa-teal font-bold text-sm hover:underline flex items-center gap-1">Entendido <ChevronRight size={16}/></button>
          </div>
        {/each}
      {/if}

    </div>

    <!-- Sidebar de Notificaciones -->
    <div class="bg-[#0c3641] rounded-[2rem] p-6 text-white shadow-xl h-fit sticky top-8">
      <h3 class="font-bold flex items-center gap-2 mb-6 text-casa-gold"><Bell size={18}/> Alertas Rápidas</h3>
      
      <div class="space-y-4">
        {#each comunicados.filter(c => c.urgente).slice(0,3) as c}
          <div class="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <p class="text-sm font-medium line-clamp-2">{c.titulo}</p>
            <p class="text-[10px] text-gray-400 mt-2">{formatDate(c.createdAt)}</p>
          </div>
        {/each}
        {#if comunicados.filter(c => c.urgente).length === 0}
          <p class="text-sm text-gray-400 text-center py-4">No hay alertas urgentes.</p>
        {/if}
      </div>
    </div>
  </div>
</div>
