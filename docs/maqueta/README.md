# Maqueta frontend — Mi Plata

## Propósito

Esta carpeta contiene la maqueta visual de **Sistema Bancario Mi Plata**, elaborada para la etapa inicial del proyecto académico de CESDE. Su objetivo es mostrar la navegación y distribución de las pantallas antes de desarrollar la lógica bancaria.

## Pantallas contempladas

1. **Inicio:** presentación de Mi Plata, navegación principal e ilustración de una tarjeta bancaria.
2. **Registro:** identificación, nombre completo, celular, nombre de usuario, contraseña y confirmación de contraseña.
3. **Inicio de sesión:** usuario, contraseña, mensajes de validación y contador ilustrativo de intentos.
4. **Panel del usuario:** saldo, productos y movimientos ficticios para mostrar la distribución de información.
5. **Productos bancarios:** presentación de cuenta de ahorros, cuenta corriente y tarjeta de crédito.

## Tecnologías

- HTML para la estructura de las pantallas.
- CSS para el diseño visual y la adaptación a escritorio, tableta y móvil.
- JavaScript básico para la navegación y las validaciones demostrativas.

## Cómo revisar la maqueta

Abre `prototipo/index.html` directamente en un navegador actualizado. No se necesitan dependencias ni servidor. También puedes abrir la carpeta en Visual Studio Code y utilizar Live Server si lo tienes instalado; es opcional.

Los recursos visuales se encuentran dentro de `prototipo/assets/`, los estilos en `prototipo/css/` y las interacciones demostrativas en `prototipo/js/`. Las rutas están configuradas de forma relativa a `prototipo/index.html`.

## Alcance y límites

Esta es exclusivamente una maqueta frontend. No incluye backend, base de datos, autenticación real, persistencia de información, cálculos financieros ni transacciones. Las validaciones suceden localmente en el navegador; ningún dato se envía o guarda. Los saldos y movimientos que aparecen son ficticios. **No ingreses información personal ni contraseñas reales.**

## Relación con la aplicación principal

Esta carpeta conserva la maqueta de la primera entrega sin reemplazarla. La aplicación principal con clases, autenticación simulada, transacciones y persistencia se mantiene separada en [`../../app/`](../../app/), por lo que el docente puede revisar las dos etapas.
