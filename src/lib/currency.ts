// Tipo de cambio real del mercado en Bolivia (Dólar Referencial Inmobiliario)
export const TIPO_CAMBIO_OFICIAL = 11.86;

export interface DualPrice {
  usd: number;
  bob: number;
  usdFormatted: string;
  bobFormatted: string;
  monedaOriginal: string;
  precioOriginal: number;
  tc: number;
}

/**
 * Convierte y formatea un precio en Dólares (USD) y Bolivianos (BOB) según el T.C. real de mercado (11.86 Bs/USD)
 * @param precioRaw Valor numérico o string del precio de lista
 * @param moneda Moneda original ('USD' o 'BOB', por defecto 'USD')
 * @param tc Tipo de cambio a aplicar (por defecto 11.86)
 */
export function getDualPrice(
  precioRaw: number | string | undefined | null,
  moneda: string = 'USD',
  tc: number = TIPO_CAMBIO_OFICIAL
): DualPrice {
  const num = typeof precioRaw === 'number' ? precioRaw : parseFloat(String(precioRaw || '0').replace(/[^0-9.]/g, '')) || 0;
  const isBob = String(moneda || '').toUpperCase() === 'BOB';
  const rate = tc > 0 ? tc : TIPO_CAMBIO_OFICIAL;

  const usd = isBob ? num / rate : num;
  const bob = isBob ? num : num * rate;

  return {
    usd: Math.round(usd),
    bob: Math.round(bob),
    usdFormatted: `$${Math.round(usd).toLocaleString('en-US')}`,
    bobFormatted: `Bs. ${Math.round(bob).toLocaleString('es-BO')}`,
    monedaOriginal: isBob ? 'BOB' : 'USD',
    precioOriginal: num,
    tc: rate
  };
}
