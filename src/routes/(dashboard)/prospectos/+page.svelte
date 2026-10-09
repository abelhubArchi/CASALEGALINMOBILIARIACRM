<script>
  import { Users, Phone, Mail, Clock, MoreVertical, Plus, KanbanSquare } from 'lucide-svelte';
  
  let stages = ['Prospectos', 'Contactados', 'Visita Agendada', 'En Negociación', 'Cierres'];
  
  let clients = $state([
    { id: 1, name: 'Alejandro Vargas', email: 'ale@vargas.com', phone: '+52 55 1234 5678', stage: 'Contactados', interest: 'Residencia Lomas VIP' },
    { id: 2, name: 'Mariana Robles', email: 'mariana@robles.mx', phone: '+52 55 8765 4321', stage: 'Prospectos', interest: 'Penthouse Skyline' },
    { id: 3, name: 'Familia Gómez', email: 'gomez@fam.com', phone: '+52 55 9999 8888', stage: 'Visita Agendada', interest: 'Villa del Sol Exclusiva' },
  ]);

  const getClientsByStage = (stage) => clients.filter(c => c.stage === stage);
</script>

<div class="p-10 font-sans h-screen flex flex-col bg-gray-50/50">
  
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 flex-shrink-0">
    <div class="flex items-center gap-4">
      <div class="p-3 bg-casa-dark/5 text-casa-dark rounded-xl">
        <KanbanSquare size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-bold text-casa-dark mb-1">Casa de Prospectos</h1>
        <p class="text-gray-500 text-lg">CRM Privado: Gestión del embudo de ventas y seguimiento.</p>
      </div>
    </div>
    <button class="bg-casa-dark text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 uppercase tracking-wider text-sm">
      <Plus size={18} /> Añadir Cliente
    </button>
  </div>

  <!-- Kanban Board -->
  <div class="flex gap-6 overflow-x-auto pb-6 flex-1 custom-scrollbar">
    {#each stages as stage}
      <div class="w-80 flex-shrink-0 flex flex-col bg-gray-100/50 rounded-2xl p-4 border border-gray-200/50">
        <div class="flex items-center justify-between mb-4 px-2">
          <h3 class="font-bold text-casa-dark text-sm uppercase tracking-wider flex items-center gap-2">
            {stage}
            <span class="bg-white text-gray-500 text-[10px] px-2 py-0.5 rounded-full border border-gray-200">
              {getClientsByStage(stage).length}
            </span>
          </h3>
          <button class="text-gray-400 hover:text-casa-teal transition-colors"><MoreVertical size={16} /></button>
        </div>
        
        <div class="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
          {#each getClientsByStage(stage) as client}
            <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-casa-gold hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
              <div class="flex justify-between items-start mb-3">
                <h4 class="font-bold text-casa-dark leading-tight">{client.name}</h4>
                <div class="w-2 h-2 rounded-full bg-casa-teal mt-1"></div>
              </div>
              <p class="text-[11px] text-gray-500 mb-3 flex flex-col gap-1.5">
                <span class="flex items-center gap-1.5"><Mail size={12}/> {client.email}</span>
                <span class="flex items-center gap-1.5"><Phone size={12}/> {client.phone}</span>
              </p>
              <div class="pt-3 border-t border-gray-100 mt-2 flex items-center justify-between">
                <span class="text-[10px] font-semibold text-casa-gold uppercase tracking-wider truncate mr-2" title={client.interest}>
                  Ref: {client.interest}
                </span>
                <Clock size={12} class="text-gray-400 flex-shrink-0" />
              </div>
            </div>
          {/each}
          
          <button class="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-bold uppercase tracking-wider hover:border-casa-teal hover:text-casa-teal transition-colors flex items-center justify-center gap-2">
            <Plus size={14} /> Añadir Lead
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); }
</style>
