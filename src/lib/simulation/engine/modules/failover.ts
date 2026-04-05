import type { SimulationModule } from "@/lib/simulation/types";

export const failoverModule: SimulationModule = {
  name: "failover",
  run(state, context) {
    const nextState = {
      ...state,
      tasks: { ...state.tasks },
      agents: { ...state.agents },
      metrics: { ...state.metrics }
    };

    Object.values(nextState.tasks)
      .filter((task) => task.status === "executing" && task.assignedAgentIds.length > 0)
      .forEach((task) => {
        const executorId = task.assignedAgentIds[0];
        const executor = executorId ? nextState.agents[executorId] : undefined;

        if (!executor || executor.status === "offline" || executor.failureState.isolated) {
          if (executor) {
            nextState.agents[executor.id] = {
              ...executor,
              metrics: {
                ...executor.metrics,
                trust: Math.max(0, executor.metrics.trust - 6)
              }
            };
          }

          const backupId = task.assignedAgentIds[1];
          const backup = backupId ? nextState.agents[backupId] : undefined;

          if (backup && backup.status !== "offline") {
            nextState.tasks[task.id] = {
              ...task,
              assignedAgentIds: [backup.id],
              coordinationPath: [...task.coordinationPath, backup.id]
            };

            nextState.agents[backup.id] = {
              ...backup,
              status: "busy",
              failoverCount: backup.failoverCount + 1,
              assignedTaskIds: backup.assignedTaskIds.includes(task.id)
                ? backup.assignedTaskIds
                : [...backup.assignedTaskIds, task.id]
            };

            nextState.metrics.failoversHandled += 1;

            context.addEvent({
              level: "warning",
              category: "task",
              title: "Failover triggered",
              taskId: task.id,
              agentId: backup.id,
              description: `${task.id} lost primary executor ${executorId ?? "unknown"}; fallback ${backup.id} resumed execution without coordinator intervention.`
            });
          } else {
            nextState.tasks[task.id] = {
              ...task,
              status: "queued",
              assignedAgentIds: [],
              coordinationPath: [...task.coordinationPath, "requeued"]
            };

            context.addEvent({
              level: "warning",
              category: "task",
              taskId: task.id,
              title: "Execution interrupted",
              description: `${task.id} has no reachable fallback and returned to local negotiation.`
            });
          }
        }
      });

    Object.values(nextState.agents).forEach((agent) => {
      if (agent.status === "offline" && agent.failureState.offlineUntilTick !== undefined && context.tick >= agent.failureState.offlineUntilTick) {
        nextState.agents[agent.id] = {
          ...agent,
          status: "degraded",
          failureState: {
            ...agent.failureState,
            offlineUntilTick: undefined
          }
        };

        context.addEvent({
          level: "info",
          category: "agent",
          agentId: agent.id,
          title: "Node recovered",
          description: `${agent.id} rejoined the mesh in degraded mode and is rebuilding trust.`
        });
      }
    });

    return nextState;
  }
};
