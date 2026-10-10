export function crearId(prefijo = 'id') {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `${prefijo}_${uuid || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`}`;
}

export function validarMonto(valor, nombre = 'El monto') {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new Error(`${nombre} debe ser un número entero de pesos mayor que cero.`);
  }
  return numero;
}

export function redondearPesos(valor) {
  return Math.round(Number(valor) || 0);
}
