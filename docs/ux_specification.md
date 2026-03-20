# PING Platform: UX Specification & User Journeys

**Status:** Draft for Internal Review
**Audience:** PING Engineering, Product, and Design Teams
**Goal:** This document serves as the foundational UX specification for the PING Platform MVP, detailing the overarching design principles and explicit user journeys for our three core personas. Please review the detailed flows and leave comments on feasibility or desired adjustments before we move to UI mockups.

---

## 1. Core UX Principles

Before diving into specific personas, the platform adheres to these overarching UX tenets:

1.  **Proactive Over Reactive:** The interface actively surfaces urgent or blocked items. Information is pushed to the user based on priority rather than pulled through chronological feeds.
2.  **High Information Density, Low Clutter:** Utilize a dark-theme UI with strict semantic status colors (Red = Urgent, Amber = Warning/Ongoing, Green = Done/Online) and clear typography hierarchy to present dense operational data cleanly.
3.  **AI Transparency:** AI agents must never act as "magic black boxes". Outcomes must always include citations, reasoning (e.g., *"Routed to you because you authored PR #142"*), and clickable links to raw source data.
4.  **Shared Collaborative AI Spaces:** AI agents are not restricted to private, 1-on-1 DMs. They live natively in group conversations, collaborating alongside human users openly so the whole team benefits from shared context.

---

## 2. Persona: The Everyday User (Individual Contributor / Developer)

**Primary Objective:** Regain focus, reduce context-switching, and act only on what truly matters without missing critical organizational blockers.

### Flow 2.1: The Copilot Inbox (Primary View)
*   **Screen 1 [Inbox Overview]:** The user navigates to their Copilot Inbox instead of a chronological chat feed.
*   **Screen 2 [Ranked Cards]:** The inbox displays a prioritized list of AI-generated cards based on the **Eisenhower Matrix**. Priority is instantly visible via color-coded left borders. Each card explicitly extracts assigned action items with user avatars.
*   **Action:** The user clicks "Mark Read", "Archive", or "Go to Channel" directly from the card to triage their workload.

### Flow 2.2: Ambient Proactive Alerts
*   **Screen 1 [Channel Context]:** The user is actively working and participating in a channel's ongoing thread.
*   **Screen 2 [Ambient Banner]:** A non-intrusive alert banner slides down. For example, a "Blocked Task Alert" surfaces, indicating that a colleague's Linear ticket is blocked by a PR the user hasn't reviewed yet.
*   **Action:** The user clicks "Review PR directly" or "Ping suggested colleague", resolving the bottleneck immediately.

### Flow 2.3: Collaborative AI in Shared Group Chats
*   **Screen 1 [Group Chat Context]:** The user is in a group chat (e.g., `#devops-triage`) with 4 other colleagues discussing a recent infrastructure incident. A question arises about an infrastructure change made three months ago.
*   **Screen 2 [Invoking the Agent]:** Instead of searching a wiki or switching to a separate bot-DM, the user types `@KnowledgeBot` directly in the existing group chat and asks: *"Can you fetch the Terraform changes related to the database migration from October?"*
*   **Screen 3 [Real-time Context Assembly]:** The AI Agent reads the current group chat's context and instantly queries the Temporal Knowledge Graph for the relevant historical decisions.
*   **Screen 4 [Collaborative Response]:** The AI Agent posts a reply natively in the group chat. The message includes a concise summary of the Terraform changes and **Citation Pills** linking directly to the historical PRs and Jira tickets.
*   **Screen 5 [Human + AI Threading]:** A colleague replies to the AI's message in the thread: *"Thanks @KnowledgeBot, did that migration also touch the redis cache?"* The agent responds inline, keeping the whole human team contextually aligned and collaborating in real-time.

---

## 3. Persona: Company Tool Admin (CTO / Engineering Manager)

**Primary Objective:** Deploy the platform seamlessly, connect the toolchain, sculpt the AI's data perimeter, and monitor the tangible value the system provides.

### Flow 3.1: Team and Role Management
*   **Screen 1 [Workspace Settings]:** The Admin navigates to the "Team Management" tab.
*   **Screen 2 [Directory Roster]:** The system displays a data table of all current users, synced automatically via WorkOS Directory Sync (SCIM/SAML).
*   **Action:** The Admin can manually invite guests, assign RBAC roles (Admin, Member, Guest), or instantly deprovision a departing employee.

### Flow 3.2: AI Agent Configuration & Scoping
*   **Screen 1 [Agent Directory]:** The Admin navigates to the "Agents" tab to view a list of active AI agents (e.g., KnowledgeBot, SupportRouterBot).
*   **Screen 2 [Agent Setup]:** The Admin clicks "Create New Agent" or edits an existing one. They input the Name, Avatar, and System Prompt instructing the agent on its personality and operational boundaries (e.g., *"Always adopt a formal tone, route infrastructure questions directly to DevOps"*). Crucially, they define the **Knowledge Scope**: explicitly restricting the agent from seeing or indexing specific private channels or sensitive HR GitHub repositories.
*   **Action:** The Admin clicks "Deploy Agent," making it immediately available for users to `@mention` in workspaces.

### Flow 3.3: Temporal Knowledge Graph Auditing
*   **Screen 1 [Graph Explorer]:** To trust the AI, the Admin navigates to the "Knowledge Graph" tab to audit what the AI currently "knows."
*   **Screen 2 [Visual Audit]:** A visual representation of data ingestion, showing total nodes created across GitHub, Linear, and Chat integrations.
*   **Action:** The Admin types a query (e.g., "Authentication System Revamp") to see the web of connected tickets, PRs, and conversations, verifying the ingestion pipeline is properly mapping relationships.

### Flow 3.4: Usage Analytics & Value Telemetry
*   **Screen 1 [Analytics Dashboard]:** The Admin opens the "Usage & Analytics" tab.
*   **Screen 2 [System Metrics]:** They view the "Agent Interaction Leaderboard" showing which human users interact with AI agents the most. They also review visual graphs of LLM token usage (Summarizations vs. Direct Queries) to manage compute costs, and a calculated "Estimated Hours Saved" metric demonstrating the platform's ROI.
*   **Action:** Admin filters metrics by specific date ranges or teams to investigate adoption trends.

---

## 4. Persona: Product Backoffice (Customer Success & Security)

**Primary Objective:** Monitor enterprise tenant health, troubleshoot integration failures, and ensure strict AI guardrails are actively protecting customer data perimeters.
*(Important: This persona operates exclusively in a highly secure, isolated Backoffice Web Application at `admin.ping-internal.com`, completely segregated from normal user traffic.)*

### Flow 4.1: Global Workspace Telemetry
*   **Screen 1 [Backoffice Hub]:** The CS/Security Agent logs into the internal dashboard. They are presented with a global directory of all active enterprise tenants (workspaces) to monitor aggregate health and ingestion statuses.
*   **Screen 2 [Tenant Detail View]:** Clicking into "Acme Corp," the agent views real-time CRON job health strings and webhook sync statuses for GitHub/Linear, quickly spotting if a customer's data ingestion has stalled.

### Flow 4.2: Civic Nexus Integration (AI Security Audit Layer)
*   *Concept Integration: PING relies on Civic Nexus (`civic.com`) to serve as the identity, authorization, and control plane specifically for managing AI agent access.*
*   **Screen 1 [Civic Identity Widget]:** Within the tenant detail view, the CS Agent opens the "AI Security & Operations (Powered by Civic)" panel.
*   **Screen 2 [Guardrail Audit Ledger]:** They view a secure, immutable ledger detailing exactly which external APIs and databases each AI agent attempted to access. *(Example log: `[10:14 AM] KnowledgeBot requested read access to github/acme-corp/private-repo. Access GRANTED via Civic.`)*
*   **Screen 3 [Anomaly Detection & Governance]:** The Civic Nexus integration surfaces a critical warning: `Anomaly: Agent 'SupportBot' attempted to bulk-export 50k customer records to an external IP.`
*   **Action [Instant Access Revocation]:** The CS Agent clicks the prominent "Kill Switch" button. Through Civic's control plane, this instantly cuts all external data connections and API access for that specific agent, preventing any data exfiltration without taking the entire customer workspace offline.

### Flow 4.3: Secure Support Impersonation
*   **Screen 1 [Impersonation Authorization]:** The CS Agent initiates a "Proxy Customer Admin" workflow. This requires explicit logging to internal security auditing tools.
*   **Screen 2 [Proxy View]:** The CS Agent is securely proxied into the customer's exact admin view (with any sensitive PII obfuscated by default) to directly assist a stuck customer with configuration mistakes or to trigger manual historical data re-syncs.
