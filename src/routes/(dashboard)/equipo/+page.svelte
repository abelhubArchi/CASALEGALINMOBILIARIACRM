<script>
  import { onMount, onDestroy } from 'svelte';
  import {
    Shield,
    Plus,
    Search,
    User,
    Users,
    Star,
    ArrowRight,
    Loader2,
    Image as ImageIcon,
    CheckCircle,
    Clock,
    Building2,
    MessageSquare,
    Send,
    X,
    Trophy,
    Target,
    TrendingUp,
    DollarSign,
    Calculator,
    Award,
    Sparkles,
    Check,
    Crown,
    ExternalLink,
    Megaphone,
    Share2,
    Flame,
    Home,
    Briefcase,
    Zap,
    Lock
  } from 'lucide-svelte';
  import { db, storage } from '#lib/firebase';
  import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    onSnapshot,
    orderBy
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { authState } from '#lib/authStore.svelte.js';
  import { getDualPrice, TIPO_CAMBIO_OFICIAL } from '#lib/currency';

  // Estados generales
  let loading = $state(true);
  let equipos = $state([]);
  let searchQuery = $state('');

  // Pestañas principales
  // Si tiene equipo: 'dashboard' (KPIs y Visión), 'miembros', 'pool' (inmuebles), 'splits', 'chat', 'solicitudes', 'explorar'
  let activeTab = $state('dashboard');

  // Estado de Mi Equipo
  let myTeamId = $derived(authState.profile?.equipoId || null);
  let myTeamData = $state(null);
  let isTeamLeader = $derived(
    Boolean(myTeamData && authState.user && myTeamData.liderId === authState.user.uid)
  );

  let miembrosEquipo = $state([]);
  let propiedadesEquipo = $state([]);
  let solicitudesPendientes = $state([]);
  let chatMessages = $state([]);
  let newMessage = $state('');

  // Mis inmuebles para compartir al pool del equipo
  let misInmuebles = $state([]);
  let showAddPropiedadModal = $state(false);

  // Modal para Crear Equipo
  let showCreateModal = $state(false);
  let nombreEquipo = $state('');
  let descripcionEquipo = $state('');
  let lemaEquipo = $state('');
  let metaMensual = $state('300000');
  let logoFile = $state(null);
  let logoPreview = $state('');
  let isSavingTeam = $state(false);

  // Calculadora de Splits interna
  let splitSimulatorVenta = $state(150000);
  let splitPorcentajeComision = $state(5); // 5% de comisión estándar
  let splitAgente = $state(70); // 70% agente
  let splitEquipo = $state(20); // 20% fondo del equipo
  let splitLider = $state(10); // 10% override líder

  // Toast
  let toastMsg = $state(null);
  const showToast = (msg) => {
    toastMsg = msg;
    setTimeout(() => {
      toastMsg = null;
    }, 4000);
  };

  // Suscripción al chat
  let unsubChat = null;

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

  // Cargar lista de todos los equipos
  const fetchEquipos = async () => {
    try {
      const snap = await getDocs(collection(db, 'equipos'));
      equipos = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.ventas || 0) - (a.ventas || 0) || (b.miembros || 0) - (a.miembros || 0));
    } catch (e) {
      console.error('Error fetching equipos:', e);
    }
  };

  // Cargar detalles de mi equipo
  const fetchMyTeam = async () => {
    if (!myTeamId) return;
    try {
      const docSnap = await getDoc(doc(db, 'equipos', myTeamId));
      if (docSnap.exists()) {
        myTeamData = { id: docSnap.id, ...docSnap.data() };
        splitAgente = myTeamData.splitAgente || 70;
        splitEquipo = myTeamData.splitEquipo || 20;
        splitLider = myTeamData.splitLider || 10;

        // 1. Cargar Miembros reales
        const mQ = query(collection(db, 'usuarios'), where('equipoId', '==', myTeamId));
        const mSnap = await getDocs(mQ);
        miembrosEquipo = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 2. Cargar Propiedades compartidas con el equipo
        const pQ = query(collection(db, 'inmuebles'), where('equipoId', '==', myTeamId));
        const pSnap = await getDocs(pQ);
        propiedadesEquipo = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 3. Solicitudes pendientes si es líder
        if (myTeamData.liderId === authState.user?.uid) {
          const reqQ = query(
            collection(db, 'equipo_solicitudes'),
            where('equipoId', '==', myTeamId),
            where('status', '==', 'pendiente')
          );
          const reqSnap = await getDocs(reqQ);
          solicitudesPendientes = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        // 4. Suscripción en tiempo real al chat del equipo
        if (unsubChat) unsubChat();
        const chatQ = query(
          collection(db, 'equipos', myTeamId, 'chat'),
          orderBy('createdAt', 'asc')
        );
        unsubChat = onSnapshot(chatQ, (snap) => {
          chatMessages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setTimeout(() => {
            const chatBox = document.getElementById('teamChatBox');
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
          }, 100);
        });
      }
    } catch (e) {
      console.error('Error fetching my team:', e);
    }
  };

  // Cargar mis inmuebles para poder compartirlos al pool
  const loadMisInmuebles = async () => {
    if (!authState.user) return;
    try {
      const q = query(collection(db, 'inmuebles'), where('agenteId', '==', authState.user.uid));
      const snap = await getDocs(q);
      misInmuebles = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      showAddPropiedadModal = true;
    } catch (e) {
      console.error(e);
    }
  };

  // Compartir propiedad con el equipo
  const compartirPropiedad = async (propId) => {
    if (!myTeamData?.id) return;
    try {
      await updateDoc(doc(db, 'inmuebles', propId), {
        equipoId: myTeamData.id,
        equipoNombre: myTeamData.nombre
      });
      showAddPropiedadModal = false;
      await fetchMyTeam();
      showToast('¡Inmueble añadido exitosamente al Pool Compartido del equipo!');
    } catch (e) {
      console.error(e);
      alert('Error al compartir propiedad: ' + e.message);
    }
  };

  // Retirar propiedad del pool del equipo
  const retirarPropiedad = async (propId) => {
    if (!confirm('¿Deseas retirar esta propiedad del inventario del equipo?')) return;
    try {
      await updateDoc(doc(db, 'inmuebles', propId), {
        equipoId: null,
        equipoNombre: null
      });
      await fetchMyTeam();
      showToast('Propiedad retirada del pool del equipo.');
    } catch (e) {
      console.error(e);
    }
  };

  // Enviar mensaje al chat del equipo
  const enviarMensaje = async () => {
    if (!newMessage.trim() || !myTeamData?.id) return;
    try {
      const text = newMessage.trim();
      newMessage = '';
      await addDoc(collection(db, 'equipos', myTeamData.id, 'chat'), {
        texto: text,
        autorId: authState.user.uid,
        autorNombre: getShortName(
          authState.profile?.nombres,
          authState.profile?.apellidos,
          authState.profile?.nombre
        ),
        autorFoto: authState.profile?.documentos?.foto || null,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Subir logo al crear equipo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      logoFile = file;
      logoPreview = URL.createObjectURL(file);
    }
  };

  // Crear nuevo equipo
  const crearEquipo = async () => {
    if (!nombreEquipo.trim()) {
      alert('Por favor ingresa un nombre para el equipo.');
      return;
    }
    isSavingTeam = true;
    try {
      let logoUrl = null;
      if (logoFile) {
        const fileRef = ref(storage, `equipos/${authState.user.uid}_${Date.now()}`);
        const snap = await uploadBytes(fileRef, logoFile);
        logoUrl = await getDownloadURL(snap.ref);
      }

      const liderNombre = getShortName(
        authState.profile?.nombres,
        authState.profile?.apellidos,
        authState.profile?.nombre
      );

      const docRef = await addDoc(collection(db, 'equipos'), {
        nombre: nombreEquipo.trim(),
        descripcion: descripcionEquipo.trim(),
        lema: lemaEquipo.trim() || 'Excelencia y Liderazgo Inmobiliario',
        metaMensualUsd: Number(metaMensual) || 300000,
        liderId: authState.user.uid,
        liderNombre: liderNombre,
        liderFoto: authState.profile?.documentos?.foto || null,
        logo: logoUrl,
        miembros: 1,
        ventas: 0,
        splitAgente: 70,
        splitEquipo: 20,
        splitLider: 10,
        createdAt: serverTimestamp()
      });

      // Actualizar perfil del usuario como Líder
      await updateDoc(doc(db, 'usuarios', authState.user.uid), {
        equipoId: docRef.id,
        equipoNombre: nombreEquipo.trim(),
        rolEquipo: 'Team Leader'
      });

      if (authState.profile) {
        authState.profile.equipoId = docRef.id;
        authState.profile.equipoNombre = nombreEquipo.trim();
        authState.profile.rolEquipo = 'Team Leader';
      }

      showCreateModal = false;
      nombreEquipo = '';
      descripcionEquipo = '';
      lemaEquipo = '';
      logoFile = null;
      logoPreview = '';

      showToast(`¡Felicitaciones! Has fundado el equipo "${nombreEquipo}" y eres el Team Leader.`);
      await fetchEquipos();
      await fetchMyTeam();
      activeTab = 'dashboard';
    } catch (e) {
      console.error(e);
      alert('Error creando equipo: ' + e.message);
    } finally {
      isSavingTeam = false;
    }
  };

  // Solicitar unirse a un equipo
  const solicitarUnirse = async (eq) => {
    if (confirm(`¿Deseas enviar una solicitud de ingreso al equipo "${eq.nombre}"?`)) {
      try {
        const userName = getShortName(
          authState.profile?.nombres,
          authState.profile?.apellidos,
          authState.profile?.nombre
        );

        await addDoc(collection(db, 'equipo_solicitudes'), {
          equipoId: eq.id,
          equipoNombre: eq.nombre,
          userId: authState.user.uid,
          userName: userName,
          userFoto: authState.profile?.documentos?.foto || null,
          userEmail: authState.user.email,
          status: 'pendiente',
          createdAt: serverTimestamp()
        });
        showToast(`Solicitud enviada a ${eq.liderNombre}. Espera la confirmación del líder.`);
      } catch (e) {
        console.error(e);
        alert('Error enviando solicitud.');
      }
    }
  };

  // Aceptar solicitud de ingreso (Líder)
  const aceptarSolicitud = async (solicitud) => {
    try {
      await updateDoc(doc(db, 'equipo_solicitudes', solicitud.id), { status: 'aprobado' });
      await updateDoc(doc(db, 'usuarios', solicitud.userId), {
        equipoId: myTeamData.id,
        equipoNombre: myTeamData.nombre,
        rolEquipo: 'Asociado Comercial'
      });
      await updateDoc(doc(db, 'equipos', myTeamData.id), {
        miembros: (myTeamData.miembros || 1) + 1
      });
      showToast(`¡Has aceptado a ${solicitud.userName} en el equipo!`);
      await fetchMyTeam();
    } catch (e) {
      console.error(e);
      alert('Error al aceptar solicitud.');
    }
  };

  // Rechazar solicitud de ingreso (Líder)
  const rechazarSolicitud = async (solicitud) => {
    try {
      await updateDoc(doc(db, 'equipo_solicitudes', solicitud.id), { status: 'rechazado' });
      solicitudesPendientes = solicitudesPendientes.filter((s) => s.id !== solicitud.id);
      showToast('Solicitud rechazada.');
    } catch (e) {
      console.error(e);
    }
  };

  // Salir del equipo (para miembros)
  const salirDelEquipo = async () => {
    if (!confirm('¿Estás seguro de salir de este equipo?')) return;
    try {
      await updateDoc(doc(db, 'usuarios', authState.user.uid), {
        equipoId: null,
        equipoNombre: null,
        rolEquipo: null
      });
      if (myTeamData?.id) {
        await updateDoc(doc(db, 'equipos', myTeamData.id), {
          miembros: Math.max(1, (myTeamData.miembros || 2) - 1)
        });
      }
      if (authState.profile) {
        authState.profile.equipoId = null;
        authState.profile.equipoNombre = null;
        authState.profile.rolEquipo = null;
      }
      myTeamData = null;
      activeTab = 'explorar';
      await fetchEquipos();
      showToast('Has salido del equipo.');
    } catch (e) {
      console.error(e);
    }
  };

  // Cálculos de KPIs del equipo
  let totalVolumenUsd = $derived(
    propiedadesEquipo.reduce((acc, p) => acc + (Number(p.precioLista) || 0), 0)
  );

  let metaUsd = $derived(Number(myTeamData?.metaMensualUsd) || 300000);
  let porcentajeMeta = $derived(
    metaUsd > 0 ? Math.min(100, Math.round((totalVolumenUsd / metaUsd) * 100)) : 0
  );

  let dualVolumen = $derived(getDualPrice(totalVolumenUsd, 'USD'));

  // Cálculos de simulación de Splits
  let comisionTotalSimulada = $derived(
    (splitSimulatorVenta * (splitPorcentajeComision / 100))
  );
  let montoAgenteSimulado = $derived(comisionTotalSimulada * (splitAgente / 100));
  let montoEquipoSimulado = $derived(comisionTotalSimulada * (splitEquipo / 100));
  let montoLiderSimulado = $derived(comisionTotalSimulada * (splitLider / 100));

  // Filtrado de catálogo de equipos
  let filteredEquipos = $derived(
    equipos.filter((eq) => {
      const q = searchQuery.toLowerCase();
      return (
        eq.nombre?.toLowerCase().includes(q) ||
        eq.liderNombre?.toLowerCase().includes(q) ||
        eq.descripcion?.toLowerCase().includes(q)
      );
    })
  );

  onMount(async () => {
    loading = true;
    try {
      await fetchEquipos();
      if (myTeamId) {
        await fetchMyTeam();
        activeTab = 'dashboard';
      } else {
        activeTab = 'explorar';
      }
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    if (unsubChat) unsubChat();
  });
</script>

<svelte:head>
  <title>Mi Equipo & Red Comercial | Casa Legal CRM</title>
</svelte:head>

<div class="p-4 md:p-8 font-sans min-h-screen bg-[#071311] text-slate-100 flex flex-col overflow-y-auto selection:bg-[#D4AF37] selection:text-black">
  
  <!-- TOAST DE ACCIONES -->
  {#if toastMsg}
    <div class="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
      <Check size={18} class="text-white shrink-0" />
      <span>{toastMsg}</span>
    </div>
  {/if}

  <div class="max-w-7xl mx-auto w-full space-y-8">
    
    <!-- ENCABEZADO PRINCIPAL -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#1b3d36] pb-6">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
            <Shield size={12} /> Células Comerciales de Alto Rendimiento
          </span>
          <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Sistema Franquicia Multi-Agente
          </span>
        </div>
        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
          {#if myTeamData}
            {myTeamData.nombre}
          {:else}
            Equipos Casa Legal
          {/if}
        </h1>
        <p class="text-slate-400 text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed">
          {#if myTeamData}
            {myTeamData.lema || 'Colaboración, co-brokerage interno y aceleración de ventas en equipo.'}
          {:else}
            Únete a una célula comercial consolidada o funda tu propio equipo para multiplicar comisiones y volumen de cartera.
          {/if}
        </p>
      </div>

      <!-- BOTONES DE ACCIÓN SUPERIOR -->
      <div class="flex items-center gap-3 shrink-0">
        {#if !myTeamData}
          <button
            type="button"
            onclick={() => (showCreateModal = true)}
            class="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            <Plus size={16} /> Fundar Mi Equipo
          </button>
        {:else}
          {#if isTeamLeader}
            <span class="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Crown size={14} /> Eres el Team Leader
            </span>
          {:else}
            <button
              type="button"
              onclick={salirDelEquipo}
              class="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-bold transition-all"
            >
              Salir del Equipo
            </button>
          {/if}
          <button
            type="button"
            onclick={() => (activeTab = activeTab === 'explorar' ? 'dashboard' : 'explorar')}
            class="px-4 py-2.5 rounded-xl bg-[#0e2c24] hover:bg-[#163a32] border border-[#1b4339] text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition-all"
          >
            {activeTab === 'explorar' ? 'Volver a Mi Equipo' : 'Ver Todos los Equipos'}
          </button>
        {/if}
      </div>
    </header>

    {#if loading}
      <div class="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <div class="animate-spin rounded-full h-10 w-10 border-2 border-[#D4AF37] border-t-transparent"></div>
        <span class="text-xs uppercase tracking-widest font-mono">Cargando módulo de equipos...</span>
      </div>

    {:else if myTeamData && activeTab !== 'explorar'}
      <!-- ==================== SECCIÓN 1: VISTA DE MI EQUIPO ==================== -->
      
      <!-- HERO DEL EQUIPO: TARJETA PRINCIPAL DE CÉLULA -->
      <section class="relative rounded-3xl bg-gradient-to-br from-[#0c241f] via-[#091b17] to-[#040d0b] border border-[#1d463d] p-6 md:p-8 shadow-2xl overflow-hidden group">
        <div class="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <!-- Logo del Equipo -->
            <div class="w-24 h-24 rounded-3xl bg-[#061512] border-2 border-[#D4AF37]/60 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.2)] shrink-0">
              {#if myTeamData.logo}
                <img src={myTeamData.logo} alt="Logo" class="w-full h-full object-cover" />
              {:else}
                <Shield size={44} class="text-[#D4AF37]" />
              {/if}
            </div>

            <div>
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
                  Célula Oficial Casa Legal
                </span>
                <span class="text-xs text-slate-400 font-bold">
                  Líder: <strong class="text-white">{myTeamData.liderNombre}</strong>
                </span>
              </div>
              <h2 class="text-2xl md:text-4xl font-black text-white tracking-tight">
                {myTeamData.nombre}
              </h2>
              <p class="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
                {myTeamData.descripcion || 'Equipo dedicado a la comercialización de propiedades de alta rotación y captación en exclusiva.'}
              </p>
            </div>
          </div>

          <!-- Métricas Rápidas en el Hero -->
          <div class="flex items-center gap-4 bg-[#051410] border border-[#173830] p-4 rounded-2xl shrink-0">
            <div class="text-center px-3 border-r border-[#173830]">
              <span class="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Miembros</span>
              <span class="text-2xl font-black text-white font-mono">{miembrosEquipo.length}</span>
            </div>
            <div class="text-center px-3 border-r border-[#173830]">
              <span class="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Pool Inmuebles</span>
              <span class="text-2xl font-black text-[#D4AF37] font-mono">{propiedadesEquipo.length}</span>
            </div>
            <div class="text-center px-3">
              <span class="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Ventas Célula</span>
              <span class="text-2xl font-black text-emerald-400 font-mono">{myTeamData.ventas || 0}</span>
            </div>
          </div>
        </div>

        <!-- Meta Mensual de Ventas de la Célula -->
        <div class="relative z-10 mt-6 pt-6 border-t border-[#173830]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
            <span class="text-slate-400 uppercase tracking-wider font-bold text-[10px] flex items-center gap-1.5">
              <Target size={14} class="text-[#D4AF37]" /> Meta Mensual de Célula:
              <strong class="text-white font-mono">${metaUsd.toLocaleString()} USD</strong>
            </span>
            <span class="text-slate-300 font-medium">
              Volumen Cartera Compartida: <strong class="text-[#D4AF37] font-mono">{dualVolumen.usdFormatted} USD</strong>
              <span class="text-[11px] text-slate-400 font-mono">({dualVolumen.bobFormatted})</span>
            </span>
          </div>

          <!-- Barra de Progreso de la Meta -->
          <div class="h-3 w-full bg-[#051512] rounded-full overflow-hidden p-0.5 border border-[#1b4339]">
            <div
              class="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#D4AF37] to-amber-400 transition-all duration-700 ease-out"
              style="width: {porcentajeMeta}%"
            ></div>
          </div>
        </div>
      </section>

      <!-- BARRA DE PESTAÑAS DE LA CÉLULA -->
      <nav class="flex items-center gap-2 border-b border-[#1b3d36] pb-px overflow-x-auto">
        <button
          type="button"
          onclick={() => (activeTab = 'dashboard')}
          class="pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all relative flex items-center gap-2 shrink-0 {activeTab === 'dashboard'
            ? 'text-[#D4AF37]'
            : 'text-slate-400 hover:text-white'}"
        >
          <TrendingUp size={16} /> Panel de Rendimiento
          {#if activeTab === 'dashboard'}<div class="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]"></div>{/if}
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'miembros')}
          class="pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all relative flex items-center gap-2 shrink-0 {activeTab === 'miembros'
            ? 'text-[#D4AF37]'
            : 'text-slate-400 hover:text-white'}"
        >
          <Users size={16} /> Roster de Miembros ({miembrosEquipo.length})
          {#if activeTab === 'miembros'}<div class="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]"></div>{/if}
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'pool')}
          class="pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all relative flex items-center gap-2 shrink-0 {activeTab === 'pool'
            ? 'text-[#D4AF37]'
            : 'text-slate-400 hover:text-white'}"
        >
          <Building2 size={16} /> Pool de Inmuebles ({propiedadesEquipo.length})
          {#if activeTab === 'pool'}<div class="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]"></div>{/if}
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'splits')}
          class="pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all relative flex items-center gap-2 shrink-0 {activeTab === 'splits'
            ? 'text-[#D4AF37]'
            : 'text-slate-400 hover:text-white'}"
        >
          <Calculator size={16} /> Calculadora de Splits
          {#if activeTab === 'splits'}<div class="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]"></div>{/if}
        </button>

        <button
          type="button"
          onclick={() => (activeTab = 'chat')}
          class="pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all relative flex items-center gap-2 shrink-0 {activeTab === 'chat'
            ? 'text-[#D4AF37]'
            : 'text-slate-400 hover:text-white'}"
        >
          <MessageSquare size={16} /> Canal del Equipo
          {#if activeTab === 'chat'}<div class="absolute bottom-0 left-0 w-full h-0.5 bg-[#D4AF37]"></div>{/if}
        </button>

        {#if isTeamLeader && solicitudesPendientes.length > 0}
          <button
            type="button"
            onclick={() => (activeTab = 'solicitudes')}
            class="pb-3 px-4 font-black text-xs uppercase tracking-wider transition-all relative flex items-center gap-2 shrink-0 text-amber-400"
          >
            <Clock size={16} /> Solicitudes ({solicitudesPendientes.length})
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            {#if activeTab === 'solicitudes'}<div class="absolute bottom-0 left-0 w-full h-0.5 bg-amber-400"></div>{/if}
          </button>
        {/if}
      </nav>

      <!-- CONTENIDO DE LAS PESTAÑAS -->
      {#if activeTab === 'dashboard'}
        <!-- 1. DASHBOARD DE RENDIMIENTO Y CARTERA -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Card Volumen -->
          <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Volumen de Cartera Pool</span>
              <div class="p-2.5 rounded-xl bg-blue-500/20 text-blue-300">
                <Building2 size={20} />
              </div>
            </div>
            <div class="my-4">
              <p class="text-3xl font-black text-white font-mono leading-none">{dualVolumen.usdFormatted}</p>
              <p class="text-sm font-bold text-[#D4AF37] font-mono mt-1">{dualVolumen.bobFormatted}</p>
            </div>
            <p class="text-[11px] text-slate-400">Calculado con {propiedadesEquipo.length} propiedades activas.</p>
          </div>

          <!-- Card Ventas Célula -->
          <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ventas Cerradas</span>
              <div class="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Trophy size={20} />
              </div>
            </div>
            <div class="my-4">
              <p class="text-4xl font-black text-emerald-400 font-mono leading-none">{myTeamData.ventas || 0}</p>
              <p class="text-xs text-slate-300 mt-1 font-bold">Cierres acreditados al equipo</p>
            </div>
            <p class="text-[11px] text-slate-400">+{ (myTeamData.ventas || 0) * 100 } PTS de impacto en Score.</p>
          </div>

          <!-- Card Splits del Equipo -->
          <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Acuerdo de Splits</span>
              <div class="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                <Calculator size={20} />
              </div>
            </div>
            <div class="my-4 space-y-1.5 font-mono text-xs">
              <div class="flex justify-between">
                <span class="text-slate-400">Agente Cierre:</span>
                <strong class="text-white font-bold">{splitAgente}%</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Fondo Equipo:</span>
                <strong class="text-[#D4AF37] font-bold">{splitEquipo}%</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Override Líder:</span>
                <strong class="text-amber-300 font-bold">{splitLider}%</strong>
              </div>
            </div>
            <button
              type="button"
              onclick={() => (activeTab = 'splits')}
              class="text-[11px] text-[#D4AF37] font-bold hover:underline flex items-center gap-1"
            >
              Simular Cierre con Split <ArrowRight size={12} />
            </button>
          </div>
        </div>

      {:else if activeTab === 'miembros'}
        <!-- 2. ROSTER DE MIEMBROS DE LA CÉLULA -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-xl font-black text-white flex items-center gap-2">
                <Users size={22} class="text-[#D4AF37]" /> Roster Oficial de la Célula
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Asesores asociados y roles comerciales dentro del equipo.</p>
            </div>
            <span class="text-xs font-bold text-slate-300 bg-[#061411] px-3 py-1.5 rounded-xl border border-[#173a32]">
              {miembrosEquipo.length} Miembros Activos
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each miembrosEquipo as m}
              {@const isLeader = m.id === myTeamData.liderId}
              <div class="p-4 rounded-2xl bg-[#061411] border border-[#173a32] hover:border-[#D4AF37]/40 transition-all flex items-center gap-4">
                <div class="relative">
                  {#if m.documentos?.foto}
                    <img src={m.documentos.foto} alt={m.nombres} class="w-14 h-14 rounded-2xl object-cover border border-[#1b4339]" />
                  {:else}
                    <div class="w-14 h-14 rounded-2xl bg-[#0e2a23] text-[#D4AF37] flex items-center justify-center font-bold text-lg border border-[#1b4339]">
                      {m.nombres?.[0] || 'A'}
                    </div>
                  {/if}
                  {#if isLeader}
                    <span class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow" title="Líder">
                      <Crown size={12} />
                    </span>
                  {/if}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <h4 class="font-bold text-sm text-white truncate">
                      {getShortName(m.nombres, m.apellidos, m.nombre || m.email)}
                    </h4>
                  </div>
                  <span class="text-[10px] font-bold uppercase tracking-wider block mt-0.5 {isLeader ? 'text-[#D4AF37]' : 'text-emerald-400'}">
                    {isLeader ? 'Team Leader' : m.rolEquipo || 'Asociado Comercial'}
                  </span>
                  <p class="text-[10px] text-slate-400 font-mono mt-1 truncate">
                    {m.email || 'Sin correo'}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>

      {:else if activeTab === 'pool'}
        <!-- 3. POOL DE INMUEBLES COMPARTIDOS DEL EQUIPO -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-xl font-black text-white flex items-center gap-2">
                <Building2 size={22} class="text-emerald-400" /> Pool de Inmuebles del Equipo
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">Cartera compartida para co-brokerage y cierre prioritario entre miembros.</p>
            </div>

            <button
              type="button"
              onclick={loadMisInmuebles}
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:brightness-110 transition-all shrink-0"
            >
              <Plus size={16} /> Aportar Inmueble al Pool
            </button>
          </div>

          {#if propiedadesEquipo.length === 0}
            <div class="p-12 text-center bg-[#061411] rounded-2xl border border-dashed border-[#1b4339] space-y-3">
              <Building2 size={36} class="text-[#D4AF37] mx-auto opacity-60" />
              <p class="text-sm font-bold text-white">El equipo aún no tiene propiedades en su pool compartido.</p>
              <p class="text-xs text-slate-400 max-w-md mx-auto">
                Cualquier miembro del equipo puede compartir una de sus captaciones para que los colegas ofrezcan a sus compradores.
              </p>
              <button
                type="button"
                onclick={loadMisInmuebles}
                class="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider"
              >
                Compartir Mi Primer Inmueble
              </button>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {#each propiedadesEquipo as prop}
                {@const prices = getDualPrice(prop.precioLista, prop.moneda)}
                <div class="rounded-2xl bg-[#061411] border border-[#173a32] overflow-hidden flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all">
                  <div class="h-44 relative bg-black/40">
                    <img src={prop.fotoPrincipal || '/logoinmo.png'} alt={prop.tituloPropiedad} class="w-full h-full object-cover" />
                    <div class="absolute top-3 left-3 flex gap-1.5">
                      <span class="px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur text-[#D4AF37] text-[10px] font-black uppercase">
                        {prop.tipoOperacion}
                      </span>
                      <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                        {prop.estado || 'Activo'}
                      </span>
                    </div>
                  </div>

                  <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 class="font-extrabold text-sm text-white line-clamp-1">{prop.tituloPropiedad || prop.tipoInmueble}</h4>
                      <p class="text-[11px] text-slate-400 mt-0.5">{prop.zona || prop.ciudad}</p>
                    </div>

                    <!-- Precio Dual -->
                    <div class="pt-2 border-t border-[#142e27] flex items-baseline justify-between">
                      <div>
                        <span class="text-base font-black text-white font-mono leading-none">{prices.usdFormatted} USD</span>
                        <span class="text-xs font-bold text-[#D4AF37] font-mono block mt-0.5">{prices.bobFormatted}</span>
                      </div>
                      
                      {#if prop.agenteId === authState.user?.uid}
                        <button
                          type="button"
                          onclick={() => retirarPropiedad(prop.id)}
                          class="text-[10px] text-red-400 hover:text-red-300 font-bold"
                          title="Retirar del pool"
                        >
                          Retirar
                        </button>
                      {/if}
                    </div>

                    <a
                      href="/inmuebles/{prop.id}"
                      class="w-full py-2 rounded-xl bg-[#0e2a23] hover:bg-[#153c33] border border-[#1b4339] text-[#D4AF37] font-bold text-[11px] uppercase tracking-wider text-center block transition-colors"
                    >
                      Ver Ficha Técnica
                    </a>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

      {:else if activeTab === 'splits'}
        <!-- 4. CALCULADORA Y SIMULADOR DE SPLITS DEL EQUIPO -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div class="max-w-xl">
            <h3 class="text-xl font-black text-white flex items-center gap-2">
              <Calculator size={22} class="text-[#D4AF37]" /> Simulador de Comisión & Splits del Equipo
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Calcula con transparencia matemática cómo se distribuye una comisión cerrada bajo el acuerdo interno de la célula.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <!-- Controles de simulación -->
            <div class="bg-[#061411] border border-[#173a32] p-6 rounded-2xl space-y-4">
              <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  Precio de Cierre del Inmueble ($ USD)
                </label>
                <input
                  type="number"
                  bind:value={splitSimulatorVenta}
                  step="5000"
                  class="w-full p-3 rounded-xl bg-[#0a201b] border border-[#1b4339] text-white font-mono text-lg font-black focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    % Comisión Total
                  </label>
                  <input
                    type="number"
                    bind:value={splitPorcentajeComision}
                    step="0.5"
                    class="w-full p-3 rounded-xl bg-[#0a201b] border border-[#1b4339] text-white font-mono text-sm font-bold focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    Comisión Bruta ($)
                  </label>
                  <div class="p-3 rounded-xl bg-[#0c241f] border border-[#1b4339] text-[#D4AF37] font-mono text-sm font-black">
                    ${comisionTotalSimulada.toLocaleString()} USD
                  </div>
                </div>
              </div>

              <!-- Barras de split configuradas -->
              <div class="pt-4 border-t border-[#142e27] space-y-3">
                <span class="text-xs font-black uppercase text-slate-300 block">Distribución Acordada:</span>
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between font-mono">
                    <span class="text-slate-400">Agente Ejecutor ({splitAgente}%):</span>
                    <strong class="text-white">${montoAgenteSimulado.toLocaleString()} USD</strong>
                  </div>
                  <div class="flex justify-between font-mono">
                    <span class="text-slate-400">Fondo Común Célula ({splitEquipo}%):</span>
                    <strong class="text-[#D4AF37]">${montoEquipoSimulado.toLocaleString()} USD</strong>
                  </div>
                  <div class="flex justify-between font-mono">
                    <span class="text-slate-400">Override Líder ({splitLider}%):</span>
                    <strong class="text-amber-300">${montoLiderSimulado.toLocaleString()} USD</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen Visual de la Liquidación -->
            <div class="bg-gradient-to-br from-[#0c241f] to-[#040d0b] border border-[#1d463d] p-6 rounded-2xl space-y-4 shadow-xl">
              <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">Liquidación Estimada</span>
              <div class="p-4 rounded-xl bg-[#061411] border border-[#173830]">
                <span class="text-xs text-slate-400 block">Para el Agente que cerró la operación:</span>
                <p class="text-3xl font-black text-white font-mono mt-1">
                  ${montoAgenteSimulado.toLocaleString()} <span class="text-sm font-normal text-slate-400">USD</span>
                </p>
                <p class="text-xs text-[#D4AF37] font-mono mt-0.5">
                  Bs. {(montoAgenteSimulado * TIPO_CAMBIO_OFICIAL).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div class="p-4 rounded-xl bg-[#061411] border border-[#173830]">
                <span class="text-xs text-slate-400 block">Aporte al Fondo de Marketing del Equipo:</span>
                <p class="text-xl font-black text-[#D4AF37] font-mono mt-1">
                  ${montoEquipoSimulado.toLocaleString()} <span class="text-xs font-normal text-slate-400">USD</span>
                </p>
              </div>

              <p class="text-[11px] text-slate-400 leading-relaxed italic">
                * Este simulador aplica las reglas de división acordadas por el Team Leader para asegurar la reinversión en publicidad y prospección colectiva.
              </p>
            </div>
          </div>
        </div>

      {:else if activeTab === 'chat'}
        <!-- 5. CHAT Y COMUNICACIÓN EN TIEMPO REAL DEL EQUIPO -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 shadow-xl flex flex-col h-[600px]">
          <div class="flex items-center justify-between pb-4 border-b border-[#163830]">
            <div>
              <h3 class="text-base font-black text-white flex items-center gap-2">
                <MessageSquare size={18} class="text-[#D4AF37]" /> Canal Interno de la Célula
              </h3>
              <p class="text-[11px] text-slate-400">Comunicación instantánea entre los miembros de {myTeamData.nombre}.</p>
            </div>
            <span class="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              En Vivo
            </span>
          </div>

          <!-- Mensajes -->
          <div id="teamChatBox" class="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
            {#if chatMessages.length === 0}
              <div class="py-16 text-center text-slate-500 text-xs italic">
                No hay mensajes aún en el canal. ¡Escribe el primer mensaje para motivar a tu equipo!
              </div>
            {:else}
              {#each chatMessages as msg}
                {@const isMe = msg.autorId === authState.user?.uid}
                <div class="flex flex-col {isMe ? 'items-end' : 'items-start'}">
                  <span class="text-[10px] font-bold text-slate-400 mb-0.5 px-1">{msg.autorNombre}</span>
                  <div class="max-w-md p-3.5 rounded-2xl text-xs leading-relaxed {isMe
                    ? 'bg-gradient-to-r from-[#173d32] to-[#0f2c24] text-white border border-[#D4AF37]/30 rounded-tr-none'
                    : 'bg-[#061411] text-slate-200 border border-[#173830] rounded-tl-none'}">
                    {msg.texto}
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <!-- Input para enviar mensaje -->
          <form onsubmit={(e) => { e.preventDefault(); enviarMensaje(); }} class="pt-3 border-t border-[#163830] flex gap-2">
            <input
              type="text"
              bind:value={newMessage}
              placeholder="Escribe un mensaje o aviso para la célula..."
              class="flex-1 p-3 rounded-xl bg-[#061411] border border-[#1b4339] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              class="px-5 py-3 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Send size={14} /> Enviar
            </button>
          </form>
        </div>

      {:else if activeTab === 'solicitudes'}
        <!-- 6. SOLICITUDES DE INGRESO PENDIENTES (LÍDER) -->
        <div class="bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div>
            <h3 class="text-xl font-black text-white flex items-center gap-2">
              <Clock size={22} class="text-amber-400" /> Solicitudes de Ingreso a tu Célula
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Asesores que desean incorporarse a tu equipo de trabajo.</p>
          </div>

          <div class="space-y-3">
            {#each solicitudesPendientes as sol}
              <div class="p-4 rounded-2xl bg-[#061411] border border-[#173a32] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#0e2a23] text-[#D4AF37] flex items-center justify-center font-bold text-sm">
                    {sol.userName?.[0] || 'A'}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-white">{sol.userName}</h4>
                    <p class="text-[11px] text-slate-400">{sol.userEmail}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onclick={() => aceptarSolicitud(sol)}
                    class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Aceptar Miembro
                  </button>
                  <button
                    type="button"
                    onclick={() => rechazarSolicitud(sol)}
                    class="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

    {:else}
      <!-- ==================== SECCIÓN 2: CATÁLOGO DE TODOS LOS EQUIPOS ==================== -->
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-black text-white flex items-center gap-2">
              <Shield size={20} class="text-[#D4AF37]" /> Ranking de Células de Casa Legal
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Equipos oficiales organizados por volumen de ventas y miembros.</p>
          </div>

          <!-- Buscador -->
          <div class="relative w-full sm:w-72">
            <Search size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Buscar equipo o líder..."
              class="w-full pl-10 pr-4 py-2 bg-[#091a17] border border-[#1b3d36] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <!-- Grid de Equipos -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each filteredEquipos as eq, idx}
            <div class="bg-[#091a17] border border-[#1b3d36] hover:border-[#D4AF37]/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all">
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-2xl bg-[#061411] border border-[#1b4339] flex items-center justify-center overflow-hidden shrink-0">
                      {#if eq.logo}
                        <img src={eq.logo} alt={eq.nombre} class="w-full h-full object-cover" />
                      {:else}
                        <Shield size={26} class="text-[#D4AF37]" />
                      {/if}
                    </div>
                    <div>
                      <h3 class="font-extrabold text-base text-white leading-tight">{eq.nombre}</h3>
                      <p class="text-[11px] text-[#D4AF37] font-semibold mt-0.5">Líder: {eq.liderNombre}</p>
                    </div>
                  </div>

                  <span class="w-7 h-7 rounded-lg bg-[#061411] text-slate-400 border border-[#163830] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    #{idx + 1}
                  </span>
                </div>

                <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {eq.descripcion || eq.lema || 'Célula de alta productividad en Casa Legal.'}
                </p>
              </div>

              <div class="pt-3 border-t border-[#163830] space-y-3">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="text-slate-400">Miembros: <strong class="text-white">{eq.miembros || 1}</strong></span>
                  <span class="text-slate-400">Cierres: <strong class="text-emerald-400">{eq.ventas || 0}</strong></span>
                </div>

                <button
                  type="button"
                  onclick={() => solicitarUnirse(eq)}
                  class="w-full py-2.5 rounded-xl bg-[#0f2c25] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black font-black text-xs uppercase tracking-wider transition-all shadow"
                >
                  Solicitar Ingreso
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

  </div>
</div>

<!-- MODAL: FUNDAR NUEVO EQUIPO -->
{#if showCreateModal}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#091a17] border border-[#1d463d] rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between border-b border-[#163830] pb-4">
        <h3 class="text-lg font-black text-white flex items-center gap-2">
          <Shield size={20} class="text-[#D4AF37]" /> Fundar Nueva Célula Inmobiliaria
        </h3>
        <button type="button" onclick={() => (showCreateModal = false)} class="text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); crearEquipo(); }} class="space-y-4">
        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nombre del Equipo *</label>
          <input
            type="text"
            bind:value={nombreEquipo}
            required
            placeholder="ej. Titanes Inmobiliarios"
            class="w-full p-3 rounded-xl bg-[#061411] border border-[#1b4339] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Lema o Visión Comercial</label>
          <input
            type="text"
            bind:value={lemaEquipo}
            placeholder="ej. Especialistas en propiedades de lujo y exclusivas"
            class="w-full p-3 rounded-xl bg-[#061411] border border-[#1b4339] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Meta Mensual de Célula ($ USD)</label>
          <input
            type="number"
            bind:value={metaMensual}
            placeholder="300000"
            class="w-full p-3 rounded-xl bg-[#061411] border border-[#1b4339] text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div>
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Logo o Insignia</label>
          <input type="file" accept="image/*" onchange={handleLogoUpload} class="text-xs text-slate-400" />
          {#if logoPreview}
            <img src={logoPreview} alt="Preview" class="w-16 h-16 rounded-xl mt-2 object-cover border border-[#D4AF37]/50" />
          {/if}
        </div>

        <div class="pt-4 border-t border-[#163830] flex gap-3">
          <button
            type="button"
            onclick={() => (showCreateModal = false)}
            class="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSavingTeam || !nombreEquipo.trim()}
            class="flex-1 py-3 rounded-xl bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {#if isSavingTeam}<Loader2 size={16} class="animate-spin" />{:else}<Plus size={16} />{/if}
            Fundar Equipo
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- MODAL: APORTAR PROPIEDAD AL POOL DEL EQUIPO -->
{#if showAddPropiedadModal}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#091a17] border border-[#1d463d] rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between border-b border-[#163830] pb-3">
        <h3 class="text-base font-black text-white flex items-center gap-2">
          <Building2 size={18} class="text-[#D4AF37]" /> Seleccionar Propiedad para el Pool
        </h3>
        <button type="button" onclick={() => (showAddPropiedadModal = false)} class="text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div class="max-h-96 overflow-y-auto space-y-2.5 pr-1">
        {#if misInmuebles.length === 0}
          <p class="py-8 text-center text-xs text-slate-400 italic">No tienes captaciones propias disponibles.</p>
        {:else}
          {#each misInmuebles as prop}
            {@const prices = getDualPrice(prop.precioLista, prop.moneda)}
            <div class="p-3.5 rounded-2xl bg-[#061411] border border-[#173a32] flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <img src={prop.fotoPrincipal || '/logoinmo.png'} alt="Thumb" class="w-12 h-12 rounded-xl object-cover border border-[#1b4339]" />
                <div class="min-w-0">
                  <h4 class="font-bold text-xs text-white truncate">{prop.tituloPropiedad}</h4>
                  <span class="text-[11px] font-mono text-[#D4AF37] font-bold">{prices.usdFormatted} · {prices.bobFormatted}</span>
                </div>
              </div>

              <button
                type="button"
                onclick={() => compartirPropiedad(prop.id)}
                class="px-3.5 py-2 rounded-xl bg-[#D4AF37] text-black font-black text-[11px] uppercase tracking-wider shrink-0"
              >
                Compartir
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
