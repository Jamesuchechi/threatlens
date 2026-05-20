"""create_initial_tables

Revision ID: 1b2dfd1cef68
Revises: 
Create Date: 2026-05-19 10:18:02.290347

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b2dfd1cef68'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable uuid-ossp extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Create users table
    op.execute("""
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        name TEXT NOT NULL,
        industry TEXT NOT NULL,
        tech_stack TEXT[] DEFAULT '{}',
        alert_email_enabled BOOLEAN DEFAULT TRUE,
        alert_webhook_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
    )
    """)

    # Create threats table
    op.execute("""
    CREATE TABLE threats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source TEXT NOT NULL,
        source_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        published_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        ingested_at TIMESTAMPTZ DEFAULT NOW(),
        cvss_score FLOAT,
        cvss_vector TEXT,
        cwe_ids TEXT[] DEFAULT '{}',
        affected_products TEXT[] DEFAULT '{}',
        patch_available BOOLEAN DEFAULT FALSE,
        patch_url TEXT,
        ai_summary TEXT,
        ai_recommendations TEXT[] DEFAULT '{}',
        ai_industries TEXT[] DEFAULT '{}',
        ai_risk_score FLOAT,
        ai_processed_at TIMESTAMPTZ,
        severity TEXT GENERATED ALWAYS AS (
            CASE
                WHEN ai_risk_score >= 9.0 THEN 'critical'
                WHEN ai_risk_score >= 7.0 THEN 'high'
                WHEN ai_risk_score >= 4.0 THEN 'medium'
                ELSE 'low'
            END
        ) STORED,
        is_actively_exploited BOOLEAN DEFAULT FALSE,
        UNIQUE(source, source_id)
    )
    """)

    # Create alerts table
    op.execute("""
    CREATE TABLE alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        threat_id UUID NOT NULL REFERENCES threats(id) ON DELETE CASCADE,
        triggered_at TIMESTAMPTZ DEFAULT NOW(),
        reason TEXT NOT NULL,
        delivered BOOLEAN DEFAULT FALSE,
        delivered_at TIMESTAMPTZ
    )
    """)

    # Create indexes
    op.execute("CREATE INDEX idx_threats_severity ON threats(severity)")
    op.execute("CREATE INDEX idx_threats_published_at ON threats(published_at DESC)")
    op.execute("CREATE INDEX idx_threats_ai_risk_score ON threats(ai_risk_score DESC)")
    op.execute("CREATE INDEX idx_threats_is_exploited ON threats(is_actively_exploited) WHERE is_actively_exploited = TRUE")
    op.execute("CREATE INDEX idx_alerts_user_id ON alerts(user_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_alerts_user_id")
    op.execute("DROP INDEX IF EXISTS idx_threats_is_exploited")
    op.execute("DROP INDEX IF EXISTS idx_threats_ai_risk_score")
    op.execute("DROP INDEX IF EXISTS idx_threats_published_at")
    op.execute("DROP INDEX IF EXISTS idx_threats_severity")
    op.execute("DROP TABLE IF EXISTS alerts")
    op.execute("DROP TABLE IF EXISTS threats")
    op.execute("DROP TABLE IF EXISTS users")
