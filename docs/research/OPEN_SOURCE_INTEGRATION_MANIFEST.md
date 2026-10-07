# ENJAZ Open-Source Integration Manifest

This branch records reusable open-source material selected for ENJAZ.

## Imported

### Agent-Studio
Repository: https://github.com/devhimanshuu/Agent-Studio
License: MIT (stated by the repository README)

Imported:
- LiveAgentCanvasDemo
- NeuralPatterns
- PixelGridWave
- Reveal

Reason:
- React 19 compatible
- self-contained components
- works with ENJAZ's existing React/Vite/Tailwind stack
- provides live execution/agent-graph presentation and motion without replacing the ENJAZ backend

### OpenHire
Repository: https://github.com/pzy2000/OpenHire
License: MIT

Imported:
- excellent-employee skill
- memory skill
- skill-creator skill

Reason:
- strengthens the Digital Employee / Skills layer
- complements ENJAZ's existing workforce and skill architecture
- does not introduce a second agent runtime

### Markus
Repository: https://github.com/markus-global/markus
License: Apache-2.0

Imported:
- Masonry
- TabScrollRail
- Apache-2.0 license notice

Reason:
- reusable enterprise asset/layout presentation patterns
- React-compatible and dependency-light components

## Evaluated but intentionally not transplanted as runtime code

### Microsoft Sico
Repository: https://github.com/microsoft/Sico
License: MIT

Strong references:
- Digital Worker runtime
- skills as first-class executable capabilities
- sandboxed execution
- experience learning / playbooks
- operator and execution tracing

Not copied wholesale because its Go + Python + gRPC runtime would create a second backend architecture beside ENJAZ's existing Node/Supabase runtime.

### Boundflow
Repository: https://github.com/boundflow/boundflow
License: Apache-2.0

Strong references:
- governed workflow execution
- policy gates
- approval lifecycle
- audit events
- durable scheduling

Not copied wholesale because ENJAZ already contains its own tenant-safe execution graph, approvals, audit, queues and Supabase migrations; transplanting a second control plane would be architectural duplication.

### CrewMeld
Repository: https://github.com/proinsight-io/crewmeld

Not transplanted wholesale because its modified Apache-style licensing contains additional commercial/SaaS restrictions that require legal review before using it as an ENJAZ SaaS base.

### Suna
Repository: https://github.com/kortix-ai/suna

Not transplanted because its Elastic License 2.0 contains hosted-service restrictions incompatible with using it as the direct base of ENJAZ.

## Integration rule

ENJAZ remains the system of record:
- Auth remains ENJAZ/Supabase
- Workspace and tenancy remain ENJAZ
- API/runtime remain ENJAZ
- Existing approvals, audit, execution graph and integrations remain ENJAZ

Imported components are reusable building blocks, not a replacement platform.
