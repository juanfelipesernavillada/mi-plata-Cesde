import test from 'node:test';
import assert from 'node:assert/strict';
import { Cliente } from '../js/models/Cliente.js';
import { Cuenta } from '../js/models/Cuenta.js';
import { CuentaAhorros } from '../js/models/CuentaAhorros.js';
import { CuentaCorriente } from '../js/models/CuentaCorriente.js';
import { TarjetaCredito, determinarTasaCuotas, calcularCuotaMensual, REGLAS_TARJETA } from '../js/models/TarjetaCredito.js';
import { BancoService } from '../js/services/BancoService.js';

const diasAntes = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const mockStorage = { guardar() {} };

test('Cuenta es abstracta y las clases concretas preservan encapsulamiento', () => {
  assert.throws(() => new Cuenta({ clienteId: 'c1', saldo: 50 }), /abstracta/);
  const cuenta = new CuentaAhorros({ clienteId: 'c1', saldo: 1200 });
  assert.equal(cuenta.consultarSaldo(), 1200);
  assert.equal(Object.hasOwn(cuenta, 'saldo'), false);
});

test('Cuenta de ahorros acumula interés prorrateado y lo abona al retirar', () => {
  const cuenta = new CuentaAhorros({ clienteId: 'c1', saldo: 100000, fechaUltimoCalculo: diasAntes(30) });
  cuenta.retirar(50000);
  assert.equal(cuenta.consultarSaldo(), 51500);
  const tipos = cuenta.obtenerMovimientos().map(m => m.tipo);
  assert.ok(tipos.includes('INTERES_AHORRO'));
  assert.ok(tipos.includes('RETIRO'));
});

test('Cuenta de ahorros no permite retirar por encima del saldo previo', () => {
  const cuenta = new CuentaAhorros({ clienteId: 'c1', saldo: 10000 });
  assert.throws(() => cuenta.retirar(10001), /superar el saldo disponible/);
});

test('Cuenta corriente permite como máximo 20% adicional del saldo positivo', () => {
  const cuenta = new CuentaCorriente({ clienteId: 'c1', saldo: 100000 });
  assert.equal(cuenta.consultarDisponible(), 120000);
  cuenta.retirar(120000);
  assert.equal(cuenta.consultarSaldo(), -20000);
  assert.throws(() => cuenta.retirar(1), /sobregiro|disponible/i);
});

test('Tarjeta calcula las tasas de la guía académica y la cuota sin interés', () => {
  assert.equal(determinarTasaCuotas(1), 0);
  assert.equal(determinarTasaCuotas(2), 0);
  assert.equal(determinarTasaCuotas(3), 0.019);
  assert.equal(determinarTasaCuotas(6), 0.019);
  assert.equal(determinarTasaCuotas(7), 0.023);
  assert.equal(calcularCuotaMensual(120000, 0, 2), 60000);
  assert.ok(calcularCuotaMensual(120000, 0.019, 3) > 40000);
  assert.equal(REGLAS_TARJETA.tasaSieteOMas, 0.023);
});

test('Tarjeta rechaza compras superiores al cupo y mantiene compras a cuotas', () => {
  const tarjeta = new TarjetaCredito({ clienteId: 'c1', alias: 'Prueba', cupoTotal: 300000 });
  const compra = tarjeta.registrarCompra(150000, 3, 'Compra unitaria');
  assert.equal(tarjeta.deudaActual, 150000);
  assert.equal(tarjeta.cupoDisponible, 150000);
  assert.ok(compra.cuotaMensual > 0);
  assert.throws(() => tarjeta.registrarCompra(200000, 3), /cupo disponible/);
  const cuota = tarjeta.pagarCuota(compra.id);
  assert.ok(cuota.valor > 0);
  assert.ok(tarjeta.deudaActual < 150000);
});

test('Transferir desde ahorros liquida interés pendiente y guarda ambas trazas', () => {
  const cliente1 = new Cliente({ identificacion: '11', nombreCompleto: 'Uno Demo', celular: '3000000011', nombreUsuario: 'uno2' });
  const cliente2 = new Cliente({ identificacion: '22', nombreCompleto: 'Dos Demo', celular: '3000000022', nombreUsuario: 'dos2' });
  const origen = new CuentaAhorros({ clienteId: cliente1.id, saldo: 100000, fechaUltimoCalculo: diasAntes(30) });
  const destino = new CuentaCorriente({ clienteId: cliente2.id, saldo: 0 });
  const banco = new BancoService({ clientes: [cliente1, cliente2], credenciales: [], productos: [origen, destino] }, mockStorage);
  banco.transferir(cliente1.id, origen.id, destino.id, 10000);
  assert.equal(origen.consultarSaldo(), 91500);
  assert.equal(destino.consultarSaldo(), 10000);
  assert.ok(origen.obtenerMovimientos().some(m => m.tipo === 'INTERES_AHORRO'));
  assert.ok(origen.obtenerMovimientos().some(m => m.tipo === 'TRANSFERENCIA_SALIENTE'));
});

test('Las tasas de la tarjeta siguen exactamente la guía de CESDE', () => {
  assert.equal(determinarTasaCuotas(1), 0);
  assert.equal(determinarTasaCuotas(2), 0);
  assert.equal(determinarTasaCuotas(3), 0.019);
  assert.equal(determinarTasaCuotas(6), 0.019);
  assert.equal(determinarTasaCuotas(7), 0.023);
  assert.equal(determinarTasaCuotas(60), 0.023);
});

test('Transferencias guardan movimientos en ambas cuentas y bloquean el mismo producto', () => {
  const cliente1 = new Cliente({ identificacion: '1', nombreCompleto: 'Uno Demo', celular: '3000000001', nombreUsuario: 'uno' });
  const cliente2 = new Cliente({ identificacion: '2', nombreCompleto: 'Dos Demo', celular: '3000000002', nombreUsuario: 'dos' });
  const origen = new CuentaAhorros({ clienteId: cliente1.id, saldo: 200000 });
  const destino = new CuentaCorriente({ clienteId: cliente2.id, saldo: 1000 });
  const estado = { clientes: [cliente1, cliente2], credenciales: [], productos: [origen, destino] };
  const banco = new BancoService(estado, mockStorage);
  assert.throws(() => banco.transferir(cliente1.id, origen.id, origen.id, 1000), /mismo producto/);
  banco.transferir(cliente1.id, origen.id, destino.id, 50000);
  assert.equal(origen.consultarSaldo(), 150000);
  assert.equal(destino.consultarSaldo(), 51000);
  assert.ok(origen.obtenerMovimientos().some(m => m.tipo === 'TRANSFERENCIA_SALIENTE'));
  assert.ok(destino.obtenerMovimientos().some(m => m.tipo === 'TRANSFERENCIA_ENTRANTE'));
});

test('La fábrica reconstruye productos serializados conservando las clases', async () => {
  const { productoDesdeJSON } = await import('../js/models/ProductoFactory.js');
  const ahorro = new CuentaAhorros({ clienteId: 'cliente-serial', alias: 'Ahorro serial', saldo: 40000 });
  ahorro.abonar(10000, { tipo: 'CONSIGNACION', descripcion: 'Prueba de serialización' });
  const reconstruida = productoDesdeJSON(JSON.parse(JSON.stringify(ahorro)));
  assert.ok(reconstruida instanceof CuentaAhorros);
  assert.equal(reconstruida.consultarSaldo(), 50000);
  assert.ok(reconstruida.obtenerMovimientos().some(m => m.descripcion === 'Prueba de serialización'));
});
