# Sistema Bancario Mi Plata

**Proyecto integrador académico — CESDE, Desarrollo de Software**  
**Orientador:** Jorge Albeiro Muriel Vélez  
**Integrantes:** Juan Felipe Serna Villada y Mateo Quiñones Valencia

## Descripción

Mi Plata es una propuesta de banca digital. Esta primera entrega contiene la maqueta frontend, el diagrama de clases UML, las historias de usuario y los roles del equipo.

> **Alcance de esta etapa:** es un prototipo académico, no un banco funcional. No incluye backend, base de datos, autenticación real, persistencia ni operaciones financieras. Los datos visibles son ficticios; no ingreses contraseñas ni información personal.

## Entregables

- **Maqueta frontend:** [`docs/maqueta/prototipo/`](docs/maqueta/prototipo/)
- **Guía y descripción de la maqueta:** [`docs/maqueta/README.md`](docs/maqueta/README.md)
- **Diagrama de clases UML (SVG):** [`docs/uml/diagrama-clases.svg`](docs/uml/diagrama-clases.svg)
- **Historias de usuario:** [`docs/historias-usuario.md`](docs/historias-usuario.md)
- **Roles del equipo:** [`docs/roles-equipo.md`](docs/roles-equipo.md)

## Cómo ejecutar la maqueta

1. Abre la carpeta `docs/maqueta/prototipo/`.
2. Abre `index.html` en un navegador actualizado.
3. Usa la navegación para recorrer Inicio, Productos, Registro, Ingresar y el panel de demostración.

No es necesario instalar dependencias ni iniciar un servidor. Puedes usar Live Server en Visual Studio Code si lo tienes instalado, pero es opcional.

## Estructura del repositorio

```text
mi-plata-Cesde/
├── README.md
├── .gitignore
└── docs/
    ├── historias-usuario.md
    ├── roles-equipo.md
    ├── maqueta/
    │   ├── README.md
    │   └── prototipo/
    │       ├── index.html
    │       ├── assets/mi-plata-mark.svg
    │       ├── css/styles.css
    │       └── js/app.js
    └── uml/
        └── diagrama-clases.svg
```

## Modelo conceptual

El diagrama modela `ProductoBancario` como clase abstracta general. `Cuenta` también es abstracta y hereda de `ProductoBancario`; `CuentaAhorros` y `CuentaCorriente` heredan de `Cuenta`, mientras que `TarjetaCredito` hereda directamente de `ProductoBancario`. `Cliente` se vincula a sus productos mediante asociación y no mediante herencia. `Movimiento` se incorpora para representar los movimientos asociados a una cuenta.

## Estado de la entrega

- [x] Maqueta frontend demostrativa.
- [x] Diagrama de clases UML.
- [x] Historias de usuario con criterios de aceptación.
- [x] Roles propuestos para ambos integrantes.
- [x] Instrucciones para ejecutar y revisar la maqueta.
- [ ] Revisión final con el profesor.
- [ ] Implementación del backend y de la lógica bancaria (etapa posterior).

Las historias de usuario documentan comportamientos esperados del sistema futuro. La presencia de una pantalla no significa que su funcionalidad bancaria esté implementada.
