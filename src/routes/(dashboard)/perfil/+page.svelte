<script>
  import { onMount } from 'svelte';
  import { User, Mail, Phone, MapPin, Edit2, Camera, ShieldCheck, Save, Loader2 } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { db, storage } from '#lib/firebase';
  import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import Credencial from '#lib/components/Credencial.svelte';

  let profile = $state({});
  let loading = $state(true);
  let saving = $state(false);

  let currentTab = $state('datos');

  // Edit fields
  let telefono = $state('');
  let ciudad = $state('');
  let departamento = $state('');
  let fotoUrl = $state('');
  
  // Marketing & Robust Profile fields
  let descripcion = $state('');
  let idiomas = $state('');
  let especialidades = $state('');
  let fotoPortadaUrl = $state('');
  let whatsapp = $state('');
  let instagram = $state('');
  let facebook = $state('');
  let tiktok = $state('');
  let marketingVistas = $state(0);
  let marketingLeads = $state(0);
  
  let publicLink = $derived(authState.user ? `${window.location.origin}/agente/${authState.user.uid}` : '');
  let linkCopied = $state(false);

  onMount(() => {
    // Escuchar el store para cargar datos
    setTimeout(async () => {
      if (authState.profile) {
        profile = authState.profile;
        telefono = profile.telefono || '';
        ciudad = profile.ciudad || '';
        departamento = profile.departamento || '';
        fotoUrl = profile.documentos?.foto || '';
        descripcion = profile.descripcion || '';
        idiomas = profile.idiomas || '';
        especialidades = profile.especialidades || '';
        fotoPortadaUrl = profile.fotoPortada || '';
      }
      
      // Load Marketing Data
      if (authState.user) {
        const docMkt = await getDoc(doc(db, 'marketing_agentes', authState.user.uid));
        if (docMkt.exists()) {
          const d = docMkt.data();
          whatsapp = d.whatsapp || '';
          instagram = d.instagram || '';
          facebook = d.facebook || '';
          tiktok = d.tiktok || '';
          marketingVistas = d.vistas || 0;
          marketingLeads = d.leads || 0;
        }
      }
      loading = false;
    }, 500);
  });

  const updateProfile = async () => {
    if (!authState.user) return;
    saving = true;
    try {
      const docRef = doc(db, 'usuarios', authState.user.uid);
      await updateDoc(docRef, {
        telefono,
        ciudad,
        departamento,
        descripcion,
        idiomas,
        especialidades
      });
      // Updating store optimistic
      authState.profile.telefono = telefono;
      authState.profile.ciudad = ciudad;
      authState.profile.departamento = departamento;
      authState.profile.descripcion = descripcion;
      authState.profile.idiomas = idiomas;
      authState.profile.especialidades = especialidades;
      alert("Perfil actualizado correctamente.");
    } catch(e) {
      console.error(e);
      alert("Error al actualizar perfil.");
    } finally {
      saving = false;
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file || !authState.user) return;
    
    saving = true;
    try {
      const fileRef = ref(storage, `talento/${authState.user.uid}/foto_perfil_${Date.now()}`);
      const snap = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snap.ref);
      
      const docRef = doc(db, 'usuarios', authState.user.uid);
      const nuevosDocumentos = { ...authState.profile.documentos, foto: url };
      await updateDoc(docRef, { documentos: nuevosDocumentos });
      
      const localBase64 = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(file);
      });

      fotoUrl = localBase64;
      if (authState.profile) {
        authState.profile.documentos = { ...nuevosDocumentos, foto: localBase64 };
        authState.profile.foto = localBase64;
      }
      alert("Foto de perfil actualizada.");
    } catch(e) {
      console.error(e);
      alert("Error al subir foto.");
    } finally {
      saving = false;
    }
  };

  const uploadCoverPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file || !authState.user) return;
    
    saving = true;
    try {
      const fileRef = ref(storage, `talento/${authState.user.uid}/portada_${Date.now()}`);
      const snap = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snap.ref);
      
      const docRef = doc(db, 'usuarios', authState.user.uid);
      await updateDoc(docRef, { fotoPortada: url });
      
      fotoPortadaUrl = url;
      authState.profile.fotoPortada = url;
      alert("Foto de portada actualizada.");
    } catch(e) {
      console.error(e);
      alert("Error al subir portada.");
    } finally {
      saving = false;
    }
  };

  const guardarMarketing = async () => {
    if (!authState.user) return;
    saving = true;
    try {
      await setDoc(doc(db, 'marketing_agentes', authState.user.uid), {
        whatsapp,
        instagram,
        facebook,
        tiktok,
        fondoUrl: fotoPortadaUrl, // Reutilizamos fotoPortada como fondo de la tarjeta
        agenteNombre: authState.profile?.nombres + " " + authState.profile?.apellidos,
        agenteFoto: authState.profile?.documentos?.foto || '',
        updatedAt: new Date()
      }, { merge: true });

      alert("Marketing actualizado con éxito.");
    } catch (error) {
      console.error(error); alert("Error al guardar: " + error.message);
    } finally {
      saving = false;
    }
  };

  const copyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(publicLink);
    } else {
      let ta = document.createElement("textarea");
      ta.value = publicLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    linkCopied = true;
    setTimeout(() => linkCopied = false, 2000);
  };

</script>

<div class="p-4 md:p-12 min-h-full bg-casa-light font-sans animate-in fade-in duration-500">
  
  <div class="max-w-4xl mx-auto w-full bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative mb-8">
    
    <!-- Banner -->
    <div class="h-48 bg-[#0c3641] relative overflow-hidden group">
      {#if fotoPortadaUrl}
        <img src={fotoPortadaUrl} alt="Portada" class="w-full h-full object-cover opacity-80 transition-transform group-hover:scale-105" />
      {:else}
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-casa-gold/20 rounded-full blur-3xl"></div>
      {/if}
      <label class="absolute right-4 bottom-4 bg-black/60 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-black transition-colors shadow-lg border border-white/20 backdrop-blur-sm z-10 flex items-center gap-2">
        <Camera size={16}/> Cambiar Portada
        <input type="file" accept="image/*" class="hidden" onchange={uploadCoverPhoto} disabled={saving} />
      </label>
    </div>

    <!-- Contenido -->
    {#if loading}
      <div class="flex justify-center p-20"><Loader2 class="animate-spin text-casa-teal" size={40} /></div>
    {:else}
      <div class="px-8 pb-8 relative -mt-16">
        
        <div class="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
          <div class="relative group cursor-pointer">
            <div class="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-xl">
              {#if fotoUrl}
                <img src={fotoUrl} alt="Perfil" class="w-full h-full object-cover" />
              {:else}
                <div class="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">{profile.nombres?.charAt(0)}</div>
              {/if}
            </div>
            <label class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={24} class="text-white" />
              <input type="file" accept="image/*" class="hidden" onchange={uploadPhoto} disabled={saving} />
            </label>
            {#if saving}<div class="absolute bottom-0 right-0 bg-casa-gold text-casa-dark p-1.5 rounded-full shadow-lg"><Loader2 size={16} class="animate-spin"/></div>{/if}
          </div>

          <div class="flex-1 mb-2">
            <h1 class="text-3xl font-extrabold text-[#0c3641]">{profile.nombres} {profile.apellidos}</h1>
            <p class="text-casa-teal font-bold uppercase tracking-widest text-sm mt-1">{profile.rol}</p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex gap-4 mb-8 border-b border-gray-100 pb-px">
          <button onclick={() => currentTab = 'datos'} class="pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all relative {currentTab === 'datos' ? 'text-casa-teal' : 'text-gray-400 hover:text-gray-600'}">
            <span class="flex items-center gap-2"><User size={18}/> Perfil</span>
            {#if currentTab === 'datos'}<div class="absolute bottom-0 left-0 w-full h-1 bg-casa-teal rounded-t-full"></div>{/if}
          </button>
          <button onclick={() => currentTab = 'marketing'} class="pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all relative {currentTab === 'marketing' ? 'text-casa-teal' : 'text-gray-400 hover:text-gray-600'}">
            <span class="flex items-center gap-2"><ShieldCheck size={18}/> Marketing Digital</span>
            {#if currentTab === 'marketing'}<div class="absolute bottom-0 left-0 w-full h-1 bg-casa-teal rounded-t-full"></div>{/if}
          </button>
          <button onclick={() => currentTab = 'credencial'} class="pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all relative {currentTab === 'credencial' ? 'text-casa-teal' : 'text-gray-400 hover:text-gray-600'}">
            <span class="flex items-center gap-2"><ShieldCheck size={18}/> Credencial</span>
            {#if currentTab === 'credencial'}<div class="absolute bottom-0 left-0 w-full h-1 bg-casa-teal rounded-t-full"></div>{/if}
          </button>
        </div>

        {#if currentTab === 'datos'}
          <form class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300" onsubmit={(e) => { e.preventDefault(); updateProfile(); }}>
            <div class="space-y-6">
              <h3 class="font-bold text-[#0c3641] text-lg flex items-center gap-2 border-b border-gray-100 pb-2"><User size={18}/> Datos Personales</h3>
              
              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Correo Electrónico (Solo Lectura)</label>
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <Mail size={16} class="text-gray-400"/>
                  <span class="text-sm font-medium text-gray-700">{profile.email?.endsWith('@casalegaladmin.com') ? 'contacto@casalegalbolivia.com (Cuenta Principal)' : profile.email}</span>
                </div>
              </div>

              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cédula de Identidad (Solo Lectura)</label>
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <ShieldCheck size={16} class="text-gray-400"/>
                  <span class="text-sm font-medium text-gray-700">{profile.ci}</span>
                </div>
              </div>

              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Sobre Mí / Biografía Profesional</label>
                <textarea bind:value={descripcion} rows="3" class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none transition-colors text-sm font-medium shadow-sm resize-none" placeholder="Describe tu experiencia, tu enfoque y por qué los clientes deberían elegirte..."></textarea>
              </div>

              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Especialidades (Ej. Ventas, Alquileres, Comercial)</label>
                <input type="text" bind:value={especialidades} class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none transition-colors text-sm font-medium shadow-sm" placeholder="Ej. Lotes, Casas de Lujo..." />
              </div>
              
              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Idiomas (Ej. Español, Inglés)</label>
                <input type="text" bind:value={idiomas} class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none transition-colors text-sm font-medium shadow-sm" placeholder="Español, Portugués..." />
              </div>
            </div>

            <div class="space-y-6">
              <h3 class="font-bold text-[#0c3641] text-lg flex items-center gap-2 border-b border-gray-100 pb-2"><MapPin size={18}/> Contacto y Ubicación</h3>
              
              <div>
                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Teléfono de Contacto</label>
                <div class="relative">
                  <Phone size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="tel" bind:value={telefono} class="w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none transition-colors text-sm font-medium shadow-sm" required />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Ciudad</label>
                  <div class="relative">
                    <MapPin size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input type="text" bind:value={ciudad} class="w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none transition-colors text-sm font-medium shadow-sm" required />
                  </div>
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Departamento</label>
                  <select bind:value={departamento} class="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none transition-colors text-sm font-medium shadow-sm" required>
                    <option>Santa Cruz</option>
                    <option>La Paz</option>
                    <option>Cochabamba</option>
                    <option>Oruro</option>
                    <option>Tarija</option>
                    <option>Chuquisaca</option>
                    <option>Potosí</option>
                    <option>Beni</option>
                    <option>Pando</option>
                  </select>
                </div>
              </div>
              
              <div class="pt-4 flex justify-end">
                <button type="submit" disabled={saving} class="px-6 py-3 bg-[#0c3641] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50">
                  <Save size={16}/> {saving ? 'Guardando...' : 'Guardar Perfil'}
                </button>
              </div>
            </div>
          </form>

        {:else if currentTab === 'marketing'}
          <div class="animate-in fade-in duration-300">
            <div class="p-6 bg-casa-teal/5 border border-casa-teal/20 rounded-2xl mb-8 flex justify-between items-center">
              <div>
                <h3 class="font-bold text-casa-dark text-lg">Landing Page & LinkTree</h3>
                <p class="text-sm text-gray-500">Configura tus redes sociales y WhatsApp para tu Tarjeta Digital de presentación.</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <a href={publicLink} target="_blank" class="px-4 py-2 bg-white text-casa-teal font-bold text-xs uppercase tracking-wider border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Ver Tarjeta</a>
                <button onclick={copyLink} class="px-4 py-2 bg-casa-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-colors">
                  {linkCopied ? '¡Copiado!' : 'Copiar Link'}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-8">
              <div class="bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-center">
                <p class="text-[10px] uppercase font-bold text-gray-400 mb-1">Vistas de Landing</p>
                <p class="text-2xl font-black text-[#0c3641]">{marketingVistas}</p>
              </div>
              <div class="bg-white border border-gray-100 p-4 rounded-xl shadow-sm text-center">
                <p class="text-[10px] uppercase font-bold text-gray-400 mb-1">Clics en Contacto</p>
                <p class="text-2xl font-black text-casa-teal">{marketingLeads}</p>
              </div>
            </div>

            <form onsubmit={(e) => { e.preventDefault(); guardarMarketing(); }} class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">WhatsApp (con código, ej: 59170000000)</label>
                  <input type="text" bind:value={whatsapp} placeholder="591..." class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none font-medium shadow-sm" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Instagram (Link del perfil)</label>
                  <input type="text" bind:value={instagram} placeholder="https://instagram.com/..." class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none font-medium shadow-sm" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Facebook (Link del perfil)</label>
                  <input type="text" bind:value={facebook} placeholder="https://facebook.com/..." class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none font-medium shadow-sm" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">TikTok (Link del perfil)</label>
                  <input type="text" bind:value={tiktok} placeholder="https://tiktok.com/..." class="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-casa-teal outline-none font-medium shadow-sm" />
                </div>
              </div>

              <div class="pt-4 flex justify-end">
                <button type="submit" disabled={saving} class="px-6 py-3 bg-[#0c3641] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50">
                  <Save size={16}/> {saving ? 'Guardando...' : 'Guardar Redes Sociales'}
                </button>
              </div>
            </form>
          </div>

        {:else if currentTab === 'credencial'}
          <div class="animate-in fade-in duration-300 p-4 md:p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner overflow-x-auto">
            <Credencial asesor={profile} />
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
