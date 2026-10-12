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
		fotos: string[]; // la 1.ª va en el arco; la 2.ª y 3.ª salen como círculos
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

	const principal = $derived(data.fotos[0]);
	const minis = $derived(data.fotos.slice(1, 3));
	const sitio = $derived(data.sitio ?? 'casalegalbolivia.com');

	const palabras = $derived(data.tipo.trim().split(/\s+/));
	const linea1 = $derived(palabras.length > 1 ? palabras[0] : data.tipo);
	const linea2 = $derived(palabras.length > 1 ? palabras.slice(1).join(' ') : '');
	const size1 = $derived(Math.min(176, Math.floor(430 / (linea1.length * 0.5))));
	const size2 = $derived(Math.min(80, Math.floor(430 / (Math.max(linea2.length, 1) * 0.42))));

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
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500;1,600&family=Jost:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<article class="post" aria-label="Publicación de propiedad">
	<svg class="aros" viewBox="0 0 1080 1080" aria-hidden="true">
		<defs>
			<linearGradient id="pa-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1080" y2="1080">
				<stop offset="0" stop-color="#8c6a26" />
				<stop offset=".3" stop-color="#e6c36e" />
				<stop offset=".55" stop-color="#b98a30" />
				<stop offset=".8" stop-color="#f3d98c" />
				<stop offset="1" stop-color="#8c6a26" />
			</linearGradient>
		</defs>
		<circle cx="770" cy="470" r="470" fill="none" stroke="url(#pa-g)" stroke-width="1.2" opacity=".5" />
		<circle cx="770" cy="470" r="420" fill="none" stroke="url(#pa-g)" stroke-width=".8" opacity=".35" />
		<circle cx="770" cy="470" r="520" fill="none" stroke="url(#pa-g)" stroke-width=".8" opacity=".22" />
	</svg>

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

	<!-- Arco con la foto -->
	<div class="arco">
		<div class="foto">
			{#if principal}
				<img src={principal} alt={`Fotografía de ${data.tipo}`} />
			{:else}
				<div class="empty" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".35"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg>
				</div>
			{/if}
			<div class="shade"></div>
		</div>
	</div>

	{#each minis as m, k}
		<div class="mini" style:top="{560 + k * 132}px"><img src={m} alt="" /></div>
	{/each}

	{#if data.precio}<div class="precio">{data.precio}</div>{/if}

	<!-- Texto -->
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

	<section class="stats">
		{#each stats as s}
			<div class="cell">
				<svg viewBox="0 0 24 24" fill="none" stroke="#9a7424" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={s.i} /></svg>
				<b>{s.n}</b>
				<span>{s.l}</span>
			</div>
		{/each}
	</section>

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
		--gold-txt: #9a7424;
		--gt: #e3c06a;
		--ivory: #f7f3e8;
		--deep: #06231b;
		--serif: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
		--sans: 'Jost', 'Helvetica Neue', Arial, sans-serif;
		position: relative;
		width: 1080px;
		height: 1080px;
		overflow: hidden;
		isolation: isolate;
		color: var(--deep);
		font-family: var(--sans);
		background: radial-gradient(ellipse at 70% 40%, #fffdf7 0%, var(--ivory) 55%, #ece5d0 100%);
	}
	.post :global(*) { box-sizing: border-box; margin: 0; }
	.post > * { position: absolute; }
	.aros { inset: 0; width: 100%; height: 100%; pointer-events: none; }

	/* Encabezado */
	header { left: 70px; right: 60px; top: 48px; display: flex; align-items: center; justify-content: space-between; }
	.marca { display: flex; align-items: center; gap: 14px; }
	.marca img { width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 3px 6px rgba(80, 55, 10, 0.35)); }
	.brand { font: 700 30px var(--serif); letter-spacing: 0.22em; color: var(--deep); line-height: 1; }
	.sub { font: 500 11.5px var(--sans); letter-spacing: 0.6em; color: var(--gold-txt); margin-top: 7px; }
	.operacion {
		padding: 11px 28px; border-radius: 999px; background: var(--deep); color: var(--gt);
		font: 500 16px var(--sans); letter-spacing: 0.26em; text-transform: uppercase;
	}

	/* Arco */
	.arco { left: 520px; top: 130px; width: 500px; height: 690px; }
	.arco::after {
		content: ''; position: absolute; inset: -16px; border: 1.5px solid #b98a30;
		border-bottom: none; border-radius: 266px 266px 0 0; pointer-events: none;
	}
	.foto {
		width: 100%; height: 100%; overflow: hidden; border-radius: 250px 250px 0 0; background: #0a1f18;
		box-shadow: 0 30px 50px -24px rgba(6, 35, 27, 0.7);
	}
	.foto img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.empty { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(227, 192, 106, 0.35); background: linear-gradient(160deg, #0f4132, #04140e); }
	.empty svg { width: 300px; margin-top: 80px; }
	.shade { position: absolute; inset: 0; background: linear-gradient(transparent 62%, rgba(1, 9, 6, 0.5)); }

	.mini {
		left: 462px; width: 116px; height: 116px; border-radius: 50%; padding: 4px; background: var(--ivory);
		box-shadow: 0 0 0 2px #b98a30, 0 14px 24px -10px rgba(6, 35, 27, 0.6);
	}
	.mini img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }

	.precio {
		left: 676px; top: 772px; padding: 12px 34px; background: var(--deep); color: #f3d98c;
		font: 700 46px var(--serif); letter-spacing: 0.03em; border-radius: 4px 4px 4px 28px;
		box-shadow: 0 0 0 2px #b98a30 inset, 0 18px 30px -12px rgba(6, 35, 27, 0.7);
	}

	/* Texto */
	.titulo { left: 70px; top: 148px; width: 430px; }
	.kicker {
		display: flex; align-items: center; gap: 14px; font: 500 17px var(--sans); letter-spacing: 0.42em;
		text-transform: uppercase; color: var(--gold-txt); margin-bottom: 4px;
	}
	.kicker i { width: 52px; height: 1.5px; background: var(--gold); }
	h1 { display: flex; flex-direction: column; white-space: nowrap; }
	.l1 { font-family: var(--serif); font-weight: 700; line-height: 0.9; color: var(--deep); letter-spacing: -0.01em; }
	.l2 { font-family: var(--serif); font-style: italic; font-weight: 600; line-height: 1; color: var(--gold-txt); }
	.loc { display: flex; align-items: center; gap: 10px; margin-top: 18px; font: 500 20px var(--sans); letter-spacing: 0.03em; color: var(--deep); }
	.loc svg { width: 24px; height: 24px; color: var(--gold-txt); }

	/* Características */
	.stats {
		left: 70px; top: 520px; width: 380px; display: grid; grid-template-columns: 1fr 1fr;
		border-top: 1.5px solid #b98a30;
	}
	.cell { display: flex; flex-direction: column; padding: 18px 0 20px 6px; height: 146px; }
	.cell:nth-child(odd) { border-right: 1px solid rgba(185, 138, 48, 0.45); }
	.cell:nth-child(even) { padding-left: 28px; }
	.cell:nth-child(-n + 2) { border-bottom: 1px solid rgba(185, 138, 48, 0.45); }
	.cell svg { width: 30px; height: 30px; }
	.cell b { font: 700 68px var(--serif); line-height: 1; margin-top: 4px; color: var(--deep); }
	.cell span { font: 500 13px var(--sans); letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold-txt); margin-top: 4px; }

	/* Agente */
	footer {
		left: 0; right: 0; bottom: 0; height: 160px; padding: 0 60px 0 70px; display: flex; align-items: center; justify-content: space-between;
		background: radial-gradient(ellipse at 20% 0%, #0c3a2d 0%, #06231b 50%, #010906 100%); color: var(--ivory);
	}
	footer::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 4px; background: var(--gold); }
	.who { display: flex; align-items: center; gap: 22px; }
	.avatar { width: 96px; height: 96px; border-radius: 50%; padding: 4px; background: var(--gold); flex: none; }
	.avatar img, .avatar span { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: grid; place-items: center; background: #0a2a20; }
	.avatar span { font: 700 34px var(--serif); color: var(--gt); }
	.nombre { font: 700 38px var(--serif); line-height: 1.05; white-space: nowrap; }
	.nombre a { color: inherit; text-decoration: none; }
	.cargo { font: 500 14px var(--sans); letter-spacing: 0.32em; text-transform: uppercase; color: var(--gt); margin-top: 8px; }
	.contacto { text-align: right; }
	.tel { font: 500 32px var(--sans); letter-spacing: 0.05em; }
	.web { font: 500 16px var(--sans); letter-spacing: 0.18em; color: var(--gt); margin-top: 6px; }
</style>
