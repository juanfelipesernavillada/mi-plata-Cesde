import { crearId, redondearPesos } from '../utils.js';

export class Movimiento {
  #id;
  #fecha;
  #tipo;
  #descripcion;
  #valor;
  #saldoDespues;
  #referencia;
  #metadata;

  constructor({ id = crearId('mov'), fecha = new Date().toISOString(), tipo, descripcion, valor, saldoDespues = null, referencia = null, metadata = {} }) {
    if (!tipo || !descripcion) throw new Error('El movimiento debe tener tipo y descripción.');
    this.#id = id;
    this.#fecha = new Date(fecha).toISOString();
    this.#tipo = String(tipo);
    this.#descripcion = String(descripcion);
    this.#valor = redondearPesos(valor);
    this.#saldoDespues = saldoDespues === null ? null : redondearPesos(saldoDespues);
    this.#referencia = referencia;
    this.#metadata = structuredClone(metadata || {});
  }

  get id() { return this.#id; }
  get fecha() { return this.#fecha; }
  get tipo() { return this.#tipo; }
  get descripcion() { return this.#descripcion; }
  get valor() { return this.#valor; }
  get saldoDespues() { return this.#saldoDespues; }
  get referencia() { return this.#referencia; }
  get metadata() { return structuredClone(this.#metadata); }

  toJSON() {
    return { id: this.#id, fecha: this.#fecha, tipo: this.#tipo, descripcion: this.#descripcion,
      valor: this.#valor, saldoDespues: this.#saldoDespues, referencia: this.#referencia, metadata: this.#metadata };
  }

  static fromJSON(datos) { return new Movimiento(datos); }
}
