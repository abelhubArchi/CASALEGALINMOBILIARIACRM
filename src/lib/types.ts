export interface Agente {
	nombre: string;
	cargo: string;
	foto?: string;
	telefono?: string;
	url?: string;
}

export interface PostData {
	tipo: string; // "Casa independiente"
	condicion?: string; // "A estrenar"
	operacion?: string; // "En venta"
	fotos: string[]; // [principal, miniatura 1, miniatura 2]
	precio?: string;
	ubicacion?: string;
	dormitorios: number;
	banos: number;
	metros: number;
	parqueos: number;
	agente: Agente;
	sitio?: string;
}
