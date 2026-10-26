# Vendored AI workforce sources

This directory keeps upstream projects inside the ENJAZ monorepository without overwriting ENJAZ application files.

- `paperclip/`: Paperclip source snapshot, upstream commit `a1f77821b9cd5c9c846fdf7a0fa5cc620ad2b6bb`.
- `paperclip-companies/`: Paperclip Companies templates, upstream commit `514503bf4f0ca88ebf16d5dc648e085d587f268f`.

These are vendored source snapshots, not yet a runtime integration. ENJAZ's root app, database schema, authentication, tenant isolation, deployment, and dependency graph have not been rewired to run Paperclip. Validate upstream licenses and third-party notices before commercial redistribution. Update each snapshot deliberately and review its changes before upgrading.
