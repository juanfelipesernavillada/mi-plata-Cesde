import { crearId } from '../utils.js';

export class Cliente {
  #id;
  #identificacion;
  #nombreCompleto;
  #celular;
  #nombreUsuario;
  #rol;
  #activo;
  #fechaCreacion;

  constructor({ id = crearId('cli'), identificacion, nombreCompleto, celular, nombreUsuario, rol = 'cliente', activo = true, fechaCreacion = new Date().toISOString() }) {
    if (!identificacion || !nombreCompleto || !celular || !nombreUsuario) throw new Error('Faltan datos obligatorios del cliente.');
    this.#id = id;
    this.#identificacion = String(identificacion).trim();
    this.#nombreCompleto = String(nombreCompleto).trim();
    this.#celular = String(celular).trim();
    this.#nombreUsuario = String(nombreUsuario).trim();
    this.#rol = rol === 'administrador' ? 'administrador' : 'cliente';
    this.#activo = Boolean(activo);
    this.#fechaCreacion = new Date(fechaCreacion).toISOString();
  }

  get id() { return this.#id; }
  get identificacion() { return this.#identificacion; }
  get nombreCompleto() { return this.#nombreCompleto; }
  get celular() { return this.#celular; }
  get nombreUsuario() { return this.#nombreUsuario; }
  get rol() { return this.#rol; }
  get activo() { return this.#activo; }
  get fechaCreacion() { return this.#fechaCreacion; }

  actualizarDatos({ identificacion = this.#identificacion, nombreCompleto = this.#nombreCompleto, celular = this.#celular, nombreUsuario = this.#nombreUsuario }) {
    const valores = [identificacion, nombreCompleto, celular, nombreUsuario].map(v => String(v ?? '').trim());
    if (valores.some(v => !v)) throw new Error('Todos los datos del perfil son obligatorios.');
    [this.#identificacion, this.#nombreCompleto, this.#celular, this.#nombreUsuario] = valores;
  }

  cambiarRol(rol) {
    if (!['cliente', 'administrador'].includes(rol)) throw new Error('Rol no válido.');
    this.#rol = rol;
  }
  activar() { this.#activo = true; }
  desactivar() { this.#activo = false; }

  toJSON() {
    return { id: this.#id, identificacion: this.#identificacion, nombreCompleto: this.#nombreCompleto,
      celular: this.#celular, nombreUsuario: this.#nombreUsuario, rol: this.#rol, activo: this.#activo, fechaCreacion: this.#fechaCreacion };
  }
  static fromJSON(datos) { return new Cliente(datos); }
}
