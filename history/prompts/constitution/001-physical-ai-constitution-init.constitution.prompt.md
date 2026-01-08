---
id: 001
title: Physical AI Constitution Init
stage: constitution
date: 2026-01-08
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: master
user: unknown
command: /sp.constitution
labels: ["constitution", "physical-ai", "humanoid-robotics", "initialization"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A
---

## Prompt

```text
#spec.constitution

## Project: Physical AI & Humanoid Robotics (AI-Native Textbook)

---

## 1. Mission Statement
This project exists to create an **AI-native, spec-driven technical textbook** for teaching **Physical AI & Humanoid Robotics**, enabling learners to bridge the gap between **digital intelligence** and **physical embodiment**. The textbook must integrate **simulation, robotics middleware, embodied AI, and conversational agents** into a unified learning experience.

The system must not only teach concepts but **act as an intelligent learning companion** through embedded agents.

---

## 2. Core Principles

### 2.1 Embodied Intelligence First
All explanations, examples, and exercises must reinforce the idea that **intelligence emerges from interaction with the physical world**, not just computation.

### 2.2 Spec-Driven Development
Every component (book, agents, backend, UI, personalization) must be:
- Defined by explicit specifications
- Deterministic and reproducible
- Automatable through Claude Code + Spec-Kit Plus

### 2.3 AI-Native by Design
The book is not static content.
- It must be **queryable, interactive, and adaptive**
- Readers should learn *with* AI agents, not just *about* AI

### 2.4 Sim-to-Real Continuity
The architecture must preserve a clean pipeline from:
Simulation → Training → Deployment → Physical Execution

No learning path should exist that cannot eventually map to real hardware.

---

## 3. Non-Negotiable Deliverables

### 3.1 Textbook Platform
- Built using **Docusaurus**
- Deployed via **GitHub Pages or Vercel**
- Written and maintained through **Spec-Kit Plus**

### 3.2 Integrated RAG Chatbot
The textbook must embed a Retrieval-Augmented Generation agent that:
- Answers questions strictly from book content
- Supports **selected-text-only answering**
- Uses:
  - OpenAI Agents / ChatKit SDK
  - FastAPI backend
  - Neon Serverless Postgres
  - Qdrant Cloud (Free Tier)

### 3.3 Unified Repository
- Single public GitHub repository
- Book, agents, backend, and deployment configs must coexist

---

## 4. Intelligence Architecture

### 4.1 Agent Roles
The system must support multiple intelligence layers:

- **Reader Tutor Agent** – Explains concepts contextually
- **ROS Mentor Agent** – Assists with robotics middleware logic
- **Simulation Guide Agent** – Helps navigate Gazebo, Unity, Isaac Sim
- **Capstone Planner Agent** – Guides VLA and humanoid workflows

Reusable intelligence via **Claude Sub-Agents and Skills** is strongly encouraged.

---

## 5. Personalization Doctrine (Bonus-Driven)

### 5.1 Authentication
- Signup / Signin via **Better-Auth**
- Collect user background:
  - Software experience
  - Hardware exposure
  - AI/ML proficiency

### 5.2 Adaptive Content
- Chapter-level personalization button
- Content tone, depth, and examples must adapt to user profile

### 5.3 Language Accessibility
- One-click **Urdu translation** per chapter
- Translations must preserve technical accuracy, not literal wording

---

## 6. Course Integrity Rules

### 6.1 Curriculum Fidelity
The textbook must strictly follow the defined course structure:
- Physical AI Foundations
- ROS 2 Nervous System
- Digital Twins (Gazebo & Unity)
- NVIDIA Isaac Platform
- Vision-Language-Action
- Conversational Humanoid Capstone

### 6.2 Hardware Truthfulness
Hardware requirements must be:
- Explicit
- Realistic
- Honest about limitations (RTX, Jetson, latency)

No misleading low-resource promises are allowed.

---

## 7. Cloud vs On-Prem Neutrality
The book must support both:
- **On-Prem High-CapEx Labs**
- **Cloud-Native High-OpEx Labs (Ether Lab)**

Trade-offs must be explained clearly without bias.

---

## 8. Evaluation Alignment

All features must map cleanly to hackathon scoring:
- Base functionality (100 points)
- Reusable intelligence (Claude agents)
- Personalization
- Localization (Urdu)

No feature should exist without a scoring justification.

---

## 9. Ethics & Safety

- No unsafe robot control practices
- No cloud-to-robot real-time control without safety layers
```

## Response snapshot

Created the project constitution v1.0.0 for Physical AI & Humanoid Robotics at `.specify/memory/constitution.md`.

**Key sections established:**
- Mission Statement: AI-native, spec-driven textbook for Physical AI & Humanoid Robotics
- 9 Core Principles: Embodied Intelligence First, Spec-Driven Development, AI-Native by Design, Sim-to-Real Continuity, Curriculum Fidelity, Hardware Truthfulness, Cloud vs On-Prem Neutrality, Evaluation Alignment, Ethics & Safety
- Non-Negotiable Deliverables: Docusaurus platform, RAG chatbot with FastAPI/Qdrant/Neon stack
- Intelligence Architecture: 4 specialized agents (Reader Tutor, ROS Mentor, Simulation Guide, Capstone Planner)
- Personalization Doctrine: Better-Auth, adaptive content, Urdu translation
- Governance: Amendment procedure, semantic versioning, compliance review

**Version**: 1.0.0 | **Ratified**: 2026-01-08

## Outcome

- Impact: Initial project constitution ratified - establishes governance framework for entire project
- Tests: N/A (constitution document, not code)
- Files: 1 file created (.specify/memory/constitution.md)
- Next prompts: `/sp.specify` to create first feature spec, or `/sp.plan` for implementation planning
- Reflection: User provided comprehensive input covering all constitution sections; no clarification needed

## Evaluation notes (flywheel)

- Failure modes observed: None - user input was complete and well-structured
- Graders run and results (PASS/FAIL): Manual review - PASS (all placeholders filled, no ambiguity)
- Prompt variant (if applicable): Standard /sp.constitution invocation
- Next experiment (smallest change to try): N/A - successful execution
