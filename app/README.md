# Mi Plata — Aplicación principal

Aplicación web académica en JavaScript, HTML y CSS que implementa la lista de chequeo del proyecto de aula de CESDE. No utiliza backend, servidor de datos ni dependencias de terceros: la información de demostración se persiste en `localStorage`.

> **Aviso:** es una simulación para evaluación académica. No es un banco real, no conecta con sistemas financieros ni debe contener datos personales verdaderos. La autenticación y los permisos se ejecutan íntegramente en el navegador, por lo que no constituyen seguridad adecuada para producción.

## Requisitos

- Navegador actualizado compatible con módulos de JavaScript y Web Crypto.
- VS Code con la extensión **Live Server** (o cualquier servidor estático local). Se recomienda abrir `index.html` mediante `http://localhost` o HTTPS para habilitar Web Crypto de manera consistente.
- No requiere `npm install`; `package.json` se incluye solo para ejecutar las pruebas unitarias con Node.js.

## Cómo ejecutar

1. Abre la carpeta `app/` en Visual Studio Code.
2. Haz clic derecho sobre `index.html` y elige **Open with Live Server**.
3. En la pantalla de ingreso utiliza una de estas credenciales de demostración:

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `Admin123!` |
| Cliente 1 | `cliente1` | `Cliente123!` |
| Cliente 2 | `cliente2` | `Cliente123!` |

Los datos iniciales son ficticios. El administrador puede crear, editar, desactivar, desbloquear y eliminar clientes; asignar productos; preparar saldos/cupos para pruebas; y gestionar productos de demostración. El tercer intento fallido bloquea el usuario hasta que un administrador lo desbloquee. Si se bloquea el usuario administrador o se dañan los datos locales, se puede restablecer el conjunto inicial desde la pantalla de login; **esto borra los datos que se hayan creado en ese navegador**.

## Módulos implementados

- Registro con identificación, nombre, celular, usuario único, contraseña y confirmación.
- Inicio de sesión con contador visible y bloqueo persistente tras tres fallos.
- CRUD administrativo de usuarios y asignación/ajuste de productos ficticios.
- Panel de cliente, consulta de saldos, consignaciones, retiros, movimientos, transferencias, perfil y cambio de contraseña.
- Cuenta de ahorros, cuenta corriente y tarjeta de crédito con compras, cuotas y pago de cuotas.
- Orden cronológico descendente de movimientos.
- Persistencia local y reconstrucción de instancias de clases después de recargar.
- Diseño responsive.

## Reglas de negocio y supuestos explícitos

### Cuenta de ahorros

Se conserva la tasa académica que exige CESDE: **1,5 % mensual**, liquidada al momento de una salida de dinero. Como la guía no define una fórmula temporal, esta simulación utiliza interés simple prorrateado por días sobre períodos de 30 días y sobre el saldo que estuvo vigente durante cada intervalo entre operaciones. El interés pendiente se abona cuando ocurre un débito válido (retiro, transferencia saliente o pago de cuota desde ahorros). Antes de liquidar intereses se verifica que el valor de salida no supere el saldo previo, de acuerdo con la restricción del enunciado.

Esta fórmula es una convención explícita para que la evaluación sea reproducible; **no es una fórmula obligatoria universal para todas las cuentas de ahorro colombianas**. El artículo 128 del Estatuto Orgánico del Sistema Financiero señala que las tasas y su forma de liquidación para depósitos de ahorro son fijadas por la entidad depositaria e informadas al público bajo la reglamentación aplicable. Fuente oficial: [Función Pública — Decreto 663 de 1993, artículo 128](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=1348).

### Cuenta corriente

Se implementa el sobregiro del **20 % del saldo positivo actual**, como en el ejemplo del enunciado. No es un derecho legal universal a obtener sobregiro ni se presenta como una facilidad otorgada por una entidad real.

### Tarjeta de crédito

La app aplica **exactamente las tasas de la guía académica**: hasta 2 cuotas, 0 %; de 3 a 6 cuotas, 1,9 % mensual; 7 o más cuotas, 2,3 % mensual. El pago mensual se calcula con la fórmula de cuota fija entregada por el profesor, y la interfaz muestra el pago mensual estimado de cada compra.

**Aclaración legal:** una tasa efectiva mensual del 2,3 %, capitalizada durante 12 meses, equivale aproximadamente a **31,37 % efectivo anual**. La Superintendencia Financiera publicó una tasa de usura de referencia del **28,59 % E.A. para crédito de consumo y ordinario durante octubre de 2026** ([fuente oficial SFC, vigencia octubre de 2026](https://www.superfinanciera.gov.co/publicaciones/10116267/superfinanciera-certifica-el-interes-bancario-corriente/)). La app mantiene el 2,3 % mensual porque es el valor explícito del ejercicio y la rúbrica pide evidenciarlo; por tanto, **este cálculo académico no debe interpretarse como una oferta real ni como validación de legalidad para un crédito**. En un producto financiero real se debe verificar la modalidad, la vigencia normativa, los cargos incluidos y los topes aplicables al momento de contratar.

### Cupos y saldos

No hay un valor universal de cupo de tarjeta que deba asignarse a todo cliente. Para la demostración, el panel administrativo permite preparar un cupo ficticio y unos saldos iniciales de prueba. Los usuarios de demostración ya tienen valores precargados; los usuarios nuevos reciben cuentas en cero y cupo de tarjeta cero hasta asignación administrativa. No se hace una evaluación real de identidad, ingresos, obligaciones, riesgo, capacidad de pago ni aprobación crediticia. Esos valores son escenarios de prueba, no recomendaciones de cupo ni decisiones basadas en una norma financiera.

### Seguridad y almacenamiento

Las contraseñas se derivan con PBKDF2/SHA-256 y sal aleatoria mediante Web Crypto antes de guardarse; no se almacenan como texto plano. Aun así, como `localStorage` y el código se encuentran bajo control del navegador del estudiante, cualquier usuario con acceso al equipo/devtools puede alterar los datos. La solución no es apropiada para clientes reales ni reemplaza un backend.

## Estructura

```text
app/
├── index.html
├── README.md
├── package.json
├── assets/mi-plata-mark.svg
├── css/styles.css
├── js/main.js
├── js/utils.js
├── js/models/
│   ├── Cliente.js
│   ├── Movimiento.js
│   ├── ProductoBancario.js
│   ├── ProductoFactory.js
│   ├── Cuenta.js
│   ├── CuentaAhorros.js
│   ├── CuentaCorriente.js
│   └── TarjetaCredito.js
├── js/services/
│   ├── StorageService.js
│   ├── AuthService.js
│   ├── BancoService.js
│   ├── DemoData.js
│   └── passwordCrypto.js
└── tests/
    ├── models.test.js
    └── auth.test.js
```

## Ejecutar pruebas unitarias

Si tienes Node.js instalado:

```powershell
cd app
npm test
```

Las pruebas cubren las clases, el sobregiro, el interés de ahorros, las tasas exactas de la guía, el cálculo de cuotas, el cupo de la tarjeta, las transferencias, la reconstrucción de instancias y el bloqueo de autenticación tras tres intentos fallidos.

## Alcance de esta versión

La persistencia es local y específica del navegador. No hay API, base de datos remota, envío de correos, validación de identidad, conexión con redes de pagos ni seguridad de servidor. Esas limitaciones se informan para no presentar la simulación como un banco listo para producción.
