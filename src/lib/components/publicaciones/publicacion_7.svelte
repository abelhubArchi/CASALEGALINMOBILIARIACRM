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
		fotos: string[]; // la 1.ª es la principal; la 2.ª y 3.ª salen como detalles circulares
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
	const size1 = $derived(Math.min(132, Math.floor(540 / (linea1.length * 0.58))));
	const size2 = $derived(Math.min(70, Math.floor(540 / (Math.max(linea2.length, 1) * 0.56))));

	const iniciales = $derived(
		data.agente.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
	);

	const dos = (n: number) => String(n).padStart(2, '0');
	const filas = $derived([
		{ l: 'Dormitorios', v: dos(data.dormitorios) },
		{ l: 'Baños', v: dos(data.banos) },
		{ l: 'Metros M²', v: String(data.metros) },
		{ l: 'Parqueos', v: dos(data.parqueos) },
		...(data.precio ? [{ l: 'Precio', v: data.precio }] : [])
	]);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<article class="post" aria-label="Publicación de propiedad">
	<div class="malla"></div>

	<!-- Marco, cotas y marcas de registro -->
	<svg class="dibujo" viewBox="0 0 1080 1080" aria-hidden="true" fill="none" stroke="#d9b25a">
		<rect x="22" y="22" width="1036" height="1036" stroke-width="1.5" opacity=".85" />
		<rect x="30" y="30" width="1020" height="1020" stroke-width=".6" opacity=".5" />
		<!-- cota superior -->
		<g stroke-width="1">
			<path d="M150 170H1000M150 160V186M1000 160V186" />
			<path d="M144 176l12-12M994 176l12-12" />
			<!-- cota izquierda -->
			<path d="M116 190V640M106 190H142M106 640H142" />
			<path d="M110 196l12-12M110 646l12-12" />
		</g>
		<!-- marcas de esquina de la foto -->
		<g stroke-width="1.2">
			<path d="M136 176h28M150 162v28" /><path d="M986 176h28M1000 162v28" />
			<path d="M136 654h28M150 640v28" /><path d="M986 654h28M1000 640v28" />
		</g>
		<!-- eje del cuadro -->
		<path d="M72 910H1008" stroke-width=".6" stroke-dasharray="10 6" opacity=".5" />
	</svg>

	<div class="hoja">LÁMINA 01 / 01 &nbsp;·&nbsp; CASA LEGAL INMOBILIARIA &nbsp;·&nbsp; FICHA DE PROPIEDAD</div>

	<header>
		<div class="marca">
			<img src={logo} alt="Casa Legal Inmobiliaria" />
			<div>
				<div class="brand">CASA LEGAL</div>
				<div class="sub">INMOBILIARIA</div>
			</div>
		</div>
		{#if data.operacion}
			<div class="operacion"><small>OPERACIÓN</small><b>{data.operacion}</b></div>
		{/if}
	</header>

	<!-- Etiquetas de las cotas -->
	{#if data.metros}<div class="cota-h"><span>{data.metros} M²</span></div>{/if}
	<div class="cota-v"><span>VISTA 01</span></div>

	<!-- Foto principal -->
	<div class="foto">
		{#if principal}
			<img src={principal} alt={`Fotografía de ${data.tipo}`} />
		{:else}
			<div class="empty" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".3"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6M2 20.5h20" /></svg>
			</div>
		{/if}
		<div class="tint"></div>
		{#if data.ubicacion}
			<div class="loc">
				<small>UBICACIÓN</small>
				<span>{data.ubicacion}</span>
			</div>
		{/if}
		{#if minis.length}
			<div class="detalles">
				{#each minis as m, k}
					<div class="detalle"><img src={m} alt="" /><i>{k === 0 ? 'A' : 'B'}</i></div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Título -->
	<section class="titulo">
		{#if data.condicion}<div class="kicker">// {data.condicion}</div>{/if}
		<h1>
			<span class="l1" style:font-size="{size1}px">{linea1}</span>
			{#if linea2}<span class="l2" style:font-size="{size2}px">{linea2}</span>{/if}
		</h1>
	</section>

	<!-- Cuadro de datos -->
	<section class="cuadro">
		<div class="cab">CUADRO DE DATOS</div>
		{#each filas as f}
			<div class="fila"><span>{f.l}</span><i></i><b>{f.v}</b></div>
		{/each}
	</section>

	<!-- Cajetín del agente -->
	<footer>
		<div class="c1">
			<div class="avatar">
				{#if data.agente.foto}<img src={data.agente.foto} alt={data.agente.nombre} />{:else}<span>{iniciales}</span>{/if}
			</div>
			<div>
				<small>{data.agente.cargo.toUpperCase()}</small>
				<div class="nombre">
					{#if data.agente.url}<a href={data.agente.url}>{data.agente.nombre}</a>{:else}{data.agente.nombre}{/if}
				</div>
			</div>
		</div>
		<div class="c2">
			{#if data.agente.telefono}<div><small>TELÉFONO</small><b>{data.agente.telefono}</b></div>{/if}
			<div><small>WEB</small><b>{sitio}</b></div>
		</div>
	</footer>
</article>

<style>
	.post {
		--gold: linear-gradient(100deg, #7d5d20 0%, #d9b25a 26%, #fff1bd 48%, #c79a3c 70%, #8c6a26 100%);
		--gt: #e3c06a;
		--ivory: #f6f1e3;
		--deep: #06231b;
		--display: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
		--mono: 'JetBrains Mono', 'Courier New', monospace;
		position: relative;
		width: 1080px;
		height: 1080px;
		overflow: hidden;
		isolation: isolate;
		color: var(--ivory);
		font-family: var(--mono);
		background: radial-gradient(ellipse at 50% 30%, #0b3a2d 0%, #06251c 45%, #02100b 100%);
	}
	.post :global(*) { box-sizing: border-box; margin: 0; }
	.post > * { position: absolute; }
	.malla {
		inset: 0;
		background-image:
			linear-gradient(rgba(227, 192, 106, 0.1) 1px, transparent 1px),
			linear-gradient(90deg, rgba(227, 192, 106, 0.1) 1px, transparent 1px),
			linear-gradient(rgba(227, 192, 106, 0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(227, 192, 106, 0.04) 1px, transparent 1px);
		background-size: 120px 120px, 120px 120px, 24px 24px, 24px 24px;
		background-position: 0 0;
	}
	.dibujo { inset: 0; width: 100%; height: 100%; pointer-events: none; }
	.hoja { left: 0; right: 0; top: 38px; text-align: center; font: 500 11px var(--mono); letter-spacing: 0.3em; color: var(--gt); opacity: 0.85; }

	/* Encabezado */
	header { left: 72px; right: 72px; top: 62px; height: 78px; display: flex; align-items: center; justify-content: space-between; }
	.marca { display: flex; align-items: center; gap: 16px; }
	.marca img { width: 66px; height: 66px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)); }
	.brand {
		font: 700 32px var(--display); letter-spacing: 0.12em; line-height: 1;
		background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent;
	}
	.sub { font: 500 12px var(--mono); letter-spacing: 0.6em; margin-top: 8px; }
	.operacion { padding: 4px 0 4px 18px; border-left: 2px solid #d9b25a; }
	.operacion small { display: block; font: 500 11px var(--mono); letter-spacing: 0.3em; color: var(--gt); }
	.operacion b { font: 700 28px var(--display); letter-spacing: 0.06em; text-transform: uppercase; margin-top: 4px; display: block; }

	/* Etiquetas de cotas */
	.cota-h { left: 150px; width: 850px; top: 158px; height: 24px; text-align: center; }
	.cota-h span { display: inline-block; padding: 0 16px; background: #082a20; font: 700 16px var(--mono); letter-spacing: 0.2em; color: var(--gt); line-height: 24px; }
	.cota-v { left: 96px; top: 190px; height: 450px; width: 40px; display: grid; place-items: center; }
	.cota-v span { writing-mode: vertical-rl; transform: rotate(180deg); padding: 14px 0; background: #082a20; font: 700 14px var(--mono); letter-spacing: 0.3em; color: var(--gt); }

	/* Foto */
	.foto { left: 150px; top: 190px; width: 850px; height: 450px; border: 1.5px solid #d9b25a; overflow: hidden; background: #0a1f18; box-shadow: 0 24px 40px -22px #000; }
	.foto > img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.empty { width: 100%; height: 100%; display: grid; place-items: center; color: rgba(227, 192, 106, 0.3); background: linear-gradient(160deg, #0f4132, #04140e); }
	.empty svg { width: 360px; }
	.tint { position: absolute; inset: 0; background: linear-gradient(transparent 58%, rgba(1, 9, 6, 0.78)), rgba(8, 58, 44, 0.18); pointer-events: none; }
	.loc { position: absolute; left: 22px; bottom: 20px; padding: 10px 18px; background: rgba(1, 9, 6, 0.75); border-left: 3px solid #d9b25a; max-width: 480px; }
	.loc small { display: block; font: 500 11px var(--mono); letter-spacing: 0.3em; color: var(--gt); }
	.loc span { display: block; font: 700 22px var(--display); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.detalles { position: absolute; right: 24px; bottom: 22px; display: flex; gap: 16px; }
	.detalle { position: relative; width: 124px; height: 124px; border-radius: 50%; padding: 3px; background: var(--gold); box-shadow: 0 12px 20px -8px #000; }
	.detalle img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
	.detalle i {
		position: absolute; left: -4px; top: -4px; width: 30px; height: 30px; border-radius: 50%; background: var(--deep); color: var(--gt);
		border: 1.5px solid #d9b25a; font: 700 14px var(--mono); font-style: normal; display: grid; place-items: center;
	}

	/* Título */
	.titulo { left: 72px; top: 676px; width: 540px; }
	.kicker { font: 700 17px var(--mono); letter-spacing: 0.3em; text-transform: uppercase; color: var(--gt); margin-bottom: 8px; }
	h1 { display: flex; flex-direction: column; white-space: nowrap; }
	.l1 { font-family: var(--display); font-weight: 700; line-height: 0.92; letter-spacing: -0.03em; }
	.l2 {
		font-family: var(--display); font-weight: 500; line-height: 1.05; letter-spacing: -0.02em; margin-top: 2px;
		background: var(--gold); -webkit-background-clip: text; background-clip: text; color: transparent;
	}

	/* Cuadro de datos */
	.cuadro { left: 644px; top: 676px; width: 364px; border: 1.5px solid #d9b25a; background: rgba(2, 16, 11, 0.55); }
	.cab { padding: 8px 16px; background: #d9b25a; color: var(--deep); font: 700 13px var(--mono); letter-spacing: 0.3em; }
	.fila { display: flex; align-items: baseline; gap: 10px; padding: 0 16px; height: 41px; align-items: center; }
	.fila + .fila { border-top: 1px solid rgba(227, 192, 106, 0.3); }
	.fila span { font: 500 13px var(--mono); letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap; }
	.fila i { flex: 1; border-bottom: 1px dotted rgba(227, 192, 106, 0.6); transform: translateY(5px); }
	.fila b { font: 700 28px var(--display); color: var(--gt); white-space: nowrap; }

	/* Cajetín */
	footer {
		left: 72px; right: 72px; top: 930px; height: 100px; display: grid; grid-template-columns: 1fr 370px;
		border: 1.5px solid #d9b25a; background: rgba(2, 16, 11, 0.6);
	}
	footer small { display: block; font: 500 11px var(--mono); letter-spacing: 0.28em; color: var(--gt); }
	.c1 { display: flex; align-items: center; gap: 18px; padding: 0 22px; border-right: 1.5px solid #d9b25a; min-width: 0; }
	.avatar { width: 68px; height: 68px; border-radius: 6px; padding: 3px; background: var(--gold); flex: none; }
	.avatar img, .avatar span { width: 100%; height: 100%; border-radius: 4px; object-fit: cover; display: grid; place-items: center; background: #0a2a20; }
	.avatar span { font: 700 26px var(--display); color: var(--gt); }
	.nombre { font: 700 30px var(--display); line-height: 1.05; margin-top: 6px; letter-spacing: -0.01em; }
	.nombre a { color: inherit; text-decoration: none; }
	.c2 { display: grid; align-content: center; gap: 10px; padding: 0 22px; }
	.c2 b { display: block; font: 700 22px var(--display); letter-spacing: 0.03em; margin-top: 2px; white-space: nowrap; }
</style>
