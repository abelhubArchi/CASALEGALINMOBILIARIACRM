<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { db } from '#lib/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import { authState } from '#lib/authStore.svelte.js';
  import { ArrowLeft, User, Mail, Phone, MapPin, Building, ShieldCheck, FileText, Download, Edit2, Save, X, Globe, Award, MessageCircle, Lock, ExternalLink } from 'lucide-svelte';
  import Credencial from '#lib/components/Credencial.svelte';

  const asesorId = page.params.id;

  let asesor = $state(null);
  let marketingData = $state(null);
  let loading = $state(true);
  let isEditing = $state(false);
  let isSaving = $state(false);

  let editForm = $state({});

  let isSuperAdmin = $derived(
    authState.user?.email === 'bolevel12@gmail.com' || 
    authState.user?.email?.endsWith('@casalegaladmin.com') ||
    authState.profile?.rol === 'ADMIN'
  );

  onMount(async () => {
    try {
      const docRef = doc(db, 'usuarios', asesorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        asesor = { id: docSnap.id, ...docSnap.data() };
        resetEditForm();
      }

      // Cargar datos de marketing digital (redes sociales)
      const mktRef = doc(db, 'marketing_agentes', asesorId);
      const mktSnap = await getDoc(mktRef);
      if (mktSnap.exists()) {
        marketingData = mktSnap.data();
      }
    } catch (error) {
      console.error("Error fetching asesor:", error);
    } finally {
      loading = false;
    }
  });

  const resetEditForm = () => {
    editForm = {
      nombres: asesor.nombres || '',
      apellidos: asesor.apellidos || '',
      telefono: asesor.telefono || '',
      rol: asesor.rol || 'ASESOR',
      ci: asesor.ci || '',
      fechaNacimiento: asesor.fechaNacimiento || '',
      calle: asesor.calle || '',
      ciudad: asesor.ciudad || '',
      departamento: asesor.departamento || 'Santa Cruz',
      nit: asesor.nit || '',
      descripcion: asesor.descripcion || '',
      especialidades: asesor.especialidades || '',
      idiomas: asesor.idiomas || '',
      estatus: asesor.estatus || 'Activo'
    };
  };

  const toggleEdit = () => {
    if (isEditing) resetEditForm();
    isEditing = !isEditing;
  };

  const saveChanges = async () => {
    isSaving = true;
    try {
      const docRef = doc(db, 'usuarios', asesorId);
      await updateDoc(docRef, editForm);
      asesor = { ...asesor, ...editForm };
      isEditing = false;
      alert("¡Perfil actualizado exitosamente!");
    } catch (error) {
      console.error("Error guardando cambios:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      isSaving = false;
    }
  };

  let credencialAsesor = $derived(
    asesor ? {
      ...asesor,
      ci: isSuperAdmin ? asesor.ci : '*****',
      calle: isSuperAdmin ? asesor.calle : (asesor.ciudad || 'Santa Cruz')
    } : {}
  );
</script>

<div class="p-4 md:p-12 font-sans h-full flex flex-col bg-casa-light overflow-y-auto">
  
  <!-- Navegación -->
  <div class="mb-6 max-w-5xl mx-auto w-full">
    <a href="/talento" class="inline-flex items-center gap-2 text-gray-500 hover:text-casa-teal font-bold text-sm uppercase tracking-wider transition-colors">
      <ArrowLeft size={16} /> Volver al Directorio
    </a>
  </div>

  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-casa-teal"></div>
    </div>
  {:else if !asesor}
    <div class="flex-1 flex items-center justify-center text-gray-400 font-bold text-xl">
      Asesor no encontrado.
    </div>
  {:else}
    <div class="max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <!-- Cabecera y Foto de Portada -->
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 relative border border-gray-100">
        <div class="h-48 md:h-64 bg-[#0c3641] relative overflow-hidden">
          {#if asesor.fotoPortada}
            <img src={asesor.fotoPortada} alt="Portada" class="w-full h-full object-cover opacity-90" />
          {:else}
            <div class="absolute inset-0 bg-gradient-to-r from-casa-teal via-[#0c3641] to-casa-dark opacity-90"></div>
            <div class="absolute -right-20 -top-20 w-80 h-80 bg-casa-gold/20 rounded-full blur-3xl"></div>
          {/if}
        </div>

        <div class="px-8 pb-8 relative -mt-20 flex flex-col md:flex-row items-center md:items-end gap-6">
          <div class="w-36 h-36 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-2xl shrink-0">
            {#if asesor.documentos?.foto || asesor.foto}
              <img src={asesor.documentos?.foto || asesor.foto} alt="Perfil" class="w-full h-full object-cover" />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-casa-teal text-white text-4xl font-extrabold">{asesor.nombres?.charAt(0)}</div>
            {/if}
          </div>

          <div class="flex-1 text-center md:text-left mb-2">
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <span class="bg-casa-gold text-casa-dark text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                {asesor.rol}
              </span>
              <span class="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border {asesor.estatus === 'Activo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}">
                {asesor.estatus || 'Activo'}
              </span>
            </div>
            <h1 class="text-3xl md:text-4xl font-extrabold text-casa-dark tracking-tight">{asesor.nombres} {asesor.apellidos}</h1>
            <p class="text-gray-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-1 text-sm">
              <MapPin size={16} class="text-casa-teal"/> {asesor.ciudad || 'Bolivia'}, {asesor.departamento}
            </p>
          </div>

          {#if isSuperAdmin}
            <div class="shrink-0 mb-2">
              {#if isEditing}
                <div class="flex items-center gap-2">
                  <button onclick={toggleEdit} class="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl transition-colors" title="Cancelar">
                    <X size={20} />
                  </button>
                  <button onclick={saveChanges} disabled={isSaving} class="bg-casa-gold hover:brightness-110 text-casa-dark px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50">
                    {#if isSaving} Guardando... {:else} <Save size={18} /> Guardar {/if}
                  </button>
                </div>
              {:else}
                <button onclick={toggleEdit} class="bg-casa-dark hover:bg-black text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-colors shadow-md">
                  <Edit2 size={18} /> Editar Perfil
                </button>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Sección Pública: Biografía, Especialidades, Idiomas, Contacto y Redes -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        <!-- Biografía & Especialidades -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 class="text-lg font-bold text-casa-dark mb-4 flex items-center gap-2">
              <User size={20} class="text-casa-teal"/> Biografía Profesional
            </h2>
            {#if isEditing}
              <textarea bind:value={editForm.descripcion} rows="4" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-casa-teal text-sm" placeholder="Escribe la biografía del asesor..."></textarea>
            {:else}
              <p class="text-gray-600 leading-relaxed text-sm whitespace-pre-line font-medium">
                {asesor.descripcion || 'El asesor aún no ha publicado su biografía profesional.'}
              </p>
            {/if}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Award size={16} class="text-casa-gold"/> Especialidades
              </h3>
              {#if isEditing}
                <input type="text" bind:value={editForm.especialidades} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm" />
              {:else}
                <p class="font-bold text-casa-dark text-sm">{asesor.especialidades || 'Ventas y Alquileres Inmobiliarios'}</p>
              {/if}
            </div>

            <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Globe size={16} class="text-casa-teal"/> Idiomas
              </h3>
              {#if isEditing}
                <input type="text" bind:value={editForm.idiomas} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm" />
              {:else}
                <p class="font-bold text-casa-dark text-sm">{asesor.idiomas || 'Español'}</p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Contacto & Redes Sociales -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 class="text-lg font-bold text-casa-dark mb-6 flex items-center gap-2">
              <Phone size={20} class="text-casa-teal"/> Contacto Directo
            </h2>
            
            <div class="space-y-4 text-sm">
              <div>
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Teléfono / Celular</span>
                {#if isEditing}
                  <input type="text" bind:value={editForm.telefono} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-bold text-casa-dark flex items-center gap-2">
                    <Phone size={16} class="text-casa-teal"/> {asesor.telefono || 'Sin número'}
                  </p>
                {/if}
              </div>

              <div>
                {#if asesor.email?.endsWith('@casalegaladmin.com')}
                  <span class="text-[10px] font-bold text-casa-gold uppercase tracking-widest block mb-1">Acreditación Institucional</span>
                  <div class="flex items-center gap-2 px-3.5 py-2.5 bg-casa-gold/10 text-casa-dark rounded-xl font-extrabold text-xs border border-casa-gold/30">
                    <ShieldCheck size={16} class="text-casa-gold shrink-0"/> Staff Ejecutivo & Dirección General
                  </div>
                {:else}
                  <span class="text-[10px] font-bold text-casa-teal uppercase tracking-widest block mb-1">Verificación Oficial</span>
                  <div class="flex items-center gap-2 px-3.5 py-2.5 bg-casa-teal/10 text-casa-teal rounded-xl font-extrabold text-xs border border-casa-teal/20">
                    <ShieldCheck size={16} class="text-casa-teal shrink-0"/> Agente Inmobiliario Certificado
                  </div>
                {/if}
              </div>
            </div>

            <!-- Links de Redes Sociales -->
            {#if marketingData}
              <div class="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Redes Sociales</p>
                <div class="flex flex-wrap gap-2">
                  {#if marketingData.whatsapp}
                    <a href="https://wa.me/{marketingData.whatsapp}" target="_blank" class="px-3 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-green-100 transition-colors">
                      <MessageCircle size={14}/> WhatsApp <ExternalLink size={12}/>
                    </a>
                  {/if}
                  {#if marketingData.instagram}
                    <a href={marketingData.instagram} target="_blank" class="px-3 py-2 bg-pink-50 text-pink-700 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-pink-100 transition-colors">
                      Instagram <ExternalLink size={12}/>
                    </a>
                  {/if}
                  {#if marketingData.facebook}
                    <a href={marketingData.facebook} target="_blank" class="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-blue-100 transition-colors">
                      Facebook <ExternalLink size={12}/>
                    </a>
                  {/if}
                  {#if marketingData.tiktok}
                    <a href={marketingData.tiktok} target="_blank" class="px-3 py-2 bg-gray-100 text-gray-800 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-gray-200 transition-colors">
                      TikTok <ExternalLink size={12}/>
                    </a>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>

      </div>

      <!-- Credencial Oficial -->
      <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 overflow-x-auto">
        <h2 class="text-xl font-extrabold text-casa-dark mb-6 flex items-center gap-2">
          <ShieldCheck size={22} class="text-casa-gold"/> Credencial Oficial del Asesor
        </h2>
        <Credencial asesor={credencialAsesor} showButtons={false} />
      </div>

      <!-- Sección Privada & Expediente Digital (SOLO SUPER ADMINISTRADORES @casalegaladmin.com) -->
      {#if isSuperAdmin}
        <div class="bg-casa-dark/5 p-8 rounded-3xl border border-casa-teal/20 space-y-8 animate-in fade-in duration-500">
          <div class="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h2 class="text-xl font-extrabold text-casa-dark flex items-center gap-2">
                <Lock size={22} class="text-casa-teal"/> Expediente Privado y Documentación
              </h2>
              <p class="text-xs text-gray-500 mt-1">Información confidencial reservada exclusivamente para Super Administradores (@casalegaladmin.com).</p>
            </div>
            <span class="px-3 py-1 bg-casa-teal text-white text-[10px] font-extrabold uppercase tracking-widest rounded-full">Exclusivo Admin</span>
          </div>

          <!-- Datos Sensibles -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cédula de Identidad (CI)</label>
              {#if isEditing}
                <input type="text" bind:value={editForm.ci} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm font-bold" />
              {:else}
                <p class="font-bold text-casa-dark">{asesor.ci || 'No registrada'}</p>
              {/if}
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Fecha de Nacimiento</label>
              {#if isEditing}
                <input type="date" bind:value={editForm.fechaNacimiento} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm" />
              {:else}
                <p class="font-bold text-casa-dark">{asesor.fechaNacimiento || 'No registrada'}</p>
              {/if}
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">NIT / Datos Fiscales</label>
              {#if isEditing}
                <input type="text" bind:value={editForm.nit} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm" />
              {:else}
                <p class="font-bold text-casa-dark">{asesor.nit || 'No registrado'}</p>
              {/if}
            </div>

            <div class="md:col-span-3 pt-4 border-t border-gray-100">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Dirección Exacta de Domicilio (Calle, Nro)</label>
              {#if isEditing}
                <input type="text" bind:value={editForm.calle} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal text-sm font-medium" />
              {:else}
                <p class="font-medium text-casa-dark">{asesor.calle || 'No registrada'}</p>
              {/if}
            </div>
          </div>

          <!-- Archivos Adjuntos del Expediente -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-sm font-bold text-casa-dark mb-4 flex items-center gap-2"><FileText size={18} class="text-casa-teal"/> Expediente Digital Adjunto</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {#if asesor.documentos?.identificacion}
                <a href={asesor.documentos.identificacion} target="_blank" class="p-4 bg-gray-50 hover:bg-casa-teal/5 rounded-xl border border-gray-200 flex items-center gap-3 transition-colors group">
                  <ShieldCheck size={20} class="text-casa-teal shrink-0"/>
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-xs text-casa-dark truncate">Documento de CI</p>
                    <p class="text-[10px] text-gray-400 uppercase">Identificación</p>
                  </div>
                  <Download size={14} class="text-gray-400 group-hover:text-casa-teal"/>
                </a>
              {/if}

              {#if asesor.documentos?.comprobanteDomicilio}
                <a href={asesor.documentos.comprobanteDomicilio} target="_blank" class="p-4 bg-gray-50 hover:bg-casa-teal/5 rounded-xl border border-gray-200 flex items-center gap-3 transition-colors group">
                  <MapPin size={20} class="text-casa-teal shrink-0"/>
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-xs text-casa-dark truncate">Comprobante Domicilio</p>
                    <p class="text-[10px] text-gray-400 uppercase">Factura Servicio</p>
                  </div>
                  <Download size={14} class="text-gray-400 group-hover:text-casa-teal"/>
                </a>
              {/if}

              {#if asesor.documentos?.otrosDocumentos}
                {#each asesor.documentos.otrosDocumentos as doc}
                  <a href={doc.url} target="_blank" class="p-4 bg-gray-50 hover:bg-casa-teal/5 rounded-xl border border-gray-200 flex items-center gap-3 transition-colors group">
                    <FileText size={20} class="text-casa-gold shrink-0"/>
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-xs text-casa-dark truncate">{doc.name}</p>
                      <p class="text-[10px] text-gray-400 uppercase">Adjunto Extra</p>
                    </div>
                    <Download size={14} class="text-gray-400 group-hover:text-casa-teal"/>
                  </a>
                {/each}
              {/if}

              {#if !asesor.documentos || Object.keys(asesor.documentos).length === 0}
                <div class="col-span-full text-center py-6 text-gray-400 text-xs font-medium">
                  No se han subido archivos al expediente digital.
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

    </div>
  {/if}
</div>
