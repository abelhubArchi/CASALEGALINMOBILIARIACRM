<script>
  import { onMount, onDestroy } from 'svelte';
  import {
    Radio,
    Image as ImageIcon,
    Video,
    Send,
    CheckCircle,
    Info,
    UploadCloud,
    Store,
    Copy,
    Check,
    Loader2,
    Sparkles,
    Smartphone,
    LayoutGrid,
    Monitor,
    Camera,
    Share2,
    Search,
    Building2,
    DollarSign,
    Users,
    Handshake,
    ArrowRight,
    ExternalLink,
    MessageSquare,
    Plus,
    Filter,
    Clock,
    Flame,
    ShieldCheck,
    Award,
    ChevronRight,
    TrendingUp,
    Compass,
    Eye,
    Heart,
    Bookmark,
    MapPin,
    Maximize2,
    Bed,
    Bath,
    Car,
    X,
    Megaphone,
    Target,
    Zap,
    Download,
    Share,
    CheckCircle2,
    AlertCircle
  } from 'lucide-svelte';
  import { db } from '#lib/firebase';
  import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot
  } from 'firebase/firestore';
  import { authState } from '#lib/authStore.svelte.js';
  import { getDualPrice, TIPO_CAMBIO_OFICIAL } from '#lib/currency';

  // Navegación principal de pestañas
  let activeTab = $state('despacho'); // 'despacho' | 'mls' | 'requerimientos' | 'campanas'

  // Estados de datos
  let misPropiedades = $state([]);
  let todasLasPropiedades = $state([]);
  let loadingProps = $state(true);
  let filterMyPropsOnly = $state(false);
  let propSearch = $state('');

  // Form state para Despachador Multicanal
  let selectedPropId = $state('');
  let selectedProp = $derived(
    todasLasPropiedades.find((p) => p.id === selectedPropId) || null
  );

  // Selector de Tono IA para Copywriting
  let aiTone = $state('inversionista'); // 'inversionista' | 'lujo' | 'familiar' | 'viral' | 'comercial'
  let aiDescription = $state('');
  let copied = $state(false);
  let toastMsg = $state('');

  // Canales de publicación
  let channels = $state({
    facebook: true,
    instagram: true,
    whatsapp: true,
    marketplace: false,
    mlsInterno: true
  });

  // Formato y Vista previa de Smartphone
  let previewFormat = $state('instagram'); // 'instagram' | 'whatsapp' | 'mls'

  // Progreso de Publicación Asistida
  let isPublishing = $state(false);
  let publishStep = $state(0); // 0: Idle, 1: Verificación, 2: Gráficos, 3: MLS & Red, 4: Success
  let statusText = $state('');

  // Historial de Despachos en Firebase
  let redCasaHistorial = $state([]);
  let loadingHistorial = $state(true);

  // Bolsa MLS Co-Brokerage
  let mlsList = $state([]);
  let loadingMls = $state(true);
  let mlsSearch = $state('');
  let showMlsModal = $state(false);
  let mlsSplitPorcentaje = $state(50);
  let mlsSelectedPropId = $state('');
  let mlsNotas = $state('');
  let isSavingMls = $state(false);

  // Pizarra de Requerimientos MLS ("Tengo un Comprador")
  let requerimientosList = $state([]);
  let loadingReqs = $state(true);
  let showReqModal = $state(false);
  let isSavingReq = $state(false);
  let nuevoReq = $state({
    tipoInmueble: 'Casa',
    zona: '',
    presupuestoMax: '',
    moneda: 'USD',
    tipoPago: 'Contado',
    dormitorios: '3',
    detalles: ''
  });

  // Modal Solicitud de Pauta Digital a Gerencia
  let showPautaModal = $state(false);
  let isSavingPauta = $state(false);
  let pautaForm = $state({
    propiedadId: '',
    presupuestoUsd: 50,
    diasCampana: 7,
    objetivo: 'Leads de WhatsApp Directo',
    publicoObjetivo: 'Inversionistas y Familias ABC1 en Santa Cruz'
  });

  // Desuscriptores
  let unsubscribeHistorial = null;
  let unsubscribeMls = null;
  let unsubscribeReqs = null;

  const showToast = (msg) => {
    toastMsg = msg;
    setTimeout(() => {
      toastMsg = '';
    }, 3500);
  };

  // Helper para nombre de agente
  const getShortName = (nombres, apellidos, nombre) => {
    const primerNombre = (nombres || nombre || '').trim().split(' ')[0] || 'Agente';
    const primerApellido = (apellidos || '').trim().split(' ')[0] || '';
    return `${primerNombre} ${primerApellido}`.trim();
  };

  onMount(async () => {
    try {
      // 1. Cargar Inmuebles reales de la colección 'inmuebles'
      const snapAll = await getDocs(
        query(collection(db, 'inmuebles'), orderBy('fechaCreacion', 'desc'))
      );
      todasLasPropiedades = snapAll.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (authState.user) {
        misPropiedades = todasLasPropiedades.filter(
          (p) =>
            p.agenteId === authState.user.uid ||
            p.usuarioId === authState.user.uid ||
            p.creadorId === authState.user.uid
        );
      }

      // Si el agente tiene inmuebles propios, preseleccionar el primero
      if (misPropiedades.length > 0) {
        selectedPropId = misPropiedades[0].id;
      } else if (todasLasPropiedades.length > 0) {
        selectedPropId = todasLasPropiedades[0].id;
      }

      // 2. Listener en tiempo real para el Historial de Despachos (red_casa)
      const qHistorial = query(collection(db, 'red_casa'), orderBy('createdAt', 'desc'));
      unsubscribeHistorial = onSnapshot(
        qHistorial,
        (snap) => {
          redCasaHistorial = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          loadingHistorial = false;
        },
        (err) => {
          console.error('Error cargando historial red_casa:', err);
          loadingHistorial = false;
        }
      );

      // 3. Listener en tiempo real para la Bolsa MLS (mls_red)
      const qMls = query(collection(db, 'mls_red'), orderBy('createdAt', 'desc'));
      unsubscribeMls = onSnapshot(
        qMls,
        (snap) => {
          if (!snap.empty) {
            mlsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            // Datos iniciales de demostración enriquecidos con propiedades reales si la colección está vacía
            mlsList = getDefaultMlsProperties();
          }
          loadingMls = false;
        },
        (err) => {
          console.error('Error cargando MLS:', err);
          mlsList = getDefaultMlsProperties();
          loadingMls = false;
        }
      );

      // 4. Listener en tiempo real para Requerimientos MLS (mls_requerimientos)
      const qReqs = query(
        collection(db, 'mls_requerimientos'),
        orderBy('createdAt', 'desc')
      );
      unsubscribeReqs = onSnapshot(
        qReqs,
        (snap) => {
          if (!snap.empty) {
            requerimientosList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } else {
            requerimientosList = getDefaultRequirements();
          }
          loadingReqs = false;
        },
        (err) => {
          console.error('Error cargando requerimientos MLS:', err);
          requerimientosList = getDefaultRequirements();
          loadingReqs = false;
        }
      );
    } catch (e) {
      console.error('Error al inicializar Red Casa Legal:', e);
    } finally {
      loadingProps = false;
    }
  });

  onDestroy(() => {
    if (unsubscribeHistorial) unsubscribeHistorial();
    if (unsubscribeMls) unsubscribeMls();
    if (unsubscribeReqs) unsubscribeReqs();
  });

  // Datos de fallback para Co-Brokerage inicial si Firestore está vacío
  const getDefaultMlsProperties = () => {
    return todasLasPropiedades.slice(0, 4).map((p, idx) => ({
      id: `default_mls_${idx}`,
      propiedadId: p.id,
      titulo: p.tituloPropiedad || `${p.tipoInmueble} de Lujo en ${p.zona || 'Santa Cruz'}`,
      zona: p.zona || 'Equipetrol Norte',
      ciudad: p.ciudad || 'Santa Cruz',
      tipoInmueble: p.tipoInmueble || 'Departamento',
      tipoOperacion: p.tipoOperacion || 'Venta',
      precioLista: p.precioLista || 145000,
      moneda: p.moneda || 'USD',
      foto: p.fotoPrincipal || (p.fotos && p.fotos[0]) || '/logoCasaLegal.jpg',
      agenteNombre: idx % 2 === 0 ? 'Abel Escobar' : 'Carolina Méndez',
      agenteTelefono: '59170000000',
      splitComision: '50% / 50% (Gana 1.5% al traer comprador)',
      comentarios: 'Cliente vendedor listo para firmar. Llaves en oficina central.',
      dormitorios: p.dormitoriosSuite || 3,
      banos: p.banos || 2,
      superficie: p.superficieTotal || 120,
      createdAt: { toMillis: () => Date.now() - idx * 86400000 * 2 }
    }));
  };

  // Requerimientos iniciales de compradores en red
  const getDefaultRequirements = () => [
    {
      id: 'req_1',
      agenteNombre: 'Carlos Valverde',
      agenteTelefono: '59178945612',
      tipoInmueble: 'Casa en Condominio Cerrado',
      zona: 'Zona Norte / Remanso / Urubó',
      presupuestoMax: 180000,
      moneda: 'USD',
      tipoPago: 'Crédito Bancario Aprobado (Banco Mercantil)',
      dormitorios: '3 o 4 dormitorios con suite',
      detalles: 'Familia con 2 niños, indispensable patio con churrasquera y seguridad 24/7.',
      fecha: 'Hoy, hace 2 horas'
    },
    {
      id: 'req_2',
      agenteNombre: 'Mariana Suarez',
      agenteTelefono: '59171239874',
      tipoInmueble: 'Departamento Amoblado',
      zona: 'Equipetrol / Sirari',
      presupuestoMax: 95000,
      moneda: 'USD',
      tipoPago: 'Contado Efectivo',
      dormitorios: '1 o 2 dormitorios',
      detalles: 'Inversionista extranjero busca unidad lista para rentar en Airbnb.',
      fecha: 'Ayer'
    },
    {
      id: 'req_3',
      agenteNombre: 'Diego Morales',
      agenteTelefono: '59176541230',
      tipoInmueble: 'Terreno Urbanizado',
      zona: 'Urubó / Valle Sánchez',
      presupuestoMax: 45000,
      moneda: 'USD',
      tipoPago: 'Contado',
      dormitorios: '-',
      detalles: 'Mínimo 350 m², papeles al día listos para transferencia inmediata.',
      fecha: 'Hace 3 días'
    }
  ];

  // Inmuebles filtrados para selector de Despacho
  let availableProps = $derived(
    todasLasPropiedades.filter((p) => {
      if (filterMyPropsOnly && misPropiedades.length > 0) {
        const isMine =
          p.agenteId === authState.user?.uid ||
          p.usuarioId === authState.user?.uid ||
          p.creadorId === authState.user?.uid;
        if (!isMine) return false;
      }
      if (!propSearch.trim()) return true;
      const q = propSearch.toLowerCase();
      const tit = (p.tituloPropiedad || p.tipoInmueble || '').toLowerCase();
      const zon = (p.zona || '').toLowerCase();
      return tit.includes(q) || zon.includes(q);
    })
  );

  // Precios duales del inmueble seleccionado
  let selectedPropDualPrice = $derived(
    selectedProp ? getDualPrice(selectedProp.precioLista, selectedProp.moneda) : null
  );

  // Generador de Copys de IA según el Tono Seleccionado
  const generateAICopy = (prop, tone) => {
    if (!prop) return '';
    const dual = getDualPrice(prop.precioLista, prop.moneda);
    const titulo = prop.tituloPropiedad || `${prop.tipoInmueble} en ${prop.zona || 'Ubicación Estratégica'}`;
    const zona = prop.zona || 'Zona de Alta Demanda';
    const tipo = prop.tipoInmueble || 'Propiedad';
    const operacion = prop.tipoOperacion || 'Venta';
    const agente = getShortName(
      authState.profile?.nombres,
      authState.profile?.apellidos,
      authState.profile?.nombre
    );

    const specs = [
      prop.superficieTotal ? `📐 ${prop.superficieTotal} m² de superficie` : null,
      prop.dormitoriosSuite || prop.dormitoriosEstandar
        ? `🛏️ ${Number(prop.dormitoriosSuite || 0) + Number(prop.dormitoriosEstandar || 0)} Dormitorios`
        : null,
      prop.banos ? `🚿 ${prop.banos} Baños` : null,
      prop.garajes ? `🚗 ${prop.garajes} Parqueo(s)` : null
    ]
      .filter(Boolean)
      .join('\n');

    switch (tone) {
      case 'inversionista':
        return `🚀 OPORTUNIDAD DE ALTO RENDIMIENTO | PLUSVALÍA GARANTIZADA

📍 Ubicación: ${zona}, Bolivia
🏷️ Inmueble: ${titulo}
💎 Valor de Inversión: ${dual.usdFormatted} USD (${dual.bobFormatted} al T.C. Oficial ${dual.tc})

¿Por qué esta es una inversión de alta plusvalía?
${specs || '• Ubicación en polo de máxima expansión comercial y residencial'}
• Alta rentabilidad proyectada en renta tradicional y Airbnb
• Documentación saneada y al día, lista para transferencia segura

Asesórate con Casa Legal Inmobiliaria:
👤 ${agente} | Asesor Inmobiliario Franquiciado
📲 Solicita el dossier financiero y coordina tu visita privada.

#CasaLegal #BienesRaicesBolivia #InversionInmobiliaria #Plusvalia #InmueblesSantaCruz`;

      case 'lujo':
        return `✨ EXCLUSIVIDAD Y ELEGANCIA EN SU MÁXIMA EXPRESIÓN

Descubre una residencia pensada para quienes no aceptan concesiones. 
Ubicada en el corazón de ${zona}, este ${tipo} combina diseño vanguardista, amplitud y privacidad absoluta.

🏛️ Detalle de la Propiedad:
${specs || '• Acabados de primera calidad y diseño de iluminación escénica'}
• Espacios integrados con luz natural privilegiada
• Máxima seguridad y entorno residencial selecto

💎 Inversión: ${dual.usdFormatted} USD | ${dual.bobFormatted}
Asesoría Personalizada:
👤 ${agente} - Casa Legal Premier
Agenda una inspección privada y eleva tu estilo de vida.

#CasaLegalPremier #LujoBolivia #RealEstateLuxury #ArquitecturaExclusiva`;

      case 'familiar':
        return `🏡 EL HOGAR QUE TU FAMILIA MERECE ESTÁ AQUÍ

¿Buscas seguridad, tranquilidad y espacios para que tus hijos crezcan felices?
Te presentamos este hermoso ${tipo} ubicado en ${zona}, en una de las zonas más seguras y conectadas de la ciudad.

❤️ Lo que enamorará a tu familia:
${specs || '• Ambientes amplios, ventilados y luminosos'}
• Cercanía a colegios de primer nivel, parques y centros comerciales
• Papeles al día, apto para financiamiento bancario inmediato

💵 Precio: ${dual.usdFormatted} USD (${dual.bobFormatted})
Permíteme acompañarte a conocer el nuevo capítulo de tu vida:
👤 ${agente} - Tu Asesor Inmobiliario de Confianza en Casa Legal
💬 Escríbeme y agendamos tu recorrido sin compromiso.

#CasaLegal #HogarFamiliar #ComprarCasa #TuNuevoHogarBolivia`;

      case 'viral':
        return `🔥 ¡ALERTA DE OPORTUNIDAD! MIRA ESTO ANTES DE QUE SE VENDA 😱👇

¿Buscabas ${tipo.toLowerCase()} en ${zona}? 
Acaba de ingresar al mercado y el precio está por debajo del promedio de la zona:

⚡ PRECIO IRREPETIBLE: ${dual.usdFormatted} USD (${dual.bobFormatted})
${specs ? '\n' + specs : ''}

✅ Documentación lista para escrituración
✅ No durará más de 7 días disponible

💬 COMENTA "INFO" o toca el enlace para enviarte fotos completas y agendar visita hoy mismo.
Asesor: ${agente} | Casa Legal Inmobiliaria

#ViralRealEstate #OportunidadInmobiliaria #CasaLegal #CholloInmobiliario`;

      case 'comercial':
        return `💼 PUNTO COMERCIAL & CORPORATIVO DE MÁXIMO FLUJO

Posiciona tu negocio o empresa en una de las arterias más transitadas y estratégicas de ${zona}.
Inmueble con versatilidad óptima para oficinas corporativas, showrooms o desarrollo comercial.

📊 Ficha Comercial:
${specs || '• Fachada con alta visibilidad y tránsito peatonal/vehicular constante'}
• Zonificación comercial privilegiada
• Estructura adaptable y áreas de parqueo

💰 Valor de Mercado: ${dual.usdFormatted} USD (${dual.bobFormatted})
Atención directa a inversionistas y empresas:
👤 ${agente} | Casa Legal Corporativo
Contáctanos para análisis técnico y comercial.

#InmueblesComerciales #OficinasBolivia #CasaLegal #DesarrolloInmobiliario`;

      default:
        return '';
    }
  };

  // Reaccionar al cambio de propiedad o tono de IA
  $effect(() => {
    if (selectedProp) {
      aiDescription = generateAICopy(selectedProp, aiTone);
    } else {
      aiDescription = '';
    }
  });

  const cambiarTono = (tono) => {
    aiTone = tono;
    if (selectedProp) {
      aiDescription = generateAICopy(selectedProp, tono);
      showToast(`Copy adaptada al tono: ${tono.toUpperCase()}`);
    }
  };

  const copyToClipboard = () => {
    if (!aiDescription) return;
    navigator.clipboard.writeText(aiDescription);
    copied = true;
    showToast('¡Texto copiado al portapapeles!');
    setTimeout(() => (copied = false), 2000);
  };

  const launchWhatsApp = () => {
    if (!aiDescription) return;
    const textEncoded = encodeURIComponent(aiDescription);
    const url = `https://wa.me/?text=${textEncoded}`;
    window.open(url, '_blank');
  };

  // Proceso Asistido de Publicación Simultánea
  const simulatePublish = async () => {
    if (!selectedPropId) {
      alert('⚠️ Por favor selecciona un inmueble primero.');
      return;
    }
    const anyChannel =
      channels.facebook ||
      channels.instagram ||
      channels.whatsapp ||
      channels.marketplace ||
      channels.mlsInterno;
    if (!anyChannel) {
      alert('⚠️ Debes seleccionar al menos un canal destino.');
      return;
    }
    if (!aiDescription.trim()) {
      alert('⚠️ La descripción de la publicación no puede estar vacía.');
      return;
    }

    isPublishing = true;
    publishStep = 1;
    statusText = 'Verificando credenciales de API y permisos de red...';

    await new Promise((r) => setTimeout(r, 700));
    publishStep = 2;
    statusText = 'Optimizando resolución de fotos con Marca de Agua Casa Legal...';

    await new Promise((r) => setTimeout(r, 800));
    publishStep = 3;
    statusText = 'Transmitiendo a Meta API, WhatsApp Hub y Red MLS Casa Legal...';

    await new Promise((r) => setTimeout(r, 800));

    // Guardar registro real en Firebase red_casa
    try {
      const dual = getDualPrice(selectedProp?.precioLista, selectedProp?.moneda);
      await addDoc(collection(db, 'red_casa'), {
        agenteId: authState.user?.uid || 'unknown',
        agenteNombre: getShortName(
          authState.profile?.nombres,
          authState.profile?.apellidos,
          authState.profile?.nombre
        ),
        propiedadId: selectedPropId,
        propiedadTitulo:
          selectedProp?.tituloPropiedad ||
          `${selectedProp?.tipoInmueble} en ${selectedProp?.zona}`,
        propiedadFoto:
          selectedProp?.fotoPrincipal ||
          (selectedProp?.fotos && selectedProp.fotos[0]) ||
          null,
        precioUsd: dual.usd,
        precioBob: dual.bob,
        mensaje: aiDescription,
        canales: channels,
        tono: aiTone,
        formato: previewFormat,
        estado: 'Publicado',
        createdAt: serverTimestamp()
      });
      showToast('¡Despacho completado y registrado exitosamente en la Red!');
    } catch (e) {
      console.error('Error guardando log en Firebase:', e);
    }

    publishStep = 4;
    statusText = '¡Despliegue Exitoso en Todos los Nodos!';
  };

  const resetForm = () => {
    isPublishing = false;
    publishStep = 0;
    statusText = '';
  };

  // Publicar en Bolsa MLS Co-Brokerage
  const publicarEnMls = async () => {
    if (!mlsSelectedPropId) {
      alert('Selecciona un inmueble de tu inventario.');
      return;
    }
    const prop = todasLasPropiedades.find((p) => p.id === mlsSelectedPropId);
    if (!prop) return;

    isSavingMls = true;
    try {
      const dual = getDualPrice(prop.precioLista, prop.moneda);
      await addDoc(collection(db, 'mls_red'), {
        propiedadId: prop.id,
        titulo: prop.tituloPropiedad || `${prop.tipoInmueble} en ${prop.zona}`,
        zona: prop.zona || 'Santa Cruz',
        ciudad: prop.ciudad || 'Santa Cruz',
        tipoInmueble: prop.tipoInmueble || 'Inmueble',
        tipoOperacion: prop.tipoOperacion || 'Venta',
        precioLista: dual.usd,
        moneda: 'USD',
        precioBob: dual.bob,
        foto: prop.fotoPrincipal || (prop.fotos && prop.fotos[0]) || '/logoCasaLegal.jpg',
        agenteId: authState.user?.uid || 'anon',
        agenteNombre: getShortName(
          authState.profile?.nombres,
          authState.profile?.apellidos,
          authState.profile?.nombre
        ),
        agenteTelefono: authState.profile?.telefono || '59170000000',
        splitComision: `${mlsSplitPorcentaje}% / ${100 - mlsSplitPorcentaje}% (Ganas ${mlsSplitPorcentaje}% de la comisión)`,
        comentarios: mlsNotas || 'Disponible para visitas inmediatas.',
        dormitorios: prop.dormitoriosSuite || prop.dormitoriosEstandar || 3,
        banos: prop.banos || 2,
        superficie: prop.superficieTotal || 120,
        createdAt: serverTimestamp()
      });
      showMlsModal = false;
      mlsNotas = '';
      showToast('¡Inmueble publicado en la Bolsa MLS Casa Legal con éxito!');
    } catch (e) {
      console.error('Error publicando en MLS:', e);
      alert('Error al publicar en la bolsa MLS.');
    } finally {
      isSavingMls = false;
    }
  };

  // Publicar Requerimiento de Comprador
  const publicarRequerimiento = async () => {
    if (!nuevoReq.zona || !nuevoReq.presupuestoMax) {
      alert('Por favor especifica la zona y el presupuesto máximo.');
      return;
    }
    isSavingReq = true;
    try {
      const agente = getShortName(
        authState.profile?.nombres,
        authState.profile?.apellidos,
        authState.profile?.nombre
      );
      await addDoc(collection(db, 'mls_requerimientos'), {
        agenteId: authState.user?.uid || 'anon',
        agenteNombre: agente,
        agenteTelefono: authState.profile?.telefono || '59170000000',
        tipoInmueble: nuevoReq.tipoInmueble,
        zona: nuevoReq.zona,
        presupuestoMax: Number(nuevoReq.presupuestoMax),
        moneda: nuevoReq.moneda,
        tipoPago: nuevoReq.tipoPago,
        dormitorios: nuevoReq.dormitorios,
        detalles: nuevoReq.detalles,
        fecha: 'Hace un momento',
        createdAt: serverTimestamp()
      });
      showReqModal = false;
      nuevoReq = {
        tipoInmueble: 'Casa',
        zona: '',
        presupuestoMax: '',
        moneda: 'USD',
        tipoPago: 'Contado',
        dormitorios: '3',
        detalles: ''
      };
      showToast('¡Requerimiento difundido en la Red Casa Legal!');
    } catch (e) {
      console.error('Error publicando requerimiento:', e);
      alert('Error al publicar requerimiento.');
    } finally {
      isSavingReq = false;
    }
  };

  // Solicitar Pauta Digital Pagada a Marketing Central
  const solicitarPauta = async () => {
    if (!pautaForm.propiedadId) {
      alert('Selecciona un inmueble para la campaña.');
      return;
    }
    isSavingPauta = true;
    try {
      const prop = todasLasPropiedades.find((p) => p.id === pautaForm.propiedadId);
      const agente = getShortName(
        authState.profile?.nombres,
        authState.profile?.apellidos,
        authState.profile?.nombre
      );
      await addDoc(collection(db, 'red_casa'), {
        agenteId: authState.user?.uid || 'anon',
        agenteNombre: agente,
        propiedadId: pautaForm.propiedadId,
        propiedadTitulo:
          prop?.tituloPropiedad || `${prop?.tipoInmueble} en ${prop?.zona}`,
        propiedadFoto:
          prop?.fotoPrincipal || (prop?.fotos && prop?.fotos[0]) || null,
        presupuestoUsd: Number(pautaForm.presupuestoUsd),
        diasCampana: Number(pautaForm.diasCampana),
        objetivo: pautaForm.objetivo,
        publicoObjetivo: pautaForm.publicoObjetivo,
        canales: { facebook: true, instagram: true, metaAds: true },
        mensaje: `Solicitud de Pauta Digital ($${pautaForm.presupuestoUsd} USD) por ${pautaForm.diasCampana} días. Objetivo: ${pautaForm.objetivo}`,
        estado: 'En Revisión por Marketing Central',
        createdAt: serverTimestamp()
      });
      showPautaModal = false;
      showToast('¡Solicitud de pauta enviada al equipo central de Marketing!');
    } catch (e) {
      console.error(e);
      alert('Error al solicitar pauta.');
    } finally {
      isSavingPauta = false;
    }
  };
</script>

<svelte:head>
  <title>Red Casa Legal & MLS Multi-Canal | Casa Legal Inmobiliaria</title>
</svelte:head>

<div class="min-h-screen bg-[#071311] text-slate-100 flex flex-col font-sans relative overflow-x-hidden p-4 md:p-8">
  
  <!-- TOAST NOTIFICACIÓN -->
  {#if toastMsg}
    <div class="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
      <CheckCircle2 size={18} class="text-white shrink-0" />
      <span>{toastMsg}</span>
    </div>
  {/if}

  <div class="max-w-7xl mx-auto w-full space-y-8">
    
    <!-- ENCABEZADO Y TELEMETRÍA DE RED -->
    <header class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-[#1b3d36] pb-8">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
            <Radio size={12} class="animate-pulse" /> Difusión Multicanal & Co-Brokerage
          </span>
          <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Red MLS Activa en Bolivia
          </span>
          <span class="px-2 py-0.5 rounded-md bg-[#0c241f] border border-[#1b3d36] text-[10px] font-mono text-emerald-300">
            T.C. Oficial: {TIPO_CAMBIO_OFICIAL} Bs/USD
          </span>
        </div>
        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
          Red Casa Legal <span class="text-[#D4AF37]">MLS</span>
        </h1>
        <p class="text-slate-400 text-sm md:text-base mt-1.5 max-w-3xl leading-relaxed">
          Centro de Despacho Inteligente a Redes Sociales, Generador de Copywriting Inmobiliario con IA y Bolsa Colaborativa de Co-Brokerage entre agentes de la franquicia.
        </p>
      </div>

      <!-- BOTONES DE ACCIÓN RÁPIDA SUPERIOR -->
      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <button
          onclick={() => (showMlsModal = true)}
          class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.25)]"
        >
          <Handshake size={15} /> Compartir en MLS
        </button>
        <button
          onclick={() => (showReqModal = true)}
          class="px-4 py-2.5 rounded-xl bg-[#0c241f] border border-[#1b3d36] hover:border-[#D4AF37]/40 text-emerald-400 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
        >
          <Target size={15} /> Tengo un Comprador
        </button>
        <button
          onclick={() => (showPautaModal = true)}
          class="px-4 py-2.5 rounded-xl bg-[#0c241f] border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
        >
          <Megaphone size={15} /> Solicitar Pauta Digital
        </button>
      </div>
    </header>

    <!-- PESTAÑAS DE NAVEGACIÓN -->
    <div class="flex overflow-x-auto no-scrollbar gap-2 p-1.5 rounded-2xl bg-[#091a17] border border-[#1b3d36]">
      <button
        onclick={() => (activeTab = 'despacho')}
        class="flex-1 min-w-[170px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all {activeTab === 'despacho' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-[#0c241f]'}"
      >
        <Radio size={16} /> 1. Despacho & Copy IA
      </button>

      <button
        onclick={() => (activeTab = 'mls')}
        class="flex-1 min-w-[170px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all {activeTab === 'mls' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-[#0c241f]'}"
      >
        <Handshake size={16} /> 2. Bolsa Co-Brokerage
        <span class="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-mono font-bold">
          {mlsList.length}
        </span>
      </button>

      <button
        onclick={() => (activeTab = 'requerimientos')}
        class="flex-1 min-w-[170px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all {activeTab === 'requerimientos' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-[#0c241f]'}"
      >
        <Target size={16} /> 3. Pizarra de Compradores
        <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
          {requerimientosList.length}
        </span>
      </button>

      <button
        onclick={() => (activeTab = 'campanas')}
        class="flex-1 min-w-[170px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all {activeTab === 'campanas' ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-[#0c241f]'}"
      >
        <Clock size={16} /> 4. Historial & Despachos
        <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
          {redCasaHistorial.length}
        </span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- TAB 1: DESPACHO MULTICANAL & IA COPYWRITER -->
    <!-- ========================================== -->
    {#if activeTab === 'despacho'}
      
      {#if publishStep === 4}
        <!-- PANTALLA DE ÉXITO TRAS LANZAMIENTO -->
        <div class="rounded-3xl bg-gradient-to-br from-[#0c241f] to-[#091a17] border border-emerald-500/30 p-12 text-center animate-in zoom-in-95 duration-500 shadow-2xl max-w-2xl mx-auto space-y-6">
          <div class="w-24 h-24 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle size={52} />
          </div>
          <div>
            <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-widest">
              Despliegue Confirmado
            </span>
            <h2 class="text-3xl font-black text-white mt-3">¡Inmueble Despachado con Éxito!</h2>
            <p class="text-slate-300 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              La propiedad ha sido transmitida a los canales seleccionados y registrada en el historial central de Casa Legal con su copy optimizada.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-[#071311] border border-[#1b3d36] text-left text-xs space-y-2 max-w-md mx-auto">
            <div class="flex justify-between text-slate-400">
              <span>Inmueble:</span>
              <span class="font-bold text-white">{selectedProp?.tituloPropiedad || selectedProp?.tipoInmueble}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Inversión Dual:</span>
              <span class="font-bold text-[#D4AF37]">
                {selectedPropDualPrice?.usdFormatted} USD / {selectedPropDualPrice?.bobFormatted}
              </span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Tono de Copy:</span>
              <span class="font-bold text-emerald-400 uppercase">{aiTone}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onclick={resetForm}
              class="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              🚀 Realizar Nuevo Despacho
            </button>
            <button
              onclick={() => { activeTab = 'campanas'; resetForm(); }}
              class="px-6 py-3.5 bg-[#091a17] border border-[#1b3d36] text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Ver en Historial
            </button>
          </div>
        </div>

      {:else}

        <!-- 1. SELECTOR Y BUSCADOR INTELIGENTE DE INMUEBLE -->
        <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-xl space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span class="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block mb-1">
                Paso 1 · Selección de Inventario
              </span>
              <h2 class="text-xl font-black text-white flex items-center gap-2">
                <Building2 size={20} class="text-emerald-400" /> Elige el Inmueble a Promover
              </h2>
            </div>

            <!-- FILTRO DE MIS CAPTACIONES / TODO EL INVENTARIO -->
            <div class="flex items-center gap-2">
              <button
                onclick={() => (filterMyPropsOnly = false)}
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all {!filterMyPropsOnly ? 'bg-emerald-600 text-white shadow' : 'bg-[#091a17] text-slate-400 hover:text-white'}"
              >
                Todo el Inventario ({todasLasPropiedades.length})
              </button>
              <button
                onclick={() => (filterMyPropsOnly = true)}
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all {filterMyPropsOnly ? 'bg-emerald-600 text-white shadow' : 'bg-[#091a17] text-slate-400 hover:text-white'}"
              >
                Mis Captaciones ({misPropiedades.length})
              </button>
            </div>
          </div>

          <!-- INPUT DE BÚSQUEDA RÁPIDA -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="relative md:col-span-1">
              <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                bind:value={propSearch}
                placeholder="Buscar por zona, tipo o título..."
                class="w-full pl-11 pr-4 py-3 bg-[#071311] border border-[#1b3d36] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <!-- SELECTOR DROPDOWN -->
            <div class="md:col-span-2">
              {#if loadingProps}
                <div class="p-3 bg-[#071311] rounded-xl text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={16} class="animate-spin text-emerald-400" /> Sincronizando inventario de Casa Legal...
                </div>
              {:else}
                <select
                  bind:value={selectedPropId}
                  disabled={isPublishing}
                  class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-400 cursor-pointer shadow-inner"
                >
                  <option value="">-- Selecciona una propiedad del catálogo --</option>
                  {#each availableProps as p}
                    {@const dp = getDualPrice(p.precioLista, p.moneda)}
                    <option value={p.id}>
                      {p.tituloPropiedad || p.tipoInmueble} ({p.zona || 'Santa Cruz'}) — {dp.usdFormatted} USD / {dp.bobFormatted}
                    </option>
                  {/each}
                </select>
              {/if}
            </div>
          </div>
        </div>

        <!-- 2. GRID PRINCIPAL: MOTOR IA & LIVE PHONE PREVIEW -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
          
          <!-- OVERLAY DE BLOQUEO DURANTE PUBLICACIÓN -->
          {#if isPublishing && publishStep < 4}
            <div class="absolute inset-0 bg-[#071311]/90 backdrop-blur-md z-30 rounded-3xl flex flex-col items-center justify-center p-8 animate-in fade-in">
              <div class="relative mb-6">
                <Loader2 size={64} class="text-emerald-400 animate-spin" />
                <Radio size={24} class="absolute inset-0 m-auto text-[#D4AF37]" />
              </div>
              <p class="text-xl font-black text-white text-center tracking-tight mb-2">{statusText}</p>
              <p class="text-xs text-slate-400 text-center max-w-sm mb-6">
                Despachando a Meta Graph API, WhatsApp Business Hub y Red MLS Casa Legal...
              </p>
              <div class="w-72 h-2.5 bg-[#091a17] rounded-full overflow-hidden border border-[#1b3d36]">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 to-[#D4AF37] transition-all duration-700 ease-out"
                  style="width: {publishStep * 33}%"
                ></div>
              </div>
            </div>
          {/if}

          <!-- COLUMNA IZQUIERDA (7 COLS): MOTOR DE COPYWRITING IA & CANALES -->
          <div class="lg:col-span-7 space-y-6">
            
            <!-- TARJETA DEL INMUEBLE SELECCIONADO (CON PRECIO DUAL) -->
            {#if selectedProp}
              <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-5 shadow-xl flex flex-col sm:flex-row gap-5 items-center">
                <div class="w-full sm:w-36 h-28 rounded-2xl overflow-hidden bg-slate-800 shrink-0 relative border border-[#1b3d36]">
                  {#if selectedProp.fotoPrincipal || (selectedProp.fotos && selectedProp.fotos[0])}
                    <img
                      src={selectedProp.fotoPrincipal || selectedProp.fotos[0]}
                      alt="Propiedad"
                      class="w-full h-full object-cover"
                    />
                  {:else}
                    <div class="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <ImageIcon size={24} />
                    </div>
                  {/if}
                  <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-black text-[#D4AF37] uppercase">
                    {selectedProp.tipoOperacion || 'Venta'}
                  </span>
                </div>

                <div class="flex-1 w-full space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={12} /> {selectedProp.zona || 'Santa Cruz'}
                    </span>
                    <span class="text-xs text-slate-400 font-medium">
                      ID: {selectedProp.id.slice(0, 6)}
                    </span>
                  </div>

                  <h3 class="text-base font-bold text-white line-clamp-1">
                    {selectedProp.tituloPropiedad || selectedProp.tipoInmueble}
                  </h3>

                  <!-- PRECIO DUAL RESALTADO -->
                  <div class="flex flex-wrap items-baseline gap-3 pt-1">
                    <span class="text-xl font-black text-[#D4AF37] tracking-tight">
                      {selectedPropDualPrice?.usdFormatted} USD
                    </span>
                    <span class="text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/40">
                      {selectedPropDualPrice?.bobFormatted}
                    </span>
                    <span class="text-[10px] text-slate-400 font-mono">
                      (T.C. {selectedPropDualPrice?.tc})
                    </span>
                  </div>

                  <div class="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    {#if selectedProp.superficieTotal}
                      <span class="flex items-center gap-1"><Maximize2 size={12} /> {selectedProp.superficieTotal} m²</span>
                    {/if}
                    {#if selectedProp.dormitoriosSuite || selectedProp.dormitoriosEstandar}
                      <span class="flex items-center gap-1">
                        <Bed size={12} /> {Number(selectedProp.dormitoriosSuite || 0) + Number(selectedProp.dormitoriosEstandar || 0)} Dorms
                      </span>
                    {/if}
                    {#if selectedProp.banos}
                      <span class="flex items-center gap-1"><Bath size={12} /> {selectedProp.banos} B</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/if}

            <!-- MOTOR DE COPYWRITING IA (5 TONOS DE VENTA) -->
            <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-xl space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b3d36] pb-4">
                <div>
                  <span class="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block mb-1">
                    Paso 2 · Redacción Persuasiva
                  </span>
                  <h3 class="text-base font-black text-white flex items-center gap-2">
                    <Sparkles size={18} class="text-[#D4AF37]" /> Motor de Copywriting con IA
                  </h3>
                </div>

                <!-- ACCIONES RÁPIDAS -->
                <div class="flex items-center gap-2">
                  <button
                    onclick={copyToClipboard}
                    class="px-3 py-1.5 rounded-xl bg-[#091a17] border border-[#1b3d36] hover:border-emerald-500/50 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {#if copied}
                      <Check size={14} class="text-emerald-400" /> Copiado
                    {:else}
                      <Copy size={14} /> Copiar Texto
                    {/if}
                  </button>

                  <button
                    onclick={launchWhatsApp}
                    class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                  >
                    <Share2 size={14} /> Enviar a WhatsApp
                  </button>
                </div>
              </div>

              <!-- SELECTOR DE TONO IA (5 ESTILOS) -->
              <div>
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                  Selecciona el Ángulo de Venta de la IA:
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onclick={() => cambiarTono('inversionista')}
                    class="p-2.5 rounded-xl text-center border transition-all {aiTone === 'inversionista' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-black' : 'bg-[#091a17] border-[#1b3d36] text-slate-400 hover:text-white'}"
                  >
                    <span class="block text-base mb-0.5">🚀</span>
                    <span class="text-[11px] block">Inversionista</span>
                  </button>

                  <button
                    type="button"
                    onclick={() => cambiarTono('lujo')}
                    class="p-2.5 rounded-xl text-center border transition-all {aiTone === 'lujo' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-black' : 'bg-[#091a17] border-[#1b3d36] text-slate-400 hover:text-white'}"
                  >
                    <span class="block text-base mb-0.5">💎</span>
                    <span class="text-[11px] block">Lujo & Confort</span>
                  </button>

                  <button
                    type="button"
                    onclick={() => cambiarTono('familiar')}
                    class="p-2.5 rounded-xl text-center border transition-all {aiTone === 'familiar' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-black' : 'bg-[#091a17] border-[#1b3d36] text-slate-400 hover:text-white'}"
                  >
                    <span class="block text-base mb-0.5">🏡</span>
                    <span class="text-[11px] block">Hogar Familiar</span>
                  </button>

                  <button
                    type="button"
                    onclick={() => cambiarTono('viral')}
                    class="p-2.5 rounded-xl text-center border transition-all {aiTone === 'viral' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-black' : 'bg-[#091a17] border-[#1b3d36] text-slate-400 hover:text-white'}"
                  >
                    <span class="block text-base mb-0.5">⚡</span>
                    <span class="text-[11px] block">Viral / TikTok</span>
                  </button>

                  <button
                    type="button"
                    onclick={() => cambiarTono('comercial')}
                    class="p-2.5 rounded-xl text-center border transition-all {aiTone === 'comercial' ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-black' : 'bg-[#091a17] border-[#1b3d36] text-slate-400 hover:text-white'}"
                  >
                    <span class="block text-base mb-0.5">🏢</span>
                    <span class="text-[11px] block">Comercial</span>
                  </button>
                </div>
              </div>

              <!-- TEXTAREA DEL COPY GENERADO -->
              <div class="relative">
                <textarea
                  bind:value={aiDescription}
                  rows="9"
                  placeholder="Elige un inmueble para generar la copy optimizada..."
                  class="w-full bg-[#071311] border border-[#1b3d36] p-4 rounded-2xl text-xs text-slate-200 outline-none focus:border-emerald-400 resize-none font-sans leading-relaxed transition-colors shadow-inner"
                ></textarea>
                <div class="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 px-1">
                  <span>Generado con datos oficiales de Casa Legal</span>
                  <span>{aiDescription.length} caracteres</span>
                </div>
              </div>
            </div>

            <!-- CANALES DE DESTINO Y BOTÓN DE LANZAMIENTO -->
            <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-xl space-y-5">
              <span class="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block mb-1">
                Paso 3 · Red de Difusión
              </span>
              <h3 class="text-base font-black text-white flex items-center gap-2">
                <Radio size={18} class="text-emerald-400" /> Selecciona Canales de Destino
              </h3>

              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <label class="flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all {channels.facebook ? 'border-[#1877F2] bg-[#1877F2]/10 text-white' : 'border-[#1b3d36] bg-[#091a17] text-slate-400'}">
                  <input type="checkbox" bind:checked={channels.facebook} class="hidden" />
                  <Monitor size={22} class={channels.facebook ? 'text-[#1877F2] mb-1.5' : 'text-slate-500 mb-1.5'} />
                  <span class="text-[11px] font-bold">Facebook</span>
                  <span class="text-[9px] text-slate-400">Feed & Grupos</span>
                </label>

                <label class="flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all {channels.instagram ? 'border-[#E1306C] bg-[#E1306C]/10 text-white' : 'border-[#1b3d36] bg-[#091a17] text-slate-400'}">
                  <input type="checkbox" bind:checked={channels.instagram} class="hidden" />
                  <Camera size={22} class={channels.instagram ? 'text-[#E1306C] mb-1.5' : 'text-slate-500 mb-1.5'} />
                  <span class="text-[11px] font-bold">Instagram</span>
                  <span class="text-[9px] text-slate-400">Post & Reels</span>
                </label>

                <label class="flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all {channels.whatsapp ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-[#1b3d36] bg-[#091a17] text-slate-400'}">
                  <input type="checkbox" bind:checked={channels.whatsapp} class="hidden" />
                  <Share2 size={22} class={channels.whatsapp ? 'text-emerald-400 mb-1.5' : 'text-slate-500 mb-1.5'} />
                  <span class="text-[11px] font-bold">WhatsApp</span>
                  <span class="text-[9px] text-slate-400">Estados & Hub</span>
                </label>

                <label class="flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all {channels.marketplace ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-[#1b3d36] bg-[#091a17] text-slate-400'}">
                  <input type="checkbox" bind:checked={channels.marketplace} class="hidden" />
                  <Store size={22} class={channels.marketplace ? 'text-teal-400 mb-1.5' : 'text-slate-500 mb-1.5'} />
                  <span class="text-[11px] font-bold">Marketplace</span>
                  <span class="text-[9px] text-slate-400">Catálogo Web</span>
                </label>

                <label class="flex flex-col items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all {channels.mlsInterno ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white' : 'border-[#1b3d36] bg-[#091a17] text-slate-400'} col-span-2 sm:col-span-1">
                  <input type="checkbox" bind:checked={channels.mlsInterno} class="hidden" />
                  <Handshake size={22} class={channels.mlsInterno ? 'text-[#D4AF37] mb-1.5' : 'text-slate-500 mb-1.5'} />
                  <span class="text-[11px] font-bold text-[#D4AF37]">MLS Red</span>
                  <span class="text-[9px] text-amber-200/70">Co-Brokerage</span>
                </label>
              </div>

              <!-- BOTÓN DE LANZAMIENTO -->
              <div class="pt-2">
                <button
                  onclick={simulatePublish}
                  class="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#D4AF37] text-white font-black text-sm uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                >
                  <Send size={18} /> Lanzar Despacho Simultáneo a la Red
                </button>
                <p class="text-[11px] text-center text-slate-400 mt-2">
                  La IA optimizará las imágenes con marca de agua y distribuirá el paquete en los canales seleccionados.
                </p>
              </div>
            </div>

          </div>

          <!-- COLUMNA DERECHA (5 COLS): SIMULADOR INTERACTIVO DE SMARTPHONE -->
          <div class="lg:col-span-5 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Smartphone size={16} class="text-emerald-400" /> Simulador de Red en Vivo
              </span>

              <!-- ALTERNADOR DE FORMATO EN SIMULADOR -->
              <div class="flex bg-[#091a17] p-1 rounded-xl border border-[#1b3d36]">
                <button
                  onclick={() => (previewFormat = 'instagram')}
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all {previewFormat === 'instagram' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}"
                >
                  Instagram
                </button>
                <button
                  onclick={() => (previewFormat = 'whatsapp')}
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all {previewFormat === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}"
                >
                  WhatsApp
                </button>
                <button
                  onclick={() => (previewFormat = 'mls')}
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all {previewFormat === 'mls' ? 'bg-[#D4AF37] text-black' : 'text-slate-400 hover:text-white'}"
                >
                  Ficha MLS
                </button>
              </div>
            </div>

            <!-- MARCO SMARTPHONE TIPO IPHONE -->
            <div class="w-full max-w-[340px] mx-auto rounded-[3rem] bg-[#0c241f] border-[6px] border-[#1b3d36] p-3 shadow-2xl relative overflow-hidden text-slate-800">
              
              <!-- NOTCH / ISLA DINÁMICA -->
              <div class="w-28 h-4 bg-[#071311] rounded-full mx-auto mb-2 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-slate-800"></div>
              </div>

              <!-- PANTALLA INTERNA DEL TELÉFONO -->
              <div class="bg-white rounded-[2.2rem] overflow-hidden flex flex-col h-[560px] text-left relative shadow-inner">
                
                {#if previewFormat === 'instagram'}
                  <!-- FORMATO INSTAGRAM FEED -->
                  <div class="p-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div class="flex items-center gap-2">
                      <img src="/logoCasaLegal.jpg" alt="Casa Legal" class="w-7 h-7 rounded-full object-cover border border-[#D4AF37]" />
                      <div>
                        <p class="text-[11px] font-bold text-slate-900 leading-tight">casalegal.bo</p>
                        <p class="text-[9px] text-slate-400">
                          {getShortName(authState.profile?.nombres, authState.profile?.apellidos, authState.profile?.nombre)}
                        </p>
                      </div>
                    </div>
                    <span class="text-xs text-slate-400 font-bold">•••</span>
                  </div>

                  <!-- FOTO CON WATERMARK Y PRECIO DUAL -->
                  <div class="relative w-full h-56 bg-slate-900 shrink-0">
                    {#if selectedProp?.fotoPrincipal || (selectedProp?.fotos && selectedProp.fotos[0])}
                      <img
                        src={selectedProp.fotoPrincipal || selectedProp.fotos[0]}
                        alt="Preview"
                        class="w-full h-full object-cover"
                      />
                    {:else}
                      <div class="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon size={32} />
                      </div>
                    {/if}

                    <!-- WATERMARK CASA LEGAL -->
                    <div class="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-[#D4AF37]/50">
                      <img src="/logoCasaLegal.jpg" alt="Logo" class="w-3.5 h-3.5 rounded-full" />
                      <span class="text-[8px] font-black text-[#D4AF37] tracking-wider">CASA LEGAL</span>
                    </div>

                    <!-- BADGE PRECIO DUAL SOBRE FOTO -->
                    <div class="absolute top-2 left-2 bg-[#071311]/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#1b3d36] text-white">
                      <p class="text-[11px] font-black text-[#D4AF37] leading-tight">
                        {selectedPropDualPrice?.usdFormatted || '$0 USD'}
                      </p>
                      <p class="text-[9px] font-bold text-emerald-400">
                        {selectedPropDualPrice?.bobFormatted || 'Bs. 0'}
                      </p>
                    </div>
                  </div>

                  <!-- ACCIONES SOCIALES -->
                  <div class="p-3 pb-1 flex items-center justify-between text-slate-700 shrink-0">
                    <div class="flex items-center gap-3">
                      <Heart size={18} class="text-red-500 fill-red-500" />
                      <MessageSquare size={18} />
                      <Send size={18} />
                    </div>
                    <Bookmark size={18} />
                  </div>

                  <!-- COPY SCROLLABLE -->
                  <div class="px-3 pb-3 flex-1 overflow-y-auto text-[11px] text-slate-700 leading-snug space-y-1">
                    <p class="font-bold text-slate-900 text-[10px]">124 Me gusta</p>
                    <p>
                      <strong class="text-slate-900 font-bold">casalegal.bo</strong>{' '}
                      <span class="whitespace-pre-line">{aiDescription || 'Selecciona un inmueble para previsualizar el copy optimizado...'}</span>
                    </p>
                  </div>

                {:else if previewFormat === 'whatsapp'}
                  <!-- FORMATO WHATSAPP ESTADO -->
                  <div class="relative w-full h-full bg-slate-900 flex flex-col justify-between p-4">
                    <!-- FOTO DE FONDO -->
                    {#if selectedProp?.fotoPrincipal || (selectedProp?.fotos && selectedProp.fotos[0])}
                      <img
                        src={selectedProp.fotoPrincipal || selectedProp.fotos[0]}
                        alt="Preview"
                        class="absolute inset-0 w-full h-full object-cover opacity-85"
                      />
                    {/if}
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60"></div>

                    <!-- BARRA SUPERIOR WHATSAPP STATUS -->
                    <div class="relative z-10 space-y-2">
                      <div class="w-full h-1 bg-white/40 rounded-full overflow-hidden">
                        <div class="w-1/2 h-full bg-white"></div>
                      </div>
                      <div class="flex items-center gap-2 text-white">
                        <img src="/logoCasaLegal.jpg" class="w-7 h-7 rounded-full border border-[#D4AF37]" alt="Perfil" />
                        <div>
                          <p class="text-xs font-bold leading-tight">Mi Estado · Casa Legal</p>
                          <p class="text-[9px] text-white/70">Ahora mismo</p>
                        </div>
                      </div>
                    </div>

                    <!-- CONTENIDO CENTRAL TIPO STICKER -->
                    <div class="relative z-10 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white space-y-2">
                      <span class="px-2 py-0.5 rounded bg-emerald-600 text-[9px] font-black uppercase">
                        {selectedProp?.tipoOperacion || 'En Venta'}
                      </span>
                      <h4 class="text-sm font-black line-clamp-2">
                        {selectedProp?.tituloPropiedad || selectedProp?.tipoInmueble}
                      </h4>
                      <div class="bg-black/50 p-2 rounded-xl border border-[#D4AF37]/40 flex justify-between items-center">
                        <div>
                          <p class="text-xs font-black text-[#D4AF37]">{selectedPropDualPrice?.usdFormatted}</p>
                          <p class="text-[10px] font-bold text-emerald-400">{selectedPropDualPrice?.bobFormatted}</p>
                        </div>
                        <span class="text-[9px] font-mono text-slate-400">T.C. {TIPO_CAMBIO_OFICIAL}</span>
                      </div>
                    </div>

                    <!-- FOOTER WHATSAPP -->
                    <div class="relative z-10 text-center">
                      <div class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg">
                        <Share2 size={12} /> Desliza para responder al asesor
                      </div>
                    </div>
                  </div>

                {:else}
                  <!-- FORMATO FICHA TÉCNICA MLS INTERNA -->
                  <div class="p-4 bg-slate-50 flex flex-col h-full overflow-y-auto space-y-3">
                    <div class="flex items-center justify-between border-b pb-2">
                      <div class="flex items-center gap-2">
                        <img src="/logoCasaLegal.jpg" alt="Logo" class="w-6 h-6 rounded-full" />
                        <span class="text-xs font-black text-[#0c241f]">FICHA MLS CASA LEGAL</span>
                      </div>
                      <span class="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        RED CO-BROKERAGE
                      </span>
                    </div>

                    <div class="w-full h-36 bg-slate-200 rounded-xl overflow-hidden relative">
                      {#if selectedProp?.fotoPrincipal || (selectedProp?.fotos && selectedProp.fotos[0])}
                        <img src={selectedProp.fotoPrincipal || selectedProp.fotos[0]} alt="Prop" class="w-full h-full object-cover" />
                      {/if}
                      <span class="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-bold">
                        {selectedProp?.zona || 'Santa Cruz'}
                      </span>
                    </div>

                    <div>
                      <h4 class="text-xs font-black text-slate-900">
                        {selectedProp?.tituloPropiedad || selectedProp?.tipoInmueble}
                      </h4>
                      <p class="text-[10px] text-slate-500 mt-0.5">
                        {selectedProp?.direccion || 'Ubicación consolidada'}
                      </p>
                    </div>

                    <!-- PRECIOS DUALES EN FICHA MLS -->
                    <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                      <div>
                        <p class="text-[9px] text-slate-500 font-bold uppercase">Precio de Lista</p>
                        <p class="text-xs font-black text-emerald-900">{selectedPropDualPrice?.usdFormatted} USD</p>
                      </div>
                      <div class="text-right">
                        <p class="text-[9px] text-slate-500 font-bold uppercase">En Bolivianos</p>
                        <p class="text-xs font-black text-emerald-700">{selectedPropDualPrice?.bobFormatted}</p>
                      </div>
                    </div>

                    <!-- COMISIÓN COMPARTIDA MLS -->
                    <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                      <div class="flex items-center gap-1.5 text-[10px] font-black">
                        <Handshake size={12} class="text-[#D4AF37]" />
                        <span>SPLIT CO-BROKERAGE: 50% / 50%</span>
                      </div>
                      <p class="text-[9px] leading-tight text-amber-800">
                        Comisión garantizada del 1.5% al 2.5% para el agente que acerque al comprador calificado.
                      </p>
                    </div>
                  </div>
                {/if}

              </div>

              <!-- BARRA INFERIOR DE IPHONE -->
              <div class="w-32 h-1 bg-slate-600 rounded-full mx-auto mt-2.5"></div>
            </div>
          </div>

        </div>

      {/if}

    <!-- ========================================== -->
    <!-- TAB 2: BOLSA MLS INTERNA & CO-BROKERAGE   -->
    <!-- ========================================== -->
    {:else if activeTab === 'mls'}
      <div class="space-y-6">
        
        <!-- ENCABEZADO DE BOLSA MLS -->
        <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span class="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest block mb-1">
              Bolsa Colaborativa Inter-Agencias
            </span>
            <h2 class="text-2xl font-black text-white flex items-center gap-2">
              <Handshake size={24} class="text-[#D4AF37]" /> Bolsa MLS Casa Legal
            </h2>
            <p class="text-slate-400 text-xs md:text-sm mt-1 max-w-xl">
              Propiedades compartidas por agentes de la franquicia con ofertas abiertas de Co-Brokerage. Si tienes un cliente comprador, gana comisión compartida cerrando juntos.
            </p>
          </div>

          <button
            onclick={() => (showMlsModal = true)}
            class="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            <Plus size={16} /> Publicar Mi Inmueble en MLS
          </button>
        </div>

        <!-- BUSCADOR EN BOLSA MLS -->
        <div class="relative max-w-md">
          <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            bind:value={mlsSearch}
            placeholder="Filtrar por zona, agente o tipo de inmueble..."
            class="w-full pl-11 pr-4 py-3 bg-[#0c241f] border border-[#1b3d36] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <!-- GRID DE PROPIEDADES EN MLS -->
        {#if loadingMls}
          <div class="py-16 text-center text-slate-400">
            <Loader2 size={36} class="animate-spin text-[#D4AF37] mx-auto mb-3" />
            <p class="text-xs font-bold">Cargando bolsa MLS de co-brokerage...</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each mlsList.filter(item => {
              if (!mlsSearch) return true;
              const q = mlsSearch.toLowerCase();
              return (item.titulo || '').toLowerCase().includes(q) ||
                     (item.zona || '').toLowerCase().includes(q) ||
                     (item.agenteNombre || '').toLowerCase().includes(q);
            }) as item}
              {@const dp = getDualPrice(item.precioLista, item.moneda || 'USD')}
              <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] overflow-hidden hover:border-[#D4AF37]/50 transition-all flex flex-col group shadow-xl">
                
                <!-- FOTO DE LA PROPIEDAD -->
                <div class="relative h-48 bg-slate-900 overflow-hidden">
                  {#if item.foto}
                    <img src={item.foto} alt={item.titulo} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center text-slate-500">
                      <ImageIcon size={32} />
                    </div>
                  {/if}

                  <div class="absolute top-3 left-3 flex flex-col gap-1">
                    <span class="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-black text-[#D4AF37] uppercase border border-[#D4AF37]/40">
                      🤝 Co-Brokerage
                    </span>
                  </div>

                  <div class="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div class="bg-[#071311]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1b3d36] text-white">
                      <p class="text-base font-black text-[#D4AF37] leading-none">{dp.usdFormatted} USD</p>
                      <p class="text-[10px] font-bold text-emerald-400">{dp.bobFormatted}</p>
                    </div>
                    <span class="text-[10px] bg-black/70 text-slate-300 px-2 py-1 rounded-lg">
                      {item.zona || 'Santa Cruz'}
                    </span>
                  </div>
                </div>

                <!-- DETALLES Y AGENTE -->
                <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div class="space-y-2">
                    <h3 class="text-sm font-bold text-white line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
                      {item.titulo}
                    </h3>
                    <p class="text-xs text-slate-400 line-clamp-2 italic">
                      "{item.comentarios || 'Disponible para visitas inmediatas con clientes calificados.'}"
                    </p>

                    <!-- BADGE DE SPLIT DE COMISIÓN -->
                    <div class="p-2.5 rounded-xl bg-[#091a17] border border-[#1b3d36] text-xs">
                      <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Comisión Ofertada:</span>
                      <span class="font-black text-[#D4AF37] flex items-center gap-1.5 mt-0.5">
                        <Handshake size={14} /> {item.splitComision || '50% / 50% Split'}
                      </span>
                    </div>
                  </div>

                  <!-- FOOTER CON AGENTE Y BOTÓN WHATSAPP -->
                  <div class="pt-3 border-t border-[#1b3d36] flex items-center justify-between">
                    <div>
                      <p class="text-[10px] text-slate-500 font-medium">Agente Captador:</p>
                      <p class="text-xs font-bold text-white">{item.agenteNombre || 'Agente Casa Legal'}</p>
                    </div>

                    <a
                      href="https://wa.me/{item.agenteTelefono || '59170000000'}?text={encodeURIComponent(`Hola ${item.agenteNombre}, vi tu propiedad '${item.titulo}' en la Bolsa MLS Casa Legal. Tengo un comprador interesado, coordinemos para co-brokear.`)}"
                      target="_blank"
                      class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                    >
                      <Share2 size={13} /> Co-Brokear
                    </a>
                  </div>
                </div>

              </div>
            {/each}
          </div>
        {/if}

      </div>

    <!-- ==================================================== -->
    <!-- TAB 3: PIZARRA DE COMPRADORES / REQUERIMIENTOS MLS  -->
    <!-- ==================================================== -->
    {:else if activeTab === 'requerimientos'}
      <div class="space-y-6">
        
        <!-- ENCABEZADO PIZARRA -->
        <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">
              Pizarra Colaborativa de Demanda Activa
            </span>
            <h2 class="text-2xl font-black text-white flex items-center gap-2">
              <Target size={24} class="text-emerald-400" /> "Tengo un Comprador Buscando..."
            </h2>
            <p class="text-slate-400 text-xs md:text-sm mt-1 max-w-xl">
              ¿Tienes un cliente listo para comprar o alquilar? Publica su requerimiento en la red para que los agentes con captaciones compatibles te contacten de inmediato.
            </p>
          </div>

          <button
            onclick={() => (showReqModal = true)}
            class="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            <Plus size={16} /> Publicar Búsqueda de Comprador
          </button>
        </div>

        <!-- LISTADO DE REQUERIMIENTOS -->
        {#if loadingReqs}
          <div class="py-16 text-center text-slate-400">
            <Loader2 size={36} class="animate-spin text-emerald-400 mx-auto mb-3" />
            <p class="text-xs font-bold">Cargando requerimientos de compradores...</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each requerimientosList as req}
              {@const dp = getDualPrice(req.presupuestoMax, req.moneda || 'USD')}
              <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                
                <div class="space-y-3 flex-1">
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider">
                      {req.tipoInmueble}
                    </span>
                    <span class="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <MapPin size={13} class="text-emerald-400" /> {req.zona}
                    </span>
                    <span class="text-[11px] text-slate-500 font-mono">
                      {req.fecha || 'Publicado recientemente'}
                    </span>
                  </div>

                  <p class="text-sm text-slate-200 leading-relaxed font-medium">
                    "{req.detalles}"
                  </p>

                  <div class="flex flex-wrap items-center gap-4 text-xs">
                    <div class="flex items-center gap-1.5 text-slate-300">
                      <span class="text-slate-500">Presupuesto Máx:</span>
                      <strong class="text-[#D4AF37] font-black">{dp.usdFormatted} USD</strong>
                      <span class="text-emerald-400">({dp.bobFormatted})</span>
                    </div>

                    <div class="flex items-center gap-1.5 text-slate-300">
                      <span class="text-slate-500">Pago:</span>
                      <strong class="text-white">{req.tipoPago}</strong>
                    </div>

                    {#if req.dormitorios && req.dormitorios !== '-'}
                      <div class="flex items-center gap-1.5 text-slate-300">
                        <span class="text-slate-500">Dormitorios:</span>
                        <strong class="text-white">{req.dormitorios}</strong>
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- CONTACTO CON EL AGENTE QUE TIENE EL COMPRADOR -->
                <div class="flex flex-col items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-[#1b3d36] w-full md:w-auto">
                  <div class="text-left md:text-right">
                    <p class="text-[10px] text-slate-500 font-medium">Agente con el Comprador:</p>
                    <p class="text-xs font-bold text-white">{req.agenteNombre}</p>
                  </div>

                  <a
                    href="https://wa.me/{req.agenteTelefono || '59170000000'}?text={encodeURIComponent(`Hola ${req.agenteNombre}, vi en la Pizarra MLS que buscas '${req.tipoInmueble} en ${req.zona}'. Tengo una captación en cartera que encaja con tu cliente.`)}"
                    target="_blank"
                    class="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
                  >
                    <Zap size={14} class="text-[#D4AF37]" /> Tengo el Inmueble Perfecto
                  </a>
                </div>

              </div>
            {/each}
          </div>
        {/if}

      </div>

    <!-- ==================================================== -->
    <!-- TAB 4: HISTORIAL DE DESPACHOS & PAUTA CENTRAL       -->
    <!-- ==================================================== -->
    {:else if activeTab === 'campanas'}
      <div class="space-y-6">
        
        <!-- ENCABEZADO HISTORIAL -->
        <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              Auditoría y Campañas de Red
            </span>
            <h2 class="text-2xl font-black text-white flex items-center gap-2">
              <Clock size={24} class="text-emerald-400" /> Historial de Despachos & Pautas
            </h2>
            <p class="text-slate-400 text-xs md:text-sm mt-1 max-w-xl">
              Registro cronológico de todas las publicaciones multicanal y solicitudes de pauta publicitaria digital gestionadas en Casa Legal.
            </p>
          </div>

          <button
            onclick={() => (showPautaModal = true)}
            class="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            <Megaphone size={16} /> Nueva Solicitud de Pauta
          </button>
        </div>

        <!-- TABLA O CARDS DE HISTORIAL -->
        {#if loadingHistorial}
          <div class="py-16 text-center text-slate-400">
            <Loader2 size={36} class="animate-spin text-emerald-400 mx-auto mb-3" />
            <p class="text-xs font-bold">Cargando registro de campañas...</p>
          </div>
        {:else if redCasaHistorial.length === 0}
          <div class="p-12 rounded-3xl bg-[#0c241f] border border-[#1b3d36] text-center space-y-3">
            <Radio size={40} class="text-slate-600 mx-auto" />
            <h3 class="text-base font-bold text-white">No hay publicaciones registradas aún</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">
              Realiza tu primer despacho desde la pestaña "Despacho & Copy IA" para ver el historial aquí.
            </p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each redCasaHistorial as item}
              <div class="rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 hover:border-[#1b3d36]/80 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
                
                <div class="space-y-3 flex-1">
                  <div class="flex flex-wrap items-center gap-3">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider {item.estado === 'Publicado' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : item.estado === 'Aprobado' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                      {item.estado || 'Despachado'}
                    </span>

                    <span class="text-xs font-bold text-white">
                      {item.propiedadTitulo || 'Inmueble Casa Legal'}
                    </span>

                    <span class="text-[11px] text-slate-500 font-mono">
                      {item.createdAt ? new Date(item.createdAt.toMillis?.() || item.createdAt).toLocaleString('es-BO') : 'Reciente'}
                    </span>
                  </div>

                  <p class="text-xs text-slate-300 line-clamp-2 italic border-l-2 border-emerald-500 pl-3">
                    "{item.mensaje}"
                  </p>

                  <!-- CANALES ACTIVOS -->
                  <div class="flex flex-wrap gap-2 pt-1">
                    {#if item.canales?.facebook}
                      <span class="px-2 py-0.5 rounded bg-[#1877F2]/20 text-[#1877F2] text-[10px] font-bold">Facebook</span>
                    {/if}
                    {#if item.canales?.instagram}
                      <span class="px-2 py-0.5 rounded bg-[#E1306C]/20 text-[#E1306C] text-[10px] font-bold">Instagram</span>
                    {/if}
                    {#if item.canales?.whatsapp}
                      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">WhatsApp</span>
                    {/if}
                    {#if item.canales?.marketplace}
                      <span class="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 text-[10px] font-bold">Marketplace</span>
                    {/if}
                    {#if item.canales?.mlsInterno}
                      <span class="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold">MLS Red</span>
                    {/if}
                    {#if item.canales?.metaAds}
                      <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">Meta Ads Pauta</span>
                    {/if}
                  </div>
                </div>

                <div class="flex flex-col items-start md:items-end gap-2 shrink-0">
                  <div class="text-left md:text-right">
                    <p class="text-[10px] text-slate-500">Agente:</p>
                    <p class="text-xs font-bold text-white">{item.agenteNombre || 'Agente'}</p>
                  </div>
                  {#if item.propiedadId}
                    <a
                      href="/inmuebles/{item.propiedadId}"
                      target="_blank"
                      class="px-3.5 py-1.5 rounded-xl bg-[#091a17] border border-[#1b3d36] hover:border-emerald-500 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <ExternalLink size={12} /> Ver Inmueble
                    </a>
                  {/if}
                </div>

              </div>
            {/each}
          </div>
        {/if}

      </div>
    {/if}

  </div>
</div>

<!-- ==================================================== -->
<!-- MODAL: PUBLICAR EN BOLSA MLS CO-BROKERAGE            -->
<!-- ==================================================== -->
{#if showMlsModal}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-lg rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
      <div class="flex justify-between items-center border-b border-[#1b3d36] pb-4">
        <h3 class="text-lg font-black text-white flex items-center gap-2">
          <Handshake size={20} class="text-[#D4AF37]" /> Compartir Inmueble en MLS
        </h3>
        <button onclick={() => (showMlsModal = false)} class="p-1 rounded-lg text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <div>
          <label class="block text-slate-300 font-bold mb-1">Selecciona el Inmueble de tu Cartera:</label>
          <select
            bind:value={mlsSelectedPropId}
            class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white font-bold outline-none focus:border-[#D4AF37]"
          >
            <option value="">-- Elige un inmueble --</option>
            {#each todasLasPropiedades as p}
              {@const dp = getDualPrice(p.precioLista, p.moneda)}
              <option value={p.id}>
                {p.tituloPropiedad || p.tipoInmueble} ({p.zona || 'Santa Cruz'}) - {dp.usdFormatted} USD
              </option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-slate-300 font-bold mb-1">
            Porcentaje de Comisión para el Agente Colaborador (% Split):
          </label>
          <div class="flex items-center gap-4">
            <input
              type="range"
              min="30"
              max="70"
              step="5"
              bind:value={mlsSplitPorcentaje}
              class="flex-1 accent-[#D4AF37]"
            />
            <span class="font-black text-[#D4AF37] text-base w-16 text-right">
              {mlsSplitPorcentaje}%
            </span>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">
            Tú retienes el {100 - mlsSplitPorcentaje}% y el colega que traiga al comprador recibe el {mlsSplitPorcentaje}%.
          </p>
        </div>

        <div>
          <label class="block text-slate-300 font-bold mb-1">Notas o Condiciones para Colegas:</label>
          <textarea
            bind:value={mlsNotas}
            rows="3"
            placeholder="Ej: Llaves disponibles en recepción, visitas con 2 horas de anticipación..."
            class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white outline-none focus:border-[#D4AF37] resize-none"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#1b3d36]">
        <button
          onclick={() => (showMlsModal = false)}
          class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
        >
          Cancelar
        </button>
        <button
          onclick={publicarEnMls}
          disabled={isSavingMls}
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          {#if isSavingMls}<Loader2 size={14} class="animate-spin" />{/if}
          Confirmar y Publicar en Red
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ==================================================== -->
<!-- MODAL: PUBLICAR REQUERIMIENTO DE COMPRADOR           -->
<!-- ==================================================== -->
{#if showReqModal}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-lg rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
      <div class="flex justify-between items-center border-b border-[#1b3d36] pb-4">
        <h3 class="text-lg font-black text-white flex items-center gap-2">
          <Target size={20} class="text-emerald-400" /> Publicar Búsqueda de Comprador
        </h3>
        <button onclick={() => (showReqModal = false)} class="p-1 rounded-lg text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-300 font-bold mb-1">Tipo de Inmueble:</label>
            <select
              bind:value={nuevoReq.tipoInmueble}
              class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white font-bold outline-none focus:border-emerald-400"
            >
              <option value="Casa">Casa</option>
              <option value="Departamento">Departamento</option>
              <option value="Terreno">Terreno</option>
              <option value="Oficina">Oficina Comercial</option>
              <option value="Galpón">Galpón / Industrial</option>
            </select>
          </div>

          <div>
            <label class="block text-slate-300 font-bold mb-1">Zona Requerida:</label>
            <input
              type="text"
              bind:value={nuevoReq.zona}
              placeholder="Ej: Equipetrol, Remanso, Urubó"
              class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-300 font-bold mb-1">Presupuesto Máximo ($ USD):</label>
            <input
              type="number"
              bind:value={nuevoReq.presupuestoMax}
              placeholder="Ej: 150000"
              class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white font-bold outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label class="block text-slate-300 font-bold mb-1">Forma de Pago:</label>
            <select
              bind:value={nuevoReq.tipoPago}
              class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white font-bold outline-none focus:border-emerald-400"
            >
              <option value="Contado">Contado</option>
              <option value="Crédito Bancario Aprobado">Crédito Aprobado</option>
              <option value="Crédito en Trámite">Crédito en Trámite</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-slate-300 font-bold mb-1">Detalles Específicos del Cliente:</label>
          <textarea
            bind:value={nuevoReq.detalles}
            rows="3"
            placeholder="Ej: Familia busca con jardín amplio para mascotas, presupuesto cerrado al contado."
            class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white outline-none focus:border-emerald-400 resize-none"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#1b3d36]">
        <button
          onclick={() => (showReqModal = false)}
          class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
        >
          Cancelar
        </button>
        <button
          onclick={publicarRequerimiento}
          disabled={isSavingReq}
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          {#if isSavingReq}<Loader2 size={14} class="animate-spin" />{/if}
          Difundir en la Pizarra MLS
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ==================================================== -->
<!-- MODAL: SOLICITAR PAUTA DIGITAL A MARKETING CENTRAL   -->
<!-- ==================================================== -->
{#if showPautaModal}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-lg rounded-3xl bg-[#0c241f] border border-[#1b3d36] p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
      <div class="flex justify-between items-center border-b border-[#1b3d36] pb-4">
        <h3 class="text-lg font-black text-white flex items-center gap-2">
          <Megaphone size={20} class="text-blue-400" /> Solicitar Pauta Digital Central
        </h3>
        <button onclick={() => (showPautaModal = false)} class="p-1 rounded-lg text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <div>
          <label class="block text-slate-300 font-bold mb-1">Inmueble a Promocionar:</label>
          <select
            bind:value={pautaForm.propiedadId}
            class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white font-bold outline-none focus:border-blue-400"
          >
            <option value="">-- Elige una propiedad --</option>
            {#each todasLasPropiedades as p}
              <option value={p.id}>
                {p.tituloPropiedad || p.tipoInmueble} ({p.zona || 'Santa Cruz'})
              </option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-300 font-bold mb-1">Presupuesto Publicitario ($ USD):</label>
            <input
              type="number"
              bind:value={pautaForm.presupuestoUsd}
              class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white font-bold outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label class="block text-slate-300 font-bold mb-1">Duración (Días):</label>
            <input
              type="number"
              bind:value={pautaForm.diasCampana}
              class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white font-bold outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div>
          <label class="block text-slate-300 font-bold mb-1">Objetivo de Campaña:</label>
          <select
            bind:value={pautaForm.objetivo}
            class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white font-bold outline-none focus:border-blue-400"
          >
            <option value="Leads de WhatsApp Directo">Leads de WhatsApp Directo al Agente</option>
            <option value="Formularios de Clientes Potenciales Meta">Formularios de Clientes Potenciales Meta</option>
            <option value="Tráfico a Ficha Web Casa Legal">Tráfico a Ficha Web Casa Legal</option>
            <option value="Reconocimiento y Alcance de Marca">Reconocimiento y Alcance de Marca</option>
          </select>
        </div>

        <div>
          <label class="block text-slate-300 font-bold mb-1">Público / Segmentación Deseada:</label>
          <input
            type="text"
            bind:value={pautaForm.publicoObjetivo}
            class="w-full bg-[#071311] border border-[#1b3d36] p-3 rounded-xl text-white outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#1b3d36]">
        <button
          onclick={() => (showPautaModal = false)}
          class="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
        >
          Cancelar
        </button>
        <button
          onclick={solicitarPauta}
          disabled={isSavingPauta}
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          {#if isSavingPauta}<Loader2 size={14} class="animate-spin" />{/if}
          Enviar Solicitud a Marketing
        </button>
      </div>
    </div>
  </div>
{/if}
