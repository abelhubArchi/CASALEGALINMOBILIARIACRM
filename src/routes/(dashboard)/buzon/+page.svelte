<script>
  import { Mail, Send, Inbox, AlertCircle } from 'lucide-svelte';

  let mensajes = $state([
    { id: 1, remitente: 'Legal Corporativo', asunto: 'Revisión de Contrato CL-001', estado: 'No Leído', tiempo: 'hace 2 horas' },
    { id: 2, remitente: 'Soporte TI', asunto: 'Actualización de credenciales', estado: 'Leído', tiempo: 'ayer' }
  ]);
</script>

<div class="p-10 font-sans h-full flex flex-col bg-gray-50/50">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div class="flex items-center gap-4">
      <div class="p-3 bg-casa-dark/5 text-casa-dark rounded-xl">
        <Mail size={32} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-bold text-casa-dark mb-1">Buzón Casa</h1>
        <p class="text-gray-500 text-lg">Sistema de mensajería interna, solicitudes y tickets.</p>
      </div>
    </div>
    <button class="bg-casa-dark text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 uppercase tracking-wider text-sm">
      <Send size={18} /> Nuevo Ticket
    </button>
  </div>

  <div class="flex flex-1 gap-6">
    <div class="w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
      <button class="flex items-center gap-3 px-4 py-3 bg-casa-teal/10 text-casa-teal font-bold rounded-xl w-full text-left">
        <Inbox size={18} /> Bandeja de Entrada
      </button>
      <button class="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 font-medium rounded-xl w-full text-left transition-colors">
        <AlertCircle size={18} /> Tickets Abiertos
      </button>
      <button class="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 font-medium rounded-xl w-full text-left transition-colors">
        <Send size={18} /> Enviados
      </button>
    </div>

    <div class="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {#each mensajes as msg}
        <div class="flex items-center p-4 border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors {msg.estado === 'No Leído' ? 'bg-casa-dark/5' : ''}">
          <div class="w-12 h-12 rounded-full bg-casa-gold/20 flex items-center justify-center text-casa-gold font-bold mr-4">
            {msg.remitente.charAt(0)}
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-casa-dark {msg.estado === 'No Leído' ? 'text-base' : 'text-sm font-medium'}">{msg.remitente}</h4>
            <p class="text-sm text-gray-600 truncate">{msg.asunto}</p>
          </div>
          <span class="text-xs text-gray-400 font-medium">{msg.tiempo}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
