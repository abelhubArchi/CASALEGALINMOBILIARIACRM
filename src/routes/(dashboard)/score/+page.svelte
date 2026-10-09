<script>
  import { Trophy, Star, TrendingUp, Award, Zap, Crown, Target, Activity, Eye, MousePointerClick } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { onMount } from 'svelte';
  import { db } from '#lib/firebase';
  import { doc, getDoc } from 'firebase/firestore';

  // Niveles (Tiers)
  const tiers = [
    { name: 'Asesor Junior', minVentas: 0, color: 'bg-gray-400', icon: Star },
    { name: 'Casa Legal Pro', minVentas: 5, color: 'bg-casa-teal', icon: Zap },
    { name: 'Casa Legal Elite', minVentas: 15, color: 'bg-casa-gold', icon: Trophy },
    { name: 'Socio Master', minVentas: 30, color: 'bg-purple-500', icon: Crown }
  ];

  let currentVentas = $state(12); // Simulado
  
  // Determinar nivel actual
  let currentTierIndex = $derived(tiers.findLastIndex(t => currentVentas >= t.minVentas));
  let currentTier = $derived(tiers[currentTierIndex] || tiers[0]);
  
  let nextTier = $derived(currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null);
  let progressToNext = $derived(nextTier ? ((currentVentas - currentTier.minVentas) / (nextTier.minVentas - currentTier.minVentas)) * 100 : 100);

  // Simulación de Ranking de Agentes en la Franquicia
  const ranking = [
    { nombre: 'Ana Morales', equipo: 'Luxury Real Estate', ventas: 28, nivel: 'Casa Legal Elite' },
    { nombre: 'Roberto Siles', equipo: 'Equipo Dinamita', ventas: 22, nivel: 'Casa Legal Elite' },
    { nombre: authState.profile?.nombres || 'Tú', equipo: authState.profile?.equipoNombre || 'Sin Equipo', ventas: currentVentas, nivel: 'Casa Legal Pro', isMe: true },
    { nombre: 'Carlos Ruiz', equipo: 'Red Central', ventas: 8, nivel: 'Casa Legal Pro' },
    { nombre: 'Maria Fernandez', equipo: 'Sin Equipo', ventas: 2, nivel: 'Asesor Junior' }
  ];

  let vistasTotales = $state(0);
  let leadsTotales = $state(0);

  onMount(async () => {
    if (authState.user?.uid) {
      try {
        const docMkt = await getDoc(doc(db, 'marketing_agentes', authState.user.uid));
        if (docMkt.exists()) {
          vistasTotales = docMkt.data().vistas || 0;
          leadsTotales = docMkt.data().leads || 0;
        }
      } catch(e) {
        console.error(e);
      }
    }
  });

</script>

<div class="p-4 md:p-8 font-sans h-full bg-[#f4f7f6] flex flex-col overflow-y-auto animate-in fade-in duration-500">
  
  <header class="mb-8 max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between md:items-end gap-6">
    <div class="flex items-center gap-4">
      <div class="p-4 bg-casa-gold/20 text-casa-gold rounded-2xl shadow-lg border border-casa-gold/30">
        <Trophy size={36} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-[#0c3641] tracking-tight">Casa Legal Score</h1>
        <p class="text-gray-500 text-sm md:text-base mt-1">Programa de Lealtad y Rendimiento. Escala de nivel y obtén mayores beneficios.</p>
      </div>
    </div>
  </header>

  <div class="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
    
    <!-- Mi Estado (Col 1 y 2) -->
    <div class="lg:col-span-2 space-y-6">
      
      <!-- Current Tier Card -->
      <div class="bg-gradient-to-br from-[#0c3641] to-[#124d5d] rounded-[2rem] p-8 shadow-xl relative overflow-hidden text-white">
        <div class="absolute -right-10 -top-10 opacity-10">
          <svelte:component this={currentTier.icon} size={200}/>
        </div>
        
        <div class="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div class="w-32 h-32 rounded-full bg-white/10 border-4 border-casa-gold flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <svelte:component this={currentTier.icon} size={48} class="text-casa-gold"/>
          </div>
          <div class="flex-1 text-center md:text-left">
            <p class="text-casa-gold uppercase tracking-widest font-bold text-xs mb-1">Tu Nivel Actual</p>
            <h2 class="text-4xl font-black mb-2">{currentTier.name}</h2>
            <p class="text-gray-300 text-sm">Has logrado <span class="font-bold text-white text-lg">{currentVentas}</span> ventas exitosas. ¡Sigue así!</p>
          </div>
        </div>

        <!-- Progress to Next Tier -->
        {#if nextTier}
          <div class="relative z-10 mt-10 bg-black/20 p-6 rounded-2xl border border-white/10">
            <div class="flex justify-between items-end mb-2">
              <div>
                <p class="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Próximo Nivel</p>
                <p class="font-bold text-lg text-white flex items-center gap-2">
                  <svelte:component this={nextTier.icon} size={16} class="text-casa-gold"/> {nextTier.name}
                </p>
              </div>
              <div class="text-right">
                <p class="text-[10px] uppercase text-gray-400 tracking-widest font-bold">Faltan</p>
                <p class="font-black text-xl text-casa-gold">{nextTier.minVentas - currentVentas} <span class="text-xs font-normal">ventas</span></p>
              </div>
            </div>
            
            <div class="h-3 w-full bg-black/40 rounded-full overflow-hidden mt-2">
              <div class="h-full bg-gradient-to-r from-casa-teal to-casa-gold transition-all duration-1000 ease-out" style="width: {progressToNext}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-gray-400 mt-2 font-bold">
              <span>{currentTier.minVentas}</span>
              <span>{nextTier.minVentas} Meta</span>
            </div>
          </div>
        {:else}
          <div class="relative z-10 mt-10 bg-casa-gold/20 p-6 rounded-2xl border border-casa-gold text-center">
            <p class="font-bold text-casa-gold uppercase tracking-widest">¡Has alcanzado el rango máximo en la franquicia!</p>
          </div>
        {/if}
      </div>

      <!-- Niveles Descripción -->
      <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 class="font-bold text-[#0c3641] text-lg mb-6 flex items-center gap-2"><Target size={20}/> Beneficios por Nivel</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each tiers as tier, i}
            <div class="p-4 rounded-xl border-2 transition-all {i === currentTierIndex ? 'border-casa-gold bg-casa-gold/5 shadow-md' : 'border-gray-100 bg-gray-50 opacity-70'}">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${tier.color}`}>
                    <svelte:component this={tier.icon} size={14}/>
                  </div>
                  <h4 class="font-bold text-[#0c3641]">{tier.name}</h4>
                </div>
                <span class="text-xs font-bold text-gray-400">{tier.minVentas}+ Ventas</span>
              </div>
              <ul class="text-[10px] text-gray-500 space-y-1 list-disc pl-4 mt-3">
                <li>Comisión base del {(i+1)*10 + 40}%</li>
                {#if i > 0}<li>Acceso a leads calificados del CRM</li>{/if}
                {#if i > 1}<li>Publicidad premium pagada por Casa Legal</li>{/if}
                {#if i > 2}<li>Porcentaje sobre ventas del equipo</li>{/if}
              </ul>
            </div>
          {/each}
        </div>
      </div>

    </div>

    <!-- Leaderboard (Col 3) -->
    <div class="space-y-6">
      
      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full">
        <h3 class="font-bold text-[#0c3641] text-lg mb-6 flex items-center gap-2"><Activity size={20}/> Leaderboard (Top 5)</h3>
        
        <div class="flex-1 space-y-4">
          {#each ranking as agent, i}
            <div class="flex items-center gap-4 p-3 rounded-xl transition-all {agent.isMe ? 'bg-[#0c3641] text-white shadow-lg scale-105 origin-left' : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'}">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 {i === 0 ? 'bg-casa-gold text-[#0c3641]' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-[#cd7f32] text-white' : 'bg-gray-100 text-gray-400'}">
                {i + 1}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate {agent.isMe ? 'text-white' : 'text-[#0c3641]'}">
                  {agent.nombre} {agent.isMe ? '(Tú)' : ''}
                </p>
                <p class="text-[10px] uppercase tracking-widest truncate {agent.isMe ? 'text-casa-gold' : 'text-casa-teal'}">
                  {agent.equipo}
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-black text-lg {agent.isMe ? 'text-white' : 'text-[#0c3641]'}">{agent.ventas}</p>
                <p class="text-[9px] uppercase font-bold text-gray-400">Ventas</p>
              </div>
            </div>
          {/each}
        </div>

        <button class="w-full mt-6 py-3 border-2 border-casa-teal text-casa-teal font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-casa-teal hover:text-white transition-colors">
          Ver Ranking Completo
        </button>
      </div>

      <!-- Impacto de Marketing Card -->
      <div class="bg-gradient-to-br from-blue-900 to-[#0c3641] p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 opacity-10"><Eye size={100} /></div>
        <h3 class="font-bold text-casa-gold text-lg mb-6 flex items-center gap-2 relative z-10"><TrendingUp size={20}/> Impacto de Marketing</h3>
        
        <div class="space-y-4 relative z-10">
          <div class="bg-white/10 p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300"><Eye size={18}/></div>
              <div>
                <p class="text-[10px] uppercase font-bold text-gray-300 tracking-widest">Vistas Totales</p>
                <p class="font-black text-xl text-white">{vistasTotales}</p>
              </div>
            </div>
            <div class="text-xs text-green-400 font-bold">+12%</div>
          </div>
          
          <div class="bg-white/10 p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-300"><MousePointerClick size={18}/></div>
              <div>
                <p class="text-[10px] uppercase font-bold text-gray-300 tracking-widest">Leads (Clics)</p>
                <p class="font-black text-xl text-white">{leadsTotales}</p>
              </div>
            </div>
            <div class="text-xs text-green-400 font-bold">+5%</div>
          </div>
        </div>
      </div>

    </div>

  </div>
</div>
