<!--
  Sync Impact Report
  ===================
  Version change: 0.0.0 → 1.0.0 (MAJOR - initial ratification)

  Modified principles: N/A (initial creation)

  Added sections:
    - Core Principles (9 principles)
    - Non-Negotiable Deliverables
    - Intelligence Architecture
    - Personalization Doctrine
    - Governance

  Removed sections: N/A (initial creation)

  Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section exists)
    - .specify/templates/spec-template.md: ✅ Compatible (User scenarios align with curriculum fidelity)
    - .specify/templates/tasks-template.md: ✅ Compatible (Phase structure supports TDD)

  Follow-up TODOs: None
-->

# Physical AI & Humanoid Robotics Constitution

## Mission Statement

This project exists to create an **AI-native, spec-driven technical textbook** for teaching **Physical AI & Humanoid Robotics**, enabling learners to bridge the gap between **digital intelligence** and **physical embodiment**. The textbook MUST integrate **simulation, robotics middleware, embodied AI, and conversational agents** into a unified learning experience.

The system MUST not only teach concepts but **act as an intelligent learning companion** through embedded agents.

## Core Principles

### I. Embodied Intelligence First

All explanations, examples, and exercises MUST reinforce the idea that **intelligence emerges from interaction with the physical world**, not just computation.

- Content MUST connect abstract AI concepts to physical manifestations
- Examples MUST demonstrate sensor-actuator loops, not isolated algorithms
- Exercises MUST involve simulation or real-world interaction where feasible

**Rationale**: Physical AI fundamentally differs from pure software AI; learners must internalize that embodiment is not an afterthought but the foundation.

### II. Spec-Driven Development

Every component (book, agents, backend, UI, personalization) MUST be:

- Defined by explicit specifications before implementation
- Deterministic and reproducible across environments
- Automatable through Claude Code + Spec-Kit Plus workflows

**Rationale**: Spec-driven development ensures traceability, reduces ambiguity, and enables AI-assisted development at scale.

### III. AI-Native by Design

The book is not static content. It MUST be:

- **Queryable**: Readers can ask questions and receive contextual answers
- **Interactive**: Content adapts based on reader engagement
- **Adaptive**: Depth and tone adjust to learner proficiency

Readers MUST learn *with* AI agents, not just *about* AI.

**Rationale**: An AI textbook that isn't itself AI-powered fails to demonstrate its own subject matter.

### IV. Sim-to-Real Continuity

The architecture MUST preserve a clean pipeline from:

```
Simulation → Training → Deployment → Physical Execution
```

- No learning path MUST exist that cannot eventually map to real hardware
- Simulation environments MUST use physics engines that approximate real-world dynamics
- Transfer learning concepts MUST be explicitly addressed in curriculum

**Rationale**: Sim-to-real transfer is the critical bridge in physical AI; the learning experience must mirror this reality.

### V. Curriculum Fidelity

The textbook MUST strictly follow the defined course structure:

1. **Physical AI Foundations** – Core concepts of embodied intelligence
2. **ROS 2 Nervous System** – Robotics middleware architecture
3. **Digital Twins (Gazebo & Unity)** – Simulation environments
4. **NVIDIA Isaac Platform** – Industrial-grade simulation and training
5. **Vision-Language-Action (VLA)** – Multimodal AI for robotics
6. **Conversational Humanoid Capstone** – Integration project

Deviations from this sequence require explicit justification and approval.

**Rationale**: The curriculum represents a carefully designed learning progression; ad-hoc modifications undermine pedagogical coherence.

### VI. Hardware Truthfulness

Hardware requirements MUST be:

- **Explicit**: Clearly state GPU, RAM, storage, and platform requirements
- **Realistic**: No understated requirements that lead to learner frustration
- **Honest**: Acknowledge limitations (RTX requirements, Jetson constraints, latency issues)

No misleading low-resource promises are allowed. If a module requires an RTX 4090, state it clearly.

**Rationale**: Learners investing time and money deserve accurate expectations; false promises erode trust.

### VII. Cloud vs On-Prem Neutrality

The book MUST support both deployment models without bias:

- **On-Prem High-CapEx Labs**: Local GPU clusters, dedicated hardware
- **Cloud-Native High-OpEx Labs (Ether Lab)**: Cloud GPU instances, serverless infrastructure

Trade-offs (latency, cost, control, scalability) MUST be explained objectively. Neither model is inherently superior.

**Rationale**: Learners operate in diverse environments; the textbook must serve all without preferential treatment.

### VIII. Evaluation Alignment

All features MUST map cleanly to hackathon scoring criteria:

| Category | Points | Requirement |
|----------|--------|-------------|
| Base functionality | 100 | Core textbook + RAG chatbot |
| Reusable intelligence | Bonus | Claude agents and sub-agents |
| Personalization | Bonus | Adaptive content based on user profile |
| Localization | Bonus | Urdu translation capability |

No feature SHOULD exist without a scoring justification. Features that don't contribute to evaluation MUST be explicitly justified on other grounds.

**Rationale**: Resource allocation must be strategic; the hackathon context defines success criteria.

### IX. Ethics & Safety

The following practices are strictly prohibited:

- **Unsafe robot control**: No examples that could cause physical harm if replicated
- **Cloud-to-robot real-time control without safety layers**: All remote control examples MUST include fail-safes
- **Unvalidated sim-to-real transfer**: Examples MUST include validation steps before real hardware deployment

All robot interaction examples MUST include:
- Emergency stop procedures
- Workspace boundary definitions
- Human proximity safety considerations

**Rationale**: Physical AI carries real-world safety implications; the textbook must model responsible practices.

## Non-Negotiable Deliverables

### Textbook Platform

- Built using **Docusaurus**
- Deployed via **GitHub Pages or Vercel**
- Written and maintained through **Spec-Kit Plus**
- Single public GitHub repository containing book, agents, backend, and deployment configs

### Integrated RAG Chatbot

The textbook MUST embed a Retrieval-Augmented Generation agent that:

- Answers questions strictly from book content (no hallucination beyond source material)
- Supports **selected-text-only answering** (highlight → ask)
- Uses the following technology stack:
  - OpenAI Agents / ChatKit SDK for agent orchestration
  - FastAPI backend for API endpoints
  - Neon Serverless Postgres for user data and metadata
  - Qdrant Cloud (Free Tier) for vector embeddings

## Intelligence Architecture

### Agent Roles

The system MUST support multiple intelligence layers:

| Agent | Responsibility |
|-------|----------------|
| **Reader Tutor Agent** | Explains concepts contextually based on reader's highlighted text |
| **ROS Mentor Agent** | Assists with robotics middleware logic, node configuration, topic debugging |
| **Simulation Guide Agent** | Helps navigate Gazebo, Unity, Isaac Sim environments |
| **Capstone Planner Agent** | Guides VLA and humanoid integration workflows |

Reusable intelligence via **Claude Sub-Agents and Skills** is strongly encouraged for:
- Code review and debugging assistance
- Configuration validation
- Progress tracking across chapters

## Personalization Doctrine

### Authentication

- Signup/Signin via **Better-Auth**
- User profile MUST collect:
  - Software development experience level
  - Hardware/electronics exposure
  - AI/ML proficiency (none, beginner, intermediate, advanced)

### Adaptive Content

- Chapter-level personalization button MUST be available
- Content tone, depth, and examples MUST adapt to user profile:
  - **Beginner**: More analogies, step-by-step walkthroughs, prerequisite links
  - **Intermediate**: Standard technical depth, optional deep-dives
  - **Advanced**: Concise explanations, focus on edge cases and optimization

### Language Accessibility

- One-click **Urdu translation** per chapter
- Translations MUST preserve technical accuracy over literal wording
- Technical terms MAY remain in English with Urdu explanations

## Governance

### Amendment Procedure

1. Proposed amendments MUST be documented in a pull request
2. Amendments require review and explicit approval
3. All amendments MUST include a migration plan for affected artifacts
4. Breaking changes (principle removal/redefinition) require MAJOR version bump

### Versioning Policy

This constitution follows semantic versioning:

- **MAJOR**: Backward-incompatible governance/principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Review

- All pull requests MUST verify compliance with this constitution
- Complexity beyond these principles MUST be justified in writing
- Refer to `.specify/memory/constitution.md` for authoritative guidance

**Version**: 1.0.0 | **Ratified**: 2026-01-08 | **Last Amended**: 2026-01-08
