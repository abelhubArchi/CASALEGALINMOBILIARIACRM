<script>
  let { onNavigate } = $props();
  import { page } from '$app/state';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { authState, logout } from '#lib/authStore.svelte.js';
  import logoCasaLegal from '#lib/assets/logoCasaLegal.jpg';
  
  import { 
    LayoutDashboard, 
    Home, 
    Building2, 
    Users, 
    Briefcase, 
    Star, 
    Rocket,
    Globe, 
    MapIcon, 
    Megaphone, 
    Wrench, 
    GripVertical,
    Map as MapView,
    Shield,
    Store,
    Radio,
    Trophy,
    GraduationCap
  } from 'lucide-svelte';

  const flipDurationMs = 200;

  const allMenu = [
    { id: '1', name: 'Casa de Mando', path: '/', icon: LayoutDashboard },
    { id: '2', name: 'Inventario Casa', path: '/inventario', icon: Home },
    { id: '3', name: 'Requerimientos', path: '/requerimientos', icon: MapView },
    { id: '4', name: 'Clientes (CRM)', path: '/clientes', icon: Users },
    { id: '5', name: 'Mi Equipo', path: '/equipo', icon: Shield },
    { id: '12', name: 'Casa Legal Score', path: '/score', icon: Trophy },
    { id: '13', name: 'Cursos Casa Legal', path: '/cursos', icon: GraduationCap },
    { id: '6', name: 'Casa de Talento', path: '/talento', icon: Star },
    { id: '7', name: 'Mis Casas', path: '/mis-casas', icon: Rocket },
    { id: '8', name: 'Red Casa Legal', path: '/red-casa', icon: Radio },
    { id: '9', name: 'Sucursales', path: '/sucursales', icon: Store },
    { id: '10', name: 'Comunicados', path: '/comunicados', icon: Megaphone },
    { id: '11', name: 'Control Casa Legal', path: '/admin-control', icon: Wrench, reqSuperAdmin: true }
  ];

  let menu = $state([]);

  $effect(() => {
    if (authState.profile && authState.user && menu.length === 0) {
      const isAdmin = authState.profile?.rol?.toLowerCase().includes('admin');
      const email = authState.user?.email || '';
      const isSuperAdmin = email === 'bolevel12@gmail.com' || email.endsWith('@casalegaladmin.com');
      
      let baseMenu = allMenu.filter(m => {
        if (m.reqSuperAdmin && !isSuperAdmin) return false;
        if (m.reqAdmin && !isAdmin && !isSuperAdmin) return false;
        return true;
      });

      // Restore order from localStorage
      const savedOrder = localStorage.getItem(`menuOrder_${email}`);
      if (savedOrder) {
        try {
          const ids = JSON.parse(savedOrder);
          const ordered = [];
          for (const id of ids) {
            const found = baseMenu.find(m => m.id === id);
            if (found) ordered.push(found);
          }
          // Add any new ones not in the saved order
          for (const m of baseMenu) {
            if (!ordered.find(o => o.id === m.id)) ordered.push(m);
          }
          menu = ordered;
        } catch(e) {
          menu = baseMenu;
        }
      } else {
        menu = baseMenu;
      }
    }
  });

  let editMode = $state(false);

  function handleDndConsider(e) {
    menu = e.detail.items;
  }
  
  function handleDndFinalize(e) {
    menu = e.detail.items;
    if (authState.user?.email) {
      localStorage.setItem(`menuOrder_${authState.user.email}`, JSON.stringify(menu.map(m => m.id)));
    }
  }
</script>

<aside class="w-72 bg-casa-teal h-full flex flex-col text-white shadow-2xl relative z-10 font-sans">
  <!-- Logo Area -->
  <div class="h-32 flex flex-col items-center justify-center border-b-[2px] border-casa-gold/30 px-6 bg-black/20">
    <img src={logoCasaLegal} alt="Casa Legal Logo" class="w-16 h-16 object-cover rounded-full shadow-2xl border-[2px] border-casa-gold/80 mb-2" />
  </div>
  
  <div class="px-6 py-3 flex justify-between items-center bg-black/5 border-b border-white/5">
    <span class="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Módulos</span>
    <button onclick={() => editMode = !editMode} class="text-[10px] text-casa-gold hover:text-white uppercase tracking-[0.1em] transition-colors font-medium border border-casa-gold/30 px-2 py-1 rounded">
      {editMode ? 'Guardar Orden' : 'Editar Orden'}
    </button>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 overflow-y-auto py-2 custom-scrollbar">
    <ul 
      class="space-y-1 outline-none min-h-[500px]"
      use:dndzone={{items: menu, flipDurationMs, dragDisabled: !editMode, dropTargetStyle: {}}}
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
    >
      {#each menu as item (item.id)}
        <li animate:flip={{duration: flipDurationMs}}>
          <a 
            href={item.path}
            onclick={() => onNavigate && onNavigate()}
            class="flex items-center px-6 py-3 transition-all duration-300 border-l-[3px] group relative
            {page.url.pathname === item.path 
              ? 'bg-casa-dark/30 border-casa-gold text-casa-gold font-medium shadow-inner' 
              : 'border-transparent hover:bg-casa-dark/20 hover:border-casa-gold/30 text-gray-300'}"
          >
            {#if editMode}
              <div class="mr-3 cursor-grab text-gray-500 hover:text-white transition-colors">
                <GripVertical size={16} />
              </div>
            {/if}
            
            <div class="text-current opacity-70 group-hover:opacity-100 transition-opacity mr-4">
              <svelte:component this={item.icon} size={18} strokeWidth={1.5} />
            </div>
            <span class="text-[11px] uppercase tracking-[0.15em] font-medium">{item.name}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- User Profile snippet -->
  <div class="p-6 border-t border-white/5 bg-casa-dark/40">
    {#if authState.profile}
      <div class="flex flex-col gap-2">
        <a href="/perfil" class="flex items-center gap-4 group hover:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer">
          {#if authState.profile.documentos?.foto}
            <img src={authState.profile.documentos.foto} alt="Perfil" class="w-10 h-10 rounded-full object-cover shadow-md border-[2px] border-casa-gold group-hover:scale-105 transition-transform" />
          {:else}
            <div class="w-10 h-10 rounded-full bg-casa-gold flex items-center justify-center text-casa-dark font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
              {authState.profile.nombres?.charAt(0) || 'U'}
            </div>
          {/if}
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-bold text-white truncate group-hover:text-casa-gold transition-colors">{authState.profile.nombres}</p>
            {#if authState.profile.equipoNombre}
              <p class="text-[9px] text-casa-gold uppercase tracking-[0.1em] font-bold truncate my-0.5">{authState.profile.equipoNombre}</p>
            {/if}
            <p class="text-[9px] text-gray-400 uppercase tracking-[0.15em]">Editar Perfil</p>
          </div>
        </a>
        <div class="pl-16">
          <button onclick={logout} class="text-[9px] text-red-400 hover:text-red-300 transition-colors uppercase tracking-[0.1em] font-bold">Cerrar Sesión</button>
        </div>
      </div>
    {:else}
      <div class="animate-pulse flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-white/10"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-white/10 rounded w-3/4"></div>
          <div class="h-2 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    {/if}
  </div>
</aside>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.2); 
    border-radius: 10px;
  }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.5); 
  }
</style>
