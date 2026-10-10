import { CuentaAhorros } from './CuentaAhorros.js';
import { CuentaCorriente } from './CuentaCorriente.js';
import { TarjetaCredito } from './TarjetaCredito.js';

export function productoDesdeJSON(datos) {
  switch (datos.tipo) {
    case 'CuentaAhorros': return CuentaAhorros.fromJSON(datos);
    case 'CuentaCorriente': return CuentaCorriente.fromJSON(datos);
    case 'TarjetaCredito': return TarjetaCredito.fromJSON(datos);
    default: throw new Error(`Tipo de producto desconocido: ${datos.tipo}`);
  }
}
