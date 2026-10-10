# Sistema Bancario Mi Plata

**Proyecto de aula — CESDE, Desarrollo de Software**  
**Docente:** Jorge Albeiro Muriel Vélez  
**Integrantes:** Juan Felipe Serna Villada y Mateo Quiñones Valencia

Mi Plata es una aplicación web académica para demostrar programación orientada a objetos con JavaScript y simular un flujo bancario. El repositorio conserva la maqueta aprobada de la primera fase y agrega la aplicación principal en una carpeta independiente.

> **Aviso importante:** esta aplicación es una simulación educativa. No es una entidad financiera, no conecta con bancos ni redes de pago y no debe utilizarse con datos personales verdaderos. La persistencia es local en el navegador; la autenticación y los permisos no equivalen a seguridad de servidor.

## Entregables y accesos

- **Aplicación principal funcional:** [`app/`](app/)
- **Instrucciones de la aplicación y credenciales de prueba:** [`app/README.md`](app/README.md)
- **Maqueta de la primera entrega:** [`docs/maqueta/prototipo/`](docs/maqueta/prototipo/)
- **Guía de ejecución de la maqueta:** [`docs/maqueta/README.md`](docs/maqueta/README.md)
- **Diagrama de clases UML actualizado:** [`docs/uml/diagrama-clases.svg`](docs/uml/diagrama-clases.svg)
- **Historias de usuario:** [`docs/historias-usuario.md`](docs/historias-usuario.md)
- **Roles del equipo:** [`docs/roles-equipo.md`](docs/roles-equipo.md)
- **Guía para preparar las evidencias reales de la demostración:** [`docs/evidencias/README.md`](docs/evidencias/README.md)

## Cómo ejecutar la aplicación principal

1. Abre la carpeta `app/` en Visual Studio Code.
2. Ejecuta `app/index.html` con Live Server o con otro servidor estático local. También puede publicarse en un hosting estático con HTTPS, como GitHub Pages.
3. Inicia sesión con alguna de estas cuentas de prueba:

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `Admin123!` |
| Cliente de prueba 1 | `cliente1` | `Cliente123!` |
| Cliente de prueba 2 | `cliente2` | `Cliente123!` |

Los clientes de prueba tienen productos y saldos ficticios para ensayar consignaciones, retiros y transferencias. Desde Administración se pueden crear usuarios, editar o desactivar usuarios, desbloquear credenciales, gestionar productos y asignar saldos/cupos de prueba. Los usuarios registrados desde la pantalla pública reciben productos en cero.

La opción **Restablecer todos los datos de demostración** en el login elimina lo que se guardó en ese navegador y vuelve a crear estas cuentas iniciales.

## Funcionalidades de la aplicación

- Registro de cliente con identificación, nombre completo, celular, nombre de usuario único y contraseña con confirmación.
- Inicio de sesión con contador visible y bloqueo persistente tras tres intentos fallidos; el desbloqueo lo realiza un administrador.
- CRUD administrativo de usuarios, activación/desactivación, desbloqueo y restablecimiento de contraseñas.
- Panel con productos, saldos, cupos disponibles y movimientos recientes.
- Consignaciones, retiros, transferencias entre cuentas de productos distintos y transferencias entre usuarios.
- Cuenta de ahorros con tasa académica mensual del 1,5 % liquidada al retirar bajo la convención explícita descrita en `app/README.md`.
- Cuenta corriente con sobregiro simulado del 20 % del saldo positivo, conforme al enunciado académico.
- Tarjeta de crédito con cupo, compras a cuotas, aplicación exacta de las tasas académicas (0 %, 1,9 % y 2,3 %) y pago de cuota desde una cuenta.
- Perfil, edición de los datos de registro y cambio de contraseña.
- Persistencia en `localStorage`, reconstrucción de instancias POO al recargar y listado cronológico descendente de movimientos.
- Diseño responsive para escritorio, tableta y móvil.

## Arquitectura

La aplicación está organizada por responsabilidades dentro de `app/js/`:

- `models/`: `Cliente`, `ProductoBancario`, `Cuenta`, `CuentaAhorros`, `CuentaCorriente`, `TarjetaCredito` y `Movimiento`.
- `services/`: autenticación, lógica del banco, almacenamiento local y datos iniciales.
- `main.js`: navegación, formularios, eventos, renderizado y mensajes de la interfaz.

Las clases se serializan para guardarse y se reconstruyen al iniciar. La jerarquía de productos incluye herencia y los métodos de retiro se comportan de manera distinta según la clase concreta.

## Pruebas de reglas de negocio

Con Node.js instalado, desde la raíz del repositorio:

```powershell
cd app
npm test
```

La carpeta [`docs/evidencias/`](docs/evidencias/) contiene la lista de capturas reales que el equipo debe preparar para acompañar la demostración final; no se han fabricado capturas de ejecución.

El conjunto de pruebas no requiere instalar dependencias de terceros.

## Organización del repositorio

```text
mi-plata-Cesde/
├── README.md
├── .gitignore
├── app/
│   ├── index.html
│   ├── README.md
│   ├── package.json
│   ├── assets/
│   ├── css/
│   ├── js/
│   │   ├── models/
│   │   └── services/
│   └── tests/
└── docs/
    ├── historias-usuario.md
    ├── roles-equipo.md
    ├── evidencias/
    │   └── README.md
    ├── maqueta/
    │   ├── README.md
    │   └── prototipo/
    └── uml/
        └── diagrama-clases.svg
```

## Alcance y limitaciones

No existe backend ni base de datos remota. `localStorage` solo persiste en el navegador donde se ejecuta la app. Un usuario con acceso a las herramientas de desarrollador puede modificar los datos, clases y permisos del lado cliente. No se han implementado validación de identidad, controles antifraude, sesiones seguras de servidor, integración bancaria o aprobación crediticia real.

Las tasas/cálculos de la guía son reglas pedagógicas, no condiciones comerciales ofrecidas a clientes. La aplicación ejecuta la tabla de tasas indicada por el profesor; el README de `app/` explica el supuesto empleado para intereses de ahorros y la advertencia regulatoria que impide interpretar esos cálculos como un producto de crédito real.
