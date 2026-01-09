#!/usr/bin/env python3
"""
Content embedding script for Physical AI Textbook.

This script reads Markdown content from the frontend/docs directory,
chunks it appropriately, generates embeddings, and stores them in Qdrant.

Usage:
    python scripts/embed_content.py --content-dir ../frontend/docs
    python scripts/embed_content.py --content-dir ../frontend/docs --dry-run
"""
import argparse
import hashlib
import json
import re
import sys
import uuid
from pathlib import Path
from typing import Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.config import get_settings
from app.services.embeddings import get_embeddings_service


def parse_frontmatter(content: str) -> tuple[dict[str, Any], str]:
    """Extract YAML frontmatter from Markdown content."""
    if not content.startswith("---"):
        return {}, content

    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content

    import yaml

    try:
        frontmatter = yaml.safe_load(parts[1])
    except yaml.YAMLError:
        frontmatter = {}

    body = parts[2].strip()
    return frontmatter or {}, body


def extract_headings(content: str) -> list[tuple[int, str, int]]:
    """Extract heading hierarchy from Markdown."""
    headings = []
    for i, line in enumerate(content.split("\n")):
        match = re.match(r"^(#{1,6})\s+(.+)$", line)
        if match:
            level = len(match.group(1))
            text = match.group(2).strip()
            headings.append((level, text, i))
    return headings


def chunk_content(
    content: str,
    chunk_size: int = 512,
    overlap: int = 64,
) -> list[dict[str, Any]]:
    """
    Chunk Markdown content for embedding.

    Rules:
    - Text chunks: 512-768 tokens with overlap
    - Code blocks: Keep atomic (never split)
    - Math equations: Keep atomic with context
    """
    chunks = []
    current_chunk = []
    current_tokens = 0
    current_heading_path = []

    # Simple tokenization (approximate)
    def count_tokens(text: str) -> int:
        return len(text.split())

    lines = content.split("\n")
    in_code_block = False
    code_block_content = []

    for i, line in enumerate(lines):
        # Track code blocks
        if line.startswith("```"):
            if in_code_block:
                # End of code block - save as atomic chunk
                code_content = "\n".join(code_block_content)
                if code_content.strip():
                    chunks.append({
                        "content": code_content,
                        "chunk_type": "code",
                        "heading_path": list(current_heading_path),
                        "position": len(chunks),
                    })
                code_block_content = []
                in_code_block = False
            else:
                # Start of code block - save current text chunk first
                if current_chunk:
                    chunks.append({
                        "content": "\n".join(current_chunk),
                        "chunk_type": "text",
                        "heading_path": list(current_heading_path),
                        "position": len(chunks),
                    })
                    current_chunk = []
                    current_tokens = 0
                in_code_block = True
            continue

        if in_code_block:
            code_block_content.append(line)
            continue

        # Track headings
        heading_match = re.match(r"^(#{1,6})\s+(.+)$", line)
        if heading_match:
            level = len(heading_match.group(1))
            text = heading_match.group(2).strip()

            # Trim heading path to current level
            current_heading_path = current_heading_path[: level - 1]
            current_heading_path.append(text)

            # Save current chunk before new section
            if current_chunk:
                chunks.append({
                    "content": "\n".join(current_chunk),
                    "chunk_type": "text",
                    "heading_path": list(current_heading_path[:-1]),
                    "position": len(chunks),
                })
                current_chunk = []
                current_tokens = 0

        # Add line to current chunk
        line_tokens = count_tokens(line)

        if current_tokens + line_tokens > chunk_size and current_chunk:
            # Save chunk with overlap
            chunks.append({
                "content": "\n".join(current_chunk),
                "chunk_type": "text",
                "heading_path": list(current_heading_path),
                "position": len(chunks),
            })

            # Keep last N tokens for overlap
            overlap_lines = []
            overlap_tokens = 0
            for prev_line in reversed(current_chunk):
                prev_tokens = count_tokens(prev_line)
                if overlap_tokens + prev_tokens > overlap:
                    break
                overlap_lines.insert(0, prev_line)
                overlap_tokens += prev_tokens

            current_chunk = overlap_lines
            current_tokens = overlap_tokens

        current_chunk.append(line)
        current_tokens += line_tokens

    # Save final chunk
    if current_chunk:
        chunks.append({
            "content": "\n".join(current_chunk),
            "chunk_type": "text",
            "heading_path": list(current_heading_path),
            "position": len(chunks),
        })

    return chunks


def process_markdown_file(file_path: Path, module_id: str) -> list[dict[str, Any]]:
    """Process a single Markdown file into chunks."""
    content = file_path.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(content)

    chapter_id = f"ch-{file_path.stem}"
    chunks = chunk_content(body)

    # Enrich chunks with metadata
    for chunk in chunks:
        chunk["chapter_id"] = chapter_id
        chunk["module_id"] = module_id
        chunk["file_path"] = str(file_path)
        chunk["hardware_requirements"] = frontmatter.get("hardware_requirements")
        chunk["resource_type"] = frontmatter.get("resource_type")
        chunk["id"] = f"cb-{uuid.uuid4().hex[:12]}"

    return chunks


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Embed textbook content to Qdrant")
    parser.add_argument(
        "--content-dir",
        type=Path,
        required=True,
        help="Path to frontend/docs directory",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Process files without uploading to Qdrant",
    )
    parser.add_argument(
        "--collection",
        type=str,
        default="textbook_chunks",
        help="Qdrant collection name",
    )
    args = parser.parse_args()

    if not args.content_dir.exists():
        print(f"Error: Content directory not found: {args.content_dir}")
        sys.exit(1)

    settings = get_settings()

    # Initialize services
    if not args.dry_run:
        qdrant = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
        embeddings = get_embeddings_service()

        # Create collection if needed
        collections = [c.name for c in qdrant.get_collections().collections]
        if args.collection not in collections:
            qdrant.create_collection(
                collection_name=args.collection,
                vectors_config=VectorParams(
                    size=settings.embedding_dimensions,
                    distance=Distance.COSINE,
                ),
            )
            print(f"Created collection: {args.collection}")

    # Process all modules
    all_chunks = []
    for module_dir in sorted(args.content_dir.glob("mod-*")):
        if not module_dir.is_dir():
            continue

        module_id = module_dir.name
        print(f"Processing module: {module_id}")

        for md_file in module_dir.glob("*.md"):
            print(f"  Processing: {md_file.name}")
            chunks = process_markdown_file(md_file, module_id)
            all_chunks.extend(chunks)
            print(f"    Generated {len(chunks)} chunks")

    print(f"\nTotal chunks: {len(all_chunks)}")

    if args.dry_run:
        print("\n[Dry run] Would upload chunks to Qdrant")
        # Print sample chunk
        if all_chunks:
            print("\nSample chunk:")
            print(json.dumps(all_chunks[0], indent=2, default=str))
        return

    # Generate embeddings and upload
    print("\nGenerating embeddings...")
    batch_size = 50
    points = []

    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i : i + batch_size]
        texts = [c["content"] for c in batch]
        embeddings_batch = embeddings.embed_batch(texts)

        for chunk, embedding in zip(batch, embeddings_batch):
            points.append(
                PointStruct(
                    id=chunk["id"],
                    vector=embedding,
                    payload={
                        "chapter_id": chunk["chapter_id"],
                        "module_id": chunk["module_id"],
                        "section": " > ".join(chunk["heading_path"]),
                        "heading_path": chunk["heading_path"],
                        "chunk_type": chunk["chunk_type"],
                        "position": chunk["position"],
                        "hardware_tag": chunk.get("hardware_requirements"),
                        "content": chunk["content"],
                    },
                )
            )

        print(f"  Processed {min(i + batch_size, len(all_chunks))}/{len(all_chunks)}")

    # Upload to Qdrant
    print(f"\nUploading {len(points)} points to Qdrant...")
    qdrant.upsert(collection_name=args.collection, points=points)
    print("Done!")


if __name__ == "__main__":
    main()
