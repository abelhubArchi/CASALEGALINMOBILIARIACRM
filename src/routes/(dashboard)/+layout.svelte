<script>
  import Sidebar from '#lib/components/layout/Sidebar.svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Menu, X } from 'lucide-svelte';
  
  let { children } = $props();
  let sidebarOpen = $state(false);

  // Watch for auth state changes to protect the routes
  $effect(() => {
    if (!authState.loading && !authState.user) {
      goto('/login');
    }
  });

  const toggleSidebar = () => {
    sidebarOpen = !sidebarOpen;
  };
</script>

{#if authState.loading}
  <div class="flex items-center justify-center h-screen bg-casa-light">
    <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-casa-teal"></div>
  </div>
{:else if authState.user}
  <div class="flex h-screen bg-casa-light overflow-hidden animate-in fade-in duration-500 relative">
    
    <!-- Mobile Header -->
    <div class="lg:hidden absolute top-0 left-0 w-full h-16 bg-[#0c3641] text-white flex items-center justify-between px-4 z-40 shadow-md">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-casa-gold/20 flex items-center justify-center border border-casa-gold text-casa-gold font-bold">C</div>
        <span class="font-bold text-sm tracking-widest uppercase">Casa Legal</span>
      </div>
      <button onclick={toggleSidebar} class="p-2 hover:bg-white/10 rounded-lg transition-colors">
        {#if sidebarOpen}
          <X size={24}/>
        {:else}
          <Menu size={24}/>
        {/if}
      </button>
    </div>

    <!-- Backdrop for Mobile Sidebar -->
    {#if sidebarOpen}
      <div 
        class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" 
        onclick={() => sidebarOpen = false}
        onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
        role="button"
        tabindex="0"
      ></div>
    {/if}

    <!-- Sidebar Wrapper -->
    <div class="fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-full">
      <Sidebar onNavigate={() => sidebarOpen = false} />
    </div>

    <!-- Main Content Area -->
    <main class="flex-1 h-full overflow-y-auto w-full pt-16 lg:pt-0">
      {@render children()}
    </main>
  </div>
{/if}
