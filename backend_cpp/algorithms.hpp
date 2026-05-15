#pragma once
#include "graph.hpp"
#include <algorithm>
#include <cmath>
#include <limits>
#include <functional>
#include <set>

// ═══════════════════════════════════════════════════════════════════
//  MODE 1 — Modified DFS Cycle Detection
//  Finds the BEST profitable cycle (highest product).
//  Falls back to best cycle even if not profitable.
// ═══════════════════════════════════════════════════════════════════

class DFSDetector {
private:
    const Graph& graph;
    Cycle best_cycle;
    bool found;

    void dfs(int start, int current, std::vector<int>& path,
             std::vector<bool>& in_stack, double running_product) {

        for (int next = 0; next < graph.n; next++) {
            if (graph.adj[current][next] <= 0) continue;

            double new_product = running_product * graph.adj[current][next];

            // Cycle back to start (minimum 3 nodes)
            if (next == start && path.size() >= 3) {
                Cycle cycle;
                cycle.path = path;
                cycle.path.push_back(start);
                cycle.product = new_product;
                cycle.profit_percent = (new_product - 1.0) * 100.0;

                for (size_t i = 0; i + 1 < cycle.path.size(); i++) {
                    cycle.rates.push_back(graph.adj[cycle.path[i]][cycle.path[i + 1]]);
                }

                if (!found || new_product > best_cycle.product) {
                    best_cycle = cycle;
                    found = true;
                }
            }
            // Continue DFS (max depth 5)
            else if (!in_stack[next] && path.size() < 6) {
                in_stack[next] = true;
                path.push_back(next);
                dfs(start, next, path, in_stack, new_product);
                path.pop_back();
                in_stack[next] = false;
            }
        }
    }

public:
    DFSDetector(const Graph& g) : graph(g), found(false) {}

    Cycle detect() {
        found = false;
        best_cycle = Cycle();

        for (int start = 0; start < graph.n; start++) {
            std::vector<bool> in_stack(graph.n, false);
            in_stack[start] = true;
            std::vector<int> path = {start};
            dfs(start, start, path, in_stack, 1.0);
        }
        return best_cycle;
    }

    bool cycleFound() const { return found; }
};


// ═══════════════════════════════════════════════════════════════════
//  MODE 2 — Bellman-Ford Negative-Log Cycle Detection
//  Transforms edge weights: w' = -log(rate)
//  Negative cycle in transformed graph  ⟹  arbitrage in original
// ═══════════════════════════════════════════════════════════════════

class BellmanFordDetector {
private:
    const Graph& graph;

    // Trace the negative cycle from a node known to be in/reachable from it
    Cycle traceCycle(const std::vector<int>& pred, int start_node) {
        int n = graph.n;
        // Walk back n times to guarantee we land inside the cycle
        int v = start_node;
        for (int i = 0; i < n; i++) v = pred[v];

        // Now v is inside the cycle — trace it
        std::vector<int> cycle_path;
        int cur = v;
        do {
            cycle_path.push_back(cur);
            cur = pred[cur];
        } while (cur != v && (int)cycle_path.size() <= n);
        cycle_path.push_back(v);
        std::reverse(cycle_path.begin(), cycle_path.end());

        // Build Cycle struct with rates and product
        Cycle cycle;
        cycle.path = cycle_path;
        cycle.product = 1.0;
        for (size_t i = 0; i + 1 < cycle_path.size(); i++) {
            double rate = graph.adj[cycle_path[i]][cycle_path[i + 1]];
            cycle.rates.push_back(rate);
            cycle.product *= rate;
        }
        cycle.profit_percent = (cycle.product - 1.0) * 100.0;
        return cycle;
    }

public:
    BellmanFordDetector(const Graph& g) : graph(g) {}

    Cycle detect() {
        int n = graph.n;
        Cycle best;
        bool found = false;

        for (int source = 0; source < n; source++) {
            std::vector<double> dist(n, 1e18);
            std::vector<int> pred(n, -1);
            dist[source] = 0;

            // Relax V-1 times
            for (int i = 0; i < n - 1; i++) {
                for (const auto& e : graph.edges) {
                    double w = -std::log(e.rate);
                    if (dist[e.from] < 1e17 && dist[e.from] + w < dist[e.to] - 1e-9) {
                        dist[e.to] = dist[e.from] + w;
                        pred[e.to] = e.from;
                    }
                }
            }

            // V-th relaxation: if still possible → negative cycle
            for (const auto& e : graph.edges) {
                double w = -std::log(e.rate);
                if (dist[e.from] < 1e17 && dist[e.from] + w < dist[e.to] - 1e-9) {
                    // Make sure pred is set for tracing
                    pred[e.to] = e.from;
                    Cycle c = traceCycle(pred, e.to);

                    if (c.path.size() >= 3 && (!found || c.product > best.product)) {
                        best = c;
                        found = true;
                    }
                    break;
                }
            }
        }
        return best;
    }
};


// ═══════════════════════════════════════════════════════════════════
//  MODE 3 — Find ALL cycles (DFS) + Fractional Knapsack Allocation
// ═══════════════════════════════════════════════════════════════════

class KnapsackAllocator {
private:
    const Graph& graph;
    std::vector<Cycle> all_cycles;

    // DFS to collect every cycle (profitable or not)
    void findAllCycles() {
        all_cycles.clear();

        for (int start = 0; start < graph.n; start++) {
            std::vector<bool> in_stack(graph.n, false);
            in_stack[start] = true;
            std::vector<int> path = {start};
            collectDFS(start, start, path, in_stack, 1.0);
        }

        // De-duplicate: normalise each cycle so smallest index comes first
        std::set<std::vector<int>> seen;
        std::vector<Cycle> unique;
        for (auto& c : all_cycles) {
            std::vector<int> key(c.path.begin(), c.path.end() - 1); // drop trailing repeat
            // Rotate so smallest element is first
            auto minIt = std::min_element(key.begin(), key.end());
            std::rotate(key.begin(), minIt, key.end());
            if (seen.insert(key).second) {
                unique.push_back(c);
            }
        }
        all_cycles = unique;
    }

    void collectDFS(int start, int current, std::vector<int>& path,
                    std::vector<bool>& in_stack, double running_product) {
        for (int next = 0; next < graph.n; next++) {
            if (graph.adj[current][next] <= 0) continue;
            double new_product = running_product * graph.adj[current][next];

            if (next == start && path.size() >= 3) {
                Cycle cycle;
                cycle.path = path;
                cycle.path.push_back(start);
                cycle.product = new_product;
                cycle.profit_percent = (new_product - 1.0) * 100.0;
                for (size_t i = 0; i + 1 < cycle.path.size(); i++) {
                    cycle.rates.push_back(graph.adj[cycle.path[i]][cycle.path[i + 1]]);
                }
                all_cycles.push_back(cycle);
            } else if (!in_stack[next] && path.size() < 6) {
                in_stack[next] = true;
                path.push_back(next);
                collectDFS(start, next, path, in_stack, new_product);
                path.pop_back();
                in_stack[next] = false;
            }
        }
    }

public:
    KnapsackAllocator(const Graph& g) : graph(g) {}

    KnapsackResult allocate(double total_capital) {
        findAllCycles();

        // Filter to only profitable cycles
        std::vector<Cycle> profitable;
        for (auto& c : all_cycles) {
            if (c.isProfitable()) profitable.push_back(c);
        }

        // Sort by viability: profit_percent / cycle_length  (greedy density)
        for (auto& c : profitable) {
            // viability is a density metric for the knapsack
        }

        // Build items for knapsack
        struct Item {
            int idx;
            double profit_pct;
            double capacity;     // max capital this cycle can absorb (liquidity)
            double density;      // profit_pct / risk
        };

        std::vector<Item> items;
        for (int i = 0; i < (int)profitable.size(); i++) {
            double risk = profitable[i].path.size() - 1; // hops = risk proxy
            double density = profitable[i].profit_percent / risk;
            // Liquidity limit: shorter cycles can handle more capital
            double capacity = total_capital * (0.6 / risk);
            items.push_back({i, profitable[i].profit_percent, capacity, density});
        }

        // Greedy fractional knapsack: sort by density descending
        std::sort(items.begin(), items.end(),
                  [](const Item& a, const Item& b) { return a.density > b.density; });

        double remaining = total_capital;
        std::vector<Allocation> allocations;
        double total_profit = 0;

        for (auto& item : items) {
            if (remaining <= 0) break;
            double alloc = std::min(remaining, item.capacity);
            double profit = alloc * (item.profit_pct / 100.0);
            allocations.push_back({
                item.idx,
                alloc,
                profit,
                item.density
            });
            total_profit += profit;
            remaining -= alloc;
        }

        KnapsackResult result;
        result.cycles = profitable;
        result.allocations = allocations;
        result.total_capital = total_capital;
        result.total_expected_profit = total_profit;
        result.total_return_percent = (total_profit / total_capital) * 100.0;
        return result;
    }
};
