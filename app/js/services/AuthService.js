import { Cliente } from '../models/Cliente.js';
import { crearCredencial, verificarContrasena } from './passwordCrypto.js';
import { crearId } from '../utils.js';

export class AuthService {
  constructor(estado, storage) {
    this.estado = estado;
    this.storage = storage;
  }

  #guardar() { this.storage.guardar(this.estado); }
  obtenerClientePorId(id) { return this.estado.clientes.find(cliente => cliente.id === id) || null; }
  obtenerCredencialPorCliente(id) { return this.estado.credenciales.find(item => item.clienteId === id) || null; }
  listarUsuarios() { return [...this.estado.clientes].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)); }

  #validarDatos(datos, exigirContrasena = true) {
    const identificacion = String(datos.identificacion || '').trim();
    const nombreCompleto = String(datos.nombreCompleto || '').trim();
    const celular = String(datos.celular || '').trim();
    const nombreUsuario = String(datos.nombreUsuario || '').trim();
    if (!identificacion || !nombreCompleto || !celular || !nombreUsuario) throw new Error('Completa identificación, nombre, celular y usuario.');
    if (!/^[\p{L}\p{N}._-]{3,30}$/u.test(nombreUsuario)) throw new Error('El usuario debe tener entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo.');
    if (exigirContrasena && (typeof datos.contrasena !== 'string' || datos.contrasena.length < 8)) throw new Error('La contraseña debe tener al menos 8 caracteres.');
    return { identificacion, nombreCompleto, celular, nombreUsuario };
  }

  #validarUnicidad(datos, excluirId = null) {
    const username = datos.nombreUsuario.toLocaleLowerCase();
    const idNumber = datos.identificacion.toLocaleLowerCase();
    if (this.estado.clientes.some(c => c.id !== excluirId && c.nombreUsuario.toLocaleLowerCase() === username)) throw new Error('Ese nombre de usuario ya está registrado. Elige otro.');
    if (this.estado.clientes.some(c => c.id !== excluirId && c.identificacion.toLocaleLowerCase() === idNumber)) throw new Error('Ya existe un usuario con esa identificación.');
  }

  async registrar(datos) {
    const campos = this.#validarDatos(datos, true);
    this.#validarUnicidad(campos);
    if (datos.contrasena !== datos.confirmarContrasena) throw new Error('La contraseña y su confirmación no coinciden.');
    const cliente = new Cliente({ ...campos, rol: 'cliente' });
    const credencial = { clienteId: cliente.id, ...(await crearCredencial(datos.contrasena)) };
    this.estado.clientes.push(cliente);
    this.estado.credenciales.push(credencial);
    this.#guardar();
    return cliente;
  }

  async iniciarSesion(nombreUsuario, contrasena) {
    const nombre = String(nombreUsuario || '').trim().toLocaleLowerCase();
    const cliente = this.estado.clientes.find(c => c.nombreUsuario.toLocaleLowerCase() === nombre);
    const credencial = cliente && this.obtenerCredencialPorCliente(cliente.id);
    // Respuesta genérica para evitar revelar si existe un nombre de usuario.
    if (!cliente || !credencial) throw new Error('Usuario o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.');
    if (!cliente.activo) throw new Error('Este usuario está desactivado. Contacta al administrador de la demostración.');
    if (credencial.bloqueado) {
      const error = new Error('Este usuario está bloqueado por alcanzar tres intentos fallidos. Un administrador debe desbloquearlo.');
      error.bloqueado = true;
      throw error;
    }

    const coincide = await verificarContrasena(String(contrasena || ''), credencial);
    if (!coincide) {
      credencial.intentosFallidos = Math.min(3, Number(credencial.intentosFallidos || 0) + 1);
      if (credencial.intentosFallidos >= 3) credencial.bloqueado = true;
      this.#guardar();
      const restantes = Math.max(0, 3 - credencial.intentosFallidos);
      const error = new Error(credencial.bloqueado
        ? 'Usuario bloqueado después de tres intentos fallidos. Un administrador debe desbloquearlo.'
        : `Usuario o contraseña incorrectos. Te quedan ${restantes} ${restantes === 1 ? 'intento' : 'intentos'}.`);
      error.intentosRestantes = restantes;
      error.bloqueado = credencial.bloqueado;
      throw error;
    }

    credencial.intentosFallidos = 0;
    this.#guardar();
    return cliente;
  }

  async crearUsuarioAdministrativo(datos) {
    const campos = this.#validarDatos(datos, true);
    this.#validarUnicidad(campos);
    if (datos.contrasena !== datos.confirmarContrasena) throw new Error('La contraseña y su confirmación no coinciden.');
    const cliente = new Cliente({ ...campos, rol: 'cliente' });
    const credencial = { clienteId: cliente.id, ...(await crearCredencial(datos.contrasena)) };
    this.estado.clientes.push(cliente);
    this.estado.credenciales.push(credencial);
    this.#guardar();
    return cliente;
  }

  actualizarUsuario(clienteId, datos) {
    const cliente = this.obtenerClientePorId(clienteId);
    if (!cliente) throw new Error('No se encontró el usuario que intentas editar.');
    const campos = this.#validarDatos(datos, false);
    this.#validarUnicidad(campos, clienteId);
    cliente.actualizarDatos(campos);
    this.#guardar();
    return cliente;
  }

  async restablecerContrasenaAdministrativa(clienteId, nuevaContrasena) {
    if (String(nuevaContrasena || '').length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    const credencial = this.obtenerCredencialPorCliente(clienteId);
    if (!credencial) throw new Error('No se encontró la credencial de ese usuario.');
    const nueva = await crearCredencial(nuevaContrasena);
    Object.assign(credencial, nueva);
    this.#guardar();
  }

  eliminarUsuario(clienteId, administradorActualId) {
    const cliente = this.obtenerClientePorId(clienteId);
    if (!cliente) throw new Error('No se encontró el usuario.');
    if (cliente.id === administradorActualId) throw new Error('No puedes eliminar el usuario administrador con el que has iniciado sesión.');
    if (cliente.rol === 'administrador' && this.estado.clientes.filter(c => c.rol === 'administrador' && c.activo).length <= 1) {
      throw new Error('No se puede eliminar el último administrador activo.');
    }
    this.estado.clientes = this.estado.clientes.filter(c => c.id !== clienteId);
    this.estado.credenciales = this.estado.credenciales.filter(c => c.clienteId !== clienteId);
    this.estado.productos = this.estado.productos.filter(p => p.clienteId !== clienteId);
    this.#guardar();
  }

  desbloquearUsuario(clienteId) {
    const credencial = this.obtenerCredencialPorCliente(clienteId);
    if (!credencial) throw new Error('No se encontró la credencial de ese usuario.');
    credencial.bloqueado = false;
    credencial.intentosFallidos = 0;
    this.#guardar();
  }

  activarUsuario(clienteId, activo) {
    const cliente = this.obtenerClientePorId(clienteId);
    if (!cliente) throw new Error('No se encontró el usuario.');
    if (cliente.rol === 'administrador' && !activo && this.estado.clientes.filter(c => c.rol === 'administrador' && c.activo).length <= 1) {
      throw new Error('Debe permanecer al menos un administrador activo.');
    }
    activo ? cliente.activar() : cliente.desactivar();
    this.#guardar();
  }

  async cambiarContrasena(clienteId, usuarioActual, contrasenaActual, nuevaContrasena, confirmacion) {
    const cliente = this.obtenerClientePorId(clienteId);
    const credencial = this.obtenerCredencialPorCliente(clienteId);
    if (!cliente || !credencial) throw new Error('No se encontró la cuenta actual.');
    if (String(usuarioActual || '').trim().toLowerCase() !== cliente.nombreUsuario.toLowerCase()) throw new Error('El usuario ingresado no coincide con la sesión actual.');
    if (!await verificarContrasena(String(contrasenaActual || ''), credencial)) throw new Error('La contraseña actual es incorrecta.');
    if (String(nuevaContrasena || '').length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
    if (nuevaContrasena !== confirmacion) throw new Error('La nueva contraseña y su confirmación no coinciden.');
    Object.assign(credencial, await crearCredencial(nuevaContrasena));
    this.#guardar();
  }
}
