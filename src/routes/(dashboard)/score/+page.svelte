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
    AlertCircle,
    FileText,
    Scale,
    Building,
    Clock,
    Calculator,
    Calendar,
    DollarSign,
    Percent,
    ShieldAlert,
    BookOpen,
    Award,
    CheckSquare,
    Coins,
    Sliders,
    CheckCircle,
    XCircle,
    Info
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
  import { getDualPrice, TIPO_CAMBIO_OFICIAL } from '#lib/currency';

  // 1. REGLAMENTO OFICIAL CASA LEGAL: CONSTANTES Y VALORES (CAPÍTULO V)
  const VALOR_PUNTO_BS = 2.50; // Cada punto equivale a 2.50 Bs.
  const CUOTA_MENSUAL_BS = 250; // Cuota/Membresía mensual (hasta el 5 de cada mes)

  // Estructura de Niveles Oficiales (Limpio y prestigioso)
  const tiers = [
    {
      id: 'junior',
      name: 'Asesor Junior',
      rango: '0 - 50 PTS',
      minPts: 0,
      maxPts: 50,
      colorBadge: 'bg-slate-700/80 text-slate-200 border-slate-600',
      colorGlow: 'from-slate-600 to-slate-800',
      icon: Shield
    },
    {
      id: 'pro',
      name: 'Casa Legal Pro',
      rango: '51 - 150 PTS',
      minPts: 51,
      maxPts: 150,
      colorBadge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      colorGlow: 'from-emerald-600 to-teal-800',
      icon: Zap
    },
    {
      id: 'elite',
      name: 'Casa Legal Elite',
      rango: '151 - 300 PTS',
      minPts: 151,
      maxPts: 300,
      colorBadge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      colorGlow: 'from-[#D4AF37] to-amber-700',
      icon: Trophy
    },
    {
      id: 'master',
      name: 'Socio Master',
      rango: '300+ PTS',
      minPts: 301,
      maxPts: 1000,
      colorBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      colorGlow: 'from-purple-600 to-indigo-900',
      icon: Crown
    }
  ];

  // Reglas Oficiales de Puntuación según Reglamento Interno de Casa Legal (Cap. V)
  const scoreRules = [
    {
      title: 'Venta Cerrada',
      pts: '+25 PTS',
      cashBs: '62.50 Bs.',
      peso: '50% Peso Premiación',
      badge: '50% IMPACTO',
      badgeClass: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40 font-black',
      desc: 'Inmueble con estado Vendido registrado y validado en CRM. Base de 62.50 Bs. por cierre.',
      icon: Trophy,
      color: 'text-emerald-400'
    },
    {
      title: 'Anticrético o Preventa',
      pts: '+15 PTS',
      cashBs: '37.50 Bs.',
      peso: '30% Peso Premiación',
      badge: '30% PONDERACIÓN',
      badgeClass: 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 font-black',
      desc: 'Operación de anticrético o preventa con aporte propio. Base de 37.50 Bs. por cierre.',
      icon: Award,
      color: 'text-[#D4AF37]'
    },
    {
      title: 'Alquiler Cerrado',
      pts: '+10 PTS',
      cashBs: '25.00 Bs.',
      peso: '20% Peso Premiación',
      badge: '20% PONDERACIÓN',
      badgeClass: 'bg-blue-400/20 text-blue-300 border-blue-400/40 font-black',
      desc: 'Contrato de arrendamiento formalizado. Base de 25.00 Bs. por cierre.',
      icon: Handshake,
      color: 'text-blue-400'
    },
    {
      title: 'Captación en Exclusiva',
      pts: '+10 PTS',
      cashBs: '25.00 Bs.',
      peso: 'Inventario Prime',
      badge: '★ EXCLUSIVIDAD',
      badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-black',
      desc: 'Contrato de exclusividad firmado y documentación inicial ingresada al CRM.',
      icon: Flame,
      color: 'text-amber-400'
    },
    {
      title: 'Captación Estándar',
      pts: '+5 PTS',
      cashBs: '12.50 Bs.',
      peso: 'Inventario General',
      badge: 'CARTERA',
      badgeClass: 'bg-slate-400/20 text-slate-300 border-slate-400/40',
      desc: 'Propiedad activa con fotos, video, avalúo y ubicación Google Maps en sistema.',
      icon: Home,
      color: 'text-slate-300'
    },
    {
      title: 'Saneamiento Legal al Día',
      pts: '+5 PTS',
      cashBs: '12.50 Bs.',
      peso: 'Seguridad Jurídica',
      badge: 'SANEADA',
      badgeClass: 'bg-teal-400/20 text-teal-300 border-teal-400/40 font-black',
      desc: 'Folio Real <90 días, sin gravámenes, catastro e impuestos municipales al día.',
      icon: FileCheck,
      color: 'text-teal-400'
    },
    {
      title: 'Lead / Actividad Comercial',
      pts: '+1 PT',
      cashBs: '2.50 Bs.',
      peso: 'Marketing Directo',
      badge: 'MARKETING',
      badgeClass: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
      desc: 'Por cada lead/contacto registrado en CRM o visita comercial presencial.',
      icon: CalendarCheck,
      color: 'text-cyan-400'
    }
  ];

  // Estado del usuario y datos 100% REALES
  let loading = $state(true);
  let isRefreshing = $state(false);
  let showRules = $state(false);
  let showReglamentoCompleto = $state(true);
  let activeReglamentoTab = $state('cierres'); // 'cierres' | 'cuota' | 'liderazgo' | 'captacion' | 'disciplina' | 'conducta'

  let currentPoints = $state(0);
  let currentVentas = $state(0);
  let currentAnticreticos = $state(0);
  let currentAlquileres = $state(0);
  let captacionesCount = $state(0);
  let exclusivasCount = $state(0);
  let saneadasCount = $state(0);
  let vistasTotales = $state(0);
  let leadsTotales = $state(0);

  // Bolsa en efectivo ganada por el usuario (en Bs. y USD)
  let bolsaGanadaBs = $derived(currentPoints * VALOR_PUNTO_BS);
  let bolsaGanadaUSD = $derived(bolsaGanadaBs / TIPO_CAMBIO_OFICIAL);

  // Leaderboard 100% real cargado de Firestore
  let realLeaderboard = $state([]);
  let myRankPosition = $state(1);

  // Lista de captaciones del usuario logueado con auditoría de puntos
  let myProperties = $state([]);
  let isUpdatingStatus = $state({});
  let statusSuccessToast = $state(null);

  // Simulador Regla del 80% para Líderes (Capítulo V, Art. 3 y 4)
  let simAgentesEquipo = $state(10); // mínimo 10 agentes
  let simPuntosLogrados = $state(420);
  let metaBasePuntos = $derived(simAgentesEquipo * 50); // 50 pts por agente
  let minimoParaCobrarPuntos = $derived(Math.round(metaBasePuntos * 0.8)); // 80%
  let porcentajeMetaLogrado = $derived(metaBasePuntos > 0 ? Math.round((simPuntosLogrados / metaBasePuntos) * 100) : 0);
  let calificaLider = $derived(simPuntosLogrados >= minimoParaCobrarPuntos);
  let fondoLiderAcumuladoBs = $derived(simAgentesEquipo * 50); // 50 Bs. por agente
  let pagoEfectivoLiderBs = $derived(calificaLider ? fondoLiderAcumuladoBs : 0);
  let ahorroInstitucionalBs = $derived(!calificaLider ? fondoLiderAcumuladoBs : 0);

  // Formatear Nombre
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
    if (currentPoints <= 50) return 0;
    if (currentPoints <= 150) return 1;
    if (currentPoints <= 300) return 2;
    return 3;
  });

  let currentTier = $derived(tiers[currentTierIndex]);
  let HeroIcon = $derived(currentTier.icon);
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

  // Función de cálculo estricto de puntos según el Reglamento Oficial de Casa Legal
  const calculatePointsForUser = (userId, allProperties, mktDocMap) => {
    let pts = 0;
    let captaciones = 0;
    let ventas = 0;
    let anticreticos = 0;
    let alquileres = 0;
    let exclusivas = 0;
    let saneadas = 0;

    // Propiedades del asesor
    const userProps = allProperties.filter(
      (p) => p.agenteId === userId || p.usuarioId === userId || p.creadorId === userId
    );

    for (const p of userProps) {
      captaciones++;
      const op = (p.tipoOperacion || p.operacion || '').toLowerCase();
      const st = (p.estado || p.estadoOperacion || '').toLowerCase();
      const isCerrado = st === 'vendido' || st === 'alquilado' || st === 'anticrético' || st === 'cerrado';

      if (isCerrado) {
        if (op.includes('alquiler') || st === 'alquilado') {
          alquileres++;
          pts += 10; // 10 pts = 25.00 Bs.
        } else if (op.includes('anticr') || op.includes('preventa') || st === 'anticrético') {
          anticreticos++;
          pts += 15; // 15 pts = 37.50 Bs.
        } else {
          ventas++;
          pts += 25; // 25 pts = 62.50 Bs.
        }
      } else {
        // En cartera activa
        if (p.tipoRepresentacion === 'Exclusiva') {
          exclusivas++;
          pts += 10;
        } else {
          pts += 5;
        }

        if (p.estadoFolio === 'Al día' && p.impuestosAlDia && p.planosAprobados) {
          saneadas++;
          pts += 5;
        }
      }
    }

    // Leads de marketing (+1 PT cada lead verificado)
    const mkt = mktDocMap[userId];
    const leads = mkt?.leads || 0;
    const vistas = mkt?.vistas || 0;
    pts += leads * 1;

    return {
      pts,
      captaciones,
      ventas,
      anticreticos,
      alquileres,
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

    if (currentUid) {
      const myStats = calculatePointsForUser(currentUid, rawProperties, rawMarketing);
      currentPoints = myStats.pts;
      currentVentas = myStats.ventas;
      currentAnticreticos = myStats.anticreticos;
      currentAlquileres = myStats.alquileres;
      captacionesCount = myStats.captaciones;
      exclusivasCount = myStats.exclusivas;
      saneadasCount = myStats.saneadas;
      leadsTotales = myStats.leads;
      vistasTotales = myStats.vistas;

      const userProps = rawProperties.filter(
        (p) => p.agenteId === currentUid || p.usuarioId === currentUid || p.creadorId === currentUid
      );

      myProperties = userProps.map((p) => {
        const op = (p.tipoOperacion || p.operacion || '').toLowerCase();
        const st = (p.estado || p.estadoOperacion || '').toLowerCase();
        const isCerrado = st === 'vendido' || st === 'alquilado' || st === 'anticrético' || st === 'cerrado';
        const isExclusiva = p.tipoRepresentacion === 'Exclusiva';
        const isSaneada = p.estadoFolio === 'Al día' && p.impuestosAlDia && p.planosAprobados;
        
        let puntosInmueble = 0;
        let premioEfectivoBs = 0;

        if (isCerrado) {
          if (op.includes('alquiler') || st === 'alquilado') {
            puntosInmueble = 10;
            premioEfectivoBs = 25.00;
          } else if (op.includes('anticr') || op.includes('preventa') || st === 'anticrético') {
            puntosInmueble = 15;
            premioEfectivoBs = 37.50;
          } else {
            puntosInmueble = 25;
            premioEfectivoBs = 62.50;
          }
        } else {
          puntosInmueble = (isExclusiva ? 10 : 5) + (isSaneada ? 5 : 0);
          premioEfectivoBs = puntosInmueble * VALOR_PUNTO_BS;
        }

        return {
          ...p,
          isCerrado,
          isExclusiva,
          isSaneada,
          puntosInmueble,
          premioEfectivoBs
        };
      });

      // Sincronizar en segundo plano en Firestore
      updateDoc(doc(db, 'usuarios', currentUid), {
        scoreAuditado: myStats.pts,
        ventasAuditadas: myStats.ventas,
        captacionesAuditadas: myStats.captaciones,
        bolsaGanadaBs: myStats.pts * VALOR_PUNTO_BS,
        rangoScore: currentTier.name
      }).catch(() => {});
    }

    // Leaderboard con todos los usuarios reales
    const board = rawUsers.map((u) => {
      const stats = calculatePointsForUser(u.id, rawProperties, rawMarketing);
      const nombreDisplay = getShortName(u.nombres, u.apellidos, u.nombre || u.email);

      let tierName = 'Asesor Junior';
      if (stats.pts > 300) tierName = 'Socio Master';
      else if (stats.pts > 150) tierName = 'Casa Legal Elite';
      else if (stats.pts > 50) tierName = 'Casa Legal Pro';

      return {
        id: u.id,
        nombre: nombreDisplay,
        equipo: u.equipoNombre || u.equipo || 'Casa Legal Central',
        pts: stats.pts,
        ventas: stats.ventas,
        captaciones: stats.captaciones,
        gananciaBs: stats.pts * VALOR_PUNTO_BS,
        tier: tierName,
        isMe: u.id === currentUid
      };
    });

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

  // Función para cambiar estado de un inmueble (Activo, Reservado, Vendido, Alquilado) en tiempo real
  const changePropertyStatus = async (propId, nuevoEstado) => {
    isUpdatingStatus[propId] = true;
    try {
      await updateDoc(doc(db, 'inmuebles', propId), { estado: nuevoEstado });
      statusSuccessToast = `¡Estado actualizado a "${nuevoEstado}"! Puntuación e incentivos recalculados según el reglamento.`;
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

    // Listener 1: Inmuebles en tiempo real
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

    // Listener 2: Marketing en tiempo real
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

    // Listener 3: Usuarios en tiempo real
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
  <title>Casa Legal Score | Sistema Oficial de Puntuación & Premiación</title>
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
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <Scale size={12} /> Reglamento Oficial Casa Legal
        </span>
        <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 1 PT = 2.50 Bs. en Efectivo
        </span>
        <span class="text-xs text-slate-400 font-mono">
          T.C. Oficial: <strong class="text-white">11.86 Bs/USD</strong>
        </span>
      </div>
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
        Casa Legal Score
      </h1>
      <p class="text-slate-400 text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed">
        Puntuación oficial por cierres (Venta 25 pts, Anticrético 15 pts, Alquiler 10 pts) e incentivos en efectivo según el Reglamento Interno de Casa Legal.
      </p>
    </div>

    <!-- BOTONES DE ACCIÓN: REFRESCAR Y VER REGLAMENTO -->
    <div class="flex flex-wrap items-center gap-3 shrink-0">
      <button
        type="button"
        onclick={recalculateAll}
        disabled={isRefreshing}
        class="p-3 rounded-2xl bg-[#0a201b] hover:bg-[#12362e] border border-[#1b4a3f] text-[#D4AF37] shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
        title="Recalcular puntos en tiempo real"
      >
        <RefreshCw size={16} class={isRefreshing ? 'animate-spin' : ''} />
      </button>

      <!-- BOTÓN TOGGLE REGLAMENTO OFICIAL -->
      <button
        type="button"
        onclick={() => (showReglamentoCompleto = !showReglamentoCompleto)}
        class="px-4 py-3 rounded-2xl bg-[#0e2a23] hover:bg-[#153830] border border-[#1b4a3f] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <BookOpen size={16} />
        <span>{showReglamentoCompleto ? 'Ocultar Reglamento' : 'Ver Reglamento Oficial'}</span>
        {#if showReglamentoCompleto}<ChevronUp size={15}/>{:else}<ChevronDown size={15}/>{/if}
      </button>

      <!-- BOTÓN CÓMO SUMAR PUNTOS -->
      <button
        type="button"
        onclick={() => (showRules = !showRules)}
        class="px-4 py-3 rounded-2xl bg-[#0f2a24] hover:bg-[#163a32] border border-[#1b4a3f] text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <HelpCircle size={16} />
        <span>{showRules ? 'Ocultar Puntos' : 'Tabla de Puntos'}</span>
        {#if showRules}<ChevronUp size={15}/>{:else}<ChevronDown size={15}/>{/if}
      </button>
    </div>
  </header>

  <div class="max-w-7xl mx-auto w-full space-y-8">
    
    <!-- 1. TARJETA HERO: GAMIFICACIÓN Y RECOMPENSA REAL EN EFECTIVO -->
    <section class="relative rounded-3xl bg-gradient-to-br from-[#0c241f] via-[#091b17] to-[#040d0b] border border-[#1d463d] p-6 md:p-10 shadow-2xl overflow-hidden group">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#D4AF37]/15 transition-all duration-700"></div>
      <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="absolute right-4 bottom-0 opacity-5 pointer-events-none transform translate-x-8 translate-y-8">
        <HeroIcon size={280} class="text-[#D4AF37]" />
      </div>

      <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        <!-- Emblema y datos del nivel actual -->
        <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div class="relative">
            <div class="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-[#12382e] to-[#061512] border-2 border-[#D4AF37]/60 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.25)] relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              <HeroIcon size={54} class="text-[#D4AF37] drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]" />
            </div>
            <span class="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg uppercase tracking-wider">
              {currentTier.rango}
            </span>
          </div>

          <!-- Textos del Rango -->
          <div>
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span class="px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider {currentTier.colorBadge}">
                Tu Rango Actual
              </span>
              <span class="text-xs text-slate-400 font-bold">
                {myUserName}
              </span>
            </div>
            <h2 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              {currentTier.name}
            </h2>
            <p class="text-slate-300 text-xs md:text-sm max-w-md">
              Puntos acumulados conforme a cierres y operaciones auditadas por Casa Legal. Cada punto equivale a <strong class="text-[#D4AF37]">2.50 Bs.</strong> en tu bolsa mensual de premiación.
            </p>
          </div>
        </div>

        <!-- Métrica de Puntos Totales e Incentivos en Efectivo -->
        <div class="flex flex-col sm:flex-row items-center gap-4">
          <!-- Tarjeta Puntos -->
          <div class="flex flex-col items-center sm:items-end justify-center text-center sm:text-right bg-[#051410]/80 border border-[#173a32] p-5 rounded-2xl backdrop-blur-md min-w-[190px]">
            <span class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Flame size={14} class="text-[#D4AF37]" /> Puntos Totales
            </span>
            <div class="text-4xl md:text-5xl font-black text-[#D4AF37] font-mono tracking-tight my-1 drop-shadow-md">
              {currentPoints}
            </div>
            <p class="text-xs text-slate-400">
              {currentVentas} Ventas · {currentAnticreticos} Anticr. · {currentAlquileres} Alq.
            </p>
          </div>

          <!-- Tarjeta Premiación Efectivo Real (Bs. y USD) -->
          <div class="flex flex-col items-center sm:items-end justify-center text-center sm:text-right bg-gradient-to-br from-[#0c2e25] to-[#061a15] border-2 border-[#D4AF37]/50 p-5 rounded-2xl backdrop-blur-md min-w-[210px] shadow-lg">
            <span class="text-[11px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
              <Coins size={14} class="text-[#D4AF37]" /> Bolsa en Efectivo
            </span>
            <div class="text-3xl md:text-4xl font-black text-white font-mono tracking-tight my-1">
              Bs. {bolsaGanadaBs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p class="text-xs font-mono font-bold text-emerald-400">
              ≈ ${bolsaGanadaUSD.toFixed(2)} USD
            </p>
          </div>
        </div>

      </div>

      <!-- Barra de Progreso Hacia Siguiente Nivel -->
      <div class="relative z-10 mt-8 pt-6 border-t border-[#173a32]">
        {#if nextTier}
          {@const NextIcon = nextTier.icon}
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-slate-400 uppercase tracking-wider font-bold text-[10px]">Próximo Nivel:</span>
              <strong class="text-white font-extrabold flex items-center gap-1.5">
                <NextIcon size={15} class="text-[#D4AF37]" />
                {nextTier.name}
              </strong>
              <span class="text-[10px] text-slate-500 font-mono">({nextTier.minPts} PTS)</span>
            </div>
            <div class="text-slate-300 font-medium">
              Faltan <strong class="text-[#D4AF37] font-bold font-mono">{pointsToNext} PTS</strong> para subir de rango ({nextTier.rango})
            </div>
          </div>

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
              <Crown size={20} /> ¡Felicidades! Has alcanzado el rango máximo: Socio Master de Casa Legal
            </p>
          </div>
        {/if}
      </div>
    </section>

    <!-- 2. DESGLOSE TRANSPARENTE: TABLA DE PUNTOS OFICIAL (COLAPSIBLE) -->
    {#if showRules}
      <section class="rounded-3xl bg-[#091a17] border border-[#1d463d] p-6 md:p-8 shadow-xl animate-in fade-in duration-300">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-extrabold text-white flex items-center gap-2.5">
              <Scale size={22} class="text-[#D4AF37]" /> Tabla Oficial de Puntaje & Premiación por Cierre (Capítulo V)
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Base de 50 puntos = 125 Bs. de bolsa de premiación. Cada punto tiene un valor referencial de 2.50 Bs.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {#each scoreRules as rule}
            {@const RuleIcon = rule.icon}
            <div class="rounded-2xl p-4 bg-[#061411] border border-[#173830] flex flex-col justify-between hover:border-[#D4AF37]/40 transition-all">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div class="p-2.5 rounded-xl bg-[#0d2620] border border-[#1b3d36] {rule.color}">
                    <RuleIcon size={20} />
                  </div>
                  <span class="text-[10px] px-2.5 py-0.5 rounded-full border uppercase {rule.badgeClass}">
                    {rule.badge}
                  </span>
                </div>
                <h4 class="font-bold text-sm text-white mb-0.5 leading-snug">{rule.title}</h4>
                <p class="text-[11px] text-[#D4AF37] font-semibold mb-1">{rule.peso}</p>
                <p class="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
              </div>
              <div class="mt-4 pt-3 border-t border-[#173830] flex items-center justify-between">
                <div>
                  <span class="text-[10px] text-slate-500 font-bold uppercase block">Puntos</span>
                  <span class="text-base font-black text-white font-mono">{rule.pts}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-500 font-bold uppercase block">Monto en Efectivo</span>
                  <span class="text-base font-black text-[#D4AF37] font-mono">{rule.cashBs}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- 2.5 VISOR INTERACTIVO DEL REGLAMENTO OFICIAL DE CASA LEGAL (6 SECCIONES CLAVE) -->
    {#if showReglamentoCompleto}
      <section class="rounded-3xl bg-gradient-to-br from-[#0c2621] via-[#081b17] to-[#040e0c] border border-[#215246] p-6 md:p-10 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
        <div class="absolute -top-24 -right-24 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#1b4339]">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen size={13} /> Documento Institucional Vinculante
                </span>
                <span class="text-xs text-slate-400 font-bold flex items-center gap-1">
                  <Building size={12} class="text-[#D4AF37]" /> CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.
                </span>
              </div>
              <h2 class="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Reglamento Interno de Trabajo, Conducta & Operaciones
              </h2>
              <p class="text-slate-300 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
                Marco normativo institucional para asesores inmobiliarios, líderes de equipo y personal directivo. Selecciona cualquiera de las pestañas para consultar los artículos oficiales.
              </p>
            </div>
          </div>

          <!-- NAVEGACIÓN POR PESTAÑAS DEL REGLAMENTO -->
          <div class="flex flex-wrap gap-2 mb-8 pb-3 border-b border-[#173a32]">
            <button
              id="tab-cierres"
              type="button"
              onclick={() => activeReglamentoTab = 'cierres'}
              class="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer {activeReglamentoTab === 'cierres' ? 'bg-[#D4AF37] text-black shadow-md font-black' : 'bg-[#061814] text-slate-300 hover:bg-[#0c2a23] border border-[#163830]'}"
            >
              <Trophy size={14} /> 1. Puntaje por Cierres
            </button>
            <button
              id="tab-cuota"
              type="button"
              onclick={() => activeReglamentoTab = 'cuota'}
              class="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer {activeReglamentoTab === 'cuota' ? 'bg-[#D4AF37] text-black shadow-md font-black' : 'bg-[#061814] text-slate-300 hover:bg-[#0c2a23] border border-[#163830]'}"
            >
              <Coins size={14} /> 2. Membresía 250 Bs
            </button>
            <button
              id="tab-liderazgo"
              type="button"
              onclick={() => activeReglamentoTab = 'liderazgo'}
              class="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer {activeReglamentoTab === 'liderazgo' ? 'bg-[#D4AF37] text-black shadow-md font-black' : 'bg-[#061814] text-slate-300 hover:bg-[#0c2a23] border border-[#163830]'}"
            >
              <Users size={14} /> 3. Regla del 80% (Líderes)
            </button>
            <button
              id="tab-captacion"
              type="button"
              onclick={() => activeReglamentoTab = 'captacion'}
              class="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer {activeReglamentoTab === 'captacion' ? 'bg-[#D4AF37] text-black shadow-md font-black' : 'bg-[#061814] text-slate-300 hover:bg-[#0c2a23] border border-[#163830]'}"
            >
              <CheckSquare size={14} /> 4. Checklist Captación CRM
            </button>
            <button
              id="tab-disciplina"
              type="button"
              onclick={() => activeReglamentoTab = 'disciplina'}
              class="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer {activeReglamentoTab === 'disciplina' ? 'bg-[#D4AF37] text-black shadow-md font-black' : 'bg-[#061814] text-slate-300 hover:bg-[#0c2a23] border border-[#163830]'}"
            >
              <ShieldAlert size={14} /> 5. Régimen Disciplinario
            </button>
            <button
              id="tab-conducta"
              type="button"
              onclick={() => activeReglamentoTab = 'conducta'}
              class="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer {activeReglamentoTab === 'conducta' ? 'bg-[#D4AF37] text-black shadow-md font-black' : 'bg-[#061814] text-slate-300 hover:bg-[#0c2a23] border border-[#163830]'}"
            >
              <Shield size={14} /> 6. Ética & Imagen
            </button>
          </div>

          <!-- CONTENIDO PESTAÑA 1: CIERRES Y PUNTAJE -->
          {#if activeReglamentoTab === 'cierres'}
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <Trophy size={18} /> Capítulo V, Art. 1 y 3: Tabla Oficial de Premiación por Cierres
                </h3>
                <span class="text-xs text-slate-400">Total ciclo base: 50 Pts = 125 Bs</span>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="p-5 rounded-2xl bg-[#061612] border-2 border-emerald-500/50">
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">50% del Peso</span>
                  <div class="text-3xl font-black text-white font-mono my-2">25 Pts = 62.50 Bs</div>
                  <h4 class="text-sm font-bold text-emerald-400 mb-1">Cierre de Venta</h4>
                  <p class="text-xs text-slate-300">Cada operación de venta inmobiliaria cerrada suma 25 puntos íntegros a tu cuenta del mes.</p>
                </div>

                <div class="p-5 rounded-2xl bg-[#061612] border-2 border-[#D4AF37]/50">
                  <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase">30% del Peso</span>
                  <div class="text-3xl font-black text-white font-mono my-2">15 Pts = 37.50 Bs</div>
                  <h4 class="text-sm font-bold text-[#D4AF37] mb-1">Anticrético o Preventa</h4>
                  <p class="text-xs text-slate-300">Aplica para contratos de anticrético registrados o preventas con porcentaje de aporte propio pactado.</p>
                </div>

                <div class="p-5 rounded-2xl bg-[#061612] border-2 border-blue-500/50">
                  <span class="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase">20% del Peso</span>
                  <div class="text-3xl font-black text-white font-mono my-2">10 Pts = 25.00 Bs</div>
                  <h4 class="text-sm font-bold text-blue-400 mb-1">Cierre de Alquiler</h4>
                  <p class="text-xs text-slate-300">Contratos de arrendamiento formalizados y registrados en el CRM con documentación legal.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-[#0a231d] border border-[#184237] text-xs text-slate-300 leading-relaxed flex items-center gap-3">
                <Info size={22} class="text-[#D4AF37] shrink-0" />
                <p>
                  <strong>Regla de cálculo de incentivos:</strong> Al cierre de cada mes calendario se computan los puntos generados por cada asesor para el pago inmediato de sus incentivos. Cada punto equivale exactamente a <strong>2.50 Bs.</strong> de la bolsa de premiación.
                </p>
              </div>
            </div>
          {/if}

          <!-- CONTENIDO PESTAÑA 2: MEMBRESÍA 250 BS -->
          {#if activeReglamentoTab === 'cuota'}
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <Coins size={18} /> Capítulo V, Art. 1, 2 y 4: Destino Oficial de la Cuota / Membresía Mensual
                </h3>
                <span class="text-xs text-amber-400 font-mono font-bold">250 Bs. hasta cada día 5 del mes</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 50% PREMIACIÓN -->
                <div class="p-6 rounded-2xl bg-[#061713] border-2 border-[#D4AF37]/50">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-black uppercase tracking-wider text-[#D4AF37]">50% de la Membresía</span>
                    <span class="text-xl font-mono font-black text-white">125.00 Bs.</span>
                  </div>
                  <h4 class="text-base font-black text-white mb-2">Bolsa Directa de Premiación por Cierres</h4>
                  <p class="text-xs text-slate-300 leading-relaxed mb-4">
                    Este 50% se transforma íntegramente en la bolsa de incentivos para premiar los cierres comerciales de los asesores a razón de 2.50 Bs. por punto.
                  </p>
                  <ul class="text-xs text-slate-400 space-y-1.5 font-mono">
                    <li class="flex items-center justify-between"><span>• Cierres de Venta (25 pts):</span> <strong class="text-white">62.50 Bs. (50%)</strong></li>
                    <li class="flex items-center justify-between"><span>• Anticréticos/Preventas (15 pts):</span> <strong class="text-white">37.50 Bs. (30%)</strong></li>
                    <li class="flex items-center justify-between"><span>• Cierres de Alquiler (10 pts):</span> <strong class="text-white">25.00 Bs. (20%)</strong></li>
                  </ul>
                </div>

                <!-- 50% CAPACITACIÓN & LIDERAZGO -->
                <div class="p-6 rounded-2xl bg-[#061713] border-2 border-emerald-500/50">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-black uppercase tracking-wider text-emerald-400">50% de la Membresía</span>
                    <span class="text-xl font-mono font-black text-white">125.00 Bs.</span>
                  </div>
                  <h4 class="text-base font-black text-white mb-2">Fondo de Formación, Liderazgo & Logística</h4>
                  <p class="text-xs text-slate-300 leading-relaxed mb-4">
                    Se divide rigurosamente en capacitación continua, materiales formativos y el bono de estímulo para los líderes de equipo:
                  </p>
                  <ul class="text-xs text-slate-300 space-y-2">
                    <li class="flex items-center justify-between bg-[#04110e] p-2 rounded-lg">
                      <span>• Talleres externos & seminarios (15%):</span>
                      <strong class="text-[#D4AF37] font-mono">37.50 Bs.</strong>
                    </li>
                    <li class="flex items-center justify-between bg-[#04110e] p-2 rounded-lg">
                      <span>• Cursos, certificaciones & materiales (10%):</span>
                      <strong class="text-[#D4AF37] font-mono">25.00 Bs.</strong>
                    </li>
                    <li class="flex items-center justify-between bg-[#04110e] p-2 rounded-lg">
                      <span>• Logística y refrigerios de formación (5%):</span>
                      <strong class="text-[#D4AF37] font-mono">12.50 Bs.</strong>
                    </li>
                    <li class="flex items-center justify-between bg-[#04110e] p-2 rounded-lg">
                      <span>• Incentivo a Líderes (Bono de Equipo) (20%):</span>
                      <strong class="text-emerald-400 font-mono font-bold">50.00 Bs.</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          {/if}

          <!-- CONTENIDO PESTAÑA 3: SIMULADOR Y REGLA DEL 80% LÍDERES -->
          {#if activeReglamentoTab === 'liderazgo'}
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 class="text-base font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                    <Users size={18} /> Capítulo V, Art. 3 y 4: Regla del 80% para Líderes de Equipo
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">
                    El líder cobra el 100% de su bono acumulado (50 Bs. × N° de agentes) solo si su equipo alcanza al menos el 80% de la meta mensual.
                  </p>
                </div>
                <span class="text-xs bg-[#071d18] px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-400 font-bold">
                  Mínimo 10 Agentes por Equipo
                </span>
              </div>

              <!-- SIMULADOR INTERACTIVO DE LA REGLA -->
              <div class="p-6 rounded-3xl bg-[#061612] border border-[#1d463d] shadow-xl">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  <!-- CONTROLES -->
                  <div class="lg:col-span-5 space-y-5">
                    <div>
                      <span class="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
                        Número de Agentes en tu Equipo (Min. 10)
                      </span>
                      <div class="grid grid-cols-4 gap-2">
                        {#each [10, 12, 15, 20] as num}
                          <button
                            type="button"
                            onclick={() => { simAgentesEquipo = num; }}
                            class="py-2 rounded-xl font-mono font-bold text-sm text-center border transition-all cursor-pointer {simAgentesEquipo === num ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md font-black' : 'bg-[#091f1a] text-slate-300 border-[#1d463d] hover:border-[#D4AF37]/50'}"
                          >
                            {num}
                          </button>
                        {/each}
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <label for="sim-puntos-range" class="text-xs font-black uppercase tracking-wider text-slate-400">
                          Puntos Logrados por el Equipo:
                        </label>
                        <span class="text-sm font-black text-white font-mono">{simPuntosLogrados} PTS</span>
                      </div>
                      <input
                        id="sim-puntos-range"
                        type="range"
                        min="200"
                        max={metaBasePuntos * 1.5}
                        step="10"
                        bind:value={simPuntosLogrados}
                        class="w-full accent-[#D4AF37] cursor-pointer"
                      />
                      <div class="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>Piso mínimo (80%): {minimoParaCobrarPuntos} PTS</span>
                        <span>Meta 100%: {metaBasePuntos} PTS</span>
                      </div>
                    </div>
                  </div>

                  <!-- RESULTADO EN TIEMPO REAL -->
                  <div class="lg:col-span-7 p-6 rounded-2xl bg-[#071d18] border-2 {calificaLider ? 'border-emerald-500/70' : 'border-amber-500/70'} space-y-4">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        {#if calificaLider}
                          <CheckCircle class="text-emerald-400" size={24} />
                          <span class="text-sm font-black text-emerald-400 uppercase tracking-wider">¡Alcanzó el Mínimo 80%! Califica para Cobro</span>
                        {:else}
                          <XCircle class="text-amber-400" size={24} />
                          <span class="text-sm font-black text-amber-400 uppercase tracking-wider">No Alcanzó el Piso del 80%</span>
                        {/if}
                      </div>
                      <span class="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-black/40 text-white">
                        {porcentajeMetaLogrado}% de Meta
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 pt-2">
                      <div class="p-3.5 rounded-xl bg-[#04110e] border border-[#163830]">
                        <span class="text-[10px] text-slate-400 uppercase font-bold block">Pago Líder (100%)</span>
                        <span class="text-2xl font-black {calificaLider ? 'text-[#D4AF37]' : 'text-slate-600'} font-mono">
                          Bs. {pagoEfectivoLiderBs}
                        </span>
                        <p class="text-[10px] text-slate-400 mt-1">
                          {calificaLider ? 'Cobro del 100% del fondo acumulado de 50 Bs./agente' : '0% - No califica este mes'}
                        </p>
                      </div>

                      <div class="p-3.5 rounded-xl bg-[#04110e] border border-[#163830]">
                        <span class="text-[10px] text-slate-400 uppercase font-bold block">Ahorro Institucional</span>
                        <span class="text-2xl font-black {!calificaLider ? 'text-amber-400' : 'text-slate-600'} font-mono">
                          Bs. {ahorroInstitucionalBs}
                        </span>
                        <p class="text-[10px] text-slate-400 mt-1">
                          {!calificaLider ? 'Permanece en caja para herramientas y convención anual' : '0 Bs. (Fondo liquidado al líder)'}
                        </p>
                      </div>
                    </div>

                    <p class="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-[#163830]">
                      <strong class="text-white">Artículo 4 (Nota de control):</strong> Si el equipo no alcanza el 80%, el fondo reservado de los 50 Bs. por agente <em>no se pierde ni afecta las tablas individuales de los agentes</em>. Permanece en caja de Casa Legal como ahorro de gestión destinado a compra de herramientas, convención anual y gastos institucionales de fin de año con rendición de cuentas anual.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          {/if}

          <!-- CONTENIDO PESTAÑA 4: CHECKLIST CAPTACIÓN CRM -->
          {#if activeReglamentoTab === 'captacion'}
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={18} /> Capítulo IV, Art. 1 y 2: Guía de Captación & Checklist Legal para CRM
                </h3>
                <span class="text-xs text-slate-400">Verificación documental previa a publicar</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <!-- 1. Identificación y Titularidad -->
                <div class="p-5 rounded-2xl bg-[#061612] border border-[#183d34] space-y-3">
                  <h4 class="font-black text-sm text-white flex items-center gap-2">
                    <FileText size={16} class="text-[#D4AF37]" /> 1. Titularidad y Derechos Reales
                  </h4>
                  <ul class="text-xs text-slate-300 space-y-2">
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Folio Real actualizado:</strong> Con antigüedad no mayor a 90 días.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Testimonio de Propiedad:</strong> O escritura pública de adquisición inscrita.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Cédulas de Identidad:</strong> De todos los propietarios vigentes.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Poder Notarial:</strong> Si la operación la realiza un apoderado legal.</span>
                    </li>
                  </ul>
                </div>

                <!-- 2. Documentos Técnicos y Catastrales -->
                <div class="p-5 rounded-2xl bg-[#061612] border border-[#183d34] space-y-3">
                  <h4 class="font-black text-sm text-white flex items-center gap-2">
                    <Building size={16} class="text-blue-400" /> 2. Técnicos y Municipales
                  </h4>
                  <ul class="text-xs text-slate-300 space-y-2">
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Plano aprobado por GAM:</strong> Plano de lote y construcción municipal.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Certificado Catastral:</strong> Registro y empadronamiento al día.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Impuestos y Servicios:</strong> Comprobantes de pago sin deudas pendientes.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Avalúo Catastral/Pericial:</strong> Precio de lista realista y justificado.</span>
                    </li>
                  </ul>
                </div>

                <!-- 3. Flujo CRM y Saneamiento -->
                <div class="p-5 rounded-2xl bg-[#061612] border border-[#183d34] space-y-3">
                  <h4 class="font-black text-sm text-white flex items-center gap-2">
                    <Sparkles size={16} class="text-emerald-400" /> 3. Registro en CRM y Legal
                  </h4>
                  <ul class="text-xs text-slate-300 space-y-2">
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-teal-400 shrink-0 mt-0.5" />
                      <span><strong>Gravámenes/Litigios:</strong> Si existen, derivar de inmediato al Área Legal para informe al propietario.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-teal-400 shrink-0 mt-0.5" />
                      <span><strong>Contrato de Servicios:</strong> Con o sin exclusividad, precio y comisión firmada.</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <CheckCircle2 size={14} class="text-teal-400 shrink-0 mt-0.5" />
                      <span><strong>Ficha Multimedia:</strong> Fotos HD, video recorrido, ubicación Google Maps.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          {/if}

          <!-- CONTENIDO PESTAÑA 5: RÉGIMEN DISCIPLINARIO -->
          {#if activeReglamentoTab === 'disciplina'}
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert size={18} /> Capítulo VI: Régimen Disciplinario Oficial
                </h3>
                <span class="text-xs text-slate-400">Gradación de faltas y sanciones institucionales</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <!-- FALTAS LEVES -->
                <div class="p-5 rounded-2xl bg-[#061612] border border-blue-500/40 space-y-3">
                  <span class="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase">
                    Artículo 2: Faltas Leves
                  </span>
                  <ul class="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li>Retrasos sin justificación a reuniones u oficina.</li>
                    <li>Falta ocasional de aseo o presentación formal inadecuada.</li>
                    <li>Uso indebido de equipos institucionales para asuntos personales.</li>
                  </ul>
                  <div class="pt-2 border-t border-blue-500/30 text-xs">
                    <strong class="text-blue-300">Sanción:</strong> Amonestación verbal o escrita archivada.
                  </div>
                </div>

                <!-- FALTAS GRAVES -->
                <div class="p-5 rounded-2xl bg-[#061612] border border-amber-500/50 space-y-3">
                  <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                    Artículo 3: Faltas Graves
                  </span>
                  <ul class="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li>Reiteración en faltas leves.</li>
                    <li>Falta de respeto a clientes, compañeros o colaboradores.</li>
                    <li>Ocultar información relevante sobre un inmueble u operación.</li>
                    <li>Hacer negocios particulares usando recursos o clientes de Casa Legal.</li>
                    <li>Mantener relaciones sentimentales extra laborales entre funcionarios.</li>
                  </ul>
                  <div class="pt-2 border-t border-amber-500/30 text-xs">
                    <strong class="text-amber-300">Sanción:</strong> Suspensión sin goce de comisiones o rescisión de contrato.
                  </div>
                </div>

                <!-- FALTAS MUY GRAVES -->
                <div class="p-5 rounded-2xl bg-[#061612] border border-rose-500/50 space-y-3">
                  <span class="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                    Artículo 4: Faltas Muy Graves
                  </span>
                  <ul class="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li>Apropiación de fondos, reservas, documentos o bienes.</li>
                    <li>Falsificación o adulteración de firmas o documentos.</li>
                    <li>Revelación de secretos comerciales o datos de clientes.</li>
                    <li>Competencia desleal directa contra la empresa.</li>
                    <li>Filtración de documentación que comprometa a la institución.</li>
                  </ul>
                  <div class="pt-2 border-t border-rose-500/30 text-xs">
                    <strong class="text-rose-400">Sanción:</strong> Despido inmediato sin previo aviso, sin comisiones y denuncia penal.
                  </div>
                </div>
              </div>
            </div>
          {/if}

          <!-- CONTENIDO PESTAÑA 6: CONDUCTA, ÉTICA & IMAGEN -->
          {#if activeReglamentoTab === 'conducta'}
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <Shield size={18} /> Capítulo III: Normas de Conducta, Imagen y Comunicación
                </h3>
                <span class="text-xs text-slate-400">Representación institucional de Casa Legal</span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-5 rounded-2xl bg-[#061612] border border-[#1b3d36] space-y-2">
                  <h4 class="font-black text-sm text-white">Imagen Personal & Credencial</h4>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    Vestir de manera formal y pulcra. Portar la credencial institucional de manera visible dentro y fuera de las instalaciones al actuar en representación de Casa Legal.
                  </p>
                </div>
                <div class="p-5 rounded-2xl bg-[#061612] border border-[#1b3d36] space-y-2">
                  <h4 class="font-black text-sm text-white">Manejo de Fondos y Transparencia</h4>
                  <p class="text-xs text-slate-300 leading-relaxed">
                    Queda terminantemente prohibido recibir dinero de clientes en cuentas personales. Todo anticipo, reserva o pago debe efectuarse en cuentas autorizadas de Casa Legal con comprobante oficial emitido por administración.
                  </p>
                </div>
              </div>
            </div>
          {/if}

        </div>
      </section>
    {/if}

    <!-- 3. GRID PRINCIPAL: RANGOS LIMPIOS + AUDITORÍA DE INMUEBLES + LEADERBOARD REAL -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- COLUMNA IZQUIERDA (2 COLS): TARJETAS DE NIVELES Y AUDITORÍA DE INMUEBLES -->
      <div class="lg:col-span-2 space-y-8">
        
        <!-- CARD: ESTRUCTURA DE RANGOS Y PUNTOS (Limpio sin descripciones innecesarias) -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-8 shadow-xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-extrabold text-white flex items-center gap-2.5">
                <Target size={22} class="text-[#D4AF37]" /> Escalafón de Rangos Casa Legal
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                Evoluciona de rango acumulando puntos por tus cierres y operaciones del mes.
              </p>
            </div>
            <span class="text-[11px] font-bold text-slate-400 bg-[#061411] px-3 py-1 rounded-full border border-[#1b3d36]">
              4 Niveles
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {#each tiers as tier, i}
              {@const isCurrent = i === currentTierIndex}
              {@const isUnlocked = i <= currentTierIndex}
              {@const TierCardIcon = tier.icon}
              <div
                class="rounded-2xl p-5 border-2 transition-all relative overflow-hidden flex flex-col justify-between {isCurrent
                  ? 'border-[#D4AF37] bg-gradient-to-br from-[#12382e] via-[#0c241f] to-[#071613] shadow-[0_0_25px_rgba(212,175,55,0.2)] ring-1 ring-[#D4AF37]/30 scale-[1.02]'
                  : isUnlocked
                  ? 'border-[#1b4339] bg-[#071613]'
                  : 'border-[#142e27] bg-[#05110e]/70 opacity-80'}"
              >
                <div>
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br {tier.colorGlow} shadow-md mb-3">
                    <TierCardIcon size={20} />
                  </div>
                  <h4 class="font-extrabold text-sm text-white leading-tight">{tier.name}</h4>
                  <span class="text-xs font-mono font-bold text-[#D4AF37] block mt-1">{tier.rango}</span>
                </div>

                <div class="mt-4 pt-3 border-t border-[#16362e] flex items-center justify-between">
                  {#if isCurrent}
                    <span class="text-[9px] font-black uppercase tracking-wider text-black bg-[#D4AF37] px-2 py-0.5 rounded-md animate-pulse">
                      Tu Nivel
                    </span>
                  {:else if isUnlocked}
                    <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Superado
                    </span>
                  {:else}
                    <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Lock size={11} /> Próximo
                    </span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- SECCIÓN: AUDITORÍA EN VIVO DE MIS CAPTACIONES Y CIERRES -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-8 shadow-xl">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-extrabold text-white flex items-center gap-2.5">
                  <Home size={22} class="text-emerald-400" /> Mis Captaciones & Cierres Auditados
                </h3>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black">
                  {myProperties.length} Inmuebles
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Cambia el estado de tus propiedades (Activo, Reservado, Vendido, Alquilado) para registrar tus puntos e incentivos en tiempo real.
              </p>
            </div>
            <a
              href="/inmuebles/nuevo"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Plus size={16} /> Subir Captación
            </a>
          </div>

          {#if myProperties.length === 0}
            <div class="p-8 rounded-2xl bg-[#061411] border border-dashed border-[#1e483f] text-center flex flex-col items-center justify-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-[#0e2c24] border border-[#23584d] flex items-center justify-center text-[#D4AF37]">
                <Home size={32} />
              </div>
              <div class="max-w-md">
                <h4 class="text-base font-black text-white mb-1">Aún no tienes captaciones este mes</h4>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Sube tu primer inmueble al CRM y suma puntos para subir de rango. Al cerrar ventas recibes <strong class="text-[#D4AF37]">+25 PTS (62.50 Bs.)</strong>, anticréticos <strong class="text-[#D4AF37]">+15 PTS (37.50 Bs.)</strong> o alquileres <strong class="text-[#D4AF37]">+10 PTS (25.00 Bs.)</strong>.
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
            <div class="space-y-4">
              {#each myProperties as prop}
                {@const prices = getDualPrice(prop.precioLista, prop.moneda)}
                <div class="p-4 rounded-2xl bg-[#061411] border border-[#173a32] hover:border-[#225549] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  <div class="flex items-center gap-4 min-w-0 flex-1">
                    <img
                      src={prop.fotoPrincipal || '/logoinmo.png'}
                      alt={prop.tituloPropiedad || 'Propiedad'}
                      class="w-16 h-16 rounded-xl object-cover border border-[#1b4339] shrink-0 bg-black/40"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border font-mono {prop.isCerrado
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : prop.estado === 'Reservado'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}">
                          {prop.estado || 'Activo'}
                        </span>
                        <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-casa-teal/20 text-casa-teal border border-casa-teal/30">
                          {prop.tipoOperacion || 'Venta'}
                        </span>
                        {#if prop.isExclusiva}
                          <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            Exclusiva (+10)
                          </span>
                        {/if}
                        {#if prop.isSaneada}
                          <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                            Saneada (+5)
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
                    <div class="flex items-center bg-[#0a201b] p-1 rounded-xl border border-[#1b4339]">
                      <button
                        type="button"
                        onclick={() => changePropertyStatus(prop.id, 'Activo')}
                        disabled={isUpdatingStatus[prop.id] || prop.estado === 'Activo'}
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer {prop.estado === 'Activo' || !prop.estado
                          ? 'bg-emerald-500 text-black shadow'
                          : 'text-slate-400 hover:text-white'}"
                        title="Marcar como Activo en Cartera"
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        onclick={() => changePropertyStatus(prop.id, 'Reservado')}
                        disabled={isUpdatingStatus[prop.id] || prop.estado === 'Reservado'}
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer {prop.estado === 'Reservado'
                          ? 'bg-amber-400 text-black shadow'
                          : 'text-slate-400 hover:text-white'}"
                        title="Marcar como Reservado"
                      >
                        Reservado
                      </button>
                      <button
                        type="button"
                        onclick={() => changePropertyStatus(prop.id, 'Vendido')}
                        disabled={isUpdatingStatus[prop.id] || prop.estado === 'Vendido'}
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer {prop.estado === 'Vendido'
                          ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black shadow font-black'
                          : 'text-[#D4AF37] hover:bg-[#D4AF37]/20'}"
                        title="Marcar como Vendido (+25 PTS)"
                      >
                        🎉 Vendido
                      </button>
                    </div>

                    <div class="text-right min-w-[75px]">
                      <span class="text-base font-black text-[#D4AF37] font-mono block leading-none">
                        +{prop.puntosInmueble} PTS
                      </span>
                      <span class="text-[10px] font-bold text-emerald-400 font-mono">
                        +{prop.premioEfectivoBs.toFixed(1)} Bs
                      </span>
                    </div>

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
                <Crown size={20} class="text-[#D4AF37]" /> Ranking Oficial
              </h3>
              <p class="text-[11px] text-slate-400">Puntos e incentivos según Reglamento</p>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider bg-[#061411] text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
              En Vivo
            </span>
          </div>

          {#if loading}
            <div class="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent"></div>
              <span class="text-xs">Auditando puntos en tiempo real...</span>
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

                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-xs text-white truncate">
                      {agent.nombre} {agent.isMe ? '(Tú)' : ''}
                    </p>
                    <p class="text-[10px] text-slate-400 truncate mt-0.5">
                      {agent.equipo} · <span class="text-[#D4AF37] font-semibold">{agent.tier}</span>
                    </p>
                  </div>

                  <div class="text-right shrink-0">
                    <p class="text-sm font-black text-[#D4AF37] font-mono leading-none">
                      {agent.pts} <span class="text-[9px] font-sans text-slate-400 font-bold">PTS</span>
                    </p>
                    <p class="text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                      Bs. {agent.gananciaBs.toFixed(0)}
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
                  <p class="text-[10px] text-emerald-400 font-mono font-bold">Bs. {bolsaGanadaBs.toFixed(0)}</p>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- PANEL DE IMPACTO EN EL NEGOCIO (MÉTRICAS REALES) -->
        <div class="bg-gradient-to-br from-[#0c241f] to-[#061411] border border-[#1b3d36] rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-base font-black text-white flex items-center gap-2">
              <TrendingUp size={18} class="text-emerald-400" /> Rendimiento de Actividad
            </h3>
            <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Auditado
            </span>
          </div>

          <div class="space-y-3.5">
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

            <div class="p-4 rounded-2xl bg-[#0a231d] border border-[#D4AF37]/30 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Ventas ({currentVentas}):</span>
                <strong class="text-emerald-400 font-mono">+{currentVentas * 25} pts ({currentVentas * 62.5} Bs)</strong>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Anticréticos ({currentAnticreticos}):</span>
                <strong class="text-[#D4AF37] font-mono">+{currentAnticreticos * 15} pts ({currentAnticreticos * 37.5} Bs)</strong>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Alquileres ({currentAlquileres}):</span>
                <strong class="text-blue-400 font-mono">+{currentAlquileres * 10} pts ({currentAlquileres * 25} Bs)</strong>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">Captaciones en Cartera ({captacionesCount}):</span>
                <strong class="text-slate-200 font-mono">+{(exclusivasCount * 10) + ((captacionesCount - exclusivasCount) * 5)} pts</strong>
              </div>
              <div class="pt-2 border-t border-[#1b3d36] flex items-center justify-between text-xs font-bold">
                <span class="text-white">Total Bolsa en Efectivo:</span>
                <span class="text-[#D4AF37] font-black font-mono">Bs. {bolsaGanadaBs.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</div>
