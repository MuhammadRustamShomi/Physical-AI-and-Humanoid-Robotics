# Data Model: Textbook Platform

**Feature**: 001-textbook-platform
**Date**: 2026-01-08

## Entity Relationship Overview

```
Module (6 total)
  │
  └──< Chapter (multiple per module)
         │
         ├──< ContentBlock (text, code, math, diagram)
         │
         └──< ChatSession (reader conversations)
                │
                └──< Message (user/assistant exchanges)
```

---

## Entities

### 1. Module

Represents a curriculum unit (6 total per constitution).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, format: `mod-{number}` | Unique identifier |
| title | string | required, max 100 chars | Display name |
| slug | string | unique, url-safe | URL path segment |
| description | text | required | Module overview |
| order | integer | required, 1-6 | Curriculum sequence |
| icon | string | optional | Icon identifier for UI |

**Predefined Values** (from constitution):
1. `mod-1`: Physical AI Foundations
2. `mod-2`: ROS 2 Nervous System
3. `mod-3`: Digital Twins (Gazebo & Unity)
4. `mod-4`: NVIDIA Isaac Platform
5. `mod-5`: Vision-Language-Action
6. `mod-6`: Conversational Humanoid Capstone

---

### 2. Chapter

A unit of content within a module.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, format: `ch-{module}-{number}` | Unique identifier |
| module_id | string | FK → Module.id | Parent module |
| title | string | required, max 200 chars | Chapter title |
| slug | string | unique within module | URL path segment |
| content_path | string | required | Path to Markdown file |
| order | integer | required | Order within module |
| hardware_requirements | text | optional | GPU, RAM, storage needs (FR-011) |
| resource_type | enum | `cloud`, `on-prem`, `both`, `none` | Deployment model (FR-012) |
| estimated_time | integer | optional | Minutes to complete |
| status | enum | `published`, `draft`, `coming_soon` | Publication state |

**Validation Rules**:
- `hardware_requirements` must be explicit if chapter involves simulation/training
- `resource_type` must be set for chapters with exercises

---

### 3. ContentBlock

A semantic chunk of chapter content for RAG retrieval.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, format: `cb-{uuid}` | Unique identifier |
| chapter_id | string | FK → Chapter.id | Parent chapter |
| content | text | required | Chunk text content |
| chunk_type | enum | `text`, `code`, `math`, `diagram`, `table` | Content type |
| heading_path | string[] | required | Hierarchy: [h1, h2, h3...] |
| position | integer | required | Order within chapter |
| embedding_id | string | optional | Qdrant point ID |
| token_count | integer | computed | Approximate token count |

**Chunk Size Rules**:
- Text: 512-768 tokens with 64-token overlap
- Code: Keep atomic (do not split)
- Math: Keep atomic with surrounding context

---

### 4. ChatSession

A conversation context between reader and RAG chatbot.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, format: `sess-{uuid}` | Unique identifier |
| created_at | timestamp | required | Session start time |
| updated_at | timestamp | required | Last activity time |
| expires_at | timestamp | required | TTL (24 hours from last update) |
| metadata | jsonb | optional | Additional context |

**Metadata Schema**:
```json
{
  "initial_chapter_id": "ch-2-3",
  "user_agent": "Mozilla/5.0...",
  "referrer": "https://..."
}
```

---

### 5. Message

A single exchange in a chat session.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK, format: `msg-{uuid}` | Unique identifier |
| session_id | string | FK → ChatSession.id | Parent session |
| role | enum | `user`, `assistant` | Message author |
| content | text | required | Message text |
| created_at | timestamp | required | Message timestamp |
| chapter_id | string | FK → Chapter.id, optional | Context chapter |
| selected_text | text | optional | Highlighted text (FR-007) |
| sources | jsonb | optional | RAG source citations |

**Sources Schema** (for assistant messages):
```json
{
  "sources": [
    {
      "chunk_id": "cb-abc123",
      "chapter_id": "ch-2-3",
      "section": "2.3.1 ROS 2 Topics",
      "excerpt": "Topics use publish-subscribe...",
      "relevance_score": 0.87
    }
  ]
}
```

---

### 6. SearchIndex

Derived entity for full-text search (Docusaurus built-in).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | PK | Auto-generated |
| chapter_id | string | FK → Chapter.id | Source chapter |
| title | string | indexed | Searchable title |
| content | text | indexed | Searchable content |
| url | string | required | Navigation target |
| section | string | optional | Subsection heading |

**Note**: Docusaurus generates this automatically via `@docusaurus/preset-classic` search plugin.

---

## State Transitions

### ChatSession Lifecycle

```
Created → Active → Expired → Deleted
  │         │         │
  │         │         └── After 30 days, purge from DB
  │         │
  │         └── After 24 hours of inactivity
  │
  └── On first message from client
```

### Chapter Status

```
Draft → Coming Soon → Published
  │         │            │
  │         │            └── Visible to all readers
  │         │
  │         └── Placeholder shown, ETA displayed
  │
  └── Internal only, not rendered
```

---

## Database Schema (PostgreSQL/Neon)

```sql
-- Modules table
CREATE TABLE modules (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    "order" INTEGER NOT NULL CHECK ("order" BETWEEN 1 AND 6),
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chapters table
CREATE TABLE chapters (
    id VARCHAR(30) PRIMARY KEY,
    module_id VARCHAR(20) REFERENCES modules(id),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    content_path VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL,
    hardware_requirements TEXT,
    resource_type VARCHAR(20) CHECK (resource_type IN ('cloud', 'on-prem', 'both', 'none')),
    estimated_time INTEGER,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'coming_soon')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, slug)
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    metadata JSONB
);

-- Messages table
CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    chapter_id VARCHAR(30) REFERENCES chapters(id),
    selected_text TEXT,
    sources JSONB
);

-- Indexes
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_chapters_module ON chapters(module_id);
CREATE INDEX idx_sessions_expires ON chat_sessions(expires_at);
```

---

## Qdrant Vector Schema

**Collection**: `textbook_chunks`

```python
{
    "name": "textbook_chunks",
    "vectors": {
        "size": 768,  # text-embedding-3-small
        "distance": "Cosine"
    },
    "payload_schema": {
        "chapter_id": "keyword",
        "module_id": "keyword",
        "section": "text",
        "heading_path": "text",
        "chunk_type": "keyword",
        "position": "integer",
        "hardware_tag": "keyword",
        "content": "text"
    }
}
```

---

## Notes

- Content blocks are derived from Markdown during build, not stored in PostgreSQL
- Qdrant stores vector embeddings with metadata for RAG retrieval
- PostgreSQL stores session state and relational data only
- Docusaurus handles content rendering directly from Markdown files
