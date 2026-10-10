import { Movimiento } from './Movimiento.js';
import { crearId } from '../utils.js';

export class ProductoBancario {
  #id;
  #clienteId;
  #alias;
  #activo;
  #fechaCreacion;
  #movimientos;

  constructor({ id = crearId('prod'), clienteId, alias, activo = true, fechaCreacion = new Date().toISOString(), movimientos = [] } = {}) {
    if (new.target === ProductoBancario) throw new Error('ProductoBancario es una clase abstracta.');
    if (!clienteId) throw new Error('El producto debe estar asociado a un cliente.');
    this.#id = id;
    this.#clienteId = clienteId;
    this.#alias = alias || 'Producto Mi Plata';
    this.#activo = Boolean(activo);
    this.#fechaCreacion = new Date(fechaCreacion).toISOString();
    this.#movimientos = movimientos.map(m => m instanceof Movimiento ? m : Movimiento.fromJSON(m));
  }

  get id() { return this.#id; }
  get clienteId() { return this.#clienteId; }
  get alias() { return this.#alias; }
  get activo() { return this.#activo; }
  get fechaCreacion() { return this.#fechaCreacion; }
  get movimientos() { return this.#movimientos.map(m => Movimiento.fromJSON(m.toJSON())); }
  get tipo() { return this.constructor.name; }

  cambiarAlias(alias) {
    const limpio = String(alias || '').trim();
    if (!limpio) throw new Error('El alias no puede quedar vacío.');
    this.#alias = limpio;
  }

  activar() { this.#activo = true; }
  desactivar() { this.#activo = false; }

  registrarMovimiento(datos) {
    const movimiento = new Movimiento(datos);
    this.#movimientos.push(movimiento);
    return movimiento;
  }

  obtenerMovimientos() {
    return this.#movimientos.map(m => Movimiento.fromJSON(m.toJSON())).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  serializarBase() {
    return { id: this.#id, clienteId: this.#clienteId, alias: this.#alias, activo: this.#activo,
      fechaCreacion: this.#fechaCreacion, movimientos: this.#movimientos.map(m => m.toJSON()) };
  }

  getResumen() { throw new Error('Cada producto debe implementar getResumen().'); }
}

