"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { cardTypeLabels, type StatsSummary } from "@/lib/types";

function StatBox({ label, value, tone }: { label: string; value: number; tone?: "primary" }) {
  return (
    <div className={`border-b border-border py-4 ${tone === "primary" ? "sm:border-b-0 sm:border-r sm:pr-6" : ""}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-4xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max ? Math.max(8, Math.round((value / max) * 100)) : 0;

  return (
    <div className="grid grid-cols-[120px_1fr_36px] items-center gap-3 text-sm">
      <span className="truncate">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
      </div>
      <span className="text-right text-muted-foreground">{value}</span>
    </div>
  );
}

function TrendStrip({ daily }: { daily: StatsSummary["daily"] }) {
  const max = Math.max(...daily.map((item) => item.count), 0);

  return (
    <div className="flex h-28 items-end gap-1.5 border-b border-border pb-2">
      {daily.map((item) => {
        const height = max ? Math.max(10, Math.round((item.count / max) * 100)) : 8;

        return (
          <div key={item.eventDay} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-md bg-foreground transition" style={{ height: `${height}%` }} title={`${item.eventDay}: ${item.count}`} />
            <span className="hidden text-[10px] text-muted-foreground sm:block">{item.eventDay.slice(5)}</span>
          </div>
        );
      })}
      {!daily.length ? <div className="self-center text-sm text-muted-foreground">No trend data yet.</div> : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-semibold">{title}</h2>
        <span className="h-2 w-2 rounded-full bg-primary" />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TypeBlocks({ stats }: { stats: StatsSummary }) {
  const total = Math.max(stats.typeDistribution.reduce((sum, item) => sum + item.count, 0), 1);

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.typeDistribution.map((item) => (
        <div key={item.type} className="rounded-xl bg-background p-3">
          <div className="text-xs text-muted-foreground">{cardTypeLabels[item.type]}</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <span className="text-2xl font-bold">{item.count}</span>
            <span className="text-xs text-muted-foreground">{Math.round((item.count / total) * 100)}%</span>
          </div>
        </div>
      ))}
      {!stats.typeDistribution.length ? <div className="text-sm text-muted-foreground">No type data yet.</div> : null}
    </div>
  );
}

export function StatsClient() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((response) => response.json())
      .then((payload) => setStats(payload.stats))
      .catch(() => setError("加载统计失败，请确认数据库已初始化。"))
      .finally(() => setLoading(false));
  }, []);

  const topMax = Math.max(...(stats?.topCards.map((item) => item.count) || [0]));
  const tagMax = Math.max(...(stats?.tagDistribution.map((item) => item.count) || [0]));

  return (
    <div className="page-shell space-y-5">
      <PageTitle eyebrow="Analytics" title="Stats" description="Open events are tracked with search, type, and tag filter context." />
      {loading ? <div className="text-sm text-muted-foreground">加载中...</div> : null}
      {error ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {stats ? (
        <>
          <div className="rounded-[22px] border border-border bg-surface px-5 py-2 sm:grid sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-6">
            <StatBox label="Total opens" value={stats.totalOpens} tone="primary" />
            <StatBox label="Last 7 days" value={stats.last7Days} />
            <StatBox label="Last 30 days" value={stats.last30Days} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Last 30 Days">
              <TrendStrip daily={stats.daily} />
            </Panel>
            <Panel title="Type Distribution">
              <TypeBlocks stats={stats} />
            </Panel>
            <Panel title="Top Tools">
                {stats.topCards.map((item) => (
                  <BarRow key={item.cardId} label={item.name} value={item.count} max={topMax} />
                ))}
                {!stats.topCards.length ? <div className="text-sm text-muted-foreground">No open records yet.</div> : null}
            </Panel>
            <Panel title="Tag Distribution">
                {stats.tagDistribution.slice(0, 10).map((item) => (
                  <BarRow key={item.name} label={item.name} value={item.count} max={tagMax} />
                ))}
                {!stats.tagDistribution.length ? <div className="text-sm text-muted-foreground">No tag data yet.</div> : null}
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}
