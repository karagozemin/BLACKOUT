export interface SwarmTickSnapshot {
  tick: number;
  activeTasks: number;
  settledTasks: number;
  running: boolean;
  metrics: {
    droppedMessages: number;
    falseCompletionsRejected: number;
    failoversHandled: number;
  };
  events: Array<{
    id: string;
    level: string;
    category: string;
    title: string;
    description: string;
  }>;
  messages: Array<{
    id: string;
    from: string;
    to: string;
    kind: string;
    taskId?: string;
  }>;
}

export interface SwarmSyncReport {
  mqttPublished: boolean;
  foxmqPublished: boolean;
  vertexEnabled: boolean;
  vertexAdviceSource: "vertex-ai" | "fallback";
  vertexAdvice: string;
  warnings: string[];
}
