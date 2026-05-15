# QuantArb — Arbitrage Viability Engine

A full-stack currency arbitrage detection system with a Python backend (graph engine + algorithms + WebSocket server) and a React frontend (live interactive dashboard with D3 graph visualization).

Built for the **Course: CD343AI — Design and Analysis of Algorithms**.

## Project Architecture

The system treats the global currency market as a **directed weighted graph**, detects arbitrage opportunities (profitable currency cycles) using graph algorithms, scores each opportunity by its execution viability, and allocates capital optimally.

```
┌─────────────────────────────────────────────────────┐
│                   RATE SIMULATOR                     │
│  Generates tick-by-tick currency exchange rates      │
└──────────────────────┬──────────────────────────────┘
                       │ 
                       ▼
┌─────────────────────────────────────────────────────┐
│              GRAPH ENGINE (Python)                   │
│  Maintains a directed graph with penalised edges     │
│  using Circular Buffers for variance tracking        │
│                                                      │
│  Algorithms:                                         │
│  - Modified DFS (Cycle Detection)                    │
│  - Bellman-Ford (Negative Cycle Detection)           │
│  - Floyd-Warshall (Global Arbitrage Scan)            │
│  - Fractional Knapsack (Capital Allocation)          │
└──────────────────────┬──────────────────────────────┘
                       │ WebSocket (ws://localhost:8765)
                       ▼
┌─────────────────────────────────────────────────────┐
│             DASHBOARD (React + Vite)                 │
│  Live interactive SVG/D3 network visualization       │
│  with real-time arbitrage cycle lists and            │
│  dynamic capital allocation stacked bars.            │
└─────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Backend (Python)
Requires **Python 3.10+**. The backend is pure Python, utilizing only the `websockets` library.

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend server will start at `ws://localhost:8765` and begin simulating the market tick loop (500ms intervals).

### 2. Frontend (React + Vite)
Requires **Node.js 18+**. The frontend uses Vite for fast HMR and React for the UI.

```bash
cd frontend
npm install
npm run dev
```

The React dashboard will be available at `http://localhost:5173`.

## Core Algorithms Implemented

All algorithms are implemented from scratch in pure Python (`backend/algorithms/`).

1. **Modified DFS (Unit II)**
   - **Purpose:** Finds all profitable simple cycles up to 5 hops.
   - **Modification:** Tracks a `running_product` during traversal; flags cycles where product > 1.0.

2. **Bellman-Ford with Early Termination (Unit IV)**
   - **Purpose:** Quickly detects negative cycles (arbitrage) after individual edge updates.
   - **Modification:** Negative-log transform of rates + early termination if no relaxation occurs.

3. **Floyd-Warshall (Unit IV)**
   - **Purpose:** All-pairs shortest paths for a periodic full global scan.
   - **Detection:** Negative values on the distance matrix diagonal indicate arbitrage cycles.

4. **Circular Buffer / Variance Penalty (Unit III)**
   - **Purpose:** Space-time tradeoff implementation.
   - **Implementation:** Uses an O(K) space fixed ring buffer to compute variance in O(1) time, avoiding unbounded history growth.

5. **Fractional Knapsack (Unit IV)**
   - **Purpose:** Optimally allocates limited capital across multiple simultaneous arbitrage opportunities.
   - **Greedy Approach:** Sorts detected cycles by their `Viability Score` (profit / risk) to weight density, then fills the knapsack.

## Design Highlights

- **Visuals:** Dark theme with glassmorphism, animated glow effects, and gradient UI components.
- **D3 Graph:** Built a custom React-SVG force-directed graph renderer with interactive directed arrows and dynamic edge coloring (green=stable, red=volatile).
- **Responsiveness:** Full responsive flex/grid layouts.
