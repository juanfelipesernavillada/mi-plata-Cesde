import { ProductoBancario } from './ProductoBancario.js';
import { crearId, validarMonto, redondearPesos } from '../utils.js';

// Tasas del enunciado académico CESDE. No representan una oferta financiera real.
const TASA_3_A_6 = 0.019;
const TASA_7_O_MAS = 0.023;

export function determinarTasaCuotas(numeroCuotas) {
  const n = Number(numeroCuotas);
  if (!Number.isInteger(n) || n < 1) throw new Error('El número de cuotas debe ser un entero mayor que cero.');
  return n <= 2 ? 0 : n <= 6 ? TASA_3_A_6 : TASA_7_O_MAS;
}

export function calcularCuotaMensual(capital, tasaMensual, numeroCuotas) {
  const c = Number(capital), r = Number(tasaMensual), n = Number(numeroCuotas);
  if (!Number.isFinite(c) || c <= 0 || !Number.isFinite(r) || r < 0 || !Number.isInteger(n) || n < 1) {
    throw new Error('No se pueden calcular las cuotas con los valores proporcionados.');
  }
  if (r === 0) return Math.round(c / n);
  return Math.round((c * r) / (1 - (1 + r) ** (-n)));
}

export class TarjetaCredito extends ProductoBancario {
  #cupoTotal;
  #compras;

  constructor({ cupoTotal = 0, compras = [], ...datos } = {}) {
    super(datos);
    const cupo = Number(cupoTotal);
    if (!Number.isSafeInteger(cupo) || cupo < 0) throw new Error('El cupo debe ser un entero de pesos igual o mayor a cero.');
    this.#cupoTotal = cupo;
    this.#compras = structuredClone(compras || []);
  }

  get cupoTotal() { return this.#cupoTotal; }
  get compras() { return structuredClone(this.#compras); }
  get deudaActual() { return this.#compras.reduce((total, compra) => total + Math.max(0, Number(compra.capitalPendiente) || 0), 0); }
  get cupoDisponible() { return Math.max(0, this.#cupoTotal - this.deudaActual); }
  getResumen() { return { id: this.id, tipo: this.tipo, alias: this.alias, cupoTotal: this.#cupoTotal, deudaActual: this.deudaActual, cupoDisponible: this.cupoDisponible }; }

  ajustarCupoTotal(nuevoCupo) {
    const cupo = Number(nuevoCupo);
    if (!Number.isSafeInteger(cupo) || cupo < this.deudaActual) throw new Error('El cupo no puede ser menor que la deuda actual.');
    this.#cupoTotal = cupo;
  }

  registrarCompra(valor, numeroCuotas, descripcion = 'Compra con tarjeta de crédito') {
    const capital = validarMonto(valor, 'El valor de la compra');
    const cuotas = Number(numeroCuotas);
    if (!Number.isSafeInteger(cuotas) || cuotas < 1) throw new Error('El número de cuotas debe ser un entero positivo.');
    if (capital > this.cupoDisponible) throw new Error('La compra supera el cupo disponible de la tarjeta.');

    const tasaMensual = determinarTasaCuotas(cuotas);
    const cuotaMensual = calcularCuotaMensual(capital, tasaMensual, cuotas);
    const compra = {
      id: crearId('compra'), fecha: new Date().toISOString(), descripcion: String(descripcion || 'Compra con tarjeta de crédito'),
      capitalInicial: capital, capitalPendiente: capital, cuotasTotales: cuotas, cuotasPagadas: 0,
      tasaMensual, cuotaMensual, activa: true
    };
    this.#compras.push(compra);
    this.registrarMovimiento({ tipo: 'COMPRA_TARJETA', descripcion: compra.descripcion, valor: capital,
      referencia: compra.id, metadata: { cuotas, tasaMensual, cuotaMensual } });
    return structuredClone(compra);
  }

  siguienteCuota(compraId) {
    const compra = this.#compras.find(c => c.id === compraId && c.activa && c.cuotasPagadas < c.cuotasTotales);
    if (!compra) throw new Error('No se encontró una cuota pendiente para esa compra.');
    const interes = Math.round(compra.capitalPendiente * compra.tasaMensual);
    const ultima = compra.cuotasPagadas + 1 >= compra.cuotasTotales;
    const valor = ultima ? compra.capitalPendiente + interes : Math.min(compra.cuotaMensual, compra.capitalPendiente + interes);
    return { compraId: compra.id, valor, interes, capital: Math.max(0, valor - interes), numeroCuota: compra.cuotasPagadas + 1,
      cuotasTotales: compra.cuotasTotales, descripcion: compra.descripcion };
  }

  pagarCuota(compraId) {
    const cuota = this.siguienteCuota(compraId);
    const compra = this.#compras.find(c => c.id === compraId);
    compra.capitalPendiente = Math.max(0, compra.capitalPendiente - cuota.capital);
    compra.cuotasPagadas += 1;
    if (compra.cuotasPagadas >= compra.cuotasTotales || compra.capitalPendiente <= 0) {
      compra.capitalPendiente = 0;
      compra.activa = false;
    }
    this.registrarMovimiento({ tipo: 'PAGO_CUOTA', descripcion: `Pago de cuota ${cuota.numeroCuota}/${cuota.cuotasTotales}: ${compra.descripcion}`,
      valor: cuota.valor, referencia: compra.id, metadata: { interes: cuota.interes, capital: cuota.capital, numeroCuota: cuota.numeroCuota, cuotasTotales: cuota.cuotasTotales } });
    return cuota;
  }

  toJSON() { return { ...this.serializarBase(), tipo: this.tipo, cupoTotal: this.#cupoTotal, compras: this.#compras }; }
  static fromJSON(datos) { return new TarjetaCredito(datos); }
}

export const REGLAS_TARJETA = Object.freeze({
  sinInteresHastaCuotas: 2, tasaTresASeis: TASA_3_A_6, tasaSieteOMas: TASA_7_O_MAS
});
