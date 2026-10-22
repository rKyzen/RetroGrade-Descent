# RETROGRADE DESCENT 🚀
### Game Design Document & Project Manual

> **"Land blind as avionics regress."**  
> An intense arcade lunar lander simulation where each successful touchdown strips away cockpit instrumentation across 5 historical technological eras—until pilots must navigate through total optical blackout solely via acoustic sonar ping frequencies.

---

## 🌟 Overview & Key Features

* **Rigorous Vector Flight Dynamics**: Semi-implicit Euler integration governing lunar gravity ($38\text{ px/s}^2$), main gimbal engine vector thrust, and dual-nozzle reaction control system (RCS) attitude jets.
* **5 Historical Regression Eras**:
  1. **Modern (2026)**: Full digital glass cockpit, velocity pip vector, tactical terrain radar, landing reticle.
  2. **Y2K (2000)**: Guidance reticle and trajectory predictor offline. Manual piloting only.
  3. **Eighties (1984)**: Digital altimeter stripped. Amber proximity strobe and audio chirps.
  4. **Apollo (1969)**: Speedometers dead. Fuel gauge replaced with a laggy mechanical damped needle (~300ms latency).
  5. **Blackout (Final Gauntlet)**: Total sensory darkness. Pilot blind using acoustic sonar ping frequency ($200\text{ Hz}$ at altitude to $1200\text{ Hz}$ on surface contact).
* **Multiple Landing Platforms & Distance Multipliers**:
  * 🟢 **PAD ALPHA (1.0x)**: Safe, wide plateau ($\sim 450\text{m}$ from insertion).
  * 🔵 **PAD BRAVO (2.0x)**: Intermediate outpost situated in crag gap ($\sim 1200\text{m}$).
  * 🟡 **PAD CHARLIE (3.5x)**: High-altitude basalt ridge ($\sim 2000\text{m}$).
  * 🔴 **PAD OMEGA (5.0x)**: Extreme canyon abyss ($\sim 2800\text{m}$) awarding a massive 5x score multiplier for courageous fuel management!
* **Level 1 High-Capacity Auxiliary Tanks**: Level 1 (Epoch 1) starts with **180L of fuel** (+80% bonus capacity over standard 100L) to give pilots ample margin to master distance navigation.
* **2-Player Split Screen Duel Mode**:
  * Simultaneous side-by-side viewports with independent tracking cameras.
  * Shared physical lunar terrain where players see each other's lander and beacons in real time.
  * Player 1 controls: <kbd>W</kbd>, <kbd>A</kbd>, <kbd>D</kbd> (Cyan Apollo Alpha).
  * Player 2 controls: <kbd>↑</kbd>, <kbd>←</kbd>, <kbd>→</kbd> (Amber Vostok Beta).
* **Real-Data Flight Log & Scoreboard**:
  * Local persistent storage (`localStorage`) preloaded with authentic Apollo astronaut missions (Armstrong, Aldrin, Cernan, Conrad, Young, Collins, Shepard, Lovell).
  * Auto-logs every player touchdown or mission end with session callsign, score, pad multiplier, precision rating, and timestamp.
* **Vessel Customization Bay**: Interactive title screen preview with 5 custom hull liveries (Apollo Emerald, Cyber Titanium, Solar Regolith, Ares Odyssey, Cosmic Nebula).
* **Rich Cosmic Visuals**: Multi-depth twinkling starfield, blue marble Earth in deep space, drifting procedural nebulae, dynamic engine spotlights, and volumetric regolith dust kicking up along the lunar surface.

---

## 🎮 Quick Start & How to Run

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm` (included with Node.js)

### Installation & Launch
1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd "project-files (1)"
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

## 🕹️ Controls

### Solo Mode
| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Main Rocket Thruster** | <kbd>W</kbd> or <kbd>↑ Up Arrow</kbd> | On-screen `THRUST` Button |
| **Rotate Counter-Clockwise (Left)** | <kbd>A</kbd> or <kbd>← Left Arrow</kbd> | On-screen `◄` Steer Button |
| **Rotate Clockwise (Right)** | <kbd>D</kbd> or <kbd>→ Right Arrow</kbd> | On-screen `►` Steer Button |
| **Quick Restart Run** | <kbd>R</kbd> | On-screen `RESET` Button |
| **Instant Launch / Confirm** | <kbd>Enter</kbd> or <kbd>Space</kbd> | Primary Action Buttons |

### 2-Player Split Screen Duel Mode
| Player | Thruster | Attitude Tilt Left / Right |
| :--- | :--- | :--- |
| **Player 1 (Apollo Alpha)** | <kbd>W</kbd> | <kbd>A</kbd> / <kbd>D</kbd> |
| **Player 2 (Vostok Beta)** | <kbd>↑ Up Arrow</kbd> | <kbd>← Left Arrow</kbd> / <kbd>→ Right Arrow</kbd> |

---

## 📋 Detailed Game Design Document (GDD)

### 1. High Concept & Gameplay Pillars
* **Pillar 1: Information Asymmetry as Difficulty**: The challenge increases not by introducing unnatural bullet-hell hazards, but by progressively stripping telemetry, simulating real historical equipment degradation.
* **Pillar 2: Inertial Flight Physics**: Lunar flight requires understanding momentum, conservation of kinetic energy, vector decomposition of engine thrust, and gentle altitude descent throttling.
* **Pillar 3: Sensory Synesthesia**: Forcing players to transition their reliance from digital visual dials to auditory sonar feedback in total optical blackout.
* **Pillar 4: Risk vs. Reward Navigation**: Distant landing platforms demand fuel conservation and risk-taking across rugged basalt obstacles in exchange for exponential score multipliers (up to 5x).

### 2. Environmental Hazards & Progressive Level Difficulty
To make lunar piloting an authentic challenge without ruining accessible touchdowns, dynamic environmental hazards are active:
* **Drifting Orbital Micrometeorites / Debris**: Rotating space hazards drift across the approach corridors between pads. High-speed collisions cause severe structural breaches, while grazing impacts impart kinetic deflection impulses that require active pilot recovery.
* **Atmospheric Crosswind Turbulence**: Dynamic crosswinds push the vessel laterally, scaling progressively from gentle $13\text{ px/s}$ breezes in Epoch 1 up to intense $41\text{ px/s}$ squalls in Epoch 5, demanding continuous RCS rotational counter-thrust.
* **Basalt Ridge Spires**: Additional sharp volcanic crags divide the lunar plateaus, forcing pilots to maintain safe clearance when navigating toward distant pads.
* **Progressive Fuel Burn Scaling**: Fuel consumption scales by $+8\%$ per epoch, requiring disciplined engine throttling to claim distant pads.

### 3. Physics & Safe Touchdown Envelope (Forgiving & Accessible)
To execute a successful touchdown without structural collapse, the vessel's telemetry must satisfy:
1. **Vertical Speed ($V_y$)**: Below $75\text{ px/s}$ (increased from $45\text{ px/s}$ for smooth, accessible touchdowns).
2. **Horizontal Drift ($V_x$)**: Below $45\text{ px/s}$ (increased from $25\text{ px/s}$ for generous lateral drift tolerance).
3. **Attitude Tilt Angle**: Within $\pm 18^\circ$ of true vertical ($0^\circ$, increased from $8^\circ$ for relaxed rotational control).
4. **Platform Alignment**: Landing footpads or fuselage aligned over the designated platform.
5. **Hydraulic Suspension Cushion**: Touchdowns with slight overspeed or angle (within a $35\%$ margin) are absorbed by the landing gear's hydraulic springs with a soft bounce and regolith dust puffs, rather than catastrophic failure!

### 4. Decluttered Full-Screen Command Deck
* **Full-Screen 2-Column Bridge**: Edge-to-edge widescreen layout dividing pilot setup from mission briefing, eliminating nested vertical scrolling.
* **Sleek Single-Line Cockpit HUD**: Replaced the multi-row box clutter with a semi-transparent glass bar featuring an integrated fuel progress bar, dynamic speed indicator, target pad beacon, and score counter.

### 5. Scoring Architecture
$$\text{Touchdown Score} = \Big(\text{Epoch Bonus} + \text{Fuel Conserved Bonus} + \text{Precision Landing Bonus}\Big) \times \text{Pad Multiplier}$$
* **Epoch Bonus**: $\text{Epoch Level} \times 1,000\text{ pts}$
* **Fuel Conserved Bonus**: $\text{Remaining Fuel (L)} \times 15\text{ pts}$
* **Precision Bonus**: Up to $350\text{ pts}$ scaled inversely with descent velocity.
* **Pad Multiplier**:
  * Alpha Base: $\times 1.0$
  * Bravo Outpost: $\times 2.0$
  * Charlie Crest: $\times 3.5$
  * Omega Sanctuary: $\times 5.0$

### 4. Technical Stack
* **Framework**: React 18 + TypeScript + Vite
* **Rendering**: High-performance HTML5 Canvas 2D with fixed timestep physics stepper ($60\text{ FPS}$ sub-stepping)
* **Styling**: Tailwind CSS + Custom retro CRT scanline & phosphor noise overlays
* **Audio**: Web Audio API synthesized procedural tones, thruster loops, and telemetry alarms with sample-accurate loop stitching
* **Icons**: Lucide React
* **Storage**: LocalStorage with automatic schema fallback and seed hydration

---

## 📁 Repository Structure
```
├── assets/
│   ├── audio/           # Soundtracks and telemetry loop buffers
│   └── images/          # Pixel art sprites (lander vessel, backdrop, platforms, crags)
├── design/              # Raw design documents and asset manifests
├── utils/
│   ├── BackgroundMusic.tsx  # Sample-accurate audio loop player
│   ├── helper.tsx           # Canvas preparation, input hooks, and audio synthesizers
│   ├── playground-fake.ts   # Local standalone SDK runner
│   └── usePlayground.ts     # Lifecycle state synchronization
├── App.tsx              # Core flight simulation, render loops, HUD, and viewports
├── constants.ts         # Game configuration, physics constants, and dimensions
├── leaderboard.ts       # Real persistent score tracker and astronaut roster
├── index.html           # Main entry point with Tailwind CDN and web fonts
├── vite.config.ts       # Vite bundler configuration
└── package.json         # Project metadata and dependencies
```

---

## 📜 License & Acknowledgments
Created as an advanced arcade simulation inspired by classic Apollo lunar descent modules and modern retro-futurism. Distributed under the MIT License.
