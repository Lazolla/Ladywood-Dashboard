import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  Download,
  Layers3,
  MapPinned,
  Mountain,
  Search,
  ShieldAlert,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RankingPanel from "@/components/RankingPanel";
import SiteDetail from "@/components/SiteDetail";
import InterventionComparison from "@/components/InterventionComparison";
import SensitivityPanel from "@/components/SensitivityPanel";
import AssumptionsPanel from "@/components/AssumptionsPanel";
import EngineeringEvidence from "@/components/EngineeringEvidence";
import type { LayerState } from "@/components/SiteMap";
import { scoreSites } from "@/lib/model";
import { BASE_WEIGHTS, DRIVER_LABEL, SCENARIOS } from "@/lib/scoring";

const SiteMap = lazy(() => import("@/components/SiteMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Geo Dashboard · Ladywood" },
      {
        name: "description",
        content:
          "Geo Dashboard screening workspace for Ladywood: mapped environmental risks, weighted priorities, intervention trade-offs and mining-engineering evidence.",
      },
      { property: "og:title", content: "Geo Dashboard · Ladywood" },
      {
        property: "og:description",
        content:
          "A transparent mining-engineering decision workspace for Ladywood: land, water, ground stability and rehabilitation priorities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const VIEWS = [
  { id: "overview", name: "Site overview", icon: MapPinned },
  { id: "sensitivity", name: "Sensitivity", icon: ChartNoAxesCombined },
  { id: "evidence", name: "Engineering evidence", icon: ClipboardCheck },
] as const;

type View = (typeof VIEWS)[number]["id"];

const LAYER_TOGGLES = [
  ["brownfield", "Brownfield sites"],
  ["flood", "Flood risk"],
  ["geo", "Ground grid"],
] as const;

const LEGEND = [
  { label: "High ≥ 70", className: "bg-risk-high" },
  { label: "Medium 45–<70", className: "bg-risk-medium" },
  { label: "Monitor <45", className: "bg-risk-low" },
  { label: "Flood extent", className: "bg-flood" },
  { label: "Ground grid", className: "bg-ground" },
];

function Dashboard() {
  const [view, setView] = useState<View>("overview");
  const [scenarioId, setScenarioId] = useState("base");
  const [selectedId, setSelectedId] = useState("port-loop");
  const [query, setQuery] = useState("");
  const [layers, setLayers] = useState<LayerState>({
    brownfield: true,
    flood: true,
    geo: false,
  });

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const weights = scenario?.weights ?? BASE_WEIGHTS;
  const sites = useMemo(() => scoreSites(weights), [weights]);
  const selected = sites.find((s) => s.id === selectedId) ?? sites[0];

  if (!selected) {
    return <main className="p-8">No screening sites available.</main>;
  }

  const highCount = sites.filter((s) => s.category === "high").length;
  const filtered = sites.filter((s) =>
    `${s.name} ${s.ref}`.toLowerCase().includes(query.toLowerCase()),
  );
  const rankRuns = SCENARIOS.map(
    (s) => scoreSites(s.weights).find((x) => x.id === selected.id)?.rank ?? selected.rank,
  );
  const rankRange = `${Math.min(...rankRuns)}–${Math.max(...rankRuns)}`;
  const sampleAreaHa = sites.reduce((sum, site) => sum + site.areaHa, 0);

  const metrics = [
    { label: "Sites screened", value: sites.length, note: "Ladywood study area", icon: MapPinned },
    {
      label: "High priority",
      value: highCount.toString().padStart(2, "0"),
      note: "R ≥ 70 / 100",
      icon: ShieldAlert,
    },
    {
      label: "Area in sample",
      value: `${sampleAreaHa.toFixed(1)} ha`,
      note: "Illustrative site areas",
      icon: Sprout,
    },
    {
      label: "Weighting scenario",
      value: scenario?.name ?? "Base",
      note: `L ${Math.round(weights.L * 100)}% · F ${Math.round(weights.F * 100)}% · G ${Math.round(weights.G * 100)}%`,
      icon: ChartNoAxesCombined,
    },
  ];

  const exportResults = () => {
    const rows = [
      [
        "Site",
        "Reference",
        "L",
        "F",
        "G",
        "R",
        "Rank",
        "Driver",
        "Recommendation",
        "Scenario",
        "Evidence status",
      ],
      ...sites.map((s) => [
        s.name,
        s.ref,
        s.scores.L,
        s.scores.F,
        s.scores.G,
        s.R,
        s.rank,
        DRIVER_LABEL[s.mainDriver],
        s.recommended,
        scenario?.name ?? "Base",
        "Illustrative inputs; unverified",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `geo-dashboard-${scenarioId}-screening.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar">
              <Layers3 className="size-5" />
            </div>
            <span className="font-display text-xl font-semibold">
              Geo Dashboard
              <span className="block font-mono text-[10px] font-normal text-sidebar-primary">
                LADYWOOD · REHABILITATION
              </span>
            </span>
          </div>
        </div>
        <p className="px-6 pb-3 pt-7 font-mono text-[10px] text-sidebar-foreground/60">
          WORKSPACE / 01
        </p>
        <nav aria-label="Workspace" className="space-y-1 px-3">
          {VIEWS.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setView(item.id)}
              aria-pressed={view === item.id}
              className={`h-11 w-full justify-start text-xs hover:bg-sidebar-accent hover:text-sidebar-foreground ${
                view === item.id
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/75"
              }`}
            >
              <item.icon />
              {item.name}
              {view === item.id && <ChevronRight className="ml-auto size-3" />}
            </Button>
          ))}
        </nav>
        <div className="mt-8 border-t border-sidebar-border px-6 pt-5">
          <p className="font-mono text-[10px] text-sidebar-foreground/60">PROJECT CONTEXT</p>
          <p className="mt-3 text-xs leading-relaxed text-sidebar-foreground/80">
            Community environmental monitoring & rehabilitation planning
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-sidebar-primary">
            <Mountain className="size-4" />
            Mining Engineering
          </div>
        </div>
        <div className="mt-auto px-6 py-6">
          <p className="font-mono text-[10px] text-sidebar-foreground/60">
            WITS · FEBE1004A · 2026
          </p>
          <p className="mt-2 text-xs text-sidebar-foreground/70">Simane · Sambatha · Dhlamini</p>
          <p className="mt-3 border-t border-sidebar-border pt-3 text-[10px] text-sidebar-primary">
            SCREENING PROTOTYPE / NOT LIVE DATA
          </p>
        </div>
      </aside>

      <div className="workspace-main lg:ml-[224px]">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3 md:px-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground lg:hidden">Geo Dashboard</span>
            <span className="hidden sm:inline">Mining Engineering</span>
            <ChevronRight className="size-3" />
            <span>Ladywood, Birmingham</span>
          </div>
          <Button className="export-control" variant="outline" size="sm" onClick={exportResults}>
            <Download />
            Export results
          </Button>
        </header>

        <main className="mx-auto max-w-[1600px] px-5 py-7 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="label-caps text-primary">ENVIRONMENTAL MONITORING & REHABILITATION</p>
              <h1 className="mt-2 text-3xl font-semibold">Ladywood priority dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Evidence-led screening. Mining-derived solutions. Community resilience.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs">
              <span className="size-2 rounded-full bg-accent-foreground" />
              Illustrative screening data
            </div>
          </div>

          <nav
            aria-label="Dashboard views"
            className="workspace-nav mt-6 flex gap-1 overflow-x-auto border-b border-border pb-3"
          >
            {VIEWS.map((item) => (
              <Button
                key={item.id}
                variant={view === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView(item.id)}
                aria-pressed={view === item.id}
              >
                <item.icon />
                {item.name}
              </Button>
            ))}
          </nav>

          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <metric.icon className="size-4 text-primary" />
                </div>
                <p className="mt-3 break-words font-display text-2xl font-semibold">
                  {metric.value}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">{metric.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
            <p className="font-mono text-xs">
              R = {weights.L.toFixed(2)}L + {weights.F.toFixed(2)}F + {weights.G.toFixed(2)}G
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="scenario" className="text-xs text-muted-foreground">
                Weighting
              </label>
              <select
                id="scenario"
                value={scenarioId}
                onChange={(e) => setScenarioId(e.target.value)}
                className="max-w-[170px] rounded-md border border-input bg-surface px-2 py-1.5 text-xs focus:ring-2 focus:ring-ring"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {view === "overview" && (
            <div className="mt-6 space-y-7">
              <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
                <div className="panel overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                      <h2 className="text-sm font-semibold">Environmental risk map</h2>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Ladywood · indicative extents
                      </p>
                    </div>
                    <Layers3 className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-wrap gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
                    {LAYER_TOGGLES.map(([key, label]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={layers[key]}
                          onChange={() => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className="size-3.5 accent-primary"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="h-[340px] sm:h-[390px]">
                    <ClientOnly fallback={<MapLoading />}>
                      <Suspense fallback={<MapLoading />}>
                        <SiteMap
                          sites={sites}
                          selectedId={selected.id}
                          onSelect={setSelectedId}
                          layers={layers}
                        />
                      </Suspense>
                    </ClientOnly>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border p-3">
                    {LEGEND.map((item) => (
                      <span
                        key={item.label}
                        className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                      >
                        <span className={`size-2 rounded-full ${item.className}`} />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <input
                      aria-label="Search sites"
                      placeholder="Search sites or reference…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  {filtered.length ? (
                    <RankingPanel
                      sites={filtered}
                      selectedId={selected.id}
                      onSelect={setSelectedId}
                    />
                  ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      No matching sites.
                    </p>
                  )}
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-4 border-l-2 border-primary bg-primary/5 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-primary">SELECTED / {selected.ref}</p>
                  <p className="mt-1 text-sm">
                    {selected.name}{" "}
                    <span className="text-muted-foreground">
                      · main driver: {DRIVER_LABEL[selected.mainDriver]}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Rank range {rankRange} across 4 scenarios
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View sensitivity analysis"
                    aria-label="View sensitivity analysis"
                    onClick={() => setView("sensitivity")}
                  >
                    <ArrowUpRight />
                  </Button>
                </div>
              </div>

              <SiteDetail site={selected} weights={weights} />
              <InterventionComparison site={selected} />
              <AssumptionsPanel />
            </div>
          )}

          {view === "sensitivity" && (
            <div className="mt-6">
              <SensitivityPanel
                activeScenario={scenarioId}
                onScenario={setScenarioId}
                selectedId={selected.id}
                onSelect={setSelectedId}
              />
              <div className="mt-8">
                <SiteDetail site={selected} weights={weights} />
              </div>
            </div>
          )}

          {view === "evidence" && (
            <div className="mt-6 space-y-8">
              <EngineeringEvidence />
              <AssumptionsPanel />
            </div>
          )}

          <footer className="mt-10 flex flex-wrap justify-between gap-3 border-t border-border py-5 text-[10px] text-muted-foreground">
            <span>WITS · FEBE1004A Engineering Analysis & Design 1B · Mining Engineering</span>
            <span>Screening only. Not a substitute for site investigation.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function MapLoading() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <MapPinned className="size-5" />
      Loading Ladywood map…
    </div>
  );
}
