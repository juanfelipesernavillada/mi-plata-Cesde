# Historias de usuario — Sistema Bancario Mi Plata

**Proyecto:** CESDE · Desarrollo de Software  
**Docente:** Jorge Albeiro Muriel Vélez  
**Equipo:** Juan Felipe Serna Villada y Mateo Quiñones Valencia

## Alcance

Las historias se derivan de la guía del proyecto de aula. La maqueta de la primera entrega se conserva en `docs/maqueta/prototipo/`; la aplicación de demostración se encuentra en `app/`. Las funciones ejecutadas únicamente en el navegador se consideran implementadas para la práctica académica, pero no son un servicio bancario real.

**Prioridad:** Alta = flujo esencial de la evaluación; Media = requisito complementario del flujo; Baja = apoyo de administración o demostración.

## HU-01 — Consultar la presentación y los productos

- **Como** visitante, **quiero** conocer la página de Mi Plata y los productos, **para** entender la propuesta y encontrar las opciones de acceso.
- **Prioridad:** Alta.
- **Dependencias:** identidad visual y navegación pública.
- **Criterios de aceptación:**
  1. La página pública presenta Mi Plata y las acciones de ingresar y registrarse.
  2. Los productos muestran las tres clases bancarias requeridas: ahorro, corriente y tarjeta de crédito.
  3. La interfaz incluye el aviso de simulación académica.

## HU-02 — Registrar un usuario

- **Como** nuevo usuario, **quiero** registrar identificación, nombre completo, celular, usuario y contraseña confirmada, **para** obtener un acceso a la demostración.
- **Prioridad:** Alta.
- **Dependencias:** validación de datos, unicidad y almacenamiento local.
- **Criterios de aceptación:**
  1. El formulario exige todos los campos pedidos por el docente.
  2. La aplicación rechaza usuarios e identificaciones duplicados.
  3. Rechaza contraseñas menores de ocho caracteres o confirmaciones diferentes.
  4. Al completar el registro se crea un cliente con productos demo en cero y se confirma el resultado.

## HU-03 — Iniciar sesión y controlar los intentos

- **Como** cliente registrado, **quiero** autenticarme con mi usuario y contraseña, **para** entrar a mi panel personal.
- **Prioridad:** Alta.
- **Dependencias:** HU-02 y credenciales guardadas.
- **Criterios de aceptación:**
  1. El sistema valida los datos frente a las credenciales registradas.
  2. El contador de fallos es visible.
  3. Al tercer intento fallido el usuario queda bloqueado y recibe un mensaje informativo.
  4. Los intentos y el bloqueo permanecen tras recargar la página y un administrador puede desbloquear al usuario.
  5. Un acceso válido lleva al panel correspondiente al rol del usuario.

## HU-04 — Administrar usuarios

- **Como** administrador de la demostración, **quiero** agregar, editar, desactivar, reactivar, desbloquear y eliminar usuarios, **para** administrar los registros de prueba.
- **Prioridad:** Alta.
- **Dependencias:** cuenta administrativa precargada y persistencia local.
- **Criterios de aceptación:**
  1. Solo la interfaz de un usuario con rol administrador muestra el panel de administración.
  2. Se pueden crear usuarios con todos los datos requeridos y una contraseña inicial.
  3. Se pueden editar los datos registrados y restablecer contraseña.
  4. La eliminación pide confirmación y elimina los productos locales asociados.
  5. No se permite eliminar el usuario administrador que inició sesión ni dejar el sistema sin administradores activos.

## HU-05 — Consultar productos y saldos

- **Como** cliente autenticado, **quiero** consultar los productos asociados, sus saldos, disponibles y cupos, **para** conocer la información financiera de mi usuario de prueba.
- **Prioridad:** Alta.
- **Dependencias:** productos asociados al identificador del cliente.
- **Criterios de aceptación:**
  1. El panel muestra los productos que pertenecen al cliente autenticado.
  2. Las cuentas muestran saldo y disponible; la tarjeta muestra cupo, deuda y cupo disponible.
  3. Los valores de los clientes precargados se identifican como ficticios.

## HU-06 — Consignar dinero

- **Como** cliente, **quiero** consignar un valor positivo en una cuenta propia, **para** aumentar su saldo.
- **Prioridad:** Alta.
- **Dependencias:** HU-05 y selección de cuenta.
- **Criterios de aceptación:**
  1. El valor debe ser un entero de pesos mayor que cero.
  2. Se actualiza el saldo de la cuenta seleccionada.
  3. Se registra un movimiento con fecha, tipo y valor.
  4. La interfaz comunica éxito o el motivo del rechazo.

## HU-07 — Retirar dinero aplicando la regla del producto

- **Como** cliente, **quiero** retirar de una cuenta propia, **para** disponer de dinero respetando las reglas configuradas.
- **Prioridad:** Alta.
- **Dependencias:** HU-05 y clase concreta de cuenta.
- **Criterios de aceptación:**
  1. Se rechazan montos inválidos o retiros que superen el disponible permitido.
  2. En ahorros se liquida el interés acumulado al momento del retiro conforme al supuesto documentado de la aplicación.
  3. En corriente se admite el sobregiro de hasta 20 % del saldo positivo, como indica el enunciado.
  4. Cada retiro genera movimiento y actualiza el saldo.

## HU-08 — Consultar movimientos

- **Como** cliente, **quiero** consultar los movimientos de mis productos, **para** revisar el historial de operaciones.
- **Prioridad:** Alta.
- **Dependencias:** clase Movimiento y registro por producto.
- **Criterios de aceptación:**
  1. Cada movimiento almacena fecha y hora, tipo, descripción y valor.
  2. El historial aparece ordenado por fecha descendente y permite filtrar por producto.
  3. Las transferencias generan un movimiento de salida y otro de entrada con la misma referencia.

## HU-09 — Transferir entre cuentas

- **Como** cliente, **quiero** transferir desde una cuenta propia hacia otra cuenta activa, **para** mover dinero entre mis productos o a otro usuario.
- **Prioridad:** Alta.
- **Dependencias:** HU-05, HU-06, HU-07 y productos de destino existentes.
- **Criterios de aceptación:**
  1. El origen debe pertenecer al cliente autenticado y permitir el débito.
  2. El destino puede pertenecer al mismo titular o a otro usuario activo.
  3. No se permite usar el mismo producto como origen y destino.
  4. El valor debe ser positivo y se actualizan ambos saldos.
  5. Se registra un movimiento en el origen y otro en el destino.

## HU-10 — Comprar con tarjeta de crédito

- **Como** cliente con una tarjeta asignada, **quiero** registrar una compra y elegir el número de cuotas, **para** conocer el valor de la cuota mensual.
- **Prioridad:** Alta.
- **Dependencias:** tarjeta activa con cupo disponible.
- **Criterios de aceptación:**
  1. La compra no puede superar el cupo disponible.
  2. Se acepta un número entero positivo de cuotas; la guía no establece un límite máximo.
  3. Hasta 2 cuotas se calcula tasa académica de 0 %; de 3 a 6, 1,9 % mensual; de 7 en adelante, 2,3 % académico mensual.
  4. La cuota se calcula con la fórmula del enunciado y se aplica exactamente la tasa mensual indicada para cada franja. La aplicación informa que esos cálculos son académicos y no representan una oferta bancaria real.
  5. La compra y su cuota mensual quedan registradas en el historial de la tarjeta.

## HU-11 — Pagar una cuota de tarjeta

- **Como** cliente, **quiero** pagar una cuota pendiente usando una cuenta propia, **para** reducir la deuda de mi tarjeta.
- **Prioridad:** Media.
- **Dependencias:** HU-10 y saldo/disponible suficiente en una cuenta propia.
- **Criterios de aceptación:**
  1. Se muestran las compras con cuotas pendientes y su próximo pago estimado.
  2. El sistema rechaza el pago si la cuenta origen no permite debitar el valor.
  3. El pago reduce el capital pendiente y registra la operación en cuenta y tarjeta.
  4. La compra queda marcada como pagada al completar su plazo.

## HU-12 — Editar perfil y cambiar contraseña

- **Como** cliente autenticado, **quiero** editar mis datos de registro y cambiar mi contraseña, **para** mantener la información de mi usuario de prueba actualizada.
- **Prioridad:** Alta.
- **Dependencias:** sesión de usuario.
- **Criterios de aceptación:**
  1. El perfil permite editar identificación, nombre completo, celular y usuario.
  2. La actualización respeta las reglas de unicidad del usuario y la identificación.
  3. El cambio de contraseña solicita usuario, contraseña actual, clave nueva y confirmación.
  4. La clave nueva se guarda como credencial derivada y no como texto plano.

## HU-13 — Gestionar productos de demostración

- **Como** administrador, **quiero** crear productos y preparar saldos iniciales o cupos ficticios, **para** disponer de escenarios reproducibles de prueba.
- **Prioridad:** Media.
- **Dependencias:** HU-04.
- **Criterios de aceptación:**
  1. Se puede asignar una cuenta de ahorros, cuenta corriente o tarjeta a un usuario.
  2. El saldo/cupo inicial está etiquetado como demostrativo.
  3. No se puede reducir el cupo por debajo de la deuda pendiente.
  4. Una tarjeta con deuda pendiente no puede eliminarse.

## HU-14 — Persistir el estado de la demostración

- **Como** usuario, **quiero** conservar los usuarios, productos y movimientos tras recargar la aplicación, **para** continuar las pruebas sin volver a crearlos.
- **Prioridad:** Alta.
- **Dependencias:** StorageService y `localStorage`.
- **Criterios de aceptación:**
  1. La aplicación guarda las entidades serializadas en el navegador.
  2. Al recargar reconstruye instancias de las clases, manteniendo sus métodos.
  3. Los movimientos y el estado de bloqueo permanecen después de recargar.
  4. La interfaz indica que los datos solo pertenecen al navegador actual.

## HU-15 — Usar la aplicación en diferentes pantallas

- **Como** usuario, **quiero** usar los formularios, navegación y panel desde computador, tableta o celular, **para** completar las operaciones de demostración en diferentes tamaños.
- **Prioridad:** Alta.
- **Dependencias:** HTML semántico y CSS responsive.
- **Criterios de aceptación:**
  1. La navegación y los formularios funcionan con ratón y pantallas táctiles.
  2. No hay desplazamiento horizontal general innecesario en móvil.
  3. Los mensajes de éxito, error o advertencia son visibles y legibles.

## HU-16 — Restablecer los datos de prueba

- **Como** estudiante que realiza la demostración, **quiero** restablecer los usuarios y productos de ejemplo, **para** repetir las pruebas desde un estado conocido.
- **Prioridad:** Baja.
- **Dependencias:** almacenamiento local.
- **Criterios de aceptación:**
  1. La acción advierte que borrará los datos locales actuales.
  2. Tras confirmar se restauran las credenciales, productos y saldos iniciales de prueba.
  3. Se vuelve a solicitar iniciar sesión.

## Trazabilidad de la entrega

| Historia | Módulo principal | Ubicación |
|---|---|---|
| HU-01 | Landing/productos | `app/index.html` |
| HU-02–03 | Registro/login y bloqueo | `app/js/services/AuthService.js` |
| HU-04, HU-13 | Administración de usuarios y productos | `app/js/main.js`, `AuthService.js`, `BancoService.js` |
| HU-05–09 | Productos, consignaciones, retiros, movimientos, transferencias | `app/js/models/` y `BancoService.js` |
| HU-10–11 | Tarjeta, cuotas y pagos | `app/js/models/TarjetaCredito.js`, `BancoService.js` |
| HU-12 | Perfil y cambio de contraseña | `app/js/services/AuthService.js` |
| HU-14 | Persistencia | `app/js/services/StorageService.js` |
| HU-15 | Diseño responsive | `app/css/styles.css` |
| HU-16 | Restaurar datos demo | `app/js/main.js` |
