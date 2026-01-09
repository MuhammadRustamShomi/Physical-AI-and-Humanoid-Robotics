#!/usr/bin/env python3
"""
Database initialization script.

This script creates the database schema for the Physical AI Textbook backend.
Run this script once to set up the initial database structure.

Usage:
    python scripts/init_db.py
    python scripts/init_db.py --drop  # Drop and recreate tables
"""
import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from app.config import get_settings

# SQL Schema from data-model.md
SCHEMA_SQL = """
-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    "order" INTEGER NOT NULL CHECK ("order" BETWEEN 1 AND 6),
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
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
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    metadata JSONB
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
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
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chapters_module ON chapters(module_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON chat_sessions(expires_at);
"""

DROP_SQL = """
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
"""

SEED_MODULES_SQL = """
INSERT INTO modules (id, title, slug, description, "order", icon) VALUES
    ('mod-1', 'Physical AI Foundations', 'mod-1-physical-ai', 'Core concepts of embodied intelligence', 1, 'brain'),
    ('mod-2', 'ROS 2 Nervous System', 'mod-2-ros2', 'Robotics middleware architecture', 2, 'network'),
    ('mod-3', 'Digital Twins (Gazebo & Unity)', 'mod-3-digital-twins', 'Simulation environments', 3, 'cube'),
    ('mod-4', 'NVIDIA Isaac Platform', 'mod-4-isaac', 'Industrial-grade simulation and training', 4, 'gpu'),
    ('mod-5', 'Vision-Language-Action', 'mod-5-vla', 'Multimodal AI for robotics', 5, 'eye'),
    ('mod-6', 'Conversational Humanoid Capstone', 'mod-6-capstone', 'Integration project', 6, 'robot')
ON CONFLICT (id) DO NOTHING;
"""


def main():
    parser = argparse.ArgumentParser(description="Initialize database schema")
    parser.add_argument(
        "--drop",
        action="store_true",
        help="Drop existing tables before creating",
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Seed initial module data",
    )
    args = parser.parse_args()

    settings = get_settings()

    print(f"Connecting to database...")
    conn = psycopg2.connect(settings.neon_database_url)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    try:
        if args.drop:
            print("Dropping existing tables...")
            cursor.execute(DROP_SQL)
            print("Tables dropped.")

        print("Creating schema...")
        cursor.execute(SCHEMA_SQL)
        print("Schema created successfully.")

        if args.seed:
            print("Seeding module data...")
            cursor.execute(SEED_MODULES_SQL)
            print("Modules seeded.")

        # Verify tables exist
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print(f"\nTables in database: {[t[0] for t in tables]}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

    print("\nDatabase initialization complete!")


if __name__ == "__main__":
    main()
