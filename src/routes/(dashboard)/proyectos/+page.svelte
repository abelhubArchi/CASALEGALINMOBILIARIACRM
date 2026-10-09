<script>
  import { Building2, Plus, Clock, MapPin } from 'lucide-svelte';

  let proyectos = $state([
    { id: 1, titulo: 'Torre Zafiro', ubicacion: 'Polanco', estado: 'Preventa Fase 1', avance: 25, img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' },
    { id: 2, titulo: 'Residencial Los Alpes', ubicacion: 'Santa Fe', estado: 'Construcción', avance: 60, img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80' }
  ]);
</script>

<div class="p-10 font-sans h-full flex flex-col bg-gray-50/50">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div class="flex items-center gap-4">
      <div class="p-3 bg-casa-dark/5 text-casa-dark rounded-xl">
        <Building2 size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-bold text-casa-dark mb-1">Casas en Pozo</h1>
        <p class="text-gray-500 text-lg">Catálogo de proyectos inmobiliarios en desarrollo o pre-venta.</p>
      </div>
    </div>
    <button class="bg-casa-dark text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 uppercase tracking-wider text-sm">
      <Plus size={18} /> Añadir Proyecto
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {#each proyectos as p}
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
        <div class="h-48 relative overflow-hidden bg-gray-200">
          <img src={p.img} alt={p.titulo} class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/20"></div>
          <div class="absolute top-3 left-3 bg-casa-gold px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest">{p.estado}</div>
        </div>
        <div class="p-6">
          <h3 class="text-xl font-bold text-casa-dark mb-2">{p.titulo}</h3>
          <p class="text-sm text-gray-500 flex items-center gap-2 mb-4"><MapPin size={14}/> {p.ubicacion}</p>
          
          <div class="mb-2 flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wide">
            <span>Avance de Obra</span>
            <span>{p.avance}%</span>
          </div>
          <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-casa-teal" style="width: {p.avance}%;"></div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
