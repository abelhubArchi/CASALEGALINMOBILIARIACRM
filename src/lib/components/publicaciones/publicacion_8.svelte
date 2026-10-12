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
		condicion?: string; // "A estrenar" (etiqueta sobre la foto)
		operacion?: string; // "En venta" (dentro de la estrella de precio)
		fotos: string[]; // la 1.ª es la principal; la 2.ª y 3.ª salen como stickers
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
	const linea1 = $derived((palabras.length > 1 ? palabras[0] : data.tipo).toUpperCase());
	const linea2 = $derived((palabras.length > 1 ? palabras.slice(1).join(' ') : '').toUpperCase());
	const size1 = $derived(Math.min(112, Math.floor(620 / (linea1.length * 0.47))));
	const size2 = $derived(Math.min(70, Math.floor(620 / (Math.max(linea2.length, 1) * 0.47))));

	const precioSize = $derived(
		data.precio ? Math.min(54, Math.floor(150 / (data.precio.length * 0.46))) : 0
	);
	const hayEstrella = $derived(Boolean(data.precio || data.operacion));

	const iniciales = $derived(
		data.agente.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
	);

	// Estrella de 18 puntas para el sello de precio
	const estrella = (() => {
		const n = 18;
		const pts: string[] = [];
		for (let i = 0; i < n * 2; i++) {
			const r = i % 2 === 0 ? 50 : 43;
			const a = (Math.PI * i) / n - Math.PI / 2;
			pts.push(`${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`);
		}
		return `polygon(${pts.join(',')})`;
	})();

	const ICONOS = {
		cama: 'M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-8v6M5 11.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0',
		bano: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6.5a2 2 0 0 1 3.6-1.2M7 19l-1 2M17 19l1 2',
		area: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
		auto: 'M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M3.5 16h17v3.5h-2.7V18H6.2v1.5H3.5zM7 13.2h.01M17 13.2h.01'
	};
	const stats = $derived([
		{ i: ICONOS.cama, n: data.dormitorios, l: data.dormitorios === 1 ? 'Dormitorio' : 'Dormitorios', t: 'ivory' },
		{ i: ICONOS.bano, n: data.banos, l: data.banos === 1 ? 'Baño' : 'Baños', t: 'green' },
		{ i: ICONOS.area, n: data.metros, l: 'Metros M²', t: 'black' },
		{ i: ICONOS.auto, n: data.parqueos, l: data.parqueos === 1 ? 'Parqueo' : 'Parqueos', t: 'ivory' }
	]);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:wght@500;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<article class="post" aria-label="Publicación de propiedad">
	<div class="puntos"></div>

	<header>
		<div class="logo"><img src={logo} alt="Casa Legal Inmobiliaria" /></div>
		<div class="brand">CASA LEGAL <span>INMOBILIARIA</span></div>
		<div class="web">{sitio}</div>
	</header>

	<!-- Foto -->
	<div class="foto">
		{#if principal}
			<img src={principal} alt={`Fotografía de ${data.tipo}`} />
		{:else}
			<div class="empty" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".35"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg>
			</div>
		{/if}
		{#if data.condicion}<div class="etiqueta">{data.condicion}</div>{/if}
		{#if data.ubicacion}
			<div class="loc">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.4" /></svg>
				<span>{data.ubicacion}</span>
			</div>
		{/if}
	</div>

	{#each minis as m, k}
		<div class="sticker" style:right="{70 + k * 150}px" style:top="{172 + k * 14}px" style:transform="rotate({k === 0 ? 6 : -5}deg)">
			<img src={m} alt="" />
		</div>
	{/each}

	<!-- Título -->
	<section class="titulo">
		<span class="l1" style:font-size="{size1}px">{linea1}</span>
		{#if linea2}<span class="l2" style:font-size="{size2}px">{linea2}</span>{/if}
	</section>

	<!-- Sello de precio -->
	{#if hayEstrella}
		<div class="burst" style:clip-path={estrella}>
			<div class="burst-in" style:clip-path={estrella}>
				{#if data.operacion}<small>{data.operacion}</small>{/if}
				{#if data.precio}<b style:font-size="{precioSize}px">{data.precio}</b>{/if}
			</div>
		</div>
	{/if}

	<!-- Cifras -->
	<section class="stats">
		{#each stats as s}
			<div class="stat {s.t}">
				<div class="top">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={s.i} /></svg>
					<span>{s.l}</span>
				</div>
				<b>{s.n}</b>
			</div>
		{/each}
	</section>

	<!-- Agente -->
	<footer>
		<div class="avatar">
			{#if data.agente.foto}<img src={data.agente.foto} alt={data.agente.nombre} />{:else}<span>{iniciales}</span>{/if}
		</div>
		<div class="datos">
			<div class="nombre">
				{#if data.agente.url}<a href={data.agente.url}>{data.agente.nombre}</a>{:else}{data.agente.nombre}{/if}
			</div>
			<div class="cargo">{data.agente.cargo}</div>
		</div>
		{#if data.agente.telefono}<div class="tel">{data.agente.telefono}</div>{/if}
	</footer>
</article>

<style>
	.post {
		--ink: #030a07;
		--deep: #06231b;
		--gt: #e8c872;
		--ivory: #f6f1e3;
		--gold-bg: linear-gradient(135deg, #f0d58a 0%, #dcb450 48%, #c99a37 100%);
		--sombra: 8px 8px 0 var(--deep);
		--display: 'Anton', 'Impact', 'Arial Narrow', sans-serif;
		--sans: 'Work Sans', 'Helvetica Neue', Arial, sans-serif;
		position: relative;
		width: 1080px;
		height: 1080px;
		overflow: hidden;
		isolation: isolate;
		color: var(--ink);
		font-family: var(--sans);
		background: var(--gold-bg);
	}
	.post :global(*) { box-sizing: border-box; margin: 0; }
	.post > * { position: absolute; }
	.puntos {
		inset: 0; background-image: radial-gradient(rgba(6, 35, 27, 0.2) 1.8px, transparent 2.4px); background-size: 20px 20px;
		-webkit-mask: linear-gradient(160deg, #000, transparent 65%); mask: linear-gradient(160deg, #000, transparent 65%);
	}

	/* Encabezado */
	header {
		left: 40px; width: 1000px; top: 38px; height: 82px; display: flex; align-items: center; gap: 18px; padding: 0 28px 0 12px;
		background: var(--ink); border: 5px solid var(--ink); box-shadow: var(--sombra);
	}
	.logo { width: 62px; height: 62px; border-radius: 50%; background: var(--ivory); display: grid; place-items: center; flex: none; }
	.logo img { width: 42px; height: 42px; object-fit: contain; }
	.brand { font: 400 40px var(--display); letter-spacing: 0.06em; color: var(--gt); white-space: nowrap; }
	.brand span { color: var(--ivory); font-size: 28px; letter-spacing: 0.18em; margin-left: 6px; }
	.web { margin-left: auto; font: 700 15px var(--sans); letter-spacing: 0.14em; color: var(--gt); }

	/* Foto */
	.foto { left: 40px; width: 1000px; top: 148px; height: 392px; border: 6px solid var(--ink); box-shadow: var(--sombra); overflow: hidden; background: #0a1f18; }
	.foto > img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.empty { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(232, 200, 114, 0.35); background: linear-gradient(160deg, #0f4132, #04140e); }
	.empty svg { width: 300px; }
	.etiqueta {
		position: absolute; left: 26px; top: 26px; padding: 8px 22px 6px; background: var(--ivory); border: 5px solid var(--ink);
		font: 400 38px var(--display); letter-spacing: 0.08em; text-transform: uppercase; transform: rotate(-4deg); box-shadow: 5px 5px 0 var(--ink);
	}
	.loc {
		position: absolute; left: 0; bottom: 0; max-width: 560px; display: flex; align-items: center; gap: 10px; padding: 12px 24px 12px 22px;
		background: var(--ink); color: var(--gt); font: 700 20px var(--sans); letter-spacing: 0.05em;
	}
	.loc svg { width: 24px; height: 24px; flex: none; }
	.loc span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.sticker { width: 132px; height: 132px; padding: 6px; background: var(--ivory); border: 4px solid var(--ink); box-shadow: 5px 5px 0 var(--ink); }
	.sticker img { width: 100%; height: 100%; object-fit: cover; display: block; }

	/* Título */
	.titulo {
		left: 40px; top: 568px; width: 700px; height: 204px; padding: 16px 28px; display: flex; flex-direction: column; justify-content: center;
		background: var(--ivory); border: 6px solid var(--ink); box-shadow: var(--sombra); white-space: nowrap;
	}
	.l1 { font-family: var(--display); line-height: 0.95; letter-spacing: 0.01em; color: var(--ink); }
	.l2 { font-family: var(--display); line-height: 1.05; letter-spacing: 0.02em; color: #0d5a43; }

	/* Estrella */
	.burst { left: 770px; top: 548px; width: 250px; height: 250px; background: var(--ink); transform: rotate(8deg); }
	.burst-in {
		position: absolute; inset: 9px; background: var(--deep); color: var(--gt); display: flex; flex-direction: column; align-items: center; justify-content: center;
		text-align: center; padding: 0 30px; line-height: 1;
	}
	.burst-in small { font: 800 16px var(--sans); letter-spacing: 0.24em; text-transform: uppercase; color: var(--ivory); margin-bottom: 8px; padding-left: 0.24em; }
	.burst-in b { font-family: var(--display); font-weight: 400; letter-spacing: 0.01em; white-space: nowrap; }

	/* Cifras */
	.stats { left: 40px; width: 1000px; top: 800px; height: 118px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
	.stat { padding: 12px 16px 8px; border: 5px solid var(--ink); box-shadow: 6px 6px 0 var(--deep); display: flex; flex-direction: column; justify-content: space-between; }
	.stat.ivory { background: var(--ivory); color: var(--ink); }
	.stat.green { background: var(--deep); color: var(--gt); }
	.stat.black { background: var(--ink); color: var(--gt); }
	.top { display: flex; align-items: center; gap: 8px; }
	.top svg { width: 24px; height: 24px; flex: none; }
	.top span { font: 800 12.5px var(--sans); letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap; }
	.stat b { font: 400 72px var(--display); line-height: 0.95; }

	/* Agente */
	footer {
		left: 40px; width: 1000px; top: 944px; height: 96px; display: flex; align-items: center; gap: 22px; padding: 0 14px;
		background: var(--ink); border: 5px solid var(--ink); box-shadow: var(--sombra); color: var(--ivory);
	}
	.avatar { width: 70px; height: 70px; padding: 4px; background: var(--gt); flex: none; }
	.avatar img, .avatar span { width: 100%; height: 100%; object-fit: cover; display: grid; place-items: center; background: #0a2a20; }
	.avatar span { font: 400 30px var(--display); color: var(--gt); }
	.datos { min-width: 0; }
	.nombre { font: 400 36px var(--display); letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; line-height: 1.05; }
	.nombre a { color: inherit; text-decoration: none; }
	.cargo { font: 700 13px var(--sans); letter-spacing: 0.3em; text-transform: uppercase; color: var(--gt); margin-top: 6px; }
	.tel { margin-left: auto; padding: 10px 22px 6px; background: var(--gt); color: var(--ink); font: 400 38px var(--display); letter-spacing: 0.05em; white-space: nowrap; }
</style>
