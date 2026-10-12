<script lang="ts">
	// Componente autónomo: no depende de otros archivos (solo del logo en /static).
	interface Agente {
		nombre: string;
		cargo: string;
		foto?: string;
		telefono?: string;
		url?: string;
	}
	interface PostData {
		tipo: string; // "Casa independiente"
		condicion?: string; // "A estrenar"
		operacion?: string; // "En venta"
		fotos: string[]; // la 1.ª es el fondo; la 2.ª y 3.ª salen como miniaturas
		precio?: string;
		ubicacion?: string;
		dormitorios: number;
		banos: number;
		metros: number;
		parqueos: number;
		agente: Agente;
		sitio?: string;
	}

	let { data, logo = '/logoinmo.png' }: { data: PostData; logo?: string } = $props();

	const fondo = $derived(data.fotos[0]);
	const minis = $derived(data.fotos.slice(1, 3));
	const sitio = $derived(data.sitio ?? 'casalegalbolivia.com');

	// "Casa independiente" → "Casa" (grande) + "independiente" (cursiva dorada)
	const palabras = $derived(data.tipo.trim().split(/\s+/));
	const linea1 = $derived(palabras.length > 1 ? palabras[0] : data.tipo);
	const linea2 = $derived(palabras.length > 1 ? palabras.slice(1).join(' ') : '');
	const size1 = $derived(Math.min(128, Math.floor(600 / (linea1.length * 0.55))));
	const size2 = $derived(Math.min(88, Math.floor(600 / (Math.max(linea2.length, 1) * 0.47))));

	const iniciales = $derived(
		data.agente.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
	);

	const ICONOS = {
		cama: 'M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-8v6M5 11.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0',
		bano: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6.5a2 2 0 0 1 3.6-1.2M7 19l-1 2M17 19l1 2',
		area: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
		auto: 'M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M3.5 16h17v3.5h-2.7V18H6.2v1.5H3.5zM7 13.2h.01M17 13.2h.01'
	};
	const stats = $derived([
		{ i: ICONOS.cama, n: data.dormitorios, l: data.dormitorios === 1 ? 'Dormitorio' : 'Dormitorios' },
		{ i: ICONOS.bano, n: data.banos, l: data.banos === 1 ? 'Baño' : 'Baños' },
		{ i: ICONOS.area, n: data.metros, l: 'Metros M²' },
		{ i: ICONOS.auto, n: data.parqueos, l: data.parqueos === 1 ? 'Parqueo' : 'Parqueos' }
	]);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500;1,600&family=Manrope:wght@500;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<article class="post" aria-label="Publicación de propiedad">
	<svg width="0" height="0" style="position:absolute" aria-hidden="true">
		<defs>
			<linearGradient id="pe-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1080" y2="0">
				<stop offset="0" stop-color="#8c6a26" />
				<stop offset=".3" stop-color="#f3d98c" />
				<stop offset=".6" stop-color="#c79a3c" />
				<stop offset=".85" stop-color="#fff0b8" />
				<stop offset="1" stop-color="#a27b2c" />
			</linearGradient>
		</defs>
	</svg>

	<!-- Zona verde inferior -->
	<div class="base"></div>

	<!-- Foto con corte diagonal -->
	<div class="photo">
		{#if fondo}
			<img src={fondo} alt={`Fotografía de ${data.tipo}`} />
		{:else}
			<div class="empty" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".35"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg>
			</div>
		{/if}
		<div class="tint"></div>
	</div>

	<!-- Líneas doradas del corte -->
	<svg class="cut" viewBox="0 0 1080 1080" aria-hidden="true">
		<line x1="0" y1="660" x2="1080" y2="520" stroke="url(#pe-g)" stroke-width="4" />
		<line x1="0" y1="676" x2="1080" y2="536" stroke="url(#pe-g)" stroke-width="1.2" opacity=".6" />
	</svg>

	<div class="vertical">CASA LEGAL INMOBILIARIA · BOLIVIA</div>

	<header>
		<div class="marca">
			<img src={logo} alt="Casa Legal Inmobiliaria" />
			<div>
				<div class="brand">CASA LEGAL</div>
				<div class="sub">INMOBILIARIA</div>
			</div>
		</div>
		{#if data.operacion}<div class="operacion">{data.operacion}</div>{/if}
	</header>

	{#if minis.length}
		<div class="minis">
			{#each minis as m}<div class="mini"><img src={m} alt="" /></div>{/each}
		</div>
	{/if}

	{#if data.precio}<div class="precio">{data.precio}</div>{/if}

	<!-- Título -->
	<section class="titulo">
		{#if data.condicion}<div class="kicker"><i></i>{data.condicion}</div>{/if}
		<h1>
			<span class="l1" style:font-size="{size1}px">{linea1}</span>
			{#if linea2}<span class="l2" style:font-size="{size2}px">{linea2}</span>{/if}
		</h1>
		{#if data.ubicacion}
			<div class="loc">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.4" /></svg>
				{data.ubicacion}
			</div>
		{/if}
	</section>

	<!-- Ficha de características -->
	<section class="ficha">
		{#each stats as s}
			<div class="fila">
				<svg viewBox="0 0 24 24" fill="none" stroke="#e3c06a" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={s.i} /></svg>
				<b>{s.n}</b>
				<span>{s.l}</span>
			</div>
		{/each}
	</section>

	<!-- Banda dorada del agente -->
	<footer>
		<div class="who">
			<div class="avatar">
				{#if data.agente.foto}<img src={data.agente.foto} alt={data.agente.nombre} />{:else}<span>{iniciales}</span>{/if}
			</div>
			<div>
				<div class="nombre">
					{#if data.agente.url}<a href={data.agente.url}>{data.agente.nombre}</a>{:else}{data.agente.nombre}{/if}
				</div>
				<div class="cargo">{data.agente.cargo}</div>
			</div>
		</div>
		<div class="contacto">
			{#if data.agente.telefono}<div class="tel">{data.agente.telefono}</div>{/if}
			<div class="web">{sitio}</div>
		</div>
	</footer>
</article>

<style>
	.post {
		--gold: linear-gradient(100deg, #7d5d20 0%, #d9b25a 26%, #fff1bd 48%, #c79a3c 70%, #8c6a26 100%);
		--gt: #e3c06a;
		--ivory: #f6f1e3;
		--deep: #06231b;
		--serif: 'Playfair Display', Georgia, 'Times New Roman', serif;
		--sans: 'Manrope', 'Helvetica Neue', Arial, sans-serif;
		position: relative;
		width: 1080px;
		height: 1080px;
		overflow: hidden;
		isolation: isolate;
		color: var(--ivory);
		font-family: var(--sans);
		background: #020d09;
	}
	.post :global(*) { box-sizing: border-box; margin: 0; }
	.post > * { position: absolute; }

	.base {
		inset: 0;
		background:
			repeating-linear-gradient(135deg, transparent 0 34px, rgba(227, 192, 106, 0.045) 34px 35px),
			radial-gradient(ellipse at 80% 85%, #0d4030 0%, #072219 45%, #020d09 100%);
	}
	.photo {
		inset: 0 0 auto 0; height: 700px; overflow: hidden;
		clip-path: polygon(0 0, 100% 0, 100% 520px, 0 660px);
		background: #0a1f18;
	}
	.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.empty { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(227, 192, 106, 0.3); background: linear-gradient(135deg, #0f4132, #04140e); }
	.empty svg { width: 420px; }
	.tint {
		position: absolute; inset: 0;
		background:
			linear-gradient(180deg, rgba(1, 9, 6, 0.62) 0%, rgba(1, 9, 6, 0) 30%, rgba(1, 9, 6, 0) 58%, rgba(1, 9, 6, 0.7) 100%),
			rgba(7, 34, 25, 0.22);
	}
	.cut { inset: 0; width: 100%; height: 100%; pointer-events: none; }

	.vertical {
		left: 34px; top: 120px; writing-mode: vertical-rl; transform: rotate(180deg);
		font: 700 13px var(--sans); letter-spacing: 0.5em; color: var(--gt); opacity: 0.9;
	}

	/* Encabezado */
	header { left: 84px; right: 60px; top: 52px; display: flex; align-items: center; justify-content: space-between; }
	.marca { display: flex; align-items: center; gap: 16px; }
	.marca img { width: 68px; height: 68px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)); }
	.brand {
		font: 800 26px var(--sans); letter-spacing: 0.3em;
		background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent;
	}
	.sub { font: 700 12px var(--sans); letter-spacing: 0.62em; color: var(--ivory); margin-top: 6px; }
	.operacion {
		padding: 13px 30px; border-radius: 999px; background: var(--gold); color: var(--deep);
		font: 800 17px var(--sans); letter-spacing: 0.2em; text-transform: uppercase;
		box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.7);
	}

	.minis { right: 60px; top: 372px; display: flex; gap: 14px; }
	.mini { width: 130px; height: 130px; border-radius: 22px; padding: 3px; background: var(--gold); box-shadow: 0 14px 26px -10px #000; }
	.mini img { width: 100%; height: 100%; object-fit: cover; border-radius: 19px; display: block; }

	.precio {
		left: 84px; top: 540px; padding: 10px 28px; border-radius: 14px; background: var(--gold); color: var(--deep);
		font: 700 38px var(--serif); letter-spacing: 0.02em; box-shadow: 0 12px 26px -10px #000;
	}

	/* Título */
	.titulo { left: 84px; top: 690px; width: 600px; }
	.kicker {
		display: flex; align-items: center; gap: 14px; font: 800 20px var(--sans); letter-spacing: 0.42em;
		text-transform: uppercase; color: var(--gt); margin-bottom: 8px;
	}
	.kicker i { width: 56px; height: 2px; background: var(--gold); }
	h1 { display: flex; flex-direction: column; white-space: nowrap; }
	.l1 { font-family: var(--serif); font-weight: 700; line-height: 0.95; color: var(--ivory); letter-spacing: -0.01em; }
	.l2 {
		font-family: var(--serif); font-style: italic; font-weight: 600; line-height: 1.05;
		background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent;
		padding-right: 8px;
	}
	.loc { display: flex; align-items: center; gap: 10px; margin-top: 14px; font: 600 21px var(--sans); letter-spacing: 0.03em; color: var(--ivory); }
	.loc svg { width: 24px; height: 24px; color: var(--gt); }

	/* Ficha */
	.ficha {
		left: 708px; top: 604px; width: 312px; height: 336px; padding: 8px 26px; display: grid; grid-template-rows: repeat(4, 1fr);
		background: rgba(1, 9, 6, 0.55); backdrop-filter: blur(8px); border-radius: 26px;
		border: 1px solid rgba(227, 192, 106, 0.55); box-shadow: 0 24px 44px -20px #000;
	}
	.fila { display: flex; align-items: center; gap: 14px; }
	.fila + .fila { border-top: 1px solid rgba(227, 192, 106, 0.28); }
	.fila svg { width: 38px; height: 38px; flex: none; }
	.fila b { font: 700 52px var(--serif); line-height: 1; background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent; }
	.fila span { margin-left: auto; font: 700 12.5px var(--sans); letter-spacing: 0.14em; text-transform: uppercase; color: var(--ivory); text-align: right; }

	/* Agente */
	footer {
		left: 0; right: 0; bottom: 0; height: 118px; padding: 20px 60px 0 84px;
		display: flex; align-items: center; justify-content: space-between;
		background: var(--gold); color: var(--deep);
		clip-path: polygon(0 18px, 100% 0, 100% 100%, 0 100%);
	}
	.who { display: flex; align-items: center; gap: 20px; }
	.avatar { width: 76px; height: 76px; border-radius: 50%; padding: 4px; background: var(--deep); flex: none; }
	.avatar img, .avatar span { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: grid; place-items: center; background: #0a2a20; }
	.avatar span { font: 700 26px var(--serif); color: var(--gt); }
	.nombre { font: 700 30px var(--serif); line-height: 1.1; white-space: nowrap; }
	.nombre a { color: inherit; text-decoration: none; }
	.cargo { font: 800 13px var(--sans); letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.8; margin-top: 6px; }
	.contacto { text-align: right; }
	.tel { font: 800 30px var(--sans); letter-spacing: 0.04em; }
	.web { font: 700 15px var(--sans); letter-spacing: 0.16em; opacity: 0.8; margin-top: 4px; }
</style>
