"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

export function ChaosControls() {
  const { state, queueChaos, reset } = useSimulationStore();
  const [agentId, setAgentId] = useState<string>("");
  const [zone, setZone] = useState("metro-core");

  const onlineAgents = useMemo(
    () => Object.values(state.agents).filter((agent) => agent.status !== "offline"),
    [state.agents]
  );

  const targetTasks = Object.values(state.tasks).filter((task) => task.status === "executing" || task.status === "assigned");

  return (
    <Card>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Chaos Controls</h3>
      <p className="mt-1 text-xs text-muted">Inject deterministic stress events and observe autonomous recovery behavior.</p>
      <p className="mt-1 text-[11px] text-muted">These are simulation fault injections; external protocol sync is available in the Swarm Integrations panel.</p>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <select
          value={agentId}
          onChange={(event) => setAgentId(event.target.value)}
          className="rounded-md border border-white/20 bg-panel px-2 py-2 text-xs"
        >
          <option value="">Select agent</option>
          {onlineAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.id} ({agent.role})
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="danger"
            onClick={() => agentId && queueChaos({ type: "kill-agent", payload: { agentId } })}
            disabled={!agentId}
          >
            Kill Agent
          </Button>
          <Button
            onClick={() => queueChaos({ type: "degrade-network", payload: { zone, penalty: 70 } })}
            variant="secondary"
          >
            Degrade Network
          </Button>
        </div>

        <select
          value={zone}
          onChange={(event) => setZone(event.target.value)}
          className="rounded-md border border-white/20 bg-panel px-2 py-2 text-xs"
        >
          <option value="metro-core">metro-core</option>
          <option value="north-grid">north-grid</option>
          <option value="east-warehouse">east-warehouse</option>
          <option value="south-corridor">south-corridor</option>
          <option value="west-hills">west-hills</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => queueChaos({ type: "add-urgent-task" })}>Add Urgent Task</Button>
          <Button
            variant="danger"
            onClick={() => {
              const task = targetTasks[0];
              const liar = onlineAgents.find((candidate) => candidate.role === "executor") ?? onlineAgents[0];
              if (task && liar) {
                queueChaos({ type: "spawn-fake-completion", payload: { agentId: liar.id, taskId: task.id } });
              }
            }}
            disabled={targetTasks.length < 1 || onlineAgents.length < 1}
          >
            Spawn Fake Completion
          </Button>
        </div>

        <Button variant="secondary" onClick={reset}>
          Reset Simulation
        </Button>
      </div>
    </Card>
  );
}
