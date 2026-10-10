import { Cliente } from '../models/Cliente.js';
import { CuentaAhorros } from '../models/CuentaAhorros.js';
import { CuentaCorriente } from '../models/CuentaCorriente.js';
import { TarjetaCredito } from '../models/TarjetaCredito.js';
import { crearCredencial } from './passwordCrypto.js';

const diasAntes = cantidad => new Date(Date.now() - cantidad * 24 * 60 * 60 * 1000).toISOString();

export async function crearDatosDemostracion() {
  const administrador = new Cliente({ identificacion: '9000000001', nombreCompleto: 'Administración Mi Plata', celular: '3000000000', nombreUsuario: 'admin', rol: 'administrador' });
  const clienteUno = new Cliente({ identificacion: '1000000001', nombreCompleto: 'Andrea Demo', celular: '3000000001', nombreUsuario: 'cliente1' });
  const clienteDos = new Cliente({ identificacion: '1000000002', nombreCompleto: 'Carlos Demo', celular: '3000000002', nombreUsuario: 'cliente2' });

  const productos = [
    new CuentaAhorros({ clienteId: clienteUno.id, alias: 'Ahorros principal', saldo: 2500000, fechaCreacion: diasAntes(90), fechaUltimoCalculo: diasAntes(32) }),
    new CuentaCorriente({ clienteId: clienteUno.id, alias: 'Corriente diaria', saldo: 1000000, fechaCreacion: diasAntes(90) }),
    new TarjetaCredito({ clienteId: clienteUno.id, alias: 'Tarjeta Mi Plata', cupoTotal: 2000000, fechaCreacion: diasAntes(90) }),
    new CuentaAhorros({ clienteId: clienteDos.id, alias: 'Ahorros personal', saldo: 900000, fechaCreacion: diasAntes(75) }),
    new CuentaCorriente({ clienteId: clienteDos.id, alias: 'Corriente personal', saldo: 250000, fechaCreacion: diasAntes(75) }),
    new TarjetaCredito({ clienteId: clienteDos.id, alias: 'Tarjeta Mi Plata', cupoTotal: 1500000, fechaCreacion: diasAntes(75) })
  ];

  const credenciales = [
    { clienteId: administrador.id, ...(await crearCredencial('Admin123!')) },
    { clienteId: clienteUno.id, ...(await crearCredencial('Cliente123!')) },
    { clienteId: clienteDos.id, ...(await crearCredencial('Cliente123!')) }
  ];

  return { version: 2, clientes: [administrador, clienteUno, clienteDos], credenciales, productos };
}
