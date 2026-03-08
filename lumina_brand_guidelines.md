# Guía de Estilo y Marca: Lumina App

Esta guía documenta la paleta de colores oficial, los tokens de diseño y la tipografía de Lumina para ser utilizada en implementaciones nativas (Android Studio, iOS, Web).

## 📐 Tipografía Principal
La alineación visual de Lumina depende de tipografías legibles y modernas ("sans-serif").
*   **Fuente Principal:** `Inter` (Google Fonts)
*   **Fuente Secundaria (Alternativa):** `Roboto` o `San Francisco` (en iOS/macOS)

---

## 🎨 1. Tema Oscuro (Dark Theme - Por Defecto)
El tema principal, de aspecto Cyberpunk/Neon suave, diseñado para no cansar la vista y hacer resaltar los números importantes.

### Superficies y Fondos
*   **Fondo Principal (`--bg-color`):** `#0c0c0e` *(Casi negro profundo)*
*   **Fondo de Tarjetas (`--card-bg` / `--input-bg`):** `#FFFFFF` al **5% de opacidad** (`rgba(255, 255, 255, 0.05)`)
*   **Modal Hover/Fondo grueso:** `#14141E` al **95% opacidad**
*   **Bordes de Cristal (`--glass-border`):** `#FFFFFF` al **10% de opacidad** (`rgba(255, 255, 255, 0.1)`)

### Texto
*   **Texto Principal (`--text-color`):** `#e0e0e0` *(Gris muy claro)*
*   **Texto Secundario/Suave (`--text-dim`):** `#a0a0a0` *(Gris medio)*

### 🔥 Colores de Acento (Neon)
*   **Acento Principal (Cian - Botones/UI activa):** `#24c8db`
*   **Verde Positivo (Ingresos / Cierres OK):** `#39ff14`
*   **Azul Neón (Enlaces / Interacciones secundarias):** `#00f3ff`
*   **Morado Neón (Advertencias suaves / Estética global):** `#bc13fe`
*   **Rojo Peligro (Para borrar / Errores):** `#ff3e00` o `#ff4d4d`

---

## ☀️ 2. Tema Claro (Light Theme)
Un tema muy limpio, estilo aplicación bancaria moderna, con colores más sobrios y fondos blancos/grises.

### Superficies y Fondos
*   **Fondo Principal (`--bg-color`):** `#f7f9fc` *(Gris azulado hiper claro)*
*   **Fondo de Tarjetas (`--card-bg`):** `#FFFFFF` al **90% opacidad** (`rgba(255, 255, 255, 0.9)`)
*   **Fondo Inputs:** `#fdfdfd`
*   **Bordes Suaves (`--glass-border`):** `#000000` al **5% de opacidad** (`rgba(0, 0, 0, 0.05)`)

### Texto
*   **Texto Principal (`--text-color`):** `#1a1a1b` *(Gris grafito)*
*   **Texto Secundario (`--text-dim`):** `#64748b` *(Gris pizarra)*

### 🔥 Colores de Acento (Material Design vibe)
*   **Acento Principal (Teal oscuro):** `#007684`
*   **Verde Positivo:** `#10b981` *(Esmeralda oscuro)*
*   **Azul Interacción:** `#0284c7`
*   **Morado Acción:** `#7c3aed`

---

## 🌸 3. Tema Rosa (Pink Theme - Kawaii)
El tema cálido con colores de estilo pastel. Útil para targets de público específicos.

### Superficies y Fondos
*   **Fondo Principal (`--bg-color`):** `#ffe4e1` *(Misty Rose pastel)*
*   **Fondo de Tarjetas (`--card-bg`):** `#FFFFFF` al **85% opacidad**
*   **Fondo Inputs:** `#fffafa`
*   **Bordes Temáticos (`--glass-border`):** `#FF69B4` al **20% opacidad**

### Texto
*   **Texto Principal (`--text-color`):** `#4a0e2e` *(Granate oscuro)*
*   **Texto Secundario (`--text-dim`):** `#8b5a74`

### 🔥 Colores de Acento
*   **Acento Principal (Rosa Fuerte):** `#ff69b4` *(Hot Pink)*
*   **Positivo / Alerta:** `#ff1493` *(Deep Pink)*
*   **Azul/Rosa Interactivo:** `#db7093` *(Pale Violet Red)*
*   **Acción Secundaria:** `#c71585` *(Medium Violet Red)*

---

## 🛠️ Efectos Visuales Clave (Glassmorphism)
Gran parte de la identidad de Lumina está en su UI de cristal o tarjetas superpuestas. 
Si recreas esto en Android (Jetpack Compose o XML) o iOS (SwiftUI), debes buscar aplicar estos tres elementos vitales a los contenedores `.card` o cajas de contenido principal:
1.  **Fondo semitransparente** (mencionados arriba en *Fondo de Tarjetas*).
2.  **Borde muy fino y translúcido** (mencionado arriba en *Bordes de Cristal*).
3.  **Desenfoque de fondo activo / Blur Effect:** (En CSS esto es `backdrop-filter: blur(12px)`). Es la joya de la corona del diseño UI de este proyecto.
