<script>
  import { onMount, onDestroy } from 'svelte';
  import { Map as MapIcon, Search, Filter, DollarSign, List, Building2, MousePointer2, Trash2, Tag, MapPin } from 'lucide-svelte';
  import { db } from '#lib/firebase';
  import { collection, getDocs, query } from 'firebase/firestore';
  import { getDualPrice, TIPO_CAMBIO_OFICIAL } from '#lib/currency';

  let mapInstance = null;
  let customRectangle = $state(null);
  let allProperties = $state([]);
  let displayedProperties = $state([]);
  let markers = [];
  let infoWindow = null;
  
  // Search Filters
  let searchFilters = $state({
    tipoInmueble: 'Todos',
    tipoOperacion: 'Todos',
    precioMax: '',
    moneda: 'USD',
    busquedaTexto: ''
  });

  const loadGoogleMaps = () => {
    // Si ya está cargado por otro módulo, lo usamos directo.
    if (window.google && window.google.maps) {
      initMap();
    } else {
      window.initGoogleMapReq = initMap;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCYpYc1EuqePBuNwGlphfoHwmeWVTQRGS0&callback=initGoogleMapReq`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  };

  const initMap = async () => {
    const mapElement = document.getElementById('googleMapReq');
    if (!mapElement || !window.google) return;

    const center = new google.maps.LatLng(-16.5000, -68.1193); // La Paz
    
    mapInstance = new google.maps.Map(mapElement, {
      zoom: 13,
      center: center,
      mapTypeId: 'roadmap',
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
      ]
    });

    infoWindow = new google.maps.InfoWindow();

    await fetchProperties();
  };

  const fetchProperties = async () => {
    try {
      const snap = await getDocs(collection(db, 'inmuebles'));
      allProperties = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      applyFilters();
    } catch (e) { console.error(e); }
  };

  const activarCuadroManual = () => {
    if (!window.google || !mapInstance) return;
    
    // Si ya existe, lo centramos y lo hacemos visible
    if (customRectangle) {
      customRectangle.setMap(null);
    }

    const bounds = mapInstance.getBounds();
    // Hacer el cuadro un 30% del tamaño de la vista actual
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latDiff = (ne.lat() - sw.lat()) / 3;
    const lngDiff = (ne.lng() - sw.lng()) / 3;
    const centerLat = mapInstance.getCenter().lat();
    const centerLng = mapInstance.getCenter().lng();

    const rectBounds = {
      north: centerLat + latDiff,
      south: centerLat - latDiff,
      east: centerLng + lngDiff,
      west: centerLng - lngDiff,
    };

    customRectangle = new google.maps.Rectangle({
      bounds: rectBounds,
      editable: true,
      draggable: true,
      fillColor: '#0c3641',
      fillOpacity: 0.2,
      strokeColor: '#0c3641',
      strokeWeight: 2,
      map: mapInstance
    });

    customRectangle.addListener('bounds_changed', filterByShape);
    filterByShape();
  };

  const clearShape = () => {
    if (customRectangle) {
      customRectangle.setMap(null);
      customRectangle = null;
    }
    applyFilters();
  };

  const parseNum = (val) => {
    if (val === null || val === undefined) return 0;
    const str = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const applyFilters = () => {
    const rawMax = searchFilters.precioMax ? parseNum(searchFilters.precioMax) : 0;
    const queryTxt = (searchFilters.busquedaTexto || '').toLowerCase().trim();

    let filtered = allProperties.filter(p => {
      // 1. Tipo Inmueble
      if (searchFilters.tipoInmueble !== 'Todos') {
        const tipoP = (p.tipoInmueble || '').toLowerCase();
        const tipoF = searchFilters.tipoInmueble.toLowerCase();
        if (tipoP !== tipoF) return false;
      }

      // 2. Tipo Operación
      if (searchFilters.tipoOperacion !== 'Todos') {
        const opP = (p.tipoOperacion || p.operacion || '').toLowerCase();
        const opF = searchFilters.tipoOperacion.toLowerCase();
        if (opP !== opF) return false;
      }

      // 3. Dual Price Filtering (USD o BOB)
      if (rawMax > 0) {
        const dual = getDualPrice(p.precioLista, p.moneda);
        const compPrice = searchFilters.moneda === 'BOB' ? dual.bob : dual.usd;
        if (compPrice > rawMax) return false;
      }

      // 4. Búsqueda por texto (zona, título, ciudad, código)
      if (queryTxt) {
        const textTarget = `${p.tituloPropiedad || ''} ${p.zona || ''} ${p.ciudad || ''} ${p.codigoPropiedad || ''} ${p.descripcion || ''}`.toLowerCase();
        if (!textTarget.includes(queryTxt)) return false;
      }

      return true;
    });

    displayedProperties = filtered;
    updateMarkers(filtered);
    
    if (customRectangle) filterByShape();
  };

  const filterByShape = () => {
    if (!customRectangle) return;
    const rectBounds = customRectangle.getBounds();
    
    let inShape = [];
    displayedProperties.forEach(p => {
      if (!p.latitud || !p.longitud) return;
      const pt = new google.maps.LatLng(p.latitud, p.longitud);
      if (rectBounds.contains(pt)) {
        inShape.push(p);
      }
    });

    displayedProperties = inShape;
    updateMarkers(inShape);
  };

  const updateMarkers = (propsToShow) => {
    if (!window.google) return;
    markers.forEach(m => m.setMap(null));
    markers = [];

    // Icono Casa Verde (SVG Base64 o URL)
    const casaVerde = {
      url: 'https://cdn-icons-png.flaticon.com/512/25/25694.png', // Fallback icon
      scaledSize: new google.maps.Size(24, 24)
    };
    
    // Generar un SVG en línea de una casa verde
    const svgMarker = {
      path: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
      fillColor: "#10b981", // Verde esmeralda
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#065f46",
      rotation: 0,
      scale: 1.5,
      anchor: new google.maps.Point(12, 20),
    };

    propsToShow.forEach(p => {
      if (p.latitud && p.longitud) {
        const marker = new google.maps.Marker({
          position: { lat: Number(p.latitud), lng: Number(p.longitud) },
          map: mapInstance,
          title: p.tituloPropiedad || p.tipoInmueble,
          icon: svgMarker
        });
        
        marker.addListener('click', () => {
          const prices = getDualPrice(p.precioLista, p.moneda);
          const content = `
            <div style="font-family: sans-serif; max-width: 220px; padding: 6px;">
              <img src="${p.fotoPrincipal || 'https://via.placeholder.com/200'}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
              <h4 style="margin: 0; font-size: 14px; font-weight: bold; color: #0c3641;">${p.tituloPropiedad || p.tipoInmueble}</h4>
              <p style="margin: 4px 0 1px 0; font-weight: 800; color: #0c3641; font-size: 13px;">${prices.usdFormatted} USD</p>
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #d4af37; font-size: 11px;">${prices.bobFormatted}</p>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${p.zona || ''} ${p.ciudad ? '· ' + p.ciudad : ''}</p>
              <a href="/inmuebles/${p.id}" target="_blank" style="display: block; text-align: center; background: #0c3641; color: white; padding: 6px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold;">Ver Detalle</a>
            </div>
          `;
          infoWindow.setContent(content);
          infoWindow.open(mapInstance, marker);
        });

        markers.push(marker);
      }
    });
  };

  onMount(() => {
    loadGoogleMaps();
  });
  
  onDestroy(() => {
    if (window.initGoogleMapReq) delete window.initGoogleMapReq;
  });
</script>

<div class="p-4 md:p-8 h-full bg-casa-light flex flex-col font-sans overflow-hidden">
  <header class="mb-5">
    <div class="flex items-center gap-2 mb-1">
      <span class="px-2.5 py-0.5 rounded-full bg-casa-teal/10 text-casa-teal font-bold text-[10px] uppercase tracking-wider">
        Buscador Geográfico & Filtrado Dual
      </span>
      <span class="text-xs text-gray-500 font-medium">T.C. Oficial: <strong class="text-casa-dark font-mono">11.86 Bs/USD</strong></span>
    </div>
    <h1 class="text-2xl md:text-3xl font-extrabold text-[#0c3641] flex items-center gap-3">
      <MapIcon size={30} class="text-casa-teal" /> 
      Requerimientos (Smart Search)
    </h1>
    <p class="text-gray-500 mt-1 text-xs md:text-sm">Filtra por precio en USD o Bolivianos, tipo de inmueble o dibuja un polígono en el mapa para ubicar la propiedad ideal.</p>
  </header>

  <!-- Filtros Inteligentes Manuales -->
  <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-5 flex flex-wrap gap-3 items-end">
    
    <!-- Búsqueda por texto (Zona / Código) -->
    <div class="flex-1 min-w-[180px]">
      <label for="filter-busqueda" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Search size={12}/> Zona o Palabra Clave</label>
      <input 
        id="filter-busqueda"
        type="text" 
        bind:value={searchFilters.busquedaTexto} 
        oninput={applyFilters} 
        placeholder="Ej: Calacoto, Achumani, Sopocachi..." 
        class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" 
      />
    </div>

    <!-- Tipo de Inmueble -->
    <div class="w-[150px]">
      <label for="filter-tipo" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Building2 size={12}/> Tipo Inmueble</label>
      <select id="filter-tipo" bind:value={searchFilters.tipoInmueble} onchange={applyFilters} class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-casa-teal font-medium">
        <option value="Todos">Todos</option>
        <option value="Casa">Casa</option>
        <option value="Departamento">Departamento</option>
        <option value="Terreno">Terreno</option>
        <option value="Oficina">Oficina</option>
        <option value="Local Comercial">Local Comercial</option>
      </select>
    </div>

    <!-- Operación -->
    <div class="w-[160px]">
      <label for="filter-operacion" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Tag size={12}/> Operación</label>
      <select id="filter-operacion" bind:value={searchFilters.tipoOperacion} onchange={applyFilters} class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-casa-teal font-medium">
        <option value="Todos">Todas</option>
        <option value="Venta">Venta</option>
        <option value="Alquiler">Alquiler</option>
        <option value="Anticrético">Anticrético</option>
        <option value="Preventa">Preventa</option>
      </select>
    </div>

    <!-- Precio Máximo con Toggle de Moneda -->
    <div class="flex-1 min-w-[200px]">
      <div class="flex items-center justify-between mb-1">
        <label for="filter-precio" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <DollarSign size={12}/> Precio Máximo ({searchFilters.moneda})
        </label>
        <!-- Toggle USD / BOB -->
        <div class="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button 
            type="button" 
            onclick={() => { searchFilters.moneda = 'USD'; applyFilters(); }}
            class="px-2 py-0.5 text-[10px] font-bold rounded-md transition-all {searchFilters.moneda === 'USD' ? 'bg-[#0c3641] text-white shadow-xs' : 'text-gray-500 hover:text-black'}"
          >
            $ USD
          </button>
          <button 
            type="button" 
            onclick={() => { searchFilters.moneda = 'BOB'; applyFilters(); }}
            class="px-2 py-0.5 text-[10px] font-bold rounded-md transition-all {searchFilters.moneda === 'BOB' ? 'bg-[#D4AF37] text-black shadow-xs' : 'text-gray-500 hover:text-black'}"
          >
            Bs. BOB
          </button>
        </div>
      </div>
      <input 
        id="filter-precio"
        type="number" 
        bind:value={searchFilters.precioMax} 
        oninput={applyFilters} 
        placeholder={searchFilters.moneda === 'USD' ? 'Ej. 120000' : 'Ej. 850000'} 
        class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-casa-teal font-medium font-mono" 
      />
    </div>

    <!-- Botones de Acción -->
    <div class="flex gap-2">
      <button onclick={applyFilters} class="bg-[#0c3641] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-black transition-colors flex items-center gap-2 cursor-pointer">
        <Search size={16}/> Buscar
      </button>
      <button onclick={activarCuadroManual} class="bg-casa-teal text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#0c3641] transition-colors flex items-center gap-2 cursor-pointer" title="Dibujar Cuadro en Mapa">
        <MousePointer2 size={16}/> Seleccionar Zona
      </button>
      {#if customRectangle}
        <button onclick={clearShape} class="bg-red-50 text-red-500 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200 cursor-pointer" title="Borrar Cuadro del Mapa">
          <Trash2 size={16}/> Limpiar Área
        </button>
      {/if}
    </div>
  </div>

  <div class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-[550px]">
    
    <!-- Area del Mapa -->
    <div class="flex-1 min-h-[350px] lg:min-h-0 relative rounded-2xl overflow-hidden border-[3px] border-gray-200 shadow-inner bg-gray-100">
      <div id="googleMapReq" class="w-full h-full z-10 relative flex items-center justify-center">
        <div class="animate-spin h-8 w-8 border-4 border-casa-teal border-t-transparent rounded-full"></div>
      </div>
      <!-- Indicador Flotante -->
      <div class="absolute bottom-6 left-6 z-20 bg-white/90 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-gray-200 pointer-events-none flex items-center gap-3">
        <div class="p-2 bg-casa-teal/10 rounded-lg"><MousePointer2 size={20} class="text-casa-teal"/></div>
        <div>
          <p class="text-xs font-bold text-[#0c3641]">Herramienta de Selección Geográfica</p>
          <p class="text-[10px] text-gray-500">Mueve o redimensiona el recuadro para filtrar propiedades dentro del polígono.</p>
        </div>
      </div>
    </div>

    <!-- Resultados (Estilo Inventario Casa) -->
    <div class="w-full lg:w-[420px] bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col overflow-hidden">
      <div class="mb-4 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <h3 class="font-bold text-[#0c3641] text-lg">Resultados ({displayedProperties.length})</h3>
          <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Propiedades compatibles encontradas</p>
        </div>
        <List size={20} class="text-gray-300"/>
      </div>
      
      <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {#each displayedProperties as prop}
          {@const prices = getDualPrice(prop.precioLista, prop.moneda)}
          <a href="/inmuebles/{prop.id}" target="_blank" class="block bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-3 group hover:border-casa-teal/50 hover:bg-white transition-all shadow-sm">
            <div class="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden shrink-0">
              <img src={prop.fotoPrincipal || '/logoinmo.png'} alt="Prop" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="text-[9px] font-black uppercase text-casa-teal tracking-widest bg-casa-teal/10 px-2 py-0.5 rounded w-fit">{prop.tipoOperacion || 'Venta'}</span>
                <span class="text-[9px] font-bold text-gray-400 truncate">{prop.tipoInmueble}</span>
              </div>
              <p class="font-bold text-[#0c3641] text-xs leading-tight truncate">{prop.tituloPropiedad || prop.tipoInmueble}</p>
              
              <!-- Precios Duales (USD y BOB) -->
              <div class="my-1">
                <span class="text-xs font-black text-gray-800 font-mono">{prices.usdFormatted} USD</span>
                <span class="text-[11px] font-bold text-[#8c6a26] font-mono block">{prices.bobFormatted}</span>
              </div>
              
              <p class="text-[10px] text-gray-400 truncate flex items-center gap-1">
                <MapPin size={10} class="text-gray-400 shrink-0"/> {prop.zona || prop.ciudad || 'Ubicación'}
              </p>
            </div>
          </a>
        {/each}
        
        {#if displayedProperties.length === 0}
          <div class="text-center py-20 px-4">
            <Search size={40} class="mx-auto text-gray-200 mb-4" />
            <p class="text-gray-500 font-bold text-sm">No hay propiedades que coincidan.</p>
            <p class="text-xs text-gray-400 mt-2">Prueba aumentando el precio máximo o seleccionando otra área en el mapa.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
</style>
