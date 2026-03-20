# PING: Company Brain Infrastructure & Pitch

## 1. The Problem Space: Why People Hate Slack & Teams
Current chat platforms were designed for a purely human-to-human, synchronous era. They are "dumb pipes" that simply deliver messages, leaving the cognitive load of parsing, prioritizing, and acting on that information entirely to humans. 

**The pain points:**
*   **UI/UX Clutter & Mobile Nightmares:** Teams and Slack feel bloated, slow, and overly complex. 
*   **The Context-Switching Tax:** Chat apps are completely siloed from where work actually happens. Jumping between Jira, GitHub, Linear, and Slack drains productivity.
*   **Information Overload & "Unread Anxiety":** Users return from deep work to a "wall of text" and red badges. Finding what matters is a manual, anxiety-inducing process.
*   **Context Fragmentation & Ephemeral Knowledge:** Important decisions get buried in endless threads. 
*   **Bolt-on AI is Clunky:** Existing tools treat AI as an app integration rather than a native intelligence layer that understands the entire workspace.

## 2. The Problem (Defined for Investors)
**"Knowledge workers spend 20% of their day searching for internal information or catching up on communications. Legacy chat apps exacerbate this by treating all messages with equal priority and acting as transient data silos."**

We are solving the **Enterprise Context Cost**. Companies are paying highly skilled workers (developers, PMs) to act as human routers—reading, summarizing, and repeating information. 

## 3. Alternative Cost (What happens without us?)
If companies stick to the status quo, they incur massive hidden costs:
1.  **Time Waste:** 1-2 hours per employee per day spent reading irrelevant updates or searching for lost links/decisions. 
2.  **The Context Switching Tax:** The constant friction and lost focus of jumping between Jira, GitHub, Slack, and Notion just to merge a single PR or close a ticket.
3.  **Tool Sprawl Cost:** Paying for Slack ($15/user) + Notion AI ($10/user) + Glean/Enterprise Search ($40/user) + Zapier ($$$) to try and force intelligence into dumb chat.
4.  **Lost Velocity:** Wait times. An engineer in Europe blocked on a deployment issue waits 8 hours for the US DevOps lead to wake up and answer a question that was already solved in a different channel last year.

## 4. Target Personas
To maximize PMF and leverage our Free and Open-Source foundation, we need bottom-up adoption from technical users who feel the pain of context-switching the most.

**Primary Persona: "The Overwhelmed DevOps/Eng Lead" (Bottom-up Champion)**
*   **Profile:** CTO, VP of Eng, or Lead Developer at a 50-200 person product team.
*   **Pain:** Spends half their day answering "How do I..." questions in Slack, breaking their flow state. Worries about spiraling cloud AI infrastructure costs and data privacy.
*   **Why they buy:** They can self-host the open-core version for absolute AI infra cost control and ultimate customization—allowing them to train their own custom models on company data. It instantly resolves blockers automatically by pinging PR reviewers and routing incident alerts.

**Secondary Persona: "The glued-together Ops Manager" (Expansion User)**
*   **Profile:** Head of Ops, Product Manager, or Support Lead.
*   **Pain:** Constantly moving data between Zendesk, Jira, and Slack.
*   **Why they buy:** Visual "AI employee" deployment means they can build auto-routing workflows without writing code, enabling workflow acceleration immediately.

## 5. The Pitch (The Narrative)
**The Hook:** We are not selling a "chat replacement". PING is the **AI operating layer for engineering teams**. Chat is just an implementation detail, permanently reducing the friction and fear of switching. 

**The Vision / Category Framing:** Instead of "AI-first chat", we are **Company Brain Infrastructure**. We sit closer to search, knowledge, and automation—a significantly larger TAM story. 

**The Value Proposition (Workflow Acceleration):** Our first value is NOT summarization, though summaries are nice. Real PMF is driven by the fact that **AI resolves blockers automatically:**
*   **PR stuck?** AI automatically pings the right reviewer.
*   **Incident alert?** AI routes it to the correct on-call engineer with full context.
*   **Question asked?** AI answers instantly using deep workspace history.

**Target Vertical:** Keep it narrow for faster love. We aim to be "The best async coordination tool for 50-200 person product teams," not a universal company chat.

**"Memory Magic" Onboarding:** Within 5 minutes of signing up, a user must feel: *"This knows more about my company than I do."* We auto-ingest GitHub histories, auto-answer real questions accurately, and auto-surface hidden decisions automatically. This delivers huge value immediately, even for a 1-person team.

**The Moat & Business Model (Why it's investable):** 
Our key leverage is being fully free and open-source. We gamify functionality—the more you use the platform, the more advanced features you unlock. Freemium monetization kicks in for advanced coordination capabilities that exclusively benefit 50+ person teams. 
We completely flip the open-core narrative: we don't just pitch "self-hosting for privacy." We offer **self-hosting for AI infrastructure cost control and absolute customization**, a message that resonates far stronger with CTO buyers looking to train dedicated models on proprietary data.

---

## 6. The 3-Day MVP Execution Plan (5 Devs)
With 3 days and 5 developers, you cannot build all of Slack. You must build the **"Aha!" moment** that proves the AI-first thesis. 

**The Goal:** Prove the new UI paradigm (Linear-style inbox over Slack channels) and the power of Graph-RAG answering questions instantly based on integrations.

**The Tech Stack (Optimized for Speed):**
*   **Backend & State:** **Convex**. Perfect for this. It handles real-time WebSocket sync inherently, has built-in vector search/CRON jobs for AI polling, and acts as the reactive backend-as-a-service.
*   **Identity & Enterprise Ready:** **WorkOS**. Drop this in on Day 1. It provides ready-to-go SAML SSO and directory sync. This instantly proves you can sell to mid-market/enterprise without building complex auth flows.
*   **Knowledge Graph (Graph-RAG):** **Graphiti** (or similar semantic tool). Instead of just dumping regular vectors into Postgres, build a semantic relationship graph. The AI knows *who* wrote the code, *what* Linear issue it relates to, and *which* chat thread spawned it.
*   **Frontend / Mobile:** React Native (Expo) or responsive Next.js/Tailwind. The UI must feel like Linear—keyboard shortcuts, command palettes, and an "Inbox" model focused on action, not endless scrolling on mobile.

**Resource Allocation:**
*   **Dev 1 & 2 (Frontend UI/UX):** Next.js UI. Focus on a radical redesign: A "Copilot Inbox" where the AI pre-reads channels and presents actionable cards (e.g., "3 PRs need review", "New Jira ticket assigned").
*   **Dev 3 (Backend & Auth):** Convex schema design & real-time sync + WorkOS integration for instant enterprise readiness.
*   **Dev 4 (Knowledge Engine):** Build the ingestion pipeline using Graphiti to map relationships between incoming chat messages and simulated Linear/Jira/GitHub webhooks.
*   **Dev 5 (AI Agents):** Build the `@KnowledgeBot` that queries the Graphiti/Convex backend when mentioned and formulates an answer.

**Scope Cuts (DO NOT BUILD IN 3 DAYS):**
*   Direct Messages (DMs)
*   Complex threaded UI (just use a flat channel for now)
*   File uploads (focus strictly on text/code snippets)
*   SAML/SSO (just use simple magic links or Google Auth)
*   Custom Agent Builder (hardcode one powerful answering bot)

**The Demo Flow (Day 3):**
1.  Flood the channel with 100 messages of dense technical discussion between humans.
2.  Switch to the "Copilot Inbox" to show a beautiful, 3-bullet-point summary of the decisions made. *(Aha moment #1)*
3.  Ask the channel, "@bot how did we decide to configure the database earlier?" 
4.  The bot replies instantly with the exact context and cites the specific messages from the flood. *(Aha moment #2)*
