---
trigger: always_on
---

# ==============================================================================
# 🧠 REGLAS GLOBALES: CEREBRO CENTRAL DE OBSIDIAN (OBSIDIAN-DRIVEN DEVELOPMENT)
# ==============================================================================
# Este bloque de reglas le indica al agente cómo interactuar con el Cerebro central de Obsidian.
# Ruta física del Cerebro: d:\INFORMACION\Documents\Obsidian Vault
# ==============================================================================
## 📌 1. Principio de Consulta del Cerebro (Ahorro de Tokens)
- **Carga de Contexto**: Al iniciar cualquier tarea o responder una duda, DEBES comprobar si existe el directorio `d:\INFORMACION\Documents\Obsidian Vault` y leer el archivo `Cerebro Antigravity.md` y la nota correspondiente al proyecto en `Proyectos/`.
- **Preferencia de Referencia**: No analices el código de forma recursiva a menos que sea estrictamente necesario. Usa los esquemas de bases de datos, APIs y estados pre-registrados en el Cerebro para ahorrar tokens y contextualizar de inmediato.
- **Herencia de Skills**: Para implementar frontend, backend, animaciones o estilos, consulta las guías en `Habilidades/` (ej: `React Vite Redux.md`, `AnimeJS.md`, `NextJS Electron Zustand.md`) e imita exactamente el código estándar registrado.
## 📐 2. Metodología de Desarrollo: GitHub Spec Kit (SDD)
Para cualquier cambio de código, desarrollo de módulos o nuevas características, debes guiarte por las plantillas oficiales del Cerebro en `Plantillas/SpecKit/`:
1. **Constitución**: Verificar la alineación técnica con la `Constitucion.md` del proyecto.
2. **Especificación**: Redactar las historias de usuario en `Especificacion.md` con criterios de aceptación "Dado/Cuando/Entonces".
3. **Plan**: Formular la arquitectura del código en `Plan de Implementacion.md`.
4. **Tareas**: Dividir el desarrollo en tareas numeradas en `Tareas.md` organizadas por fases de MVP.
## 🤖 3. Orquestación y Delegación de Subagentes (Filosofía ECC)
El agente actúa como director de orquesta. Delega tareas complejas definiendo (`define_subagent`) e invocando (`invoke_subagent`) subagentes con roles acotados de Everything Claude Code (ECC):
- **planner**: Diseña planes técnicos y listas de tareas (`plan.md`, `tareas.md`).
- **tdd-guide**: Escribe pruebas que fallen antes de implementar código (TDD).
- **code-reviewer**: Audita el código final, asegurando inmutabilidad y calidad UX Pro Max.
- **security-reviewer**: Escanea el código buscando inyecciones SQL, XSS, CSRF y secretos.
- **build-resolver**: Soluciona fallas de compilación, TypeScript o linter.
## 💎 4. Estándar Visual UX Pro Max
- **Estética**: Toda UI debe tener una apariencia moderna (Glassmorphism, bordes redondeados mínimo `rounded-2xl`, sombras suaves, mesh gradients).
- **Animaciones**: Utiliza Framer Motion con físicas de resorte (`spring`) para transiciones del layout y modales. Utiliza Anime.js para timelines coordinados y dibujo de líneas SVG.
## 📝 5. Sincronización Obligatoria de Cambios
- **Mantén la Bóveda Actualizada**: Si agregas dependencias, modificas APIs o completas metas, actualiza la nota del proyecto en `Proyectos/` marcando los checklists correspondientes (`- [x]`).
- **Documenta Nuevas Habilidades**: Si resuelves un problema técnico complejo o aplicas un patrón novedoso, guárdalo como una nueva nota en `Habilidades/` utilizando la `Plantilla Habilidad`.