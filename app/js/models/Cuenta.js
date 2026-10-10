import { ProductoBancario } from './ProductoBancario.js';
import { validarMonto, redondearPesos } from '../utils.js';

export class Cuenta extends ProductoBancario {
  #saldo;

  constructor({ saldo = 0, ...datos } = {}) {
    if (new.target === Cuenta) throw new Error('Cuenta es una clase abstracta.');
    super(datos);
    if (!Number.isSafeInteger(Number(saldo))) throw new Error('El saldo debe expresarse en pesos enteros.');
    this.#saldo = redondearPesos(saldo);
  }

  consultarSaldo() { return this.#saldo; }
  consultarDisponible() { return this.#saldo; }
  puedeRetirar(valor) { return Number(valor) > 0 && Number(valor) <= this.#saldo; }

  abonar(valor, { tipo = 'CONSIGNACION', descripcion = 'Consignación', referencia = null, metadata = {} } = {}) {
    const monto = validarMonto(valor, 'El valor a consignar');
    this.#saldo = redondearPesos(this.#saldo + monto);
    this.registrarMovimiento({ tipo, descripcion, valor: monto, saldoDespues: this.#saldo, referencia, metadata });
    return this.#saldo;
  }

  debitar(valor, { tipo = 'RETIRO', descripcion = 'Retiro', referencia = null, metadata = {} } = {}) {
    const monto = validarMonto(valor, 'El valor a debitar');
    if (!this.puedeRetirar(monto)) throw new Error('El monto supera el disponible permitido para esta cuenta.');
    this.#saldo = redondearPesos(this.#saldo - monto);
    this.registrarMovimiento({ tipo, descripcion, valor: monto, saldoDespues: this.#saldo, referencia, metadata });
    return this.#saldo;
  }

  retirar(valor) {
    const monto = validarMonto(valor, 'El valor a retirar');
    if (!this.puedeRetirar(monto)) throw new Error('El monto supera el saldo disponible.');
    return this.debitar(monto, { tipo: 'RETIRO', descripcion: 'Retiro de dinero' });
  }

  ajustarSaldoDemostrativo(nuevoSaldo, descripcion = 'Ajuste de saldo demostrativo por administración') {
    const saldo = Number(nuevoSaldo);
    if (!Number.isSafeInteger(saldo) || saldo < 0) throw new Error('El saldo inicial debe ser un entero de pesos igual o mayor a cero.');
    const diferencia = saldo - this.#saldo;
    this.#saldo = saldo;
    this.registrarMovimiento({ tipo: 'AJUSTE_DEMO', descripcion, valor: Math.abs(diferencia), saldoDespues: this.#saldo,
      metadata: { diferencia } });
    return this.#saldo;
  }

  serializarCuenta() { return { ...this.serializarBase(), saldo: this.#saldo }; }
  getResumen() { return { id: this.id, tipo: this.tipo, alias: this.alias, saldo: this.#saldo, disponible: this.consultarDisponible() }; }
}
