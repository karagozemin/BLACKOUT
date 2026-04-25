import { createFoxMqTransportFromEnv, createMqttTransportFromEnv } from "@/lib/integrations/mqtt-transport";
import type { SwarmSyncReport, SwarmTickSnapshot } from "@/lib/integrations/swarm-types";
import { generateVertexAdvice } from "@/lib/integrations/vertex-advisor";

const MQTT_TOPIC_TICK = "blackout/swarm/tick";
const MQTT_TOPIC_EVENTS = "blackout/swarm/events";
const FOXMQ_TOPIC_COORDINATION = "foxmq/blackout/coordination";

export async function syncSnapshotToSwarm(snapshot: SwarmTickSnapshot): Promise<SwarmSyncReport> {
  const mqttTransport = createMqttTransportFromEnv();
  const foxmqTransport = createFoxMqTransportFromEnv();

  const warnings: string[] = [];
  let mqttPublished = false;
  let foxmqPublished = false;

  try {
    mqttPublished = await mqttTransport.publishJson(MQTT_TOPIC_TICK, snapshot);
    if (snapshot.events.length > 0) {
      await mqttTransport.publishJson(MQTT_TOPIC_EVENTS, {
        tick: snapshot.tick,
        events: snapshot.events
      });
    }
  } catch (error) {
    warnings.push(`MQTT publish failed: ${error instanceof Error ? error.message : "unknown error"}`);
  } finally {
    await mqttTransport.close();
  }

  try {
    foxmqPublished = await foxmqTransport.publishJson(FOXMQ_TOPIC_COORDINATION, {
      tick: snapshot.tick,
      activeTasks: snapshot.activeTasks,
      settledTasks: snapshot.settledTasks,
      droppedMessages: snapshot.metrics.droppedMessages,
      digest: snapshot.messages.slice(-8)
    });
  } catch (error) {
    warnings.push(`FoxMQ publish failed: ${error instanceof Error ? error.message : "unknown error"}`);
  } finally {
    await foxmqTransport.close();
  }

  if (!mqttTransport.enabled) {
    warnings.push("MQTT_BROKER_URL not set; MQTT publish skipped.");
  }

  if (!foxmqTransport.enabled) {
    warnings.push("FOXMQ_BROKER_URL not set; FoxMQ publish skipped.");
  }

  const vertexAdvice = await generateVertexAdvice(snapshot);

  return {
    mqttPublished,
    foxmqPublished,
    vertexEnabled: vertexAdvice.enabled,
    vertexAdviceSource: vertexAdvice.source,
    vertexAdvice: vertexAdvice.advice,
    warnings
  };
}
