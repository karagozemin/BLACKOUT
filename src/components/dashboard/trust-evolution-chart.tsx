"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { SimulationSnapshot } from "@/store/simulation-store";

export function TrustEvolutionChart({ history }: { history: SimulationSnapshot[] }) {
  const data = history.map((snapshot) => ({
    tick: snapshot.tick,
    trust: snapshot.averageTrust,
    online: snapshot.onlineAgents
  }));

  return (
    <Card>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Trust Evolution</h3>
      <p className="mt-1 text-xs text-muted">Average trust trend under failover and adversarial pressure.</p>

      <div className="mt-3 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <XAxis dataKey="tick" stroke="#8B97B0" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} stroke="#8B97B0" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#121F34", border: "1px solid rgba(135,168,255,0.3)", borderRadius: 10 }}
              labelStyle={{ color: "#E5ECFF" }}
            />
            <Line type="monotone" dataKey="trust" stroke="#4AA6FF" strokeWidth={2.4} dot={false} />
            <Line type="monotone" dataKey="online" stroke="#18C787" strokeWidth={1.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
