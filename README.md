# 📱 Lumina

> Tu asistente financiero personal. Sin nube. Sin rastreo. Todo en tu dispositivo.

---

## ¿Qué es Lumina?

Lumina es una app de finanzas personales diseñada para llevar el control de tu quincena y tu mes de forma visual e inteligente. Funciona **100% offline**, sin cuentas ni internet.

---

## 🚀 Primeros pasos

### 1. Configurar tu salario

1. Toca el ícono **⚙️ Config** en la barra inferior.
2. En la tarjeta de salario, selecciona si ingresas tu sueldo **Quincenal** o **Mensual** usando el selector junto al título.
3. Toca **"Cambiar"**, escribe el monto y toca **"Guardar"**.

> 💡 Si eliges **Mensual**, la app divide automáticamente el valor a la mitad para la vista quincenal. No tienes que hacer el cálculo tú.

### 2. Agregar gastos fijos

En la pantalla **Config**, sección **"Gastos Fijos"**:

1. Toca **"+ Agregar"**.
2. Escribe la descripción (`Tarjeta Visa`, `Netflix`, `Gimnasio`…).
3. Ingresa el monto y selecciona la frecuencia: **Quincenal**, **Mensual** o **Semanal**.
4. Toca **"Agregar"**.

---

## 💸 Registrar un movimiento

1. Toca el botón **"+"** en la esquina inferior derecha.
2. Completa el formulario:
   - **Descripción**: qué fue el gasto/ingreso.
   - **Monto**: negativo para gastos (`-50000`), positivo para ingresos extra (`+100000`).
   - **Categoría**: Comida, Transporte, Entretenimiento, etc.
   - **Fecha**: por defecto hoy.
3. Toca **"Registrar Movimiento"**.

---

## 📊 El Dashboard

### Selector de período

En la parte superior puedes cambiar entre **Quincena** y **Mes**. Todos los números se ajustan automáticamente.

### El Radar — Índice de Liquidez

| % | Significado |
|---|---|
| **100%** | No has gastado nada del disponible variable |
| **50–99%** | Vas bien, tienes margen |
| **10–49%** | Ya gastaste bastante, cuidado |
| **0%** | Agotaste tu disponible |

**Fórmula:** `(Dinero restante ÷ Ingreso neto) × 100`

### Tarjetas de resumen

- **Ingreso Neto**: Salario del período menos gastos fijos recurrentes.
- **Gastos Variables**: Total de transacciones manuales en el período.

### Consejos inteligentes 💡

- **Tip de Distribución**: Basado en la regla 50/30/20.
- **Estrategia de Tarjetas**: Cómo dividir tus tarjetas entre quincenas.
- **Alerta de Quincena Pesada**: Cuando una quincena tiene mucho más gasto fijo que la otra.

---

## 🔮 Simulador de Ahorro 🚀

Toca el botón del **cohete** para abrir el simulador:

1. Ajusta el **% de ahorro** con el slider.
2. Ve cuánto acumularías en **3 meses** ahorrando ese porcentaje de tu disponible.

---

## 💱 Moneda

Usa el selector **COP / USD** en la parte superior para ver todos los valores convertidos al instante. Las tasas de cambio se actualizan automáticamente desde internet cada 4 horas.

---

## 🔔 Notificaciones inteligentes

La app envía notificaciones locales cuando detecta:

- Un gasto que supera el **20% de tu ingreso neto** quincenal.
- Tu **liquidez cae por debajo del 20%**.
- Múltiples gastos acumulados en **Entretenimiento**.

> 100% locales — no requieren internet ni se comparten con nadie.

---

## ❓ Preguntas frecuentes

**¿Mis datos están en la nube?**
No. Todo se guarda localmente en SQLite en tu dispositivo. Nadie tiene acceso a tu información.

**¿Funciona sin internet?**
Sí, completamente. Las tasas de cambio se actualizan automáticamente si hay conexión, pero no es necesario.

**¿Cómo funciona el selector Quincenal / Mensual?**
Elige cómo quieres ingresar tu salario. Si eliges Mensual y escribes `2.000.000`, la app guarda `1.000.000` como base quincenal y muestra `2.000.000` en la vista mensual del dashboard.

**¿Puedo ver meses anteriores?**
La app muestra el mes y quincena en curso. El historial completo está disponible en la pestaña **"Historial"**.

**¿Cómo borro un gasto?**
Desliza el registro hacia la izquierda en la lista de movimientos para eliminarlo.

---

## 🛠 Información técnica

| Campo | Valor |
|---|---|
| Plataforma | Android (APK), Web |
| Stack | Tauri 2 · SvelteKit · Rust · SQLite |
| Datos | Locales en `/data/data/com.shin.finapp/` |
| Monedas | COP, CLP, USD |
| Versión | 0.1.0 |

---

*Hecho con ❤️ para tomar el control de tus finanzas.*