"""Seed realistic winners and email recipients.

Revision ID: 002_seed_winners_and_recipients
Revises: 001_initial_schema
Create Date: 2026-06-09
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_seed_winners_and_recipients"
down_revision: str | None = "001_initial_schema"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    """Seed realistic winners and P&C email recipients."""

    op.execute(
        """
        INSERT INTO email_recipients (email, name, active, created_by) VALUES
            ('maria.pouponneau@cwseychelles.com', 'Maria Pouponneau', true, 'system'),
            ('jessica.brioche@cwseychelles.com', 'Jessica Brioche', true, 'system'),
            ('pc@cwseychelles.com', 'P&C Team', true, 'system')
        ON CONFLICT (email) DO NOTHING;

        INSERT INTO winners (
            award_type, first_name, last_name, job_title, department,
            subcategory, charter_pillar, company_value, story,
            nominated_by, award_month, award_year, status, created_by
        ) VALUES
            (
                'CHARTER_CHAMPION', 'Marie-Celina', 'Esther',
                'Customer Service Officer', 'Customer Operations',
                'Collaboration Catalyst',
                'Professionalism & Respect',
                'Customer',
                'Marie-Celina consistently goes above and beyond to support her colleagues across teams. When the quarterly reporting deadline was moved forward, she volunteered to help the finance team collate data despite her own workload, ensuring every department met the cut-off with accurate, well-presented figures. Her willingness to step outside her role epitomises the collaborative spirit we value at CWS.',
                'A colleague', 'Jun 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'CHARTER_CHAMPION', 'Andy', 'Vidot',
                'IT Support Engineer', 'Technology',
                'Empathy Anchor',
                'Empathy, Listening & Understanding',
                'Respect',
                'Andy patiently walked our new team member through three weeks of system onboarding, pausing his own sprint work each time a question came up. He never once made the new joiner feel like a burden and created simple video guides so the person could refer back at their own pace. That quiet, patient investment in someone else success is exactly the empathy we want to recognise.',
                'A colleague', 'Jun 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'CHARTER_CHAMPION', 'Jessica', 'Brioche',
                'HR Business Partner', 'People & Culture',
                'Knowledge Sharer',
                'Effective & Transparent Communication',
                'Team',
                'Jessica built and maintains a cross-department knowledge base that has become the go-to reference for onboarding, policy updates, and process changes. She runs monthly lunch-and-learn sessions and always makes time to explain the broader context, not just the what but the why. Her dedication to transparent communication has measurably reduced the number of repeated questions across the business.',
                'Maria Pouponneau', 'Jul 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'INSTANT_IMPACT', 'Vania', 'Malbrook',
                'Operations Manager', 'Operations',
                'Service Recovery Excellence',
                'Customer Centricity & Insights Driven',
                'Customer',
                'When a key enterprise client experienced a 90-minute service disruption, Vania personally called the MD within five minutes, provided a rolling update every 15 minutes, and had a root-cause summary on the desk of the client COO within an hour of restoration. The client told us it was the best incident handling they had ever experienced from any service provider. Vania turned a potential reputation hit into a relationship-strengthening moment.',
                'Naadir Hassan', 'Jun 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'INSTANT_IMPACT', 'Stephane', 'Knowles',
                'Senior Network Engineer', 'Technology',
                'Innovative Efficiency',
                'Innovation',
                'Innovation',
                'Stephane automated our recurring network health report generation, cutting what used to take four engineer-hours each week to a fifteen-minute verification check. He documented the scripts thoroughly and trained the team so the knowledge was shared, not siloed. This frees up hundreds of engineer-hours per year without sacrificing the quality of our network monitoring.',
                'A colleague', 'Jul 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'INSTANT_IMPACT', 'Rachel', 'Juliette',
                'Senior Finance Analyst', 'Finance',
                'Integrity Under Pressure',
                'Accountability',
                'Integrity',
                'Rachel flagged an irregularity in a vendor invoice during quarter-end close, a period when the finance team was already under extreme pressure to deliver the board pack. Rather than approving the payment to meet the deadline, she paused the process, escalated through the proper channels, and documented every step. Her integrity saved the business a five-figure overpayment and reinforced the importance of doing the right thing over the fast thing.',
                'A colleague', 'Aug 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'CHARTER_CHAMPION', 'Tania', 'Labonte',
                'Customer Service Manager', 'Customer Operations',
                'Collaboration Catalyst',
                'Proactive Problem Solving, Urgency & Ownership',
                'Accountability',
                'Tania spearheaded a joint initiative between Customer Operations and Technology that reduced average first-response time from 4 hours to 45 minutes over two months. She facilitated weekly syncs, documented friction points, and personally followed up on every action item. Her ability to bring two busy departments together around a shared goal has set a new benchmark for cross-functional collaboration at CWS.',
                'Maria Pouponneau', 'Sep 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'INSTANT_IMPACT', 'Daniella', 'Morel',
                'Marketing Coordinator', 'Marketing',
                'Innovative Efficiency',
                'Continuous Improvement',
                'Innovation',
                'Daniella redesigned the internal campaign request workflow, cutting the average approval cycle from five days to under 24 hours. She interviewed stakeholders in every department to understand pain points and built a simple Microsoft Lists tracker with automated reminders. The new workflow has been adopted across three departments and is saving an estimated 20 person-hours per month.',
                'A colleague', 'Sep 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'CHARTER_CHAMPION', 'Christopher', 'Frederic',
                'Field Technician', 'Technology',
                'Empathy Anchor',
                'Empathy, Listening & Understanding',
                'Respect',
                'Christopher visited an elderly customer home to troubleshoot a broadband fault and spent an extra 45 minutes showing the customer how to use their smart device to stay in touch with family overseas. The customer called the next day to express their gratitude, noting that Christopher kindness and patience had made a real difference to their wellbeing. He represents the human side of our Charter values.',
                'A colleague', 'Oct 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'INSTANT_IMPACT', 'Nathalie', 'Hoareau',
                'Compliance Officer', 'Legal & Compliance',
                'Integrity Under Pressure',
                'Accountability',
                'Integrity',
                'Nathalie identified a potential compliance gap in a new product launch during the final review stage. Despite pressure from stakeholders to proceed, she escalated her concerns to the board committee and recommended a two-week delay to resolve the issue. Her thoroughness prevented what could have been a regulatory exposure and reinforced the culture of accountability we are building.',
                'A colleague', 'Oct 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'INSTANT_IMPACT', 'James', 'Moustache',
                'Sales Executive', 'Sales',
                'Service Recovery Excellence',
                'Customer Centricity & Insights Driven',
                'Customer',
                'When a contract renewal was delayed due to an internal paperwork error, James personally drove to the client office with a printed corrected contract, apologised in person, and included a handwritten note from the CEO. The client not only renewed but expanded their commitment by 20%. James turned an administrative failure into a commercial win through sheer ownership and resourcefulness.',
                'Naadir Hassan', 'Nov 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            ),
            (
                'CHARTER_CHAMPION', 'Sandra', 'Agricole',
                'Learning & Development Lead', 'People & Culture',
                'Knowledge Sharer',
                'Continuous Improvement',
                'Team',
                'Sandra launched the CWS Skills Exchange programme, where team members volunteer to teach short sessions on their expertise areas. Fifteen sessions have been delivered so far, covering everything from Excel macros to presentation skills. Sandra personally mentors each volunteer presenter to build their confidence. The programme has been praised in the staff engagement survey as one of the most valuable learning initiatives this year.',
                'Jessica Brioche', 'Nov 2026', 2026, 'PUBLISHED', 'admin@cwseychelles.com'
            )
        ON CONFLICT DO NOTHING;
        """
    )


def downgrade() -> None:
    """Remove seeded winners and email recipients."""

    op.execute(
        """
        DELETE FROM email_recipients WHERE created_by = 'system';
        DELETE FROM winners WHERE created_by = 'admin@cwseychelles.com';
        """
    )
