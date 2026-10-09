<script>
  import { onMount } from 'svelte';
  import { 
    Building2, Rocket, Share2, DollarSign, ArrowRight, 
    ExternalLink, Copy, Check, Users, Shield, Map as MapIcon, 
    TrendingUp, Calendar, Clock, Star, Megaphone
  } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { db } from '#lib/firebase';
  import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';

  let misInmueblesCount = $state(0);
  let exchangeRate = $state('6.96');
  let isLoadingRate = $state(true);
  let publicLink = $derived(authState.user ? `${window.location.origin}/agente/${authState.user.uid}` : '');
  let linkCopied = $state(false);
  let vistasReales = $state(0);
  let leadsReales = $state(0);

  let recientes = $state([]);
  let dashboardComunicados = $state([]);
  let leads = $state([
    { nombre: 'Carlos Mendoza', intencion: 'Comprar Casa Zona Sur', fecha: 'Hoy, 10:30 AM', status: 'Nuevo' },
    { nombre: 'Ana Fernandez', intencion: 'Alquiler Depto Centro', fecha: 'Ayer', status: 'Contactado' },
    { nombre: 'Roberto Siles', intencion: 'Vender Terreno Urubó', fecha: 'Hace 2 días', status: 'Negociando' }
  ]);

  onMount(async () => {
    if (authState.user) {
      try {
        const q = query(collection(db, 'inmuebles'), where('agenteId', '==', authState.user.uid));
        const snap = await getDocs(q);
        misInmueblesCount = snap.size;
        
        // Simular obtención de últimos inmuebles
        recientes = snap.docs.slice(0, 3).map(d => ({ id: d.id, ...d.data() }));
        if (recientes.length === 0) {
          recientes = [
            { id: '1', tituloPropiedad: 'Hermosa Casa Minimalista', precioLista: '120000', zona: 'Zona Sur', tipoOperacion: 'Venta' },
            { id: '2', tituloPropiedad: 'Departamento de Lujo', precioLista: '85000', zona: 'Equipetrol', tipoOperacion: 'Venta' }
          ];
        }

        // Obtener comunicados urgentes
        const comQ = query(collection(db, 'comunicados'), limit(3));
        const comSnap = await getDocs(comQ);
        dashboardComunicados = comSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

        // Obtener estadísticas reales de marketing
        const docMkt = await getDoc(doc(db, 'marketing_agentes', authState.user.uid));
        if (docMkt.exists()) {
          vistasReales = docMkt.data().vistas || 0;
          leadsReales = docMkt.data().leads || 0;
        }
      } catch(e) {
        console.error(e);
      }
    }
    
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates && data.rates.BOB) {
        exchangeRate = data.rates.BOB.toFixed(2);
      }
    } catch (e) {
      exchangeRate = '6.96';
    } finally {
      isLoadingRate = false;
    }
  });

  const copyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(publicLink);
    } else {
      let ta = document.createElement("textarea"); ta.value = publicLink;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    linkCopied = true; setTimeout(() => linkCopied = false, 2000);
  };
</script>

<div class="p-6 md:p-10 font-sans h-full bg-[#f4f7f6] overflow-y-auto animate-in fade-in duration-500">
  
  <!-- Header -->
  <header class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl md:text-4xl font-extrabold text-[#0c3641] tracking-tight">Casa de Mando</h1>
      <p class="text-gray-500 mt-2 text-base">Hola <span class="font-bold text-casa-teal">{authState.profile?.nombres || 'Agente'}</span>, aquí tienes el pulso de tu negocio.</p>
    </div>
    <div class="flex gap-3">
      <a href="/inmuebles/nuevo" class="px-5 py-2.5 bg-casa-teal text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#0c3641] transition-all flex items-center gap-2">
        + Nueva Captación
      </a>
    </div>
  </header>

  <!-- Kpis Top -->
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
    
    <!-- Widget Tipo de Cambio -->
    <div class="bg-gradient-to-br from-[#0c3641] to-[#08222a] text-white p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div class="absolute top-0 right-0 w-32 h-32 bg-casa-gold/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
      <div class="flex justify-between items-start relative z-10">
        <h3 class="text-casa-gold font-bold uppercase tracking-widest text-[10px]">Dólar Oficial en Bolivia</h3>
        <div class="p-2 bg-white/10 rounded-lg"><DollarSign size={16} class="text-casa-gold"/></div>
      </div>
      <div class="mt-6 relative z-10">
        {#if isLoadingRate}
          <div class="animate-pulse h-10 w-24 bg-white/20 rounded"></div>
        {:else}
          <p class="text-5xl font-black">{exchangeRate} <span class="text-lg text-gray-300 font-medium tracking-widest">Bs</span></p>
        {/if}
        <p class="text-xs text-gray-400 mt-2 flex items-center gap-1"><TrendingUp size={12}/> Actualizado en tiempo real</p>
      </div>
    </div>

    <!-- Stats Mis Inmuebles -->
    <div class="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-all">
      <div class="flex justify-between items-start">
        <h3 class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Mis Inmuebles (Activos)</h3>
        <div class="p-2 bg-casa-teal/10 rounded-lg"><Rocket size={16} class="text-casa-teal"/></div>
      </div>
      <div class="mt-6">
        <p class="text-5xl font-black text-[#0c3641]">{misInmueblesCount}</p>
        <p class="text-xs text-green-600 mt-2 font-bold flex items-center gap-1">Propiedades listas para vender</p>
      </div>
    </div>

    <!-- Stats Vistas/Leads -->
    <div class="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-all">
      <div class="flex justify-between items-start">
        <h3 class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Impacto de Marketing</h3>
        <div class="p-2 bg-casa-gold/20 rounded-lg"><Users size={16} class="text-casa-gold"/></div>
      </div>
      <div class="mt-6 flex items-end justify-between">
        <div>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Vistas</p>
          <p class="text-4xl font-black text-casa-teal">{vistasReales}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Leads</p>
          <p class="text-4xl font-black text-[#0c3641]">{leadsReales}</p>
        </div>
      </div>
    </div>

    <!-- Mi Marketing / Link -->
    <div class="bg-white p-6 rounded-[1.5rem] shadow-sm border border-casa-gold/30 flex flex-col justify-between overflow-hidden relative">
      <div class="absolute -right-4 -bottom-4 opacity-5"><Share2 size={100} /></div>
      <div class="flex justify-between items-start relative z-10">
        <h3 class="text-casa-gold font-bold uppercase tracking-widest text-[10px]">Mi Landing Page</h3>
        <div class="p-2 bg-gray-50 rounded-lg"><Share2 size={16} class="text-casa-teal"/></div>
      </div>
      <div class="mt-4 relative z-10 flex-1 flex flex-col justify-end">
        <div class="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <input type="text" readonly value={publicLink} class="bg-transparent w-full outline-none text-gray-500 text-[11px] px-2 truncate font-medium" />
          <button onclick={copyLink} class="p-2 bg-casa-dark text-white rounded-lg hover:bg-black transition-colors" title="Copiar Link">
            {#if linkCopied}<Check size={14}/>{:else}<Copy size={14}/>{/if}
          </button>
        </div>
        <p class="text-[10px] text-gray-400 mt-2 text-center">Comparte este link en tus redes sociales.</p>
      </div>
    </div>
  </div>

  <!-- Main Modules Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    
    <!-- Left Column (Wider) -->
    <div class="lg:col-span-2 space-y-6">
      
      <!-- Quick Access Banners -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/requerimientos" class="bg-casa-dark text-white p-6 rounded-2xl shadow-lg flex justify-between items-center group hover:bg-black transition-all">
          <div>
            <h3 class="font-bold text-lg mb-1 flex items-center gap-2"><MapIcon size={18} class="text-casa-gold"/> Mapa de Requerimientos</h3>
            <p class="text-xs text-gray-400">Busca propiedades en el mapa al instante.</p>
          </div>
          <ArrowRight class="text-casa-gold group-hover:translate-x-2 transition-transform" />
        </a>
        <a href="/inventario" class="bg-casa-gold text-[#0c3641] p-6 rounded-2xl shadow-lg flex justify-between items-center group hover:brightness-105 transition-all">
          <div>
            <h3 class="font-bold text-lg mb-1 flex items-center gap-2"><Building2 size={18}/> Inventario General</h3>
            <p class="text-xs text-[#0c3641]/70 font-medium">Explora toda la red de Casa Legal.</p>
          </div>
          <ArrowRight class="group-hover:translate-x-2 transition-transform" />
        </a>
      </div>

      <!-- Recent Properties Table -->
      <div class="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-bold text-[#0c3641]">Tus Captaciones Recientes</h2>
          <a href="/mis-casas" class="text-xs font-bold text-casa-teal uppercase tracking-wider hover:underline">Ver todas</a>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                <th class="pb-3 font-bold">Propiedad</th>
                <th class="pb-3 font-bold">Operación</th>
                <th class="pb-3 font-bold">Precio</th>
              </tr>
            </thead>
            <tbody>
              {#each recientes as p}
                <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td class="py-3 pr-4">
                    <p class="font-bold text-sm text-[#0c3641]">{p.tituloPropiedad}</p>
                    <p class="text-xs text-gray-500 flex items-center gap-1"><MapIcon size={10}/> {p.zona}</p>
                  </td>
                  <td class="py-3">
                    <span class="px-2 py-1 bg-casa-teal/10 text-casa-teal rounded text-[10px] font-bold uppercase">{p.tipoOperacion}</span>
                  </td>
                  <td class="py-3 font-black text-[#0c3641]">${p.precioLista}</td>
                </tr>
              {/each}
              {#if recientes.length === 0}
                <tr><td colspan="3" class="py-8 text-center text-sm text-gray-400">No hay captaciones recientes.</td></tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>

    <!-- Right Column (Sidebar-like) -->
    <div class="space-y-6">
      
      <!-- Comunicados Urgentes -->
      <div class="bg-gradient-to-br from-[#0c3641] to-casa-teal text-white rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-10"><Megaphone size={80}/></div>
        <h2 class="text-lg font-bold flex items-center gap-2 mb-4 relative z-10"><Megaphone size={18} class="text-casa-gold"/> Avisos Importantes</h2>
        
        <div class="space-y-3 relative z-10">
          {#each dashboardComunicados as c}
            <div class="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider {c.nivel === 'Urgente' ? 'bg-red-500 text-white' : 'bg-casa-gold text-[#0c3641]'}">{c.nivel}</span>
                <span class="text-[10px] text-gray-300">{new Date(c.createdAt?.toMillis() || Date.now()).toLocaleDateString()}</span>
              </div>
              <h4 class="font-bold text-sm text-white">{c.titulo}</h4>
              <p class="text-xs text-gray-200 mt-1 line-clamp-2">{c.mensaje}</p>
            </div>
          {/each}
          {#if dashboardComunicados.length === 0}
            <p class="text-xs text-gray-300 italic">No hay comunicados recientes.</p>
          {/if}
        </div>
      </div>

      
      <!-- Mi Equipo Mini Widget -->
      <div class="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-10"><Shield size={80}/></div>
        <h2 class="text-lg font-bold text-[#0c3641] flex items-center gap-2 mb-2 relative z-10"><Shield size={18} class="text-casa-teal"/> Mi Equipo</h2>
        <p class="text-xs text-gray-500 mb-6 relative z-10">Gestiona tus agentes asociados y comisiones compartidas.</p>
        <a href="/equipo" class="block w-full py-2.5 text-center bg-gray-50 hover:bg-gray-100 text-[#0c3641] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-gray-200">
          Entrar a Mi Equipo
        </a>
      </div>

      <!-- CRM Leads Timeline -->
      <div class="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-bold text-[#0c3641] flex items-center gap-2"><Users size={18} class="text-casa-gold"/> Leads (CRM)</h2>
          <a href="/clientes" class="text-xs font-bold text-casa-teal uppercase tracking-wider hover:underline">Ver CRM</a>
        </div>
        
        <div class="space-y-4">
          {#each leads as lead}
            <div class="flex gap-3">
              <div class="mt-1"><div class="w-2 h-2 rounded-full {lead.status === 'Nuevo' ? 'bg-casa-gold' : 'bg-casa-teal'}"></div></div>
              <div>
                <p class="font-bold text-sm text-[#0c3641]">{lead.nombre}</p>
                <p class="text-xs text-gray-600 mb-1">{lead.intencion}</p>
                <p class="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10}/> {lead.fecha}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>

    </div>
  </div>

</div>
