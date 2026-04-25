import { NextResponse } from "next/server";
import { syncSnapshotToSwarm } from "@/lib/integrations/swarm-sync";
import type { SwarmTickSnapshot } from "@/lib/integrations/swarm-types";

export const runtime = "nodejs";

function sanitizePayload(payload: unknown): SwarmTickSnapshot | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Partial<SwarmTickSnapshot>;
  if (typeof raw.tick !== "number") {
    return null;
  }

  return {
    tick: raw.tick,
    activeTasks: typeof raw.activeTasks === "number" ? raw.activeTasks : 0,
    settledTasks: typeof raw.settledTasks === "number" ? raw.settledTasks : 0,
    running: Boolean(raw.running),
    metrics: {
      droppedMessages: raw.metrics?.droppedMessages ?? 0,
      falseCompletionsRejected: raw.metrics?.falseCompletionsRejected ?? 0,
      failoversHandled: raw.metrics?.failoversHandled ?? 0
    },
    events: Array.isArray(raw.events)
      ? raw.events.slice(-12).map((event) => ({
          id: String(event.id ?? "evt"),
          level: String(event.level ?? "info"),
          category: String(event.category ?? "network"),
          title: String(event.title ?? "event"),
          description: String(event.description ?? "")
        }))
      : [],
    messages: Array.isArray(raw.messages)
      ? raw.messages.slice(-16).map((message) => ({
          id: String(message.id ?? "msg"),
          from: String(message.from ?? "unknown"),
          to: String(message.to ?? "broadcast"),
          kind: String(message.kind ?? "state-broadcast"),
          taskId: message.taskId ? String(message.taskId) : undefined
        }))
      : []
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const snapshot = sanitizePayload(body);

    if (!snapshot) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await syncSnapshotToSwarm(snapshot);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected sync error"
      },
      { status: 500 }
    );
  }
}
