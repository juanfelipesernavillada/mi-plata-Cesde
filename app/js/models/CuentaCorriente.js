import { Cuenta } from './Cuenta.js';

const PORCENTAJE_SOBREGIRO = 0.20;

export class CuentaCorriente extends Cuenta {
  get porcentajeSobregiro() { return PORCENTAJE_SOBREGIRO; }
  consultarDisponible() {
    const saldo = this.consultarSaldo();
    return saldo + Math.max(0, saldo) * PORCENTAJE_SOBREGIRO;
  }
  puedeRetirar(valor) {
    const monto = Number(valor);
    return Number.isSafeInteger(monto) && monto > 0 && monto <= this.consultarDisponible();
  }
  getResumen() {
    return { ...super.getResumen(), porcentajeSobregiro: PORCENTAJE_SOBREGIRO, disponible: this.consultarDisponible() };
  }
  toJSON() { return { ...this.serializarCuenta(), tipo: this.tipo, porcentajeSobregiro: PORCENTAJE_SOBREGIRO }; }
  static fromJSON(datos) { return new CuentaCorriente(datos); }
}
