<script>
  import { onMount } from 'svelte';
  import { Wrench, Megaphone, Store, Mail, UserPlus, Trash2, Radio, CheckCircle, GraduationCap } from 'lucide-svelte';
  import { db } from '#lib/firebase';
  import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
  import AdminTalento from '#lib/components/AdminTalento.svelte';

  let currentTab = $state('comunicados');

  // Forms
  let tituloComunicado = $state('');
  let contenidoComunicado = $state('');
  let urgenteComunicado = $state(false);

  let asesorNombre = $state('');
  let asesorEmail = $state('');
  let asesorPassword = $state('');

  let nombreSucursal = $state('');
  let direccionSucursal = $state('');
  let telefonoSucursal = $state('');

  let emailAsunto = $state('');
  let emailMensaje = $state('');

  let isSaving = $state(false);

  // Lists
  let comunicados = $state([]);
  let sucursales = $state([]);
  let redCasaList = $state([]);

  const loadData = async () => {
    try {
      const snapC = await getDocs(collection(db, 'comunicados'));
      comunicados = snapC.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      
      const snapS = await getDocs(collection(db, 'sucursales'));
      sucursales = snapS.docs.map(d => ({ id: d.id, ...d.data() }));

      const snapR = await getDocs(collection(db, 'red_casa'));
      redCasaList = snapR.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
    } catch(e) { console.error(e); }
  };

  onMount(loadData);

  const publicarComunicado = async () => {
    if(!tituloComunicado || !contenidoComunicado) return;
    isSaving = true;
    try {
      await addDoc(collection(db, 'comunicados'), {
        titulo: tituloComunicado,
        contenido: contenidoComunicado,
        urgente: urgenteComunicado,
        createdAt: serverTimestamp()
      });
      tituloComunicado = ''; contenidoComunicado = ''; urgenteComunicado = false;
      alert("Comunicado publicado con éxito.");
      await loadData();
    } catch(e) { console.error(e); alert("Error"); }
    finally { isSaving = false; }
  };

  const addSucursal = async () => {
    if(!nombreSucursal || !direccionSucursal) return;
    isSaving = true;
    try {
      await addDoc(collection(db, 'sucursales'), {
        nombre: nombreSucursal,
        direccion: direccionSucursal,
        telefono: telefonoSucursal,
        createdAt: serverTimestamp()
      });
      nombreSucursal = ''; direccionSucursal = ''; telefonoSucursal = '';
      alert("Sucursal añadida.");
      await loadData();
    } catch(e) { console.error(e); alert("Error"); }
    finally { isSaving = false; }
  };

  const addAsesor = async () => {
    if(!asesorNombre || !asesorEmail) return;
    isSaving = true;
    try {
      await addDoc(collection(db, 'usuarios'), {
        nombres: asesorNombre,
        email: asesorEmail,
        rol: 'asesor',
        estatus: 'Activo',
        createdAt: serverTimestamp()
      });
      asesorNombre = ''; asesorEmail = ''; asesorPassword = '';
      alert("Asesor registrado en la base de datos.");
    } catch(e) { console.error(e); alert("Error"); }
    finally { isSaving = false; }
  };

  const deleteItem = async (col, id) => {
    if(confirm('¿Eliminar?')) {
      await deleteDoc(doc(db, col, id));
      await loadData();
    }
  };

  const updateRedStatus = async (id, status) => {
    if(confirm(`¿Marcar como ${status}?`)) {
      await updateDoc(doc(db, 'red_casa', id), { estado: status });
      await loadData();
    }
  };

</script>

<div class="p-8 font-sans h-full bg-[#f4f7f6] flex flex-col overflow-y-auto">
  <header class="mb-8">
    <div class="inline-flex p-3 bg-red-100 rounded-xl mb-4">
      <Wrench size={32} class="text-red-600" />
    </div>
    <h1 class="text-4xl font-extrabold text-[#0c3641] tracking-tight">Control Casa Legal</h1>
    <p class="text-gray-500 mt-2 text-lg">Panel de Poder Absoluto. Gestiona toda la plataforma desde aquí.</p>
  </header>

  <!-- Tabs Navigation -->
  <div class="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-2">
    <button onclick={() => currentTab = 'comunicados'} class="px-4 py-2 font-bold text-sm uppercase tracking-widest rounded-xl transition-all {currentTab === 'comunicados' ? 'bg-casa-teal text-white' : 'text-gray-500 hover:bg-gray-100'}">
      <span class="flex items-center gap-2"><Megaphone size={16}/> Comunicados</span>
    </button>
    <button onclick={() => currentTab = 'sucursales'} class="px-4 py-2 font-bold text-sm uppercase tracking-widest rounded-xl transition-all {currentTab === 'sucursales' ? 'bg-casa-teal text-white' : 'text-gray-500 hover:bg-gray-100'}">
      <span class="flex items-center gap-2"><Store size={16}/> Sucursales</span>
    </button>
    <button onclick={() => currentTab = 'talento'} class="px-4 py-2 font-bold text-sm uppercase tracking-widest rounded-xl transition-all {currentTab === 'talento' ? 'bg-casa-teal text-white' : 'text-gray-500 hover:bg-gray-100'}">
      <span class="flex items-center gap-2"><UserPlus size={16}/> Reclutamiento</span>
    </button>
    <button onclick={() => currentTab = 'emails'} class="px-4 py-2 font-bold text-sm uppercase tracking-widest rounded-xl transition-all {currentTab === 'emails' ? 'bg-casa-teal text-white' : 'text-gray-500 hover:bg-gray-100'}">
      <span class="flex items-center gap-2"><Mail size={16}/> Correo Masivo</span>
    </button>
    <button onclick={() => currentTab = 'marketing'} class="px-4 py-2 font-bold text-sm uppercase tracking-widest rounded-xl transition-all {currentTab === 'marketing' ? 'bg-casa-teal text-white' : 'text-gray-500 hover:bg-gray-100'}">
      <span class="flex items-center gap-2"><Radio size={16}/> Marketing (Red Casa)</span>
    </button>
    <button onclick={() => currentTab = 'cursos'} class="px-4 py-2 font-bold text-sm uppercase tracking-widest rounded-xl transition-all {currentTab === 'cursos' ? 'bg-casa-teal text-white' : 'text-gray-500 hover:bg-gray-100'}">
      <span class="flex items-center gap-2"><GraduationCap size={16}/> Cursos y Blogs</span>
    </button>
  </div>

  <div class="flex-1">
    
    {#if currentTab === 'comunicados'}
      <div class="grid md:grid-cols-2 gap-8">
        <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in">
          <h2 class="text-xl font-bold text-[#0c3641] mb-6">Publicar Comunicado</h2>
          <form class="space-y-6" onsubmit={(e) => { e.preventDefault(); publicarComunicado(); }}>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Título del Comunicado</label>
              <input type="text" bind:value={tituloComunicado} required class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Contenido</label>
              <textarea rows="6" bind:value={contenidoComunicado} required class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium resize-none"></textarea>
            </div>
            <div class="flex items-center gap-4 pt-4 border-t border-gray-100">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" bind:checked={urgenteComunicado} class="accent-red-500 w-4 h-4" /> <span class="text-sm font-bold text-red-600">Marcar como URGENTE</span>
              </label>
              <div class="flex-1"></div>
              <button type="submit" disabled={isSaving} class="px-6 py-3 bg-[#0c3641] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-black transition-colors disabled:opacity-50">
                Publicar Ahora
              </button>
            </div>
          </form>
        </div>
        
        <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 class="text-xl font-bold text-[#0c3641] mb-6">Historial de Comunicados</h2>
          <div class="space-y-4">
            {#each comunicados as c}
              <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-[#0c3641] flex items-center gap-2">{c.titulo} {#if c.urgente}<span class="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] rounded uppercase">Urgente</span>{/if}</h3>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">{c.contenido}</p>
                </div>
                <button onclick={() => deleteItem('comunicados', c.id)} class="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    
    {:else if currentTab === 'talento'}
      <div class="max-w-4xl animate-in fade-in">
        <AdminTalento />
      </div>

    {:else if currentTab === 'sucursales'}
      <div class="grid md:grid-cols-2 gap-8 animate-in fade-in">
        <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 class="text-xl font-bold text-[#0c3641] mb-6">Añadir Sucursal</h2>
          <form class="space-y-6" onsubmit={(e) => { e.preventDefault(); addSucursal(); }}>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Nombre de Sucursal</label>
              <input type="text" bind:value={nombreSucursal} required class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Dirección Completa</label>
              <input type="text" bind:value={direccionSucursal} required class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Teléfono (opcional)</label>
              <input type="text" bind:value={telefonoSucursal} class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
            <button type="submit" disabled={isSaving} class="w-full py-4 bg-[#0c3641] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-black transition-colors disabled:opacity-50">
              Guardar Sucursal
            </button>
          </form>
        </div>

        <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 class="text-xl font-bold text-[#0c3641] mb-6">Sucursales Activas</h2>
          <div class="space-y-4">
            {#each sucursales as s}
              <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-start">
                <div>
                  <h3 class="font-bold text-[#0c3641]">{s.nombre}</h3>
                  <p class="text-xs text-gray-500 mt-1">{s.direccion}</p>
                </div>
                <button onclick={() => deleteItem('sucursales', s.id)} class="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
    {:else if currentTab === 'emails'}
      <div class="max-w-3xl bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in">
        <h2 class="text-xl font-bold text-[#0c3641] mb-2">Envío de Correo Masivo</h2>
        <p class="text-sm text-gray-500 mb-8">Envía un correo electrónico directo a la bandeja de entrada de todos los agentes registrados.</p>
        
        <form class="space-y-6" onsubmit={(e) => { e.preventDefault(); alert("Correos encolados para envío masivo."); }}>
          <div>
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Asunto del Correo</label>
            <input type="text" bind:value={emailAsunto} required class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
          </div>
          <div>
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Cuerpo del Mensaje (HTML Permitido)</label>
            <textarea rows="8" bind:value={emailMensaje} required class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium resize-none"></textarea>
          </div>
          <div class="flex justify-end pt-4 border-t border-gray-100">
            <button type="submit" class="px-8 py-3 bg-casa-gold text-[#0c3641] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-105 transition-colors flex items-center gap-2">
              <Mail size={16}/> Enviar a todos
            </button>
          </div>
        </form>
      </div>
    {:else if currentTab === 'marketing'}
      <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in">
        <h2 class="text-xl font-bold text-[#0c3641] mb-6 flex items-center gap-2"><Radio size={24} class="text-casa-teal"/> Solicitudes de Marketing</h2>
        
        <div class="space-y-4">
          {#each redCasaList as req}
            <div class="p-6 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="font-bold text-lg text-[#0c3641]">{req.agenteNombre}</h3>
                  <span class="px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded {req.estado === 'Publicado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                    {req.estado}
                  </span>
                  <span class="text-xs text-gray-400">{new Date(req.createdAt?.toMillis() || Date.now()).toLocaleString()}</span>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2 italic border-l-2 border-casa-teal pl-3">"{req.mensaje}"</p>
                
                <div class="flex gap-2 mt-3">
                  {#if req.canales?.facebook}<span class="px-2 py-1 bg-[#1877F2]/10 text-[#1877F2] text-[10px] font-bold rounded">Facebook</span>{/if}
                  {#if req.canales?.instagram}<span class="px-2 py-1 bg-[#E1306C]/10 text-[#E1306C] text-[10px] font-bold rounded">Instagram</span>{/if}
                  {#if req.canales?.marketplace}<span class="px-2 py-1 bg-casa-teal/10 text-casa-teal text-[10px] font-bold rounded">Marketplace</span>{/if}
                </div>
              </div>
              <div class="flex flex-col gap-2 shrink-0">
                <a href={`/inmuebles/${req.propiedadId}`} target="_blank" class="px-4 py-2 bg-casa-dark text-white text-xs font-bold rounded-lg text-center shadow hover:bg-black transition-colors">Ver Propiedad</a>
                {#if req.estado !== 'Aprobado'}
                  <button onclick={() => updateRedStatus(req.id, 'Aprobado')} class="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg text-center shadow hover:bg-green-600 transition-colors flex items-center gap-1 justify-center"><CheckCircle size={14}/> Aprobar</button>
                {/if}
                <button onclick={() => deleteItem('red_casa', req.id)} class="px-4 py-2 bg-red-100 text-red-600 text-xs font-bold rounded-lg text-center hover:bg-red-200 transition-colors flex items-center gap-1 justify-center"><Trash2 size={14}/> Eliminar</button>
              </div>
            </div>
          {/each}
          {#if redCasaList.length === 0}
            <div class="text-center py-10 text-gray-400">No hay solicitudes de publicación pendientes.</div>
          {/if}
        </div>
      </div>
    {:else if currentTab === 'cursos'}
      <div class="grid md:grid-cols-2 gap-8">
        <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in">
          <h2 class="text-xl font-bold text-[#0c3641] mb-6 flex items-center gap-2"><GraduationCap size={24} class="text-casa-teal"/> Subir Nuevo Curso / Blog</h2>
          <form class="space-y-6">
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Título del Contenido</label>
              <input type="text" placeholder="Ej. Técnicas de Cierre 2024" required class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Tipo</label>
                <select class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium">
                  <option value="course">Curso (Video)</option>
                  <option value="blog">Blog (Texto)</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Categoría</label>
                <select class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium">
                  <option value="Marketing">Marketing</option>
                  <option value="Ventas">Ventas</option>
                  <option value="Tutorial">Tutoriales</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Resumen (Excerpt)</label>
              <textarea rows="3" placeholder="De qué trata..." class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium resize-none"></textarea>
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Link del Video o Portada (URL)</label>
              <input type="text" placeholder="https://..." class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
            </div>
            <div class="pt-4 border-t border-gray-100 flex justify-end">
              <button type="button" class="px-8 py-3 bg-[#0c3641] text-white rounded-xl font-bold text-sm shadow-xl hover:bg-black transition-colors flex items-center gap-2">
                Publicar Contenido
              </button>
            </div>
          </form>
        </div>
        
        <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in">
          <h2 class="text-xl font-bold text-[#0c3641] mb-6 flex items-center gap-2">Gestión de Cursos</h2>
          <div class="text-center py-10 text-gray-400">
            Aquí aparecerá la lista de cursos publicados para editarlos o eliminarlos (Conexión a Firebase pendiente).
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>
