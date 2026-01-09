# Physical AI & Humanoid Robotics Textbook Platform

An AI-native interactive textbook for learning Physical AI and Humanoid Robotics, featuring a RAG-powered chatbot that answers questions strictly from textbook content.

## Features

- **6-Module Curriculum**: Structured learning path from Physical AI Foundations to Conversational Humanoid Capstone
- **RAG Chatbot**: Ask questions about any content with AI-powered answers grounded in textbook material
- **Text Selection Context**: Highlight text and ask "Explain this" for contextual help
- **Full-Text Search**: Find any topic across all chapters instantly
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Code Syntax Highlighting**: Python, C++, YAML, and Bash with copy button
- **Math Notation**: KaTeX rendering for equations and formulas

## Curriculum Modules

1. **Physical AI Foundations** - Core concepts of embodied intelligence
2. **ROS 2 Nervous System** - Robotics middleware architecture
3. **Digital Twins (Gazebo & Unity)** - Simulation environments
4. **NVIDIA Isaac Platform** - Industrial-grade simulation and training
5. **Vision-Language-Action** - Multimodal AI for robotics
6. **Conversational Humanoid Capstone** - Integration project

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Docusaurus 3.x, React |
| Backend | FastAPI, Python 3.11+ |
| Vector DB | Qdrant Cloud |
| Database | Neon PostgreSQL |
| Embeddings | OpenAI text-embedding-3-small |
| LLM | OpenAI GPT-4 / Anthropic Claude |
| Deployment | Vercel (frontend), Railway (backend) |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- API keys: OpenAI, Qdrant Cloud, Neon

### Frontend

```bash
cd frontend
npm install
npm run start
```

Site available at `http://localhost:3000`

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Edit with your API keys
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`

### Environment Variables

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-your-openai-key
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_URL=https://your-cluster.qdrant.tech
NEON_DATABASE_URL=postgresql://user:pass@host/dbname
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

### Initialize Database & Embeddings

```bash
# Initialize database schema
python scripts/init_db.py --seed

# Embed textbook content for RAG
python scripts/embed_content.py --input ../frontend/docs --collection textbook_chunks
```

## Project Structure

```
Physical-AI-and-Humanoid-Robotics/
├── frontend/                    # Docusaurus site
│   ├── docs/                    # Textbook content (Markdown)
│   │   ├── mod-1-physical-ai/
│   │   ├── mod-2-ros2/
│   │   ├── mod-3-digital-twins/
│   │   ├── mod-4-isaac/
│   │   ├── mod-5-vla/
│   │   └── mod-6-capstone/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ChatWidget/      # RAG chatbot UI
│   │   │   ├── HardwareRequirements/
│   │   │   └── ResourceType/
│   │   ├── contexts/            # React context (ChatContext)
│   │   ├── hooks/               # Custom hooks (useChat)
│   │   └── css/                 # Custom styles
│   ├── docusaurus.config.js
│   └── sidebars.js
├── backend/                     # FastAPI service
│   ├── app/
│   │   ├── api/                 # API routes (health, chat)
│   │   ├── models/              # Pydantic models
│   │   ├── services/            # Business logic (RAG, embeddings)
│   │   └── config/              # Settings
│   ├── scripts/                 # CLI tools
│   │   ├── embed_content.py     # Embed docs to Qdrant
│   │   └── init_db.py           # Database migrations
│   └── main.py                  # FastAPI app entry
├── specs/                       # Feature specifications
│   └── 001-textbook-platform/
│       ├── spec.md              # Requirements
│       ├── plan.md              # Architecture
│       ├── tasks.md             # Implementation tasks
│       ├── data-model.md        # Entity schemas
│       └── contracts/           # API contracts
└── .specify/                    # SpecKit Plus templates
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check with service status |
| POST | `/api/v1/chat/message` | Send message to RAG chatbot |
| GET | `/api/v1/chat/session/{id}` | Retrieve chat session history |

### Chat API Example

```bash
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-001",
    "chapter_id": "ch-1-1",
    "user_message": "What is embodied intelligence?"
  }'
```

## Development

### Adding New Chapters

1. Create Markdown file in `frontend/docs/mod-X/chapter-name.md`
2. Update `frontend/sidebars.js` to include the chapter
3. Re-run embedding script:
   ```bash
   python scripts/embed_content.py --incremental
   ```

### Running Tests

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && pytest
```

## Documentation

- [Feature Specification](specs/001-textbook-platform/spec.md)
- [Architecture Plan](specs/001-textbook-platform/plan.md)
- [Implementation Tasks](specs/001-textbook-platform/tasks.md)
- [Data Model](specs/001-textbook-platform/data-model.md)
- [Quickstart Guide](specs/001-textbook-platform/quickstart.md)

## License

Copyright 2026 Physical AI & Humanoid Robotics. All rights reserved.
