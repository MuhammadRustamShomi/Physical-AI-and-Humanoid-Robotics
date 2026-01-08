# Implementation Plan: Textbook Platform

**Branch**: `001-textbook-platform` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-textbook-platform/spec.md`

## Summary

Build a Docusaurus-based textbook platform for Physical AI & Humanoid Robotics with an integrated RAG chatbot. The platform displays 6 curriculum modules, supports full-text search, and enables readers to ask questions about textbook content with text-selection context.

**Core deliverables**:
1. Docusaurus static site with responsive 6-module curriculum
2. FastAPI backend for RAG-powered chat
3. Qdrant vector storage for semantic search
4. Text-selection integration for contextual questions

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Python 3.11 (backend)
**Primary Dependencies**: Docusaurus 3.x, React 18, FastAPI, Qdrant Client, OpenAI SDK
**Storage**: Neon Serverless PostgreSQL (sessions), Qdrant Cloud (vectors), Markdown files (content)
**Testing**: Jest (frontend), pytest (backend)
**Target Platform**: Web (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: <3s page load, <2s chat response (SC-001, research findings)
**Constraints**: Qdrant free tier (1M vectors), OpenAI API rate limits
**Scale/Scope**: ~50 chapters across 6 modules, 1,500+ content chunks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Embodied Intelligence First | PASS | Content structure preserves sim-to-real pipeline |
| II. Spec-Driven Development | PASS | This plan derived from explicit spec.md |
| III. AI-Native by Design | PASS | RAG chatbot is core feature, not afterthought |
| IV. Sim-to-Real Continuity | PASS | Hardware requirements displayed per chapter (FR-011) |
| V. Curriculum Fidelity | PASS | 6-module structure enforced in data model |
| VI. Hardware Truthfulness | PASS | FR-011 requires explicit hardware disclosure |
| VII. Cloud vs On-Prem Neutrality | PASS | FR-012 indicates resource type per chapter |
| VIII. Evaluation Alignment | PASS | Base functionality (100pts) + Claude agents (bonus) |
| IX. Ethics & Safety | PASS | Out-of-scope detection prevents harmful answers |

**Gate Status**: PASSED - Proceed to implementation

## Project Structure

### Documentation (this feature)

```text
specs/001-textbook-platform/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Entity definitions
├── quickstart.md        # Local development guide
├── contracts/
│   └── chat-api.yaml    # OpenAPI specification
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
frontend/
├── docusaurus.config.js    # Docusaurus configuration
├── sidebars.js             # Navigation structure
├── docs/                   # Markdown content by module
│   ├── mod-1-physical-ai/
│   ├── mod-2-ros2/
│   ├── mod-3-digital-twins/
│   ├── mod-4-isaac/
│   ├── mod-5-vla/
│   └── mod-6-capstone/
├── src/
│   ├── components/
│   │   └── ChatWidget/     # RAG chatbot UI
│   ├── contexts/
│   │   └── ChatContext.js  # Chat state management
│   ├── hooks/
│   │   └── useChat.js      # API communication hook
│   └── theme/
│       └── Footer/         # Swizzled for chat widget
└── package.json

backend/
├── main.py                 # FastAPI application entry
├── app/
│   ├── api/
│   │   ├── chat.py         # Chat endpoints
│   │   └── health.py       # Health check
│   ├── services/
│   │   ├── rag.py          # RAG pipeline
│   │   ├── embeddings.py   # OpenAI embeddings
│   │   └── oos_detector.py # Out-of-scope detection
│   ├── models/
│   │   ├── session.py      # Chat session model
│   │   └── message.py      # Message model
│   └── config/
│       └── settings.py     # Pydantic settings
├── scripts/
│   └── embed_content.py    # Content embedding pipeline
├── tests/
│   ├── test_chat.py
│   └── test_rag.py
├── requirements.txt
└── .env.example

tests/
├── contract/               # API contract tests
├── integration/            # End-to-end tests
└── unit/                   # Unit tests
```

**Structure Decision**: Web application pattern selected. Frontend (Docusaurus) and backend (FastAPI) are separate concerns with clear API boundary defined in `contracts/chat-api.yaml`.

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Static Site | Docusaurus 3.x | Constitution requirement |
| Frontend Hosting | Vercel | Best DX, PR previews, zero-config |
| Backend Framework | FastAPI + Uvicorn | Async Python, OpenAPI generation |
| Backend Hosting | Railway | Full-stack, no cold starts |
| Vector Database | Qdrant Cloud (Free) | 1M vectors free, good Python SDK |
| Relational Database | Neon Postgres | Constitution requirement |
| Embeddings | OpenAI text-embedding-3-small | Cost-effective (768-dim) |
| LLM | Claude API | Constitution encourages Claude agents |
| State Management | React Context + localStorage | Sufficient for chat widget |

## Key Design Decisions

### 1. Chat Widget Integration

**Decision**: Swizzle Docusaurus Footer + custom React component

**Rationale**:
- Persistent across page navigation
- Theme-aware (light/dark mode)
- Full control over text selection handling

**Alternatives rejected**:
- Third-party plugins (Biel.ai, DocsBot): Less customization
- Script injection: No deep theme integration

### 2. RAG Chunking Strategy

**Decision**: 512-768 tokens with 64-token overlap

**Rationale**:
- Balances context coverage with retrieval precision
- Code blocks kept atomic (never split)
- Math equations preserved with surrounding context

### 3. Out-of-Scope Detection

**Decision**: Multi-tier detection (keyword + semantic + module classification)

**Rationale**: Required to achieve SC-008 (100% accuracy on OOS detection)
- Tier 1: Keyword blacklist (financial, medical, legal)
- Tier 2: Semantic relevance score < 0.5
- Tier 3: Module classification mismatch

### 4. Deployment Architecture

**Decision**: Vercel (frontend) + Railway (backend)

**Rationale**:
- Vercel: Zero-config Docusaurus, PR previews
- Railway: No serverless timeout limits for RAG

## Phase Dependencies

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational (Database, Embeddings)
    │
    ├───────────────┬───────────────┐
    ▼               ▼               ▼
Phase 3:        Phase 4:        Phase 5:
US1 - Read      US2 - Chat      US3 - Responsive
    │               │               │
    └───────────────┴───────────────┘
                    │
                    ▼
              Phase 6: US4 - Search
                    │
                    ▼
              Phase 7: Polish
```

## Artifacts Generated

| Artifact | Path | Description |
|----------|------|-------------|
| Research | [research.md](./research.md) | Technical decisions and rationale |
| Data Model | [data-model.md](./data-model.md) | Entity definitions and schemas |
| API Contract | [contracts/chat-api.yaml](./contracts/chat-api.yaml) | OpenAPI specification |
| Quickstart | [quickstart.md](./quickstart.md) | Local development guide |

## Next Steps

1. **Run `/sp.tasks`** to generate implementation task list
2. Begin Phase 1 (Setup) tasks
3. Provision infrastructure (Vercel, Railway, Qdrant, Neon)

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| Two services (frontend + backend) | Necessary | Static site + RAG requires separate backend |
| Three databases (Postgres, Qdrant, Markdown) | Necessary | Each serves distinct purpose per constitution |
