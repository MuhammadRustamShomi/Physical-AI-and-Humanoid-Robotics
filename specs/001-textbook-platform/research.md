# Research: Textbook Platform

**Feature**: 001-textbook-platform
**Date**: 2026-01-08
**Status**: Complete

## Executive Summary

This research resolves all technical decisions for the Textbook Platform implementation. Key decisions:
- **Frontend**: Docusaurus with custom React chatbot widget (swizzled Footer component)
- **Backend**: FastAPI on Railway with Neon Postgres for sessions
- **RAG**: Qdrant Cloud with OpenAI text-embedding-3-small (768-dim)
- **Deployment**: Vercel (frontend) + Railway (backend)

---

## 1. Chatbot Integration Strategy

### Decision: Swizzle + Custom React Component

**Rationale**: Best approach for deep Docusaurus integration. Allows:
- Persistent chat widget across page navigation
- Theme-aware styling (light/dark mode)
- Full control over text selection handling
- Direct communication with FastAPI backend

**Alternatives Considered**:

| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| Third-party plugin (Biel.ai, DocsBot) | Fast MVP | Less customization, external dependency | Need full control for RAG + selected text |
| Script injection via docusaurus.config.js | Simple | No deep integration, no theme awareness | Insufficient for AI-native experience |
| Separate chat page (docusaurus-plugin-chat-page) | Simpler state | Breaks reading flow | Users should chat while reading |

**Implementation Pattern**:
```javascript
// src/theme/Footer/index.js (swizzled)
// Wraps Footer with ChatWidget component
// Maintains chat state via React Context
// Uses localStorage for session persistence
```

---

## 2. Text Selection Integration

### Decision: mouseup Event + Selection Capture

**Rationale**: Standard web pattern with minimal overhead. Captures highlighted text and passes to RAG pipeline.

**Implementation Flow**:
1. Listen for `mouseup` event on document
2. Check `window.getSelection().toString()` length > 10 chars
3. Position "Ask about this" button near selection
4. On click: open chat with selected text as context
5. Send to backend: `{ question, selected_text, chapter_id }`

**Edge Cases Handled**:
- Selection spans multiple paragraphs → concatenate with whitespace
- Selection includes code blocks → preserve formatting
- Very long selections (>500 chars) → truncate with ellipsis in UI, send full to backend

---

## 3. RAG Architecture

### Decision: Qdrant Cloud + OpenAI text-embedding-3-small

**Rationale**: Cost-effective, modern embeddings with good precision for technical content.

**Chunking Strategy**:
- **Primary chunks**: 512-768 tokens (~2,000-3,000 characters)
- **Overlap**: 64-128 tokens (20%)
- **Special handling**: Code blocks as atomic units, math equations preserved

**Embedding Model Comparison**:

| Model | Dimensions | Cost/1M tokens | Selected |
|-------|-----------|----------------|----------|
| text-embedding-ada-002 | 1,536 | $0.10 | No (deprecated) |
| text-embedding-3-small | 768 | $0.02 | **Yes** |
| text-embedding-3-large | 3,072 | $0.13 | No (overkill) |
| nomic-embed-text (local) | 768 | Free | Fallback only |

**Out-of-Scope Detection**:
Multi-tier approach to achieve SC-008 (100% accuracy):
1. Keyword blacklist (financial, medical, legal topics)
2. Semantic relevance score < 0.5 threshold
3. Module classification mismatch

**Response Template**:
> "I can only answer questions about the textbook content. Your question about '{topic}' is outside my scope. However, the textbook covers these related topics: {suggestions}"

---

## 4. Deployment Architecture

### Decision: Vercel (Frontend) + Railway (Backend)

**Frontend - Vercel**:
- Zero-config Docusaurus deployment
- PR preview URLs for content review
- Global CDN for fast page loads

**Backend - Railway**:
- Full-stack Python support (no serverless limitations)
- Integrated PostgreSQL provisioning
- No cold start issues for RAG latency

**Alternatives Considered**:

| Option | Frontend | Backend | Why Rejected |
|--------|----------|---------|--------------|
| GitHub Pages + Vercel Serverless | GitHub Pages | Vercel | Serverless timeout too short for RAG |
| Vercel + Render | Vercel | Render | Railway has better Python/FastAPI integration |
| All-in-one Railway | Railway | Railway | Vercel better for static sites |

---

## 5. CORS Configuration

### Decision: Environment-aware allow_origins

**Implementation**:
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",          # Local development
    os.getenv("FRONTEND_URL"),        # Production (from Railway env)
]

if os.getenv("ENVIRONMENT") == "development":
    ALLOWED_ORIGINS.append("*")       # Allow any in dev

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

**Security**: Never use `allow_origins=["*"]` with `allow_credentials=True` in production.

---

## 6. Environment Variable Management

### Decision: Railway Secrets + Pydantic Settings

**Architecture**:
```
Local: .env (git-ignored)
Railway: Dashboard → Environment Variables (encrypted)
Vercel: Dashboard → Environment Variables (for API URL only)
```

**Required Variables**:

| Variable | Service | Description |
|----------|---------|-------------|
| OPENAI_API_KEY | Railway | For embeddings |
| QDRANT_API_KEY | Railway | Vector DB access |
| NEON_DATABASE_URL | Railway | PostgreSQL connection |
| FRONTEND_URL | Railway | CORS allowed origin |
| REACT_APP_API_URL | Vercel | Backend endpoint |

**Loading Pattern**:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    qdrant_api_key: str
    neon_database_url: str
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
```

---

## 7. State Management

### Decision: React Context + localStorage (Client) + PostgreSQL (Server)

**Client-Side (Docusaurus)**:
- Session ID generated client-side, stored in localStorage
- Chat history cached locally until synced
- Current chapter extracted from Docusaurus `useLocation()`

**Server-Side (FastAPI + Neon)**:
- Sessions stored in PostgreSQL with 24-hour TTL
- Messages persisted after each exchange
- RAG context (selected text, chapter) included in session metadata

---

## 8. API Contract Summary

**Core Endpoints**:

```
POST /api/v1/chat/message
  Request: { session_id, chapter_id, user_message, selected_text? }
  Response: { session_id, response, sources[], error? }

GET /api/v1/chat/session/{session_id}
  Response: { session_id, created_at, messages[], metadata }

POST /api/v1/embeddings/search
  Request: { query, chapter_id?, top_k }
  Response: { results[{ chapter_id, section, text, distance }] }
```

---

## 9. Technology Stack Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Static Site** | Docusaurus 3.x | Constitution requirement |
| **Frontend Hosting** | Vercel | Best DX, PR previews |
| **Backend Framework** | FastAPI + Uvicorn | Async, Python ecosystem |
| **Backend Hosting** | Railway | Full-stack, no cold starts |
| **Vector Database** | Qdrant Cloud (Free) | Easy Python SDK, free tier |
| **Relational Database** | Neon Serverless Postgres | Constitution requirement |
| **Embeddings** | OpenAI text-embedding-3-small | Cost-effective, modern |
| **LLM** | Claude API (via Anthropic) | Constitution encourages Claude |
| **State Management** | React Context + localStorage | Sufficient for chat widget |

---

## 10. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucination | Trust erosion | Multi-tier OOS detection + source attribution |
| Slow RAG response | Poor UX | Cache frequent queries, optimize chunk retrieval |
| Qdrant free tier limits | Knowledge cutoff | Monitor vector count, upgrade path ready |
| Railway cold starts | Initial delay | Always-on billing if needed |
| CORS misconfiguration | API unreachable | Test preview deployments in CI |

---

## Next Steps

1. **Phase 1**: Create data model and API contracts
2. **Phase 1**: Generate quickstart.md for local development
3. **Phase 2**: Generate task list via `/sp.tasks`
