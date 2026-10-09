<script>
  import { onMount } from 'svelte';
  import { Store, MapPin, Phone, ExternalLink } from 'lucide-svelte';
  import { db } from '#lib/firebase';
  import { collection, getDocs } from 'firebase/firestore';

  let sucursales = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const snap = await getDocs(collection(db, 'sucursales'));
      sucursales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) { console.error(e); }
    finally { loading = false; }
  });
</script>

<div class="p-8 font-sans h-full bg-casa-light overflow-y-auto">
  <header class="mb-10 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h1 class="text-4xl font-extrabold text-[#0c3641] flex items-center justify-center gap-3 mb-4">
      <Store size={36} class="text-casa-teal" /> 
      Nuestras Sucursales
    </h1>
    <p class="text-gray-500 text-lg">Visítanos en nuestras oficinas modernas. Estamos aquí para cerrar los mejores tratos contigo y tus clientes.</p>
  </header>

  {#if loading}
    <div class="flex justify-center py-20"><div class="animate-spin w-10 h-10 border-4 border-casa-teal border-t-transparent rounded-full"></div></div>
  {:else if sucursales.length === 0}
    <div class="text-center py-20 bg-white rounded-[2rem] shadow-sm max-w-2xl mx-auto border border-gray-100">
      <Store size={48} class="text-gray-300 mx-auto mb-4" />
      <h3 class="text-xl font-bold text-[#0c3641] mb-2">Aún no hay sucursales</h3>
      <p class="text-gray-500">La administración aún no ha registrado sucursales en la red.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {#each sucursales as s, i}
        <div class="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95" style="animation-delay: {i * 100}ms">
          <div class="h-48 bg-gray-200 relative overflow-hidden">
            <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#0c3641]/90 to-transparent"></div>
            <div class="absolute bottom-6 left-6 pr-6">
              {#if i === 0}<span class="px-3 py-1 bg-casa-gold text-[#0c3641] text-[10px] font-black uppercase tracking-widest rounded mb-2 inline-block shadow-lg">Casa Matriz</span>{/if}
              <h2 class="text-2xl font-bold text-white leading-tight">{s.nombre}</h2>
            </div>
          </div>
          <div class="p-8">
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <MapPin size={20} class="text-casa-teal shrink-0 mt-0.5" />
                <p class="text-gray-600 font-medium text-sm leading-relaxed">{s.direccion}</p>
              </div>
              {#if s.telefono}
                <div class="flex items-center gap-3">
                  <Phone size={20} class="text-casa-teal shrink-0" />
                  <p class="text-gray-600 font-medium text-sm">{s.telefono}</p>
                </div>
              {/if}
            </div>
            <div class="mt-8 flex gap-3">
              <button class="flex-1 py-3 bg-[#0c3641] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-black transition-colors">Agendar Cita</button>
              <a href="https://maps.google.com/?q={encodeURIComponent(s.direccion)}" target="_blank" class="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors" title="Ver en Google Maps"><ExternalLink size={20}/></a>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
