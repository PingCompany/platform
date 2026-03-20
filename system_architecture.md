# PING System Architecture

## 1. Overview
PING is an open-core, AI-native team communication platform. This architecture is explicitly designed for a highly constrained 48-hour MVP build, optimizing for real-time reactivity, AI integration, and instant enterprise readiness.

### Core Stack
*   **Frontend/Mobile:** Next.js (Web) / Expo (React Native) + Tailwind CSS
*   **Backend & Reactive State:** Convex (Serverless Backend as a Service)
*   **Identity & Enterprise Auth:** WorkOS
*   **AI orchestration & Knowledge Graph:** Graphiti + Vercel AI SDK 

---

## 2. High-Level Architecture Diagram
```mermaid
graph TD;
    Client[Next.js / Expo Client] -->|WebSockets / SSL| Convex[Convex Backend]
    
    %% Identity Flow
    Client -->|SAML Login| WorkOS[WorkOS Identity]
    WorkOS -->|Webhooks| Convex
    
    %% Core Reactive State
    subgraph Convex
        DB[(Convex DB \n Messages/Channels)]
        VectorDB[(Convex Vector Search)]
        Cron[Convex CRON \n Summaries]
    end
    
    %% Integration & AI Flow
    Convex -->|Message Webhooks| Graphiti[Temporal Knowledge Graph]
    Ext[Jira / GitHub / Linear] -->|Webhooks| Graphiti
    
    subgraph Graphiti
        Graph[(Continuous Temporal Graph)]
    end
    
    %% Bot Queries
    Convex -->|@KnowledgeBot Query| Model[OpenAI / Claude \n via Vercel AI SDK]
    Model -->|Graph-RAG Retrieval| Graphiti
```

---

## 3. Component Details

### 3.1 Frontend (Next.js / Expo)
*   **UI Paradigm:** Implements the "Copilot Inbox" and actionable UI cards instead of a traditional chat layout.
*   **State Management:** Inherently managed by `convex/react` bindings. No Redux/Zustand required for messaging state; Convex handles optimistic updates and real-time syncing automatically.

### 3.2 Backend (Convex)
*   **Real-time Sync:** Completely replaces the need for a separate Redis pub/sub layer and WebSocket server.
*   **Vector Storage:** Built-in vector capabilities index messages the moment they are written to the database.
*   **Background Jobs:** Convex actions handle asynchronous tasks like hitting the OpenAI API to generate the "Copilot Inbox" summaries without blocking the main execution thread.

### 3.3 Identity (WorkOS)
*   **User Provisioning:** Handled immediately via SCIM / Directory Sync.
*   **SSO:** Replaces complex Auth0 or NextAuth setups to ensure immediate SOC2 compliance and enterprise readiness for mid-market customers.

### 3.4 Knowledge Engine (Temporal Knowledge Graph)
*   **Temporal Graph-RAG:** Constructs a continuous, temporal semantic web of the workspace. It understands how your project structures, PRs, and team members evolve over time.
*   **Insane "Memory Magic" Onboarding:** Auto-ingests GitHub, Jira, and Linear history instantly upon connection, surfacing hidden decisions immediately to provide value even for 1-person teams.
*   **Data Ownership & Custom Models:** Our open-source foundation allows CTOs to own their graph data entirely and train custom LLMs directly on company knowledge for maximum precision.

### 3.5 Proactive Agents & Workflow Acceleration
*   **Event-Driven Resolvers:** Instead of waiting to be asked, agents proactively monitor integrations to automatically resolve blockers (e.g., pinging reviewers on stuck PRs, routing PagerDuty alerts to the right engineer based on commit history).
*   **Gamification Engine:** Tracks user engagement and AI interactions to unlock freemium features dynamically as teams adopt the system.

## 4. The 48-Hour Execution Flow

1.  **Hours 0-12 (Foundation):** Next.js setup, WorkOS integration, and Convex schema definition (`users`, `channels`, `messages`).
2.  **Hours 12-24 (The UI Shift):** Build the Copilot Inbox UI. Write Convex Actions that run a cron job over the last 100 messages, summarize them via OpenAI, and push to the Inbox view.
3.  **Hours 24-40 (The Brain):** Connect Graphiti. Pipe every inbound chat message into Graphiti. Create webhook endpoints for simulated Jira/Linear tickets to populate the graph.
4.  **Hours 40-48 (The Magic Bot):** Build `@KnowledgeBot` using Vercel AI SDK, utilizing Graphiti as its primary tool for RAG retrieval.
