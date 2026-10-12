<script>
  import { ArrowLeft, MapPin, Home, Info, ShieldCheck, CheckCircle, ChevronRight, ChevronLeft, Save, FileImage, Camera, CheckSquare, Trash2, Plus, X, Loader2 } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { tick, onMount } from 'svelte';
  import { page } from '$app/state';
  import { authState } from '#lib/authStore.svelte.js';
  import { db, storage } from '#lib/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  
  let currentStep = $state(1);
  const totalSteps = 4;
  let isPublishing = $state(false);
  let loadingData = $state(true);
  let propId = $state('');

  let formData = $state({
    estado: 'Activo',
    propietarioNombre: '', propietarioCI: '', propietarioTel1: '', propietarioTel2: '', propietarioEmail: '', propietarioDir: '',
    tipoRepresentacion: 'Exclusiva', fechaInicio: '', fechaVencimiento: '', comision: '', notasInternas: '', llavesOficina: false, ubicacionLlaves: '',
    tituloPropiedad: '', descripcionPropiedad: '', tipoOperacion: 'Venta', tipoInmueble: 'Casa', precioLista: '', moneda: 'USD', expensas: '', formaPago: 'Al contado',
    zona: '', ciudad: 'Santa Cruz', provincia: '', pais: 'Bolivia', codigoPostal: '', nombreEdificio: '', numBloque: '', numDepto: '', latitud: -17.7833, longitud: -63.1821, cercanias: '',
    supTerreno: '', supConstruida: '', supSemicubierta: '', supComun: '', numPisos: '', dormitoriosSuite: '', dormitoriosEstandar: '', banosCompletos: '', mediosBanos: '', banosServicio: '',
    areasSociales: [], tipoCocina: 'Cerrada', dependencias: [], estacionamientos: '', tipoEstacionamiento: 'Techado', zonificacion: 'Residencial',
    antiguedad: '', estadoConservacion: 'Excelente', orientacion: 'Norte', acabadosPiso: 'Porcelanato', mesadas: 'Granito', carpinteria: 'Aluminio',
    equipamiento: [], serviciosBasicos: [], areasComunes: [], mascotasPermitidas: 'Sí',
    estadoFolio: 'Al día', tieneHipoteca: false, bancoAcreedor: '', saldoHipoteca: '', tieneGravamenes: false, impuestosAlDia: true, planosAprobados: true,
    
    // Media
    fotoPrincipalUrl: '', fotoPrincipalFile: null, fotoPrincipalPreview: '',
    fotosSecundariasUrls: [], fotosSecundariasFiles: [], 
    fotosLegalesExisting: [], fotosLegalesFiles: [], 
  });

  let mapInstance = null;
  let marker = null;

  const initMap = () => {
    if (mapInstance || typeof google === 'undefined') return;
    const mapElement = document.getElementById('googleMap');
    if (!mapElement) return;

    const myLatlng = { lat: parseFloat(formData.latitud), lng: parseFloat(formData.longitud) };
    
    mapInstance = new google.maps.Map(mapElement, {
      zoom: 14, center: myLatlng, mapTypeId: 'roadmap', disableDefaultUI: true, zoomControl: true,
    });

    marker = new google.maps.Marker({
      position: myLatlng, map: mapInstance, draggable: true, animation: google.maps.Animation.DROP,
    });

    google.maps.event.addListener(marker, 'dragend', function (e) {
      formData.latitud = e.latLng.lat(); formData.longitud = e.latLng.lng();
    });

    mapInstance.addListener('click', (e) => {
      marker.setPosition(e.latLng); formData.latitud = e.latLng.lat(); formData.longitud = e.latLng.lng();
    });
  };

  const loadGoogleMaps = () => {
    if (window.google && window.google.maps) { initMap(); } else {
      window.initGoogleMap = initMap;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCYpYc1EuqePBuNwGlphfoHwmeWVTQRGS0&callback=initGoogleMap`;
      script.async = true; script.defer = true;
      document.head.appendChild(script);
    }
  };

  onMount(async () => {
    try {
      propId = page.params.id;
      const docRef = doc(db, 'inmuebles', propId);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        const data = snap.data();
        if (data.agenteId !== authState.user?.uid) {
          alert("No tienes permiso para editar este inmueble.");
          goto('/inventario');
          return;
        }

        // Cargar datos al formData
        Object.keys(data).forEach(key => {
          if (key !== 'fotoPrincipal' && key !== 'fotosSecundarias' && key !== 'fotosLegales' && formData.hasOwnProperty(key)) {
            formData[key] = data[key];
          }
        });
        
        formData.fotoPrincipalUrl = data.fotoPrincipal || '';
        formData.fotosSecundariasUrls = data.fotosSecundarias || [];
        formData.fotosLegalesExisting = data.fotosLegales || [];
        
      } else {
        alert("Inmueble no encontrado");
        goto('/inventario');
      }
    } catch (error) {
      console.error(error);
    } finally {
      loadingData = false;
    }
  });

  const nextStep = async () => { 
    if (currentStep < totalSteps) {
      currentStep++; 
      if (currentStep === 2) {
        await tick();
        setTimeout(loadGoogleMaps, 300);
      }
    }
  };
  const prevStep = () => { if (currentStep > 1) currentStep--; };

  const uploadFile = async (file, path) => {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep < totalSteps) { nextStep(); return; }
    
    isPublishing = true;
    try {
      const docRef = doc(db, 'inmuebles', propId);
      
      let finalFotoPrincipalUrl = formData.fotoPrincipalUrl;
      if (formData.fotoPrincipalFile) {
        finalFotoPrincipalUrl = await uploadFile(formData.fotoPrincipalFile, `inmuebles/${propId}/portada_${Date.now()}`);
      }

      let finalFotosSecundariasUrls = [...formData.fotosSecundariasUrls];
      for (const fs of formData.fotosSecundariasFiles) {
        const url = await uploadFile(fs.file, `inmuebles/${propId}/secundarias/${Date.now()}_${fs.file.name}`);
        finalFotosSecundariasUrls.push(url);
      }

      let finalFotosLegalesData = [...formData.fotosLegalesExisting];
      for (const fl of formData.fotosLegalesFiles) {
        if (fl.file) {
          const url = await uploadFile(fl.file, `inmuebles/${propId}/legales/${Date.now()}_${fl.file.name}`);
          finalFotosLegalesData.push({ titulo: fl.titulo, url });
        }
      }

      const updateData = { ...formData };
      delete updateData.fotoPrincipalFile; delete updateData.fotoPrincipalPreview; delete updateData.fotoPrincipalUrl;
      delete updateData.fotosSecundariasFiles; delete updateData.fotosSecundariasUrls;
      delete updateData.fotosLegalesExisting; delete updateData.fotosLegalesFiles;

      await updateDoc(docRef, {
        ...updateData,
        fotoPrincipal: finalFotoPrincipalUrl,
        fotosSecundarias: finalFotosSecundariasUrls,
        fotosLegales: finalFotosLegalesData
      });
      
      alert("¡Inmueble actualizado exitosamente!");
      goto(`/inmuebles/${propId}`);
      
    } catch (error) {
      console.error(error); alert("Error al actualizar: " + error.message);
    } finally {
      isPublishing = false;
    }
  };

  const handleFotoPrincipal = (e) => {
    const file = e.target.files[0];
    if (file) {
      formData.fotoPrincipalFile = file;
      formData.fotoPrincipalPreview = URL.createObjectURL(file);
    }
  };
  const handleFotosSecundarias = (e) => {
    Array.from(e.target.files).forEach(file => { formData.fotosSecundariasFiles.push({ file, preview: URL.createObjectURL(file) }); });
  };
  const addFotoLegal = () => { formData.fotosLegalesFiles.push({ titulo: '', file: null, preview: null }); };
  const handleFotoLegalUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) { formData.fotosLegalesFiles[index].file = file; formData.fotosLegalesFiles[index].preview = URL.createObjectURL(file); }
  };

  const stepsInfo = [
    { num: 1, title: 'Datos Básicos & Comerciales', icon: Info },
    { num: 2, title: 'Ubicación & Físico', icon: MapPin },
    { num: 3, title: 'Materiales & Amenidades', icon: Home },
    { num: 4, title: 'Legal & Multimedia', icon: ShieldCheck }
  ];
</script>

{#if loadingData}
  <div class="flex items-center justify-center min-h-screen bg-casa-light">
    <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-casa-teal"></div>
  </div>
{:else}
  <div class="min-h-screen bg-casa-light flex flex-col font-sans">
    <header class="bg-white px-8 py-5 flex items-center justify-between border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div class="flex items-center gap-4">
        <button type="button" onclick={() => history.back()} class="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-casa-teal hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 class="text-xl font-extrabold text-casa-dark tracking-tight leading-none">Editar Inmueble</h1>
          <p class="text-[11px] text-gray-400 uppercase tracking-widest font-bold mt-1">Ref: {propId.substring(0,8).toUpperCase()}</p>
        </div>
      </div>
      
      <div class="text-right">
        <span class="text-[10px] text-casa-teal font-extrabold uppercase tracking-widest">Paso {currentStep} de {totalSteps}</span>
        <div class="flex gap-2 mt-2">
          {#each Array(totalSteps) as _, i}
            <div class="h-1.5 w-8 rounded-full {i < currentStep ? 'bg-casa-teal' : 'bg-gray-200'} transition-colors duration-500"></div>
          {/each}
        </div>
      </div>
    </header>

    <div class="flex-1 flex p-8 gap-12 max-w-7xl mx-auto w-full">
      <div class="w-64 hidden lg:block shrink-0 pt-4">
        <ul class="space-y-8 relative before:absolute before:inset-y-2 before:left-[19px] before:w-px before:bg-gray-200">
          {#each stepsInfo as step}
            <li class="flex items-start gap-4 relative z-10">
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors duration-300
                {currentStep > step.num ? 'bg-casa-teal text-white border-none' : currentStep === step.num ? 'bg-casa-gold text-casa-dark border-2 border-casa-gold' : 'bg-white border-2 border-gray-200 text-gray-400'}">
                {#if currentStep > step.num}<CheckCircle size={20} />{:else}<svelte:component this={step.icon} size={18} />{/if}
              </div>
              <div class="pt-2">
                <p class="text-[10px] uppercase tracking-widest font-bold {currentStep >= step.num ? 'text-casa-teal' : 'text-gray-400'}">Paso {step.num}</p>
                <p class="text-sm font-bold {currentStep >= step.num ? 'text-casa-dark' : 'text-gray-400'} leading-tight mt-0.5">{step.title}</p>
              </div>
            </li>
          {/each}
        </ul>
      </div>

      <div class="flex-1 bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-gray-100 relative overflow-hidden">
        <form onsubmit={handleSubmit} class="h-full flex flex-col">
          
          <!-- STEP 1 -->
          {#if currentStep === 1}
            <div class="animate-in fade-in slide-in-from-right-8 duration-500 space-y-10">
              <section>
                <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">1. Marketing y Presentación</h2>
                <div class="grid grid-cols-1 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Título de la Propiedad</label>
                    <input type="text" bind:value={formData.tituloPropiedad} required class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none font-bold text-casa-dark" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Descripción Comercial Detallada</label>
                    <textarea bind:value={formData.descripcionPropiedad} required rows="4" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none"></textarea>
                  </div>
                </div>
              </section>

              <section>
                <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">2. Clasificación Comercial & Estado</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div class="space-y-2 lg:col-span-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado del Inmueble (Score)</label>
                    <select bind:value={formData.estado} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none font-bold {formData.estado === 'Vendido' ? 'text-purple-700 bg-purple-50' : formData.estado === 'Reservado' ? 'text-amber-800 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}">
                      <option value="Activo">Activo (Disponible)</option>
                      <option value="Reservado">Reservado</option>
                      <option value="Vendido">Vendido (+100 PTS Score)</option>
                    </select>
                  </div>
                  <div class="space-y-2 lg:col-span-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Operación</label>
                    <select bind:value={formData.tipoOperacion} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none">
                      <option>Venta</option><option>Alquiler</option><option>Alquiler Temporal</option><option>Anticrético</option><option>Traspaso</option>
                    </select>
                  </div>
                  <div class="space-y-2 lg:col-span-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo Inmueble</label>
                    <select bind:value={formData.tipoInmueble} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none">
                      <optgroup label="Residencial"><option>Casa</option><option>Departamento</option><option>Penthouse</option><option>Duplex</option><option>Terreno/Lote</option><option>Casa en condominio</option></optgroup>
                      <optgroup label="Comercial"><option>Local comercial</option><option>Oficina</option><option>Edificio entero</option><option>Galpón/Depósito</option><option>Hotel/Alojamiento</option></optgroup>
                    </select>
                  </div>
                  <div class="space-y-2 lg:col-span-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Precio</label>
                    <input type="number" bind:value={formData.precioLista} required class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none font-bold text-lg" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Moneda</label>
                    <select bind:value={formData.moneda} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none font-bold"><option>USD</option><option>BOB</option></select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Zonificación</label>
                    <select bind:value={formData.zonificacion} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none"><option>Residencial</option><option>Comercial</option><option>Mixta</option><option>Industrial</option></select>
                  </div>
                </div>
              </section>

              <section>
                <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">3. Datos del Propietario (Privado)</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2 md:col-span-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre Completo / Razón Social</label>
                    <input type="text" bind:value={formData.propietarioNombre} required class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono Principal</label>
                    <input type="text" bind:value={formData.propietarioTel1} required class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Comisión</label>
                    <input type="text" bind:value={formData.comision} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                  </div>
                  <div class="space-y-2 md:col-span-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Notas Internas (Privadas)</label>
                    <textarea bind:value={formData.notasInternas} rows="2" class="w-full p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl focus:border-red-400 outline-none"></textarea>
                  </div>
                </div>
              </section>
            </div>
          {/if}

          <!-- STEP 2 -->
          <div class={currentStep === 2 ? 'block animate-in fade-in slide-in-from-right-8 duration-500 space-y-10' : 'hidden'}>
            <section>
              <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">4. Ubicación Geográfica Exacta</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="space-y-2 md:col-span-2">
                  <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Zona / Barrio</label>
                  <input type="text" bind:value={formData.zona} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                </div>
                <div class="space-y-2 md:col-span-2">
                  <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Cercanías / Puntos de Interés</label>
                  <input type="text" bind:value={formData.cercanias} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-casa-teal outline-none" />
                </div>
              </div>
              <div class="relative">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Pin de Ubicación Exacta (Google Maps)</label>
                <div id="googleMap" class="w-full h-80 rounded-2xl shadow-inner border-[3px] border-gray-200 z-10 bg-gray-100 flex items-center justify-center">
                  <span class="text-gray-400 font-bold">Cargando Google Maps...</span>
                </div>
              </div>
            </section>

            <section>
              <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">5. Superficies (m²)</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terreno Total</label>
                  <input type="number" bind:value={formData.supTerreno} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Construida</label>
                  <input type="number" bind:value={formData.supConstruida} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
              </div>
            </section>

            <section>
              <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">6. Distribución (Ambientes)</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dormitorios (Suite)</label>
                  <input type="number" bind:value={formData.dormitoriosSuite} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dorms (Estándar)</label>
                  <input type="number" bind:value={formData.dormitoriosEstandar} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Baños Completos</label>
                  <input type="number" bind:value={formData.banosCompletos} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parqueos</label>
                  <input type="number" bind:value={formData.estacionamientos} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                </div>
              </div>
            </section>
          </div>

          <!-- STEP 3 -->
          {#if currentStep === 3}
            <div class="animate-in fade-in slide-in-from-right-8 duration-500 space-y-10">
              <section>
                <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">7. Materiales y Antigüedad</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Antigüedad (Años)</label>
                    <input type="text" bind:value={formData.antiguedad} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</label>
                    <select bind:value={formData.estadoConservacion} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                      <option>Excelente</option><option>A estrenar</option><option>Bueno</option><option>Para remodelar</option>
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Mascotas Permitidas</label>
                    <select bind:value={formData.mascotasPermitidas} class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                      <option>Sí</option><option>No</option><option>Condicionado</option>
                    </select>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">8. Selección de Amenidades</h2>
                <div class="space-y-8">
                  <div>
                    <h3 class="text-sm font-bold text-casa-teal mb-3">Equipamiento Incluido</h3>
                    <div class="flex flex-wrap gap-3">
                      {#each ['Amoblado', 'Línea Blanca', 'Aires Acondicionados', 'Calefón', 'Cortinas', 'Domótica'] as item}
                        <label class="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <input type="checkbox" bind:group={formData.equipamiento} value={item} class="text-casa-teal focus:ring-casa-teal w-4 h-4 rounded" />
                          <span class="text-sm font-medium text-casa-dark">{item}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-casa-teal mb-3">Áreas Comunes y Amenidades</h3>
                    <div class="flex flex-wrap gap-3">
                      {#each ['Piscina', 'Churrasquera', 'Salón de Eventos', 'Gimnasio', 'Sauna', 'Parque Infantil', 'Canchas', 'Seguridad 24/7', 'Ascensor Directo'] as item}
                        <label class="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <input type="checkbox" bind:group={formData.areasComunes} value={item} class="text-casa-teal focus:ring-casa-teal w-4 h-4 rounded" />
                          <span class="text-sm font-medium text-casa-dark">{item}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          {/if}

          <!-- STEP 4 -->
          {#if currentStep === 4}
            <div class="animate-in fade-in slide-in-from-right-8 duration-500 space-y-12">
              <section>
                <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">9. Filtro de Viabilidad Jurídica</h2>
                <div class="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                      <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado del Folio Real</label>
                      <select bind:value={formData.estadoFolio} class="w-full p-3 bg-white border border-red-200 rounded-xl outline-none focus:border-red-400">
                        <option>Al día</option><option>En trámite</option><option>Con observaciones</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 class="text-lg font-bold text-casa-dark border-b border-gray-100 pb-2 mb-6">10. Galería y Documentos (Modificación)</h2>
                
                <div class="mb-8">
                  <label class="text-sm font-bold text-casa-teal mb-3 block">Foto Principal Actual (Sube otra para reemplazarla)</label>
                  <div class="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                    <img src={formData.fotoPrincipalPreview || formData.fotoPrincipalUrl} alt="Portada" class="w-full h-full object-cover" />
                    <label class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span class="bg-white text-casa-dark px-4 py-2 rounded-full font-bold text-xs uppercase shadow-lg flex items-center gap-2"><Camera size={16}/> Cambiar Foto</span>
                      <input type="file" accept="image/*" class="hidden" onchange={handleFotoPrincipal} />
                    </label>
                  </div>
                </div>

                <div class="mb-8 border-t border-gray-100 pt-8">
                  <div class="flex justify-between items-end mb-3">
                    <label class="text-sm font-bold text-casa-teal block">Fotos Secundarias (Nuevas que desees agregar)</label>
                    <label class="bg-gray-100 text-casa-dark px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-2">
                      <Plus size={14}/> Añadir Nuevas
                      <input type="file" accept="image/*" multiple class="hidden" onchange={handleFotosSecundarias} />
                    </label>
                  </div>
                  
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <!-- Fotos Existentes -->
                    {#each formData.fotosSecundariasUrls as fotoUrl, i}
                      <div class="relative h-32 rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={fotoUrl} alt="Existente {i}" class="w-full h-full object-cover" />
                        <button type="button" onclick={() => formData.fotosSecundariasUrls.splice(i, 1)} class="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"><X size={14}/></button>
                      </div>
                    {/each}
                    <!-- Fotos Nuevas -->
                    {#each formData.fotosSecundariasFiles as foto, i}
                      <div class="relative h-32 rounded-xl overflow-hidden border border-casa-teal group">
                        <div class="absolute top-1 left-1 bg-casa-teal text-white text-[9px] font-bold px-1.5 rounded">NUEVA</div>
                        <img src={foto.preview} alt="Secundaria {i}" class="w-full h-full object-cover" />
                        <button type="button" onclick={() => formData.fotosSecundariasFiles.splice(i, 1)} class="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"><X size={14}/></button>
                      </div>
                    {/each}
                  </div>
                </div>

                <div class="mb-8 border-t border-gray-100 pt-8">
                  <div class="flex justify-between items-center mb-4">
                    <label class="text-sm font-bold text-red-500 block">Fotos de Documentación Legal (Nuevos)</label>
                    <button type="button" onclick={addFotoLegal} class="text-casa-teal font-bold text-xs flex items-center gap-1 hover:underline"><Plus size={14}/> Nuevo Documento</button>
                  </div>
                  
                  <div class="space-y-4 mb-4">
                    <!-- Legales Existentes -->
                    {#each formData.fotosLegalesExisting as doc, i}
                      <div class="bg-gray-50 border border-gray-200 p-3 rounded-xl flex gap-4 items-center">
                        <img src={doc.url} alt="Doc" class="w-12 h-12 rounded object-cover" />
                        <span class="flex-1 font-bold text-sm text-casa-dark">{doc.titulo}</span>
                        <button type="button" onclick={() => formData.fotosLegalesExisting.splice(i, 1)} class="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                    {/each}
                  </div>

                  <div class="space-y-4">
                    <!-- Legales Nuevos -->
                    {#each formData.fotosLegalesFiles as doc, i}
                      <div class="bg-casa-teal/5 border border-casa-teal/20 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                        {#if doc.preview}
                          <div class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-300"><img src={doc.preview} alt="Doc {i}" class="w-full h-full object-cover" /></div>
                        {:else}
                          <label class="w-20 h-20 shrink-0 bg-white border border-gray-300 border-dashed rounded-lg flex items-center justify-center cursor-pointer"><Camera size={20} class="text-gray-400" /><input type="file" accept="image/*" class="hidden" onchange={(e) => handleFotoLegalUpload(e, i)} /></label>
                        {/if}
                        <div class="flex-1 w-full"><input type="text" bind:value={doc.titulo} placeholder="Título de doc (Ej. Folio Real)" class="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm" /></div>
                        <button type="button" onclick={() => formData.fotosLegalesFiles.splice(i, 1)} class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                      </div>
                    {/each}
                  </div>
                </div>
              </section>
            </div>
          {/if}

          <div class="mt-auto pt-10 flex justify-between items-center border-t border-gray-100">
            {#if currentStep > 1 && !isPublishing}
              <button type="button" onclick={prevStep} class="px-6 py-3.5 bg-gray-100 text-casa-dark font-bold rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm"><ChevronLeft size={18} /> Atrás</button>
            {:else}<div></div>{/if}

            {#if currentStep < totalSteps}
              <button type="submit" class="px-6 py-3.5 bg-casa-teal text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#0d3641] transition-colors shadow-lg uppercase tracking-wider text-sm">Siguiente <ChevronRight size={18} /></button>
            {:else}
              <button type="submit" disabled={isPublishing} class="px-8 py-3.5 bg-casa-gold text-casa-dark font-black rounded-xl flex items-center gap-2 hover:brightness-110 transition-all shadow-xl uppercase tracking-[0.1em] text-sm disabled:opacity-50">
                {#if isPublishing}<Loader2 size={18} class="animate-spin" /> Guardando Cambios...{:else}<Save size={18} /> Actualizar Inmueble{/if}
              </button>
            {/if}
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
