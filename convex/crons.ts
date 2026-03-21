import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "generate-channel-summaries",
  { minutes: 15 },
  internal.summaries.generateChannelSummaries,
);

crons.interval(
  "scan-fact-checks",
  { minutes: 10 },
  internal.proactiveAlerts.scanForFactChecks,
);

crons.interval(
  "scan-cross-team-sync",
  { minutes: 15 },
  internal.proactiveAlerts.scanCrossTeamSync,
);

crons.interval(
  "generate-decisions-from-alerts",
  { minutes: 5 },
  internal.decisionGenerator.generateFromAlerts,
);

crons.interval(
  "generate-decisions-from-summaries",
  { minutes: 5 },
  internal.decisionGenerator.generateFromSummaries,
);

export default crons;
