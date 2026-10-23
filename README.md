# RETROGRADE DESCENT 🚀
### Game Design Document & Project Manual

> **"Land blind as avionics regress."**  
> An intense arcade lunar lander simulation where each successful touchdown strips away cockpit instrumentation across 5 historical technological eras—until pilots must navigate through total optical blackout solely via acoustic sonar ping frequencies.

---

## 🌟 Overview & Key Features

* **Rigorous Vector Flight Dynamics**: Semi-implicit Euler integration governing lunar gravity ($38\text{ px/s}^2$), main gimbal engine vector thrust, and dual-nozzle reaction control system (RCS) attitude jets.
* **3 Engaging Game Modes**:
  * 🛰️ **Solo Expedition**: Pilot through all 10 lunar maps experiencing progressive equipment degradation.
  * 🤖 **Play Against AI Bot**: Race an autonomous AI lunar pilot with 3 distinct computer personas:
    * **HAL-9000** (`#ef4444` Crimson): Balanced, highly calculated descent targeting high score multipliers.
    * **Apollo AGC-1** (`#38bdf8` Cyan): Safe MIT AGC historical emulation, conservative path prioritizing safe pad touchdowns.
    * **Voyager-X** (`#f59e0b` Gold): Aggressive deep-space probe, high speed long-range pad hunter targeting Charlie and Omega.
  * 👥 **2-Player Split Screen Duel**: Side-by-side local PvP racing on shared physical terrain to claim high-multiplier platforms first.
* **10 Distinct Lunar Maps across 5 Regression Stages**:
  * **Map 1: Tranquillity Base** *(Stage 1: Full Glass Cockpit)* — Smooth rolling lowlands, live dotted trajectory predictor, tactical radar.
  * **Map 2: Ocean of Storms** *(Stage 1: Telemetry Drift)* — Rolling volcanic plain with gentle crosswinds ($10\text{ px/s}$).
  * **Map 3: Copernicus Crater** *(Stage 2: Trajectory Stripped)* — Dotted trajectory line goes offline; fly by intuition.
  * **Map 4: Mare Serenitatis** *(Stage 2: High Density Crags)* — Jagged basalt spires dividing the descent corridor.
  * **Map 5: Hadley Rille** *(Stage 3: Sensor Decay)* — Fissure canyon where radar refresh decays into an optical strobe beacon.
  * **Map 6: Fra Mauro Highlands** *(Stage 3: Crosswind Squalls)* — Intense crosswind gusts ($22\text{ px/s}$) requiring continuous RCS counter-steering.
  * **Map 7: Descartes Highlands** *(Stage 4: Analog Fallback)* — Digital speedometers dead; mechanical damped fuel needle (~300ms lag).
  * **Map 8: Tycho Crater** *(Stage 4: Extreme Basin)* — Rugged volcanic spires and high-speed orbital debris.
  * **Map 9: South Pole Shackleton** *(Stage 5: Sensory Blackout)* — 95% optical darkness; navigate blind by acoustic sonar audio chirps.
  * **Map 10: Mons Huygens Peak** *(Stage 5: Apex Blackout)* — The ultimate mountain summit blind descent.
* **Customizable Keyboard Bindings**: Interactive in-game controls rebinder for both Player 1 and Player 2 with `localStorage` persistence and human-friendly key formatting.
* **Live Interactive Gameplay Preview Canvas**: Clean 2-column title screen featuring an autonomous real-time Apollo descent simulation with live trajectory vector prediction and thruster particle physics.
* **Multiple Landing Platforms & Distance Multipliers**:
  * 🟢 **PAD ALPHA (1.0x)**: Safe, wide plateau ($\sim 450\text{m}$ from insertion).
  * 🔵 **PAD BRAVO (2.0x)**: Intermediate outpost situated in crag gap ($\sim 1200\text{m}$).
  * 🟡 **PAD CHARLIE (3.5x)**: High-altitude basalt ridge ($\sim 2000\text{m}$).
  * 🔴 **PAD OMEGA (5.0x)**: Extreme canyon abyss ($\sim 2800\text{m}$) awarding a massive 5x score multiplier for courageous fuel management!
* **Real-Data Flight Log & Scoreboard**:
  * Persistent storage (`localStorage`) preloaded with authentic Apollo astronaut missions.
  * Filterable by Solo, AI Duel, and 2P Duel.
* **Vessel Customization Bay**: Interactive title screen preview with custom hull liveries (Apollo Emerald, Cyber Titanium, Solar Regolith, Ares Odyssey, Cosmic Nebula).

---

## 🎮 Quick Start & How to Run

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm` (included with Node.js)

### Installation & Launch
1. Clone or download the repository:
   ```bash
   git clone https://github.com/rKyzen/RetroGrade-Descent.git
   cd RetroGrade-Descent
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at:
   👉 **`http://localhost:3000`**

---

## 🕹️ Controls (Fully Customizable in Settings)

### Default Player 1 Controls (Solo / Duel)
| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Main Rocket Thruster** | <kbd>W</kbd> or <kbd>↑ Up Arrow</kbd> | On-screen `THRUST` Button |
| **Rotate Counter-Clockwise (Left)** | <kbd>A</kbd> or <kbd>← Left Arrow</kbd> | On-screen `◄` Steer Button |
| **Rotate Clockwise (Right)** | <kbd>D</kbd> or <kbd>→ Right Arrow</kbd> | On-screen `►` Steer Button |
| **Quick Restart Run** | <kbd>R</kbd> | On-screen `RESET` Button |

### Default Player 2 Controls (2-Player Duel)
| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Main Rocket Thruster** | <kbd>↑ Up Arrow</kbd> | On-screen P2 `▲` Button |
| **Rotate Counter-Clockwise (Left)** | <kbd>← Left Arrow</kbd> | On-screen P2 `◄` Button |
| **Rotate Clockwise (Right)** | <kbd>→ Right Arrow</kbd> | On-screen P2 `►` Button |

*(All keyboard controls can be interactively rebound in **SETTINGS & CONTROLS**)*

---

## 📋 Detailed Game Design Document (GDD)

### 1. High Concept & Gameplay Pillars
* **Pillar 1: Information Asymmetry as Difficulty**: The challenge increases by progressively stripping cockpit instruments across 5 historical eras.
* **Pillar 2: Inertial Flight Physics**: Lunar flight demands understanding momentum, kinetic energy conservation, vector thrust decomposition, and gentle altitude descent throttling.
* **Pillar 3: Sensory Synesthesia**: Transitioning reliance from visual glass displays to pitch-modulated auditory sonar in total optical blackout.
* **Pillar 4: Risk vs. Reward Navigation**: Distant landing platforms award up to 5x score multipliers for navigating through jagged crags and drifting debris.

### 2. Environmental Hazards & Progressive Level Difficulty
* **Drifting Orbital Micrometeorites / Debris**: Rotating space hazards drift across approach corridors. High-speed collisions cause severe structural breaches, while grazing impacts impart kinetic deflection impulses that require active pilot recovery.
* **Atmospheric Crosswind Turbulence**: Dynamic crosswinds push the vessel laterally, scaling from gentle $10\text{ px/s}$ breezes in Map 2 up to intense $41\text{ px/s}$ squalls in Maps 9-10.
* **Basalt Ridge Spires**: Sharp volcanic crags divide the lunar plateaus, forcing pilots to maintain safe altitude clearance.
* **Progressive Fuel Burn Scaling**: Fuel consumption scales progressively per epoch, demanding disciplined engine throttling to claim distant pads.

### 3. Physics & Safe Touchdown Envelope (Forgiving & Accessible)
To execute a successful touchdown without structural collapse, the vessel's telemetry must satisfy:
1. **Vertical Speed ($V_y$)**: Below $75\text{ px/s}$ (smooth, accessible touchdowns).
2. **Horizontal Drift ($V_x$)**: Below $45\text{ px/s}$ (generous lateral drift tolerance).
3. **Attitude Tilt Angle**: Within $\pm 18^\circ$ of true vertical ($0^\circ$).
4. **Platform Alignment**: Landing footpads or fuselage aligned over the designated platform.
5. **Hydraulic Suspension Cushion**: Touchdowns with slight overspeed or angle (within a $35\%$ margin) are absorbed by the landing gear's hydraulic springs with a soft bounce and regolith dust puffs.

### 4. Scoring Architecture
$$\text{Touchdown Score} = \Big(\text{Epoch Bonus} + \text{Fuel Conserved Bonus} + \text{Precision Landing Bonus}\Big) \times \text{Pad Multiplier}$$
* **Epoch Bonus**: $\text{Level} \times 1,000\text{ pts}$
* **Fuel Conserved Bonus**: $\text{Remaining Fuel (L)} \times 15\text{ pts}$
* **Precision Bonus**: Up to $350\text{ pts}$ scaled inversely with descent velocity.
* **Pad Multiplier**:
  * Alpha Base: $\times 1.0$
  * Bravo Outpost: $\times 2.0$
  * Charlie Crest: $\times 3.5$
  * Omega Sanctuary: $\times 5.0$

---

## 📁 Repository Structure
```
├── assets/
│   ├── audio/              # Soundtracks and telemetry loop buffers
│   └── images/             # Pixel art sprites (lander vessel, backdrop, platforms, crags)
├── utils/
│   ├── BackgroundMusic.tsx # Sample-accurate audio loop player
│   ├── helper.tsx          # Canvas preparation, input hooks, and audio synthesizers
│   ├── playground-fake.ts  # Local standalone SDK runner
│   └── usePlayground.ts    # Lifecycle state synchronization
├── aiPilot.ts              # Autonomous AI bot pilot with 3 personas (HAL-9000, AGC-1, Voyager-X)
├── keybindings.ts          # Customizable keyboard bindings system with persistence
├── levels.ts               # 10 distinct lunar maps with retrogression stages & terrain configs
├── LivePreviewCanvas.tsx   # Interactive real-time Apollo descent simulation canvas
├── MenuScreens.tsx         # Redesigned 2-column menu system, flow, settings, & manual
├── App.tsx                 # Core flight simulation, render loops, HUD, and viewports
├── constants.ts            # Game configuration, physics constants, and dimensions
├── leaderboard.ts          # Real persistent score tracker and astronaut roster
├── index.html              # Main entry point with Tailwind CDN and web fonts
├── vite.config.ts          # Vite bundler configuration
└── package.json            # Project metadata and dependencies
```

---

## 📜 License & Acknowledgments
Created as an advanced arcade simulation inspired by classic Apollo lunar descent modules and modern retro-futurism. Distributed under the MIT License.
