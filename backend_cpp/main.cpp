// QuantArb Phase 1 — C++ REST API Server
// Serves three algorithm modes over HTTP for the React frontend.

#ifdef _WIN32
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00  // Windows 10
#endif
#ifndef NTDDI_VERSION
#define NTDDI_VERSION 0x0A000000
#endif
#endif

#include "include/httplib.h"
#include "include/json.hpp"
#include "graph.hpp"
#include "algorithms.hpp"
#include "datasets.hpp"

#include <iostream>
#include <string>
#include <vector>

using json = nlohmann::json;

// ── Helper: build graph from a dataset ──────────────────────────────
Graph buildGraph(const Dataset& ds) {
    Graph g;
    for (auto& e : ds.edges) g.addEdge(e.from, e.to, e.rate);
    return g;
}

// ── Helper: format edges to JSON ────────────────────────────────────
json edgesToJson(const std::vector<Edge>& edges) {
    json arr = json::array();
    for (auto& e : edges) {
        arr.push_back({
            {"from", CURRENCIES[e.from]},
            {"to",   CURRENCIES[e.to]},
            {"rate",  e.rate}
        });
    }
    return arr;
}

// ── Helper: format a cycle to JSON ──────────────────────────────────
json cycleToJson(const Cycle& c, double initial_amount) {
    json obj;
    // Path as currency names
    json path = json::array();
    for (int idx : c.path) path.push_back(CURRENCIES[idx]);
    obj["path"] = path;
    obj["rates"] = c.rates;
    obj["product"] = c.product;
    obj["profit_percent"] = c.profit_percent;
    obj["is_profitable"] = c.isProfitable();

    // Step-by-step breakdown
    json steps = json::array();
    double amount = initial_amount;
    for (size_t i = 0; i + 1 < c.path.size(); i++) {
        double new_amount = amount * c.rates[i];
        steps.push_back({
            {"from",   CURRENCIES[c.path[i]]},
            {"to",     CURRENCIES[c.path[i + 1]]},
            {"rate",   c.rates[i]},
            {"amount_before", amount},
            {"amount_after",  new_amount}
        });
        amount = new_amount;
    }
    obj["steps"] = steps;
    return obj;
}

// ══════════════════════════════════════════════════════════════════════
int main() {
#ifdef _WIN32
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
#endif
    httplib::Server svr;
    auto all_datasets = buildAllDatasets();

    const double MODE12_CAPITAL = 100000.0;   // ₹1,00,000
    const double MODE3_CAPITAL  = 1000000.0;  // ₹10,00,000

    // ── CORS preflight ──────────────────────────────────────────────
    svr.Options("/api/run", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.status = 204;
    });

    // ── Main endpoint ───────────────────────────────────────────────
    svr.Post("/api/run", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        json body;
        try { body = json::parse(req.body); }
        catch (...) {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid JSON\"}", "application/json");
            return;
        }

        std::string mode = body.value("mode", "");
        if (mode != "dfs" && mode != "bellman-ford" && mode != "knapsack") {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid mode. Use dfs, bellman-ford, or knapsack\"}", "application/json");
            return;
        }

        // Pick a random dataset
        const Dataset& ds = getRandomDataset(all_datasets);
        Graph g = buildGraph(ds);

        json response;
        response["dataset_name"] = ds.name;
        response["currencies"] = CURRENCIES;
        response["edges"] = edgesToJson(ds.edges);
        response["mode"] = mode;

        if (mode == "dfs") {
            DFSDetector detector(g);
            Cycle cycle = detector.detect();

            response["algorithm"] = "Modified DFS (Depth-First Search)";
            response["algorithm_description"] = "Traverses the currency graph depth-first, tracking the running product of exchange rates. When a cycle is found with product > 1.0, arbitrage exists.";
            response["initial_amount"] = MODE12_CAPITAL;
            response["arbitrage_found"] = cycle.isProfitable();

            if (detector.cycleFound()) {
                response["cycle"] = cycleToJson(cycle, MODE12_CAPITAL);
                double final_amt = MODE12_CAPITAL * cycle.product;
                response["final_amount"] = final_amt;
                response["profit"] = final_amt - MODE12_CAPITAL;
            } else {
                response["cycle"] = nullptr;
                response["final_amount"] = MODE12_CAPITAL;
                response["profit"] = 0;
            }
        }
        else if (mode == "bellman-ford") {
            BellmanFordDetector detector(g);
            Cycle cycle = detector.detect();

            response["algorithm"] = "Bellman-Ford (Negative Log Weights)";
            response["algorithm_description"] = "Transforms exchange rates using w' = -log(rate). A negative cycle in the transformed graph means the product of original rates > 1.0, indicating arbitrage.";
            response["initial_amount"] = MODE12_CAPITAL;
            response["arbitrage_found"] = cycle.isProfitable();

            if (cycle.path.size() > 0) {
                response["cycle"] = cycleToJson(cycle, MODE12_CAPITAL);
                double final_amt = MODE12_CAPITAL * cycle.product;
                response["final_amount"] = final_amt;
                response["profit"] = final_amt - MODE12_CAPITAL;
            } else {
                response["cycle"] = nullptr;
                response["final_amount"] = MODE12_CAPITAL;
                response["profit"] = 0;
            }
        }
        else if (mode == "knapsack") {
            KnapsackAllocator allocator(g);
            KnapsackResult result = allocator.allocate(MODE3_CAPITAL, 3); // Cap at top 3 cycles for cleaner display

            response["algorithm"] = "Fractional Knapsack (Greedy Capital Allocation)";
            response["algorithm_description"] = "Finds ALL cycles using DFS, then uses the Fractional Knapsack greedy algorithm to optimally allocate limited capital across the most profitable opportunities.";
            response["initial_amount"] = MODE3_CAPITAL;
            response["arbitrage_found"] = !result.cycles.empty();

            // All cycles
            json cycles_arr = json::array();
            for (auto& c : result.cycles) {
                cycles_arr.push_back(cycleToJson(c, MODE3_CAPITAL));
            }
            response["cycles"] = cycles_arr;

            // Allocation details
            json alloc_arr = json::array();
            for (auto& a : result.allocations) {
                alloc_arr.push_back({
                    {"cycle_index",     a.cycle_index},
                    {"capital",         a.capital},
                    {"expected_profit", a.expected_profit},
                    {"viability_score", a.viability_score}
                });
            }
            response["allocation"] = {
                {"total_capital",         result.total_capital},
                {"allocations",           alloc_arr},
                {"total_expected_profit", result.total_expected_profit},
                {"total_return_percent",  result.total_return_percent}
            };
            response["final_amount"] = MODE3_CAPITAL + result.total_expected_profit;
            response["profit"] = result.total_expected_profit;
        }

        res.set_content(response.dump(2), "application/json");
    });

    // ── CORS for simulation endpoints ───────────────────────────────
    svr.Options("/api/simulation/list", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.status = 204;
    });

    svr.Options("/api/simulation/tick", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.status = 204;
    });

    // ── Simulation list endpoint ───────────────────────────────────
    svr.Get("/api/simulation/list", [&](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        auto scenarios = buildSimulationScenarios();
        json arr = json::array();
        for (auto& s : scenarios) {
            arr.push_back({
                {"id", s.id},
                {"name", s.name},
                {"description", s.description}
            });
        }
        res.set_content(arr.dump(2), "application/json");
    });

    // ── Simulation tick execution endpoint ──────────────────────────
    svr.Post("/api/simulation/tick", [&](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        json body;
        try { body = json::parse(req.body); }
        catch (...) {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid JSON\"}", "application/json");
            return;
        }

        int sim_id = body.value("simulation_id", 1);
        int tick_idx = body.value("tick_index", 0);

        auto scenarios = buildSimulationScenarios();
        const SimulationScenario* selected_scen = nullptr;
        for (auto& s : scenarios) {
            if (s.id == sim_id) {
                selected_scen = &s;
                break;
            }
        }

        if (!selected_scen) {
            res.status = 404;
            res.set_content("{\"error\":\"Simulation scenario not found\"}", "application/json");
            return;
        }

        if (tick_idx < 0 || tick_idx >= (int)selected_scen->ticks.size()) {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid tick index\"}", "application/json");
            return;
        }

        auto& tick_data = selected_scen->ticks[tick_idx];

        // Build Graph for this tick
        Graph g;
        for (auto& e : tick_data.edges) {
            g.addEdge(e.from, e.to, e.rate);
        }

        // Run DFS
        DFSDetector dfs_det(g);
        Cycle dfs_cycle = dfs_det.detect();

        // Run Bellman-Ford
        BellmanFordDetector bf_det(g);
        Cycle bf_cycle = bf_det.detect();

        // Run Knapsack Allocator
        int knap_limit = 0;
        if (sim_id == 4) {
            if (tick_idx == 2) knap_limit = 1;
            else if (tick_idx == 5) knap_limit = 2;
            else if (tick_idx == 8) knap_limit = 3;
            else knap_limit = -1; // No trades on non-target ticks
        }
        KnapsackAllocator knap_alloc(g);
        KnapsackResult knap_res = knap_alloc.allocate(100000.0, knap_limit);

        json response;
        response["simulation_id"] = sim_id;
        response["tick_index"] = tick_idx;
        response["currencies"] = CURRENCIES;
        response["edges"] = edgesToJson(tick_data.edges);

        // DFS Result
        response["dfs"] = {
            {"algorithm", "Modified DFS (Depth-First Search)"},
            {"execution_time_us", dfs_det.execution_time_us},
            {"operation_count", dfs_det.operation_count},
            {"arbitrage_found", dfs_cycle.isProfitable()},
            {"cycle", dfs_cycle.path.size() > 0 ? cycleToJson(dfs_cycle, 100000.0) : nullptr}
        };

        // Bellman-Ford Result
        response["bellman_ford"] = {
            {"algorithm", "Bellman-Ford (Negative Log Weights)"},
            {"execution_time_us", bf_det.execution_time_us},
            {"operation_count", bf_det.operation_count},
            {"arbitrage_found", bf_cycle.isProfitable()},
            {"cycle", bf_cycle.path.size() > 0 ? cycleToJson(bf_cycle, 100000.0) : nullptr}
        };

        // Knapsack Result
        json knap_cycles_arr = json::array();
        for (auto& c : knap_res.cycles) {
            knap_cycles_arr.push_back(cycleToJson(c, 100000.0));
        }

        json knap_alloc_arr = json::array();
        for (auto& a : knap_res.allocations) {
            knap_alloc_arr.push_back({
                {"cycle_index",     a.cycle_index},
                {"capital",         a.capital},
                {"expected_profit", a.expected_profit},
                {"viability_score", a.viability_score}
            });
        }

        response["knapsack"] = {
            {"algorithm", "Fractional Knapsack (Capital Allocation)"},
            {"arbitrage_found", !knap_res.cycles.empty() && knap_res.total_expected_profit > 0},
            {"cycles", knap_cycles_arr},
            {"allocations", knap_alloc_arr},
            {"total_expected_profit", knap_res.total_expected_profit},
            {"total_return_percent", knap_res.total_return_percent}
        };

        res.set_content(response.dump(2), "application/json");
    });

    // ── Health check ────────────────────────────────────────────────
    svr.Get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_content("{\"status\":\"ok\"}", "application/json");
    });

    std::cout << "=== QuantArb C++ Backend ===" << std::endl;
    std::cout << "Server running on http://localhost:8081" << std::endl;
    std::cout << "Endpoints:" << std::endl;
    std::cout << "  POST /api/run   {\"mode\": \"dfs|bellman-ford|knapsack\"}" << std::endl;
    std::cout << "  GET  /api/health" << std::endl;

    std::cout << "Starting server on 127.0.0.1:8081..." << std::endl;

    try {
        std::cout << "Calling svr.listen..." << std::endl;
        bool res = svr.listen("127.0.0.1", 8081);
        std::cout << "svr.listen returned " << res << std::endl;
    } catch(const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
    } catch(...) {
        std::cerr << "Unknown exception caught" << std::endl;
    }
    std::cout << "Server stopped." << std::endl;
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
