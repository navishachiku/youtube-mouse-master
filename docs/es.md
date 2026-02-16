# YouTube Mouse Master

Script de mejora de interacción para el reproductor de YouTube diseñado para usuarios avanzados. Es un script de Tampermonkey altamente optimizado, sin capas superpuestas (Zero-Overlay) y totalmente personalizable.

## ✨ Características Principales

* **Controles Rápidos**: Configura zonas de acción personalizadas en el reproductor que corresponden a acciones del ratón, como clics y desplazamiento de rueda, para ajustar rápidamente el volumen, velocidad, progreso, etc.

* **Zonas de Acción Personalizadas**: Admite ajustes de zona altamente personalizables, permitiéndote ajustar libremente el tamaño y la posición de la zona (la configuración predeterminada incluye las zonas Izquierda, Centro y Derecha).

* **Interacción sin Capas (Zero-Overlay)**: Abandona las capas transparentes tradicionales y utiliza cálculos de coordenadas de alto rendimiento, asegurando que no haya interferencias con los clics de la interfaz nativa.

* **Optimización para Mac / Rueda de Alta Frecuencia**: El mecanismo de filtrado integrado se adapta perfectamente a MOS, SmoothScroll o trackpads de Mac, evitando saltos excesivos por sensibilidad.

![DEMO SCREENSHOT](./demo.jpeg)

## ⚙️ Parámetros Personalizables

Puedes ajustar la configuración directamente en los bloques `SETTINGS` y `CONFIG` en la parte superior del script.

### Configuración Global (Global Settings)

| Parámetro | Descripción | Predeterminado |
| :--- | :--- | :--- |
| `DEBUG` | Si se deben mostrar mensajes de depuración en la consola | `false` |
| `ZONE_TOGGLE_KEY` | Tecla de acceso rápido para alternar la visibilidad de las zonas | `F9` |
| `OSD_DURATION` | Tiempo que los avisos OSD permanecen en pantalla (ms) | `800` |
| `OSD_FADE_OUT` | Duración de la animación de desvanecimiento OSD (ms) | `150` |
| `OSD_FONT_SIZE` | Tamaño de fuente del texto OSD (soporta px, em, rem, etc.) | `28px` |
| `USE_WHEEL_COUNT_FIXED` | Si se debe activar el filtrado de recuento de rueda fijo (Recomendado para Mac) | `false` |
| `WHEEL_DELAY` | Tiempo de retraso de antivibración para eventos de rueda (ms) | `1` |
| `WHEEL_COUNT_THRESHOLD` | Umbral de activación: cuántos eventos de rueda acumular antes de actuar | `14` |

### Configuración de Zonas (Custom Zone Configuration)

Puedes personalizar totalmente las zonas de acción según tus necesidades, ajustando su tamaño y posición.

La configuración predeterminada incluye:

| Zona | Clic Izquierdo | Clic Derecho | Acción de Rueda |
| ----- | ----- | ----- | ----- |
| **Izquierda (Volumen)** | Volumen Máximo (100%) | Silencio Rápido (0%) | Paso de Volumen +/- 5% |
| **Centro (Progreso)** | Nativo (Reproducir/Pausar) | Nativo (Menú) | Salto de Progreso +/- 5s |
| **Derecha (Velocidad)** | Rápido 2.0x | Restablecer 1.0x | Paso de Velocidad +/- 0.25x |

### Lista de Acciones Compatibles (Supported Actions List)

En `mouse_action`, los tipos de `action` que puedes usar son:

| Nombre de Acción (action) | Descripción | Ejemplo de Parámetro (value) |
| :--- | :--- | :--- |
| `volume_up` | Aumentar volumen | `5` (+5%) |
| `volume_down` | Disminuir volumen | `5` (-5%) |
| `volume_set` | Establecer volumen fijo | `0` (Silencio) o `100` (Máximo) |
| `volume_mute` | Alternar silencio | No requiere parámetro |
| `seek` | Saltar progreso | `5` (adelante) o `-5` (atrás) |
| `toggle_play_pause` | Alternar reproducción/pausa | No requiere parámetro |
| `speed_up` | Aumentar velocidad | `0.25` |
| `speed_down` | Disminuir velocidad | `0.25` |
| `speed_set` | Establecer velocidad fija | `1.0`, `2.0`, etc. |
| `none` | Ninguna acción | Pasa el evento al manejo nativo de YouTube |

## 📦 Instalación

**Método 1: Instalación con un clic (Recomendado)**

1. Instala la extensión del navegador [Tampermonkey](https://www.tampermonkey.net/).
2. Visita la **[página del script en GreasyFork](https://greasyfork.org/en/scripts/566499-youtube-mouse-master)**.
3. Haz clic en el botón **"Instalar este script"**.

**Método 2: Instalación manual**

1. Crea un "Nuevo script" en Tampermonkey.
2. Copia y pega el contenido de `YouTubeMouseMaster.user.js`.
3. ¡Guarda y disfruta!
