<script>
  import { MapIcon, MapPin } from 'lucide-svelte';
</script>

<div class="p-10 font-sans h-full flex flex-col bg-gray-50/50">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 flex-shrink-0">
    <div class="flex items-center gap-4">
      <div class="p-3 bg-casa-dark/5 text-casa-dark rounded-xl">
        <MapIcon size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-bold text-casa-dark mb-1">Mapa Casa Legal</h1>
        <p class="text-gray-500 text-lg">Visión geográfica de captaciones, proyectos y oficinas.</p>
      </div>
    </div>
  </div>

  <div class="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[500px]">
    <!-- Placeholder for an actual map integration like Mapbox or Google Maps -->
    <div class="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
      <MapPin size={48} class="mb-4 text-casa-teal/40" />
      <p class="text-lg font-medium text-gray-500 uppercase tracking-widest">Integración de Mapa Pendiente</p>
      <p class="text-sm mt-2">Aquí se visualizará el mapa interactivo con todos los marcadores.</p>
    </div>
  </div>
</div>
