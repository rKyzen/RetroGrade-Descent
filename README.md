# RETROGRADE DESCENT 🚀
### Game Design Document & Project Manual

> **"Land blind as avionics regress."**  
> An intense arcade celestial lander simulation where each successful touchdown strips away cockpit instrumentation across 10 calibrated technological retrogression stages—until pilots must navigate through total optical blackout solely via acoustic sonar ping frequencies.

---

## 🌟 Overview & Key Features

* **3 Planetary Descent Targets**:
  * 🌕 **The Moon (Luna)**: Earth's satellite. Low gravity ($36\text{ px/s}^2$), zero atmospheric drag ($0.00\text{ atm}$ vacuum), basalt mare basins and impact craters.
  * 🔴 **Mars (Ares)**: The Red Planet. Medium gravity ($52\text{ px/s}^2$ • $1.45\times$), thin $CO_2$ atmosphere ($0.01\text{ atm}$) with dynamic red dust devil squalls, iron-oxide canyons and dunes.
  * 🪐 **Venus (Cytherea)**: The Morning Star. Extreme gravity ($68\text{ px/s}^2$ • $1.90\times$), crushing sulfuric acid atmosphere ($90.0\text{ atm}$) with violent gale shears, scorched volcanic basalt and molten calderas.

* **30 Unique Campaign Maps (10 Levels per Planet)**:
  * Each planet features **10 distinct maps** that progressively increase in physical and environmental difficulty: narrower landing pads, higher wind shears, more micrometeorites/ejecta, and strictly restricted fuel capacities.

* **10-Step Interactive Retrogression Flow Map**:
  * Every level (1 through 10) maps 1-to-1 to a strictly calibrated avionics degradation step, systematically stripping modern glass cockpit flight computers until the pilot must execute a blind touchdown in 95% optical darkness purely by acoustic sonar audio pings.

* **3 Engaging Flight Modes**:
  * 🛰️ **Solo Expedition**: Pilot through all 10 campaign maps experiencing progressive avionics degradation.
  * 🤖 **Play Against AI Bot**: Race an autonomous AI pilot in split-screen across 3 distinct personas:
    * **HAL-9000** (`#ef4444` Crimson): Balanced, highly calculated descent targeting high score multipliers.
    * **Apollo AGC-1** (`#38bdf8` Cyan): Safe MIT AGC historical emulation, conservative path prioritizing safe pad touchdowns.
    * **Voyager-X** (`#f59e0b` Gold): Aggressive deep-space probe, high-speed long-range pad hunter targeting Charlie and Omega.
  * 👥 **2-Player Split Screen Duel**: Side-by-side local PvP racing on shared physical terrain to claim high-multiplier platforms first.

* **Forgiving & Responsive Landing Envelope**:
  * Safe Touchdown Limits: Vertical Velocity $V_y \le 75\text{ px/s}$, Horizontal Velocity $V_x \le 45\text{ px/s}$, Attitude Tilt $\le 18^\circ$.
  * Landing gear equipped with hydraulic dampening spring suspension to prevent premature rebound bounces.

* **Customizable Keyboard Bindings**: Interactive in-game controls rebinder for both Player 1 and Player 2 with `localStorage` persistence and human-friendly key formatting.

* **Live Interactive Gameplay Preview Canvas**: Clean 2-column title screen featuring an autonomous real-time descent simulation with live trajectory vector prediction and thruster particle physics.

* **Multiple Landing Platforms & Distance Multipliers**:
  * 🟢 **PAD ALPHA (1.0x)**: Safe, wide plateau ($\sim 450\text{m}$ from insertion).
  * 🔵 **PAD BRAVO (2.0x)**: Intermediate outpost situated in crater gap ($\sim 1200\text{m}$).
  * 🟡 **PAD CHARLIE (3.5x)**: High-altitude basalt ridge ($\sim 2000\text{m}$).
  * 🔴 **PAD OMEGA (5.0x)**: Extreme canyon abyss ($\sim 2800\text{m}$) awarding a massive 5x score multiplier for courageous fuel management!

---

## 🗺️ Campaign Architecture & User Flow

```
[ TITLE SCREEN ]
       │
       ▼
[ STEP 1: CELESTIAL TARGET ] ──► Choose Planet: The Moon (36 px/s²) | Mars (52 px/s²) | Venus (68 px/s²)
       │
       ▼
[ STEP 2: FLIGHT PROFILE ]   ──► Choose Mode: Solo Expedition | Play Against AI | 2-Player Split-Screen
       │
       ▼
[ STEP 3: CRAFT CUSTOMIZE ]  ──► Pilot Callsigns | Hull Liveries & Thruster Plume Tint | AI Persona
       │
       ▼
[ STEP 4: SECTOR SELECTION ] ──► 10-Step Interactive Retrogression Flow Map + 10 Planetary Sector Maps
       │
       ▼
[ DESCENT SIMULATION ]       ──► Progressive avionics degradation from Level 1 to Level 10
```

---

## ⚡ 10-Level Retrogression Flow Map

The following matrix governs instrument availability and environmental challenge across Levels 1 through 10 on all planets:

| Level | Retrogression Stage | Status Badge | Fuel | Wind | Hazards | Decommissioned Flight Systems | Active Operational Instruments |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **01** | **Stage 1: Full Glass Cockpit** | `FULL AVIONICS` | 180L | Calm | 4 | *None (All flight computers nominal)* | Live Dotted Trajectory Predictor, Velocity Vector Pip, Landing Guidance Reticle, Tactical Radar Minimap, 180L Auxiliary Tanks. |
| **02** | **Stage 1: Telemetry Drift** | `TELEMETRY DRIFT` | 165L | 10 px/s | 5 | Aux Fuel Tanks Jettisoned (Standard 165L) | Live Dotted Trajectory Arc, Radar Minimap, Velocity Pip, Digital Speedometers. Pilot counters crosswind drift. |
| **03** | **Stage 2: Vector Pip Offline** | `NO VECTOR PIP` | 150L | 15 px/s | 6 | Directional Velocity Vector Pip **OFFLINE** | Trajectory Arc, Radar Minimap, Digital Telemetry HUD (Numeric $V_x / V_y$). Pilot flies by numbers. |
| **04** | **Stage 2: Predictor Offline** | `NO PREDICTOR` | 140L | 20 px/s | 7 | Dotted Trajectory Arc **DECOMMISSIONED**, Touchdown Reticle **OFFLINE** | Tactical Radar Minimap, Digital HUD. Predictive physics terminated; fly by momentum intuition. |
| **05** | **Stage 3: Radar Strobe Decay** | `RADAR STROBE` | 130L | 25 px/s | 8 | Continuous Radar Sweep **DEGRADED** (Pulses once every 2.0s) | Periodic Strobe Radar Pulse, Digital Altimeter & Speedometers. Increased debris hazard density. |
| **06** | **Stage 3: Altimeter Offline** | `AUDIO ALTIMETER` | 125L | 30 px/s | 9 | Digital Laser Altimeter **OFFLINE** | Acoustic Proximity Chirps, Radar Strobe, Digital Speedometers. Pilot gauges altitude by audio chirp cadence. |
| **07** | **Stage 4: Sensor CRT Glitch** | `SENSOR GLITCH` | 120L | 35 px/s | 10 | Tactical Radar Minimap **PERMANENTLY OFFLINE**, CRT Static Noise | Analog Compass Bearing Needle, Acoustic Audio. Speedometer displays glitch with electromagnetic static. |
| **08** | **Stage 4: Analog Fallback** | `ANALOG GAUGES` | 115L | 38 px/s | 11 | Digital Speedometers **OFFLINE**, Silicon Avionics Cut | Mechanical Damped Fuel Needle ($\sim 300\text{ms}$ lag), Audio Altitude Beacons, Visual Sonar Pulse Ring. |
| **09** | **Stage 5: Optical Sensor Decay**| `75% BLIND` | 110L | 42 px/s | 12 | Cockpit Optical Sensors **75% BLIND** (Opaque static fog) | Acoustic Sonar Frequency Sweeps (200Hz - 1200Hz), Emergency Pad Strobe Glow, Hydraulic Touchdown Sensors. |
| **10** | **Stage 5: Total Sensory Blackout** | `BLIND BLACKOUT` | 100L | 46 px/s | 14 | **ALL INSTRUMENTS & DISPLAYS DEAD**, 95% Optical Darkness | **Acoustic Sonar Flight Pitch Only** (Pitch sweeps higher as surface nears). Pilot lands purely by ear. |

---

## 🪐 Planetary Worlds & 30 Campaign Maps

### 1. The Moon (Luna)
* **Surface Gravity**: $36\text{ px/s}^2$ • **Atmosphere**: $0.00\text{ atm}$ (Vacuum) • **Engine Thrust**: $95\text{ px/s}^2$
* **Visual Identity**: Dark cosmic void starfield, glowing Earth orb, gray basalt regolith terrain (`#475569`).
* **Campaign Sectors (Maps 1 - 10)**:
  1. *Tranquillity Base* (Smooth Lowlands • 160px pads)
  2. *Ocean of Storms* (Undulating Mare Basin)
  3. *Tycho Highlands* (Impact Crater Ridges)
  4. *Basalt Canyons* (Basalt Rift Gorge)
  5. *Fra Mauro Craters* (Volcanic Calderas)
  6. *Sinus Iridum* (Bay of Rainbows Cliffline)
  7. *Apennine Crags* (Mountain Spire Trench)
  8. *Clavius Chasm* (Ancient Crater Floor)
  9. *Dark Side Trench* (Lunar Far Side Ravine)
  10. *The Void Gauntlet* (Deep Void Rift • 55px pads)

### 2. Mars (Ares)
* **Surface Gravity**: $52\text{ px/s}^2$ ($1.45\times$) • **Atmosphere**: $0.01\text{ atm}$ (Thin $CO_2$ + Dust Devil Squalls) • **Engine Thrust**: $118\text{ px/s}^2$
* **Visual Identity**: Rust-red ochre sky gradient (`#1c0a06` to `#3b1207`), red iron-oxide canyons (`#9a3412`), amber beacons.
* **Campaign Sectors (Maps 1 - 10)**:
  1. *Chryse Planitia* (Golden Iron Plains)
  2. *Utopia Basin* (Polygonal Impact Basin)
  3. *Noctis Labyrinthus* (Labyrinth of Canyons)
  4. *Valles Marineris* (Grand Solar Canyon)
  5. *Olympus Caldera* (Volcanic Shield Summit)
  6. *Hellas Basin* (Dense Atmosphere Sink)
  7. *Cerberus Fossae* (Fissure Fault Crags)
  8. *Cydonia Monoliths* (Mesa & Butte Fields)
  9. *Elysium Dust Abyss* (Raging Dust Chasm)
  10. *Ares Apex Gauntlet* (Martian Void Gauntlet)

### 3. Venus (Cytherea)
* **Surface Gravity**: $68\text{ px/s}^2$ ($1.90\times$) • **Atmosphere**: $90.0\text{ atm}$ (Crushing Sulfuric Acid Deck) • **Engine Thrust**: $138\text{ px/s}^2$
* **Visual Identity**: Toxic amber-yellow sulfuric haze (`#191803` to `#2e2c04`), volcanic scorched basalt (`#713f12`), acid-gold beacons.
* **Campaign Sectors (Maps 1 - 10)**:
  1. *Aphrodite Terra* (Highland Crustal Plateau)
  2. *Ishtar Plateau* (Dense Atmosphere Lowlands)
  3. *Maxwell Montes* (Metallic Pyrite Ridge)
  4. *Lakshmi Planum* (Volcanic Lava Plains)
  5. *Sif Mons Caldera* (Corrosive Shield Volcano)
  6. *Diana Chasm* (Tectonic Acid Trench)
  7. *Beta Regio Crags* (Volcanic Lightning Rift)
  8. *Atalanta Planitia* (Scorched Lowland Sink)
  9. *Maat Mons Corona* (Dense Acid Fog Chasm)
  10. *Cytherean Inferno* (Crushing Acidic Void)

---

## 🎮 Quick Start & How to Run

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm` (included with Node.js)

### Installation & Launch
1. Clone the repository:
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
4. Build for production:
   ```bash
   npm run build
   ```
5. Open your browser at:
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

*(All keyboard controls can be interactively rebound in **SETTINGS & CONTROLS** with automatic `localStorage` persistence)*

---

## 🛡️ Flight Physics & Landing Tolerances

* **Touchdown Velocity Envelope**:
  * Safe Vertical Speed: $|V_y| \le 75\text{ px/s}$
  * Safe Horizontal Speed: $|V_x| \le 45\text{ px/s}$
  * Safe Attitude Tilt: $|\theta| \le 18^\circ$
  * Platform Footing: Lander must contact an active landing platform pad within bounds.
* **Acoustic Sonar Navigation**:
  * In Levels 9 and 10 (Sensory Blackout), the acoustic sonar emits tone pulses between $200\text{ Hz}$ and $1200\text{ Hz}$.
  * As the craft approaches the ground, the audio pitch rises rapidly, allowing the pilot to judge altitude and arrest vertical velocity without visual instruments.
