# Elevator Pitch Deck Structure
*(Target: Developer Advocates / Open Source Champions. Length: 10 Slides. Goal: Drive Adoption & Prove Concept)*

---

### Slide 1: Title & The Hook
*   **Visual:** Clean, premium logo. Next.js/Tailwind aesthetic.
*   **Headline:** PING: The AI-Native OS for Team Communication.
*   **One-Liner:** "Stop drowning in chat noise. Regain your focus with PING, an AI-native workspace that fixes the broken way teams communicate."

### Slide 2: The Problem (The Enterprise Context Cost)
*   **Visual:** A chaotic, cluttered Slack interface with red badges, mixed with tabs of Jira and GitHub.
*   **Header:** Knowledge workers are drowning in noise and context-switching.
*   **Talking Points:** 
    *   **The Context-Switching Tax:** Teams jump between Jira, GitHub, and chat just to understand basic status.
    *   **Information Overload:** Chat apps are "dumb pipes" that treat all messages equally, forcing humans to act as routers.
    *   **Ephemeral Knowledge:** Crucial setup decisions are buried in unsearchable, giant threads.

### Slide 3: The Solution (Proactive & Ranked)
*   **Visual:** A sleek, "Linear-style" Eisenhower Inbox showing actionable, ranked messages and a heartbeat notification.
*   **Header:** Invert the model: AI ranks the noise, actively pushes work forward.
*   **Talking Points:** 
    *   **The Eisenhower Inbox:** Stop scrolling unreads. Every message across DMs, Groups, and Channels is automatically ranked by urgency and importance.
    *   **Proactive Workspace Agent:** PING doesn't wait for questions. It triggers on a heartbeat to nudge reviewers or resolve blockers autonomously.
    *   **Knowledge Syncing:** Our Knowledge Agent proactively fact-checks and syncs context between teams, eliminating siloed decisions.

### Slide 4: Why Now?
*   **Visual:** Graph showing dropping LLM/Token costs vs increasing context windows over the last 12 months.
*   **Header:** Real-time AI processing is finally cheap and fast enough.
*   **Talking Points:** Doing proactive Graph-RAG on *every single chat message* was economically impossible two years ago. Today (via Convex + Graphiti), we can build a proactive semantic brain for pennies.

### Slide 5: The "Aha!" Moment (The Demo / MVP)
*   **Visual:** A quick GIF or 3-part screenshot flow of the Eisenhower Reveal and Proactive Heartbeat.
*   **Header:** Unlocking the proactive digital brain.
*   **Talking Points:** Show a slack-like channel flooded with 100 messages. Then, show the Eisenhower Reveal where everything is perfectly ranked. Finally, show the Workspace Agent proactively pinging a DM: *"This PR has been idle for 4 hours and is marked as 'Important'. Nudge the reviewer?"*

### Slide 6: The Moat (Defensibility)
*   **Visual:** A simple node-connector diagram showing the Graphiti knowledge graph mapping a User -> Message -> Jira Ticket.
*   **Header:** The Graph-RAG Lock-in.
*   **Talking Points:** "We don't just store chat vectors; we build a relational graph of the company. The longer a team uses us, the smarter their workspace becomes. Churning back to Slack means inducing an organizational lobotomy."

### Slide 7: Business Model & Go-To-Market
*   **Visual:** A 3-tier pricing table (Open Source -> Managed Cloud -> Enterprise via WorkOS).
*   **Header:** The PostHog/Linear Playbook.
*   **Talking Points:** 
    *   **Acquisition:** Free, self-hosted Open-Core drives massive, bottom-up developer love. 
    *   **Monetization:** Hosted SaaS charging for compute scale and vector storage.
    *   **Expansion:** WorkOS drop-in means we have SSO/SAML ready for immediate mid-market expansion.

### Slide 8: Target Persona
*   **Visual:** Profile card of "The Overwhelmed DevOps Lead."
*   **Header:** Starting where the pain is highest.
*   **Talking Points:** We are selling first to CTOs, VP Eng, and lead developers who are exhausted by resolving architecture conflicts lost deep in Slack threads, and the sheer overhead of manually keeping siloed teams updated across the entire org.

### Slide 9: The Team
*   **Visual:** Headshots of the 5-person founding/dev team.
*   **Header:** We built the core engine in 48 hours.
*   **Talking Points:** Emphasize execution speed. "We used Convex, WorkOS, and Graphiti to build the AI reasoning and chat engine in just 48 hours (the rest was setup and testing). Imagine what an open-source movement can build in 12 months."

### Slide 10: The Ask / Call to Action
*   **Visual:** A massive GitHub repo link and a terminal command: `docker-compose up ai-chat`.
*   **Header:** Join us in killing the green dot.
*   **Talking Points:** Stop renting siloed chat. Reclaim your company's knowledge. Star the repo, spin it up locally in 5 minutes, and help us build the open-source future of true async collaboration.
