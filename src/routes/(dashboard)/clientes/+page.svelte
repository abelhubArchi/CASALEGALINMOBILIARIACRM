<script>
  import { onMount } from 'svelte';
  import { Users, Filter, Plus, Phone, Mail, MoreHorizontal, Calendar, Trash2, X, Save } from 'lucide-svelte';
  import { db } from '#lib/firebase';
  import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
  import { authState } from '#lib/authStore.svelte.js';

  let clientes = $state([]);
  let loading = $state(true);
  let showModal = $state(false);
  let isSaving = $state(false);
  
  let searchQ = $state('');

  // Form
  let form = $state({ nombre: '', telefono: '', email: '', interes: 'Comprar', presupuesto: '', notas: '', estado: 'Nuevo' });

  const loadClientes = async () => {
    if (!authState.user) return;
    try {
      const q = query(collection(db, 'clientes'), where('agenteId', '==', authState.user.uid));
      const snap = await getDocs(q);
      clientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) { console.error(e); }
    finally { loading = false; }
  };

  onMount(loadClientes);

  const saveCliente = async () => {
    if (!form.nombre || !form.telefono) { alert("Nombre y Teléfono requeridos."); return; }
    isSaving = true;
    try {
      await addDoc(collection(db, 'clientes'), {
        ...form,
        agenteId: authState.user.uid,
        createdAt: serverTimestamp()
      });
      showModal = false;
      form = { nombre: '', telefono: '', email: '', interes: 'Comprar', presupuesto: '', notas: '', estado: 'Nuevo' };
      await loadClientes();
    } catch (e) { console.error(e); alert("Error guardando cliente."); }
    finally { isSaving = false; }
  };

  const deleteCliente = async (id) => {
    if(!confirm('¿Eliminar cliente?')) return;
    await deleteDoc(doc(db, 'clientes', id));
    clientes = clientes.filter(c => c.id !== id);
  };

  let filteredClientes = $derived(clientes.filter(c => c.nombre.toLowerCase().includes(searchQ.toLowerCase()) || c.telefono.includes(searchQ)));
</script>

<div class="p-8 font-sans h-full bg-casa-light flex flex-col relative">
  <header class="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
    <div>
      <h1 class="text-3xl font-extrabold text-[#0c3641] flex items-center gap-3">
        <Users size={32} class="text-casa-teal" /> 
        CRM de Clientes
      </h1>
      <p class="text-gray-500 mt-2">Gestiona tu cartera de clientes, leads y prospectos.</p>
    </div>
    <button onclick={() => showModal = true} class="bg-casa-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-all flex items-center gap-2 w-fit">
      <Plus size={18} /> Nuevo Lead
    </button>
  </header>

  <div class="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col">
    <div class="flex gap-4 mb-6">
      <input type="text" bind:value={searchQ} placeholder="Buscar cliente por nombre o teléfono..." class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-casa-teal font-medium" />
    </div>

    <div class="flex-1 overflow-x-auto border border-gray-100 rounded-xl relative">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-100">
            <th class="p-4 font-bold">Cliente</th>
            <th class="p-4 font-bold">Contacto</th>
            <th class="p-4 font-bold">Interés / Presupuesto</th>
            <th class="p-4 font-bold">Estado</th>
            <th class="p-4 font-bold text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#if loading}
            <tr><td colspan="5" class="py-10 text-center text-gray-400">Cargando...</td></tr>
          {:else if filteredClientes.length === 0}
            <tr>
              <td colspan="5" class="py-20 text-center">
                <Users size={48} class="text-gray-200 mx-auto mb-4" />
                <h3 class="text-lg font-bold text-[#0c3641]">No hay clientes registrados</h3>
                <p class="text-gray-500 text-sm mt-1">Presiona "Nuevo Lead" para agregar tu primer contacto.</p>
              </td>
            </tr>
          {:else}
            {#each filteredClientes as c}
              <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td class="p-4">
                  <p class="font-bold text-[#0c3641] text-sm">{c.nombre}</p>
                </td>
                <td class="p-4 space-y-1">
                  <p class="text-xs text-gray-600 flex items-center gap-1 font-medium"><Phone size={12}/> {c.telefono}</p>
                  {#if c.email}<p class="text-[10px] text-gray-400 flex items-center gap-1"><Mail size={12}/> {c.email}</p>{/if}
                </td>
                <td class="p-4">
                  <p class="font-bold text-sm text-casa-dark">{c.interes}</p>
                  {#if c.presupuesto}<p class="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">Hasta ${c.presupuesto}</p>{/if}
                </td>
                <td class="p-4">
                  <span class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded {c.estado === 'Nuevo' ? 'bg-casa-gold/20 text-casa-gold' : 'bg-casa-teal/20 text-casa-teal'}">{c.estado}</span>
                </td>
                <td class="p-4 text-center">
                  <button onclick={() => deleteCliente(c.id)} class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal Nuevo Cliente -->
  {#if showModal}
    <div class="absolute inset-0 bg-[#0c3641]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 class="text-xl font-bold text-[#0c3641]">Nuevo Lead (Cliente)</h2>
          <button onclick={() => showModal = false} class="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"><X size={20}/></button>
        </div>
        <form onsubmit={(e) => { e.preventDefault(); saveCliente(); }} class="p-6 space-y-4">
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nombre Completo *</label>
              <input type="text" bind:value={form.nombre} required class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Teléfono / WhatsApp *</label>
              <input type="text" bind:value={form.telefono} required class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Interés</label>
              <select bind:value={form.interes} class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-casa-teal font-medium">
                <option value="Comprar">Comprar</option>
                <option value="Alquilar">Alquilar</option>
                <option value="Vender">Vender (Dar a captar)</option>
                <option value="Invertir">Invertir</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Presupuesto ($USD)</label>
              <input type="number" bind:value={form.presupuesto} placeholder="Ej. 100000" class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
          </div>

          <div>
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Estado Inicial</label>
            <select bind:value={form.estado} class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-casa-teal font-medium">
              <option value="Nuevo">Nuevo Lead</option>
              <option value="Contactado">Contactado</option>
              <option value="En Seguimiento">En Seguimiento</option>
            </select>
          </div>

          <div class="pt-4 flex gap-3">
            <button type="button" onclick={() => showModal = false} class="flex-1 py-3 text-gray-500 font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-gray-100 transition-colors">Cancelar</button>
            <button type="submit" disabled={isSaving} class="flex-1 py-3 bg-casa-teal text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:bg-[#0c3641] transition-colors disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
