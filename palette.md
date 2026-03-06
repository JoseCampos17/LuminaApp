# 🎨 Lumina — Paleta de Colores

Extraída de `src/styles/_variables.css` y `src/app.css`.  
Todas las variables están definidas en `:root` y se sobreescriben en `html.light-theme`.

---

## 🌑 Modo Oscuro (Dark — por defecto)

### Backgrounds
| Variable         | Valor                          | Uso                          |
|------------------|--------------------------------|------------------------------|
| `--bg-color`     | `#0c0c0e`                      | Fondo general de la app      |
| `--card-bg`      | `rgba(255, 255, 255, 0.05)`    | Tarjetas / glass cards       |
| `--modal-bg`     | `rgba(20, 20, 30, 0.95)`       | Fondo de modales             |
| `--input-bg`     | `rgba(255, 255, 255, 0.05)`    | Inputs y campos de texto     |

### Marca / Neon
| Variable          | Valor       | Hex visual  | Uso                                     |
|-------------------|-------------|-------------|------------------------------------------|
| `--accent-color`  | `#24c8db`   | 🟦 cyan     | Color de acento principal                |
| `--neon-green`    | `#39ff14`   | 🟩 verde    | Cantidades positivas, radar, pulso       |
| `--neon-blue`     | `#00f3ff`   | 🔵 cyan bri | Vista selector activa, links, círculo SVG|
| `--neon-purple`   | `#bc13fe`   | 🟣 morado   | Salario, botones guardar, pill activo    |

### Texto
| Variable        | Valor       | Uso                       |
|-----------------|-------------|---------------------------|
| `--text-color`  | `#e0e0e0`   | Texto principal           |
| `--text-dim`    | `#a0a0a0`   | Texto secundario / hints  |

### Superficies / Bordes
| Variable          | Valor                       | Uso                            |
|-------------------|-----------------------------|--------------------------------|
| `--glass-border`  | `rgba(255, 255, 255, 0.1)`  | Bordes de tarjetas glass       |
| `--shadow-color`  | `rgba(0, 0, 0, 0.37)`       | Sombras de tarjetas            |

---

## ☀️ Modo Claro (Light — clase `html.light-theme`)

| Variable          | Valor                      | Vs. Dark                    |
|-------------------|----------------------------|-----------------------------|
| `--bg-color`      | `#f7f9fc`                  | Fondo suave azulado         |
| `--card-bg`       | `rgba(255, 255, 255, 0.9)` | Tarjetas blancas            |
| `--modal-bg`      | `#ffffff`                  | Modal blanco                |
| `--input-bg`      | `#fdfdfd`                  | Inputs casi blancos         |
| `--accent-color`  | `#007684`                  | Teal oscuro                 |
| `--neon-green`    | `#10b981`                  | Verde esmeralda (Tailwind)  |
| `--neon-blue`     | `#0284c7`                  | Azul sky (Tailwind)         |
| `--neon-purple`   | `#7c3aed`                  | Violeta (Tailwind)          |
| `--text-color`    | `#1a1a1b`                  | Casi negro                  |
| `--text-dim`      | `#64748b`                  | Gris slate (Tailwind)       |
| `--glass-border`  | `rgba(0, 0, 0, 0.05)`      | Borde sutil oscuro          |
| `--shadow-color`  | `rgba(0, 0, 0, 0.04)`      | Sombra muy suave            |

---

## 🎯 Colores de Estado / Semánticos (hardcoded en componentes)

| Color          | Hex / RGBA                      | Uso                                    |
|----------------|---------------------------------|----------------------------------------|
| Rojo negativo  | `#ff3e00`                       | Gastos, cantidades negativas, FAB open |
| Rojo backdrop  | `rgba(255, 60, 60, 0.2)`        | Fondo swipe-to-delete                  |
| Rojo delete    | `#ff4d4d`                       | Ícono de papelera                      |
| Cyan link      | `rgba(0, 212, 255, 0.08/0.18)`  | Botón "Ver todo", hover links          |
| Purple pill    | `rgba(188, 19, 254, 0.1–0.3)`   | Estados del selector de frecuencia     |

---

## 🖌 Gradientes Usados

| Nombre          | Definición                                            | Dónde se usa             |
|-----------------|-------------------------------------------------------|--------------------------|
| Brand gradient  | `linear-gradient(90deg, --neon-blue, --neon-purple)`  | Logo "Lumina", títulos   |
| Rocket FAB      | `linear-gradient(135deg, --neon-green, --neon-blue)`  | Botón 🚀 FAB             |

---

## 🔤 Tipografía

| Fuente  | Fuente          | Carga         |
|---------|-----------------|---------------|
| Familia | `Inter`         | Google Fonts  |
| Peso H  | `700` (bold)    | Headings      |
| Letter  | `-0.02em`       | h1, h2, h3    |
