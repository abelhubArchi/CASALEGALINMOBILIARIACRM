<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { db } from '#lib/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import { authState } from '#lib/authStore.svelte.js';
  import { ArrowLeft, User, Mail, Phone, MapPin, Building, ShieldCheck, FileText, Download, Edit2, Save, X } from 'lucide-svelte';

  const asesorId = page.params.id;

  let asesor = $state(null);
  let loading = $state(true);
  let isEditing = $state(false);
  let isSaving = $state(false);

  // Formulario temporal para edición
  let editForm = $state({});

  let isSuperAdmin = $derived(
    authState.user?.email === 'bolevel12@gmail.com' || 
    authState.user?.email?.endsWith('@casalegaladmin.com')
  );

  onMount(async () => {
    try {
      const docRef = doc(db, 'usuarios', asesorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        asesor = { id: docSnap.id, ...docSnap.data() };
        resetEditForm();
      }
    } catch (error) {
      console.error("Error fetching asesor:", error);
    } finally {
      loading = false;
    }
  });

  const resetEditForm = () => {
    editForm = {
      nombres: asesor.nombres,
      apellidos: asesor.apellidos,
      telefono: asesor.telefono,
      rol: asesor.rol,
      ci: asesor.ci,
      fechaNacimiento: asesor.fechaNacimiento,
      calle: asesor.calle,
      ciudad: asesor.ciudad,
      departamento: asesor.departamento,
      nit: asesor.nit,
      estatus: asesor.estatus || 'Activo'
    };
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Cancelar
      resetEditForm();
    }
    isEditing = !isEditing;
  };

  const saveChanges = async () => {
    isSaving = true;
    try {
      const docRef = doc(db, 'usuarios', asesorId);
      await updateDoc(docRef, editForm);
      // Actualizar estado local
      asesor = { ...asesor, ...editForm };
      isEditing = false;
      alert("¡Cambios guardados exitosamente!");
    } catch (error) {
      console.error("Error guardando cambios:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      isSaving = false;
    }
  };
</script>

<div class="p-8 md:p-12 font-sans h-full flex flex-col bg-casa-light overflow-y-auto">
  
  <!-- Navegación -->
  <div class="mb-6">
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
      
      <!-- Cabecera -->
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-casa-teal to-[#0d3641] p-8 md:p-10 text-white flex flex-col md:flex-row items-center gap-8 relative">
          
          {#if asesor.documentos?.foto}
            <img src={asesor.documentos.foto} alt="Foto" class="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-casa-gold" />
          {:else}
            <div class="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center shadow-2xl border-4 border-casa-gold">
              <User size={48} />
            </div>
          {/if}
          
          <div class="text-center md:text-left flex-1">
            <span class="bg-casa-gold text-casa-dark text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              {asesor.rol}
            </span>
            <h1 class="text-4xl font-extrabold mt-3">{asesor.nombres} {asesor.apellidos}</h1>
            <p class="text-white/80 font-medium flex items-center justify-center md:justify-start gap-2 mt-2 text-lg">
              <Mail size={18}/> {asesor.email}
            </p>
          </div>

          {#if isSuperAdmin}
            <div class="absolute top-6 right-6">
              {#if isEditing}
                <div class="flex items-center gap-2">
                  <button onclick={toggleEdit} class="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-colors" title="Cancelar">
                    <X size={20} />
                  </button>
                  <button onclick={saveChanges} disabled={isSaving} class="bg-casa-gold hover:brightness-110 text-casa-dark px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-all shadow-lg disabled:opacity-50">
                    {#if isSaving} Guardando... {:else} <Save size={18} /> Guardar {/if}
                  </button>
                </div>
              {:else}
                <button onclick={toggleEdit} class="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-colors border border-white/20">
                  <Edit2 size={18} /> Editar Perfil
                </button>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Contenido Principal -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Columna 1: Información -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Datos Personales -->
          <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 class="text-lg font-bold text-casa-dark mb-6 flex items-center gap-2"><User size={20} class="text-casa-teal"/> Datos Personales</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombres</label>
                {#if isEditing}
                  <input type="text" bind:value={editForm.nombres} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-bold text-casa-dark">{asesor.nombres}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Apellidos</label>
                {#if isEditing}
                  <input type="text" bind:value={editForm.apellidos} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-bold text-casa-dark">{asesor.apellidos}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Cédula de Identidad</label>
                {#if isEditing}
                  <input type="text" bind:value={editForm.ci} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-bold text-casa-dark flex items-center gap-2"><ShieldCheck size={16} class="text-casa-teal"/> {asesor.ci}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono</label>
                {#if isEditing}
                  <input type="text" bind:value={editForm.telefono} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-bold text-casa-dark flex items-center gap-2"><Phone size={16} class="text-casa-teal"/> {asesor.telefono}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha de Nacimiento</label>
                {#if isEditing}
                  <input type="date" bind:value={editForm.fechaNacimiento} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-bold text-casa-dark">{asesor.fechaNacimiento || '-'}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Rol / Estatus</label>
                {#if isEditing}
                  <div class="flex gap-2">
                    <select bind:value={editForm.rol} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal">
                      <option value="ASESOR">ASESOR</option>
                      <option value="BROKER">BROKER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <select bind:value={editForm.estatus} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal">
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                {:else}
                  <p class="font-bold text-casa-dark">
                    {asesor.rol} • <span class={asesor.estatus === 'Activo' ? 'text-green-500' : 'text-red-500'}>{asesor.estatus || 'Activo'}</span>
                  </p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Ubicación -->
          <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 class="text-lg font-bold text-casa-dark mb-6 flex items-center gap-2"><MapPin size={20} class="text-casa-teal"/> Ubicación y Facturación</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1 md:col-span-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Dirección (Calle, Nro)</label>
                {#if isEditing}
                  <input type="text" bind:value={editForm.calle} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-medium text-casa-dark">{asesor.calle || '-'}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Ciudad</label>
                {#if isEditing}
                  <input type="text" bind:value={editForm.ciudad} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-bold text-casa-dark">{asesor.ciudad || '-'}</p>
                {/if}
              </div>
              <div class="space-y-1">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">Departamento</label>
                {#if isEditing}
                  <select bind:value={editForm.departamento} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal">
                    <option>Santa Cruz</option><option>La Paz</option><option>Cochabamba</option><option>Tarija</option><option>Chuquisaca</option><option>Potosí</option><option>Oruro</option><option>Beni</option><option>Pando</option>
                  </select>
                {:else}
                  <p class="font-bold text-casa-dark">{asesor.departamento || '-'}</p>
                {/if}
              </div>
              <div class="space-y-1 md:col-span-2">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-widest">NIT</label>
                {#if isEditing}
                  <input type="text" bind:value={editForm.nit} class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-casa-teal" />
                {:else}
                  <p class="font-bold text-casa-dark flex items-center gap-2"><Building size={16} class="text-casa-teal"/> {asesor.nit || 'No registrado'}</p>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Columna 2: Archivos -->
        <div class="lg:col-span-1">
          <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
            <h2 class="text-lg font-bold text-casa-dark mb-6 flex items-center gap-2"><FileText size={20} class="text-casa-teal"/> Expediente Digital</h2>
            
            <div class="space-y-4">
              <!-- CI -->
              {#if asesor.documentos?.identificacion}
              <a href={asesor.documentos.identificacion} target="_blank" class="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-casa-teal hover:shadow-md transition-all group">
                <div class="p-3 bg-casa-teal/10 text-casa-teal rounded-xl group-hover:bg-casa-teal group-hover:text-white transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-sm text-casa-dark truncate">CI (Identidad)</p>
                  <p class="text-[10px] uppercase tracking-wider text-gray-500">Documento Oficial</p>
                </div>
                <Download size={16} class="text-gray-400 group-hover:text-casa-teal" />
              </a>
              {/if}

              <!-- Domicilio -->
              {#if asesor.documentos?.comprobanteDomicilio}
              <a href={asesor.documentos.comprobanteDomicilio} target="_blank" class="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-casa-teal hover:shadow-md transition-all group">
                <div class="p-3 bg-casa-teal/10 text-casa-teal rounded-xl group-hover:bg-casa-teal group-hover:text-white transition-colors">
                  <MapPin size={24} />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-sm text-casa-dark truncate">Domicilio</p>
                  <p class="text-[10px] uppercase tracking-wider text-gray-500">Aviso Servicios</p>
                </div>
                <Download size={16} class="text-gray-400 group-hover:text-casa-teal" />
              </a>
              {/if}

              <!-- Otros -->
              {#if asesor.documentos?.otrosDocumentos}
                {#each asesor.documentos.otrosDocumentos as doc}
                <a href={doc.url} target="_blank" class="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:border-casa-teal hover:shadow-md transition-all group">
                  <div class="p-3 bg-casa-gold/10 text-casa-gold rounded-xl group-hover:bg-casa-gold group-hover:text-white transition-colors">
                    <FileText size={24} />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm text-casa-dark truncate">{doc.name}</p>
                    <p class="text-[10px] uppercase tracking-wider text-gray-500">Adjunto</p>
                  </div>
                  <Download size={16} class="text-gray-400 group-hover:text-casa-teal" />
                </a>
                {/each}
              {/if}

              {#if !asesor.documentos || Object.keys(asesor.documentos).length === 0}
                <div class="text-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <FileText size={32} class="mx-auto text-gray-300 mb-2" />
                  <p class="text-sm text-gray-500 font-medium">Sin documentos adjuntos</p>
                </div>
              {/if}
            </div>

          </div>
        </div>

      </div>
    </div>
  {/if}
</div>
