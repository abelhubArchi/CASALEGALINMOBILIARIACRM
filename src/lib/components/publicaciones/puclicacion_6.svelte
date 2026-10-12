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
		condicion?: string; // "A estrenar" (va en el sello)
		operacion?: string; // "En venta" (va en el centro del sello)
		fotos: string[]; // la 1.ª es la portada; la 2.ª y 3.ª salen como fotos pequeñas
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

	const portada = $derived(data.fotos[0]);
	const minis = $derived(data.fotos.slice(1, 3));
	const sitio = $derived(data.sitio ?? 'casalegalbolivia.com');

	const palabras = $derived(data.tipo.trim().split(/\s+/));
	const primera = $derived(palabras[0]);
	const resto = $derived(palabras.slice(1).join(' '));
	const tituloSize = $derived(Math.min(118, Math.floor(940 / (data.tipo.length * 0.52))));

	const textoSello = $derived(
		(data.condicion ?? 'Casa Legal Inmobiliaria').toUpperCase()
	);
	const anilloSello = $derived(`${textoSello} • ${textoSello} • `);
	const haySello = $derived(Boolean(data.condicion || data.operacion));

	const iniciales = $derived(
		data.agente.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
	);

	const stats = $derived([
		{ n: data.dormitorios, l: data.dormitorios === 1 ? 'Dormitorio' : 'Dormitorios' },
		{ n: data.banos, l: data.banos === 1 ? 'Baño' : 'Baños' },
		{ n: data.metros, l: 'Metros M²' },
		{ n: data.parqueos, l: data.parqueos === 1 ? 'Parqueo' : 'Parqueos' }
	]);

	// Código de barras decorativo
	const anchos = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 1, 2, 4, 1, 3, 2, 1, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 1, 4, 1, 2, 2];
	let _x = 0;
	const barras = anchos
		.map((w, i) => {
			const b = { x: _x, w, negra: i % 2 === 0 };
			_x += w * 2.2;
			return b;
		})
		.filter((b) => b.negra);
	const anchoBarras = _x;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,600;0,6..96,700;1,6..96,500;1,6..96,600&family=Archivo:wght@500;600;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<article class="post" aria-label="Publicación de propiedad">
	<svg width="0" height="0" style="position:absolute" aria-hidden="true">
		<defs>
			<linearGradient id="pm-g" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#8c6a26" />
				<stop offset=".3" stop-color="#f3d98c" />
				<stop offset=".55" stop-color="#c79a3c" />
				<stop offset=".8" stop-color="#fff0b8" />
				<stop offset="1" stop-color="#8c6a26" />
			</linearGradient>
		</defs>
	</svg>

	<!-- Portada -->
	<div class="fondo">
		{#if portada}
			<img src={portada} alt={`Fotografía de ${data.tipo}`} />
		{:else}
			<div class="empty" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".3"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg>
			</div>
		{/if}
	</div>
	<div class="velo"></div>

	<!-- Cabecera de revista -->
	<div class="regla r1"></div>
	<h2 class="mast">CASA LEGAL</h2>
	<div class="fecha">
		<span>Inmobiliaria · Edición Bolivia</span>
		<img src={logo} alt="Casa Legal Inmobiliaria" />
		<span>{sitio}</span>
	</div>

	<!-- Líneas de portada: cifras -->
	<section class="lineas">
		{#each stats as s}
			<div class="linea">
				<b>{s.n}</b>
				<span>{s.l}</span>
			</div>
		{/each}
	</section>

	<!-- Sello -->
	{#if haySello}
		<div class="sello">
			<svg viewBox="-115 -115 230 230" aria-hidden="true">
				<defs><path id="pm-arc" d="M0-86a86 86 0 1 1-.01 0" /></defs>
				<circle r="112" fill="url(#pm-g)" />
				<circle r="104" fill="none" stroke="#06231b" stroke-width="1.5" />
				<circle r="66" fill="none" stroke="#06231b" stroke-width="1.5" />
				<text font-size="19" font-weight="800" font-family="Archivo, Arial, sans-serif" fill="#06231b">
					<textPath href="#pm-arc" textLength="534" lengthAdjust="spacing">{anilloSello}</textPath>
				</text>
				{#if data.operacion}
					<text text-anchor="middle" y="9" font-size="27" font-weight="700" font-family="'Bodoni Moda', Georgia, serif" fill="#06231b">{data.operacion}</text>
				{:else}
					<image href={logo} x="-40" y="-40" width="80" height="80" />
				{/if}
			</svg>
		</div>
	{/if}

	<!-- Fotos pequeñas tipo instantánea -->
	{#each minis as m, k}
		<div class="polaroid" style:right="{60 + k * 150}px" style:top="{576 + k * 18}px" style:transform="rotate({k === 0 ? 5 : -6}deg)">
			<img src={m} alt="" />
		</div>
	{/each}

	<!-- Titular -->
	<h1 style:font-size="{tituloSize}px">
		<span class="a">{primera}</span>{#if resto}<span class="b"> {resto}</span>{/if}
	</h1>

	<div class="fila">
		{#if data.ubicacion}
			<div class="loc">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.4" /></svg>
				{data.ubicacion}
			</div>
		{/if}
		{#if data.precio}<div class="precio">{data.precio}</div>{/if}
	</div>

	<!-- Pie: agente + código de barras -->
	<footer>
		<div class="who">
			<div class="avatar">
				{#if data.agente.foto}<img src={data.agente.foto} alt={data.agente.nombre} />{:else}<span>{iniciales}</span>{/if}
			</div>
			<div>
				<div class="nombre">
					{#if data.agente.url}<a href={data.agente.url}>{data.agente.nombre}</a>{:else}{data.agente.nombre}{/if}
				</div>
				<div class="cargo">{data.agente.cargo}{#if data.agente.telefono}<em>·</em><span>{data.agente.telefono}</span>{/if}</div>
			</div>
		</div>
		<div class="barcode" aria-hidden="true">
			<svg viewBox="0 0 {anchoBarras} 54" preserveAspectRatio="none">
				{#each barras as b}<rect x={b.x} y="0" width={b.w * 2.2} height="54" fill="#06231b" />{/each}
			</svg>
			<div>{sitio.toUpperCase()}</div>
		</div>
	</footer>
</article>

<style>
	.post {
		--gold: linear-gradient(100deg, #7d5d20 0%, #d9b25a 26%, #fff1bd 48%, #c79a3c 70%, #8c6a26 100%);
		--gt: #e3c06a;
		--ivory: #f6f1e3;
		--deep: #06231b;
		--serif: 'Bodoni Moda', 'Didot', Georgia, serif;
		--sans: 'Archivo', 'Helvetica Neue', Arial, sans-serif;
		position: relative;
		width: 1080px;
		height: 1080px;
		overflow: hidden;
		isolation: isolate;
		color: var(--ivory);
		font-family: var(--sans);
		background: #020805;
	}
	.post :global(*) { box-sizing: border-box; margin: 0; }
	.post > * { position: absolute; }

	.fondo { inset: 0; }
	.fondo img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.empty { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(227, 192, 106, 0.22); background: radial-gradient(ellipse at 50% 40%, #135240, #04140e); }
	.empty svg { width: 620px; }
	.velo {
		inset: 0;
		background:
			linear-gradient(180deg, rgba(3, 22, 16, 0.92) 0%, rgba(3, 22, 16, 0.6) 22%, rgba(3, 22, 16, 0) 40%, rgba(1, 9, 6, 0) 52%, rgba(1, 9, 6, 0.92) 82%, #010604 100%),
			linear-gradient(90deg, rgba(1, 9, 6, 0.6), transparent 55%);
	}

	/* Cabecera */
	.regla { left: 48px; right: 48px; height: 3px; background: var(--gold); }
	.r1 { top: 34px; }
	.mast {
		left: 0; right: 0; top: 44px; text-align: center; font: 700 140px var(--serif); line-height: 1; letter-spacing: 0.02em; white-space: nowrap;
		background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent;
	}
	.fecha {
		left: 48px; right: 48px; top: 196px; height: 44px; display: flex; align-items: center; justify-content: space-between;
		border-top: 1px solid rgba(227, 192, 106, 0.7); border-bottom: 1px solid rgba(227, 192, 106, 0.7);
		font: 600 14px var(--sans); letter-spacing: 0.3em; text-transform: uppercase; color: var(--ivory);
	}
	.fecha img { height: 54px; width: 54px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7)); }

	/* Cifras como titulares laterales */
	.lineas { left: 60px; top: 330px; width: 330px; display: grid; gap: 4px; }
	.linea { display: flex; align-items: baseline; gap: 18px; padding: 8px 0; border-bottom: 1px solid rgba(227, 192, 106, 0.4); }
	.linea b {
		font: italic 700 78px var(--serif); line-height: 1; min-width: 118px; letter-spacing: -0.01em;
		background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent; padding-right: 6px;
	}
	.linea span { font: 800 17px var(--sans); letter-spacing: 0.2em; text-transform: uppercase; }

	/* Sello */
	.sello { right: 56px; top: 290px; width: 230px; height: 230px; transform: rotate(-12deg); filter: drop-shadow(0 16px 20px rgba(0, 0, 0, 0.6)); }
	.sello svg { width: 100%; height: 100%; display: block; }

	.polaroid { width: 150px; height: 168px; padding: 8px 8px 30px; background: var(--ivory); box-shadow: 0 16px 26px -8px rgba(0, 0, 0, 0.8); }
	.polaroid img { width: 100%; height: 100%; object-fit: cover; display: block; }

	/* Titular */
	h1 { left: 48px; right: 48px; top: 726px; font-family: var(--serif); font-weight: 700; line-height: 1; white-space: nowrap; text-shadow: 0 6px 24px rgba(0, 0, 0, 0.6); }
	.a { color: var(--ivory); }
	.b { font-style: italic; font-weight: 600; background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent; padding-right: 8px; }

	.fila { left: 52px; right: 52px; top: 858px; display: flex; align-items: center; justify-content: space-between; }
	.loc { display: flex; align-items: center; gap: 10px; font: 600 22px var(--sans); letter-spacing: 0.04em; }
	.loc svg { width: 26px; height: 26px; color: var(--gt); }
	.precio {
		margin-left: auto; padding: 8px 26px; background: var(--gold); color: var(--deep); font: 700 38px var(--serif); letter-spacing: 0.02em;
	}

	/* Pie */
	footer {
		left: 48px; right: 48px; bottom: 36px; height: 96px; display: flex; align-items: center; justify-content: space-between;
		border-top: 3px solid transparent; border-image: var(--gold) 1; padding-top: 14px;
	}
	.who { display: flex; align-items: center; gap: 20px; }
	.avatar { width: 76px; height: 76px; border-radius: 50%; padding: 3px; background: var(--gold); flex: none; }
	.avatar img, .avatar span { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: grid; place-items: center; background: #0a2a20; }
	.avatar span { font: 700 26px var(--serif); color: var(--gt); }
	.nombre { font: 700 33px var(--serif); line-height: 1.05; white-space: nowrap; }
	.nombre a { color: inherit; text-decoration: none; }
	.cargo { font: 600 14px var(--sans); letter-spacing: 0.26em; text-transform: uppercase; color: var(--gt); margin-top: 7px; }
	.cargo em { font-style: normal; margin: 0 10px; opacity: 0.7; }
	.cargo span { color: var(--ivory); letter-spacing: 0.1em; }
	.barcode { width: 190px; padding: 8px 12px 5px; background: var(--ivory); color: var(--deep); text-align: center; flex: none; }
	.barcode svg { width: 100%; height: 46px; display: block; }
	.barcode div { font: 600 8.5px var(--sans); letter-spacing: 0.22em; margin-top: 4px; white-space: nowrap; overflow: hidden; }
</style>
