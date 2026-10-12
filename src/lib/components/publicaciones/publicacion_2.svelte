<script lang="ts">
	import type { PostData } from '#lib/types';

	let { data, logo = '/logoinmo.png' }: { data: PostData; logo?: string } = $props();

	const principal = $derived(data.fotos[0]);
	const extras = $derived(data.fotos.slice(1, 3));
	const sitio = $derived(data.sitio ?? 'casalegalbolivia.com');

	// El título se ajusta solo según el largo del texto
	const tituloSize = $derived(Math.min(78, Math.floor(880 / (data.tipo.length * 0.74))));

	const iniciales = $derived(
		data.agente.nombre
			.split(' ')
			.slice(0, 2)
			.map((p) => p[0])
			.join('')
			.toUpperCase()
	);

	const ICONOS = {
		cama: 'M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-8v6M5 11.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0',
		bano: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6.5a2 2 0 0 1 3.6-1.2M7 19l-1 2M17 19l1 2',
		area: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
		auto: 'M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M3.5 16h17v3.5h-2.7V18H6.2v1.5H3.5zM7 13.2h.01M17 13.2h.01'
	};

	const stats = $derived([
		{ icono: ICONOS.cama, n: data.dormitorios, label: data.dormitorios === 1 ? 'Dormitorio' : 'Dormitorios' },
		{ icono: ICONOS.bano, n: data.banos, label: data.banos === 1 ? 'Baño' : 'Baños' },
		{ icono: ICONOS.area, n: data.metros, label: 'Metros M²' },
		{ icono: ICONOS.auto, n: data.parqueos, label: data.parqueos === 1 ? 'Parqueo' : 'Parqueos' }
	]);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Montserrat:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<article class="post" aria-label="Publicación de propiedad">
	<svg width="0" height="0" style="position:absolute" aria-hidden="true">
		<defs>
			<linearGradient id="pp-gf" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1080" y2="1080">
				<stop offset="0" stop-color="#8c6a26" />
				<stop offset=".25" stop-color="#f3d98c" />
				<stop offset=".5" stop-color="#b98a30" />
				<stop offset=".75" stop-color="#fff0b8" />
				<stop offset="1" stop-color="#8c6a26" />
			</linearGradient>
			<linearGradient id="pp-gg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#8c6a26" />
				<stop offset=".3" stop-color="#f3d98c" />
				<stop offset=".55" stop-color="#c79a3c" />
				<stop offset=".8" stop-color="#fff0b8" />
				<stop offset="1" stop-color="#8c6a26" />
			</linearGradient>
			<path id="pp-dm" d="M0-9 9 0 0 9-9 0Z" fill="url(#pp-gf)" />
		</defs>
	</svg>

	<div class="guil"></div>
	<div class="glow"></div>

	<svg class="frame" viewBox="0 0 1080 1080" aria-hidden="true">
		<path d="M62 22H1018L1058 62V1018L1018 1058H62L22 1018V62Z" fill="none" stroke="url(#pp-gf)" stroke-width="2.4" />
		<path d="M72 36H1008L1044 72V1008L1008 1044H72L36 1008V72Z" fill="none" stroke="url(#pp-gf)" stroke-width="1.2" opacity=".75" />
		<use href="#pp-dm" x="540" y="22" /><use href="#pp-dm" x="540" y="1058" />
		<use href="#pp-dm" x="22" y="540" /><use href="#pp-dm" x="1058" y="540" />
		<g fill="none" stroke="url(#pp-gf)" stroke-width="1.4">
			<circle cx="72" cy="72" r="6" /><circle cx="1008" cy="72" r="6" />
			<circle cx="72" cy="1008" r="6" /><circle cx="1008" cy="1008" r="6" />
		</g>
	</svg>

	<header>
		<div class="seal-ring">
			<svg viewBox="-60 -60 120 120" aria-hidden="true">
				<defs><path id="pp-rc" d="M0-47a47 47 0 1 1-.01 0" /></defs>
				<circle r="57" fill="none" stroke="url(#pp-gg)" stroke-width=".9" />
				<circle r="39" fill="none" stroke="url(#pp-gg)" stroke-width=".6" />
				<text font-size="5.4" font-family="Montserrat, Arial, sans-serif" font-weight="500" fill="url(#pp-gg)">
					<textPath href="#pp-rc" textLength="293" lengthAdjust="spacing">CASA LEGAL INMOBILIARIA • CASA LEGAL INMOBILIARIA •</textPath>
				</text>
			</svg>
			<img src={logo} alt="Casa Legal Inmobiliaria" />
		</div>
		<div class="lockup">
			<div class="brand">CASA LEGAL</div>
			<div class="sub">INMOBILIARIA</div>
		</div>
		{#if data.operacion}<div class="operacion">{data.operacion}</div>{/if}
	</header>

	<section class="gallery" class:multi={extras.length > 0}>
		<div class="frameph main">
			<div class="ph">
				{#if principal}
					<img src={principal} alt={`Fotografía de ${data.tipo}`} />
				{:else}
					<div class="empty" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".6"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" /></svg>
					</div>
				{/if}
				<div class="shade"></div>
				{#if data.ubicacion}
					<div class="chip loc">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.4" /></svg>
						{data.ubicacion}
					</div>
				{/if}
				{#if data.precio}<div class="chip price">{data.precio}</div>{/if}
			</div>
		</div>
		{#if extras.length}
			<div class="side" class:one={extras.length === 1}>
				{#each extras as foto}
					<div class="frameph thumb"><div class="ph"><img src={foto} alt="" /></div></div>
				{/each}
			</div>
		{/if}
	</section>

	<section class="titulo">
		<h1 style:font-size="{tituloSize}px">{data.tipo}</h1>
		{#if data.condicion}<div class="cond"><i></i><span>{data.condicion}</span><i></i></div>{/if}
	</section>

	<section class="stats">
		{#each stats as s}
			<div class="cell">
				<svg viewBox="0 0 24 24" fill="none" stroke="url(#pp-gg)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={s.icono} /></svg>
				<div class="txt"><b>{s.n}</b><span>{s.label}</span></div>
			</div>
		{/each}
	</section>

	<footer class="agente">
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
			<div class="sitio">{sitio}</div>
		</div>
	</footer>
</article>

<style>
	.post {
		--gold: linear-gradient(135deg, #7d5d20 0%, #d9b25a 24%, #fff1bd 46%, #c79a3c 66%, #8c6a26 84%, #e8c875 100%);
		--gt: #dfbc66;
		--ivory: #f6f1e3;
		--serif: 'Cinzel', 'Palatino Linotype', Georgia, serif;
		--sans: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
		position: relative;
		width: 1080px;
		height: 1080px;
		overflow: hidden;
		isolation: isolate;
		box-sizing: border-box;
		padding: 64px 80px;
		display: grid;
		grid-template-rows: 96px 1fr auto 112px 92px;
		gap: 22px;
		color: var(--ivory);
		font-family: var(--sans);
		background: radial-gradient(ellipse at 50% 30%, #0c3a2d 0%, #072219 40%, #020d09 74%, #010604 100%);
	}
	.post > * { position: relative; z-index: 2; }
	.post :global(*) { box-sizing: border-box; }
	.guil {
		position: absolute !important; inset: 0; z-index: 0 !important;
		background:
			repeating-radial-gradient(circle at 16% 20%, transparent 0 9px, rgba(223, 188, 102, 0.075) 9px 10px),
			repeating-radial-gradient(circle at 86% 78%, transparent 0 9px, rgba(223, 188, 102, 0.075) 9px 10px);
		-webkit-mask: radial-gradient(ellipse at 50% 50%, #000 15%, transparent 80%);
		mask: radial-gradient(ellipse at 50% 50%, #000 15%, transparent 80%);
	}
	.glow {
		position: absolute !important; inset: 0; z-index: 1 !important;
		background: linear-gradient(115deg, transparent 30%, rgba(255, 214, 120, 0.06) 50%, transparent 68%);
	}
	.frame { position: absolute !important; inset: 0; width: 100%; height: 100%; z-index: 3 !important; pointer-events: none; }

	/* Encabezado */
	header { display: flex; align-items: center; gap: 22px; }
	.seal-ring { position: relative; width: 96px; height: 96px; display: grid; place-items: center; flex: none; box-shadow: none !important; --tw-ring-shadow: none !important; }
	.seal-ring svg { position: absolute; inset: 0; width: 96px; height: 96px; }
	.seal-ring img { width: 54px; height: 54px; object-fit: contain; filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.6)); }
	.brand, h1, .nombre, .price {
		background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent;
	}
	.brand { font-family: var(--serif); font-weight: 700; font-size: 42px; letter-spacing: 0.15em; line-height: 1; }
	.sub { font-size: 15px; letter-spacing: 0.62em; color: var(--gt); margin-top: 8px; font-weight: 500; }
	.operacion {
		margin-left: auto; padding: 12px 28px; font: 600 18px var(--sans); letter-spacing: 0.28em; text-transform: uppercase;
		color: var(--gt); border: 1px solid rgba(223, 188, 102, 0.7); box-shadow: 0 0 0 4px #04150f, 0 0 0 5px rgba(223, 188, 102, 0.3);
	}

	/* Galería */
	.gallery { display: grid; min-height: 0; grid-template-columns: 1fr; }
	.gallery.multi { grid-template-columns: 1fr 272px; gap: 16px; }
	.side { display: grid; grid-template-rows: 1fr 1fr; gap: 16px; min-height: 0; }
	.side.one { grid-template-rows: 1fr; }
	.frameph {
		--co: 28px; --c: var(--co);
		min-height: 0; padding: 4px; background: var(--gold);
		clip-path: polygon(var(--c) 0, calc(100% - var(--c)) 0, 100% var(--c), 100% calc(100% - var(--c)), calc(100% - var(--c)) 100%, var(--c) 100%, 0 calc(100% - var(--c)), 0 var(--c));
	}
	.frameph.thumb { --co: 18px; }
	.ph {
		--c: calc(var(--co) - 3px);
		position: relative; width: 100%; height: 100%; overflow: hidden; background: #0a1f18;
		clip-path: polygon(var(--c) 0, calc(100% - var(--c)) 0, 100% var(--c), 100% calc(100% - var(--c)), calc(100% - var(--c)) 100%, var(--c) 100%, 0 calc(100% - var(--c)), 0 var(--c));
	}
	.ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.empty { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(223, 188, 102, 0.35); background: linear-gradient(135deg, #0d3328, #04140e); }
	.empty svg { width: 160px; }
	.shade { position: absolute; inset: 0; background: linear-gradient(transparent 55%, rgba(1, 9, 6, 0.78)); pointer-events: none; }
	.chip { position: absolute; bottom: 26px; display: flex; align-items: center; gap: 10px; }
	.loc {
		left: 30px; padding: 11px 20px; font: 500 20px var(--sans); letter-spacing: 0.04em; color: var(--ivory);
		background: rgba(1, 9, 6, 0.7); border: 1px solid rgba(223, 188, 102, 0.6); backdrop-filter: blur(6px);
	}
	.loc svg { width: 22px; height: 22px; color: var(--gt); }
	.price {
		right: 30px; padding: 8px 4px; font: 700 40px var(--serif); letter-spacing: 0.05em;
		background: none; -webkit-background-clip: border-box; background-clip: border-box; color: #1a1204;
		background-image: var(--gold); padding: 8px 28px;
		clip-path: polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px);
	}

	/* Título */
	.titulo { text-align: center; }
	h1 { margin: 0; font-family: var(--serif); font-weight: 700; letter-spacing: 0.04em; line-height: 1.05; white-space: nowrap; padding-bottom: 4px; }
	.cond { display: flex; align-items: center; justify-content: center; gap: 22px; margin-top: 8px; }
	.cond span { font: 500 24px var(--sans); letter-spacing: 0.5em; padding-left: 0.5em; text-transform: uppercase; color: var(--ivory); }
	.cond::before, .cond::after { content: ''; width: 150px; height: 1px; background: linear-gradient(90deg, transparent, #d9b25a); }
	.cond::after { transform: scaleX(-1); }
	.cond i { width: 9px; height: 9px; background: var(--gold); transform: rotate(45deg); }

	/* Características */
	.stats {
		position: relative; display: grid; grid-template-columns: repeat(4, 1fr); align-items: center;
		border: 1px solid rgba(223, 188, 102, 0.7); background: rgba(255, 255, 255, 0.025);
		box-shadow: 0 0 0 6px #04150f, 0 0 0 7px rgba(223, 188, 102, 0.3);
	}
	.cell { position: relative; display: flex; justify-content: center; align-items: center; gap: 14px; height: 100%; }
	.cell + .cell::before {
		content: ''; position: absolute; left: 0; top: 18%; bottom: 18%; width: 1px;
		background: linear-gradient(transparent, #d9b25a, transparent);
	}
	.cell svg { width: 46px; height: 46px; flex: none; }
	.txt { display: flex; flex-direction: column; line-height: 1; }
	.txt b { font: 700 54px var(--serif); background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent; }
	.txt span { font: 500 15px var(--sans); letter-spacing: 0.12em; text-transform: uppercase; color: var(--ivory); margin-top: 8px; opacity: 0.92; }

	/* Agente */
	.agente { display: flex; align-items: center; justify-content: space-between; }
	.who { display: flex; align-items: center; gap: 22px; }
	.avatar {
		width: 92px; height: 92px; border-radius: 50%; padding: 4px; background: var(--gold); flex: none;
		box-shadow: 0 0 0 5px #05160f, 0 0 0 6px rgba(223, 188, 102, 0.6);
	}
	.avatar img, .avatar span { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: grid; place-items: center; background: #0a2a20; }
	.avatar span { font: 700 32px var(--serif); color: var(--gt); }
	.nombre { font: 700 31px var(--serif); letter-spacing: 0.04em; white-space: nowrap; }
	.nombre a { color: inherit; text-decoration: none; }
	.cargo { font: 500 16px var(--sans); letter-spacing: 0.3em; text-transform: uppercase; color: var(--gt); margin-top: 8px; }
	.contacto { text-align: right; }
	.tel { font: 600 30px var(--sans); letter-spacing: 0.06em; color: var(--ivory); }
	.sitio { font: 500 18px var(--sans); letter-spacing: 0.18em; color: var(--gt); margin-top: 6px; }
</style>
