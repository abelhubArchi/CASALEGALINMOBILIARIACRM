<script>
  import {
    Trophy,
    Star,
    TrendingUp,
    Zap,
    Crown,
    Target,
    Activity,
    Eye,
    MousePointerClick,
    Users,
    Handshake,
    FileCheck,
    CalendarCheck,
    Home,
    Sparkles,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    CheckCircle2,
    Lock,
    Shield,
    Flame,
    RefreshCw,
    Briefcase,
    Plus,
    ExternalLink,
    Megaphone,
    Check,
    AlertCircle
  } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { onMount, onDestroy } from 'svelte';
  import { db } from '#lib/firebase';
  import {
    doc,
    collection,
    onSnapshot,
    updateDoc
  } from 'firebase/firestore';
  import { getDualPrice } from '#lib/currency';

  // 1. Estructura de Niveles Oficiales (Sin descripciones de plantillas o flyers, completamente limpia)
  const tiers = [
    {
      id: 'junior',
      name: 'Asesor Junior',
      rango: '0 - 100 PTS',
      minPts: 0,
      maxPts: 100,
      comision: '50%',
      colorBadge: 'bg-slate-700/80 text-slate-200 border-slate-600',
      colorGlow: 'from-slate-600 to-slate-800',
      icon: Shield
    },
    {
      id: 'pro',
      name: 'Casa Legal Pro',
      rango: '101 - 300 PTS',
      minPts: 101,
      maxPts: 300,
      comision: '60%',
      colorBadge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      colorGlow: 'from-emerald-600 to-teal-800',
      icon: Zap
    },
    {
      id: 'elite',
      name: 'Casa Legal Elite',
      rango: '301 - 600 PTS',
      minPts: 301,
      maxPts: 600,
      comision: '70%',
      colorBadge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      colorGlow: 'from-[#D4AF37] to-amber-700',
      icon: Trophy
    },
    {
      id: 'master',
      name: 'Socio Master',
      rango: '600+ PTS',
      minPts: 601,
      maxPts: 1000,
      comision: '80%',
      colorBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      colorGlow: 'from-purple-600 to-indigo-900',
      icon: Crown
    }
  ];

  // 2. Reglas Oficiales de Puntuación (Ponderación Real)
  const scoreRules = [
    {
      title: 'Captación en Exclusiva',
      pts: '+30 PTS',
      badge: '★ REGLA CLAVE',
      badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-black',
      desc: 'Contrato de exclusividad firmado. Máximo valor para acelerar ventas.',
      icon: Flame,
      color: 'text-amber-400'
    },
    {
      title: 'Venta Propia',
      pts: '+100 PTS',
      badge: 'MÁXIMO IMPACTO',
      badgeClass: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40 font-black',
      desc: 'Inmueble con estado "Vendido" registrado por tu gestión directa.',
      icon: Trophy,
      color: 'text-emerald-400'
    },
    {
      title: 'Venta Compartida',
      pts: '+60 / +50 PTS',
      badge: 'COLABORACIÓN',
      badgeClass: 'bg-blue-400/20 text-blue-300 border-blue-400/40',
      desc: '+60 pts si aportaste la captación; +50 pts si cerraste con el comprador.',
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'Co-brokerage Interno',
      pts: '+20 PTS',
      badge: 'EQUIPO',
      badgeClass: 'bg-teal-400/20 text-teal-300 border-teal-400/40',
      desc: 'Aportas una propiedad que vende otro asesor de Casa Legal.',
      icon: Handshake,
      color: 'text-teal-400'
    },
    {
      title: 'Captación Saneada con Precio Real',
      pts: '+15 PTS',
      badge: 'EXTRA LEGAL',
      badgeClass: 'bg-amber-300/20 text-amber-200 border-amber-300/40',
      desc: 'Documentación al día (folio real, impuestos y planos) a precio de mercado.',
      icon: FileCheck,
      color: 'text-amber-300'
    },
    {
      title: 'Captación Estándar',
      pts: '+10 PTS',
      badge: 'INVENTARIO',
      badgeClass: 'bg-slate-400/20 text-slate-300 border-slate-400/40',
      desc: 'Nueva propiedad activa en inventario con fotos completas.',
      icon: Home,
      color: 'text-slate-300'
    },
    {
      title: 'Agendar y Realizar Visitas / Leads',
      pts: '+5 PTS',
      badge: 'ACTIVIDAD',
      badgeClass: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
      desc: 'Por cada lead/contacto generado o visita presencial registrada.',
      icon: CalendarCheck,
      color: 'text-cyan-400'
    }
  ];

  // Estado del usuario y datos 100% REALES
  let loading = $state(true);
  let isRefreshing = $state(false);
  let showRules = $state(false);

  let currentPoints = $state(0);
  let currentVentas = $state(0);
  let captacionesCount = $state(0);
  let exclusivasCount = $state(0);
  let saneadasCount = $state(0);
  let vistasTotales = $state(0);
  let leadsTotales = $state(0);

  // Leaderboard 100% real cargado de Firestore
  let realLeaderboard = $state([]);
  let myRankPosition = $state(1);

  // Lista de captaciones del usuario logueado con su auditoría de puntos
  let myProperties = $state([]);
  let isUpdatingStatus = $state({});
  let statusSuccessToast = $state(null);

  // Formatear Nombre (Primer Nombre + Primer Apellido)
  const getShortName = (nombres, apellidos, fallbackFull) => {
    if (nombres && apellidos) {
      const pNombre = nombres.trim().split(/\s+/)[0] || '';
      const pApellido = apellidos.trim().split(/\s+/)[0] || '';
      if (pNombre && pApellido) return `${pNombre} ${pApellido}`;
      if (pNombre) return pNombre;
    }
    const full = (fallbackFull || nombres || '').trim();
    if (!full) return 'Asesor';
    const words = full.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return words[0] || 'Asesor';
    if (words.length === 2) return `${words[0]} ${words[1]}`;
    if (words.length === 3) return `${words[0]} ${words[1]}`;
    return `${words[0]} ${words[2]}`;
  };

  const myUserName = $derived(
    getShortName(
      authState.profile?.nombres,
      authState.profile?.apellidos,
      authState.profile?.nombre
    )
  );

  const myTeamName = $derived(
    authState.profile?.equipoNombre || authState.profile?.equipo || 'Casa Legal Central'
  );

  // Nivel Actual y Siguiente Nivel reactivos basados en puntos reales
  let currentTierIndex = $derived.by(() => {
    if (currentPoints <= 100) return 0;
    if (currentPoints <= 300) return 1;
    if (currentPoints <= 600) return 2;
    return 3;
  });

  let currentTier = $derived(tiers[currentTierIndex]);
  let nextTier = $derived(
    currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null
  );

  let pointsToNext = $derived(
    nextTier ? Math.max(0, nextTier.minPts - currentPoints) : 0
  );

  let progressPercentage = $derived.by(() => {
    if (!nextTier) return 100;
    const tierRange = nextTier.minPts - currentTier.minPts;
    const ptsInRange = currentPoints - currentTier.minPts;
    if (tierRange <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((ptsInRange / tierRange) * 100)));
  });

  let conversionRate = $derived(
    vistasTotales > 0 ? ((leadsTotales / vistasTotales) * 100).toFixed(1) : '0.0'
  );

  // Función de cálculo estricto de puntos reales por asesor
  const calculatePointsForUser = (userId, allProperties, mktDocMap) => {
    let pts = 0;
    let captaciones = 0;
    let ventas = 0;
    let exclusivas = 0;
    let saneadas = 0;

    // Propiedades del asesor
    const userProps = allProperties.filter(
      (p) => p.agenteId === userId || p.usuarioId === userId || p.creadorId === userId
    );

    for (const p of userProps) {
      captaciones++;

      // Venta (+100 PTS)
      if (p.estado === 'Vendido' || p.estadoOperacion === 'Vendido') {
        ventas++;
        pts += 100;
      } else {
        // Exclusiva (+30 PTS) vs Estándar (+10 PTS)
        if (p.tipoRepresentacion === 'Exclusiva') {
          exclusivas++;
          pts += 30;
        } else {
          pts += 10;
        }

        // Saneada (+15 PTS)
        if (p.estadoFolio === 'Al día' && p.impuestosAlDia && p.planosAprobados) {
          saneadas++;
          pts += 15;
        }
      }
    }

    // Leads de marketing (+5 PTS cada lead)
    const mkt = mktDocMap[userId];
    const leads = mkt?.leads || 0;
    const vistas = mkt?.vistas || 0;
    pts += leads * 5;

    return {
      pts,
      captaciones,
      ventas,
      exclusivas,
      saneadas,
      leads,
      vistas
    };
  };

  // Cache en memoria para actualización reactiva en tiempo real
  let rawProperties = [];
  let rawMarketing = {};
  let rawUsers = [];

  let unsubInmuebles = null;
  let unsubMarketing = null;
  let unsubUsuarios = null;

  // Recalcular métricas de toda la franquicia
  const recalculateAll = () => {
    const currentUid = authState.user?.uid;

    // 1. Métricas para el usuario logueado
    if (currentUid) {
      const myStats = calculatePointsForUser(currentUid, rawProperties, rawMarketing);
      currentPoints = myStats.pts;
      currentVentas = myStats.ventas;
      captacionesCount = myStats.captaciones;
      exclusivasCount = myStats.exclusivas;
      saneadasCount = myStats.saneadas;
      leadsTotales = myStats.leads;
      vistasTotales = myStats.vistas;

      // 2. Extraer captaciones del usuario con desglose individual
      const userProps = rawProperties.filter(
        (p) => p.agenteId === currentUid || p.usuarioId === currentUid || p.creadorId === currentUid
      );

      myProperties = userProps.map((p) => {
        const isVendido = p.estado === 'Vendido' || p.estadoOperacion === 'Vendido';
        const isExclusiva = p.tipoRepresentacion === 'Exclusiva';
        const isSaneada = p.estadoFolio === 'Al día' && p.impuestosAlDia && p.planosAprobados;
        let puntosInmueble = 0;
        if (isVendido) {
          puntosInmueble = 100;
        } else {
          puntosInmueble = (isExclusiva ? 30 : 10) + (isSaneada ? 15 : 0);
        }
        return {
          ...p,
          isVendido,
          isExclusiva,
          isSaneada,
          puntosInmueble
        };
      });

      // Sincronizar en segundo plano el puntaje auditado en usuarios
      updateDoc(doc(db, 'usuarios', currentUid), {
        scoreAuditado: myStats.pts,
        ventasAuditadas: myStats.ventas,
        captacionesAuditadas: myStats.captaciones,
        rangoScore: currentTier.name
      }).catch(() => {});
    }

    // 3. Leaderboard con todos los usuarios reales
    const board = rawUsers.map((u) => {
      const stats = calculatePointsForUser(u.id, rawProperties, rawMarketing);
      const nombreDisplay = getShortName(u.nombres, u.apellidos, u.nombre || u.email);

      let tierName = 'Asesor Junior';
      if (stats.pts > 600) tierName = 'Socio Master';
      else if (stats.pts > 300) tierName = 'Casa Legal Elite';
      else if (stats.pts > 100) tierName = 'Casa Legal Pro';

      return {
        id: u.id,
        nombre: nombreDisplay,
        equipo: u.equipoNombre || u.equipo || 'Casa Legal Central',
        pts: stats.pts,
        ventas: stats.ventas,
        captaciones: stats.captaciones,
        tier: tierName,
        isMe: u.id === currentUid
      };
    });

    // Ordenar por PTS descendente; desempatar por ventas
    board.sort((a, b) => b.pts - a.pts || b.ventas - a.ventas || b.captaciones - a.captaciones);

    realLeaderboard = board.map((item, idx) => ({
      ...item,
      pos: idx + 1
    }));

    const myRank = realLeaderboard.findIndex((item) => item.isMe);
    myRankPosition = myRank !== -1 ? myRank + 1 : 1;

    loading = false;
    isRefreshing = false;
  };

  // Función para cambiar estado de un inmueble (Activo, Reservado, Vendido) en tiempo real
  const changePropertyStatus = async (propId, nuevoEstado) => {
    isUpdatingStatus[propId] = true;
    try {
      await updateDoc(doc(db, 'inmuebles', propId), { estado: nuevoEstado });
      statusSuccessToast = `¡Estado actualizado a "${nuevoEstado}"! Tu puntuación se recalculó en tiempo real.`;
      setTimeout(() => {
        statusSuccessToast = null;
      }, 4000);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar estado: ' + err.message);
    } finally {
      isUpdatingStatus[propId] = false;
    }
  };

  onMount(() => {
    isRefreshing = true;

    // Listener 1: Inmuebles en tiempo real (al subir captación o vender se actualiza automáticamente)
    unsubInmuebles = onSnapshot(
      collection(db, 'inmuebles'),
      (snapshot) => {
        rawProperties = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        recalculateAll();
      },
      (err) => {
        console.error('Error listener inmuebles:', err);
        loading = false;
        isRefreshing = false;
      }
    );

    // Listener 2: Marketing en tiempo real (leads y visitas)
    unsubMarketing = onSnapshot(
      collection(db, 'marketing_agentes'),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((d) => {
          map[d.id] = d.data();
        });
        rawMarketing = map;
        recalculateAll();
      },
      (err) => console.error('Error listener marketing:', err)
    );

    // Listener 3: Usuarios en tiempo real (para el ranking)
    unsubUsuarios = onSnapshot(
      collection(db, 'usuarios'),
      (snapshot) => {
        rawUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        recalculateAll();
      },
      (err) => console.error('Error listener usuarios:', err)
    );

    return () => {
      if (unsubInmuebles) unsubInmuebles();
      if (unsubMarketing) unsubMarketing();
      if (unsubUsuarios) unsubUsuarios();
    };
  });

  onDestroy(() => {
    if (unsubInmuebles) unsubInmuebles();
    if (unsubMarketing) unsubMarketing();
    if (unsubUsuarios) unsubUsuarios();
  });
</script>

<svelte:head>
  <title>Casa Legal Score | Rendimiento en Tiempo Real</title>
</svelte:head>

<div class="p-4 md:p-8 font-sans min-h-screen bg-[#071311] text-slate-100 flex flex-col overflow-y-auto selection:bg-[#D4AF37] selection:text-black">
  
  <!-- TOAST DE CONFIRMACIÓN DE ACCIÓN -->
  {#if statusSuccessToast}
    <div class="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
      <Check size={18} class="text-white shrink-0" />
      <span>{statusSuccessToast}</span>
    </div>
  {/if}

  <!-- ENCABEZADO PRINCIPAL -->
  <header class="max-w-7xl mx-auto w-full mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
    <div>
      <div class="flex items-center gap-2 mb-2">
        <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles size={12} /> Gamificación & Desempeño Real
        </span>
        <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Datos 100% en Vivo
        </span>
      </div>
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
        Casa Legal Score
      </h1>
      <p class="text-slate-400 text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed">
        Puntuación auditada en tiempo real según tus captaciones, exclusivas, saneamiento y ventas registradas en el CRM.
      </p>
    </div>

    <!-- BOTONES DE ACCIÓN: REFRESCAR Y CÓMO SUMAR PUNTOS -->
    <div class="flex items-center gap-3 shrink-0">
      <button
        type="button"
        onclick={recalculateAll}
        disabled={isRefreshing}
        class="p-3 rounded-2xl bg-[#0a201b] hover:bg-[#12362e] border border-[#1b4a3f] text-[#D4AF37] shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        title="Recalcular puntos en tiempo real"
      >
        <RefreshCw size={16} class={isRefreshing ? 'animate-spin' : ''} />
      </button>

      <button
        type="button"
        onclick={() => (showRules = !showRules)}
        class="px-5 py-3 rounded-2xl bg-[#0f2a24] hover:bg-[#163a32] border border-[#1b4a3f] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        <HelpCircle size={16} />
        <span>{showRules ? 'Ocultar Puntos' : '¿Cómo Sumar Puntos?'}</span>
        {#if showRules}<ChevronUp size={16}/>{:else}<ChevronDown size={16}/>{/if}
      </button>
    </div>
  </header>

  <div class="max-w-7xl mx-auto w-full space-y-8">
    
    <!-- 1. TARJETA PRINCIPAL DE GAMIFICACIÓN REAL (HERO SCORE CARD) -->
    <section class="relative rounded-3xl bg-gradient-to-br from-[#0c241f] via-[#091b17] to-[#040d0b] border border-[#1d463d] p-6 md:p-10 shadow-2xl overflow-hidden group">
      <!-- Glow ambiental dorado/esmeralda -->
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#D4AF37]/15 transition-all duration-700"></div>
      <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Icono translúcido de fondo -->
      <div class="absolute right-4 bottom-0 opacity-5 pointer-events-none transform translate-x-8 translate-y-8">
        <svelte:component this={currentTier.icon} size={280} class="text-[#D4AF37]" />
      </div>

      <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        <!-- Emblema y datos del nivel actual -->
        <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <!-- Escudo con resplandor -->
          <div class="relative">
            <div class="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-[#12382e] to-[#061512] border-2 border-[#D4AF37]/60 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.25)] relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              <svelte:component this={currentTier.icon} size={54} class="text-[#D4AF37] drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]" />
            </div>
            <!-- Medalla flotante con comisión -->
            <span class="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">
              {currentTier.comision}
            </span>
          </div>

          <!-- Textos del Rango -->
          <div>
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span class="px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider {currentTier.colorBadge}">
                Tu Nivel Actual
              </span>
              <span class="text-xs text-slate-400 font-bold">
                {myUserName}
              </span>
            </div>
            <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              {currentTier.name}
            </h2>
            <p class="text-slate-300 text-xs md:text-sm max-w-md">
              Comisión directa del <strong class="text-[#D4AF37] font-bold">{currentTier.comision}</strong> por cada operación cerrada.
            </p>
          </div>
        </div>

        <!-- Métrica de Puntos Totales Reales -->
        <div class="flex flex-col items-center lg:items-end justify-center text-center lg:text-right bg-[#051410]/80 border border-[#173a32] p-6 rounded-2xl backdrop-blur-md min-w-[240px]">
          <span class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Flame size={14} class="text-[#D4AF37]" /> Puntos Totales (PTS)
          </span>
          <div class="text-5xl md:text-6xl font-black text-[#D4AF37] font-mono tracking-tight my-1 drop-shadow-md">
            {currentPoints}
          </div>
          <p class="text-xs text-slate-400">
            {currentVentas} {currentVentas === 1 ? 'Venta' : 'Ventas'} · {captacionesCount} {captacionesCount === 1 ? 'Captación' : 'Captaciones'}
          </p>
        </div>

      </div>

      <!-- Barra de Progreso Hacia Siguiente Nivel -->
      <div class="relative z-10 mt-8 pt-6 border-t border-[#173a32]">
        {#if nextTier}
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Próximo Nivel:</span>
              <strong class="text-white font-extrabold flex items-center gap-1.5">
                <svelte:component this={nextTier.icon} size={15} class="text-[#D4AF37]" />
                {nextTier.name}
              </strong>
              <span class="text-[10px] text-slate-500 font-mono">({nextTier.minPts} PTS)</span>
            </div>
            <div class="text-slate-300 font-medium">
              Faltan <strong class="text-[#D4AF37] font-bold font-mono">{pointsToNext} PTS</strong> para subir de rango ({nextTier.comision} com.)
            </div>
          </div>

          <!-- Barra visual fluida -->
          <div class="h-3.5 w-full bg-[#051512] rounded-full overflow-hidden p-0.5 border border-[#1b4339]">
            <div
              class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#D4AF37] to-amber-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              style="width: {progressPercentage}%"
            ></div>
          </div>

          <div class="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 font-bold">
            <span>{currentTier.minPts} PTS ({currentTier.name})</span>
            <span class="text-[#D4AF37] font-black">{progressPercentage}% Completado</span>
            <span>{nextTier.minPts} PTS ({nextTier.name})</span>
          </div>
        {:else}
          <div class="p-4 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-center">
            <p class="font-black text-[#D4AF37] uppercase tracking-wider text-sm flex items-center justify-center gap-2">
              <Crown size={20} /> ¡Felicidades! Has alcanzado el rango máximo: Socio Master (80% Comisión)
            </p>
          </div>
        {/if}
      </div>
    </section>

    <!-- 2. DESGLOSE TRANSPARENTE: REGLAS DE PUNTUACIÓN (COLAPSIBLE) -->
    {#if showRules}
      <section class="rounded-3xl bg-[#091a17] border border-[#1d463d] p-6 md:p-8 shadow-xl animate-in fade-in duration-300">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-extrabold text-white flex items-center gap-2.5">
              <Briefcase size={22} class="text-[#D4AF37]" /> Tabulador Oficial de Puntos Casa Legal
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Puntajes exactos calculados automáticamente por tus acciones en el sistema.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {#each scoreRules as rule}
            <div class="rounded-2xl p-4 bg-[#061411] border border-[#173830] flex flex-col justify-between hover:border-[#D4AF37]/40 transition-all">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="p-2.5 rounded-xl bg-[#0d2620] border border-[#1b3d36] {rule.color}">
                    <svelte:component this={rule.icon} size={20} />
                  </div>
                  <span class="text-[10px] px-2.5 py-0.5 rounded-full border uppercase {rule.badgeClass}">
                    {rule.badge}
                  </span>
                </div>
                <h4 class="font-bold text-sm text-white mb-1 leading-snug">{rule.title}</h4>
                <p class="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
              </div>
              <div class="mt-4 pt-3 border-t border-[#173830] flex items-center justify-between">
                <span class="text-[10px] text-slate-500 font-black uppercase tracking-wider">Recompensa</span>
                <span class="text-base font-black text-[#D4AF37]">{rule.pts}</span>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- 3. GRID PRINCIPAL: RANGOS LIMPIOS + AUDITORÍA DE CAPTACIONES + LEADERBOARD & MARKETING -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- COLUMNA IZQUIERDA (2 COLS): TARJETAS DE NIVELES Y AUDITORÍA DE INMUEBLES -->
      <div class="lg:col-span-2 space-y-8">
        
        <!-- CARD: ESTRUCTURA DE RANGOS Y COMISIONES (Completamente limpia, sin descripciones temporales) -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-8 shadow-xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-extrabold text-white flex items-center gap-2.5">
                <Target size={22} class="text-[#D4AF37]" /> Estructura de Rangos y Comisiones
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                Porcentajes de comisión escalonados según tu rendimiento mensual en Casa Legal.
              </p>
            </div>
            <span class="text-[11px] font-bold text-slate-400 bg-[#061411] px-3 py-1 rounded-full border border-[#1b3d36]">
              4 Rangos
            </span>
          </div>

          <!-- GRID DE LOS 4 NIVELES LIMPIO (Solo Nombre, Rango, Comisión y Requisito) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            {#each tiers as tier, i}
              {@const isCurrent = i === currentTierIndex}
              {@const isUnlocked = i <= currentTierIndex}
              <div
                class="rounded-2xl p-6 border-2 transition-all relative overflow-hidden flex flex-col justify-between {isCurrent
                  ? 'border-[#D4AF37] bg-gradient-to-br from-[#12382e] via-[#0c241f] to-[#071613] shadow-[0_0_30px_rgba(212,175,55,0.2)] ring-2 ring-[#D4AF37]/30 scale-[1.01]'
                  : isUnlocked
                  ? 'border-[#1b4339] bg-[#071613]'
                  : 'border-[#142e27] bg-[#05110e]/70 opacity-80'}"
              >
                <!-- Header del Rango -->
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br {tier.colorGlow} shadow-md">
                      <svelte:component this={tier.icon} size={22} />
                    </div>
                    <div>
                      <h4 class="font-extrabold text-base text-white leading-tight">{tier.name}</h4>
                      <span class="text-[11px] font-mono font-bold text-[#D4AF37] block mt-0.5">{tier.rango}</span>
                    </div>
                  </div>

                  {#if isCurrent}
                    <span class="bg-[#D4AF37] text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md animate-pulse">
                      Tu Nivel Actual
                    </span>
                  {:else if isUnlocked}
                    <span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} /> Superado
                    </span>
                  {:else}
                    <span class="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock size={11} /> Próximo
                    </span>
                  {/if}
                </div>

                <!-- Comisión Porcentual Destacada -->
                <div class="mt-4 p-4 rounded-xl bg-[#061411]/90 border border-[#173830] flex items-center justify-between">
                  <div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-400 font-black block">Comisión Directa</span>
                    <span class="text-xs text-slate-300 font-medium">Porcentaje por cierre</span>
                  </div>
                  <div class="text-right">
                    <span class="text-4xl font-black text-[#D4AF37] font-mono leading-none">{tier.comision}</span>
                  </div>
                </div>

                <!-- Footer del Rango -->
                <div class="mt-4 pt-3 border-t border-[#16362e] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Requisito mensual:</span>
                  <strong class="text-slate-200 font-mono">{tier.rango}</strong>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- SECCIÓN: AUDITORÍA EN VIVO DE MIS CAPTACIONES Y PUNTUACIÓN REAL -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-8 shadow-xl">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-extrabold text-white flex items-center gap-2.5">
                  <Home size={22} class="text-emerald-400" /> Mis Captaciones & Puntuación
                </h3>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black">
                  {myProperties.length} Inmuebles
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Auditoría transparente de cada propiedad captada y los puntos exactos que te suma.
              </p>
            </div>
            <a
              href="/inmuebles/nuevo"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              <Plus size={16} /> Subir Captación (+45 PTS)
            </a>
          </div>

          {#if myProperties.length === 0}
            <!-- Empty state motivador -->
            <div class="p-8 rounded-2xl bg-[#061411] border border-dashed border-[#1e483f] text-center flex flex-col items-center justify-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-[#0e2c24] border border-[#23584d] flex items-center justify-center text-[#D4AF37]">
                <Home size={32} />
              </div>
              <div class="max-w-md">
                <h4 class="text-base font-black text-white mb-1">Aún no tienes captaciones este mes</h4>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Sube tu primer inmueble al CRM y suma automáticamente hasta <strong class="text-[#D4AF37]">+45 PTS</strong> (+30 por Exclusiva y +15 por Saneamiento legal). ¡Sube de nivel a Casa Legal Pro!
                </p>
              </div>
              <a
                href="/inmuebles/nuevo"
                class="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={16} /> Subir Mi Primera Captación
              </a>
            </div>
          {:else}
            <!-- Lista de Captaciones con desglose y cambio de estado en vivo -->
            <div class="space-y-4">
              {#each myProperties as prop}
                {@const prices = getDualPrice(prop.precioLista, prop.moneda)}
                <div class="p-4 rounded-2xl bg-[#061411] border border-[#173a32] hover:border-[#225549] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  <!-- Thumbnail & Datos -->
                  <div class="flex items-center gap-4 min-w-0 flex-1">
                    <img
                      src={prop.fotoPrincipal || '/logoinmo.png'}
                      alt={prop.tituloPropiedad || 'Propiedad'}
                      class="w-16 h-16 rounded-xl object-cover border border-[#1b4339] shrink-0 bg-black/40"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border font-mono {prop.isVendido
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : prop.estado === 'Reservado'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}">
                          {prop.estado || 'Activo'}
                        </span>
                        {#if prop.isExclusiva}
                          <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            Exclusiva (+30)
                          </span>
                        {:else}
                          <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            Estándar (+10)
                          </span>
                        {/if}
                        {#if prop.isSaneada}
                          <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                            Saneada (+15)
                          </span>
                        {/if}
                      </div>
                      <h4 class="font-extrabold text-sm text-white truncate">
                        {prop.tituloPropiedad || prop.tipoInmueble + ' en ' + (prop.zona || prop.ciudad)}
                      </h4>
                      <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                        <span class="text-white font-bold">{prices.usdFormatted} USD</span> · <span class="text-[#D4AF37] font-bold">{prices.bobFormatted}</span> · {prop.ciudad}
                      </p>
                    </div>
                  </div>

                  <!-- Selector rápido de Estado & Puntos aportados -->
                  <div class="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-[#142e27]">
                    <!-- Selector de Estado en Vivo -->
                    <div class="flex items-center bg-[#0a201b] p-1 rounded-xl border border-[#1b4339]">
                      <button
                        type="button"
                        onclick={() => changePropertyStatus(prop.id, 'Activo')}
                        disabled={isUpdatingStatus[prop.id] || prop.estado === 'Activo'}
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all {prop.estado === 'Activo' || !prop.estado
                          ? 'bg-emerald-500 text-black shadow'
                          : 'text-slate-400 hover:text-white'}"
                        title="Marcar como Activo en Inventario"
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        onclick={() => changePropertyStatus(prop.id, 'Reservado')}
                        disabled={isUpdatingStatus[prop.id] || prop.estado === 'Reservado'}
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all {prop.estado === 'Reservado'
                          ? 'bg-amber-400 text-black shadow'
                          : 'text-slate-400 hover:text-white'}"
                        title="Marcar como Reservado"
                      >
                        Reservado
                      </button>
                      <button
                        type="button"
                        onclick={() => changePropertyStatus(prop.id, 'Vendido')}
                        disabled={isUpdatingStatus[prop.id] || prop.isVendido}
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all {prop.isVendido
                          ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black shadow font-black'
                          : 'text-[#D4AF37] hover:bg-[#D4AF37]/20'}"
                        title="Marcar como Vendido (+100 PTS)"
                      >
                        🎉 Vendido
                      </button>
                    </div>

                    <!-- Puntos que aporta -->
                    <div class="text-right min-w-[70px]">
                      <span class="text-base font-black text-[#D4AF37] font-mono block leading-none">
                        +{prop.puntosInmueble}
                      </span>
                      <span class="text-[9px] uppercase font-bold text-slate-400">PTS</span>
                    </div>

                    <!-- Enlaces -->
                    <div class="flex items-center gap-1.5">
                      <a
                        href="/inmuebles/{prop.id}/marketing"
                        class="p-2 rounded-lg bg-[#0e2822] hover:bg-[#163a32] text-[#D4AF37] border border-[#1a443a] transition-colors"
                        title="Generar Flyer de Marketing"
                      >
                        <Megaphone size={14} />
                      </a>
                      <a
                        href="/inmuebles/{prop.id}"
                        class="p-2 rounded-lg bg-[#0e2822] hover:bg-[#163a32] text-slate-300 border border-[#1a443a] transition-colors"
                        title="Ver detalle del inmueble"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                </div>
              {/each}
            </div>
          {/if}
        </div>

      </div>

      <!-- COLUMNA DERECHA: LEADERBOARD REAL TOP 5 + PANEL DE MARKETING REAL -->
      <div class="space-y-6">
        
        <!-- LEADERBOARD GLOBAL 100% REAL DE FIRESTORE -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 shadow-xl flex flex-col">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-lg font-black text-white flex items-center gap-2">
                <Crown size={20} class="text-[#D4AF37]" /> Leaderboard Real
              </h3>
              <p class="text-[11px] text-slate-400">Ordenado por Puntos Totales (PTS)</p>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider bg-[#061411] text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
              En Vivo
            </span>
          </div>

          <!-- LISTA DE ASESORES REALES -->
          {#if loading}
            <div class="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
              <span class="text-xs">Auditando puntos en Firestore...</span>
            </div>
          {:else if realLeaderboard.length === 0}
            <div class="py-8 text-center text-slate-500 text-xs italic">
              No hay asesores registrados en el sistema aún.
            </div>
          {:else}
            <div class="space-y-3">
              {#each realLeaderboard.slice(0, 5) as agent, idx}
                <div
                  class="p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 {agent.isMe
                    ? 'border-[#D4AF37] bg-gradient-to-r from-[#173a30] via-[#0c2620] to-[#091d18] shadow-md ring-1 ring-[#D4AF37]/40'
                    : idx === 0
                    ? 'border-[#D4AF37]/50 bg-[#0c241e]'
                    : idx === 1
                    ? 'border-slate-500/40 bg-[#0b211c]'
                    : idx === 2
                    ? 'border-amber-700/40 bg-[#091d18]'
                    : 'border-[#163830] bg-[#061411]'}"
                >
                  <!-- Posición y Medalla -->
                  <div class="shrink-0">
                    {#if agent.pos === 1}
                      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black text-xs shadow-lg">
                        <Crown size={16} />
                      </div>
                    {:else if agent.pos === 2}
                      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-300 to-slate-500 text-black flex items-center justify-center font-black text-xs shadow-md">
                        2
                      </div>
                    {:else if agent.pos === 3}
                      <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xs shadow-md">
                        3
                      </div>
                    {:else}
                      <div class="w-8 h-8 rounded-xl bg-[#0c221d] text-slate-400 flex items-center justify-center font-bold text-xs border border-[#163830]">
                        {agent.pos}
                      </div>
                    {/if}
                  </div>

                  <!-- Info del Asesor Real -->
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-xs text-white truncate">
                      {agent.nombre} {agent.isMe ? '(Tú)' : ''}
                    </p>
                    <p class="text-[10px] text-slate-400 truncate mt-0.5">
                      {agent.equipo} · <span class="text-[#D4AF37] font-semibold">{agent.tier}</span>
                    </p>
                  </div>

                  <!-- Puntos Totales Reales -->
                  <div class="text-right shrink-0">
                    <p class="text-sm font-black text-[#D4AF37] font-mono leading-none">
                      {agent.pts} <span class="text-[9px] font-sans text-slate-400 font-bold">PTS</span>
                    </p>
                    <p class="text-[10px] text-slate-400 mt-1">
                      {agent.captaciones} cap. · {agent.ventas} vtas.
                    </p>
                  </div>
                </div>
              {/each}
            </div>

            <!-- TARJETA FIJADA CON TU POSICIÓN REAL -->
            <div class="mt-4 pt-4 border-t border-[#173a32]">
              <div class="p-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 to-[#0f2c24] border border-[#D4AF37]/40 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-[#D4AF37] text-black font-black text-xs flex items-center justify-center shadow">
                    #{myRankPosition}
                  </div>
                  <div>
                    <p class="text-xs font-black text-white">{myUserName} (Tú)</p>
                    <p class="text-[10px] text-[#D4AF37] font-bold">{myTeamName}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-sm font-black text-[#D4AF37] font-mono">{currentPoints} PTS</span>
                  <p class="text-[9px] uppercase tracking-wider text-emerald-400 font-black">Activo</p>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- PANEL DE IMPACTO DE NEGOCIO & MARKETING (CONEXIÓN 100% REAL) -->
        <div class="bg-gradient-to-br from-[#0c241f] to-[#061411] border border-[#1b3d36] rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-base font-black text-white flex items-center gap-2">
              <TrendingUp size={18} class="text-emerald-400" /> Impacto en el Negocio
            </h3>
            <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Datos Reales
            </span>
          </div>

          <div class="space-y-3.5">
            <!-- Vistas Totales Reales -->
            <div class="p-4 rounded-2xl bg-[#061411] border border-[#173830] flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <Eye size={20} />
                </div>
                <div>
                  <p class="text-[10px] uppercase font-black tracking-widest text-slate-400">Vistas de Portafolio</p>
                  <p class="text-xl font-black text-white font-mono mt-0.5">{vistasTotales}</p>
                </div>
              </div>
              <svg width="48" height="24" viewBox="0 0 48 24" class="text-emerald-400">
                <path d="M2 20 L12 16 L22 18 L32 8 L46 4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </div>

            <!-- Leads Directos Reales -->
            <div class="p-4 rounded-2xl bg-[#061411] border border-[#173830] flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <MousePointerClick size={20} />
                </div>
                <div>
                  <p class="text-[10px] uppercase font-black tracking-widest text-slate-400">Leads Directos</p>
                  <p class="text-xl font-black text-white font-mono mt-0.5">{leadsTotales}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Conversión</span>
                <span class="text-xs font-black text-emerald-400 font-mono">{conversionRate}%</span>
              </div>
            </div>

            <!-- Desglose de Puntos Reales -->
            <div class="p-4 rounded-2xl bg-[#0a231d] border border-[#D4AF37]/30 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Captaciones ({captacionesCount}):</span>
                <strong class="text-[#D4AF37] font-mono">+{captacionesCount * 10} pts</strong>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Bonus Exclusivas ({exclusivasCount}):</span>
                <strong class="text-amber-300 font-mono">+{exclusivasCount * 20} pts</strong>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Bonus Saneadas ({saneadasCount}):</span>
                <strong class="text-amber-200 font-mono">+{saneadasCount * 15} pts</strong>
              </div>
              {#if currentVentas > 0}
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-300">Ventas Cerradas ({currentVentas}):</span>
                  <strong class="text-emerald-400 font-mono">+{currentVentas * 100} pts</strong>
                </div>
              {/if}
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Leads Directos ({leadsTotales}):</span>
                <strong class="text-emerald-400 font-mono">+{leadsTotales * 5} pts</strong>
              </div>
              <div class="pt-2 border-t border-[#1b3d36] flex items-center justify-between text-xs font-bold">
                <span class="text-white">Puntaje Total Auditado:</span>
                <span class="text-[#D4AF37] font-black font-mono">{currentPoints} PTS</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</div>
