"""Create pickup_codes table

Revision ID: 6c48dc8f1e30
Revises: 5044685dba9b
Create Date: 2026-03-02 15:46:33.517901

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6c48dc8f1e30'
down_revision = '5044685dba9b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create pickup_codes table
    op.create_table(
        'pickup_codes',
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('entity_type', sa.String(20), nullable=False),
        sa.Column('entity_id', sa.Integer, nullable=False),
        sa.Column('provider_id', sa.Integer, nullable=False),
        sa.Column('receiver_id', sa.Integer, nullable=False),
        sa.Column('expires_at', sa.DateTime, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('revoked_at', sa.DateTime, nullable=True),
        sa.Column('metadata_json', sa.Text, nullable=True),
        sa.PrimaryKeyConstraint('code')
    )
    # Create indexes for performance
    op.create_index('ix_pickup_codes_entity', 'pickup_codes', ['entity_type', 'entity_id'])
    op.create_index('ix_pickup_codes_expires', 'pickup_codes', ['expires_at'])
    op.create_index('ix_pickup_codes_provider', 'pickup_codes', ['provider_id'])
    op.create_index('ix_pickup_codes_receiver', 'pickup_codes', ['receiver_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_pickup_codes_receiver', table_name='pickup_codes')
    op.drop_index('ix_pickup_codes_provider', table_name='pickup_codes')
    op.drop_index('ix_pickup_codes_expires', table_name='pickup_codes')
    op.drop_index('ix_pickup_codes_entity', table_name='pickup_codes')
    # Drop table
    op.drop_table('pickup_codes')
