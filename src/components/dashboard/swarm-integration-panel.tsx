"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

interface SyncResult {
  mqttPublished: boolean;
  foxmqPublished: boolean;
  vertexEnabled: boolean;
  vertexAdviceSource: "vertex-ai" | "fallback";
  vertexAdvice: string;
  warnings: string[];
}

export function SwarmIntegrationPanel() {
  const state = useSimulationStore((store) => store.state);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);

  const payload = useMemo(() => {
    const tasks = Object.values(state.tasks);

    return {
      tick: state.tick,
      activeTasks: tasks.filter((task) => task.status !== "settled" && task.status !== "failed").length,
      settledTasks: tasks.filter((task) => task.status === "settled").length,
      running: state.running,
      metrics: {
        droppedMessages: state.metrics.droppedMessages,
        falseCompletionsRejected: state.metrics.falseCompletionsRejected,
        failoversHandled: state.metrics.failoversHandled
      },
      events: state.events.slice(-8).map((event) => ({
        id: event.id,
        level: event.level,
        category: event.category,
        title: event.title,
        description: event.description
      })),
      messages: state.messages.slice(-10).map((message) => ({
        id: message.id,
        from: message.from,
        to: String(message.to),
        kind: message.kind,
        taskId: message.taskId
      }))
    };
  }, [state]);

  async function handleSync() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/swarm/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Sync failed");
      }

      const data = (await response.json()) as SyncResult;
      setResult(data);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Unknown sync error");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Swarm Integrations</h3>
      <p className="mt-1 text-xs text-muted">Publishes current tick to MQTT and FoxMQ-compatible broker, then requests a Vertex AI coordination hint.</p>

      <div className="mt-3 space-y-2 text-xs text-muted">
        <p>Tick: {state.tick}</p>
        <p>Messages buffered: {state.messages.length}</p>
        <p>Events buffered: {state.events.length}</p>
      </div>

      <div className="mt-3">
        <Button onClick={handleSync} disabled={pending}>
          {pending ? "Syncing..." : "Sync Tick To Swarm"}
        </Button>
      </div>

      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}

      {result ? (
        <div className="mt-3 space-y-2 text-xs">
          <p className="text-muted">MQTT: {result.mqttPublished ? "published" : "skipped"}</p>
          <p className="text-muted">FoxMQ: {result.foxmqPublished ? "published" : "skipped"}</p>
          <p className="text-muted">
            Vertex AI: {result.vertexEnabled ? "enabled" : "not configured"} ({result.vertexAdviceSource})
          </p>
          <p className="rounded-md border border-info/30 bg-info/10 px-2 py-1 text-foreground">Advice: {result.vertexAdvice}</p>
          {result.warnings.length > 0 ? (
            <div className="rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-warning">
              {result.warnings.join(" ")}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
