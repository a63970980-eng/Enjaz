-- Production migration baseline marker.
-- Production currently contains the complete historical migration chain through
-- 20260926135518_optimize_commerce_rls_and_lock_admin_bootstrap.
-- This marker is intentionally non-destructive: it documents the reconciliation
-- point without replaying historical DDL against an already-provisioned database.
-- Future schema changes must be added as new forward-only migrations.
select 1;
