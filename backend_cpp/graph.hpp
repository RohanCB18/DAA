#pragma once
#include <vector>
#include <string>
#include <cmath>

// ── Currency Constants ──────────────────────────────────────────────
const std::vector<std::string> CURRENCIES = {
    "INR", "USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "SGD", "HKD"
};
const int NUM_CURRENCIES = 10;

// Currency index helpers
enum CUR { INR=0, USD, EUR, GBP, JPY, CHF, AUD, CAD, SGD, HKD };

// ── Edge ────────────────────────────────────────────────────────────
struct Edge {
    int from;
    int to;
    double rate;
};

// ── Cycle ───────────────────────────────────────────────────────────
struct Cycle {
    std::vector<int> path;       // node indices (includes start repeated at end)
    std::vector<double> rates;   // exchange rates along each hop
    double product;              // product of all rates
    double profit_percent;       // (product - 1) * 100

    bool isProfitable() const {
        if (path.empty()) return false;
        int hops = path.size() - 1;
        return product > std::pow(1.0005, hops);
    }
};

// ── Allocation (for knapsack) ───────────────────────────────────────
struct Allocation {
    int cycle_index;
    double capital;
    double expected_profit;
    double viability_score;
};

struct KnapsackResult {
    std::vector<Cycle> cycles;
    std::vector<Allocation> allocations;
    double total_capital;
    double total_expected_profit;
    double total_return_percent;
};

struct SimulationTick {
    int tick_index;
    std::vector<Edge> edges;
};

struct SimulationScenario {
    int id;
    std::string name;
    std::string description;
    std::vector<SimulationTick> ticks;
};

// ── Graph ───────────────────────────────────────────────────────────
struct Graph {
    int n;
    std::vector<std::vector<double>> adj;  // 0.0 means no edge
    std::vector<Edge> edges;

    Graph() : n(NUM_CURRENCIES), adj(NUM_CURRENCIES, std::vector<double>(NUM_CURRENCIES, 0.0)) {}
    Graph(int n) : n(n), adj(n, std::vector<double>(n, 0.0)) {}

    void addEdge(int from, int to, double rate) {
        adj[from][to] = rate;
        edges.push_back({from, to, rate});
    }

    void clear() {
        for (auto& row : adj) std::fill(row.begin(), row.end(), 0.0);
        edges.clear();
    }
};
