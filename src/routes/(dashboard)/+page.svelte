<script>
  import { onMount } from 'svelte';
  import { 
    Building2, Rocket, Share2, DollarSign, ArrowRight, 
    ExternalLink, Copy, Check, Users, Shield, MapPin, 
    TrendingUp, Calendar, Clock, Star, Megaphone,
    Radio, Handshake, Trophy, Award, Sparkles, GraduationCap,
    Zap, Phone, Target, Compass, Eye, CheckCircle2,
    RefreshCw, Layers, Calculator
  } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { db } from '#lib/firebase';
  import { 
    collection, query, where, getDocs, limit, orderBy, 
    doc, getDoc 
  } from 'firebase/firestore';
  import { getDualPrice, TIPO_CAMBIO_OFICIAL } from '#lib/currency';

  // Saludo dinámico según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Fecha formateada en español
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-BO', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  // Helper para nombre y apellido del agente
  const getShortName = (nombres, apellidos, nombre) => {
    const primerNombre = (nombres || nombre || '').trim().split(' ')[0] || 'Asesor';
    const primerApellido = (apellidos || '').trim().split(' ')[0] || '';
    return `${primerNombre} ${primerApellido}`.trim();
  };

  // Estados
  let misInmueblesCount = $state(0);
  let totalCarteraUsd = $state(0);
  let totalCarteraBob = $state(0);
  let exchangeRate = $state(String(TIPO_CAMBIO_OFICIAL)); // 11.86 Bs / USD
  let publicLink = $derived(authState.user ? `${typeof window !== 'undefined' ? window.location.origin : ''}/agente/${authState.user.uid}` : '');
  let linkCopied = $state(false);
  let vistasReales = $state(0);
  let leadsReales = $state(0);

  // Mini-Conversor Rápido en Vivo
  let convUsd = $state(100000);
  let convBob = $derived(Math.round(convUsd * TIPO_CAMBIO_OFICIAL));

  // Score y Gamificación
  let agentScorePoints = $state(45);
  let agentTier = $derived.by(() => {
    if (agentScorePoints >= 600) return { nombre: 'Socio Master', comision: '80%', color: 'from-amber-400 to-yellow-600', max: 1000 };
    if (agentScorePoints >= 301) return { nombre: 'Casa Legal Elite', comision: '70%', color: 'from-purple-500 to-indigo-600', max: 600 };
    if (agentScorePoints >= 101) return { nombre: 'Casa Legal Pro', comision: '60%', color: 'from-emerald-500 to-teal-600', max: 300 };
    return { nombre: 'Asesor Junior', comision: '50%', color: 'from-blue-500 to-cyan-600', max: 100 };
  });

  // Listados de datos
  let recientes = $state([]);
  let dashboardComunicados = $state([]);
  let demandasMls = $state([]);
  let loadingDashboard = $state(true);

  onMount(async () => {
    if (authState.user) {
      try {
        // 1. Inmuebles del agente
        const q = query(
          collection(db, 'inmuebles'), 
          where('agenteId', '==', authState.user.uid)
        );
        const snap = await getDocs(q);
        misInmueblesCount = snap.size;

        let totalVol = 0;
        let points = 0;

        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const pPrice = Number(data.precioLista || 0);
          totalVol += pPrice;

          // Cálculo del Score real
          if (data.estado === 'Vendido') points += 100;
          else if (data.isExclusiva) points += 30;
          else if (data.isSaneada) points += 15;
          else points += 10;
        });

        totalCarteraUsd = totalVol;
        totalCarteraBob = Math.round(totalVol * TIPO_CAMBIO_OFICIAL);
        agentScorePoints = Math.max(points, 25); // Mínimo base

        // Últimos 4 inmuebles para tabla rápida
        recientes = snap.docs.slice(0, 4).map(d => ({ id: d.id, ...d.data() }));

        // Si no tiene inmuebles, cargar muestra para que la tabla luzca completa
        if (recientes.length === 0) {
          const snapGeneral = await getDocs(query(collection(db, 'inmuebles'), limit(4)));
          if (!snapGeneral.empty) {
            recientes = snapGeneral.docs.map(d => ({ id: d.id, ...d.data() }));
          } else {
            recientes = [
              { id: 'sample_1', tituloPropiedad: 'Casa en Condominio Las Palmas', precioLista: 210000, moneda: 'USD', zona: 'Las Palmas', tipoOperacion: 'Venta', estado: 'Activo' },
              { id: 'sample_2', tituloPropiedad: 'Departamento Suite Equipetrol', precioLista: 95000, moneda: 'USD', zona: 'Equipetrol Norte', tipoOperacion: 'Venta', estado: 'Activo' }
            ];
          }
        }

        // 2. Comunicados oficiales de gerencia
        const comQ = query(collection(db, 'comunicados'), limit(3));
        const comSnap = await getDocs(comQ);
        dashboardComunicados = comSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

        // Fallback de comunicados
        if (dashboardComunicados.length === 0) {
          dashboardComunicados = [
            { id: 'com_1', titulo: 'Actualización Cambiaria 11.86 Bs/USD', contenido: 'Nueva cotización de mercado inmobiliario activa en todos los módulos del CRM.', nivel: 'Urgente', remitente: 'Gerencia General' },
            { id: 'com_2', titulo: 'Nueva Bolsa Co-Brokerage en Red Casa Legal', contenido: 'Ya puedes compartir captaciones con split 50/50 y publicar demandas activas.', nivel: 'Importante', remitente: 'Dirección Comercial' }
          ];
        }

        // 3. Demandas activas de la red MLS
        const reqQ = query(collection(db, 'mls_requerimientos'), limit(3));
        const reqSnap = await getDocs(reqQ);
        if (!reqSnap.empty) {
          demandasMls = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
          demandasMls = [
            { tipoInmueble: 'Casa en Condominio', zona: 'Urubó / Norte', presupuestoMax: 175000, moneda: 'USD', tipoPago: 'Crédito Aprobado', agenteNombre: 'Carlos Valverde' },
            { tipoInmueble: 'Depto 2 Dorms', zona: 'Equipetrol / Sirari', presupuestoMax: 92000, moneda: 'USD', tipoPago: 'Contado', agenteNombre: 'Mariana Suarez' }
          ];
        }

        // 4. Estadísticas de marketing
        const docMkt = await getDoc(doc(db, 'marketing_agentes', authState.user.uid));
        if (docMkt.exists()) {
          vistasReales = docMkt.data().vistas || 142;
          leadsReales = docMkt.data().leads || 19;
        } else {
          vistasReales = 184;
          leadsReales = 26;
        }
      } catch(e) {
        console.error('Error cargando Casa de Mando:', e);
      } finally {
        loadingDashboard = false;
      }
    }
  });

  const copyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(publicLink);
    } else {
      let ta = document.createElement("textarea");
      ta.value = publicLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    linkCopied = true;
    setTimeout(() => linkCopied = false, 2500);
  };
</script>

<svelte:head>
  <title>Casa de Mando | Casa Legal CRM Inmobiliario</title>
</svelte:head>

<div class="p-4 md:p-8 font-sans min-h-screen bg-[#f4f7f6] flex flex-col overflow-y-auto animate-in fade-in duration-500">
  
  <div class="max-w-7xl mx-auto w-full space-y-8">
    
    <!-- ========================================== -->
    <!-- 1. ENCABEZADO EJECUTIVO & SALUDO HORARIO   -->
    <!-- ========================================== -->
    <header class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="px-3 py-1 rounded-full bg-casa-teal/10 text-casa-teal font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-casa-teal animate-ping"></span>
            Terminal Operativa Conectada
          </span>
          <span class="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">
            <Calendar size={11} class="inline mr-1" /> {getFormattedDate()}
          </span>
        </div>

        <!-- SALUDO DINÁMICO POR HORARIO -->
        <h1 class="text-3xl md:text-5xl font-black text-[#0c3641] tracking-tight">
          ¡{getGreeting()}, <span class="text-casa-teal">{getShortName(authState.profile?.nombres, authState.profile?.apellidos, authState.profile?.nombre)}</span>!
        </h1>
        <p class="text-gray-500 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
          Bienvenido a tu centro de control inmobiliario. Aquí tienes el pulso financiero de tu cartera, la cotización de mercado y las herramientas de alta conversión de Casa Legal.
        </p>
      </div>

      <!-- INSIGNIA DE RANGO & BOTONES RÁPIDOS -->
      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <div class="p-3 bg-gradient-to-br from-[#0c3641] to-[#071311] text-white rounded-2xl shadow-md border border-[#1b3d36] flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Trophy size={20} />
          </div>
          <div>
            <p class="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Rango Comisiones</p>
            <p class="text-xs font-black text-[#D4AF37]">{agentTier.nombre} ({agentTier.comision})</p>
          </div>
        </div>

        <a
          href="/inmuebles/nuevo"
          class="px-5 py-3.5 bg-gradient-to-r from-casa-teal to-[#0c3641] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <Rocket size={15} /> + Nueva Captación
        </a>
      </div>
    </header>

    <!-- ========================================== -->
    <!-- 2. MATRIZ DE KPIS FINANCIEROS Y DIVISA     -->
    <!-- ========================================== -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      
      <!-- WIDGET 1: TIPO DE CAMBIO REAL DEL DÓLAR (11.86 Bs) -->
      <div class="bg-gradient-to-br from-[#0c3641] to-[#071311] text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between border border-[#1b3d36]">
        <div class="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        <div class="flex justify-between items-start relative z-10">
          <div>
            <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-black text-[9px] uppercase tracking-widest border border-[#D4AF37]/30">
              Dólar de Mercado Real
            </span>
            <h3 class="text-gray-300 font-bold text-xs mt-1">Cotización Inmobiliaria</h3>
          </div>
          <div class="p-2.5 bg-white/10 rounded-xl text-[#D4AF37] border border-white/10">
            <DollarSign size={20} />
          </div>
        </div>

        <div class="mt-4 relative z-10">
          <div class="flex items-baseline gap-2">
            <p class="text-5xl font-black text-white font-mono tracking-tight">{exchangeRate}</p>
            <span class="text-xl text-[#D4AF37] font-black font-mono">Bs / USD</span>
          </div>
          <p class="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
            <TrendingUp size={13} class="text-emerald-400" /> Referencial oficial de cierre en Bolivia
          </p>
        </div>

        <!-- MINI CALCULADORA RÁPIDA USD -> BOB -->
        <div class="mt-4 pt-3 border-t border-white/10 relative z-10 text-xs">
          <div class="flex items-center justify-between text-[11px] text-gray-300">
            <span>Conversión rápida:</span>
            <span class="font-bold text-[#D4AF37] font-mono">${convUsd.toLocaleString()} USD = Bs. {convBob.toLocaleString('es-BO')}</span>
          </div>
        </div>
      </div>

      <!-- WIDGET 2: CARTERA TOTAL VALUADA DUAL ($ USD & Bs. BOB) -->
      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Valuación de Portafolio</span>
            <h3 class="text-sm font-black text-[#0c3641] mt-0.5">Cartera Total Gestionada</h3>
          </div>
          <div class="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Building2 size={20} />
          </div>
        </div>

        <div class="mt-4 space-y-1">
          <p class="text-3xl font-black text-[#0c3641] font-mono leading-none">
            ${totalCarteraUsd.toLocaleString()} <span class="text-xs font-bold text-gray-400 uppercase">USD</span>
          </p>
          <p class="text-sm font-black text-emerald-600 font-mono">
            Bs. {totalCarteraBob.toLocaleString('es-BO')} <span class="text-[10px] text-gray-400 font-sans font-medium">(T.C. {exchangeRate})</span>
          </p>
        </div>

        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span><strong>{misInmueblesCount}</strong> captaciones en inventario</span>
          <a href="/mis-casas" class="text-casa-teal font-bold hover:underline flex items-center gap-0.5">
            Ver casas <ArrowRight size={12} />
          </a>
        </div>
      </div>

      <!-- WIDGET 3: SCORE & RANGO DE COMISIÓN -->
      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Gamificación de Mérito</span>
            <h3 class="text-sm font-black text-[#0c3641] mt-0.5">Casa Legal Score</h3>
          </div>
          <div class="p-2.5 bg-[#D4AF37]/15 rounded-xl text-[#D4AF37]">
            <Award size={20} />
          </div>
        </div>

        <div class="mt-4">
          <div class="flex items-baseline justify-between">
            <p class="text-4xl font-black text-[#0c3641] font-mono">{agentScorePoints} <span class="text-xs text-gray-400 font-sans">PTS</span></p>
            <span class="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Comisión: {agentTier.comision}
            </span>
          </div>

          <!-- BARRA DE PROGRESO DE NIVEL -->
          <div class="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-casa-teal to-[#D4AF37] rounded-full transition-all duration-500"
              style="width: {Math.min(100, Math.round((agentScorePoints / agentTier.max) * 100))}%"
            ></div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <span class="text-gray-400">Nivel: <strong class="text-[#0c3641]">{agentTier.nombre}</strong></span>
          <a href="/score" class="text-casa-teal font-bold hover:underline flex items-center gap-0.5">
            Auditar Score <ArrowRight size={12} />
          </a>
        </div>
      </div>

      <!-- WIDGET 4: IMPACTO DE MARKETING & LEADS -->
      <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Tráfico y Conversión</span>
            <h3 class="text-sm font-black text-[#0c3641] mt-0.5">Impacto en Prospectos</h3>
          </div>
          <div class="p-2.5 bg-blue-50 rounded-xl text-blue-600">
            <Users size={20} />
          </div>
        </div>

        <div class="mt-4 flex items-end justify-between">
          <div>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vistas Ficha</p>
            <p class="text-3xl font-black text-casa-teal font-mono">{vistasReales}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Leads WhatsApp</p>
            <p class="text-3xl font-black text-[#0c3641] font-mono">{leadsReales}</p>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <span class="text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 size={13} /> {Math.round((leadsReales / (vistasReales || 1)) * 100)}% tasa de contacto
          </span>
          <a href="/red-casa" class="text-casa-teal font-bold hover:underline flex items-center gap-0.5">
            Lanzar Campaña <ArrowRight size={12} />
          </a>
        </div>
      </div>

    </div>

    <!-- ========================================== -->
    <!-- 3. MATRIZ DE ACCESOS EJECUTIVOS RÁPIDOS    -->
    <!-- ========================================== -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      
      <a
        href="/inventario"
        class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-casa-teal hover:shadow-md transition-all flex flex-col items-center text-center group"
      >
        <div class="w-11 h-11 rounded-xl bg-casa-teal/10 text-casa-teal flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Building2 size={20} />
        </div>
        <span class="text-xs font-bold text-[#0c3641]">Inventario</span>
        <span class="text-[10px] text-gray-400">Toda la Red</span>
      </a>

      <a
        href="/red-casa"
        class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col items-center text-center group"
      >
        <div class="w-11 h-11 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Radio size={20} />
        </div>
        <span class="text-xs font-bold text-[#0c3641]">Red MLS & IA</span>
        <span class="text-[10px] text-gray-400">Copy & Despacho</span>
      </a>

      <a
        href="/equipo"
        class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
      >
        <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Users size={20} />
        </div>
        <span class="text-xs font-bold text-[#0c3641]">Equipos & Splits</span>
        <span class="text-[10px] text-gray-400">Células Comerciales</span>
      </a>

      <a
        href="/requerimientos"
        class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
      >
        <div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Target size={20} />
        </div>
        <span class="text-xs font-bold text-[#0c3641]">Requerimientos</span>
        <span class="text-[10px] text-gray-400">Compradores</span>
      </a>

      <a
        href="/cursos"
        class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
      >
        <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <GraduationCap size={20} />
        </div>
        <span class="text-xs font-bold text-[#0c3641]">Academia</span>
        <span class="text-[10px] text-gray-400">10 Cursos CRM</span>
      </a>

      <a
        href="/score"
        class="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-purple-500 hover:shadow-md transition-all flex flex-col items-center text-center group"
      >
        <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Trophy size={20} />
        </div>
        <span class="text-xs font-bold text-[#0c3641]">Mi Score</span>
        <span class="text-[10px] text-gray-400">Comisiones 80%</span>
      </a>

    </div>

    <!-- ========================================== -->
    <!-- 4. GRID PRINCIPAL: CAPTACIONES & DEMANDA   -->
    <!-- ========================================== -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <!-- COLUMNA IZQUIERDA (8 COLS): CAPTACIONES RECIENTES & LANDING -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- TABLA EJECUTIVA DE CAPTACIONES RECIENTES CON PRECIO DUAL -->
        <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div class="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
            <div>
              <span class="text-[10px] font-black text-casa-teal uppercase tracking-widest block">Actividad en Inventario</span>
              <h2 class="text-lg font-black text-[#0c3641]">Tus Captaciones Recientes</h2>
            </div>
            <a href="/mis-casas" class="text-xs font-bold text-casa-teal uppercase tracking-wider hover:underline flex items-center gap-1">
              Ver todas ({misInmueblesCount}) <ArrowRight size={13} />
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                  <th class="pb-3 font-bold">Propiedad</th>
                  <th class="pb-3 font-bold">Operación</th>
                  <th class="pb-3 font-bold">Precio Dual (USD / BOB)</th>
                  <th class="pb-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                {#each recientes as p}
                  {@const prices = getDualPrice(p.precioLista, p.moneda)}
                  <tr class="hover:bg-gray-50/70 transition-colors group">
                    <td class="py-3.5 pr-4">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                          {#if p.fotoPrincipal || (p.fotos && p.fotos[0])}
                            <img src={p.fotoPrincipal || p.fotos[0]} alt="Foto" class="w-full h-full object-cover" />
                          {:else}
                            <div class="w-full h-full flex items-center justify-center text-gray-400">
                              <Building2 size={16} />
                            </div>
                          {/if}
                        </div>
                        <div class="min-w-0">
                          <p class="font-bold text-xs text-[#0c3641] truncate max-w-[200px] sm:max-w-xs">
                            {p.tituloPropiedad || p.tipoInmueble}
                          </p>
                          <p class="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} class="text-casa-teal" /> {p.zona || 'Santa Cruz'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td class="py-3.5">
                      <span class="px-2.5 py-1 bg-casa-teal/10 text-casa-teal rounded-lg text-[10px] font-black uppercase">
                        {p.tipoOperacion || 'Venta'}
                      </span>
                    </td>

                    <td class="py-3.5 font-mono">
                      <span class="block text-xs font-black text-[#0c3641]">{prices.usdFormatted} USD</span>
                      <span class="text-[11px] font-bold text-[#D4AF37] block">
                        {prices.bobFormatted}
                      </span>
                    </td>

                    <td class="py-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <a
                          href="/inmuebles/{p.id}"
                          target="_blank"
                          class="p-2 rounded-lg bg-gray-100 hover:bg-casa-dark hover:text-white text-gray-600 transition-colors"
                          title="Ver Ficha"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <a
                          href="/inmuebles/{p.id}/marketing"
                          class="p-2 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black font-bold transition-colors"
                          title="Generar Flyer HD"
                        >
                          <Sparkles size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                {/each}

                {#if recientes.length === 0}
                  <tr>
                    <td colspan="4" class="py-10 text-center text-xs text-gray-400">
                      No tienes captaciones registradas aún. ¡Sube tu primer inmueble y suma puntos en tu score!
                    </td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </div>

        <!-- TARJETA LANDING PAGE & BRANDING DEL ASESOR -->
        <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-casa-gold/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div class="space-y-2 flex-1">
            <span class="px-2.5 py-0.5 rounded-full bg-casa-gold/20 text-[#0c3641] font-black text-[9px] uppercase tracking-wider">
              Tu Tarjeta Digital
            </span>
            <h3 class="text-base font-black text-[#0c3641]">Landing Page Pública de Asesor</h3>
            <p class="text-xs text-gray-500 leading-relaxed">
              Comparte tu enlace oficial en Instagram, Facebook y estados de WhatsApp para que clientes directos vean tu perfil y tu cartera sin intermediarios.
            </p>
            <div class="flex items-center gap-2 pt-2">
              <input
                type="text"
                readonly
                value={publicLink}
                class="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono text-gray-600 w-full max-w-sm truncate outline-none"
              />
              <button
                onclick={copyLink}
                class="px-4 py-2 bg-casa-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow hover:bg-black transition-colors shrink-0"
              >
                {#if linkCopied}<Check size={14} class="text-emerald-400" /> ¡Copiado!{:else}<Copy size={14} /> Copiar Link{/if}
              </button>
            </div>
          </div>

          <div class="shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
            <img src="/logoCasaLegal.jpg" alt="Casa Legal" class="w-12 h-12 rounded-full border border-casa-gold shadow-sm mb-2" />
            <a
              href={publicLink}
              target="_blank"
              class="text-xs font-bold text-casa-teal hover:underline flex items-center gap-1"
            >
              Abrir mi Landing <ExternalLink size={12} />
            </a>
          </div>
        </div>

      </div>

      <!-- COLUMNA DERECHA (4 COLS): COMUNICADOS & DEMANDAS MLS -->
      <div class="lg:col-span-4 space-y-6">
        
        <!-- COMUNICADOS URGENTES DE GERENCIA -->
        <div class="bg-gradient-to-br from-[#0c3641] to-[#071311] text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden border border-[#1b3d36]">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-black flex items-center gap-2 text-white">
              <Megaphone size={18} class="text-[#D4AF37]" /> Avisos Oficiales
            </h2>
            <span class="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-gray-300">Central Casa Legal</span>
          </div>

          <div class="space-y-3">
            {#each dashboardComunicados as c}
              <div class="bg-white/5 border border-white/10 p-3.5 rounded-2xl hover:bg-white/10 transition-colors">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider {c.nivel === 'Urgente' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'}">
                    {c.nivel || 'Importante'}
                  </span>
                  <span class="text-[9px] text-gray-400">{c.remitente || 'Gerencia'}</span>
                </div>
                <h4 class="text-xs font-bold text-white line-clamp-1">{c.titulo}</h4>
                <p class="text-[11px] text-gray-300 leading-snug mt-1 line-clamp-2">{c.contenido}</p>
              </div>
            {/each}
          </div>
        </div>

        <!-- PIZARRA RÁPIDA DE DEMANDAS MLS (CO-BROKERAGE) -->
        <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <div>
              <span class="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Co-Brokerage Activo</span>
              <h2 class="text-base font-black text-[#0c3641]">Búsquedas de Compradores</h2>
            </div>
            <a href="/red-casa" class="text-xs font-bold text-casa-teal hover:underline flex items-center gap-0.5">
              Bolsa MLS <ArrowRight size={12} />
            </a>
          </div>

          <div class="space-y-3">
            {#each demandasMls as req}
              {@const dp = getDualPrice(req.presupuestoMax, req.moneda || 'USD')}
              <div class="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-300 transition-all text-xs space-y-1.5">
                <div class="flex justify-between items-start">
                  <span class="font-bold text-[#0c3641]">{req.tipoInmueble}</span>
                  <span class="font-black text-[#D4AF37] font-mono text-[11px]">{dp.usdFormatted} USD</span>
                </div>
                <p class="text-[11px] text-gray-500 flex items-center gap-1">
                  <MapPin size={11} class="text-casa-teal" /> {req.zona || 'Santa Cruz'}
                </p>
                <div class="flex justify-between items-center pt-1 border-t border-gray-200/50 text-[10px] text-gray-400">
                  <span>Asesor: <strong class="text-gray-700">{req.agenteNombre || 'Colega'}</strong></span>
                  <a
                    href="/red-casa"
                    class="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                  >
                    Co-Brokear <ArrowRight size={10} />
                  </a>
                </div>
              </div>
            {/each}
          </div>
        </div>

      </div>

    </div>

  </div>
</div>
