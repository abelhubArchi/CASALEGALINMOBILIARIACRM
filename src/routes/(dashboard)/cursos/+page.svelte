<script>
  import {
    GraduationCap,
    BookOpen,
    Clock,
    ArrowLeft,
    Star,
    Heart,
    Share2,
    Rocket,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Award,
    Sparkles,
    Home,
    Building2,
    Megaphone,
    Target,
    Users,
    ShieldCheck,
    Compass,
    FileText,
    Check,
    ArrowRight,
    Zap,
    Trophy,
    Crown,
    ExternalLink,
    Search,
    BookMarked,
    Lightbulb,
    Flame,
    Radio,
    Handshake,
    DollarSign,
    Calculator
  } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { TIPO_CAMBIO_OFICIAL } from '#lib/currency';

  // Modos de vista: 'list' (Catálogo de Cursos) o 'course' (Visor del Curso Maestro)
  let viewMode = $state('list');
  let activeCategory = $state('todos');
  let searchQuery = $state('');

  // Lección activa del Curso Maestro (0 a 7)
  let activeLessonIndex = $state(0);
  let completedLessons = $state(new Set([0]));
  let likedCourses = $state(new Set());
  let copiedLinkToast = $state(false);

  // Lecciones del Curso Predeterminado Maestro de Casa Legal CRM
  const crmLessons = [
    {
      id: 'modulo-1',
      num: 1,
      title: 'Casa de Mando: Tu Cuartel General',
      subtitle: 'Resumen ejecutivo, saludo por horario, T.C. Real (11.86 Bs) y Landing Page',
      icon: Rocket,
      duration: '4 min',
      badge: 'Inicio Clave',
      objectives: [
        'Conocer el panel de bienvenida con saludo adaptativo por horario.',
        'Supervisar la cotización real del dólar en Bolivia (11.86 Bs / USD).',
        'Obtener y compartir tu Landing Page personal para captar prospectos.',
        'Monitorear comunicados urgentes de la administración.'
      ],
      content: `
### 1. ¿Qué es la Casa de Mando?
La **Casa de Mando** es la primera pantalla que se despliega al ingresar al CRM. Diseñada como tu centro de control diario, te brinda una visión panorámica y en tiempo real de tu actividad inmobiliaria sin necesidad de navegar por múltiples menús.

### 2. Saludo Inteligente & Datos Ejecutivos
- **Saludo por Horario:** El sistema te recibe automáticamente con *"Buenos días"*, *"Buenas tardes"* o *"Buenas noches"* reconociendo tu nombre de asesor franquiciado.
- **Dólar Real de Mercado (11.86 Bs / USD):** Sincronizado para que conozcas la paridad cambiaria real que manejan compradores y propietarios en el mercado boliviano actual.
- **Mis Inmuebles Activos:** El número total de propiedades que has captado y que se encuentran disponibles para la venta o alquiler.
- **Impacto de Marketing:** Contador auditado de clientes que han visualizado tus propiedades y prospectos (leads) que hicieron clic para iniciar conversación directa por WhatsApp.

### 3. Tu Landing Page Pública de Asesor
Cada agente de Casa Legal cuenta con un sitio web personal único generado automáticamente en la ruta \`/agente/[tu-id]\`.
- **¿Para qué sirve?** Es tu tarjeta de presentación digital con tu foto profesional, número de WhatsApp directo, biografía y tu catálogo de propiedades asignadas.
- **Cómo usarla:** En la Casa de Mando haz clic en **"Copiar Mi Link"**. Pégalo en tu biografía de Instagram, en tu perfil de Facebook o en tus estados de WhatsApp.
      `,
      tip: 'Revisa tu Casa de Mando al iniciar cada mañana para verificar nuevos leads y consultar el inventario recién captado.',
      routeLink: '/',
      routeLabel: 'Ir a Casa de Mando'
    },
    {
      id: 'modulo-2',
      num: 2,
      title: 'Inventario Casa & Búsqueda Avanzada',
      subtitle: 'Explora toda la red de propiedades de la franquicia con precios duales',
      icon: Building2,
      duration: '5 min',
      badge: 'Catálogo Red',
      objectives: [
        'Aprender a buscar propiedades con filtros específicos en segundos.',
        'Visualizar precios duales en $ USD y Bs. al tipo de cambio real de 11.86.',
        'Revisar la ficha técnica, fotos HD y geolocalización en mapa.',
        'Conectar inmuebles de colegas mediante la Casa de Matches.'
      ],
      content: `
### 1. El Poder de la Red Compartida
Una de las mayores ventajas de pertenecer a Casa Legal es que **nunca tienes las manos vacías**. Aunque seas nuevo y tengas pocas captaciones propias, tienes acceso instantáneo a **todo el inventario colectivo de la franquicia**.

### 2. Filtros Inteligentes y Precios Duales
En **Inventario Casa** puedes filtrar el catálogo mediante criterios precisos:
- **Precios Duales:** Cada tarjeta exhibe automáticamente su valor en **$ USD** y su contravalor en **Bolivianos (Bs.)** calculado con el tipo de cambio real de **11.86 Bs/USD**.
- **Tipo de Operación:** Venta, Alquiler, Anticrético o Traspaso.
- **Tipo de Inmueble:** Casas, Departamentos, Terrenos/Lotes, Penthouse, Locales Comerciales, Edificios y Galpones.
- **Buscador por Texto:** Escribe la zona (ej. *Equipetrol*, *Zona Norte*, *Urubó*) o palabras clave del título.

### 3. Conectar con "Casa de Matches"
Si un cliente te pide una casa y encuentras una opción perfecta captada por otro asesor de Casa Legal, pulsa el botón **"Conectar Propiedad"** para añadirla a tu lista de matches y coordinar una visita compartida.
      `,
      tip: 'Cuando un cliente te consulte por un tipo de inmueble que no tienes, nunca digas "no tengo". Abre Inventario Casa y encuentra la opción ideal en la red.',
      routeLink: '/inventario',
      routeLabel: 'Explorar Inventario'
    },
    {
      id: 'modulo-3',
      num: 3,
      title: 'Captación Profesional en 4 Pasos',
      subtitle: 'Proceso estandarizado para registrar inmuebles de alto valor',
      icon: Compass,
      duration: '6 min',
      badge: '+45 PTS Score',
      objectives: [
        'Dominar los 4 pasos del formulario de publicación.',
        'Comprender la importancia de la representación en Exclusiva.',
        'Geolocalizar con pin interactivo en Google Maps y subir fotos de alta calidad.'
      ],
      content: `
### 1. El Flujo de Captación Oficial
Para registrar un nuevo inmueble debes ingresar a **Subir Inmueble** (\`/inmuebles/nuevo\`). El sistema te guiará en un asistente de 4 pasos diseñado para cumplir con los estándares jurídicos y comerciales de Casa Legal:

#### Paso 1: Datos Básicos & Comerciales
- **Datos del Propietario:** Nombre, CI y teléfono de contacto (estrictamente confidencial).
- **Tipo de Representación:** Selecciona **"Exclusiva"** si el propietario firmó el contrato de exclusividad con Casa Legal (otorga **+30 PTS** de score), o "No exclusiva / Abierta" (otorga **+10 PTS**).
- **Operación y Precios:** Tipo de operación (Venta/Alquiler), precio de lista oficial y moneda (USD o BOB).

#### Paso 2: Ubicación & Físico
- **Google Maps Interactivo:** Arrastra el marcador rojo sobre el mapa para fijar latitud y longitud satelital.
- **Dimensiones:** Superficie de terreno ($m^2$), superficie construida, pisos, dormitorios en suite, baños y parqueos.

#### Paso 3: Materiales & Amenidades
- Especifica la calidad constructiva: acabados de piso, mesadas, equipamiento y áreas sociales (piscina, churrasquera, seguridad 24/7).

#### Paso 4: Legal & Multimedia
- **Auditoría Legal:** Folio Real al día, impuestos pagados y planos aprobados (**+15 PTS extra** por captación saneada).
- **Multimedia:** Sube la foto de portada y fotos secundarias de los ambientes.
      `,
      tip: 'Una captación con fotos horizontales con buena luz y contrato en exclusiva te otorga hasta 45 puntos directos en tu Casa Legal Score.',
      routeLink: '/inmuebles/nuevo',
      routeLabel: 'Subir Nueva Captación'
    },
    {
      id: 'modulo-4',
      num: 4,
      title: 'Mis Casas, Estados & Venta Cerrada',
      subtitle: 'Administra tu inventario, genera links cortos y registra ventas (+100 PTS)',
      icon: Home,
      duration: '4 min',
      badge: '+100 PTS Venta',
      objectives: [
        'Gestionar tus captaciones propias y matches de colegas con precios duales.',
        'Crear links cortos de WhatsApp con un solo clic.',
        'Aprender a marcar inmuebles como Vendidos para sumar 100 PTS al instante.'
      ],
      content: `
### 1. Tu Inventario Personal
El módulo **Mis Casas** (\`/mis-casas\`) se divide en dos secciones principales:
- **Pestaña "Mis Inmuebles":** Contiene únicamente las propiedades captadas por ti, con precios en USD y Bolivianos (al T.C. 11.86 Bs).
- **Pestaña "Casa de Matches":** Concentra las propiedades de tus colegas con las que te conectaste para vender a tus clientes.

### 2. Generador de Enlaces de WhatsApp con Link Corto
Al pulsar el botón verde **"WA"** en cualquiera de tus casas, el CRM genera automáticamente un enlace preformateado con mensaje comercial y lo copia en tu portapapeles listo para enviar.

### 3. Control de Estado en Vivo (Cierre de Venta)
Cada una de tus propiedades cuenta con un selector de estado rápido:
- **Activo:** Propiedad disponible en el inventario para toda la red.
- **Reservado:** Cuando el cliente firmó la reserva o arras de compra.
- **🎉 Vendido (+100 PTS):** Al concretar el cierre y la firma de la minuta. Al marcarla como Vendida, el sistema **te otorga de manera automática 100 PTS auditados en tu Casa Legal Score**, actualizando tu posición en el Leaderboard de la franquicia.
      `,
      tip: 'Mantén siempre al día el estado de tus propiedades. Al marcar una venta no solo celebras tu comisión sino que subes de nivel en la tabla de comisiones.',
      routeLink: '/mis-casas',
      routeLabel: 'Gestionar Mis Casas'
    },
    {
      id: 'modulo-5',
      num: 5,
      title: 'Estudio de Marketing & Flyers HD',
      subtitle: 'Genera piezas gráficas de calidad editorial en segundos',
      icon: Megaphone,
      duration: '5 min',
      badge: '8 Plantillas HD',
      objectives: [
        'Utilizar las 8 plantillas profesionales adaptadas para cada propiedad.',
        'Asignar fotos a las ranuras correspondientes y ajustar el encuadre.',
        'Descargar flyers listos para publicar en Instagram, Facebook y estados de WhatsApp.'
      ],
      content: `
### 1. Publicidad Profesional sin Diseñador Gráfico
Al entrar a cualquier inmueble propio y pulsar el botón dorado **"Mkt"** o navegar a \`/inmuebles/[id]/marketing\`, ingresarás al **Estudio de Marketing de Casa Legal**.

### 2. Catálogo de 8 Plantillas Exclusivas
Puedes alternar entre 8 conceptos visuales de alto impacto:
1. **Lujo Minimalista (Editorial Dark):** Tipografía serif dorada sobre fondo esmeralda oscuro.
2. **Royale Imperial (Gold Seal):** Con marco dorado de lujo y sello oficial de la franquicia.
3. **Grid Moderno (4 Espacios):** Para lucir fachada, cocina, suite y jardín simultáneamente.
4. **Banner Urbano:** Diseño dinámico con franjas diagonales en amarillo corporativo.
5. **Elegance Emerald:** Paleta sobria con detalles en oro viejo para departamentos.
6. **Minimalista Clean:** Fondo blanco puro y líneas limpias para inmuebles comerciales.
7. **Boutique Luxury:** Diseño estilo revista de arquitectura internacional.
8. **Story Social:** Formato vertical optimizado para estados de WhatsApp y Reels/Stories de Instagram.

### 3. Asignación de Fotos y Edición en Vivo
- **Selector de 3 Ranuras:** Elige portada (Ranura 1), interior (Ranura 2) y detalle (Ranura 3).
- **Editor de Textos:** Edita precio, zona, titular y descripción en vivo.
- **Tu Identidad Oficial:** El flyer inserta automáticamente tu **Primer Nombre y Primer Apellido** (ej. *Abel Escobar*) y tu teléfono celular con el logotipo de Casa Legal.
      `,
      tip: 'Publica al menos 2 flyers por semana en tus estados de WhatsApp. Más del 60% de los compradores provienen de contactos directos de tu agenda.',
      routeLink: '/mis-casas',
      routeLabel: 'Ir a Mis Casas para Crear Flyers'
    },
    {
      id: 'modulo-6',
      num: 6,
      title: 'Requerimientos, Clientes & Cruce',
      subtitle: 'Gestiona la demanda de compradores y cierra más rápido',
      icon: Target,
      duration: '4 min',
      badge: 'Matching Activo',
      objectives: [
        'Registrar las solicitudes de clientes que buscan comprar o alquilar.',
        'Hacer coincidir requerimientos con propiedades del inventario.',
        'Organizar el seguimiento de prospectos para no perder oportunidades.'
      ],
      content: `
### 1. El Módulo de Requerimientos
Cuando un cliente te contacta buscando una propiedad específica, regístralo en el módulo **Requerimientos** (\`/requerimientos\`).
- Registra el nombre del comprador, su teléfono, su presupuesto máximo y las características que exige.
- El sistema coteja automáticamente los requerimientos activos con las propiedades que van ingresando al inventario colectivo.

### 2. Gestión de Clientes (CRM)
En la sección **Clientes** podrás estructurar tu embudo comercial:
- **Nuevo Lead:** Contacto recién recibido por redes sociales o tu landing page.
- **En Contacto:** Conversación iniciada por WhatsApp o llamada telefónica.
- **Visita Agendada:** Cita pactada para inspeccionar físicamente el inmueble.
- **En Negociación / Oferta:** Presentación de propuesta formal de compra al propietario.
- **Cerrado / Vendido:** Operación completada con éxito.
      `,
      tip: 'Un cliente comprador bien atendido puede comprar una propiedad de tu inventario o de la red de matches. Ambos caminos te generan comisión.',
      routeLink: '/requerimientos',
      routeLabel: 'Ver Requerimientos'
    },
    {
      id: 'modulo-7',
      num: 7,
      title: 'Régimen Contractual & Comisiones Oficiales (20% / 10% / 10%)',
      subtitle: 'Distribución legal de ingresos (Cláusula 6), cuota al día 5, vigencia de 1 año y Score',
      icon: Trophy,
      duration: '7 min',
      badge: 'Contrato Oficial',
      objectives: [
        'Dominar la distribución legal de ingresos: 20% Asesor, 10% Inmobiliaria y 10% Gastos de Administración.',
        'Conocer la fecha de la cuota operativa mensual (hasta el día 5 de cada mes).',
        'Comprender la vigencia de 1 año del contrato, preaviso de 30 días y pacto de no competencia.',
        'Saber cómo el Casa Legal Score activa bonos e incentivos de mérito sobre la base contractual.'
      ],
      content: `
### 1. El Marco Legal y Económico Oficial de Casa Legal
El ejercicio de la actividad de asesoría inmobiliaria en nuestra red se rige formalmente por el **Contrato Privado de Prestación de Servicios de Agencia Inmobiliaria**, suscrito en nuestra sede central de la ciudad de **El Alto / La Paz** (Torre CAUSAE 6.º Piso). A continuación, se detallan las cláusulas económicas y operativas esenciales:

### 2. Distribución Contractual de Ingresos (Cláusula Sexta)
Como fruto del esfuerzo conjunto entre **EL ASESOR** y **CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.**, los ingresos por comisiones de intermediación se liquidan formalmente bajo el siguiente desglose:

| Beneficiario / Concepto | Porcentaje Contractual | Fundamento Legal & Operativo |
| :--- | :---: | :--- |
| **EL ASESOR INMOBILIARIO** | **20%** | Honorarios directos por la labor de intermediación y asesoría efectiva en el cierre. |
| **INMOBILIARIA CASA LEGAL** | **10%** | Derecho de uso de marca, soporte corporativo, licencias y respaldo institucional. |
| **GASTOS DE ADMINISTRACIÓN** | **10%** | Retención para gastos administrativos en Operación Directa por cada transacción. |

*Nota fiscal:* Conforme a la Cláusula 6, cada parte emitirá la factura fiscal correspondiente por los ingresos efectivamente percibidos.

### 3. Cuota Mensual Operativa y Marca (Cláusula Quinta)
- **Vencimiento Improrrogable:** Debe ser cancelada puntualmente **hasta el día 5 de cada mes adelantado**.
- **Destino del Aporte:** Mantenimiento de plataformas tecnológicas (CRM en la nube, Inteligencia Artificial Gemini 2.5, servidores), soporte técnico, capacitaciones de la academia y bolsa de bonos e incentivos.
- **Uso Obligatorio de Marca:** Todo arte publicitario, letrero, banner y fanpage debe incluir obligatoriamente el nombre del asesor junto a la marca oficial: *CASA LEGAL FIRMA LEGAL & INMOBILIARIA S.R.L.*

### 4. Plazos, Tiempos de Contrato & Sanciones
- **Vigencia del Contrato (Cláusula 10):** Tendrá una duración de **1 (UN) año calendario** a partir de su suscripción, con **renovación tácita automática** salvo que alguna de las partes notifique su intención contraria con al menos **7 días** de anticipación.
- **Resolución & Preaviso (Cláusula 8):** Podrá resolverse conforme al Art. 1255 del Código de Comercio con un preaviso mínimo escrito de **30 días calendario**. A la conclusión, el asesor dispone de **5 días hábiles** para dar de baja fanpages, retirar carteles y devolver credenciales.
- **Pacto de No Competencia (Cláusula 12):** Conforme al Art. 1249 del Código de Comercio, el asesor no podrá operar ni promover líneas inmobiliarias competidoras dentro del área durante el plazo de **1 año**, bajo pena de penalidad tasada de **US$ 5,000 (Cinco Mil Dólares Americanos)**.
- **Arbitraje & Jurisdicción (Cláusula 11):** Resolución de controversias administrada por el Centro de Conciliación y Arbitraje Comercial de la Cámara de Comercio de La Paz.

### 5. Cómo el "Casa Legal Score" Premia tu Rendimiento
El sistema **Casa Legal Score** (\`/score\`) audita tus acciones en el CRM para otorgarte puntos que desbloquean bonos de productividad adicionales sobre la base contractual:
- **Venta Concretada:** \`+100 PTS\`
- **Captación en Exclusiva:** \`+30 PTS\`
- **Captación Saneada con Documentos al Día:** \`+15 PTS\`
- **Captación Estándar:** \`+10 PTS\`
- **Leads y Visitas:** \`+5 PTS\` cada uno
Los asesores que alcanzan los niveles Pro, Elite y Socio Master acceden a bonificaciones especiales del fondo de incentivos y comisiones preferenciales en la Bolsa MLS.
      `,
      tip: 'Mantén siempre al día tu cuota operativa antes del día 5 de cada mes para asegurar la vigencia de tu cuenta, la visibilidad de tus propiedades y la acumulación de tus puntos Score.',
      routeLink: '/score',
      routeLabel: 'Auditar Mi Casa Legal Score y Contrato'
    },
    {
      id: 'modulo-8',
      num: 8,
      title: 'Equipos Casa Legal Enterprise: Células Comerciales',
      subtitle: 'Pool compartido de inmuebles, calculadora de splits y chat en vivo',
      icon: Users,
      duration: '6 min',
      badge: 'Splits & Pool',
      objectives: [
        'Formar células comerciales o unirse a un equipo con roles jerárquicos.',
        'Compartir captaciones exclusivas en el Pool Común del equipo.',
        'Simular splits de comisión (Agente, Fondo de Equipo, Líder).',
        'Coordinar visitas y cierres mediante el canal de chat interno en vivo.'
      ],
      content: `
### 1. El Modelo de Células Comerciales
El módulo **Equipos Casa Legal** (\`/equipo\`) permite a los agentes agruparse en células comerciales de alto rendimiento para acelerar ventas y multiplicar ingresos:
- **KPIs Colectivos:** Visualiza el volumen total de cartera del equipo expresado en **$ USD** y **Bs. BOB**, cierres del mes y la barra de avance hacia la meta financiera.
- **Roster de Miembros:** Estructura con roles claros: *Líder de Célula* y *Asociados Comerciales*.

### 2. Pool de Inmuebles Compartidos
Los miembros pueden aportar captaciones de su inventario personal al **Pool Común del Equipo**. De esta manera, todos los integrantes tienen autorización preferencial para ofrecer y vender las propiedades de sus compañeros.

### 3. Calculadora & Simulador de Splits de Comisión
El módulo incluye un simulador financiero interactivo donde puedes proyectar cualquier venta:
- **Agente Ejecutor (ej. 70%):** Lo que percibe el asesor que cerró la operación.
- **Fondo de Marketing del Equipo (ej. 20%):** Fondo destinado a publicidad pagada y eventos.
- **Override del Líder (ej. 10%):** Reconocimiento por mentoría y liderazgo.
Los resultados se calculan al instante en **$ USD** y en **Bolivianos (Bs.)** sincronizados con el tipo de cambio del sistema.

### 4. Canal de Chat Interno
Cada equipo cuenta con un chat en tiempo real en Firestore para compartir novedades, coordinar visitas y celebrar ventas conjuntas.
      `,
      tip: 'Los agentes que trabajan en células comerciales cierran hasta un 40% más rápido gracias al apalancamiento del pool común y el apoyo del líder.',
      routeLink: '/equipo',
      routeLabel: 'Explorar Equipos Casa Legal'
    },
    {
      id: 'modulo-9',
      num: 9,
      title: 'Red Casa Legal & Bolsa MLS Multi-Canal',
      subtitle: 'IA de Copywriting, simulador en smartphone y Co-Brokerage 50/50',
      icon: Radio,
      duration: '7 min',
      badge: 'IA & Co-Brokerage',
      objectives: [
        'Despachar propiedades a Meta y WhatsApp con el motor de IA de 5 tonos.',
        'Previsualizar publicaciones en el simulador interactivo de smartphone.',
        'Participar en la Bolsa MLS Co-Brokerage con ofertas 50/50 de comisión.',
        'Publicar demandas de compradores en la Pizarra MLS y solicitar pauta digital central.'
      ],
      content: `
### 1. El Hub de Difusión Inmobiliaria
En **Red Casa Legal MLS** (\`/red-casa\`) convergen las herramientas de marketing y co-brokerage más potentes del sistema:

### 2. Motor de Copywriting con Inteligencia Artificial (5 Tonos)
Selecciona cualquier inmueble de tu inventario y genera textos de alta conversión adaptados al perfil del comprador:
1. 🚀 **Inversionista & Alto ROI:** Enfocado en plusvalía, rentabilidad anual proyectada y oportunidad única.
2. 💎 **Lujo & Prestigio Lifestyle:** Vocabulario editorial premium, acabados de primera y exclusividad.
3. 🏡 **Hogar Familiar:** Seguridad, calidez, espacios para niños y cercanía a colegios.
4. ⚡ **Viral TikTok / Reels:** Gancho en 3 segundos, dinamismo visual, emojis y CTA directo a WhatsApp.
5. 🏢 **Comercial & Corporativo:** Alto tránsito, vitrina comercial y versatilidad de negocio.

### 3. Simulador Interactivo de Smartphone
Visualiza cómo lucirá tu contenido antes de publicarlo alternando entre:
- **Instagram Feed:** Post 1:1 con cabecera de asesor, likes y tags.
- **WhatsApp Estado (9:16 vertical):** Formato vertical con foto completa, sticker de precio dual y llamado a la acción.
- **Ficha Técnica MLS:** Formato corporativo institucional de Casa Legal.

### 4. Bolsa MLS Co-Brokerage & Pizarra de Compradores
- **Bolsa MLS:** Catálogo donde los agentes publican inmuebles ofreciendo compartir comisión (ej. *Split 50/50 - Gana 1.5% al 2.5% al traer al comprador*), con botón para contactar al agente captador por WhatsApp.
- **Pizarra de Compradores ("Tengo un Comprador"):** Tablón donde los agentes publican búsquedas urgentes de clientes precalificados para que sus colegas ofrezcan captaciones compatibles.
- **Pauta Digital Pagada:** Formulario para solicitar campañas de Meta Ads/Google Ads gestionadas por el equipo de Marketing Central.
      `,
      tip: 'Prueba cambiar entre los 5 tonos de IA según la red social a la que vayas a publicar. El tono Inversionista funciona excelente en Facebook y el tono Familiar en WhatsApp.',
      routeLink: '/red-casa',
      routeLabel: 'Abrir Red Casa Legal MLS'
    },
    {
      id: 'modulo-10',
      num: 10,
      title: 'Doble Cotización Monetaria ($ USD y Bs. al T.C. Real 11.86)',
      subtitle: 'Paridad cambiaria real de mercado y transparencia con tus clientes',
      icon: DollarSign,
      duration: '4 min',
      badge: 'T.C. 11.86 Bs',
      objectives: [
        'Comprender la dinámica del mercado cambiario inmobiliario en Bolivia.',
        'Explicar con claridad a propietarios y compradores la paridad en Bolivianos.',
        'Aprovechar la conversión automática en todas las tarjetas y fichas del CRM.'
      ],
      content: `
### 1. El Contexto Cambiario en Bolivia
En el mercado inmobiliario boliviano contemporáneo, las propiedades se cotizan primordialmente en **Dólares Americanos (USD)**; sin embargo, gran parte de las transacciones, créditos bancarios y pagos efectivos se liquidan en **Bolivianos (BOB)** al tipo de cambio real del mercado.

### 2. El Tipo de Cambio Real de Casa Legal (11.86 Bs / USD)
Para evitar discrepancias y brindar certeza absoluta a tus clientes, Casa Legal CRM integra en su núcleo financiero la cotización real de referencia: **11.86 Bs / USD**.
- **Conversión Automática:** En cada tarjeta de inmueble (Inventario, Mis Casas, Bolsa MLS, Ficha Detallada y Casa de Mando) el sistema calcula y muestra en paralelo:
  - El precio en **$ USD** (en dorado de lujo).
  - El contravalor exacto en **Bs. Bolivianos** (en verde esmeralda con formato oficial boliviano).

### 3. Argumentario Comercial para Propietarios y Compradores
- **Ante el Propietario:** Le demuestras que su precio de lista está protegido contra la inflación y que los compradores en moneda nacional sabrán con exactitud cuánto deben transferir o desembolsar.
- **Ante el Comprador:** Le facilitas el cálculo de cuotas bancarias o pagos en efectivo en bolivianos sin necesidad de recurrir a calculadoras externas ni estimaciones imprecisas.
      `,
      tip: 'Menciona siempre ambos precios en tus presentaciones comerciales: "El valor de inversión es de $100,000 USD, equivalente a Bs. 1,186,000 al tipo de cambio real de mercado". Esto transmite profesionalismo y transparencia inmediata.',
      routeLink: '/inventario',
      routeLabel: 'Ver Precios Duales en Inventario'
    }
  ];

  // Catálogo completo de Cursos de la Academia
  const academyCourses = [
    {
      id: 'curso-maestro-crm',
      type: 'master',
      title: 'Manual Maestro de Casa Legal CRM: Guía Oficial de Funciones',
      subtitle: 'Inducción completa en texto paso a paso de cada módulo del sistema.',
      category: 'sistema',
      categoryLabel: 'Inducción Oficial',
      duration: '22 min de lectura',
      level: 'Todos los Niveles',
      lessonsCount: 10,
      isPrimary: true,
      badge: '★ CURSO OFICIAL',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      description: 'Aprende a operar el 100% del CRM: Casa de Mando, Inventario, Captación en 4 Pasos, Marketing HD, Matches, Casa Legal Score, Equipos con Splits, Red MLS con IA y Doble Cotización a 11.86 Bs.'
    },
    {
      id: 'captacion-exclusivas',
      type: 'guide',
      title: 'Estrategia de Captación en Exclusiva y Saneamiento',
      subtitle: 'Argumentos y pasos legales para firmar exclusivas al 4% y 5% de comisión.',
      category: 'legal',
      categoryLabel: 'Legal & Captación',
      duration: '8 min de lectura',
      level: 'Intermedio',
      lessonsCount: 5,
      isPrimary: false,
      badge: '+45 PTS Score',
      image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      description: 'Checklist para revisar Folio Real, impuestos municipales y planos catastrales antes de ingresar una propiedad al inventario.'
    },
    {
      id: 'marketing-redes-flyers',
      type: 'guide',
      title: 'Generación de Leads Inmobiliarios con Flyers HD',
      subtitle: 'Cómo maximizar clics y consultas en WhatsApp utilizando nuestras 8 plantillas.',
      category: 'marketing',
      categoryLabel: 'Marketing Digital',
      duration: '10 min de lectura',
      level: 'Práctico',
      lessonsCount: 6,
      isPrimary: false,
      badge: 'Crecimiento',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      description: 'Estructuración de textos de alto impacto comercial, selección de fotografías vendedoras y distribución en canales digitales.'
    },
    {
      id: 'regimen-contractual-asesor',
      type: 'guide',
      title: 'Marco Jurídico & Contrato Oficial del Asesor Inmobiliario',
      subtitle: 'Cláusulas esenciales: 20% Asesor, 10% Inmobiliaria, 10% Admin, cuota al día 5 y vigencia de 1 año.',
      category: 'legal',
      categoryLabel: 'Marco Jurídico',
      duration: '9 min de lectura',
      level: 'Fundamental',
      lessonsCount: 5,
      isPrimary: false,
      badge: 'Contrato Oficial',
      image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      description: 'Análisis cláusula por cláusula del Contrato Oficial de Prestación de Servicios: régimen de split de ingresos, fecha límite de cuota operativa, resolución unilateral, no competencia territorial y arbitraje en La Paz.'
    },
    {
      id: 'carrera-socio-master',
      type: 'guide',
      title: 'Carrera de Rendimiento & Casa Legal Score',
      subtitle: 'Estrategia mensual para escalar y maximizar bonificaciones sobre la base contractual.',
      category: 'carrera',
      categoryLabel: 'Carrera & Comisiones',
      duration: '7 min de lectura',
      level: 'Avanzado',
      lessonsCount: 4,
      isPrimary: false,
      badge: 'Alto Rendimiento',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=800&q=80',
      description: 'La fórmula matemática para superar los 600 puntos mensuales combinando captaciones exclusivas, ventas propias y cierres compartidos para acceder a los bonos del fondo corporativo.'
    }
  ];

  // Lección actualmente visualizada en el curso maestro
  let currentLesson = $derived(crmLessons[activeLessonIndex] || crmLessons[0]);
  let progressPercentage = $derived(
    Math.round((completedLessons.size / crmLessons.length) * 100)
  );

  // Filtrado de cursos del catálogo
  let filteredCourses = $derived(
    academyCourses.filter((c) => {
      const matchCat = activeCategory === 'todos' || c.category === activeCategory;
      const matchQuery =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    })
  );

  const openMasterCourse = (lessonIndex = 0) => {
    activeLessonIndex = lessonIndex;
    viewMode = 'course';
    scrollToTop();
  };

  const closeMasterCourse = () => {
    viewMode = 'list';
    scrollToTop();
  };

  const selectLesson = (index) => {
    activeLessonIndex = index;
    // Marcar como leída automáticamente al visitarla
    const nextSet = new Set(completedLessons);
    nextSet.add(index);
    completedLessons = nextSet;
    persistProgress();
    scrollToTop();
  };

  const nextLesson = () => {
    if (activeLessonIndex < crmLessons.length - 1) {
      selectLesson(activeLessonIndex + 1);
    }
  };

  const prevLesson = () => {
    if (activeLessonIndex > 0) {
      selectLesson(activeLessonIndex - 1);
    }
  };

  const toggleLessonCompleted = (index) => {
    const nextSet = new Set(completedLessons);
    if (nextSet.has(index)) {
      nextSet.delete(index);
    } else {
      nextSet.add(index);
    }
    completedLessons = nextSet;
    persistProgress();
  };

  const toggleLikeCourse = (courseId) => {
    const nextLikes = new Set(likedCourses);
    if (nextLikes.has(courseId)) {
      nextLikes.delete(courseId);
    } else {
      nextLikes.add(courseId);
    }
    likedCourses = nextLikes;
  };

  const shareCourse = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      copiedLinkToast = true;
      setTimeout(() => {
        copiedLinkToast = false;
      }, 3000);
    }
  };

  const scrollToTop = () => {
    setTimeout(() => {
      const el = document.querySelector('.overflow-y-auto');
      if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const persistProgress = () => {
    try {
      localStorage.setItem(
        'casa_legal_course_completed_lessons',
        JSON.stringify(Array.from(completedLessons))
      );
    } catch (e) {
      console.warn('No se pudo guardar progreso en localStorage', e);
    }
  };

  onMount(() => {
    try {
      const saved = localStorage.getItem('casa_legal_course_completed_lessons');
      if (saved) {
        const arr = JSON.parse(saved);
        completedLessons = new Set(arr);
      }
    } catch (e) {
      console.warn('Error leyendo localStorage', e);
    }
  });
</script>

<svelte:head>
  <title>Cursos Casa Legal | Academia Inmobiliaria & Inducción CRM</title>
</svelte:head>

<div class="p-4 md:p-8 font-sans min-h-screen bg-[#071311] text-slate-100 flex flex-col overflow-y-auto selection:bg-[#D4AF37] selection:text-black">
  
  <!-- TOAST DE COPIAR ENLACE -->
  {#if copiedLinkToast}
    <div class="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
      <Check size={18} class="text-white shrink-0" />
      <span>¡Enlace del curso copiado al portapapeles!</span>
    </div>
  {/if}

  {#if viewMode === 'list'}
    <!-- ==================== VISTA 1: CATÁLOGO DE LA ACADEMIA ==================== -->
    <div class="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      
      <!-- ENCABEZADO DE LA ACADEMIA -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#1b3d36] pb-8">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} /> Academia de Formación Inmobiliaria
            </span>
            <span class="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Contenido Oficial
            </span>
          </div>
          <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
            Cursos Casa Legal
          </h1>
          <p class="text-slate-400 text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed">
            Aprende a dominar cada herramienta del CRM, multiplicar tus captaciones en exclusiva y acelerar tus cierres inmobiliarios.
          </p>
        </div>

        <!-- Métrica Global de Progreso del Asesor -->
        <div class="bg-[#0c241f] border border-[#1b4339] p-4 rounded-2xl flex items-center gap-4 shrink-0 shadow-lg">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-amber-600 text-black flex items-center justify-center font-black shadow-md">
            <GraduationCap size={24} />
          </div>
          <div>
            <span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Inducción CRM</span>
            <p class="text-sm font-bold text-white">
              <span class="text-[#D4AF37] font-black font-mono">{completedLessons.size} de {crmLessons.length}</span> lecciones completadas
            </p>
            <div class="w-36 h-2 bg-[#061512] rounded-full overflow-hidden mt-1.5 border border-[#163830]">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-[#D4AF37] rounded-full transition-all duration-500" style="width: {progressPercentage}%"></div>
            </div>
          </div>
        </div>
      </header>

      <!-- CURSO HERO DESTACADO: MANUAL MAESTRO DE CASA LEGAL CRM -->
      <section class="relative rounded-3xl bg-gradient-to-br from-[#0c241f] via-[#091b17] to-[#040d0b] border-2 border-[#D4AF37]/50 p-6 md:p-10 shadow-2xl overflow-hidden group">
        <!-- Glows ambientales dorados -->
        <div class="absolute -top-32 -right-32 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#D4AF37]/25 transition-all duration-700"></div>
        <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div class="space-y-4 max-w-2xl text-center lg:text-left">
            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span class="px-3 py-1 rounded-full bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-wider shadow-md">
                ★ Curso Oficial Predeterminado
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                100% en Texto & Paso a Paso
              </span>
              <span class="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Clock size={12} class="text-[#D4AF37]" /> 15 min de lectura
              </span>
            </div>

            <h2 class="text-2xl md:text-4xl font-black text-white leading-tight">
              Manual Maestro de Casa Legal CRM: Guía Completa de Funcionalidades
            </h2>

            <p class="text-slate-300 text-sm md:text-base leading-relaxed">
              Conviértete en un experto del sistema. Explicamos detalladamente para qué sirve y cómo operar cada módulo: desde tu Casa de Mando y captación en 4 pasos, hasta el generador de Flyers HD y el sistema de comisiones Casa Legal Score.
            </p>

            <!-- Mini badges de los 8 módulos -->
            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
              {#each crmLessons as lesson, i}
                <button
                  type="button"
                  onclick={() => openMasterCourse(i)}
                  class="px-2.5 py-1 rounded-xl bg-[#081e19] border border-[#1b4339] hover:border-[#D4AF37] text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                >
                  <svelte:component this={lesson.icon} size={12} class="text-[#D4AF37]" />
                  <span>{lesson.num}. {lesson.title.split(':')[0]}</span>
                </button>
              {/each}
            </div>

            <div class="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                type="button"
                onclick={() => openMasterCourse(0)}
                class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-black text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)]"
              >
                <BookOpen size={18} /> Iniciar Curso Maestro
              </button>
              
              <button
                type="button"
                onclick={shareCourse}
                class="px-5 py-3.5 rounded-2xl bg-[#0e2c24] hover:bg-[#163c32] border border-[#1d4d40] text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <Share2 size={16} /> Compartir
              </button>
            </div>
          </div>

          <!-- Tarjeta de progreso visual del curso maestro -->
          <div class="w-full sm:w-80 bg-[#061411]/90 border border-[#1b3d36] rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4 shrink-0 shadow-xl">
            <div class="flex items-center justify-between border-b border-[#163830] pb-3">
              <span class="text-xs font-black uppercase text-[#D4AF37] tracking-wider">Tu Progreso</span>
              <span class="text-xs font-bold text-slate-400 font-mono">{progressPercentage}%</span>
            </div>

            <div class="space-y-2">
              {#each crmLessons.slice(0, 4) as item, idx}
                <button
                  type="button"
                  onclick={() => openMasterCourse(idx)}
                  class="w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors hover:bg-[#0c241f] {completedLessons.has(idx) ? 'text-emerald-300' : 'text-slate-400'}"
                >
                  <div class="flex items-center gap-2 truncate">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold {completedLessons.has(idx) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}">
                      {completedLessons.has(idx) ? '✓' : idx + 1}
                    </div>
                    <span class="truncate">{item.title.split(':')[0]}</span>
                  </div>
                  <ChevronRight size={14} class="text-slate-600 shrink-0" />
                </button>
              {/each}
              <p class="text-center text-[11px] text-slate-500 pt-1 font-mono">
                +4 módulos adicionales en el curso
              </p>
            </div>

            <button
              type="button"
              onclick={() => openMasterCourse(0)}
              class="w-full py-2.5 rounded-xl bg-[#0f2c25] hover:bg-[#153c33] border border-[#1b4339] text-[#D4AF37] font-bold text-xs uppercase tracking-wider transition-all text-center block"
            >
              Ver Índice Completo
            </button>
          </div>
        </div>
      </section>

      <!-- BARRA DE FILTROS & BÚSQUEDA DE CURSOS -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <!-- Categorías -->
        <div class="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            type="button"
            onclick={() => (activeCategory = 'todos')}
            class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 {activeCategory === 'todos'
              ? 'bg-[#D4AF37] text-black shadow-md font-black'
              : 'bg-[#091a17] text-slate-400 hover:text-white border border-[#1b3d36]'}"
          >
            Todos los Cursos
          </button>
          <button
            type="button"
            onclick={() => (activeCategory = 'sistema')}
            class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 {activeCategory === 'sistema'
              ? 'bg-[#D4AF37] text-black shadow-md font-black'
              : 'bg-[#091a17] text-slate-400 hover:text-white border border-[#1b3d36]'}"
          >
            Sistema CRM
          </button>
          <button
            type="button"
            onclick={() => (activeCategory = 'legal')}
            class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 {activeCategory === 'legal'
              ? 'bg-[#D4AF37] text-black shadow-md font-black'
              : 'bg-[#091a17] text-slate-400 hover:text-white border border-[#1b3d36]'}"
          >
            Legal & Captación
          </button>
          <button
            type="button"
            onclick={() => (activeCategory = 'marketing')}
            class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 {activeCategory === 'marketing'
              ? 'bg-[#D4AF37] text-black shadow-md font-black'
              : 'bg-[#091a17] text-slate-400 hover:text-white border border-[#1b3d36]'}"
          >
            Marketing
          </button>
          <button
            type="button"
            onclick={() => (activeCategory = 'carrera')}
            class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 {activeCategory === 'carrera'
              ? 'bg-[#D4AF37] text-black shadow-md font-black'
              : 'bg-[#091a17] text-slate-400 hover:text-white border border-[#1b3d36]'}"
          >
            Carrera & Score
          </button>
        </div>

        <!-- Buscador -->
        <div class="relative w-full sm:w-72">
          <Search size={16} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Buscar tema o módulo..."
            class="w-full pl-10 pr-4 py-2 bg-[#091a17] border border-[#1b3d36] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
      </div>

      <!-- GRID DE CURSOS DE LA ACADEMIA -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each filteredCourses as course}
          <div
            class="bg-[#091a17] border border-[#1b3d36] hover:border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
          >
            <!-- Portada del Curso -->
            <div class="h-48 relative overflow-hidden bg-black/40">
              <img
                src={course.image}
                alt={course.title}
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#091a17] via-transparent to-transparent"></div>
              
              <!-- Badges de cabecera -->
              <div class="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span class="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-black uppercase tracking-wider">
                  {course.categoryLabel}
                </span>
                <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  {course.badge}
                </span>
              </div>

              <!-- Duración -->
              <span class="absolute bottom-3 left-3 text-[11px] font-bold text-slate-300 bg-[#061411]/80 px-2.5 py-0.5 rounded-lg border border-[#1b3d36] flex items-center gap-1 font-mono">
                <Clock size={12} class="text-[#D4AF37]" /> {course.duration}
              </span>
            </div>

            <!-- Cuerpo del Curso -->
            <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 class="text-lg font-black text-white leading-snug group-hover:text-[#D4AF37] transition-colors mb-2">
                  {course.title}
                </h3>
                <p class="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              </div>

              <div class="pt-4 border-t border-[#163830] flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-bold text-slate-400">
                    {course.lessonsCount} Lecciones
                  </span>
                  <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span class="text-[11px] font-bold text-emerald-400 font-mono">
                    {course.level}
                  </span>
                </div>

                <button
                  type="button"
                  onclick={() => openMasterCourse(0)}
                  class="px-4 py-2 rounded-xl bg-[#0f2c25] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md group-hover:scale-105"
                >
                  <span>Estudiar</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

    </div>

  {:else if viewMode === 'course'}
    <!-- ==================== VISTA 2: VISOR DEL CURSO MAESTRO ==================== -->
    <div class="max-w-7xl mx-auto w-full space-y-6 animate-in slide-in-from-bottom-6 duration-300">
      
      <!-- BARRA SUPERIOR DE NAVEGACIÓN -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1b3d36] pb-4">
        <button
          type="button"
          onclick={closeMasterCourse}
          class="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-[#D4AF37] transition-colors uppercase tracking-widest bg-[#0a1f1b] border border-[#1b4339] px-4 py-2.5 rounded-xl shadow"
        >
          <ArrowLeft size={16} /> Volver a la Academia
        </button>

        <!-- Indicador de lección actual y barra -->
        <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div class="text-right">
            <span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Progreso del Curso</span>
            <span class="text-xs font-bold text-white">
              Lección <strong class="text-[#D4AF37] font-mono">{activeLessonIndex + 1}</strong> de {crmLessons.length}
            </span>
          </div>

          <div class="w-32 h-2.5 bg-[#061512] rounded-full overflow-hidden border border-[#1b4339]">
            <div class="h-full bg-gradient-to-r from-emerald-500 to-[#D4AF37] rounded-full transition-all duration-300" style="width: {progressPercentage}%"></div>
          </div>
        </div>
      </div>

      <!-- CONTENEDOR PRINCIPAL: TEMARIO LATERAL (COL 1) + LECTOR DE LECCIÓN (COL 2-3) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- COLUMNA IZQUIERDA: TEMARIO COMPLETO (4 COLS) -->
        <aside class="lg:col-span-4 bg-[#091a17] border border-[#1b3d36] rounded-3xl p-5 shadow-xl space-y-3 sticky top-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#163830]">
            <div>
              <h3 class="text-sm font-black text-white flex items-center gap-2">
                <BookMarked size={16} class="text-[#D4AF37]" /> Temario del Curso
              </h3>
              <p class="text-[11px] text-slate-400">8 Lecciones de Inducción</p>
            </div>
            <span class="px-2 py-0.5 rounded-md bg-[#0c241f] text-[#D4AF37] text-[10px] font-mono font-black border border-[#1b4339]">
              {progressPercentage}%
            </span>
          </div>

          <nav class="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {#each crmLessons as lesson, i}
              {@const isCurrent = i === activeLessonIndex}
              {@const isDone = completedLessons.has(i)}
              <button
                type="button"
                onclick={() => selectLesson(i)}
                class="w-full p-3 rounded-2xl text-left transition-all flex items-start gap-3 border {isCurrent
                  ? 'bg-gradient-to-r from-[#12382e] to-[#0c241f] border-[#D4AF37] text-white shadow-md ring-1 ring-[#D4AF37]/30'
                  : 'bg-[#061411] border-[#142e27] hover:border-[#1e483d] text-slate-300'}"
              >
                <!-- Indicador numérico o check -->
                <div class="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 {isDone
                  ? 'bg-emerald-500 text-black shadow'
                  : isCurrent
                  ? 'bg-[#D4AF37] text-black shadow'
                  : 'bg-[#0e2a23] text-slate-400 border border-[#1a4439]'}">
                  {#if isDone}
                    <Check size={14} />
                  {:else}
                    {lesson.num}
                  {/if}
                </div>

                <div class="min-w-0 flex-1">
                  <p class="font-extrabold text-xs leading-snug truncate {isCurrent ? 'text-white' : 'text-slate-200'}">
                    {lesson.title}
                  </p>
                  <p class="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                    {lesson.duration} · {lesson.badge}
                  </p>
                </div>
              </button>
            {/each}
          </nav>
        </aside>

        <!-- COLUMNA DERECHA: CONTENIDO DE LA LECCIÓN (8 COLS) -->
        <main class="lg:col-span-8 bg-[#091a17] border border-[#1b3d36] rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
          
          <!-- Encabezado de la lección -->
          <header class="border-b border-[#163830] pb-6 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
                Módulo {currentLesson.num} de {crmLessons.length} · {currentLesson.badge}
              </span>
              <span class="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Clock size={13} class="text-[#D4AF37]" /> {currentLesson.duration} de lectura
              </span>
            </div>

            <h2 class="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <svelte:component this={currentLesson.icon} size={32} class="text-[#D4AF37] shrink-0" />
              <span>{currentLesson.title}</span>
            </h2>

            <p class="text-sm md:text-base text-slate-300 font-medium">
              {currentLesson.subtitle}
            </p>
          </header>

          <!-- Objetivos de Aprendizaje -->
          <div class="p-5 rounded-2xl bg-[#061411] border border-[#173a32] space-y-2.5">
            <h4 class="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
              <Target size={16} /> Lo que aprenderás en esta lección:
            </h4>
            <ul class="space-y-1.5 text-xs text-slate-300">
              {#each currentLesson.objectives as obj}
                <li class="flex items-start gap-2">
                  <CheckCircle2 size={15} class="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              {/each}
            </ul>
          </div>

          <!-- Texto explicativo completo de la lección -->
          <article class="prose prose-invert prose-emerald max-w-none text-slate-300 leading-relaxed text-sm md:text-base space-y-4">
            {@html currentLesson.content
              .replace(/### (.*?)\n/g, '<h3 class="text-lg md:text-xl font-black text-white mt-6 mb-2 text-[#D4AF37]">$1</h3>')
              .replace(/#### (.*?)\n/g, '<h4 class="text-base font-bold text-emerald-300 mt-4 mb-1">$1</h4>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-extrabold">$1</strong>')
              .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#0e2a23] text-amber-300 font-mono text-xs">$1</code>')
              .replace(/\n- (.*?)/g, '<li class="ml-4 list-disc text-slate-300 my-1">$1</li>')
              .replace(/\n\n/g, '<p class="my-3 text-slate-300 leading-relaxed"></p>')}
          </article>

          <!-- Tarjeta de Súper Tip & Buenas Prácticas -->
          <div class="p-5 rounded-2xl bg-gradient-to-r from-[#0d2a22] to-[#071613] border border-[#D4AF37]/40 shadow-lg flex items-start gap-3.5">
            <div class="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] shrink-0 mt-0.5">
              <Lightbulb size={22} />
            </div>
            <div>
              <h4 class="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
                Consejo de Élite Casa Legal
              </h4>
              <p class="text-xs md:text-sm text-slate-200 mt-1 leading-relaxed">
                {currentLesson.tip}
              </p>
            </div>
          </div>

          <!-- Enlace Directo para Practicar en el CRM -->
          <div class="p-5 rounded-2xl bg-[#061411] border border-[#1b3d36] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-center sm:text-left">
              <h4 class="text-sm font-bold text-white">¿Quieres probar esta herramienta ahora mismo?</h4>
              <p class="text-xs text-slate-400 mt-0.5">Accede directamente al módulo en tu panel de control.</p>
            </div>
            <a
              href={currentLesson.routeLink}
              class="px-5 py-2.5 rounded-xl bg-[#12382e] hover:bg-[#1a4a3e] border border-[#1b4339] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow hover:scale-105 shrink-0"
            >
              <span>{currentLesson.routeLabel}</span>
              <ExternalLink size={14} />
            </a>
          </div>

          <!-- BOTONES DE NAVEGACIÓN Y COMPLETAR -->
          <footer class="pt-6 border-t border-[#163830] flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onclick={prevLesson}
              disabled={activeLessonIndex === 0}
              class="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#071613] hover:bg-[#0c241f] border border-[#1b3d36] text-slate-300 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <ChevronLeft size={16} /> Lección Anterior
            </button>

            <button
              type="button"
              onclick={() => toggleLessonCompleted(activeLessonIndex)}
              class="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg {completedLessons.has(activeLessonIndex)
                ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                : 'bg-[#D4AF37] text-black hover:bg-amber-400'}"
            >
              <Check size={16} />
              <span>{completedLessons.has(activeLessonIndex) ? '✓ Lección Completada' : 'Marcar como Aprendido'}</span>
            </button>

            {#if activeLessonIndex < crmLessons.length - 1}
              <button
                type="button"
                onclick={nextLesson}
                class="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#12382e] hover:bg-[#1a4a3e] border border-[#1b4339] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow"
              >
                Siguiente Lección <ChevronRight size={16} />
              </button>
            {:else}
              <button
                type="button"
                onclick={closeMasterCourse}
                class="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-[#D4AF37] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
              >
                <Award size={16} /> Finalizar Inducción
              </button>
            {/if}
          </footer>

        </main>
      </div>

    </div>
  {/if}

</div>
