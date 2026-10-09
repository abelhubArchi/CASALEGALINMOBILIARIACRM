<script>
  import { auth } from '#lib/firebase';
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { goto } from '$app/navigation';
  import { Lock, Mail, ShieldCheck, Loader2 } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMsg = $state('');

  const handleLogin = async (e) => {
    e.preventDefault();
    loading = true;
    errorMsg = '';
    try {
      await signInWithEmailAndPassword(auth, email, password);
      goto('/'); // Redirige al dashboard
    } catch (error) {
      console.error(error);
      errorMsg = "Credenciales inválidas. Verifica tu correo y contraseña (recuerda que por defecto es tu CI).";
    } finally {
      loading = false;
    }
  };
</script>

<div class="min-h-screen flex items-center justify-center bg-[#0d3641] bg-gradient-to-br from-[#0d3641] to-casa-teal relative overflow-hidden font-sans p-4">
  
  <!-- Elementos decorativos -->
  <div class="absolute -top-32 -right-32 w-96 h-96 bg-casa-gold/20 rounded-full blur-3xl"></div>
  <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-casa-teal/40 rounded-full blur-3xl"></div>

  <div class="bg-white p-10 md:p-12 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div class="text-center mb-8">
      <div class="w-20 h-20 bg-casa-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-casa-teal/20">
        <ShieldCheck size={40} class="text-casa-teal" />
      </div>
      <h1 class="text-3xl font-extrabold text-casa-dark tracking-tight">Acceso Casa Legal</h1>
      <p class="text-gray-500 mt-2 text-sm">CRM y Plataforma Inmobiliaria</p>
    </div>

    {#if errorMsg}
      <div class="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium mb-6 text-center animate-in shake duration-300 border border-red-100">
        {errorMsg}
      </div>
    {/if}

    <form onsubmit={handleLogin} class="space-y-6">
      <div class="space-y-2">
        <label class="text-xs font-bold text-casa-dark uppercase tracking-widest">Correo Electrónico</label>
        <div class="relative">
          <Mail size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="email" bind:value={email} required placeholder="tu@correo.com" class="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none transition-all font-medium" />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-xs font-bold text-casa-dark uppercase tracking-widest">Contraseña (CI)</label>
        <div class="relative">
          <Lock size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="password" bind:value={password} required placeholder="••••••••" class="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-casa-teal outline-none transition-all font-medium tracking-widest" />
        </div>
      </div>

      <button type="submit" disabled={loading} class="w-full py-4 bg-casa-teal text-white rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-[#0d3641] transition-colors shadow-lg shadow-casa-teal/30 mt-4 disabled:opacity-70">
        {#if loading}
          <Loader2 size={18} class="animate-spin" /> Ingresando...
        {:else}
          Ingresar al CRM
        {/if}
      </button>
    </form>
    
    <p class="text-center text-xs text-gray-400 mt-8">© 2026 Casa Legal Bolivia. Todos los derechos reservados.</p>
  </div>
</div>
