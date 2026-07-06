#pragma once
#include "graph.hpp"
#include <algorithm>
#include <cmath>
#include <limits>
#include <functional>
#include <set>
#include <chrono>

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
    int op_count;

    void dfs(int start, int current, std::vector<int>& path,
             std::vector<bool>& in_stack, double running_product) {
        op_count++;

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
    double execution_time_us = 0.0;
    int operation_count = 0;

    DFSDetector(const Graph& g) : graph(g), found(false), op_count(0) {}

    Cycle detect() {
        auto start_time = std::chrono::high_resolution_clock::now();
        found = false;
        best_cycle = Cycle();
        op_count = 0;

        for (int start = 0; start < graph.n; start++) {
            std::vector<bool> in_stack(graph.n, false);
            in_stack[start] = true;
            std::vector<int> path = {start};
            dfs(start, start, path, in_stack, 1.0);
        }

        auto end_time = std::chrono::high_resolution_clock::now();
        execution_time_us = std::chrono::duration<double, std::micro>(end_time - start_time).count();
        operation_count = op_count;

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

public:
    double execution_time_us = 0.0;
    int operation_count = 0;

    BellmanFordDetector(const Graph& g) : graph(g) {}

    Cycle detect() {
        auto start_time = std::chrono::high_resolution_clock::now();
        int op_count = 0;
        int n = graph.n;
        Cycle cycle;

        std::vector<double> dist(n, 0.0);
        std::vector<int> pred(n, -1);

        // Relax V-1 times
        for (int i = 0; i < n - 1; i++) {
            for (const auto& e : graph.edges) {
                op_count++;
                double w = -std::log(e.rate) + 0.0005; // Incorporate 0.05% transaction fee per hop
                if (dist[e.from] + w < dist[e.to] - 1e-9) {
                    dist[e.to] = dist[e.from] + w;
                    pred[e.to] = e.from;
                }
            }
        }

        // V-th relaxation: check for negative cycle
        int cycle_node = -1;
        for (const auto& e : graph.edges) {
            op_count++;
            double w = -std::log(e.rate) + 0.0005; // Incorporate 0.05% transaction fee per hop
            if (dist[e.from] + w < dist[e.to] - 1e-9) {
                pred[e.to] = e.from;
                cycle_node = e.to;
                break;
            }
        }

        if (cycle_node != -1) {
            // Walk back n times to guarantee we land inside the cycle
            int v = cycle_node;
            for (int i = 0; i < n; i++) {
                if (v < 0 || v >= n) {
                    v = -1;
                    break;
                }
                v = pred[v];
            }

            if (v != -1) {
                std::vector<int> cycle_path;
                int cur = v;
                do {
                    cycle_path.push_back(cur);
                    if (cur < 0 || cur >= n) {
                        cycle_path.clear();
                        break;
                    }
                    cur = pred[cur];
                } while (cur != v && (int)cycle_path.size() <= n);

                if (!cycle_path.empty() && cur == v && cycle_path.size() >= 3) {
                    cycle_path.push_back(v);
                    std::reverse(cycle_path.begin(), cycle_path.end());

                    // Rotate the cycle so it starts and ends with INR (0) if INR is part of the cycle
                    auto it = std::find(cycle_path.begin(), cycle_path.end() - 1, 0);
                    if (it != cycle_path.end() - 1) {
                        std::vector<int> rotated_path;
                        rotated_path.insert(rotated_path.end(), it, cycle_path.end() - 1);
                        rotated_path.insert(rotated_path.end(), cycle_path.begin(), it);
                        rotated_path.push_back(0);
                        cycle_path = rotated_path;
                    }

                    cycle.path = cycle_path;
                    cycle.product = 1.0;
                    for (size_t i = 0; i + 1 < cycle_path.size(); i++) {
                        double rate = graph.adj[cycle_path[i]][cycle_path[i + 1]];
                        cycle.rates.push_back(rate);
                        cycle.product *= rate;
                    }
                    cycle.profit_percent = (cycle.product - 1.0) * 100.0;
                }
            }
        }

        auto end_time = std::chrono::high_resolution_clock::now();
        execution_time_us = std::chrono::duration<double, std::micro>(end_time - start_time).count();
        operation_count = op_count;

        return cycle;
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

    KnapsackResult allocate(double total_capital, int limit = 0) {
        findAllCycles();

        // Filter to only profitable cycles
        std::vector<Cycle> profitable;
        if (limit != -1) {
            for (auto& c : all_cycles) {
                if (c.isProfitable()) profitable.push_back(c);
            }
        }

        // Sort by gross profit percent descending
        std::sort(profitable.begin(), profitable.end(),
                  [](const Cycle& a, const Cycle& b) { return a.profit_percent > b.profit_percent; });

        // Apply limit if specified
        if (limit > 0 && (int)profitable.size() > limit) {
            profitable.resize(limit);
        }

        // Calculate densities for each profitable cycle
        std::vector<double> densities;
        double sum_densities = 0.0;
        for (auto& c : profitable) {
            double risk = c.path.size() - 1; // hops
            double density = c.profit_percent / risk;
            densities.push_back(density);
            sum_densities += density;
        }

        // Allocate capital proportionally based on density
        std::vector<Allocation> allocations;
        double total_profit = 0;
        for (size_t i = 0; i < profitable.size(); i++) {
            double fraction = (sum_densities > 0.0) ? (densities[i] / sum_densities) : 0.0;
            double alloc = total_capital * fraction;
            double profit = alloc * (profitable[i].profit_percent / 100.0);
            allocations.push_back({
                (int)i,
                alloc,
                profit,
                densities[i]
            });
            total_profit += profit;
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
