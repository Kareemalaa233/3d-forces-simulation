# 3D Force Vector Resolution & Resultant Interactive Simulation

👉 **[🚀 Launch Live 3D Interactive Simulation](https://Kareemalaa233.github.io/3d-forces-simulation/)**

An interactive, dependency-free 3D browser simulation built to help engineering statics students visualize 3D force vector resolution, projection planes, coordinate direction angles, and resultant force calculation.

## 🎯 Problem Statement (Question 4)
> **Determine the magnitude and coordinate direction angles of the resultant force.**

### 1. Force $\mathbf{F}_1 = 400\text{ N}$ (Two-Stage Planar Resolution)
- **Stage 1 (Vertical Projection Plane, $60^\circ$ from $+z$):**
  - $F_{1z} = 400 \cos(60^\circ) = +200.00\text{ N}$
  - $F_{1xy} = 400 \sin(60^\circ) = 346.41\text{ N}$
- **Stage 2 (Horizontal $XY$-Plane, $20^\circ$ from $+x$ toward $-y$):**
  - $F_{1x} = 346.41 \cos(20^\circ) = +325.52\text{ N}$
  - $F_{1y} = -346.41 \sin(20^\circ) = -118.48\text{ N}$
- **Cartesian Vector Form:**
  $$\mathbf{F}_1 = \{325.52\mathbf{i} - 118.48\mathbf{j} + 200.00\mathbf{k}\}\text{ N}$$

### 2. Force $\mathbf{F}_2 = 500\text{ N}$ (Single-Click Coordinate Direction Angle Resolution)
Defined directly by its coordinate direction angles $\alpha_2 = 60^\circ$, $\beta_2 = 60^\circ$, $\gamma_2 = 135^\circ$:
- $F_{2x} = 500 \cos(60^\circ) = +250.00\text{ N}$
- $F_{2y} = 500 \cos(60^\circ) = +250.00\text{ N}$
- $F_{2z} = 500 \cos(135^\circ) = -353.55\text{ N}$
- **Cartesian Vector Form:**
  $$\mathbf{F}_2 = \{250.00\mathbf{i} + 250.00\mathbf{j} - 353.55\mathbf{k}\}\text{ N}$$

### 3. Resultant Force $\mathbf{F}_R = \mathbf{F}_1 + \mathbf{F}_2$
- **Components:**
  - $F_{Rx} = 325.52 + 250.00 = +575.52\text{ N}$
  - $F_{Ry} = -118.48 + 250.00 = +131.52\text{ N}$
  - $F_{Rz} = 200.00 - 353.55 = -153.55\text{ N}$
- **Magnitude:**
  $$|\mathbf{F}_R| = \sqrt{(575.52)^2 + (131.52)^2 + (-153.55)^2} = \mathbf{610.0\text{ N}}$$
- **Coordinate Direction Angles:**
  - $\alpha = \cos^{-1}(575.52 / 610.0) = \mathbf{19.4^\circ}$
  - $\beta = \cos^{-1}(131.52 / 610.0) = \mathbf{77.5^\circ}$
  - $\gamma = \cos^{-1}(-153.55 / 610.0) = \mathbf{104.6^\circ}$

---

## 🎮 Interactive Controls

| Action | Control |
| :--- | :--- |
| **Resolve $\mathbf{F}_1$ (Step 1/2)** | **1st Click on $\mathbf{F}_1$** splits it into $F_{1z}$ and $F_{1xy}$ on its vertical plane |
| **Resolve $\mathbf{F}_1$ (Step 2/2)** | **2nd Click on $\mathbf{F}_1$ / $F_{1xy}$** splits $F_{1xy}$ into $F_{1x}$ and $F_{1y}$ on the $XY$-plane |
| **Resolve $\mathbf{F}_2$ (1-Click)** | **Click on $\mathbf{F}_2$** resolves it directly into $F_{2x}$, $F_{2y}$, and $F_{2z}$ using its direction angles |
| **Highlight 3D Planes** | **Hover** over any dotted plane outline to highlight its 3D surface |
| **Isolate Forces** | Toggle **👁 F₁** and **👁 F₂** buttons to inspect one force at a time |
| **Undo ("Before & After")** | Click **↩ Undo** to step backward through resolutions |
| **3D Orbit / Pan / Zoom** | **Left-drag** to orbit 360°, **Right-drag** (or `Shift`+drag) to pan, **Scroll** or use **`−`/`+`/Slider** (`15%`–`600%`) to zoom |

---

## 📂 Project Structure

```text
3d-forces-simulation/
├── index.html          # Main application entry point
├── css/
│   └── styles.css      # Full-viewport canvas and floating control bar styles
├── js/
│   └── simulation.js   # 3D projection engine, vector resolution math, and interaction handlers
├── LICENSE             # MIT License
└── README.md           # Project documentation and mathematical solution
```

## 🚀 Running Locally

No build tools or external dependencies are required. Simply open `index.html` in any modern web browser, or serve the folder with any static server:

```bash
npx serve .
```
