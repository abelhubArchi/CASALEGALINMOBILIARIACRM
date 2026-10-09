<script>
  import { onMount } from 'svelte';
  import { User, Mail, Phone, MapPin, Edit2, Camera, ShieldCheck, Save, Loader2 } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { db, storage } from '#lib/firebase';
  import { doc, updateDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

  let profile = $state({});
  let loading = $state(true);
  let saving = $state(false);

  // Edit fields
  let telefono = $state('');
  let ciudad = $state('');
  let departamento = $state('');
  let fotoUrl = $state('');

  onMount(() => {
    // Escuchar el store para cargar datos
    setTimeout(() => {
      if (authState.profile) {
        profile = authState.profile;
        telefono = profile.telefono || '';
        ciudad = profile.ciudad || '';
        departamento = profile.departamento || '';
        fotoUrl = profile.documentos?.foto || '';
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
        departamento
      });
      // Updating store optimistic
      authState.profile.telefono = telefono;
      authState.profile.ciudad = ciudad;
      authState.profile.departamento = departamento;
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
      
      fotoUrl = url;
      authState.profile.documentos = nuevosDocumentos;
      alert("Foto de perfil actualizada.");
    } catch(e) {
      console.error(e);
      alert("Error al subir foto.");
    } finally {
      saving = false;
    }
  };

</script>

<div class="p-8 md:p-12 h-full bg-casa-light flex flex-col font-sans overflow-y-auto animate-in fade-in duration-500">
  
  <div class="max-w-4xl mx-auto w-full bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">
    
    <!-- Banner -->
    <div class="h-40 bg-[#0c3641] relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-casa-gold/20 rounded-full blur-3xl"></div>
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

        <form class="grid grid-cols-1 md:grid-cols-2 gap-8" onsubmit={(e) => { e.preventDefault(); updateProfile(); }}>
          
          <div class="space-y-6">
            <h3 class="font-bold text-[#0c3641] text-lg flex items-center gap-2 border-b border-gray-100 pb-2"><User size={18}/> Datos Personales (Solo Lectura)</h3>
            
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Correo Electrónico</label>
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Mail size={16} class="text-gray-400"/>
                <span class="text-sm font-medium text-gray-700">{profile.email}</span>
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cédula de Identidad</label>
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <ShieldCheck size={16} class="text-gray-400"/>
                <span class="text-sm font-medium text-gray-700">{profile.ci}</span>
              </div>
            </div>
            
          </div>

          <div class="space-y-6">
            <h3 class="font-bold text-[#0c3641] text-lg flex items-center gap-2 border-b border-gray-100 pb-2"><Edit2 size={18}/> Datos Editables</h3>
            
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
                <Save size={16}/> {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
          
        </form>
      </div>
    {/if}
  </div>
</div>
