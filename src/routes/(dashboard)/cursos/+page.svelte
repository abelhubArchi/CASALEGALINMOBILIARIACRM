<script>
  import { GraduationCap, PlayCircle, BookOpen, Clock, ArrowLeft, Star, Heart, Share2, Rocket } from 'lucide-svelte';

  // Estados de vista
  let viewMode = $state('list'); // 'list' o 'reading'
  let currentArticle = $state(null);

  // Lista de Cursos y Blogs (Mockup)
  const courses = [
    {
      id: 'guia-definitiva',
      type: 'blog',
      title: '🚀 La Guía Definitiva: Cómo dominar Casa Legal y multiplicar tus cierres',
      excerpt: 'Descubre para qué sirve cada módulo de nuestra plataforma de una forma divertida. ¡Conviértete en un Asesor de Élite hoy mismo!',
      author: 'Administración',
      date: 'Actualizado hoy',
      duration: '5 min',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
      category: 'Tutorial'
    },
    {
      id: 'marketing-inmobiliario-1',
      type: 'course',
      title: 'Fotografía Inmobiliaria con tu Celular',
      excerpt: 'Aprende los ángulos, la luz y los secretos para que tus propiedades luzcan de revista usando solo tu smartphone.',
      author: 'Casa Legal Marketing',
      date: 'Hace 1 semana',
      duration: '45 min (Video)',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      category: 'Marketing'
    },
    {
      id: 'cierre-ventas',
      type: 'course',
      title: 'Técnicas de Cierre Efectivo en 2024',
      excerpt: 'Neuromarketing aplicado a bienes raíces. Cómo manejar objeciones y cerrar tratos más rápido.',
      author: 'Coach Inmobiliario',
      date: 'Hace 2 semanas',
      duration: '1h 20 min',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=800&q=80',
      category: 'Ventas'
    }
  ];

  const openArticle = (article) => {
    currentArticle = article;
    viewMode = 'reading';
    // Desplazar arriba
    setTimeout(() => {
      document.querySelector('.overflow-y-auto')?.scrollTo(0,0);
    }, 50);
  };

  const closeArticle = () => {
    viewMode = 'list';
    currentArticle = null;
  };

</script>

<div class="p-4 md:p-8 font-sans h-full bg-[#f4f7f6] flex flex-col overflow-y-auto relative scroll-smooth">
  
  {#if viewMode === 'list'}
    <div class="animate-in fade-in duration-500">
      <header class="mb-10 max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div class="flex items-center gap-4">
          <div class="p-4 bg-[#0c3641] text-white rounded-2xl shadow-lg border border-[#0c3641]">
            <GraduationCap size={36} strokeWidth={1.5} />
          </div>
          <div>
            <h1 class="text-3xl md:text-4xl font-extrabold text-[#0c3641] tracking-tight">Cursos Casa Legal</h1>
            <p class="text-gray-500 text-sm md:text-base mt-1">Tu academia inmobiliaria. Blogs, tutoriales y cursos de marketing.</p>
          </div>
        </div>
      </header>

      <div class="max-w-6xl mx-auto w-full">
        <!-- Featured Article -->
        <div class="mb-10">
          <h2 class="text-xl font-bold text-[#0c3641] mb-4 flex items-center gap-2"><Star class="text-casa-gold" size={20}/> Recomendado para ti</h2>
          
          <div onclick={() => openArticle(courses[0])} class="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-gray-100 group cursor-pointer flex flex-col md:flex-row hover:shadow-2xl transition-all">
            <div class="md:w-1/2 h-64 md:h-auto relative overflow-hidden">
              <img src={courses[0].image} alt="Portada" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 md:from-black/40 to-transparent"></div>
              <span class="absolute top-4 left-4 bg-casa-teal text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">{courses[0].category}</span>
            </div>
            <div class="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-[#0c3641] text-white">
              <h3 class="text-3xl font-black mb-4 leading-tight group-hover:text-casa-gold transition-colors">{courses[0].title}</h3>
              <p class="text-gray-300 text-sm mb-6 leading-relaxed">{courses[0].excerpt}</p>
              <div class="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span class="flex items-center gap-1"><BookOpen size={14}/> {courses[0].author}</span>
                <span class="w-1 h-1 bg-gray-500 rounded-full"></span>
                <span class="flex items-center gap-1"><Clock size={14}/> {courses[0].duration}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Course Grid -->
        <h2 class="text-xl font-bold text-[#0c3641] mb-4">Más Cursos y Artículos</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each courses.slice(1) as course}
            <div onclick={() => openArticle(course)} class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-lg transition-all flex flex-col">
              <div class="h-48 relative overflow-hidden">
                <img src={course.image} alt={course.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                {#if course.type === 'course'}
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={48} class="text-white drop-shadow-lg"/>
                  </div>
                {/if}
                <span class="absolute top-3 left-3 bg-white/90 text-[#0c3641] text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md backdrop-blur-sm shadow-sm">{course.category}</span>
              </div>
              <div class="p-6 flex-1 flex flex-col">
                <h3 class="font-bold text-[#0c3641] text-lg mb-2 line-clamp-2 leading-tight group-hover:text-casa-teal transition-colors">{course.title}</h3>
                <p class="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">{course.excerpt}</p>
                <div class="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-4 border-t border-gray-100">
                  <span class="flex items-center gap-1"><Clock size={12}/> {course.duration}</span>
                  <span>{course.type === 'course' ? '▶ Ver Video' : 'Leer Blog'}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

  {:else if viewMode === 'reading'}
    <!-- Vista de Lectura del Blog/Curso -->
    <div class="max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-500 pb-20">
      
      <button onclick={closeArticle} class="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#0c3641] transition-colors uppercase tracking-widest">
        <ArrowLeft size={16}/> Volver a Cursos
      </button>

      <div class="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
        
        <!-- Hero Header -->
        <div class="h-64 md:h-96 relative">
          <img src={currentArticle.image} alt={currentArticle.title} class="w-full h-full object-cover"/>
          <div class="absolute inset-0 bg-gradient-to-t from-[#0c3641] via-[#0c3641]/50 to-transparent"></div>
          <div class="absolute bottom-0 left-0 p-8 md:p-12 text-white w-full">
            <span class="inline-block bg-casa-gold text-[#0c3641] text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-4 shadow-lg">{currentArticle.category}</span>
            <h1 class="text-3xl md:text-5xl font-black leading-tight mb-4 drop-shadow-md">{currentArticle.title}</h1>
            <div class="flex items-center gap-6 text-xs md:text-sm font-bold text-gray-300 uppercase tracking-widest">
              <span class="flex items-center gap-2"><BookOpen size={16} class="text-casa-teal"/> Por {currentArticle.author}</span>
              <span class="flex items-center gap-2"><Clock size={16} class="text-casa-teal"/> {currentArticle.duration} de lectura</span>
            </div>
          </div>
        </div>

        <!-- Contenido del Blog -->
        <div class="p-8 md:p-12 lg:px-20">
          
          {#if currentArticle.id === 'guia-definitiva'}
            <div class="prose prose-lg prose-casa max-w-none text-gray-700 font-medium">
              <p class="text-xl leading-relaxed text-[#0c3641] font-bold mb-8 italic">
                ¡Hola, futuro súper-agente! 👋 Sabemos que al entrar a un CRM nuevo uno siente que está manejando una nave espacial. Pero tranquilo, Casa Legal CRM está diseñado para que seas 3 veces más rápido. Vamos a dar un paseo rápido por tus nuevas herramientas.
              </p>

              <h2 class="text-2xl font-black text-[#0c3641] mt-10 mb-4 flex items-center gap-2">
                <span class="p-2 bg-casa-teal/10 rounded-lg text-casa-teal"><Rocket size={24}/></span> 
                1. Casa de Mando (Tu Cuartel General)
              </h2>
              <p>Es la primera pantalla que ves. Aquí tienes un resumen en vivo de todo: <strong>Tus inmuebles activos, leads (clientes potenciales), comunicados urgentes y el ranking</strong>. Si no sabes por dónde empezar el día, mira tu Casa de Mando.</p>
              
              <div class="bg-gray-50 border-l-4 border-casa-gold p-4 my-6 rounded-r-xl">
                <p class="text-sm font-bold m-0 text-[#0c3641]">💡 Súper Tip:</p>
                <p class="text-sm m-0">Ahí encontrarás el <strong>Link de tu Landing Page</strong>. Cópialo y pégalo en tu biografía de Instagram o envíalo por WhatsApp. ¡Es tu tarjeta de presentación digital!</p>
              </div>

              <h2 class="text-2xl font-black text-[#0c3641] mt-10 mb-4">🏠 2. Inventario Casa & Mis Casas</h2>
              <p><strong>Mis Casas</strong> es donde subes las propiedades que tú captaste. Asegúrate de llenar bien todos los datos y subir fotos bonitas (¡la primera impresión vende!).</p>
              <p><strong>Inventario Casa</strong> es la magia de la red: Aquí están TODAS las propiedades de la franquicia. Puedes usar el buscador inteligente para encontrar exactamente lo que tu cliente quiere, y compartirlo con un clic.</p>

              <h2 class="text-2xl font-black text-[#0c3641] mt-10 mb-4 flex items-center gap-2">
                <span class="p-2 bg-red-100 rounded-lg text-red-500"><Radio size={24}/></span> 
                3. Red Casa Legal (¡Tu Agencia de Marketing Gratis!)
              </h2>
              <p>Este es nuestro módulo estrella. ¿Tienes una propiedad buenísima y quieres que le hagamos publicidad pesada? Entra a <strong>Red Casa Legal</strong>, usa la Inteligencia Artificial para generar una descripción atractiva, elige dónde quieres que la publiquemos (Facebook, Instagram) y envíala. <strong>¡Nuestra administración se encargará de hacer la magia!</strong></p>

              <h2 class="text-2xl font-black text-[#0c3641] mt-10 mb-4">🛡️ 4. Mi Equipo & Casa Legal Score</h2>
              <p>No tienes por qué vender solo. Si eres un líder natural, funda tu propio equipo en la <strong>Red de Equipos</strong>, ponle un logo y recluta agentes. Compartirán exclusivas y ganarán comisiones grupales.</p>
              <p>Además, cada venta que cierres suma a tu <strong>Casa Legal Score</strong>. Subirás de rango (de Junior hasta Master) ganando acceso a mejores leads, mayor % de comisión y premios increíbles. ¡Mira el leaderboard y supérate!</p>

              <hr class="my-12 border-gray-200">

              <h3 class="text-xl font-bold text-center text-[#0c3641]">¿Listo para cerrar tu primera gran venta con nosotros?</h3>
              <p class="text-center text-gray-500 mt-2">Navega por el menú de la izquierda y empieza a explorar. ¡El éxito te espera!</p>
              
            </div>
          {:else}
            <!-- Fallback for other courses -->
            <div class="text-center py-20">
              <PlayCircle size={64} class="mx-auto text-casa-teal mb-6 opacity-50"/>
              <h2 class="text-2xl font-bold text-[#0c3641]">Contenido Premium</h2>
              <p class="text-gray-500 mt-2">Este curso en video estará disponible próximamente en la plataforma.</p>
            </div>
          {/if}

        </div>

        <!-- Footer del Artículo -->
        <div class="bg-gray-50 p-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-casa-dark rounded-full flex items-center justify-center text-casa-gold font-bold text-xl">
              C
            </div>
            <div>
              <p class="font-bold text-[#0c3641] text-sm">{currentArticle.author}</p>
              <p class="text-xs text-gray-500 uppercase tracking-widest">{currentArticle.date}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <button class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors shadow-sm" title="Me gusta">
              <Heart size={18}/>
            </button>
            <button class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-casa-teal hover:border-casa-teal transition-colors shadow-sm" title="Compartir">
              <Share2 size={18}/>
            </button>
            <button onclick={closeArticle} class="px-6 py-2.5 bg-[#0c3641] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-lg">
              Completar Lectura
            </button>
          </div>
        </div>

      </div>
    </div>
  {/if}

</div>

<style>
  /* Personalización del Prose (Tipografía del artículo) */
  .prose-casa p {
    margin-bottom: 1.5em;
  }
  .prose-casa strong {
    color: #0c3641;
  }
</style>
