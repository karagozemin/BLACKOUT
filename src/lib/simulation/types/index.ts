export type AgentRole =
  | "scout"
  | "router"
  | "dispatch"
  | "executor"
  | "battery-manager"
  | "safety"
  | "verifier-a"
  | "verifier-b"
  | "reputation"
  | "settlement"
  | "reserve"
  | "relay";

export type AgentStatus = "online" | "busy" | "degraded" | "offline" | "isolated";

export type TaskType =
  | "inspect-blackout-zone"
  | "route-medical-package"
  | "restore-sensor-relay"
  | "escort-fragile-payload"
  | "verify-outage-segment"
  | "secure-unsafe-area";

export type TaskStatus = "queued" | "negotiating" | "assigned" | "executing" | "verifying" | "settled" | "failed";

export type VerificationStatus = "pending" | "approved" | "rejected";
export type SettlementStatus = "blocked" | "ready" | "settled";

export interface AgentMetrics {
  health: number;
  trust: number;
  battery: number;
  latency: number;
  capacity: number;
  currentLoad: number;
}

export interface Agent {
  id: string;
  role: AgentRole;
  status: AgentStatus;
  region: string;
  metrics: AgentMetrics;
  capabilities: TaskType[];
  peers: string[];
  assignedTaskIds: string[];
  failureState: {
    offlineUntilTick?: number;
    liarMode: boolean;
    isolated: boolean;
  };
  messageHistory: string[];
  failoverCount: number;
}

export interface Task {
  id: string;
  type: TaskType;
  urgency: 1 | 2 | 3 | 4 | 5;
  zone: string;
  requiredCapabilities: TaskType[];
  estimatedEffort: number;
  createdAtTick: number;
  status: TaskStatus;
  assignedAgentIds: string[];
  startedAtTick?: number;
  completedClaimAtTick?: number;
  verificationStatus: VerificationStatus;
  settlementStatus: SettlementStatus;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  negotiationRound: number;
  coordinationPath: string[];
  rejectionReason?: string;
}

export type MessageKind =
  | "peer-discovery"
  | "state-broadcast"
  | "proposal"
  | "counter-proposal"
  | "acceptance"
  | "completion-claim"
  | "witness-evidence"
  | "verification-decision"
  | "settlement-receipt"
  | "fault";

export interface Message {
  id: string;
  from: string;
  to: string | "broadcast";
  kind: MessageKind;
  taskId?: string;
  payload: Record<string, unknown>;
  tick: number;
}

export interface NegotiationProposal {
  taskId: string;
  proposerAgentId: string;
  score: number;
  eta: number;
  confidence: number;
  loadFactor: number;
  trustFactor: number;
  batteryFactor: number;
}

export interface ProofEvidence {
  witnessAgentId: string;
  kind: "telemetry" | "relay-log" | "zone-confirmation" | "handoff-proof";
  confidence: number;
  contentHash: string;
  observedAtTick: number;
}

export interface CoordinationProof {
  taskId: string;
  claimantAgentId: string;
  witnessEvidence: ProofEvidence[];
  witnessThreshold: number;
  coordinationConfidence: number;
  evidenceHash: string;
  witnessCoverage: number;
  anomalyFlags: string[];
  status: "collecting" | "sufficient" | "insufficient";
}

export interface VerificationDecision {
  taskId: string;
  verifierAgentId: string;
  verdict: "approve" | "reject";
  reason: string;
  confidence: number;
  tick: number;
}

export interface SettlementReceipt {
  id: string;
  taskId: string;
  participants: string[];
  evidenceHash: string;
  verifierSignatures: { verifierAgentId: string; verdict: "approve" | "reject"; tick: number }[];
  rewardAllocation: Record<string, number>;
  proofStatus: "verified" | "rejected";
  createdAtTick: number;
}

export interface NetworkCondition {
  baselineLatency: number;
  droppedMessageRate: number;
  degradedRegions: Record<string, number>;
}

export interface MissionMetrics {
  tasksCompleted: number;
  failoversHandled: number;
  falseCompletionsRejected: number;
  averageCoordinationLatency: number;
  settlementSuccessCount: number;
  maliciousAgentsIsolated: number;
  droppedMessages: number;
}

export interface SimulationEvent {
  id: string;
  tick: number;
  level: "info" | "warning" | "danger" | "success";
  category:
    | "network"
    | "negotiation"
    | "task"
    | "chaos"
    | "verification"
    | "settlement"
    | "agent";
  title: string;
  description: string;
  taskId?: string;
  agentId?: string;
}

export interface SimulationState {
  seed: number;
  tick: number;
  deterministicMode: boolean;
  running: boolean;
  agents: Record<string, Agent>;
  tasks: Record<string, Task>;
  proofs: Record<string, CoordinationProof>;
  verificationDecisions: VerificationDecision[];
  settlementReceipts: SettlementReceipt[];
  messages: Message[];
  events: SimulationEvent[];
  network: NetworkCondition;
  metrics: MissionMetrics;
}

export interface ChaosAction {
  type: "kill-agent" | "degrade-network" | "spawn-fake-completion" | "add-urgent-task" | "reset";
  payload?: Record<string, unknown>;
}

export interface SimulationModuleContext {
  rng: () => number;
  tick: number;
  addEvent: (event: Omit<SimulationEvent, "id" | "tick">) => void;
  addMessage: (message: Omit<Message, "id" | "tick">) => void;
}

export interface SimulationModule {
  name: string;
  run: (state: SimulationState, context: SimulationModuleContext) => SimulationState;
}
