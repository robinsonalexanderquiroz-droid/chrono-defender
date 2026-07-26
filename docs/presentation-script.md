# Chrono Defender — Presentation Script

**Duration:** 5 minutes maximum
**Format:** Screen recording with voiceover narration

---

## Section 1: Introduction (0:00 – 0:30)

**Show:** Title screen of the game running in the browser.

**English:**

"Hi, I'm presenting Chrono Defender — an arcade-inspired horizontal shoot 'em up built entirely in the browser using Phaser 3 and TypeScript.

The goal of this project was to build a fully playable, professionally structured game from scratch with no external art or audio assets — everything is generated procedurally at runtime.

Let me show you what it can do."

**Español:**

"Hola, les presento Chrono Defender — un shoot 'em up de desplazamiento horizontal inspirado en los arcades clásicos, construido completamente en el navegador usando Phaser 3 y TypeScript.

El objetivo de este proyecto fue crear un juego completamente jugable y profesionalmente estructurado desde cero, sin recursos externos de arte o audio — todo se genera proceduralmente en tiempo de ejecución.

Permítanme mostrarles lo que puede hacer."

---

## Section 2: Live Demo – Gameplay (0:30 – 2:00)

**Show:** Navigate the menu, start a game, play through a combat phase.

**English:**

"Here's the game running live on GitHub Pages. The menu system is fully navigable with keyboard, gamepad, or touch.

When I press Enter, the game starts immediately. You can see the player ship, the parallax starfield background, and enemies spawning from the right side.

I'm using WASD to move and Space to fire. Notice the HUD showing my score, lives, current weapon, and combo multiplier. As I chain kills, the combo increases — up to a 4x score multiplier.

The game has five distinct enemy types: Scouts that fly straight, Interceptors with zigzag patterns, Heavies that fire back, Bombers that dive toward the player, and Snipers that stop to aim.

I can switch weapons with number keys 1 through 6 — here's the Spread Shot, and here's the Piercing Laser that passes through multiple enemies.

When I collect a Chrono Shard, it advances my Upgrade Rail. I can activate an Echo Drone that fires alongside me, or a Shield that absorbs one hit."

**Español:**

"Aquí está el juego corriendo en vivo en GitHub Pages. El sistema de menú es completamente navegable con teclado, gamepad o táctil.

Cuando presiono Enter, el juego inicia inmediatamente. Pueden ver la nave del jugador, el fondo de estrellas con paralaje, y los enemigos apareciendo desde el lado derecho.

Estoy usando WASD para moverme y Espacio para disparar. Observen el HUD mostrando mi puntuación, vidas, arma actual y multiplicador de combo. A medida que encadeno eliminaciones, el combo aumenta — hasta un multiplicador de 4x.

El juego tiene cinco tipos de enemigos distintos: Exploradores que vuelan en línea recta, Interceptores con patrones de zigzag, Pesados que devuelven el fuego, Bombarderos que se lanzan hacia el jugador, y Francotiradores que se detienen para apuntar.

Puedo cambiar de arma con las teclas numéricas del 1 al 6 — aquí está el Disparo Disperso, y aquí el Láser Perforante que atraviesa múltiples enemigos.

Cuando recojo un Fragmento Crono, avanza mi Riel de Mejoras. Puedo activar un Drone Eco que dispara junto a mí, o un Escudo que absorbe un impacto."

---

## Section 3: Boss Fight and Audio (2:00 – 2:45)

**Show:** Reach or fast-forward to the boss. Show the boss battle.

**English:**

"After surviving the combat phase, the Epoch Warden boss appears. Notice the music transitions — the boss theme uses heavier, lower-frequency synthesis.

All audio in Chrono Defender is generated using the Web Audio API. There are no audio files in the repository. The AudioManager synthesizes over 15 different sounds: laser fire, explosions, pickups, and five unique music themes — all created with oscillators, noise buffers, and envelopes.

The boss has an armored body and an exposed temporal core that's vulnerable only during certain cycles. When I hit it, you can see the camera shake and hear the impact sound."

**Español:**

"Después de sobrevivir la fase de combate, aparece el jefe Guardián de la Época. Noten la transición de música — el tema del jefe usa una síntesis más pesada y de frecuencias más bajas.

Todo el audio en Chrono Defender se genera usando la Web Audio API. No hay archivos de audio en el repositorio. El AudioManager sintetiza más de 15 sonidos diferentes: disparos láser, explosiones, recolecciones y cinco temas musicales únicos — todos creados con osciladores, búferes de ruido y envolventes.

El jefe tiene un cuerpo blindado y un núcleo temporal expuesto que solo es vulnerable durante ciertos ciclos. Cuando lo golpeo, pueden ver la sacudida de cámara y escuchar el sonido de impacto."

---

## Section 4: Technical Architecture (2:45 – 3:45)

**Show:** VS Code with the project structure, then key system files.

**English:**

"Let me show the code architecture. The project uses TypeScript in strict mode — zero `any` usage throughout the entire codebase.

The architecture is modular with singleton managers. Here's the systems folder:

- AudioManager — procedural Web Audio synthesis
- EnemyManager — five enemy types with five movement patterns
- WeaponManager — six weapons with spread and piercing mechanics
- ScoreManager — combo system with floating score popups
- DifficultyManager — adaptive scaling formulas
- SaveManager — localStorage persistence with schema migration
- AchievementManager — twenty achievements driven by gameplay events
- InputManager — unified keyboard, gamepad, and touch abstraction
- SettingsManager — sixteen configurable options with real-time application

All gameplay parameters live in a single data-driven config file. Enemy stats, weapon definitions, power-up weights, and difficulty curves are all defined declaratively — no magic numbers in the game logic.

The build pipeline uses Vite for fast development and optimized production builds. ESLint and Prettier enforce consistent code quality."

**Español:**

"Permítanme mostrar la arquitectura del código. El proyecto usa TypeScript en modo estricto — cero uso de `any` en todo el código fuente.

La arquitectura es modular con managers singleton. Aquí está la carpeta de sistemas:

- AudioManager — síntesis procedural de audio con Web Audio
- EnemyManager — cinco tipos de enemigos con cinco patrones de movimiento
- WeaponManager — seis armas con mecánicas de dispersión y perforación
- ScoreManager — sistema de combos con popups flotantes de puntuación
- DifficultyManager — fórmulas de escalado adaptativo
- SaveManager — persistencia en localStorage con migración de esquema
- AchievementManager — veinte logros impulsados por eventos de juego
- InputManager — abstracción unificada de teclado, gamepad y táctil
- SettingsManager — dieciséis opciones configurables con aplicación en tiempo real

Todos los parámetros de jugabilidad viven en un solo archivo de configuración declarativa. Las estadísticas de enemigos, definiciones de armas, pesos de potenciadores y curvas de dificultad están definidos de forma declarativa — sin números mágicos en la lógica del juego.

El pipeline de construcción usa Vite para desarrollo rápido y construcciones optimizadas para producción. ESLint y Prettier aseguran calidad de código consistente."

---

## Section 5: Testing and CI/CD (3:45 – 4:15)

**Show:** Terminal running tests, then Playwright results, then GitHub Actions.

**English:**

"The project has comprehensive automated testing. Let me run the test suite.

Sixty-four unit tests verify the game managers: save data migration, achievement unlock logic, difficulty scaling, combo scoring, and gamepad dead-zone calculations.

Twenty-six end-to-end tests using Playwright verify the actual game running in a headless browser: menu navigation, pause and resume, quit to title, mute toggle, gameplay flow, and options screen interaction.

The CI workflow runs on every push: typecheck, lint, format check, unit tests, production build, end-to-end tests, and security audit. Deployment to GitHub Pages is fully automated."

**Español:**

"El proyecto tiene pruebas automatizadas exhaustivas. Déjenme ejecutar la suite de tests.

Sesenta y cuatro tests unitarios verifican los managers del juego: migración de datos guardados, lógica de desbloqueo de logros, escalado de dificultad, puntuación de combos y cálculos de zona muerta del gamepad.

Veintiséis tests de punta a punta usando Playwright verifican el juego real corriendo en un navegador sin interfaz: navegación de menú, pausa y reanudación, salir al título, silenciar audio, flujo de juego e interacción con la pantalla de opciones.

El flujo de CI se ejecuta en cada push: verificación de tipos, lint, verificación de formato, tests unitarios, construcción de producción, tests de punta a punta y auditoría de seguridad. El despliegue a GitHub Pages es completamente automático."

---

## Section 6: Accessibility and Platform Support (4:15 – 4:45)

**Show:** Options screen, mobile viewport, gamepad connection.

**English:**

"For accessibility: the game supports reduced flashing, reduced motion, configurable screen shake intensity, high-contrast HUD, and a mute shortcut accessible at any time.

Touch controls with a virtual joystick make it playable on mobile devices. The overlay appears automatically on touch-capable screens with fire, pause, mute, and weapon-switch buttons.

Gamepad support works with Xbox and PlayStation controllers — including analog movement, dead zones, and full menu navigation. A connection notification appears when a controller is detected.

All twenty settings persist to localStorage across sessions, with automatic migration when the save schema updates."

**Español:**

"En cuanto a accesibilidad: el juego soporta reducción de destellos, reducción de movimiento, intensidad configurable de sacudida de cámara, HUD de alto contraste y un atajo de silencio accesible en cualquier momento.

Los controles táctiles con un joystick virtual lo hacen jugable en dispositivos móviles. La superposición aparece automáticamente en pantallas táctiles con botones de disparo, pausa, silencio y cambio de arma.

El soporte de gamepad funciona con controladores Xbox y PlayStation — incluyendo movimiento analógico, zonas muertas y navegación completa de menús. Una notificación de conexión aparece cuando se detecta un controlador.

Las veinte opciones de configuración persisten en localStorage entre sesiones, con migración automática cuando el esquema de guardado se actualiza."

---

## Section 7: Conclusion (4:45 – 5:00)

**Show:** Title screen with the game URL visible.

**English:**

"Chrono Defender is a complete, playable arcade game — built with modern web technologies, fully tested, professionally structured, and publicly deployed. No backend, no secrets, no external assets. Just TypeScript, Web Audio, and Phaser.

You can play it right now at the link on screen, and the full source code is available on GitHub under the MIT license. Thank you."

**Español:**

"Chrono Defender es un juego arcade completo y jugable — construido con tecnologías web modernas, completamente testeado, profesionalmente estructurado y desplegado públicamente. Sin backend, sin secretos, sin recursos externos. Solo TypeScript, Web Audio y Phaser.

Pueden jugarlo ahora mismo en el enlace en pantalla, y el código fuente completo está disponible en GitHub bajo la licencia MIT. Gracias."

---

## Project Links

- **Live Demo:** https://robinsonalexanderquiroz-droid.github.io/chrono-defender/
- **Repository:** https://github.com/robinsonalexanderquiroz-droid/chrono-defender
- **Video:** _(link to be added after recording)_
