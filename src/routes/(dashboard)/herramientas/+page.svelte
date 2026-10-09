<script>
  import { Wrench, FileText, Download, FileSignature } from 'lucide-svelte';

  let categorias = [
    { nombre: 'Formatos Legales', icono: FileSignature, archivos: ['Contrato Compra-Venta.pdf', 'Contrato Arrendamiento.docx', 'Aviso Privacidad.pdf'] },
    { nombre: 'Manuales de Operación', icono: FileText, archivos: ['Manual del Asesor.pdf', 'Guía de Procesos.pdf'] }
  ];
</script>

<div class="p-10 font-sans h-full flex flex-col bg-gray-50/50">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div class="flex items-center gap-4">
      <div class="p-3 bg-casa-dark/5 text-casa-dark rounded-xl">
        <Wrench size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-bold text-casa-dark mb-1">Caja de Herramientas</h1>
        <p class="text-gray-500 text-lg">Recursos descargables, manuales y formatos legales aprobados.</p>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    {#each categorias as cat}
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <svelte:component this={cat.icono} size={24} class="text-casa-teal" />
          <h2 class="text-xl font-bold text-casa-dark">{cat.nombre}</h2>
        </div>
        <ul class="space-y-3">
          {#each cat.archivos as file}
            <li class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors group">
              <span class="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText size={16} class="text-gray-400" /> {file}
              </span>
              <button class="text-gray-400 hover:text-casa-gold transition-colors opacity-0 group-hover:opacity-100 p-1">
                <Download size={18} />
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</div>
