# Quickstart: Textbook Platform

**Feature**: 001-textbook-platform
**Prerequisites**: Node.js 18+, Python 3.11+, Docker (optional)

## 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/Physical-AI-and-Humanoid-Robotics.git
cd Physical-AI-and-Humanoid-Robotics

# Checkout feature branch
git checkout 001-textbook-platform
```

## 2. Frontend Setup (Docusaurus)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run start
```

**Expected output**: Site available at `http://localhost:3000`

### Verify Frontend

- [ ] Homepage shows 6-module curriculum structure
- [ ] Click on any chapter → content renders with syntax highlighting
- [ ] Search modal opens with `Ctrl+K` / `Cmd+K`
- [ ] Chat widget visible in bottom-right corner

---

## 3. Backend Setup (FastAPI)

### Option A: Local Python Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your API keys (see below)

# Start development server
uvicorn main:app --reload --port 8000
```

### Option B: Docker

```bash
# Build and run
docker compose up backend
```

**Expected output**: API available at `http://localhost:8000`

### Verify Backend

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Expected response:
# {"status": "healthy", "qdrant": "connected", "database": "connected"}
```

---

## 4. Environment Variables

Create `.env` file in `backend/` directory:

```env
# Required for RAG chatbot
OPENAI_API_KEY=sk-your-openai-key

# Qdrant Cloud (Free Tier)
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_URL=https://your-cluster.qdrant.tech

# Neon PostgreSQL
NEON_DATABASE_URL=postgresql://user:pass@host/dbname

# CORS
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

### Getting API Keys

| Service | Sign Up | Free Tier |
|---------|---------|-----------|
| OpenAI | [platform.openai.com](https://platform.openai.com) | $5 credit for new accounts |
| Qdrant Cloud | [cloud.qdrant.io](https://cloud.qdrant.io) | 1M vectors free |
| Neon | [neon.tech](https://neon.tech) | 3GB storage free |

---

## 5. Seed Vector Database

Before the chatbot works, you need to embed textbook content:

```bash
# From backend directory
python scripts/embed_content.py --input ../frontend/docs --collection textbook_chunks

# Expected output:
# Embedded 1,247 chunks from 42 documents
# Collection: textbook_chunks (1,247 vectors)
```

---

## 6. Test End-to-End

### Test Chat API

```bash
# Send a question
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-001",
    "chapter_id": "ch-1-1",
    "user_message": "What is embodied intelligence?"
  }'

# Expected: JSON response with answer + sources
```

### Test Selected Text Context

```bash
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-001",
    "chapter_id": "ch-2-3",
    "user_message": "Explain this in more detail",
    "selected_text": "ROS 2 topics use publish-subscribe pattern"
  }'
```

### Test Out-of-Scope Detection

```bash
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-001",
    "chapter_id": "ch-1-1",
    "user_message": "What is the stock price of Tesla?"
  }'

# Expected: is_out_of_scope: true with suggested_topics
```

---

## 7. Common Issues

### CORS Errors

**Symptom**: Browser console shows `Access-Control-Allow-Origin` errors

**Solution**: Ensure `FRONTEND_URL` in `.env` matches your frontend URL exactly:
```env
FRONTEND_URL=http://localhost:3000  # Not http://127.0.0.1:3000
```

### Qdrant Connection Failed

**Symptom**: Health check shows `qdrant: "disconnected"`

**Solution**: Verify Qdrant URL and API key in `.env`. Test connection:
```bash
curl -H "api-key: $QDRANT_API_KEY" "$QDRANT_URL/collections"
```

### Empty Chat Responses

**Symptom**: Chatbot returns empty or generic responses

**Solution**: Run the embedding script first (Step 5). Verify vectors exist:
```bash
curl -H "api-key: $QDRANT_API_KEY" "$QDRANT_URL/collections/textbook_chunks"
# Should show vectors_count > 0
```

---

## 8. Development Workflow

### Frontend Changes

```bash
# Edit files in frontend/docs/ (Markdown chapters)
# Edit files in frontend/src/ (React components)
# Hot reload active - changes appear immediately
```

### Backend Changes

```bash
# Edit files in backend/
# uvicorn --reload handles hot reload
```

### Adding New Chapters

1. Create Markdown file in `frontend/docs/module-X/chapter-Y.md`
2. Update `frontend/sidebars.js` to include new chapter
3. Re-run embedding script to update vector database:
   ```bash
   python scripts/embed_content.py --incremental
   ```

---

## 9. Running Tests

### Frontend

```bash
cd frontend
npm run test        # Unit tests
npm run build       # Build validation
```

### Backend

```bash
cd backend
pytest              # All tests
pytest -k chat      # Chat-related tests only
pytest --cov        # With coverage report
```

---

## 10. Next Steps

- [ ] Review `specs/001-textbook-platform/spec.md` for requirements
- [ ] Review `specs/001-textbook-platform/data-model.md` for entity structure
- [ ] Review `specs/001-textbook-platform/contracts/chat-api.yaml` for API contract
- [ ] Run `/sp.tasks` to generate implementation task list
