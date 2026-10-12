<script>
  import { Sparkles, UploadCloud, ShieldCheck, FileText, Download, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, Eye, User, MapPin, Calendar, ArrowRight, Wand2, RotateCcw } from 'lucide-svelte';
  import { descargarContratoPDF, getContratoData, CLAUSULAS_CONTRATO_BASE } from '#lib/contratoAsesor.js';
  import logoInmo from '#lib/assets/logoinmo.png';

  let { 
    open = $bindable(false),
    onApplyData = () => {} 
  } = $props();

  // Estados de imágenes
  let anversoFile = $state(null);
  let anversoPreview = $state('');
  let reversoFile = $state(null);
  let reversoPreview = $state('');

  // Estados de proceso de escaneo
  let isScanning = $state(false);
  let scanProgressText = $state('');
  let scanError = $state('');
  let scanComplete = $state(false);

  // Datos extraídos (por defecto La Paz - El Alto)
  let extractedData = $state({
    nombres: '',
    apellidos: '',
    nombreCompleto: '',
    ci: '',
    expedido: 'LP',
    ciCompleto: '',
    fechaNacimiento: '',
    nacionalidad: 'Boliviana',
    estadoCivil: '',
    profesion: '',
    direccion: '',
    departamento: 'La Paz',
    ciudad: 'El Alto'
  });

  // Modal y estado del contrato
  let showContractPreview = $state(false);
  let customClausulas = $state(null);
  let aiPrompt = $state('');
  let isModifyingContract = $state(false);
  let modifyMessage = $state('');
  let modifyError = $state('');

  // Sugerencias rápidas de prompts para el contrato
  const promptSuggestions = [
    'Hacer el contrato más flexible en cuotas y sin penalidades estrictas',
    'Añadir cláusula de comisiones compartidas 50/50 con agentes externos',
    'Reducir preaviso de rescisión a 15 días calendario',
    'Fijar periodo de vigencia inicial a 6 meses de prueba',
    'Añadir bono por cumplimiento de metas trimestrales'
  ];

  function handleFileChange(event, tipo) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (tipo === 'anverso') {
        anversoFile = file;
        anversoPreview = e.target.result;
      } else {
        reversoFile = file;
        reversoPreview = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  function removeFile(tipo) {
    if (tipo === 'anverso') {
      anversoFile = null;
      anversoPreview = '';
    } else {
      reversoFile = null;
      reversoPreview = '';
    }
  }

  async function processCarnetWithIA() {
    if (!anversoFile && !reversoFile) {
      scanError = 'Por favor sube al menos una foto del carnet (anverso o reverso).';
      return;
    }

    isScanning = true;
    scanError = '';
    scanProgressText = 'Analizando carnet con Gemini 2.5 Flash...';

    try {
      const imagesPayload = [];

      if (anversoPreview) {
        imagesPayload.push({
          data: anversoPreview.split(',')[1],
          mimeType: anversoFile?.type || 'image/jpeg'
        });
      }

      if (reversoPreview) {
        imagesPayload.push({
          data: reversoPreview.split(',')[1],
          mimeType: reversoFile?.type || 'image/jpeg'
        });
      }

      scanProgressText = 'Extrayendo filiación, C.I. y datos del SEGIP con IA...';

      const res = await fetch('/api/gemini/extract-carnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagesPayload })
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || 'No se pudieron extraer los datos.');
      }

      const d = result.data || {};
      extractedData = {
        nombres: d.nombres || '',
        apellidos: d.apellidos || '',
        nombreCompleto: d.nombreCompleto || `${d.nombres || ''} ${d.apellidos || ''}`.trim(),
        ci: d.ci || '',
        expedido: d.expedido || 'LP',
        ciCompleto: d.ciCompleto || (d.ci ? `${d.ci} ${d.expedido || ''}`.trim() : ''),
        fechaNacimiento: d.fechaNacimiento || '',
        nacionalidad: d.nacionalidad || 'Boliviana',
        estadoCivil: d.estadoCivil || '',
        profesion: d.profesion || '',
        direccion: d.direccion || '',
        departamento: d.departamento || 'La Paz',
        ciudad: d.ciudad || 'El Alto'
      };

      scanComplete = true;
    } catch (err) {
      console.error(err);
      scanError = 'Error al analizar el carnet: ' + err.message;
    } finally {
      isScanning = false;
      scanProgressText = '';
    }
  }

  // Modificar contrato con prompt de IA
  async function applyAiContractModification(instructionText) {
    const promptToUse = instructionText || aiPrompt;
    if (!promptToUse || !promptToUse.trim()) {
      modifyError = 'Escribe una instrucción para que la IA modifique el contrato.';
      return;
    }

    isModifyingContract = true;
    modifyError = '';
    modifyMessage = 'Gemini 2.5 Flash adaptando cláusulas legales...';

    try {
      const clausulasBase = customClausulas || CLAUSULAS_CONTRATO_BASE.map(c => ({
        num: c.num,
        titulo: c.titulo,
        contenido: typeof c.contenido === 'function' ? c.contenido(getContratoData(extractedData)) : c.contenido
      }));

      const res = await fetch('/api/gemini/modify-contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clausulas: clausulasBase,
          prompt: promptToUse,
          asesor: extractedData
        })
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo modificar el contrato.');
      }

      customClausulas = result.clausulas;
      modifyMessage = result.resumenModificacion || '¡Cláusulas adaptadas correctamente!';
      showContractPreview = true;
    } catch (err) {
      console.error(err);
      modifyError = 'Error al modificar contrato: ' + err.message;
      modifyMessage = '';
    } finally {
      isModifyingContract = false;
    }
  }

  function resetToOriginalContract() {
    customClausulas = null;
    modifyMessage = 'Contrato restablecido a las 17 cláusulas originales oficiales.';
    modifyError = '';
  }

  function handleDownloadContrato() {
    descargarContratoPDF(extractedData, customClausulas);
  }

  function applyAndClose() {
    onApplyData({
      formData: {
        nombres: extractedData.nombres,
        apellidos: extractedData.apellidos,
        ci: extractedData.ciCompleto || extractedData.ci,
        fechaNacimiento: extractedData.fechaNacimiento,
        calle: extractedData.direccion,
        ciudad: extractedData.ciudad || 'El Alto',
        departamento: extractedData.departamento || 'La Paz'
      },
      fileIdentificacion: anversoFile || reversoFile
    });
    open = false;
  }

  function resetState() {
    anversoFile = null;
    anversoPreview = '';
    reversoFile = null;
    reversoPreview = '';
    scanComplete = false;
    scanError = '';
    isScanning = false;
    customClausulas = null;
    aiPrompt = '';
    modifyMessage = '';
    modifyError = '';
  }

  // Lista de cláusulas activas para el visor
  let clausulasActivas = $derived.by(() => {
    const d = getContratoData(extractedData);
    if (customClausulas && customClausulas.length > 0) {
      return customClausulas.map(c => ({
        num: c.num,
        titulo: c.titulo,
        texto: typeof c.contenido === 'function' ? c.contenido(d) : c.contenido
      }));
    }
    return CLAUSULAS_CONTRATO_BASE.map(c => ({
      num: c.num,
      titulo: c.titulo,
      texto: typeof c.contenido === 'function' ? c.contenido(d) : c.contenido
    }));
  });
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
      
      <!-- Encabezado Modal -->
      <div class="p-6 bg-gradient-to-r from-[#0B303A] via-[#104857] to-[#0B303A] text-white flex items-center justify-between relative overflow-hidden">
        <div class="absolute -right-8 -top-8 w-44 h-44 bg-casa-gold/15 rounded-full blur-2xl pointer-events-none"></div>
        <div class="flex items-center gap-4 relative z-10">
          <div class="w-14 h-14 bg-white/10 rounded-2xl p-2 border border-casa-gold/40 shadow-inner flex items-center justify-center shrink-0">
            <img src={logoInmo} alt="Casa Legal" class="w-full h-full object-contain drop-shadow" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl sm:text-2xl font-black tracking-tight">Generar Agente con IA</h2>
              <span class="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-casa-gold text-[#0B303A] rounded-full shadow-sm">Gemini 2.5 Flash</span>
            </div>
            <p class="text-xs sm:text-sm text-gray-300 mt-0.5">Sube el carnet boliviano • Sede legal: <strong class="text-casa-gold">El Alto (La Paz)</strong> • Generación de contrato oficial.</p>
          </div>
        </div>
        <button 
          onclick={() => open = false} 
          class="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors relative z-10 cursor-pointer"
        >
          <X size={22} />
        </button>
      </div>

      <!-- Contenido Principal con Scroll -->
      <div class="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
        
        {#if !scanComplete}
          <!-- PASO 1: Subida de Cédula de Identidad -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-[#0B303A] flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-[#0B303A] text-white text-xs flex items-center justify-center font-bold">1</span>
                Sube la Cédula de Identidad del Asesor
              </h3>
              <span class="text-xs text-gray-500 font-medium">Anverso y/o Reverso</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Anverso -->
              <div class="border-2 border-dashed {anversoPreview ? 'border-teal-600 bg-teal-50/40' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'} rounded-2xl p-4 text-center transition-all relative flex flex-col items-center justify-center min-h-[190px]">
                {#if anversoPreview}
                  <img src={anversoPreview} alt="Anverso carnet" class="max-h-36 rounded-lg object-contain shadow-sm border border-gray-200" />
                  <div class="mt-2 flex items-center gap-2">
                    <span class="text-xs font-bold text-teal-700 flex items-center gap-1"><CheckCircle2 size={14} /> Anverso Cargado</span>
                    <button type="button" onclick={() => removeFile('anverso')} class="text-xs text-red-500 hover:underline">Cambiar</button>
                  </div>
                {:else}
                  <input type="file" accept="image/*" onchange={(e) => handleFileChange(e, 'anverso')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <ShieldCheck size={36} class="text-gray-400 mb-2 group-hover:text-teal-600" />
                  <p class="font-bold text-sm text-[#0B303A]">Anverso (Frente)</p>
                  <p class="text-xs text-gray-400 mt-1">Foto clara con nombres y C.I. visibles</p>
                {/if}
              </div>

              <!-- Reverso -->
              <div class="border-2 border-dashed {reversoPreview ? 'border-teal-600 bg-teal-50/40' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'} rounded-2xl p-4 text-center transition-all relative flex flex-col items-center justify-center min-h-[190px]">
                {#if reversoPreview}
                  <img src={reversoPreview} alt="Reverso carnet" class="max-h-36 rounded-lg object-contain shadow-sm border border-gray-200" />
                  <div class="mt-2 flex items-center gap-2">
                    <span class="text-xs font-bold text-teal-700 flex items-center gap-1"><CheckCircle2 size={14} /> Reverso Cargado</span>
                    <button type="button" onclick={() => removeFile('reverso')} class="text-xs text-red-500 hover:underline">Cambiar</button>
                  </div>
                {:else}
                  <input type="file" accept="image/*" onchange={(e) => handleFileChange(e, 'reverso')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <UploadCloud size={36} class="text-gray-400 mb-2 group-hover:text-teal-600" />
                  <p class="font-bold text-sm text-[#0B303A]">Reverso (Dorso) <span class="text-xs text-gray-400 font-normal">(Opcional)</span></p>
                  <p class="text-xs text-gray-400 mt-1">Para capturar domicilio o código SEGIP</p>
                {/if}
              </div>

            </div>

            <!-- Error si existe -->
            {#if scanError}
              <div class="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{scanError}</span>
              </div>
            {/if}

            <!-- Botón de Acción -->
            <div class="mt-6 flex justify-end">
              <button 
                type="button" 
                onclick={processCarnetWithIA}
                disabled={isScanning || (!anversoPreview && !reversoPreview)}
                class="px-8 py-3.5 bg-gradient-to-r from-[#0B303A] to-[#145366] text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg hover:shadow-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {#if isScanning}
                  <Loader2 size={16} class="animate-spin text-casa-gold" />
                  <span>{scanProgressText}</span>
                {:else}
                  <Sparkles size={16} class="text-casa-gold" />
                  <span>Escanear y Extraer con Gemini 2.5</span>
                {/if}
              </button>
            </div>
          </div>

        {:else}

          <!-- PASO 2: Datos Extraídos & Generación / Personalización de Contrato -->
          <div class="space-y-6 animate-in fade-in duration-300">
            
            <!-- Resumen de éxito -->
            <div class="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h4 class="font-bold text-[#0B303A] text-sm">Cédula Analizada con Éxito</h4>
                  <p class="text-xs text-gray-500">Datos inyectados en la sede de <strong>El Alto / La Paz</strong>.</p>
                </div>
              </div>
              <button 
                type="button" 
                onclick={resetState} 
                class="text-xs text-gray-500 hover:text-[#0B303A] flex items-center gap-1 font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer"
              >
                <RefreshCw size={12} /> Re-escanear
              </button>
            </div>

            <!-- Formulario de datos detectados (Editable) -->
            <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <User size={14} class="text-[#0B303A]" /> Datos de Identidad Extraídos
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nombres</label>
                  <input type="text" bind:value={extractedData.nombres} class="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-[#0B303A]" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Apellidos</label>
                  <input type="text" bind:value={extractedData.apellidos} class="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-[#0B303A]" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">C.I. y Expedido</label>
                  <input type="text" bind:value={extractedData.ciCompleto} class="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-teal-800 tracking-wider" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Fecha de Nacimiento</label>
                  <input type="date" bind:value={extractedData.fechaNacimiento} class="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Ciudad / Sede</label>
                  <input type="text" bind:value={extractedData.ciudad} class="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#0B303A]" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Departamento</label>
                  <input type="text" bind:value={extractedData.departamento} class="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700" />
                </div>
                <div class="sm:col-span-2 md:col-span-3">
                  <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Dirección / Domicilio</label>
                  <input type="text" bind:value={extractedData.direccion} class="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700" placeholder="Ej: C. Cuarto Centenario No. 1067 Z. Villa Nueva Potosi..." />
                </div>
              </div>
            </div>

            <!-- TARJETA DEL CONTRATO INYECTADO -->
            <div class="bg-gradient-to-br from-[#0B303A] via-[#103D4A] to-[#0B303A] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div class="absolute -right-12 -bottom-12 w-48 h-48 bg-casa-gold/10 rounded-full blur-2xl pointer-events-none"></div>

              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 relative z-10">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-white/10 rounded-2xl p-1.5 border border-casa-gold/40 flex items-center justify-center shrink-0 shadow-sm">
                    <img src={logoInmo} alt="Casa Legal" class="w-full h-full object-contain drop-shadow" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-extrabold uppercase tracking-widest text-casa-gold block">Documento Legal Inyectado</span>
                      {#if customClausulas}
                        <span class="px-2 py-0.5 text-[9px] bg-teal-500/30 text-teal-300 rounded-full font-bold uppercase tracking-wider border border-teal-500/40">Personalizado con IA</span>
                      {/if}
                    </div>
                    <h3 class="text-lg font-bold">Contrato de Agencia Inmobiliaria</h3>
                    <p class="text-xs text-gray-300">
                      {clausulasActivas.length} Cláusulas • Sede de Firma: <strong class="text-casa-gold">El Alto (La Paz)</strong> • Asesor: {extractedData.nombreCompleto || 'Asesor'} (CI: {extractedData.ciCompleto})
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    type="button" 
                    onclick={() => showContractPreview = !showContractPreview}
                    class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye size={14} /> {showContractPreview ? 'Ocultar Cláusulas' : 'Ver Cláusulas'}
                  </button>
                  <button 
                    type="button" 
                    onclick={handleDownloadContrato}
                    class="px-5 py-2.5 bg-casa-gold text-[#0B303A] hover:brightness-110 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg hover:shadow-xl transition-all uppercase tracking-wider cursor-pointer"
                  >
                    <Download size={14} /> Descargar PDF
                  </button>
                </div>
              </div>

              <!-- SECCIÓN DE PERSONALIZACIÓN CON IA (PROMPT DEL USUARIO) -->
              <div class="mt-4 pt-4 border-t border-white/10">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-bold text-casa-gold flex items-center gap-1.5">
                    <Wand2 size={14} /> Modificar o adaptar contrato con IA:
                  </label>
                  {#if customClausulas}
                    <button 
                      type="button" 
                      onclick={resetToOriginalContract}
                      class="text-[11px] text-gray-300 hover:text-white flex items-center gap-1 underline cursor-pointer"
                    >
                      <RotateCcw size={12} /> Restaurar original (17 cláusulas)
                    </button>
                  {/if}
                </div>

                <!-- Chips de sugerencias rápidas -->
                <div class="flex flex-wrap gap-1.5 mb-3">
                  {#each promptSuggestions as sug}
                    <button 
                      type="button"
                      onclick={() => applyAiContractModification(sug)}
                      disabled={isModifyingContract}
                      class="text-[10px] px-2.5 py-1 bg-white/10 hover:bg-white/20 text-gray-200 rounded-lg transition-colors border border-white/10 disabled:opacity-50 cursor-pointer text-left"
                    >
                      ⚡ {sug}
                    </button>
                  {/each}
                </div>

                <!-- Input del prompt de IA -->
                <div class="flex gap-2">
                  <input 
                    type="text" 
                    bind:value={aiPrompt}
                    placeholder="Ej: Haz el contrato más flexible, o añade una cláusula de confidencialidad para clientes VIP..."
                    disabled={isModifyingContract}
                    class="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-gray-400 outline-none focus:border-casa-gold transition-colors"
                    onkeydown={(e) => { if (e.key === 'Enter') applyAiContractModification(); }}
                  />
                  <button 
                    type="button" 
                    onclick={() => applyAiContractModification()}
                    disabled={isModifyingContract || !aiPrompt.trim()}
                    class="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    {#if isModifyingContract}
                      <Loader2 size={14} class="animate-spin text-casa-gold" />
                      <span>Modificando...</span>
                    {:else}
                      <Sparkles size={14} class="text-casa-gold" />
                      <span>Aplicar IA</span>
                    {/if}
                  </button>
                </div>

                {#if modifyMessage}
                  <div class="mt-2.5 p-2.5 bg-teal-900/60 border border-teal-500/40 rounded-xl text-xs text-teal-200 flex items-center gap-2">
                    <CheckCircle2 size={14} class="text-teal-400 shrink-0" />
                    <span>{modifyMessage}</span>
                  </div>
                {/if}

                {#if modifyError}
                  <div class="mt-2.5 p-2.5 bg-red-900/60 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
                    <AlertCircle size={14} class="text-red-400 shrink-0" />
                    <span>{modifyError}</span>
                  </div>
                {/if}
              </div>

              <!-- Vista previa de cláusulas desplegable -->
              {#if showContractPreview}
                <div class="mt-5 p-4 bg-black/40 rounded-2xl max-h-72 overflow-y-auto text-xs space-y-3 text-gray-200 border border-white/10 animate-in fade-in">
                  <div class="flex items-center justify-between pb-2 border-b border-white/10">
                    <span class="font-bold text-casa-gold text-xs">VISOR DE CLÁUSULAS ({clausulasActivas.length})</span>
                    <span class="text-[10px] text-gray-400">Sede: {extractedData.ciudad} - {extractedData.departamento}</span>
                  </div>

                  {#each clausulasActivas as c}
                    <div class="p-2.5 bg-white/5 rounded-xl border border-white/5">
                      <h5 class="font-bold text-casa-gold text-xs mb-1 flex items-center gap-1.5">
                        <span class="text-[10px] px-1.5 py-0.5 bg-white/10 rounded">CLÁUSULA {c.num}</span>
                        <span>{c.titulo}</span>
                      </h5>
                      <p class="text-[11px] text-gray-300 whitespace-pre-line leading-relaxed">{c.texto}</p>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

          </div>
        {/if}

      </div>

      <!-- Footer / Acciones Finales -->
      <div class="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button 
          type="button" 
          onclick={() => open = false} 
          class="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-[#0B303A] cursor-pointer"
        >
          Cancelar
        </button>

        {#if scanComplete}
          <button 
            type="button" 
            onclick={applyAndClose}
            class="px-8 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            <span>Rellenar Formulario y Continuar</span>
            <ArrowRight size={16} />
          </button>
        {/if}
      </div>

    </div>
  </div>
{/if}
