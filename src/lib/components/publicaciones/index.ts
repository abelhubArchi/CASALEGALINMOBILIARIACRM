import Publicacion1 from './publicacion_1.svelte';
import Publicacion2 from './publicacion_2.svelte';
import Publicacion3 from './publicacion_3.svelte';
import Publicacion4 from './publicacion_4.svelte';
import Publicacion5 from './publicacion_5.svelte';
import Publicacion6 from './publicacion_6.svelte';
import Publicacion7 from './publicacion_7.svelte';
import Publicacion8 from './publicacion_8.svelte';

export interface FlyerTemplate {
	id: number;
	name: string;
	tag: string;
	description: string;
	component: any;
}

export const flyerTemplates: FlyerTemplate[] = [
	{
		id: 1,
		name: 'Curvas Esmeralda & Oro',
		tag: 'Elegancia Orgánica',
		description: 'Composición dinámica con 3 marcos curvos y viñetas doradas.',
		component: Publicacion1
	},
	{
		id: 2,
		name: 'Royale Imperial',
		tag: 'Lujo Clásico',
		description: 'Guilloché dorado, marco imperial y sello circular de Casa Legal.',
		component: Publicacion2
	},
	{
		id: 3,
		name: 'Playfair Couture',
		tag: 'Portada Editorial',
		description: 'Fondo inmersivo, corte diagonal de oro y tipografía de revista de lujo.',
		component: Publicacion3
	},
	{
		id: 4,
		name: 'Arco de Triunfo',
		tag: 'Arquitectura Pura',
		description: 'Arco de medio punto clásico, anillas concéntricas doradas y miniaturas flotantes.',
		component: Publicacion4
	},
	{
		id: 5,
		name: 'Minimalista Contemporáneo',
		tag: 'Moderno & Pulcro',
		description: 'Bloque asimétrico con mosaico dorado y cuadrícula de alta visibilidad.',
		component: Publicacion5
	},
	{
		id: 6,
		name: 'Sello Postal Vintage',
		tag: 'Colección & Firma',
		description: 'Sello circular girado, fotos polaroid y código de barras Casa Legal.',
		component: Publicacion6
	},
	{
		id: 7,
		name: 'Blueprint Técnico',
		tag: 'Plano de Arquitecto',
		description: 'Líneas de cota milimétricas doradas, marco técnico y detalles circulares.',
		component: Publicacion7
	},
	{
		id: 8,
		name: 'Pop Brutalista Luxury',
		tag: 'Alto Impacto',
		description: 'Stickers enmarcados, estrella de precio llamativa y contraste de redes.',
		component: Publicacion8
	}
];

export {
	Publicacion1,
	Publicacion2,
	Publicacion3,
	Publicacion4,
	Publicacion5,
	Publicacion6,
	Publicacion7,
	Publicacion8
};
