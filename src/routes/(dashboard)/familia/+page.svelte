<script>
  import { Globe, Gift, Users } from 'lucide-svelte';

  let miembros = $state([
    { id: 1, nombre: 'Ana Morales', rol: 'Broker Senior', cumple: '12 Oct', foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
    { id: 2, nombre: 'Carlos Ruiz', rol: 'Asesor Inmobiliario', cumple: '25 Oct', foto: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' }
  ]);
</script>

<div class="p-10 font-sans h-full flex flex-col bg-gray-50/50">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div class="flex items-center gap-4">
      <div class="p-3 bg-casa-dark/5 text-casa-dark rounded-xl">
        <Globe size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-bold text-casa-dark mb-1">La Familia Casa</h1>
        <p class="text-gray-500 text-lg">Directorio de la red, cumpleaños y cultura interna.</p>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each miembros as m}
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
        <img src={m.foto} alt={m.nombre} class="w-24 h-24 rounded-full object-cover shadow-md mb-4 border-[3px] border-casa-gold/30" />
        <h3 class="text-lg font-bold text-casa-dark">{m.nombre}</h3>
        <p class="text-casa-teal text-xs font-bold uppercase tracking-widest mb-4">{m.rol}</p>
        
        <div class="w-full pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-500 text-sm">
          <Gift size={14} class="text-casa-gold" /> Cumpleaños: <span class="font-bold text-casa-dark">{m.cumple}</span>
        </div>
      </div>
    {/each}
  </div>
</div>
