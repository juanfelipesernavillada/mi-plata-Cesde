import { Cuenta } from './Cuenta.js';

const DIA_MS = 24 * 60 * 60 * 1000;
const PERIODO_MENSUAL_DIAS = 30;
const TASA_MENSUAL = 0.015; // Tasa fijada por el enunciado académico; no es una tasa obligatoria general en Colombia.

export class CuentaAhorros extends Cuenta {
  #interesPendiente;
  #fechaUltimoCalculo;

  constructor({ interesPendiente = 0, fechaUltimoCalculo = new Date().toISOString(), ...datos } = {}) {
    super(datos);
    this.#interesPendiente = Math.max(0, Math.round(Number(interesPendiente) || 0));
    this.#fechaUltimoCalculo = new Date(fechaUltimoCalculo).toISOString();
  }

  get tasaMensual() { return TASA_MENSUAL; }
  get interesPendiente() { return this.#interesPendiente; }
  get fechaUltimoCalculo() { return this.#fechaUltimoCalculo; }

  #acumularInteres(fecha = new Date()) {
    const ahora = new Date(fecha);
    const inicio = new Date(this.#fechaUltimoCalculo);
    const milisegundos = Math.max(0, ahora.getTime() - inicio.getTime());
    if (milisegundos > 0 && this.consultarSaldo() > 0) {
      const dias = milisegundos / DIA_MS;
      const interes = Math.round(this.consultarSaldo() * TASA_MENSUAL * dias / PERIODO_MENSUAL_DIAS);
      this.#interesPendiente += Math.max(0, interes);
    }
    this.#fechaUltimoCalculo = ahora.toISOString();
  }

  abonar(valor, opciones = {}) {
    this.#acumularInteres();
    return super.abonar(valor, opciones);
  }

  debitar(valor, opciones = {}) {
    const monto = Number(valor);
    if (!Number.isSafeInteger(monto) || monto <= 0) throw new Error('El valor a retirar debe ser un entero de pesos mayor que cero.');
    // La regla académica impide que un retiro supere el saldo antes de liquidar intereses.
    if (monto > this.consultarSaldo()) throw new Error('El retiro no puede superar el saldo disponible antes de aplicar intereses.');
    this.#acumularInteres();
    this.#liquidarInteres();
    return super.debitar(monto, opciones);
  }

  #liquidarInteres() {
    if (this.#interesPendiente <= 0) return 0;
    const interes = this.#interesPendiente;
    this.#interesPendiente = 0;
    super.abonar(interes, { tipo: 'INTERES_AHORRO', descripcion: 'Interés de ahorro liquidado al retirar',
      metadata: { tasaMensual: TASA_MENSUAL, baseDias: PERIODO_MENSUAL_DIAS } });
    return interes;
  }

  ajustarSaldoDemostrativo(nuevoSaldo, descripcion = 'Ajuste de saldo demostrativo por administración') {
    this.#acumularInteres();
    return super.ajustarSaldoDemostrativo(nuevoSaldo, descripcion);
  }

  retirar(valor) {
    const monto = Number(valor);
    if (!Number.isSafeInteger(monto) || monto <= 0) throw new Error('El valor a retirar debe ser un entero de pesos mayor que cero.');
    if (!this.puedeRetirar(monto)) throw new Error('El retiro no puede superar el saldo disponible antes de aplicar intereses.');
    return this.debitar(monto, { tipo: 'RETIRO', descripcion: 'Retiro de cuenta de ahorros' });
  }

  getResumen() {
    return { ...super.getResumen(), tasaMensual: TASA_MENSUAL, interesPendiente: this.#interesPendiente };
  }

  toJSON() {
    return { ...this.serializarCuenta(), tipo: this.tipo, interesPendiente: this.#interesPendiente,
      fechaUltimoCalculo: this.#fechaUltimoCalculo, tasaMensual: TASA_MENSUAL };
  }

  static fromJSON(datos) { return new CuentaAhorros(datos); }
}
