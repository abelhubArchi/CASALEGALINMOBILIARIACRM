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
		fotos: string[]; // la 1.ª es la principal; la 2.ª y 3.ª salen como miniaturas
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
	const size1 = $derived(Math.min(104, Math.floor(336 / (linea1.length * 0.6))));
	const size2 = $derived(Math.min(52, Math.floor(336 / (Math.max(linea2.length, 1) * 0.54))));

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
		href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<article class="post" aria-label="Publicación de propiedad">
	<div class="dots"></div>
	<div class="glow"></div>

	<header>
		<div class="marca">
			<img src={logo} alt="Casa Legal Inmobiliaria" />
			<div>
				<div class="brand">CASA LEGAL</div>
				<div class="sub">INMOBILIARIA</div>
			</div>
		</div>
		{#if data.operacion}<div class="operacion"><i></i>{data.operacion}</div>{/if}
	</header>

	<main class="grid">
		<!-- Foto -->
		<div class="tile foto">
			{#if principal}
				<img class="main-img" src={principal} alt={`Fotografía de ${data.tipo}`} />
			{:else}
				<div class="empty" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".35"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg>
				</div>
			{/if}
			<div class="shade"></div>
			{#if data.ubicacion}
				<div class="loc">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.4" /></svg>
					<span>{data.ubicacion}</span>
				</div>
			{/if}
			{#if minis.length}
				<div class="minis">
					{#each minis as m}<div class="mini"><img src={m} alt="" /></div>{/each}
				</div>
			{/if}
		</div>

		<!-- Título (mosaico dorado) -->
		<div class="tile oro">
			<img class="marca-agua" src={logo} alt="" />
			{#if data.condicion}<div class="kicker">{data.condicion}</div>{/if}
			<h1>
				<span class="l1" style:font-size="{size1}px">{linea1}</span>
				{#if linea2}<span class="l2" style:font-size="{size2}px">{linea2}</span>{/if}
			</h1>
			{#if data.precio}<div class="precio">{data.precio}</div>{/if}
		</div>

		<!-- Cifras -->
		<div class="stats">
			{#each stats as s}
				<div class="tile stat">
					<svg viewBox="0 0 24 24" fill="none" stroke="#e3c06a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={s.i} /></svg>
					<b>{s.n}</b>
					<span>{s.l}</span>
				</div>
			{/each}
		</div>

		<!-- Agente -->
		<div class="tile agente">
			<div class="avatar">
				{#if data.agente.foto}<img src={data.agente.foto} alt={data.agente.nombre} />{:else}<span>{iniciales}</span>{/if}
			</div>
			<div class="datos">
				<div class="cargo">{data.agente.cargo}</div>
				<div class="nombre">
					{#if data.agente.url}<a href={data.agente.url}>{data.agente.nombre}</a>{:else}{data.agente.nombre}{/if}
				</div>
			</div>
			<div class="contacto">
				{#if data.agente.telefono}<div class="tel">{data.agente.telefono}</div>{/if}
				<div class="web">{sitio}</div>
			</div>
		</div>
	</main>
</article>

<style>
	.post {
		--gold: linear-gradient(120deg, #7d5d20 0%, #d9b25a 24%, #fff1bd 46%, #c79a3c 68%, #8c6a26 100%);
		--gt: #e3c06a;
		--ivory: #f6f1e3;
		--deep: #06231b;
		--display: 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif;
		--sans: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
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
	.dots {
		position: absolute; inset: 0;
		background-image: radial-gradient(rgba(227, 192, 106, 0.16) 1.2px, transparent 1.8px);
		background-size: 26px 26px;
		-webkit-mask: radial-gradient(ellipse at 85% 10%, #000 0%, transparent 62%);
		mask: radial-gradient(ellipse at 85% 10%, #000 0%, transparent 62%);
	}
	.glow {
		position: absolute; inset: 0;
		background:
			radial-gradient(circle at 12% 95%, rgba(14, 82, 62, 0.55), transparent 48%),
			radial-gradient(circle at 92% 6%, rgba(12, 70, 52, 0.5), transparent 45%);
	}

	/* Encabezado */
	header {
		position: absolute; left: 48px; right: 48px; top: 40px; height: 96px; display: flex; align-items: center; justify-content: space-between;
	}
	header::after {
		content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
		background: linear-gradient(90deg, #d9b25a, rgba(217, 178, 90, 0));
	}
	.marca { display: flex; align-items: center; gap: 16px; }
	.marca img { width: 66px; height: 66px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)); }
	.brand {
		font: 800 32px var(--display); letter-spacing: 0.1em; line-height: 1;
		background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent;
	}
	.sub { font: 500 12px var(--sans); letter-spacing: 0.6em; color: var(--ivory); margin-top: 8px; opacity: 0.9; }
	.operacion {
		display: flex; align-items: center; gap: 12px; padding: 12px 26px; border-radius: 999px;
		border: 1.5px solid rgba(227, 192, 106, 0.8); color: var(--gt);
		font: 700 16px var(--sans); letter-spacing: 0.22em; text-transform: uppercase;
	}
	.operacion i { width: 9px; height: 9px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 12px #e3c06a; }

	/* Mosaico */
	.grid {
		position: absolute; left: 48px; top: 160px; width: 984px; height: 872px; display: grid;
		grid-template-columns: 576px 188px 188px; grid-template-rows: 325px 325px 190px; gap: 16px;
	}
	.tile {
		position: relative; overflow: hidden; border-radius: 30px;
		background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(227, 192, 106, 0.28); backdrop-filter: blur(6px);
	}

	.foto { grid-column: 1; grid-row: 1 / 3; border-color: rgba(227, 192, 106, 0.6); background: #0a1f18; }
	.main-img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.empty { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(227, 192, 106, 0.3); background: linear-gradient(160deg, #0f4132, #04140e); }
	.empty svg { width: 300px; }
	.shade { position: absolute; inset: 0; background: linear-gradient(transparent 55%, rgba(1, 9, 6, 0.8)); pointer-events: none; }
	.loc {
		position: absolute; left: 24px; bottom: 24px; max-width: 300px; display: flex; align-items: center; gap: 10px;
		padding: 12px 20px; border-radius: 999px; background: rgba(1, 9, 6, 0.72); backdrop-filter: blur(8px);
		border: 1px solid rgba(227, 192, 106, 0.55); font: 500 19px var(--sans);
	}
	.loc svg { width: 22px; height: 22px; color: var(--gt); flex: none; }
	.loc span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.minis { position: absolute; right: 24px; bottom: 24px; display: flex; gap: 12px; }
	.mini { width: 96px; height: 96px; border-radius: 22px; padding: 3px; background: var(--gold); box-shadow: 0 10px 20px -8px #000; }
	.mini img { width: 100%; height: 100%; object-fit: cover; border-radius: 19px; display: block; }

	.oro {
		grid-column: 2 / 4; grid-row: 1; padding: 28px; display: flex; flex-direction: column; color: var(--deep);
		background: var(--gold); border: none;
	}
	.marca-agua { position: absolute; right: -40px; bottom: -50px; width: 250px; opacity: 0.16; filter: brightness(0); pointer-events: none; }
	.kicker { font: 700 15px var(--sans); letter-spacing: 0.34em; text-transform: uppercase; }
	h1 { display: flex; flex-direction: column; margin-top: 12px; white-space: nowrap; }
	.l1 { font-family: var(--display); font-weight: 800; line-height: 0.88; letter-spacing: -0.03em; }
	.l2 { font-family: var(--display); font-weight: 600; line-height: 1.05; letter-spacing: -0.02em; margin-top: 4px; }
	.precio {
		margin-top: auto; align-self: flex-start; padding: 10px 24px; border-radius: 999px; background: var(--deep); color: #f3d98c;
		font: 800 32px var(--display); letter-spacing: 0.01em; position: relative;
	}

	.stats { grid-column: 2 / 4; grid-row: 2; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 16px; }
	.stat { padding: 16px 20px; display: flex; flex-direction: column; justify-content: space-between; }
	.stat svg { width: 30px; height: 30px; }
	.stat b { font: 800 66px var(--display); line-height: 0.9; letter-spacing: -0.03em; color: var(--ivory); margin-top: auto; }
	.stat span { font: 700 12.5px var(--sans); letter-spacing: 0.16em; text-transform: uppercase; color: var(--gt); margin-top: 6px; }

	.agente {
		grid-column: 1 / 4; grid-row: 3; display: flex; align-items: center; gap: 30px; padding: 0 44px 0 34px;
		background: linear-gradient(100deg, #0c3a2d 0%, #06231b 55%, #020d09 100%); border-color: rgba(227, 192, 106, 0.55);
	}
	.avatar { width: 126px; height: 126px; border-radius: 50%; padding: 4px; background: var(--gold); flex: none; }
	.avatar img, .avatar span { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: grid; place-items: center; background: #0a2a20; }
	.avatar span { font: 800 44px var(--display); color: var(--gt); }
	.datos { flex: 1; min-width: 0; }
	.cargo { font: 700 14px var(--sans); letter-spacing: 0.34em; text-transform: uppercase; color: var(--gt); }
	.nombre { font: 800 36px var(--display); line-height: 1.08; letter-spacing: -0.01em; margin-top: 8px; max-width: 470px; }
	.nombre a { color: inherit; text-decoration: none; }
	.contacto { text-align: right; flex: none; padding-left: 28px; border-left: 1px solid rgba(227, 192, 106, 0.4); }
	.tel { font: 700 32px var(--display); letter-spacing: 0.02em; }
	.web { font: 500 16px var(--sans); letter-spacing: 0.16em; color: var(--gt); margin-top: 8px; }
</style>
