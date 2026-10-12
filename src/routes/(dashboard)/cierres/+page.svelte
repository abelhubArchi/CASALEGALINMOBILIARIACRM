<script>
  import {
    Briefcase,
    FileCheck,
    DollarSign,
    Download,
    Plus,
    Scale,
    Building,
    Calendar,
    CheckCircle2,
    Clock,
    Percent,
    AlertCircle,
    X,
    ChevronRight,
    User,
    ShieldCheck,
    Receipt,
    Sparkles,
    Check
  } from 'lucide-svelte';
  import { authState } from '#lib/authStore.svelte.js';
  import { TIPO_CAMBIO_OFICIAL } from '#lib/currency';
  import { descargarContratoPDF } from '#lib/contratoAsesor.js';

  // Modal para registrar nuevo cierre
  let showModalNuevoCierre = $state(false);
  let filterStatus = $state('todos');
  let successToast = $state(null);
  let isDownloadingContract = $state(false);

  // Formulario de nuevo cierre
  let nuevoCierre = $state({
    propiedad: '',
    cliente: '',
    asesorNombre: authState.profile?.nombreCompleto || 'Asesor Inmobiliario',
    montoUSD: 95000,
    porcentajeComision: 4,
    notaria: 'Torre CAUSAE 6.° Piso, El Alto (Notaría 41)',
    estado: 'Minuta Firmada'
  });

  // Operaciones de Cierre Reales de la Franquicia con desglose contractual oficial (Cláusula 6)
  let cierres = $state([
    {
      id: 'CL-2026-1029',
      propiedad: 'Residencia Lomas VIP de Achumani',
      cliente: 'Alejandro Vargas Mercado',
      asesor: 'Abel Escobar',
      montoUSD: 850000,
      porcentajeComision: 4,
      fecha: '10 Oct 2026',
      estado: 'Minuta Notarial',
      notaria: 'Torre CAUSAE 6.° Piso, El Alto (Notaría 41)',
      facturaEmitida: true
    },
    {
      id: 'CL-2026-1030',
      propiedad: 'Villa del Sol Exclusiva Cota Cota',
      cliente: 'Familia Gómez Terán',
      asesor: 'Hugo Santos Q.',
      montoUSD: 450000,
      porcentajeComision: 4,
      fecha: '08 Oct 2026',
      estado: 'Liquidado',
      notaria: 'Torre CAUSAE 6.° Piso, El Alto (Notaría 41)',
      facturaEmitida: true
    },
    {
      id: 'CL-2026-1031',
      propiedad: 'Departamento Penthouse Calacoto',
      cliente: 'Dr. Roberto Mendoza',
      asesor: 'Claudia Rivas',
      montoUSD: 165000,
      porcentajeComision: 5,
      fecha: '04 Oct 2026',
      estado: 'Arras Firmadas',
      notaria: 'Sede Central Casa Legal El Alto',
      facturaEmitida: false
    }
  ]);

  // Cálculos dinámicos por operación individual conforme a la Cláusula Sexta
  const calcularSplits = (montoUSD, pctComision) => {
    const comisionBrutaUSD = (montoUSD * pctComision) / 100;
    const comisionBrutaBOB = comisionBrutaUSD * TIPO_CAMBIO_OFICIAL;

    // 20% Asesor Inmobiliario
    const asesorUSD = (comisionBrutaUSD * 20) / 100;
    const asesorBOB = asesorUSD * TIPO_CAMBIO_OFICIAL;

    // 10% Inmobiliaria Casa Legal
    const inmoUSD = (comisionBrutaUSD * 10) / 100;
    const inmoBOB = inmoUSD * TIPO_CAMBIO_OFICIAL;

    // 10% Gastos de Administración (Operación Directa)
    const adminUSD = (comisionBrutaUSD * 10) / 100;
    const adminBOB = adminUSD * TIPO_CAMBIO_OFICIAL;

    return {
      comisionBrutaUSD,
      comisionBrutaBOB,
      asesorUSD,
      asesorBOB,
      inmoUSD,
      inmoBOB,
      adminUSD,
      adminBOB
    };
  };

  // KPIs Globales Consolidados
  let totalVolumenUSD = $derived(
    cierres.reduce((acc, c) => acc + (Number(c.montoUSD) || 0), 0)
  );
  let totalVolumenBOB = $derived(totalVolumenUSD * TIPO_CAMBIO_OFICIAL);

  let totalComisionesBrutasUSD = $derived(
    cierres.reduce((acc, c) => {
      const { comisionBrutaUSD } = calcularSplits(c.montoUSD, c.porcentajeComision);
      return acc + comisionBrutaUSD;
    }, 0)
  );
  let totalComisionesBrutasBOB = $derived(totalComisionesBrutasUSD * TIPO_CAMBIO_OFICIAL);

  let totalAsesoresUSD = $derived((totalComisionesBrutasUSD * 20) / 100);
  let totalAsesoresBOB = $derived(totalAsesoresUSD * TIPO_CAMBIO_OFICIAL);

  let totalInmobiliariaUSD = $derived((totalComisionesBrutasUSD * 10) / 100);
  let totalInmobiliariaBOB = $derived(totalInmobiliariaUSD * TIPO_CAMBIO_OFICIAL);

  let totalAdminUSD = $derived((totalComisionesBrutasUSD * 10) / 100);
  let totalAdminBOB = $derived(totalAdminUSD * TIPO_CAMBIO_OFICIAL);

  // Lista filtrada
  let filteredCierres = $derived(
    filterStatus === 'todos'
      ? cierres
      : cierres.filter((c) => c.estado === filterStatus)
  );

  // Previsualización en el modal del formulario
  let nuevoPreviewSplits = $derived(
    calcularSplits(nuevoCierre.montoUSD || 0, nuevoCierre.porcentajeComision || 4)
  );

  const guardarNuevoCierre = (e) => {
    e.preventDefault();
    if (!nuevoCierre.propiedad || !nuevoCierre.cliente || nuevoCierre.montoUSD <= 0) {
      alert('Por favor completa el nombre de la propiedad, cliente y monto válido.');
      return;
    }

    const nuevoId = `CL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaActual = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    cierres = [
      {
        id: nuevoId,
        propiedad: nuevoCierre.propiedad,
        cliente: nuevoCierre.cliente,
        asesor: nuevoCierre.asesorNombre || 'Asesor',
        montoUSD: Number(nuevoCierre.montoUSD),
        porcentajeComision: Number(nuevoCierre.porcentajeComision),
        fecha: fechaActual,
        estado: nuevoCierre.estado,
        notaria: nuevoCierre.notaria,
        facturaEmitida: false
      },
      ...cierres
    ];

    showModalNuevoCierre = false;
    successToast = `¡Operación ${nuevoId} registrada con éxito con liquidación contractual oficial!`;
    setTimeout(() => successToast = null, 4500);

    // Reset formulario
    nuevoCierre.propiedad = '';
    nuevoCierre.cliente = '';
    nuevoCierre.montoUSD = 95000;
  };

  const handleDescargarContrato = () => {
    isDownloadingContract = true;
    try {
      descargarContratoPDF(authState.profile || {});
    } catch (e) {
      console.error('Error al descargar contrato:', e);
      alert('Error al descargar contrato: ' + e.message);
    } finally {
      setTimeout(() => isDownloadingContract = false, 1500);
    }
  };
</script>

<svelte:head>
  <title>Casa de Cierres & Liquidaciones | Casa Legal CRM</title>
</svelte:head>

<div class="p-6 md:p-10 font-sans min-h-screen bg-[#071311] text-slate-100 flex flex-col overflow-y-auto selection:bg-[#D4AF37] selection:text-black">
  
  <!-- TOAST NOTIFICACIÓN -->
  {#if successToast}
    <div class="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
      <Check size={18} class="text-white shrink-0" />
      <span>{successToast}</span>
    </div>
  {/if}

  <div class="max-w-7xl mx-auto w-full space-y-8">
    
    <!-- ENCABEZADO PRINCIPAL -->
    <header class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
            <Scale size={13} /> Contrato Oficial · Cláusula Sexta
          </span>
          <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Building size={12} /> Sede Torre CAUSAE 6.° Piso, El Alto
          </span>
          <span class="text-xs text-slate-400 font-bold font-mono">
            T.C. Real: 11.86 Bs / USD
          </span>
        </div>
        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
          Casa de Cierres & Liquidaciones
        </h1>
        <p class="text-slate-400 text-sm md:text-base mt-1.5 max-w-3xl leading-relaxed">
          Control formal de transacciones inmobiliarias, comisiones devengadas y splits contractuales oficiales: <strong class="text-[#D4AF37]">20% Asesor</strong>, <strong class="text-emerald-400">10% Inmobiliaria Casa Legal</strong> y <strong class="text-blue-400">10% Gastos de Administración</strong>.
        </p>
      </div>

      <!-- BOTONES SUPERIORES -->
      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <button
          type="button"
          onclick={handleDescargarContrato}
          disabled={isDownloadingContract}
          class="px-4 py-3 rounded-2xl bg-[#0a201b] hover:bg-[#12362e] border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
          title="Descargar Contrato Oficial de Asesor en PDF"
        >
          <Download size={16} class="{isDownloadingContract ? 'animate-bounce' : ''}" />
          <span>{isDownloadingContract ? 'Generando...' : 'Contrato Asesor PDF'}</span>
        </button>

        <button
          type="button"
          onclick={() => showModalNuevoCierre = true}
          class="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Registrar Cierre</span>
        </button>
      </div>
    </header>

    <!-- KPIS DE LIQUIDACIÓN CONTRACTUAL (TARJETAS SUPERIORES) -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      
      <!-- VOLUMEN TOTAL CERRADO -->
      <div class="p-6 rounded-3xl bg-gradient-to-br from-[#0c241f] to-[#061411] border border-[#1b3d36] shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Volumen Cerrado</span>
          <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Building size={16} />
          </div>
        </div>
        <p class="text-2xl md:text-3xl font-black text-white font-mono leading-tight">
          ${totalVolumenUSD.toLocaleString()} <span class="text-xs font-sans text-slate-400 font-bold">USD</span>
        </p>
        <p class="text-xs text-emerald-400 font-mono font-bold mt-1">
          Bs. {totalVolumenBOB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <span class="text-[10px] text-slate-500 mt-2 block font-medium">{cierres.length} operaciones registradas</span>
      </div>

      <!-- HONORARIOS ASESORES (20%) -->
      <div class="p-6 rounded-3xl bg-gradient-to-br from-[#122e26] to-[#081814] border-2 border-[#D4AF37]/60 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-black uppercase tracking-wider text-[#D4AF37]">Split Asesor (20%)</span>
          <div class="w-8 h-8 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center">
            <Briefcase size={16} />
          </div>
        </div>
        <p class="text-2xl md:text-3xl font-black text-[#D4AF37] font-mono leading-tight">
          ${totalAsesoresUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span class="text-xs font-sans text-slate-300 font-bold">USD</span>
        </p>
        <p class="text-xs text-slate-300 font-mono font-bold mt-1">
          Bs. {totalAsesoresBOB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <span class="text-[10px] text-[#D4AF37] mt-2 block font-black uppercase">Cláusula 6: Intermediación efectiva</span>
      </div>

      <!-- INMOBILIARIA CASA LEGAL (10%) -->
      <div class="p-6 rounded-3xl bg-gradient-to-br from-[#0c241f] to-[#061411] border border-[#1b3d36] shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400">Inmobiliaria (10%)</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
        </div>
        <p class="text-2xl md:text-3xl font-black text-emerald-400 font-mono leading-tight">
          ${totalInmobiliariaUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span class="text-xs font-sans text-slate-400 font-bold">USD</span>
        </p>
        <p class="text-xs text-slate-400 font-mono font-bold mt-1">
          Bs. {totalInmobiliariaBOB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <span class="text-[10px] text-slate-400 mt-2 block font-medium">Uso de marca y soporte corporativo</span>
      </div>

      <!-- GASTOS DE ADMINISTRACIÓN (10%) -->
      <div class="p-6 rounded-3xl bg-gradient-to-br from-[#0c241f] to-[#061411] border border-[#1b3d36] shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-black uppercase tracking-wider text-blue-400">Admin Directa (10%)</span>
          <div class="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Receipt size={16} />
          </div>
        </div>
        <p class="text-2xl md:text-3xl font-black text-blue-400 font-mono leading-tight">
          ${totalAdminUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span class="text-xs font-sans text-slate-400 font-bold">USD</span>
        </p>
        <p class="text-xs text-slate-400 font-mono font-bold mt-1">
          Bs. {totalAdminBOB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <span class="text-[10px] text-slate-400 mt-2 block font-medium">Auditoría legal y gestión notarial</span>
      </div>

    </section>

    <!-- BANNER DE CONDICIONES CONTRACTUALES VIGENTES -->
    <section class="p-5 md:p-6 rounded-2xl bg-[#091f1a] border border-[#1b483c] flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/40">
          <Clock size={24} />
        </div>
        <div>
          <h3 class="text-white font-extrabold text-sm flex items-center gap-2">
            Recordatorio de Vigencia & Cuota Operativa (Cláusulas 5 y 10)
          </h3>
          <p class="text-slate-300 text-xs mt-0.5 max-w-2xl">
            Cuota mensual operativa pagadera hasta el <strong class="text-amber-400 font-bold">día 5 de cada mes adelantado</strong>. Contrato vigente por <strong class="text-white font-bold">1 año calendario</strong> renovable tácitamente (7 días de aviso previo).
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 size={15} /> Estado: Operativo Al Día
        </span>
      </div>
    </section>

    <!-- TABLA PRINCIPAL DE OPERACIONES CON DESGLOSE CONTRACTUAL -->
    <section class="rounded-3xl bg-[#091a17] border border-[#1b3d36] p-6 md:p-8 shadow-xl">
      
      <!-- FILTROS Y ENCABEZADO DE TABLA -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-extrabold text-white flex items-center gap-2.5">
            <Briefcase size={22} class="text-[#D4AF37]" /> Registro de Operaciones y Liquidaciones
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Desglose pormenorizado del 100% de la comisión inmobiliaria en cada cierre.
          </p>
        </div>

        <!-- SELECTOR DE FILTRO -->
        <div class="flex flex-wrap items-center gap-2">
          {#each ['todos', 'Minuta Notarial', 'Liquidado', 'Arras Firmadas'] as status}
            <button
              type="button"
              onclick={() => filterStatus = status}
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all {filterStatus === status ? 'bg-[#D4AF37] text-black shadow-md' : 'bg-[#061411] text-slate-400 hover:text-white border border-[#173a32]'}"
            >
              {status === 'todos' ? 'Todas' : status}
            </button>
          {/each}
        </div>
      </div>

      <!-- TABLA RESPONSIVA -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr class="bg-[#061411] border-b border-[#173a32] text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th class="p-4">Operación & Fecha</th>
              <th class="p-4">Propiedad & Asesor</th>
              <th class="p-4">Cliente / Notaría</th>
              <th class="p-4 text-right">Monto Venta (USD / Bs)</th>
              <th class="p-4 text-right">Comisión Total (100%)</th>
              <th class="p-4 text-right">Split Asesor (20%)</th>
              <th class="p-4 text-right">Inmo (10%) / Admin (10%)</th>
              <th class="p-4 text-center">Estatus</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#133029]">
            {#each filteredCierres as c}
              {@const splits = calcularSplits(c.montoUSD, c.porcentajeComision)}
              <tr class="hover:bg-[#0a231d]/60 transition-colors">
                
                <!-- ID Y FECHA -->
                <td class="p-4">
                  <span class="font-mono font-black text-xs text-[#D4AF37] block">{c.id}</span>
                  <span class="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <Calendar size={11} /> {c.fecha}
                  </span>
                </td>

                <!-- PROPIEDAD Y ASESOR -->
                <td class="p-4">
                  <p class="font-bold text-sm text-white">{c.propiedad}</p>
                  <p class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <User size={12} class="text-[#D4AF37]" /> Asesor: <strong class="text-slate-200">{c.asesor}</strong>
                  </p>
                </td>

                <!-- CLIENTE Y NOTARÍA -->
                <td class="p-4">
                  <p class="text-xs font-semibold text-slate-200">{c.cliente}</p>
                  <p class="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={c.notaria}>
                    {c.notaria}
                  </p>
                </td>

                <!-- MONTO TRANSACCIÓN -->
                <td class="p-4 text-right font-mono">
                  <span class="text-sm font-black text-white block">${c.montoUSD.toLocaleString()} USD</span>
                  <span class="text-[10px] font-bold text-emerald-400 block mt-0.5">
                    Bs. {(c.montoUSD * TIPO_CAMBIO_OFICIAL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>

                <!-- COMISIÓN TOTAL (100%) -->
                <td class="p-4 text-right font-mono">
                  <span class="text-xs font-bold text-slate-300 block">
                    ${splits.comisionBrutaUSD.toLocaleString()} ({c.porcentajeComision}%)
                  </span>
                  <span class="text-[10px] text-slate-500 block mt-0.5">
                    Bs. {splits.comisionBrutaBOB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>

                <!-- SPLIT ASESOR (20%) -->
                <td class="p-4 text-right font-mono bg-[#D4AF37]/5">
                  <span class="text-sm font-black text-[#D4AF37] block">
                    ${splits.asesorUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })} USD
                  </span>
                  <span class="text-[10px] font-bold text-slate-300 block mt-0.5">
                    Bs. {splits.asesorBOB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>

                <!-- SPLIT INMOBILIARIA Y ADMIN (10% CADA UNO) -->
                <td class="p-4 text-right font-mono text-xs">
                  <span class="text-emerald-400 font-bold block">
                    Inmo: ${splits.inmoUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                  <span class="text-blue-400 font-bold block mt-0.5">
                    Admin: ${splits.adminUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                </td>

                <!-- ESTATUS -->
                <td class="p-4 text-center">
                  {#if c.estado === 'Liquidado'}
                    <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <CheckCircle2 size={11} /> Liquidado
                    </span>
                  {:else if c.estado === 'Minuta Notarial'}
                    <span class="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <Scale size={11} /> Minuta Firmada
                    </span>
                  {:else}
                    <span class="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                      <Clock size={11} /> {c.estado}
                    </span>
                  {/if}
                </td>

              </tr>
            {/each}
          </tbody>
        </table>
      </div>

    </section>

  </div>
</div>

<!-- MODAL PARA REGISTRAR NUEVO CIERRE -->
{#if showModalNuevoCierre}
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
    <div class="relative w-full max-w-2xl bg-[#091d18] border border-[#23584c] rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden my-8">
      
      <!-- Botón cerrar -->
      <button
        type="button"
        onclick={() => showModalNuevoCierre = false}
        class="absolute top-5 right-5 p-2 rounded-xl bg-[#061411] text-slate-400 hover:text-white border border-[#173a32] transition-colors"
      >
        <X size={18} />
      </button>

      <!-- Encabezado Modal -->
      <div class="mb-6">
        <span class="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
          Cláusula Sexta · Distribución Contractual
        </span>
        <h3 class="text-2xl font-black text-white mt-1.5 flex items-center gap-2">
          <Briefcase size={22} class="text-[#D4AF37]" /> Registrar Nuevo Cierre de Operación
        </h3>
        <p class="text-xs text-slate-400 mt-1">
          Ingresa los datos para registrar la transacción y liquidar automáticamente los honorarios contractuales.
        </p>
      </div>

      <form onsubmit={guardarNuevoCierre} class="space-y-4">
        
        <div>
          <label for="input-cierre-propiedad" class="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
            Nombre / Título de la Propiedad *
          </label>
          <input
            id="input-cierre-propiedad"
            type="text"
            required
            bind:value={nuevoCierre.propiedad}
            placeholder="Ej. Casa en Condominio La Floresta"
            class="w-full px-4 py-2.5 rounded-xl bg-[#061411] border border-[#173830] text-white text-sm focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="input-cierre-cliente" class="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Cliente Comprador / Propietario *
            </label>
            <input
              id="input-cierre-cliente"
              type="text"
              required
              bind:value={nuevoCierre.cliente}
              placeholder="Ej. Ing. Carlos Salinas"
              class="w-full px-4 py-2.5 rounded-xl bg-[#061411] border border-[#173830] text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label for="input-cierre-asesor" class="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Asesor Ejecutor
            </label>
            <input
              id="input-cierre-asesor"
              type="text"
              bind:value={nuevoCierre.asesorNombre}
              placeholder="Nombre del Asesor"
              class="w-full px-4 py-2.5 rounded-xl bg-[#061411] border border-[#173830] text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="input-cierre-monto" class="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Monto de Venta ($ USD) *
            </label>
            <input
              id="input-cierre-monto"
              type="number"
              min="1000"
              required
              bind:value={nuevoCierre.montoUSD}
              class="w-full px-4 py-2.5 rounded-xl bg-[#061411] border border-[#173830] text-white font-mono font-bold text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label for="select-cierre-pct" class="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Comisión Total Acordada (%)
            </label>
            <select
              id="select-cierre-pct"
              bind:value={nuevoCierre.porcentajeComision}
              class="w-full px-4 py-2.5 rounded-xl bg-[#061411] border border-[#173830] text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            >
              <option value={3}>3% de Comisión Global</option>
              <option value={4}>4% de Comisión Global (Estándar)</option>
              <option value={5}>5% de Comisión Global (Exclusiva)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="input-cierre-notaria" class="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Sede Notarial / Firma
            </label>
            <input
              id="input-cierre-notaria"
              type="text"
              bind:value={nuevoCierre.notaria}
              placeholder="Ej. Torre CAUSAE 6.° Piso, El Alto"
              class="w-full px-4 py-2.5 rounded-xl bg-[#061411] border border-[#173830] text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label for="select-cierre-estado" class="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Estado de la Operación
            </label>
            <select
              id="select-cierre-estado"
              bind:value={nuevoCierre.estado}
              class="w-full px-4 py-2.5 rounded-xl bg-[#061411] border border-[#173830] text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="Minuta Notarial">Minuta Notarial</option>
              <option value="Arras Firmadas">Arras Firmadas</option>
              <option value="Liquidado">Liquidado</option>
            </select>
          </div>
        </div>

        <!-- CUADRO DE PREVISUALIZACIÓN DE LIQUIDACIÓN SEGÚN EL CONTRATO -->
        <div class="p-4 rounded-2xl bg-[#051512] border border-[#1a443a] mt-4 space-y-2">
          <span class="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
            Previsualización de Split Oficial (Cláusula 6)
          </span>
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-300">Comisión Total Bruta ({nuevoCierre.porcentajeComision}%):</span>
            <strong class="text-white font-mono">${nuevoPreviewSplits.comisionBrutaUSD.toLocaleString()} USD</strong>
          </div>
          <div class="flex items-center justify-between text-xs border-t border-[#12362e] pt-1.5">
            <span class="text-[#D4AF37] font-bold">Split Asesor (20%):</span>
            <strong class="text-[#D4AF37] font-mono text-sm">${nuevoPreviewSplits.asesorUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })} USD (Bs. {nuevoPreviewSplits.asesorBOB.toLocaleString(undefined, { maximumFractionDigits: 0 })})</strong>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-emerald-400">Inmobiliaria Casa Legal (10%):</span>
            <strong class="text-emerald-400 font-mono">${nuevoPreviewSplits.inmoUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })} USD</strong>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-blue-400">Gastos Administración (10%):</span>
            <strong class="text-blue-400 font-mono">${nuevoPreviewSplits.adminUSD.toLocaleString(undefined, { maximumFractionDigits: 1 })} USD</strong>
          </div>
        </div>

        <!-- Botones modal -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#153b32]">
          <button
            type="button"
            onclick={() => showModalNuevoCierre = false}
            class="px-5 py-2.5 rounded-xl bg-[#061411] text-slate-300 hover:text-white border border-[#173a32] text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Guardar y Liquidar
          </button>
        </div>

      </form>
    </div>
  </div>
{/if}
