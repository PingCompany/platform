import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "decay-presence",
  { minutes: 2 },
  internal.presence.decayPresence,
);

export default crons;
