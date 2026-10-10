import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../js/services/AuthService.js';

function crearAuthEnMemoria() {
  const state = { version: 2, clientes: [], credenciales: [], productos: [] };
  const storage = { guardar() {}, limpiar() {}, cargar() { return state; } };
  return { state, auth: new AuthService(state, storage) };
}

test('Registro valida unicidad y login bloquea tras tres fallos; administrador puede desbloquear', async () => {
  const { state, auth } = crearAuthEnMemoria();
  const client = await auth.registrar({
    identificacion: '10001', nombreCompleto: 'Cliente de Prueba', celular: '3001234567',
    nombreUsuario: 'cliente.test', contrasena: 'PruebaSegura123!', confirmarContrasena: 'PruebaSegura123!'
  });
  assert.equal(client.nombreUsuario, 'cliente.test');
  assert.equal(state.credenciales.length, 1);
  assert.notEqual(state.credenciales[0].hash, 'PruebaSegura123!');

  await assert.rejects(auth.registrar({
    identificacion: '10002', nombreCompleto: 'Otro Cliente', celular: '3001234568',
    nombreUsuario: 'CLIENTE.TEST', contrasena: 'PruebaSegura123!', confirmarContrasena: 'PruebaSegura123!'
  }), /nombre de usuario ya está registrado/);

  for (let intento = 1; intento <= 2; intento += 1) {
    await assert.rejects(auth.iniciarSesion('cliente.test', 'ClaveIncorrecta123!'), error => {
      assert.equal(error.intentosRestantes, 3 - intento);
      return true;
    });
  }
  await assert.rejects(auth.iniciarSesion('cliente.test', 'ClaveIncorrecta123!'), /bloqueado después de tres intentos/);
  assert.equal(auth.obtenerCredencialPorCliente(client.id).bloqueado, true);
  await assert.rejects(auth.iniciarSesion('cliente.test', 'PruebaSegura123!'), /está bloqueado/);

  auth.desbloquearUsuario(client.id);
  const sesion = await auth.iniciarSesion('cliente.test', 'PruebaSegura123!');
  assert.equal(sesion.id, client.id);
  assert.equal(auth.obtenerCredencialPorCliente(client.id).intentosFallidos, 0);
});
