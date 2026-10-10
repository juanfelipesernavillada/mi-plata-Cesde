# Historias de usuario — Sistema Bancario Mi Plata

## Alcance

Estas historias describen necesidades previstas para el sistema bancario. En la etapa actual, la maqueta solo representa la navegación y algunos mensajes visuales. **Las historias no se consideran implementadas funcionalmente por el hecho de aparecer en el prototipo.**

Prioridades usadas: **Alta** (necesaria para el flujo central), **Media** (aporta valor al flujo) y **Baja** (complementaria o pendiente de definición).

## HU-01 — Consultar la presentación del servicio

- **Como** visitante,
- **quiero** ver la página principal de Mi Plata,
- **para** conocer la propuesta del servicio y encontrar las opciones principales.
- **Prioridad:** Alta.
- **Dependencias:** identidad visual y estructura de navegación.
- **Criterios de aceptación:**
  1. La página muestra el nombre Mi Plata y una descripción de la propuesta.
  2. La navegación permite identificar los accesos a Inicio, Productos, Ingresar y Registrarse.
  3. El contenido se adapta a pantallas pequeñas sin perder las acciones principales.

## HU-02 — Consultar los productos bancarios

- **Como** visitante o cliente,
- **quiero** conocer los productos que ofrece Mi Plata,
- **para** comprender sus diferencias antes de tomar una decisión.
- **Prioridad:** Alta.
- **Dependencias:** definición de los productos que confirme el equipo con el profesor.
- **Criterios de aceptación:**
  1. Se presentan cuenta de ahorros, cuenta corriente y tarjeta de crédito.
  2. Cada producto tiene nombre y descripción comprensible.
  3. No se muestran tasas, comisiones ni condiciones como definitivas mientras no estén confirmadas.

## HU-03 — Visualizar el formulario de registro

- **Como** nuevo usuario,
- **quiero** contar con un formulario de registro,
- **para** conocer los datos requeridos para crear una cuenta de usuario.
- **Prioridad:** Alta.
- **Dependencias:** definición del proceso de registro.
- **Criterios de aceptación:**
  1. El formulario contempla identificación, nombre completo, celular, nombre de usuario, contraseña y confirmación de contraseña.
  2. Los campos requeridos se identifican claramente.
  3. El prototipo informa si las contraseñas escritas no coinciden.
  4. El prototipo no afirma haber creado una cuenta real ni transmite los datos ingresados.

## HU-04 — Iniciar sesión

- **Como** cliente registrado,
- **quiero** ingresar con mi usuario y contraseña,
- **para** acceder a mi espacio personal.
- **Prioridad:** Alta.
- **Dependencias:** HU-03 y futura implementación de autenticación en backend.
- **Criterios de aceptación:**
  1. La interfaz presenta campos para usuario y contraseña.
  2. Se contempla un estado para mensajes de validación o acceso no exitoso.
  3. La interfaz representa un contador de intentos.
  4. La autenticación real, el control de intentos y la protección de credenciales se implementarán en una etapa posterior; la maqueta no valida usuarios reales.

## HU-05 — Consultar el resumen personal

- **Como** cliente autenticado,
- **quiero** visualizar un resumen de mis productos y saldo disponible,
- **para** comprender de forma rápida mi situación bancaria.
- **Prioridad:** Alta.
- **Dependencias:** HU-04, productos asociados al cliente y futura fuente de datos.
- **Criterios de aceptación:**
  1. El panel contempla una sección de saldo y productos.
  2. Los accesos a funciones se distinguen visualmente.
  3. En el prototipo los saldos y productos están identificados como datos de demostración.
  4. En la implementación real, la información deberá corresponder al cliente autenticado.

## HU-06 — Consultar los últimos movimientos

- **Como** cliente autenticado,
- **quiero** revisar los movimientos recientes de mis cuentas,
- **para** hacer seguimiento de la actividad registrada.
- **Prioridad:** Media.
- **Dependencias:** HU-05 y futura clase o entidad Movimiento.
- **Criterios de aceptación:**
  1. El panel contiene una sección de movimientos recientes.
  2. Cada movimiento previsto identifica, como mínimo, una descripción, una fecha y un valor.
  3. La maqueta usa registros ficticios y no permite interpretarlos como movimientos reales.

## HU-07 — Diferenciar los tipos de cuenta

- **Como** visitante o cliente,
- **quiero** consultar la información general de cuenta de ahorros y cuenta corriente,
- **para** identificar las características que las diferencian.
- **Prioridad:** Media.
- **Dependencias:** definición académica de las reglas de cada tipo de cuenta.
- **Criterios de aceptación:**
  1. Cada tipo de cuenta tiene una presentación diferenciada.
  2. Se evitan promesas sobre rendimientos, sobregiros o costos que el equipo no haya confirmado.
  3. El diseño permite ampliar las características cuando estén definidos los requisitos.

## HU-08 — Consultar la tarjeta de crédito

- **Como** visitante o cliente,
- **quiero** conocer la propuesta visual y descripción de la tarjeta de crédito,
- **para** entender que es un producto distinto de las cuentas de depósito.
- **Prioridad:** Media.
- **Dependencias:** definición de las condiciones del producto.
- **Criterios de aceptación:**
  1. La tarjeta se presenta como producto diferenciado.
  2. La maqueta no sugiere que se haya aprobado una solicitud o asignado un cupo real.
  3. Las condiciones definitivas quedan pendientes de los requisitos confirmados.

## HU-09 — Navegar desde distintos dispositivos

- **Como** visitante o cliente,
- **quiero** usar la interfaz desde computador, tableta o celular,
- **para** consultar la información de forma cómoda en el dispositivo disponible.
- **Prioridad:** Alta.
- **Dependencias:** estructura HTML y estilos CSS responsive.
- **Criterios de aceptación:**
  1. La navegación se puede utilizar con ratón o interacción táctil.
  2. El contenido se reorganiza en pantallas estrechas sin desplazamiento horizontal general innecesario.
  3. Los formularios y botones permanecen legibles y utilizables en móvil.

## HU-10 — Mantener la privacidad del acceso

- **Como** cliente,
- **quiero** que mis credenciales y datos de cuenta sean tratados de forma segura,
- **para** reducir el riesgo de acceso no autorizado o divulgación de información.
- **Prioridad:** Alta.
- **Dependencias:** futura autenticación y backend seguros; definición de políticas aplicables.
- **Criterios de aceptación:**
  1. En la implementación funcional, las contraseñas no se almacenarán en texto plano.
  2. Las operaciones protegidas requerirán una sesión autenticada y autorización del servidor.
  3. Las credenciales y datos sensibles no se incluirán en el repositorio.
  4. Estas medidas no se consideran implementadas en la maqueta frontend.

## Trazabilidad resumida

| Historia | Pantalla o elemento relacionado | Estado en esta entrega |
|---|---|---|
| HU-01 | Inicio | Representación visual |
| HU-02 | Productos | Representación visual |
| HU-03 | Registro | Formulario y validaciones locales de demostración |
| HU-04 | Ingresar | Formulario y contador simulados |
| HU-05 | Panel | Datos ficticios |
| HU-06 | Panel / movimientos | Movimientos ficticios |
| HU-07 | Productos / cuentas | Presentación conceptual |
| HU-08 | Productos / tarjeta | Presentación conceptual |
| HU-09 | Todas las pantallas | Adaptación responsive prevista en CSS |
| HU-10 | Futuro sistema | Requisito pendiente de implementación |
