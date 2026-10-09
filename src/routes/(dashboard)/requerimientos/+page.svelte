<script>
  import { onMount, onDestroy } from 'svelte';
  import { Map as MapIcon, Search, Filter, DollarSign, List, Building2, MousePointer2, Trash2 } from 'lucide-svelte';
  import { db } from '#lib/firebase';
  import { collection, getDocs, query } from 'firebase/firestore';

  let mapInstance = null;
  let customRectangle = null;
  let allProperties = $state([]);
  let displayedProperties = $state([]);
  let markers = [];
  let infoWindow = null;
  
  // Search Filters
  let searchFilters = $state({
    tipoInmueble: 'Todos',
    tipoOperacion: 'Todos',
    precioMax: '',
    moneda: 'USD'
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

  const applyFilters = () => {
    let filtered = allProperties.filter(p => {
      if (searchFilters.tipoInmueble !== 'Todos' && p.tipoInmueble !== searchFilters.tipoInmueble) return false;
      if (searchFilters.tipoOperacion !== 'Todos' && p.tipoOperacion !== searchFilters.tipoOperacion) return false;
      if (searchFilters.precioMax && Number(p.precioLista) > Number(searchFilters.precioMax)) return false;
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
          const content = `
            <div style="font-family: sans-serif; max-width: 200px; padding: 5px;">
              <img src="${p.fotoPrincipal || 'https://via.placeholder.com/200'}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
              <h4 style="margin: 0; font-size: 14px; color: #0c3641;">${p.tituloPropiedad || p.tipoInmueble}</h4>
              <p style="margin: 4px 0; font-weight: bold; color: #10b981;">$${p.precioLista}</p>
              <a href="/inmuebles/${p.id}" target="_blank" style="display: block; text-align: center; background: #0c3641; color: white; padding: 5px; border-radius: 5px; text-decoration: none; font-size: 12px; margin-top: 5px;">Ver Detalle</a>
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

<div class="p-8 h-full bg-casa-light flex flex-col font-sans overflow-hidden">
  <header class="mb-6">
    <h1 class="text-3xl font-extrabold text-[#0c3641] flex items-center gap-3">
      <MapIcon size={32} class="text-casa-teal" /> 
      Requerimientos (Smart Search)
    </h1>
    <p class="text-gray-500 mt-1 text-sm">Usa los filtros inteligentes o dibuja un polígono en el mapa para encontrar el inmueble perfecto para tu cliente.</p>
  </header>

  <!-- Filtros Inteligentes Manuales -->
  <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
    <div class="flex-1 min-w-[150px]">
      <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Building2 size={12}/> Tipo Inmueble</label>
      <select bind:value={searchFilters.tipoInmueble} onchange={applyFilters} class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-casa-teal font-medium">
        <option value="Todos">Todos</option>
        <option value="Casa">Casa</option>
        <option value="Departamento">Departamento</option>
        <option value="Terreno">Terreno</option>
        <option value="Oficina">Oficina</option>
        <option value="Local Comercial">Local Comercial</option>
      </select>
    </div>
    <div class="flex-1 min-w-[150px]">
      <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Building2 size={12}/> Operación</label>
      <select bind:value={searchFilters.tipoOperacion} onchange={applyFilters} class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-casa-teal font-medium">
        <option value="Todos">Todas las operaciones</option>
        <option value="Venta">Venta</option>
        <option value="Alquiler">Alquiler</option>
        <option value="Anticrético">Anticrético</option>
        <option value="Preventa">Preventa</option>
      </select>
    </div>
    <div class="flex-1 min-w-[150px]">
      <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign size={12}/> Precio Máximo</label>
      <input type="number" bind:value={searchFilters.precioMax} oninput={applyFilters} placeholder="Ej. 150000" class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-casa-teal font-medium" />
    </div>
    <div class="flex gap-2">
      <button onclick={applyFilters} class="bg-casa-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-black transition-colors flex items-center gap-2">
        <Search size={16}/> Buscar
      </button>
      <button onclick={activarCuadroManual} class="bg-casa-teal text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#0c3641] transition-colors flex items-center gap-2" title="Dibujar Cuadro en Mapa">
        <MousePointer2 size={16}/> Seleccionar Zona
      </button>
      {#if customRectangle}
        <button onclick={clearShape} class="bg-red-50 text-red-500 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200" title="Borrar Cuadro del Mapa">
          <Trash2 size={16}/> Limpiar Área
        </button>
      {/if}
    </div>
  </div>

  <div class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-[600px]">
    
    <!-- Area del Mapa -->
    <div class="flex-1 min-h-[400px] lg:min-h-0 relative rounded-2xl overflow-hidden border-[3px] border-gray-200 shadow-inner bg-gray-100">
      <div id="googleMapReq" class="w-full h-full z-10 relative flex items-center justify-center">
        <div class="animate-spin h-8 w-8 border-4 border-casa-teal border-t-transparent rounded-full"></div>
      </div>
      <!-- Indicador Flotante -->
      <div class="absolute bottom-6 left-6 z-20 bg-white/90 backdrop-blur px-4 py-3 rounded-xl shadow-lg border border-gray-200 pointer-events-none flex items-center gap-3">
        <div class="p-2 bg-casa-teal/10 rounded-lg"><MousePointer2 size={20} class="text-casa-teal"/></div>
        <div>
          <p class="text-xs font-bold text-[#0c3641]">Herramienta de Dibujo Activa</p>
          <p class="text-[10px] text-gray-500">Usa los botones superiores del mapa para enmarcar zonas.</p>
        </div>
      </div>
    </div>

    <!-- Resultados (Estilo Inventario Casa) -->
    <div class="w-full lg:w-[400px] bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col overflow-hidden">
      <div class="mb-4 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <h3 class="font-bold text-[#0c3641] text-lg">Resultados ({displayedProperties.length})</h3>
          <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Propiedades compatibles</p>
        </div>
        <List size={20} class="text-gray-300"/>
      </div>
      
      <div class="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {#each displayedProperties as prop}
          <a href="/inmuebles/{prop.id}" target="_blank" class="block bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-3 group hover:border-casa-teal/50 hover:bg-white transition-all shadow-sm">
            <div class="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden shrink-0">
              <img src={prop.fotoPrincipal} alt="Prop" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <span class="text-[9px] font-black uppercase text-casa-teal tracking-widest bg-casa-teal/10 px-2 py-0.5 rounded w-fit mb-1">{prop.tipoOperacion}</span>
              <p class="font-bold text-[#0c3641] text-sm leading-tight truncate">{prop.tituloPropiedad || prop.tipoInmueble}</p>
              <p class="text-xs font-black text-gray-500 my-1">${prop.precioLista}</p>
              <p class="text-[10px] text-gray-400 truncate">{prop.zona}</p>
            </div>
          </a>
        {/each}
        
        {#if displayedProperties.length === 0}
          <div class="text-center py-20 px-4">
            <Search size={40} class="mx-auto text-gray-200 mb-4" />
            <p class="text-gray-500 font-bold text-sm">No hay propiedades que coincidan.</p>
            <p class="text-xs text-gray-400 mt-2">Amplía tu cuadro en el mapa o reduce los filtros de búsqueda superior.</p>
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
