<script>
  import { onMount } from 'svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { goto } from '$app/navigation';
  import AdminTalento from '#lib/components/AdminTalento.svelte';
  import { ArrowLeft, UserPlus } from 'lucide-svelte';

  let isSuperAdmin = $derived(
    authState.user?.email === 'bolevel12@gmail.com' || 
    authState.user?.email?.endsWith('@casalegaladmin.com')
  );

  onMount(() => {
    // Si no es super admin y la carga de auth ya terminó, redirigir.
    if (!authState.loading && !isSuperAdmin) {
      goto('/talento');
    }
  });

  // Watch en caso de que auth cambie después de montar
  $effect(() => {
    if (!authState.loading && !isSuperAdmin) {
      goto('/talento');
    }
  });
</script>

<div class="p-8 md:p-12 font-sans h-full bg-casa-light flex flex-col overflow-y-auto">
  <div class="max-w-4xl mx-auto w-full">
    <button onclick={() => goto('/talento')} class="flex items-center gap-2 text-gray-500 hover:text-casa-teal font-bold text-sm uppercase tracking-widest mb-6 transition-colors">
      <ArrowLeft size={16}/> Volver al Directorio
    </button>
    
    <div class="flex items-center gap-4 mb-8">
      <div class="p-4 bg-casa-teal text-white rounded-2xl shadow-sm">
        <UserPlus size={32} />
      </div>
      <div>
        <h1 class="text-3xl font-extrabold text-[#0c3641]">Nuevo Asesor de Casa Legal</h1>
        <p class="text-gray-500 mt-1">Completa el formulario de afiliación oficial.</p>
      </div>
    </div>

    {#if isSuperAdmin}
      <AdminTalento />
    {/if}
  </div>
</div>
