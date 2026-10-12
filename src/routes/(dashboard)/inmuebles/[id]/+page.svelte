<script>
  import { ArrowLeft, MapPin, Bed, Bath, Maximize, ShieldCheck, Home, Check, Phone, Mail, X, Edit, Info, Ruler, Settings, FileText, Lock, FileImage } from 'lucide-svelte';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { db } from '#lib/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import { goto } from '$app/navigation';
  import { getDualPrice } from '#lib/currency';

  let property = $state(null);
  let loading = $state(true);
  let activeImage = $state('');
  let isUpdatingEstado = $state(false);
  let dualPrice = $derived(property ? getDualPrice(property.precioLista, property.moneda) : null);

  const cambiarEstado = async (nuevoEstado) => {
    if (!property?.id) return;
    isUpdatingEstado = true;
    try {
      await updateDoc(doc(db, 'inmuebles', property.id), { estado: nuevoEstado });
      property.estado = nuevoEstado;
      if (nuevoEstado === 'Vendido') {
        alert("🎉 ¡Felicidades por la venta! Marcaste el inmueble como VENDIDO. Sumaste +100 PTS a tu Casa Legal Score.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al actualizar estado: " + e.message);
    } finally {
      isUpdatingEstado = false;
    }
  };
  
  // Para el Lightbox de documentos/fotos
  let lightboxImage = $state(null);

  const initMap = () => {
    if (window.google && window.google.maps && property?.latitud) {
      const mapEl = document.getElementById('propMap');
      if (mapEl) {
        const map = new google.maps.Map(mapEl, {
          zoom: 15,
          center: { lat: parseFloat(property.latitud), lng: parseFloat(property.longitud) },
          disableDefaultUI: true,
          zoomControl: true,
        });
        new google.maps.Marker({
          position: { lat: parseFloat(property.latitud), lng: parseFloat(property.longitud) },
          map: map,
          animation: google.maps.Animation.DROP,
        });
      }
    }
  };

  onMount(async () => {
    try {
      const propId = page.params.id;
      const docRef = doc(db, 'inmuebles', propId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        property = { id: snap.id, ...snap.data() };
        activeImage = property.fotoPrincipal;
        
        // Cargar Google Maps
        if (window.google && window.google.maps) {
          initMap();
        } else {
          window.initPropMap = initMap;
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCYpYc1EuqePBuNwGlphfoHwmeWVTQRGS0&callback=initPropMap`;
          script.async = true; script.defer = true;
          document.head.appendChild(script);
        }
      } else {
        alert("Inmueble no encontrado");
        goto('/inventario');
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  });

  const openLightbox = (imgUrl) => {
    lightboxImage = imgUrl;
  };
</script>

{#if lightboxImage}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm transition-opacity" onclick={() => lightboxImage = null}>
    <button class="absolute top-6 right-6 text-white hover:text-gray-300 bg-white/10 p-2 rounded-full transition-colors"><X size={24}/></button>
    <img src={lightboxImage} alt="Visor" class="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onclick={(e) => e.stopPropagation()} />
  </div>
{/if}

{#if loading}
  <div class="flex items-center justify-center h-full bg-casa-light">
    <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-casa-teal"></div>
  </div>
{:else if property}
  <div class="h-full flex flex-col bg-casa-light overflow-y-auto font-sans">
    
    <!-- Top Bar -->
    <div class="bg-white px-8 py-4 sticky top-0 z-40 border-b border-gray-100 flex items-center gap-4">
      <button type="button" onclick={() => history.back()} class="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-casa-teal hover:text-white transition-colors">
        <ArrowLeft size={20} />
      </button>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-casa-dark line-clamp-1">{property.tituloPropiedad || property.tipoInmueble + ' en ' + property.zona}</h1>
        <p class="text-xs text-gray-400 uppercase tracking-widest font-bold">Ref: {property.id.substring(0,8).toUpperCase()}</p>
      </div>
      
      {#if property.agenteId === authState.user?.uid}
        <!-- Selector de Estado de Inmueble (Impacto en Score) -->
        <div class="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onclick={() => cambiarEstado('Activo')}
            disabled={isUpdatingEstado || property.estado === 'Activo'}
            class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all {property.estado === 'Activo' || !property.estado
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'}"
          >
            Activo
          </button>
          <button
            type="button"
            onclick={() => cambiarEstado('Reservado')}
            disabled={isUpdatingEstado || property.estado === 'Reservado'}
            class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all {property.estado === 'Reservado'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'}"
          >
            Reservado
          </button>
          <button
            type="button"
            onclick={() => cambiarEstado('Vendido')}
            disabled={isUpdatingEstado || property.estado === 'Vendido'}
            class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all {property.estado === 'Vendido'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-amber-800 hover:bg-amber-200'}"
            title="Marcar como Vendido (+100 PTS)"
          >
            🎉 Vendido (+100)
          </button>
        </div>

        <a href="/inmuebles/{property.id}/marketing" class="bg-casa-gold/20 text-casa-dark border border-casa-gold/40 px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-casa-gold/30 transition-colors uppercase tracking-wider text-xs">
          Flyers Mkt
        </a>

        <a href="/inmuebles/{property.id}/editar" class="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors uppercase tracking-wider text-xs">
          <Edit size={14} /> Editar
        </a>
      {/if}
      <div class="bg-casa-gold text-casa-dark text-[10px] font-extrabold px-4 py-2.5 rounded-xl uppercase tracking-widest shadow-sm">
        {property.tipoOperacion}
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 p-8 md:p-12 max-w-[90rem] mx-auto w-full flex flex-col xl:flex-row gap-10">
      
      <!-- Left Column (Photos & Heavy Details) -->
      <div class="flex-1 space-y-10 min-w-0">
        
        <!-- Gallery -->
        <div class="space-y-4">
          <button type="button" onclick={() => openLightbox(activeImage)} class="w-full h-[28rem] md:h-[36rem] rounded-[2rem] overflow-hidden bg-black shadow-xl relative group">
            <img src={activeImage} alt="Propiedad" class="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div class="bg-white/90 backdrop-blur text-casa-dark px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2">
                <Maximize size={14}/> Ampliar Imagen
              </div>
            </div>
          </button>
          
          {#if property.fotosSecundarias?.length > 0}
            <div class="flex gap-4 overflow-x-auto pb-4 snap-x">
              <button type="button" onclick={() => activeImage = property.fotoPrincipal} class="shrink-0 w-32 h-24 rounded-xl overflow-hidden snap-start ring-2 {activeImage === property.fotoPrincipal ? 'ring-casa-teal scale-105' : 'ring-transparent opacity-60'} transition-all">
                <img src={property.fotoPrincipal} alt="Thumb" class="w-full h-full object-cover" />
              </button>
              {#each property.fotosSecundarias as foto}
                <button type="button" onclick={() => activeImage = foto} class="shrink-0 w-32 h-24 rounded-xl overflow-hidden snap-start ring-2 {activeImage === foto ? 'ring-casa-teal scale-105' : 'ring-transparent opacity-60'} hover:opacity-100 transition-all">
                  <img src={foto} alt="Thumb" class="w-full h-full object-cover" />
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Description Header -->
        <div class="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
          <div class="flex flex-wrap justify-between items-start mb-8 border-b border-gray-100 pb-8">
            <div class="flex-1 pr-6">
              <div class="flex gap-2 mb-3">
                <span class="bg-gray-100 text-casa-dark text-[10px] font-extrabold px-3 py-1 rounded-md uppercase tracking-widest">{property.tipoInmueble}</span>
                <span class="bg-gray-100 text-casa-dark text-[10px] font-extrabold px-3 py-1 rounded-md uppercase tracking-widest">{property.zonificacion}</span>
              </div>
              <h2 class="text-3xl md:text-4xl font-extrabold text-casa-dark mb-3 leading-tight">{property.tituloPropiedad}</h2>
              <p class="text-gray-500 flex items-center gap-2 font-medium"><MapPin size={18} class="text-casa-teal"/> {property.zona}, {property.ciudad} - {property.pais}</p>
            </div>
            <div class="text-right mt-4 md:mt-0 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <p class="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Precio Final</p>
              <p class="text-4xl font-black text-casa-teal leading-none">{dualPrice?.usdFormatted || '$0'} <span class="text-sm text-gray-400 font-bold">USD</span></p>
              <p class="text-xl font-black text-[#D4AF37] font-mono mt-1.5">{dualPrice?.bobFormatted || 'Bs. 0'} <span class="text-[10px] text-gray-400 font-normal font-sans">(T.C. {dualPrice?.tc || 6.96})</span></p>
              {#if property.expensas}
                <p class="text-xs text-gray-500 font-medium mt-2">+ Expensas: {property.expensas}</p>
              {/if}
            </div>
          </div>

          <div class="prose max-w-none text-gray-600 mb-10 text-lg">
            <h3 class="text-sm font-bold text-casa-teal uppercase tracking-widest mb-4">Descripción Detallada</h3>
            <p class="whitespace-pre-line leading-relaxed">{property.descripcionPropiedad || "Sin descripción comercial disponible."}</p>
          </div>
        </div>

        <!-- Ficha Técnica Avanzada -->
        <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div class="p-8 border-b border-gray-100 bg-gray-50/50">
            <h2 class="text-xl font-bold text-casa-dark flex items-center gap-2"><Settings size={20} class="text-casa-teal"/> Ficha Técnica Completa</h2>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            
            <!-- Bloque 1: Distribución -->
            <div class="p-8 space-y-6">
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Distribución</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><Bed size={16}/> Dormitorios en Suite</span> <span class="font-bold text-casa-dark">{property.dormitoriosSuite || 0}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><Bed size={16}/> Dormitorios Estándar</span> <span class="font-bold text-casa-dark">{property.dormitoriosEstandar || 0}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><Bath size={16}/> Baños Completos</span> <span class="font-bold text-casa-dark">{property.banosCompletos || 0}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><Info size={16}/> Medios Baños</span> <span class="font-bold text-casa-dark">{property.mediosBanos || 0}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><Info size={16}/> Baño de Servicio</span> <span class="font-bold text-casa-dark">{property.banosServicio || 0}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><Info size={16}/> Parqueos</span> <span class="font-bold text-casa-dark">{property.estacionamientos || 0} ({property.tipoEstacionamiento})</span></div>
              </div>
            </div>

            <!-- Bloque 2: Superficies y Materiales -->
            <div class="p-8 space-y-6">
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Superficies & Construcción</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><Ruler size={16}/> Sup. Terreno</span> <span class="font-bold text-casa-dark">{property.supTerreno || '-'} m²</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><Ruler size={16}/> Sup. Construida</span> <span class="font-bold text-casa-dark">{property.supConstruida || '-'} m²</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium">Antigüedad</span> <span class="font-bold text-casa-dark">{property.antiguedad || '-'}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium">Estado Conservación</span> <span class="font-bold text-casa-dark">{property.estadoConservacion || '-'}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium">Acabado de Pisos</span> <span class="font-bold text-casa-dark">{property.acabadosPiso || '-'}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium">Carpintería</span> <span class="font-bold text-casa-dark">{property.carpinteria || '-'}</span></div>
              </div>
            </div>

            <!-- Bloque 3: Legal y Datos Extra -->
            <div class="p-8 space-y-6">
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Estatus Legal & Entorno</h3>
              <div class="space-y-4">
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium flex items-center gap-2"><FileText size={16}/> Folio Real</span> <span class="font-bold {property.estadoFolio === 'Al día' ? 'text-green-600' : 'text-orange-500'}">{property.estadoFolio}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium">Gravámenes</span> <span class="font-bold text-casa-dark">{property.tieneGravamenes ? 'Sí' : 'No'}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium">Impuestos</span> <span class="font-bold text-casa-dark">{property.impuestosAlDia ? 'Al día' : 'Pendientes'}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-600 font-medium">Mascotas Permitidas</span> <span class="font-bold text-casa-dark">{property.mascotasPermitidas || '-'}</span></div>
                {#if property.cercanias}
                  <div class="pt-2">
                    <span class="text-gray-600 font-medium block mb-1">Cercanías:</span>
                    <span class="font-bold text-casa-dark text-sm">{property.cercanias}</span>
                  </div>
                {/if}
              </div>
            </div>

          </div>
          
          <!-- Amenidades Inferiores -->
          <div class="p-8 bg-gray-50/50 border-t border-gray-100">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              {#if property.equipamiento?.length > 0}
                <div>
                  <h3 class="text-xs font-bold text-casa-teal uppercase tracking-widest mb-4">Equipamiento Incluido</h3>
                  <div class="flex flex-wrap gap-2">
                    {#each property.equipamiento as eq}
                      <span class="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"><Check size={14} class="text-casa-teal"/> {eq}</span>
                    {/each}
                  </div>
                </div>
              {/if}
              {#if property.areasComunes?.length > 0}
                <div>
                  <h3 class="text-xs font-bold text-casa-teal uppercase tracking-widest mb-4">Áreas Comunes y Amenidades</h3>
                  <div class="flex flex-wrap gap-2">
                    {#each property.areasComunes as ac}
                      <span class="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"><Check size={14} class="text-casa-teal"/> {ac}</span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column (Agent, Map, Legal) -->
      <div class="w-full xl:w-[400px] shrink-0 space-y-6">
        
        <!-- Agent Card -->
        <div class="bg-casa-dark p-8 rounded-[2rem] shadow-xl text-center relative overflow-hidden">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-casa-teal/20 rounded-full blur-3xl"></div>
          <h3 class="text-[10px] text-casa-gold uppercase tracking-widest font-bold mb-6">Agente Captador</h3>
          {#if property.agenteFoto}
            <img src={property.agenteFoto} alt="Agente" class="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-casa-gold object-cover shadow-lg" />
          {:else}
            <div class="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-casa-gold bg-casa-teal flex items-center justify-center text-3xl text-white font-bold">
              {property.agenteNombre?.charAt(0) || 'A'}
            </div>
          {/if}
          <h2 class="text-xl font-bold text-white mb-1">{property.agenteNombre}</h2>
          <p class="text-xs text-gray-400 uppercase tracking-widest mb-6">Casa Legal Inmobiliaria</p>
          <div class="space-y-3">
            <button type="button" class="w-full py-3 bg-white text-casa-dark rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
              <Phone size={16}/> Llamar
            </button>
            <button type="button" class="w-full py-3 bg-casa-teal text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#0d3641] transition-colors flex items-center justify-center gap-2">
              <Mail size={16}/> Enviar Mensaje
            </button>
          </div>
        </div>

        <!-- Datos Confidenciales del Propietario (Solo visible para el creador) -->
        {#if property.agenteId === authState.user?.uid}
          <div class="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm relative overflow-hidden">
             <div class="absolute top-0 right-0 p-4 opacity-10"><Lock size={64}/></div>
             <h3 class="text-sm font-bold text-red-900 mb-4 flex items-center gap-2 relative z-10"><Lock size={16}/> Datos Confidenciales</h3>
             <div class="space-y-3 relative z-10">
               <div>
                 <p class="text-[10px] uppercase font-bold text-red-700/70 tracking-widest mb-0.5">Propietario</p>
                 <p class="font-bold text-red-900">{property.propietarioNombre}</p>
                 <p class="text-sm text-red-800 flex items-center gap-1 mt-1"><Phone size={12}/> {property.propietarioTel1}</p>
               </div>
               {#if property.notasInternas}
                 <div class="pt-3 border-t border-red-200">
                   <p class="text-[10px] uppercase font-bold text-red-700/70 tracking-widest mb-0.5">Notas del Captador</p>
                   <p class="text-sm text-red-900 leading-snug">{property.notasInternas}</p>
                 </div>
               {/if}
               <div class="pt-3 border-t border-red-200">
                 <p class="text-[10px] uppercase font-bold text-red-700/70 tracking-widest mb-0.5">Comisión Pactada</p>
                 <p class="font-bold text-red-900 text-lg">{property.comision || 'No especificada'}</p>
               </div>
             </div>
          </div>
        {/if}

        <!-- Google Map -->
        <div class="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100">
          <div id="propMap" class="w-full h-72 rounded-[1.5rem] bg-gray-100 flex items-center justify-center relative z-10">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando Mapa...</span>
          </div>
        </div>

        <!-- Documentos Legales -->
        {#if property.fotosLegales?.length > 0}
          <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 class="text-sm font-bold text-casa-dark mb-4 flex items-center gap-2"><ShieldCheck size={18} class="text-casa-teal"/> Bóveda Legal</h3>
            <p class="text-xs text-gray-500 mb-4">Haz clic en el documento para visualizar el comprobante.</p>
            <div class="space-y-3">
              {#each property.fotosLegales as doc}
                <button type="button" onclick={() => openLightbox(doc.url)} class="w-full text-left flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group border border-transparent hover:border-gray-200">
                  <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-gray-200 flex items-center justify-center">
                    <img src={doc.url} alt="Doc" class="w-full h-full object-cover group-hover:scale-110 transition-transform opacity-50"/>
                    <FileImage size={20} class="absolute text-casa-dark"/>
                  </div>
                  <span class="text-sm font-bold text-casa-dark line-clamp-1 flex-1">{doc.titulo || "Documento Adjunto"}</span>
                  <Maximize size={16} class="text-gray-400 group-hover:text-casa-teal"/>
                </button>
              {/each}
            </div>
          </div>
        {/if}

      </div>
    </div>
  </div>
{/if}
