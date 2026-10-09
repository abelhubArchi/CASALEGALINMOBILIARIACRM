<script>
  import { page } from '$app/state';
  import { ArrowLeft, MapPin, Bed, Bath, Maximize, FileText, CheckCircle, Link } from 'lucide-svelte';

  // ID de la propiedad que viene de la URL
  let propertyId = page.params.id;
  
  // MOCK DATA (esto se reemplazará conectando Firestore a través de la propiedad 'id')
  let property = {
    id: propertyId,
    titulo: 'Residencia en Las Lomas VIP',
    codigo: 'CL-001',
    tipo: 'Venta',
    precio: '850,000',
    descripcion: 'Espectacular residencia con acabados de lujo, jardín privado, 4 cajones de estacionamiento y seguridad 24/7. Perfectamente iluminada y lista para habitar. Ideal para familias que buscan exclusividad y confort.',
    habs: 4,
    banos: 4.5,
    m2Construccion: 450,
    m2Terreno: 600,
    ubicacion: 'Las Lomas, CDMX',
    estado: 'Activo',
    folioReal: 'FR-98347209-A',
    coBrokerage: '50%',
    imagenUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    galeria: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'
    ]
  };

  const createDirectLink = () => {
    // Almacenamos link falso con referencia del agente
    const fakeLink = `https://portal.casalegal.com/propiedad/${property.id}?agente=TUID`;
    alert(`Enlace público generado y copiado al portapapeles: \n\n${fakeLink}\n\nEste enlace mostrará tus datos de contacto cuando los clientes lo abran.`);
  };
</script>

<div class="h-full flex flex-col font-sans bg-gray-50 overflow-y-auto">
  <!-- Cabecera Imagen Hero -->
  <div class="h-[40vh] min-h-[300px] w-full relative group">
    <img src={property.imagenUrl} alt={property.titulo} class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-t from-casa-dark/95 via-casa-dark/40 to-transparent"></div>
    
    <div class="absolute top-8 left-8 z-10">
      <a href="/inventario" class="flex items-center gap-2 text-white hover:text-casa-gold transition-colors bg-black/30 border border-white/10 px-5 py-2.5 rounded-full backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.2em]">
        <ArrowLeft size={16} /> Volver al Catálogo
      </a>
    </div>

    <div class="absolute bottom-8 left-8 right-8 flex justify-between items-end z-10">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <span class="bg-casa-gold text-casa-dark text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest shadow-md">{property.tipo}</span>
          <span class="bg-black/40 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest shadow-md">{property.codigo}</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">{property.titulo}</h1>
        <p class="text-gray-300 flex items-center gap-2 text-lg mt-3 font-light"><MapPin size={18} class="text-casa-teal"/> {property.ubicacion}</p>
      </div>
      <div class="text-right hidden md:block">
        <p class="text-casa-teal font-extrabold text-5xl tracking-tight">${property.precio} <span class="text-sm font-normal text-white/50 uppercase tracking-widest ml-1">USD</span></p>
      </div>
    </div>
  </div>

  <div class="p-8 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-10">
    <!-- Detalles Principal -->
    <div class="lg:col-span-2 space-y-10">
      <!-- Ficha Técnica Rápida -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-evenly flex-wrap gap-4">
        <div class="text-center px-4">
          <Bed size={28} class="text-gray-400 mx-auto mb-3"/>
          <p class="text-3xl font-bold text-casa-dark">{property.habs}</p>
          <p class="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-2 font-semibold">Habs</p>
        </div>
        <div class="w-px h-16 bg-gray-100 hidden sm:block"></div>
        <div class="text-center px-4">
          <Bath size={28} class="text-gray-400 mx-auto mb-3"/>
          <p class="text-3xl font-bold text-casa-dark">{property.banos}</p>
          <p class="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-2 font-semibold">Baños</p>
        </div>
        <div class="w-px h-16 bg-gray-100 hidden sm:block"></div>
        <div class="text-center px-4">
          <Maximize size={28} class="text-gray-400 mx-auto mb-3"/>
          <p class="text-3xl font-bold text-casa-dark">{property.m2Construccion}</p>
          <p class="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-2 font-semibold">m² Const.</p>
        </div>
        <div class="w-px h-16 bg-gray-100 hidden sm:block"></div>
        <div class="text-center px-4">
          <FileText size={28} class="text-gray-400 mx-auto mb-3"/>
          <p class="text-lg font-bold text-casa-dark mt-4">{property.folioReal}</p>
          <p class="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-2 font-semibold">Folio Real</p>
        </div>
      </div>

      <!-- Descripción -->
      <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Descripción de la Propiedad</h3>
        <p class="text-gray-600 leading-relaxed text-lg font-light">{property.descripcion}</p>
      </div>

      <!-- Galería -->
      <div>
        <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Galería Multimedia</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          {#each property.galeria as img}
            <div class="h-40 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100 cursor-pointer">
              <img src={img} alt="galeria" class="w-full h-full object-cover hover:scale-110 transition-transform duration-700 ease-in-out" />
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Panel Lateral de Acción -->
    <div class="space-y-6">
      
      <!-- Bloque: Perfil Publico -->
      <div class="bg-white p-8 rounded-2xl shadow-lg border-t-[6px] border-casa-gold">
        <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Herramienta de Ventas</h3>
        
        <button onclick={createDirectLink} class="w-full py-4 bg-casa-dark text-white rounded-xl font-bold hover:bg-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 text-xs uppercase tracking-widest mb-4">
          <Link size={18} /> Link Personalizado
        </button>
        <p class="text-[11px] text-center text-gray-500 font-medium leading-relaxed">Genera un enlace del portal web público vinculado a tu perfil. Al compartirlo, los clientes verán tus datos de contacto.</p>
      </div>

      <!-- Bloque: CoBrokerage -->
      <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Condiciones Red MLS</h3>
        <div class="flex items-center gap-4 mb-2">
          <CheckCircle size={28} class="text-casa-teal" />
          <div>
            <p class="font-bold text-casa-dark text-xl">Co-Brokerage {property.coBrokerage}</p>
            <p class="text-sm text-gray-500">Disponible para la red interna</p>
          </div>
        </div>
      </div>

      <!-- Bloque: Contacto Asesor -->
      <div class="bg-casa-teal p-8 rounded-2xl shadow-lg text-white">
        <h3 class="text-[10px] font-bold text-casa-gold uppercase tracking-[0.2em] mb-4">Asesor Captador</h3>
        <p class="text-2xl font-bold mb-1">Lic. Fernando Montes</p>
        <p class="text-xs text-white/70 mb-6 uppercase tracking-wider font-medium">Broker Activo</p>
        <button class="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
          Contactar Asesor
        </button>
      </div>

    </div>
  </div>
</div>
