# Chrono Defender

Una línea temporal fracturada está consumiendo las estrellas. Solo el Cronoluchador Aegis-7 puede detenerla.

**Chrono Defender** es un shoot 'em up original de desplazamiento horizontal inspirado en los arcades clásicos, construido con Phaser 3 y TypeScript. Los jugadores pilotan un cronoluchador experimental a través de líneas temporales en colapso, recolectando Fragmentos Crono para potenciar mejoras, desplegando Drones Eco y destruyendo el núcleo temporal expuesto del Guardián de la Época.

---

## Jugar en Línea

**[Jugar Chrono Defender](https://robinsonalexanderquiroz-droid.github.io/chrono-defender/)**

---

## Repositorio

**[GitHub](https://github.com/robinsonalexanderquiroz-droid/chrono-defender)**

---

## Características

- **Juego de desplazamiento horizontal** — mecánicas clásicas de arcade shooter con implementación moderna
- **Gráficos procedurales originales** — todos los visuales generados en tiempo de ejecución usando Phaser Graphics
- **Sistema de menú navegable** — menú con Puntuaciones, Logros, Opciones y Controles
- **20 logros** — categorías de combate, supervivencia, colección, maestría y dedicación
- **Tabla de clasificación persistente** — top 10 puntuaciones guardadas en localStorage
- **Soporte de gamepad** — controles Xbox/PlayStation con movimiento analógico y zonas muertas
- **Controles táctiles** — joystick virtual y botón de disparo para navegadores móviles
- **Entrada unificada** — teclado, gamepad y táctil combinados mediante InputManager
- **Opciones extendidas** — volumen, pantalla, jugabilidad y accesibilidad con persistencia
- **Sistema de Riel de Mejoras** — recolecta Fragmentos Crono para avanzar en seis ranuras
- **Drone Eco** — orbe de soporte autónomo que refleja tu movimiento y dispara junto a ti
- **Batalla de jefe** — enfrenta al Guardián de la Época con su cuerpo blindado y núcleo vulnerable
- **Puntuación combo** — encadena eliminaciones para multiplicadores de hasta 4x
- **Cinco tipos de enemigos** — Exploradores, Interceptores, Pesados, Bombarderos y Francotiradores
- **Seis armas** — Láser Estándar, Disparo Disperso, Triple Disparo, Disparo Rápido, Láser Perforante, Haz de Plasma
- **Ocho potenciadores** — Salud, Escudo, Mejora de Arma, Disparo Rápido, Puntuación x2, Dron, Imán, Invulnerabilidad
- **Dificultad adaptativa** — la vida, velocidad y tasa de aparición de enemigos escalan con cada oleada
- **Encuentros con mini-jefe** — el Centinela Crono aparece cada 5 oleadas
- **Audio procedural** — música de fondo y más de 15 efectos de sonido sintetizados en tiempo real
- **Modo estricto TypeScript** — código completamente tipado sin uso de `any`
- **MIT License** — libre para usar, estudiar y extender

---

## Capturas de Pantalla

![Pantalla de Título](docs/screenshots/title-screen.png)
![Jugabilidad](docs/screenshots/gameplay.gif)
![Batalla de Jefe](docs/screenshots/boss-fight.png)
![Victoria](docs/screenshots/victory.png)

---

## Controles

| Acción           | Teclado         | Gamepad           |
| ---------------- | --------------- | ----------------- |
| Mover            | WASD / Flechas  | Stick Izq / D-Pad |
| Disparar         | Espacio / Click | A / Cruz          |
| Pausa / Reanudar | P / Esc         | Start             |
| Salir al Menú    | Q (en pausa)    | —                 |
| Silenciar        | M               | Y / Triángulo     |
| Siguiente Arma   | E               | Bumper Derecho    |
| Arma Anterior    | Q               | Bumper Izquierdo  |
| Iniciar Juego    | Enter           | A / Cruz          |
| Reiniciar        | R               | —                 |
| Navegar Menú     | Flechas         | D-Pad / Stick Izq |
| Confirmar        | Enter           | A / Cruz          |
| Atrás            | Escape          | B / Círculo       |

---

## Tecnología

| Categoría       | Herramienta     |
| --------------- | --------------- |
| Motor de Juego  | Phaser 3.90     |
| Lenguaje        | TypeScript 5.9  |
| Herramienta     | Vite 6.4        |
| Linter          | ESLint 10       |
| Formateador     | Prettier 3.9    |
| Tests Unitarios | Vitest 4.1      |
| Tests E2E       | Playwright 1.61 |
| CI/CD           | GitHub Actions  |
| Hosting         | GitHub Pages    |

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/robinsonalexanderquiroz-droid/chrono-defender.git
cd chrono-defender

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar la construcción de producción
npm run preview
```

---

## Scripts Disponibles

| Script                 | Comando                      | Descripción                            |
| ---------------------- | ---------------------------- | -------------------------------------- |
| `npm run dev`          | `vite`                       | Iniciar servidor de desarrollo         |
| `npm run build`        | `tsc --noEmit && vite build` | Verificar tipos y construir producción |
| `npm run preview`      | `vite preview`               | Previsualizar construcción localmente  |
| `npm run typecheck`    | `tsc --noEmit`               | Ejecutar verificación de tipos         |
| `npm run lint`         | `eslint .`                   | Analizar todos los archivos            |
| `npm run format:check` | `prettier --check .`         | Verificar formato                      |
| `npm run test`         | `vitest --run`               | Ejecutar tests unitarios               |
| `npm run test:e2e`     | `playwright test`            | Ejecutar tests end-to-end              |

---

## Arquitectura del Proyecto

El proyecto utiliza una arquitectura modular basada en managers singleton:

- **AudioManager** — síntesis procedural de audio via Web Audio API
- **EnemyManager** — spawning, patrones de movimiento y disparo de enemigos
- **WeaponManager** — sistema de armas con ciclo y estadísticas
- **PowerUpManager** — drops ponderados y efectos temporizados
- **WaveManager** — progresión de oleadas y mini-jefes
- **ScoreManager** — combos, multiplicadores y popups flotantes
- **DifficultyManager** — escalado adaptativo por oleada
- **SaveManager** — persistencia localStorage con migración de esquema
- **AchievementManager** — 20 logros con seguimiento de progreso
- **InputManager** — abstracción unificada de teclado, gamepad y táctil
- **GamepadManager** — API de Gamepad del navegador con zonas muertas
- **TouchManager** — controles virtuales para dispositivos táctiles
- **SettingsManager** — acceso tipado a configuraciones con persistencia

---

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 Chrono Defender contributors
