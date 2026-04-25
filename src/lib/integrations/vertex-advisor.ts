import { VertexAI } from "@google-cloud/vertexai";
import type { SwarmTickSnapshot } from "@/lib/integrations/swarm-types";

interface VertexAdvice {
  enabled: boolean;
  source: "vertex-ai" | "fallback";
  advice: string;
}

function fallbackAdvice(snapshot: SwarmTickSnapshot) {
  if (snapshot.metrics.droppedMessages > 20) {
    return "Increase relay redundancy and reduce per-task broadcast fanout for the next 10 ticks.";
  }
  if (snapshot.metrics.falseCompletionsRejected > 0) {
    return "Promote verifiers to high-priority lanes and require double witness quorum for high-risk tasks.";
  }
  if (snapshot.activeTasks > 8) {
    return "Rebalance load by assigning reserve nodes to urgent queues and throttling non-critical work.";
  }
  return "Current coordination is stable; keep topology unchanged and continue monitoring task latency.";
}

export async function generateVertexAdvice(snapshot: SwarmTickSnapshot): Promise<VertexAdvice> {
  const project = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION;

  if (!project || !location) {
    return {
      enabled: false,
      source: "fallback",
      advice: fallbackAdvice(snapshot)
    };
  }

  try {
    const modelName = process.env.VERTEX_MODEL ?? "gemini-1.5-flash";
    const vertexAi = new VertexAI({ project, location });
    const model = vertexAi.getGenerativeModel({ model: modelName });

    const prompt = [
      "You are a swarm mission planner.",
      "Return exactly one actionable sentence (max 25 words).",
      `tick=${snapshot.tick}`,
      `activeTasks=${snapshot.activeTasks}`,
      `settledTasks=${snapshot.settledTasks}`,
      `droppedMessages=${snapshot.metrics.droppedMessages}`,
      `falseCompletionsRejected=${snapshot.metrics.falseCompletionsRejected}`,
      `failoversHandled=${snapshot.metrics.failoversHandled}`
    ].join("\n");

    const result = await model.generateContent(prompt);
    const advice =
      result.response.candidates?.[0]?.content.parts
        ?.map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
        .join(" ")
        .trim() ?? "";

    if (!advice) {
      throw new Error("Vertex returned empty advice");
    }

    return {
      enabled: true,
      source: "vertex-ai",
      advice
    };
  } catch {
    return {
      enabled: true,
      source: "fallback",
      advice: fallbackAdvice(snapshot)
    };
  }
}
