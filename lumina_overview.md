# 🌌 Lumina: El Futuro de las Finanzas Personales (Dossier del Producto)

## ¿Qué es Lumina?
Lumina es una aplicación multiplataforma (Windows, macOS, Linux, Android, iOS) diseñada para transformar la manera en que las personas rastrean y entienden su dinero. Desarrollada con un motor ultrarrápido (Rust/Tauri) y una interfaz de vanguardia (Svelte V5), está pensada para la nueva generación de profesionales que exigen velocidad, privacidad absoluta y un diseño espectacular (estética Cyberpunk/Neon Glassmorphism) en lugar de las aburridas aplicaciones bancarias tradicionales.

## ¿Qué logras con la app? (El Valor Real)
A diferencia de hojas de cálculo o bancos que solo te muestran lo que ya gastaste, Lumina te ayuda a:
1.  **Anticiparte a tu Pobreza o Riqueza:** Al ingresar tus gastos fijos (Netflix, Arriendo, Internet), Lumina proyecta exactamente cuánto dinero *realmente* te queda libre cada mes o quincena, eliminando la ansiedad de "¿llegaré a fin de mes?".
2.  **Jugar con tu Futuro (Simulador de Ahorro):** Un slider interactivo te permite ver en tiempo real cómo un pequeño porcentaje de ahorro mes a mes se acumula al final del año, motivándote a guardar dinero.
3.  **Mantener tu Privacidad 100% Intacta:** Puesto que Lumina guarda todo localmente en una base de datos SQLite en tu propio teléfono/computador, nadie (ni siquiera los desarrolladores) puede leer tus ingresos, en qué gastas, ni vender tus datos financieros a terceros. Eres el dueño absoluto de tu información.
4.  **Adaptarse a tu Realidad Salarial:** Entiende perfectamente si te pagan mensual o quincenal (el 15 y el 30), inyectando el dinero automáticamente en tu flujo de caja en los días correctos, una característica vital en la economía de Latinoamérica que los competidores gringos ignoran.

---

## 🚀 La Nueva Gran Idea (Factor Diferenciador Único)

Ya que Lumina será **gratis** (una excelente decisión estratégica para ganar usuarios masivamente y luego monetizar con un botón de "Donar un Café"), necesitamos una característica explosiva y viral que ningún competidor gigante como YNAB o Monarch Money tenga. 

Aquí tienes la idea:

### **El "Modo Tiempo-Vida" (Time = Money Toggle)**
Actualmente, Lumina conoce exactamente tu salario y con qué frecuencia te pagan. Podemos calcular tu "Tarifa por Hora" exacta.

**¿Cómo funciona?**
Agregamos un interruptor (switch) maestro en el Dashboard llamado `Modo Tiempo de Vida`. Al activarlo, en lugar de mostrar los gastos en dinero (ej. `$50.000 COP`), la app convierte TODO tu historial de gastos y tus suscripciones a **Horas de Vida**.

**Ejemplo Psicológico Brutal:**
*   Si ganas $2.000.000 COP al mes (trabajando ~160 horas), tu hora de vida vale **$12.500 COP**.
*   Vas a registrar una salida a comer de $100.000 COP.
*   Con el "Modo Tiempo-Vida" activado, la app no te dice "Gastaste $100.000 COP". **Te dice: "Gastaste 8 HORAS de trabajo"**.
*   Si miras tus suscripciones: "Pagar Netflix y Spotify te cuesta **3 horas completas** de tu vida todos los meses". 

**Por qué esta idea destruiría a la competencia:**
1.  **Impacto Psicológico:** Ayuda genuinamente a la gente a dejar de gastar en tonterías. Ver que un café caro te costó "45 minutos de tu jornada laboral" te hace pensarlo dos veces.
2.  **Viralidad (Marketing Gratuito):** Es el tipo de función perfecta para hacer videos en TikTok o Reels. "Esta app no me muestra cuánto gasté, me muestra cuántas HORAS DE VIDA perdí trabajando para pagar esa hamburguesa".
3.  **Es Muy Fácil de Programar:** Como ya tenemos la base matemática (ingreso neto / días laborables), es solo una pequeña función de mapeo (map) en el componente Svelte que altera cómo se formatea el número en pantalla si el toggle está activo. ¡Podríamos hacerlo en un par de horas!

¿Qué te parece esta idea para coronar a Lumina como la app financiera más única del mercado gratuito?
