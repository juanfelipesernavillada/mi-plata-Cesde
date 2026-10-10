import { Cliente } from '../models/Cliente.js';
import { productoDesdeJSON } from '../models/ProductoFactory.js';

export class StorageService {
  #key = 'mi-plata:database:v2';

  tieneDatos() {
    try { return Boolean(localStorage.getItem(this.#key)); } catch { return false; }
  }

  cargar() {
    let serializado;
    try { serializado = localStorage.getItem(this.#key); }
    catch { throw new Error('No se pudo acceder a localStorage. Habilita el almacenamiento del navegador.'); }
    if (!serializado) return null;
    try {
      const datos = JSON.parse(serializado);
      return {
        version: 2,
        clientes: (datos.clientes || []).map(c => Cliente.fromJSON(c)),
        credenciales: (datos.credenciales || []).map(c => structuredClone(c)),
        productos: (datos.productos || []).map(p => productoDesdeJSON(p))
      };
    } catch (error) {
      throw new Error(`Los datos locales no se pudieron reconstruir: ${error.message}. Puedes reiniciar la demostración para crear datos nuevos.`);
    }
  }

  guardar(estado) {
    try {
      localStorage.setItem(this.#key, JSON.stringify({
        version: 2,
        clientes: estado.clientes.map(c => c.toJSON()),
        credenciales: estado.credenciales.map(c => structuredClone(c)),
        productos: estado.productos.map(p => p.toJSON())
      }));
    } catch (error) {
      if (error?.name === 'QuotaExceededError') throw new Error('El almacenamiento local del navegador está lleno.');
      throw new Error('No se pudieron guardar los cambios en localStorage.');
    }
  }

  limpiar() {
    try { localStorage.removeItem(this.#key); }
    catch { throw new Error('No se pudo limpiar la demostración del navegador.'); }
  }
}
