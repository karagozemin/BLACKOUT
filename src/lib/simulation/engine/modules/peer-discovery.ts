import type { SimulationModule } from "@/lib/simulation/types";

export const peerDiscoveryModule: SimulationModule = {
  name: "peer-discovery",
  run(state, context) {
    const nextState = { ...state, agents: { ...state.agents } };

    Object.values(nextState.agents).forEach((agent) => {
      if (agent.status === "offline" || agent.failureState.isolated) {
        return;
      }

      const sampledPeers = agent.peers.slice(0, 3);
      sampledPeers.forEach((peerId) => {
        context.addMessage({
          from: agent.id,
          to: peerId,
          kind: "peer-discovery",
          payload: {
            trust: agent.metrics.trust,
            battery: agent.metrics.battery,
            latency: agent.metrics.latency
          }
        });
      });

      if (context.rng() > 0.92) {
        const candidates = Object.values(nextState.agents)
          .filter((candidate) => candidate.id !== agent.id && candidate.status !== "offline")
          .map((candidate) => candidate.id);

        const index = Math.floor(context.rng() * candidates.length);
        const candidatePeer = candidates[index];
        if (candidatePeer && !agent.peers.includes(candidatePeer)) {
          nextState.agents[agent.id] = { ...agent, peers: [...agent.peers, candidatePeer] };
          context.addEvent({
            level: "info",
            category: "network",
            title: "Mesh link expanded",
            agentId: agent.id,
            description: `${agent.id} discovered ${candidatePeer} and widened local routing visibility.`
          });
        }
      }
    });

    return nextState;
  }
};
