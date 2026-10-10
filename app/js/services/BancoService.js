import { Cuenta } from '../models/Cuenta.js';
import { CuentaAhorros } from '../models/CuentaAhorros.js';
import { CuentaCorriente } from '../models/CuentaCorriente.js';
import { TarjetaCredito } from '../models/TarjetaCredito.js';
import { crearId, validarMonto } from '../utils.js';

export class BancoService {
  constructor(estado, storage) {
    this.estado = estado;
    this.storage = storage;
  }

  #guardar() { this.storage.guardar(this.estado); }
  obtenerProducto(id) { return this.estado.productos.find(p => p.id === id) || null; }
  obtenerCliente(id) { return this.estado.clientes.find(c => c.id === id) || null; }
  productosDeCliente(clienteId) { return this.estado.productos.filter(p => p.clienteId === clienteId && p.activo); }
  cuentasDeCliente(clienteId) { return this.productosDeCliente(clienteId).filter(p => p instanceof Cuenta); }
  tarjetasDeCliente(clienteId) { return this.productosDeCliente(clienteId).filter(p => p instanceof TarjetaCredito); }
  todasLasCuentas() { return this.estado.productos.filter(p => p instanceof Cuenta && p.activo); }

  asegurarProductosIniciales(clienteId) {
    const actuales = this.productosDeCliente(clienteId);
    if (!actuales.some(p => p instanceof CuentaAhorros)) this.estado.productos.push(new CuentaAhorros({ clienteId, alias: 'Cuenta de ahorros', saldo: 0 }));
    if (!actuales.some(p => p instanceof CuentaCorriente)) this.estado.productos.push(new CuentaCorriente({ clienteId, alias: 'Cuenta corriente', saldo: 0 }));
    if (!actuales.some(p => p instanceof TarjetaCredito)) this.estado.productos.push(new TarjetaCredito({ clienteId, alias: 'Tarjeta de crédito', cupoTotal: 0 }));
    this.#guardar();
  }

  consultarSaldo(clienteId, productoId) {
    const producto = this.#productoDeCliente(clienteId, productoId);
    if (!(producto instanceof Cuenta)) throw new Error('Selecciona una cuenta de ahorros o corriente.');
    return { saldo: producto.consultarSaldo(), disponible: producto.consultarDisponible(), tipo: producto.tipo, alias: producto.alias };
  }

  consignar(clienteId, productoId, valor) {
    const cuenta = this.#cuentaDeCliente(clienteId, productoId);
    cuenta.abonar(validarMonto(valor, 'La consignación'), { tipo: 'CONSIGNACION', descripcion: 'Consignación realizada por el cliente' });
    this.#guardar();
    return cuenta.consultarSaldo();
  }

  retirar(clienteId, productoId, valor) {
    const cuenta = this.#cuentaDeCliente(clienteId, productoId);
    cuenta.retirar(validarMonto(valor, 'El retiro'));
    this.#guardar();
    return cuenta.consultarSaldo();
  }

  transferir(clienteId, origenId, destinoId, valor) {
    const monto = validarMonto(valor, 'La transferencia');
    if (origenId === destinoId) throw new Error('No puedes transferir al mismo producto de origen.');
    const origen = this.#cuentaDeCliente(clienteId, origenId);
    const destino = this.obtenerProducto(destinoId);
    if (!(destino instanceof Cuenta) || !destino.activo) throw new Error('El destino debe ser una cuenta bancaria activa. Para pagar una tarjeta usa el módulo de tarjeta de crédito.');
    if (!origen.puedeRetirar(monto)) throw new Error('El monto supera el saldo disponible o el sobregiro permitido en la cuenta de origen.');
    const clienteDestino = this.obtenerCliente(destino.clienteId);
    if (!clienteDestino?.activo) throw new Error('El titular de la cuenta de destino no está activo.');

    const referencia = crearId('transfer');
    origen.debitar(monto, { tipo: 'TRANSFERENCIA_SALIENTE', descripcion: `Transferencia a ${clienteDestino.nombreUsuario} · ${destino.alias}`, referencia,
      metadata: { destinoId: destino.id, destinoUsuario: clienteDestino.nombreUsuario } });
    destino.abonar(monto, { tipo: 'TRANSFERENCIA_ENTRANTE', descripcion: `Transferencia recibida desde ${this.obtenerCliente(clienteId)?.nombreUsuario}`, referencia,
      metadata: { origenId: origen.id, origenUsuario: this.obtenerCliente(clienteId)?.nombreUsuario } });
    this.#guardar();
    return { monto, referencia, destinoUsuario: clienteDestino.nombreUsuario };
  }

  comprarConTarjeta(clienteId, tarjetaId, valor, numeroCuotas, descripcion) {
    const tarjeta = this.#productoDeCliente(clienteId, tarjetaId);
    if (!(tarjeta instanceof TarjetaCredito)) throw new Error('Selecciona una tarjeta de crédito propia.');
    const compra = tarjeta.registrarCompra(validarMonto(valor, 'La compra'), Number(numeroCuotas), descripcion);
    this.#guardar();
    return compra;
  }

  pagarCuota(clienteId, cuentaOrigenId, tarjetaId, compraId) {
    const cuenta = this.#cuentaDeCliente(clienteId, cuentaOrigenId);
    const tarjeta = this.#productoDeCliente(clienteId, tarjetaId);
    if (!(tarjeta instanceof TarjetaCredito)) throw new Error('Selecciona una tarjeta propia.');
    const cuota = tarjeta.siguienteCuota(compraId);
    if (!cuenta.puedeRetirar(cuota.valor)) throw new Error('La cuenta seleccionada no tiene saldo/disponible suficiente para pagar la cuota.');
    cuenta.debitar(cuota.valor, { tipo: 'PAGO_TARJETA', descripcion: `Pago de tarjeta de crédito · ${tarjeta.alias}`, referencia: compraId,
      metadata: { tarjetaId, cuota: cuota.numeroCuota, cuotasTotales: cuota.cuotasTotales } });
    const pagada = tarjeta.pagarCuota(compraId);
    this.#guardar();
    return pagada;
  }

  movimientosDeCliente(clienteId) {
    return this.productosDeCliente(clienteId).flatMap(producto => producto.obtenerMovimientos().map(mov => ({
      ...mov.toJSON(), productoId: producto.id, productoTipo: producto.tipo, productoAlias: producto.alias
    }))).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  crearProductoAdministrativo(clienteId, tipo, alias, valorInicial) {
    if (!this.obtenerCliente(clienteId)) throw new Error('Selecciona un cliente existente.');
    const nombre = String(alias || '').trim() || ({ CuentaAhorros: 'Cuenta de ahorros', CuentaCorriente: 'Cuenta corriente', TarjetaCredito: 'Tarjeta de crédito' }[tipo] || 'Producto Mi Plata');
    let producto;
    if (tipo === 'CuentaAhorros') producto = new CuentaAhorros({ clienteId, alias: nombre, saldo: Number(valorInicial) || 0 });
    else if (tipo === 'CuentaCorriente') producto = new CuentaCorriente({ clienteId, alias: nombre, saldo: Number(valorInicial) || 0 });
    else if (tipo === 'TarjetaCredito') producto = new TarjetaCredito({ clienteId, alias: nombre, cupoTotal: Number(valorInicial) || 0 });
    else throw new Error('Tipo de producto no válido.');
    const valor = Number(valorInicial) || 0;
    if (!Number.isSafeInteger(valor) || valor < 0) throw new Error('El saldo o cupo inicial debe ser un entero de pesos igual o mayor que cero.');
    if (valor > 0) {
      if (producto instanceof Cuenta) producto.ajustarSaldoDemostrativo(valor, 'Saldo inicial ficticio asignado por administración');
      else producto.registrarMovimiento({ tipo: 'CUPO_DEMO', descripcion: 'Cupo de demostración asignado por administración', valor, saldoDespues: null });
    }
    this.estado.productos.push(producto);
    this.#guardar();
    return producto;
  }

  ajustarProductoAdministrativo(productoId, valor) {
    const producto = this.obtenerProducto(productoId);
    if (!producto || !producto.activo) throw new Error('No se encontró un producto activo.');
    const numero = Number(valor);
    if (!Number.isSafeInteger(numero) || numero < 0) throw new Error('El valor debe ser un entero de pesos igual o mayor a cero.');
    if (producto instanceof Cuenta) producto.ajustarSaldoDemostrativo(numero);
    else if (producto instanceof TarjetaCredito) producto.ajustarCupoTotal(numero);
    else throw new Error('Tipo de producto no soportado.');
    this.#guardar();
    return producto;
  }

  eliminarProductoAdministrativo(productoId) {
    const producto = this.obtenerProducto(productoId);
    if (!producto) throw new Error('No se encontró el producto.');
    if (producto instanceof TarjetaCredito && producto.deudaActual > 0) throw new Error('No puedes eliminar una tarjeta que tiene deuda pendiente.');
    this.estado.productos = this.estado.productos.filter(p => p.id !== productoId);
    this.#guardar();
  }

  #productoDeCliente(clienteId, productoId) {
    const producto = this.obtenerProducto(productoId);
    if (!producto || producto.clienteId !== clienteId || !producto.activo) throw new Error('El producto seleccionado no pertenece a tu usuario o está inactivo.');
    return producto;
  }
  #cuentaDeCliente(clienteId, productoId) {
    const producto = this.#productoDeCliente(clienteId, productoId);
    if (!(producto instanceof Cuenta)) throw new Error('Selecciona una cuenta de ahorros o corriente.');
    return producto;
  }
}
