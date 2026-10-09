<script>
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { db } from '#lib/firebase';
  import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
  import { MessageCircle, Link as LinkIcon, Building } from 'lucide-svelte';

  let agent = $state(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const uid = page.params.uid;
      const docRef = doc(db, 'marketing_agentes', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        agent = snap.data();
        // Registrar Vista (Impacto de Marketing)
        try {
          await updateDoc(docRef, { vistas: increment(1) });
        } catch (e) { console.error("Error updating view count:", e); }
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  });

  const getWhatsappLink = (phone) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const trackLead = async () => {
    try {
      const uid = page.params.uid;
      await updateDoc(doc(db, 'marketing_agentes', uid), { leads: increment(1) });
    } catch (e) {
      console.error("Error tracking lead:", e);
    }
  };
</script>

<svelte:head>
  <title>{agent?.agenteNombre ? agent.agenteNombre + ' | Casa Legal' : 'Agente Inmobiliario'}</title>
</svelte:head>

<div class="min-h-screen relative overflow-hidden font-sans flex flex-col items-center py-12 px-6">
  <!-- Dynamic Moving Background -->
  <div class="fixed inset-0 z-0 bg-casa-dark overflow-hidden">
    {#if agent?.fondoUrl}
      <img src={agent.fondoUrl} alt="Fondo" class="absolute inset-0 w-full h-full object-cover opacity-30 animate-pulse-slow scale-110" style="animation-duration: 20s;" />
      <div class="absolute inset-0 bg-gradient-to-b from-casa-dark/80 via-casa-dark/90 to-casa-dark"></div>
    {:else}
      <!-- Abstract shapes if no background -->
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-casa-teal rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-casa-gold rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-4000"></div>
    {/if}
  </div>

  {#if loading}
    <div class="relative z-10 flex flex-col items-center justify-center h-64 text-white">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-casa-gold mb-4"></div>
      <p class="font-bold tracking-widest text-xs uppercase">Cargando Tarjeta Digital...</p>
    </div>
  {:else if agent}
    <div class="relative z-10 w-full max-w-md flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <!-- Profile Header -->
      <div class="relative mb-6 group">
        <div class="absolute -inset-1 bg-gradient-to-r from-casa-gold to-casa-teal rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        {#if agent.agenteFoto}
          <img src={agent.agenteFoto} alt={agent.agenteNombre} class="relative w-32 h-32 rounded-full object-cover border-4 border-casa-dark shadow-2xl" />
        {:else}
          <div class="relative w-32 h-32 rounded-full border-4 border-casa-dark shadow-2xl bg-casa-teal flex items-center justify-center text-5xl font-bold text-white">
            {agent.agenteNombre?.charAt(0) || 'A'}
          </div>
        {/if}
      </div>

      <h1 class="text-3xl font-extrabold text-white text-center mb-1 drop-shadow-md">{agent.agenteNombre}</h1>
      <p class="text-casa-gold text-sm font-black uppercase tracking-[0.2em] mb-8 text-center drop-shadow flex items-center gap-2 justify-center">
        <Building size={14}/> Casa Legal Agente
      </p>

      <!-- Links Container -->
      <div class="w-full space-y-4">
        {#if agent.whatsapp}
          <a onclick={trackLead} href={getWhatsappLink(agent.whatsapp)} target="_blank" rel="noreferrer" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group">
            <div class="w-12 h-12 bg-[#25D366] rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
              <MessageCircle size={24} class="text-white" />
            </div>
            <div class="flex-1">
              <h2 class="font-bold text-lg leading-tight">WhatsApp Directo</h2>
              <p class="text-xs text-white/70">Asesoría inmobiliaria inmediata</p>
            </div>
          </a>
        {/if}

        {#if agent.instagram}
          <a onclick={trackLead} href={agent.instagram} target="_blank" rel="noreferrer" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group">
            <div class="w-12 h-12 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            <div class="flex-1">
              <h2 class="font-bold text-lg leading-tight">Sígueme en Instagram</h2>
              <p class="text-xs text-white/70">Propiedades exclusivas</p>
            </div>
          </a>
        {/if}

        {#if agent.facebook}
          <a onclick={trackLead} href={agent.facebook} target="_blank" rel="noreferrer" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group">
            <div class="w-12 h-12 bg-[#1877F2] rounded-xl flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </div>
            <div class="flex-1">
              <h2 class="font-bold text-lg leading-tight">Mi Facebook</h2>
              <p class="text-xs text-white/70">Novedades y noticias</p>
            </div>
          </a>
        {/if}

        {#if agent.tiktok}
          <a onclick={trackLead} href={agent.tiktok} target="_blank" rel="noreferrer" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white p-4 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group">
            <div class="w-12 h-12 bg-black border border-white/30 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <LinkIcon size={24} class="text-white" /> <!-- Lucide no tiene icono oficial de TikTok sin packs extra, usamos Link -->
            </div>
            <div class="flex-1">
              <h2 class="font-bold text-lg leading-tight">TikTok Inmobiliario</h2>
              <p class="text-xs text-white/70">Tours y tips de bienes raíces</p>
            </div>
          </a>
        {/if}
      </div>

      <!-- Footer Branding -->
      <div class="mt-12 text-center">
        <p class="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2">Powered by</p>
        <p class="text-sm font-black text-white/60 tracking-widest uppercase">Casa Legal Inmobiliaria</p>
      </div>

    </div>
  {:else}
    <div class="relative z-10 text-center text-white mt-20">
      <h1 class="text-2xl font-bold mb-2">Agente no encontrado</h1>
      <p class="text-gray-400">La tarjeta digital no ha sido configurada o no existe.</p>
    </div>
  {/if}
</div>

<style>
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  .animate-pulse-slow {
    animation: pulse 20s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(1.1); }
    50% { opacity: 0.15; transform: scale(1.2); }
  }
</style>
