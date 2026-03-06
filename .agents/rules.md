# FINAPP UI RULES

## Speed Dial Floating Action Button (FAB)

**CRITICAL**: DO NOT MODIFY THE SPEED DIAL FAB IMPLEMENTATION.

- The Speed Dial (Expandable FAB) located at the bottom right (`right: 16px; bottom: 90px;`) is visually perfect and fully finished.
- It deploys as a fan / hand-like radial animation ("Proyección" shoots diagonally up-left, "Movimiento" shoots straight up).
- It uses a custom glassmorphism aesthetic (`backdrop-filter`) and precise SVG icons.
- The rocket button uses a specific green/blue gradient.
- Do NOT replace this implementation with a single standard FAB, do NOT change the animation, and do NOT change the CSS layout of `.expandable-fab`, `.fab-options`, `.fab-option`, nor `.bg-rocket` without EXPLICIT and EXACT orders from the user overriding this rule.

---

## Running the Project

**CRITICAL**: IF YOU ARE A NEW AGENT IN A NEW CHAT, AND NEED TO RUN THIS PROJECT, READ THIS FIRST.
Because heavy artifact folders (`node_modules`, `src-tauri/target`, `src-tauri/gen`) might be deleted to save space, you MUST run the following commands to test or run the project locally before trying to run `npm run dev`:

1. `npm install` (To reinstall node modules)
2. `npm run dev` (To start the local SvelteKit server for web evaluation)
3. For mobile / Tauri, `npm run tauri dev` or `npm run dev:expo` as needed, but only AFTER `npm install` has fully run.
