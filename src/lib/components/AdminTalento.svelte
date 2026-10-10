<script>
  import { UserPlus, UploadCloud, CheckCircle, FileText, Image as ImageIcon, MapPin, Building, CreditCard, ChevronRight, ChevronLeft, ShieldCheck, Mail, Phone, User, Loader2, X, Lock, Plus } from 'lucide-svelte';
  
  import { auth, db, storage } from '#lib/firebase';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import Credencial from '#lib/components/Credencial.svelte';

  let currentStep = $state(1);
  const totalSteps = 5;

  let formData = $state({
    nombres: '',
    apellidos: '',
    ci: '',
    email: '',
    telefono: '',
    rol: 'ASESOR',
    fechaNacimiento: '',
    nit: '',
    calle: '',
    ciudad: '',
    departamento: 'Santa Cruz',
    experiencia: '0-2 años'
  });

  // Archivos reales
  let files = $state({
    foto: null,
    identificacion: null,
    comprobanteDomicilio: null,
    otrosDocumentos: []
  });

  const handleFileUpload = (e, type) => {
    if (e.target.files.length > 0) {
      if (type === 'otrosDocumentos') {
        files.otrosDocumentos = [...files.otrosDocumentos, ...Array.from(e.target.files)];
      } else {
        files[type] = e.target.files[0];
      }
    }
  };

  const removeOtroDocumento = (index) => {
    files.otrosDocumentos = files.otrosDocumentos.filter((_, i) => i !== index);
  };

  const nextStep = () => {
    // Basic validation before jumping
    if (currentStep === 1 && (!formData.nombres || !formData.apellidos || !formData.ci)) {
      alert("Por favor, completa los Nombres, Apellidos y CI (Cédula de Identidad) para continuar.");
      return;
    }
    if (currentStep < totalSteps) currentStep++;
  };

  const prevStep = () => {
    if (currentStep > 1) currentStep--;
  };

  let isLoading = $state(false);
  let registeredAsesor = $state(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ci) {
        alert("La Cédula de Identidad es obligatoria para establecer la contraseña inicial.");
        return;
    }

    isLoading = true;
    
    try {
      // Contraseña por defecto: CI del usuario
      const defaultPassword = formData.ci;

      // 1. Crear el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, defaultPassword);
      const user = userCredential.user;

      // 2. Subir Archivos a Firebase Storage y obtener URLs
      const fileUrls = {};
      const uploadPromises = [];

      // Archivos individuales
      for (const key of ['foto', 'identificacion', 'comprobanteDomicilio']) {
        const file = files[key];
        if (file) {
          const fileRef = ref(storage, `talento/${user.uid}/${key}_${file.name}`);
          uploadPromises.push(
            uploadBytes(fileRef, file).then(snap => getDownloadURL(snap.ref).then(url => fileUrls[key] = url))
          );
        }
      }

      // Otros documentos (Array)
      if (files.otrosDocumentos.length > 0) {
        fileUrls.otrosDocumentos = [];
        for (const [index, file] of files.otrosDocumentos.entries()) {
          const fileRef = ref(storage, `talento/${user.uid}/otro_${index}_${file.name}`);
          uploadPromises.push(
            uploadBytes(fileRef, file).then(snap => getDownloadURL(snap.ref).then(url => fileUrls.otrosDocumentos.push({ name: file.name, url })))
          );
        }
      }

      // Esperar a que todos los archivos se suban
      await Promise.all(uploadPromises);

      // 3. Guardar el documento del Asesor en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        ...formData,
        documentos: fileUrls,
        fechaRegistro: new Date().toISOString(),
        uid: user.uid,
        estatus: 'Activo'
      });

      alert(`¡Asesor registrado exitosamente!\nSe ha creado la cuenta con su correo: ${formData.email}\nContraseña inicial: ${defaultPassword}`);
      
      // Convertir foto a Base64 local para renderizado inmediato sin CORS
      let localFoto = fileUrls.foto || null;
      if (files.foto) {
        localFoto = await new Promise(res => {
          const r = new FileReader();
          r.onload = e => res(e.target.result);
          r.readAsDataURL(files.foto);
        });
      }

      // Mostrar Credencial
      registeredAsesor = { ...formData, foto: localFoto };
      currentStep = 5;

    } catch (error) {
      console.error("Error en Onboarding:", error);
      alert("Error al registrar: " + error.message);
    } finally {
      isLoading = false;
    }
  };

</script>

<div class="p-8 md:p-12 font-sans h-full flex flex-col bg-casa-light overflow-y-auto">
  
  <div class="max-w-5xl mx-auto w-full">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <div class="p-4 bg-casa-teal/10 text-casa-teal rounded-2xl shadow-sm border border-casa-teal/20">
        <UserPlus size={36} strokeWidth={1.5} />
      </div>
      <div>
        <h1 class="text-4xl font-extrabold text-casa-dark tracking-tight">Onboarding de Talento</h1>
        <p class="text-gray-500 text-lg mt-1">Registra y habilita el acceso para nuevos asesores de Casa Legal en Bolivia.</p>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <div class="flex items-center justify-between relative">
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full z-0"></div>
        <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-casa-teal rounded-full z-0 transition-all duration-700 ease-out" style="width: {(currentStep - 1) / (totalSteps - 1) * 100}%"></div>
        
        {#each [1, 2, 3, 4, 5] as step}
          <div class="relative z-10 flex flex-col items-center gap-2">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500
              {currentStep > step ? 'bg-casa-teal text-white shadow-md scale-110' : currentStep === step ? 'bg-casa-gold text-casa-dark shadow-xl ring-4 ring-casa-gold/30 scale-125' : 'bg-gray-200 text-gray-400'}">
              {#if currentStep > step}
                <CheckCircle size={18} strokeWidth={2.5} class="animate-in zoom-in duration-300" />
              {:else}
                {step}
              {/if}
            </div>
            <span class="text-[10px] uppercase tracking-widest font-bold mt-2 {currentStep >= step ? 'text-casa-dark' : 'text-gray-400'} hidden md:block transition-colors duration-300 text-center">
              {#if step === 1} Datos
              {:else if step === 2} Ubicación
              {:else if step === 3} Expediente
              {:else if step === 4} Acceso
              {:else} Credencial {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Form Container -->
    <form onsubmit={handleSubmit} class="bg-white rounded-3xl shadow-xl shadow-casa-dark/5 border border-gray-100 overflow-hidden min-h-[500px] relative">
      
      <!-- STEP 1: Datos Personales -->
      {#if currentStep === 1}
        <div class="p-8 md:p-12 absolute inset-0 animate-in fade-in slide-in-from-right-8 duration-500 overflow-y-auto">
          <h2 class="text-2xl font-bold text-casa-dark mb-6 flex items-center gap-2"><User class="text-casa-teal"/> Información Personal</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-casa-dark uppercase tracking-wider">Nombres</label>
              <input type="text" bind:value={formData.nombres} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none transition-all" placeholder="Ej. Juan Carlos" required />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-casa-dark uppercase tracking-wider">Apellidos</label>
              <input type="text" bind:value={formData.apellidos} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none transition-all" placeholder="Ej. Mamani Flores" required />
            </div>
            <div class="space-y-2 md:col-span-2 bg-casa-teal/5 p-4 rounded-xl border border-casa-teal/10">
              <label class="text-sm font-bold text-casa-teal uppercase tracking-wider">Cédula de Identidad (CI)</label>
              <div class="relative mt-1">
                <ShieldCheck size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-casa-teal/50" />
                <input type="text" bind:value={formData.ci} class="w-full pl-12 pr-4 py-3 bg-white border border-casa-teal/20 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none transition-all font-bold text-casa-dark tracking-widest" placeholder="1234567" required />
              </div>
              <p class="text-xs text-gray-500 mt-2 font-medium">Esta CI será la contraseña por defecto para iniciar sesión.</p>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-casa-dark uppercase tracking-wider">Teléfono Celular</label>
              <div class="relative">
                <Phone size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" bind:value={formData.telefono} class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none transition-all" placeholder="+591 71234567" required />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-casa-dark uppercase tracking-wider">Fecha de Nacimiento</label>
              <input type="date" bind:value={formData.fechaNacimiento} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none transition-all text-gray-700" required />
            </div>
          </div>
        </div>
      {/if}

      <!-- STEP 2: Dirección & Fiscal (Bolivia) -->
      {#if currentStep === 2}
        <div class="p-8 md:p-12 absolute inset-0 animate-in fade-in slide-in-from-right-8 duration-500 overflow-y-auto">
          <h2 class="text-2xl font-bold text-casa-dark mb-6 flex items-center gap-2"><MapPin class="text-casa-teal"/> Ubicación & Datos Fiscales</h2>
          
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2 md:col-span-2">
                <label class="text-sm font-bold text-casa-dark uppercase tracking-wider">Dirección (Calle, Av, Nro)</label>
                <input type="text" bind:value={formData.calle} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none" placeholder="Av. Banzer 4to Anillo..." required />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-bold text-casa-dark uppercase tracking-wider">Departamento</label>
                <select bind:value={formData.departamento} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none font-medium cursor-pointer">
                  <option>Santa Cruz</option>
                  <option>La Paz</option>
                  <option>Cochabamba</option>
                  <option>Tarija</option>
                  <option>Chuquisaca</option>
                  <option>Potosí</option>
                  <option>Oruro</option>
                  <option>Beni</option>
                  <option>Pando</option>
                </select>
              </div>
            </div>
            
            <div class="grid grid-cols-1 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-bold text-casa-dark uppercase tracking-wider">Ciudad / Municipio</label>
                <input type="text" bind:value={formData.ciudad} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none" placeholder="Santa Cruz de la Sierra" required />
              </div>
            </div>

            <div class="pt-6 border-t border-gray-100">
              <h3 class="text-lg font-bold text-casa-dark mb-4 flex items-center gap-2"><Building size={18} class="text-casa-teal" /> Datos Tributarios</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-sm font-bold text-casa-dark uppercase tracking-wider">NIT (Número de Identificación Tributaria)</label>
                  <input type="text" bind:value={formData.nit} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none tracking-widest font-medium" placeholder="1234567015" />
                  <p class="text-xs text-gray-400">Opcional. Si el asesor emitirá factura por sus comisiones.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- STEP 3: Expediente Digital -->
      {#if currentStep === 3}
        <div class="p-8 md:p-12 absolute inset-0 animate-in fade-in slide-in-from-right-8 duration-500 overflow-y-auto">
          <h2 class="text-2xl font-bold text-casa-dark mb-2 flex items-center gap-2"><FileText class="text-casa-teal"/> Expediente Digital</h2>
          <p class="text-gray-500 mb-8">Sube los documentos requeridos. Puedes arrastrar y soltar o hacer clic.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Foto de Perfil -->
            <div class="border-2 border-dashed {files.foto ? 'border-casa-teal bg-casa-teal/5 scale-105 shadow-md' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:scale-[1.02]'} rounded-2xl p-6 text-center transition-all duration-300 relative group cursor-pointer h-40 flex flex-col justify-center">
              <input type="file" accept="image/*" onchange={(e) => handleFileUpload(e, 'foto')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {#if files.foto}
                <div class="text-casa-teal flex flex-col items-center animate-in zoom-in duration-300">
                  <CheckCircle size={32} class="mb-2" />
                  <p class="font-bold text-sm truncate w-full px-4">{files.foto.name}</p>
                </div>
              {:else}
                <div class="animate-in fade-in">
                  <ImageIcon size={32} class="mx-auto mb-3 text-gray-400 group-hover:text-casa-teal transition-colors" />
                  <p class="font-bold text-casa-dark text-sm">Foto de Perfil Profesional</p>
                  <p class="text-xs text-gray-500 mt-1">JPG, PNG (Max 5MB)</p>
                </div>
              {/if}
            </div>

            <!-- Identificación -->
            <div class="border-2 border-dashed {files.identificacion ? 'border-casa-teal bg-casa-teal/5 scale-105 shadow-md' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:scale-[1.02]'} rounded-2xl p-6 text-center transition-all duration-300 relative group cursor-pointer h-40 flex flex-col justify-center">
              <input type="file" accept=".pdf,.jpg,.png" onchange={(e) => handleFileUpload(e, 'identificacion')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {#if files.identificacion}
                <div class="text-casa-teal flex flex-col items-center animate-in zoom-in duration-300">
                  <CheckCircle size={32} class="mb-2" />
                  <p class="font-bold text-sm truncate w-full px-4">{files.identificacion.name}</p>
                </div>
              {:else}
                <div class="animate-in fade-in">
                  <ShieldCheck size={32} class="mx-auto mb-3 text-gray-400 group-hover:text-casa-teal transition-colors" />
                  <p class="font-bold text-casa-dark text-sm">Cédula de Identidad (Anverso y Reverso)</p>
                  <p class="text-xs text-gray-500 mt-1">PDF o Imagen</p>
                </div>
              {/if}
            </div>

            <!-- Comprobante Domicilio -->
            <div class="border-2 border-dashed {files.comprobanteDomicilio ? 'border-casa-teal bg-casa-teal/5 scale-105 shadow-md' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:scale-[1.02]'} rounded-2xl p-6 text-center transition-all duration-300 relative group cursor-pointer h-40 flex flex-col justify-center">
              <input type="file" accept=".pdf,.jpg,.png" onchange={(e) => handleFileUpload(e, 'comprobanteDomicilio')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {#if files.comprobanteDomicilio}
                <div class="text-casa-teal flex flex-col items-center animate-in zoom-in duration-300">
                  <CheckCircle size={32} class="mb-2" />
                  <p class="font-bold text-sm truncate w-full px-4">{files.comprobanteDomicilio.name}</p>
                </div>
              {:else}
                <div class="animate-in fade-in">
                  <MapPin size={32} class="mx-auto mb-3 text-gray-400 group-hover:text-casa-teal transition-colors" />
                  <p class="font-bold text-casa-dark text-sm">Comprobante de Domicilio</p>
                  <p class="text-xs text-gray-500 mt-1">CRE, Saguapac o Teléfono (Antigüedad &lt; 3 meses)</p>
                </div>
              {/if}
            </div>

            <!-- Otros Documentos Multiselección -->
            <div class="border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-2xl p-6 text-center transition-all relative group cursor-pointer h-40 flex flex-col justify-center">
              <input type="file" multiple accept=".pdf,.jpg,.png,.docx" onchange={(e) => handleFileUpload(e, 'otrosDocumentos')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <UploadCloud size={32} class="mx-auto mb-3 text-gray-400 group-hover:text-casa-teal transition-colors" />
              <p class="font-bold text-casa-dark text-sm">Añadir Otros Documentos (Opcional)</p>
              <p class="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Plus size={14}/> CV, Certificaciones, etc.</p>
            </div>

            <!-- Previsualización de otros documentos añadidos -->
            {#if files.otrosDocumentos.length > 0}
              <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 animate-in fade-in slide-in-from-top-4">
                {#each files.otrosDocumentos as doc, i}
                  <div class="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative z-20 group hover:border-casa-teal transition-colors">
                    <span class="text-sm font-medium text-gray-700 truncate mr-4">{doc.name}</span>
                    <button type="button" onclick={() => removeOtroDocumento(i)} class="text-gray-400 hover:text-red-600 p-1 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                {/each}
              </div>
            {/if}

          </div>
        </div>
      {/if}

      <!-- STEP 4: Acceso y Rol -->
      {#if currentStep === 4}
        <div class="p-8 md:p-12 absolute inset-0 animate-in fade-in slide-in-from-right-8 duration-500 overflow-y-auto">
          <h2 class="text-2xl font-bold text-casa-dark mb-6 flex items-center gap-2"><ShieldCheck class="text-casa-teal"/> Credenciales de Acceso</h2>
          
          <div class="bg-casa-dark/5 p-8 rounded-3xl border border-gray-200 mb-8 relative overflow-hidden group">
            <div class="absolute -right-8 -top-8 text-casa-teal/10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
              <Lock size={180} strokeWidth={1} />
            </div>
            
            <div class="relative z-10 space-y-6">
              <div>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Correo Electrónico (Login)</p>
                <div class="relative">
                  <Mail size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-casa-teal" />
                  <input type="email" bind:value={formData.email} class="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none transition-all font-bold text-casa-dark shadow-sm" placeholder="usuario@casalegal.com" required />
                </div>
                <p class="text-xs text-gray-500 mt-2">Este email será utilizado por el asesor para iniciar sesión en la plataforma.</p>
              </div>

              <div>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contraseña por Defecto</p>
                <div class="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm opacity-90">
                  <Lock size={18} class="text-casa-teal ml-1" />
                  <span class="font-bold text-casa-dark tracking-widest text-lg">{formData.ci || '********'}</span>
                  <span class="ml-auto text-[10px] bg-casa-teal/10 text-casa-teal font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest border border-casa-teal/20">Generada</span>
                </div>
                <p class="text-xs text-gray-500 mt-2">La contraseña inicial del asesor será automáticamente su número de Cédula de Identidad (CI).</p>
              </div>

              <div class="pt-4">
                <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nivel de Acceso (Rol en el CRM)</p>
                <select bind:value={formData.rol} class="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none font-extrabold text-casa-dark appearance-none cursor-pointer shadow-sm relative z-20 uppercase tracking-wider">
                  <option value="ASESOR">🏠 Agente Inmobiliario</option>
                  <option value="BROKER">💼 Broker Líder (Gerente)</option>
                  <option value="ADMIN">⚙️ Staff / Administrativo</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- STEP 5: Credencial -->
      {#if currentStep === 5 && registeredAsesor}
        <div class="p-8 md:p-12 absolute inset-0 animate-in fade-in slide-in-from-right-8 duration-500 overflow-y-auto bg-gray-50">
          <Credencial asesor={registeredAsesor} />
        </div>
      {/if}

    </form>

    <!-- Footer / Controls -->
    <div class="bg-transparent pt-6 flex items-center justify-between">
      <button 
        type="button" 
        onclick={prevStep}
        class="px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-all {currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-white shadow-sm border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-casa-dark hover:-translate-y-0.5'}"
      >
        <ChevronLeft size={18} /> Anterior
      </button>

      {#if currentStep < totalSteps - 1}
        <button 
          type="button"
          onclick={nextStep}
          class="px-8 py-3 bg-casa-teal text-white rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-[#061C13] transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
        >
          Siguiente <ChevronRight size={18} />
        </button>
      {:else if currentStep === 4}
        <button 
          type="button"
          onclick={handleSubmit}
          disabled={isLoading}
          class="px-8 py-3 bg-casa-gold text-casa-dark rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          {#if isLoading}
            <Loader2 size={18} class="animate-spin" /> Creando Cuenta...
          {:else}
            Finalizar Alta en CRM <CheckCircle size={18} />
          {/if}
        </button>
      {:else if currentStep === 5}
        <button 
          type="button"
          onclick={() => {
            currentStep = 1;
            formData = {
              nombres: '', apellidos: '', ci: '', email: '', telefono: '', rol: 'ASESOR', fechaNacimiento: '',
              nit: '', calle: '', ciudad: '', departamento: 'Santa Cruz', experiencia: '0-2 años'
            };
            files = { foto: null, identificacion: null, comprobanteDomicilio: null, otrosDocumentos: [] };
            registeredAsesor = null;
          }}
          class="px-8 py-3 bg-casa-teal text-white rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-[#061C13] transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
        >
          Registrar Otro Asesor <Plus size={18} />
        </button>
      {/if}
    </div>

  </div>
</div>
