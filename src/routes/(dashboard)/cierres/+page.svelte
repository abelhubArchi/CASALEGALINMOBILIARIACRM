<script>
  import { Briefcase, FileCheck, DollarSign } from 'lucide-svelte';

  let cierres = $state([
    { id: 'C-1029', cliente: 'Alejandro Vargas', propiedad: 'Residencia Lomas VIP', monto: '$850,000', fecha: 'Oct 15, 2026', estado: 'Contrato Firmado' },
    { id: 'C-1030', cliente: 'Familia Gómez', propiedad: 'Villa del Sol Exclusiva', monto: '$450,000', fecha: 'Oct 20, 2026', estado: 'En Trámite Notarial' }
  ]);
</script>

<div class="p-10 font-sans h-full flex flex-col bg-gray-50/50">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div class="flex items-center gap-4">
      <div class="p-3 bg-casa-dark/5 text-casa-dark rounded-xl">
        <Briefcase size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-bold text-casa-dark mb-1">Casa de Cierres</h1>
        <p class="text-gray-500 text-lg">Panel de control de ventas, rentas y contratos finalizados.</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-8 overflow-hidden">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
          <th class="p-4 font-semibold">ID Operación</th>
          <th class="p-4 font-semibold">Cliente</th>
          <th class="p-4 font-semibold">Propiedad</th>
          <th class="p-4 font-semibold">Monto (USD)</th>
          <th class="p-4 font-semibold">Cierre Estimado</th>
          <th class="p-4 font-semibold">Estatus</th>
        </tr>
      </thead>
      <tbody>
        {#each cierres as c}
          <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
            <td class="p-4 text-sm font-bold text-casa-teal">{c.id}</td>
            <td class="p-4 text-sm text-casa-dark font-medium">{c.cliente}</td>
            <td class="p-4 text-sm text-gray-600">{c.propiedad}</td>
            <td class="p-4 text-sm font-bold text-casa-dark">{c.monto}</td>
            <td class="p-4 text-sm text-gray-500">{c.fecha}</td>
            <td class="p-4">
              <span class="bg-casa-gold/20 text-casa-dark px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-sm">
                {c.estado}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
