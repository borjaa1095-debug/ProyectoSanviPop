# Guía del proyecto SanviPop

## Tecnologías y estructura

- Aplicación de TypeScript con Vite.
- Bootstrap y Bootstrap Icons para estilos e iconos.
- OpenLayers para los mapas.
- Archivos HTML en la raíz y scripts de cada página en src.
- Clases de servicios en src/classes.
- Interfaces de datos y respuestas en src/interfaces.
- Funciones compartidas en src/page-utils.ts.
- URL del servidor definida en SERVER, dentro de src/constants.ts.

## Estilo de código

- Respetar el código existente y limitar los cambios a lo necesario.
- Usar nombres descriptivos en inglés para variables, funciones y clases.
- Usar const cuando no sea necesario reasignar y let cuando sí lo sea.
- Evitar any y tipar los parámetros y retornos de las funciones.
- Usar import type para importar tipos.
- Mantener la extensión .ts en los nuevos imports locales.
- Seguir la configuración existente de Prettier: dos espacios,
  comillas dobles y punto y coma.
- Escribir comentarios solo cuando expliquen una decisión o código
  que no resulte evidente.

## Servicios y peticiones

- Centralizar las peticiones en las clases de servicios.
- Utilizar la clase Http existente y sus métodos genéricos.
- Indicar los tipos de respuesta y de los datos enviados.
- Usar async/await y try/catch en el código nuevo.
- Mostrar los errores al usuario y evitar promesas sin manejar.
- Construir los parámetros de las consultas con URLSearchParams.
- No duplicar las peticiones ni introducir dependencias innecesarias.

## Sesión

- Guardar el token en localStorage con la clave token.
- Comprobar la sesión con AuthService.checkToken.
- En las páginas protegidas, redirigir al login si la sesión falla.
- En login y registro, redirigir al listado si la sesión es válida.
- Cerrar sesión mediante AuthService.logout.

## Interfaz y formularios

- Conservar los HTML proporcionados y sus identificadores.
- Usar los templates existentes donde corresponda.
- Insertar los datos del servidor con textContent.
- Tipar los elementos del DOM cuando se necesiten propiedades específicas.
- Validar los formularios antes de enviar.
- Evitar envíos duplicados y peticiones que mezclen resultados.
- Dar información sobre errores, operaciones correctas y listas vacías.
- Mantener los formatos españoles de fechas, precios y distancias.

## Comprobaciones

- Ejecutar npm run format para aplicar el formato.
- Ejecutar npm run test para comprobar ESLint.
- Ejecutar npm run build para comprobar TypeScript y la compilación.
- Verificar que dist contiene todas las páginas HTML.
- Probar en el navegador los flujos afectados por los cambios.