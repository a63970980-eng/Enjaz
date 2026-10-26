# Trail of Bits Security

> A prestigious security auditing and verification firm with expertise in smart contract security, cryptographic analysis, binary reverse engineering, and application security testing

> An [Agent Company](https://agentcompanies.io) based on [Trail of Bits Skills](https://github.com/trailofbits/skills) — security-focused skills for static analysis, smart contract auditing, Semgrep rules, binary reverse engineering, and supply chain security

![Org Chart](images/org-chart.png)

## What's Inside

> This is an [Agent Company](https://agentcompanies.io) package from [Paperclip](https://paperclip.ing)

| Content | Count |
|---------|-------|
| Agents | 28 |
| Skills | 35 |

### Agents

| Agent | Role | Reports To |
|-------|------|------------|
| Audit Lead | Engineer | chief-security-officer |
| Binary Analyst | Engineer | reverse-engineering-lead |
| Blockchain Security Lead | Engineer | chief-security-officer |
| Burpsuite Analyst | Engineer | audit-lead |
| CEO | CEO | — |
| Chaos Agent | Engineer | ceo |
| Chief Security Officer | Engineer | ceo |
| Code Auditor | Engineer | audit-lead |
| Constant-Time Analyst | Engineer | verification-lead |
| Contract Entry Point Analyst | Engineer | blockchain-security-lead |
| Culture Analyst | Engineer | ceo |
| Engineering Lead | Engineer | chief-security-officer |
| False Positive Analyst | Engineer | audit-lead |
| Infrastructure Engineer | Engineer | engineering-lead |
| Malware Analyst | Engineer | reverse-engineering-lead |
| Mobile Security Analyst | Engineer | reverse-engineering-lead |
| Property Tester | Engineer | verification-lead |
| Reverse Engineering Lead | Engineer | chief-security-officer |
| Skill Developer | Engineer | engineering-lead |
| Smart Contract Auditor | Engineer | blockchain-security-lead |
| Spec Compliance Analyst | Engineer | verification-lead |
| Static Analysis Engineer | Engineer | audit-lead |
| Supply Chain Auditor | Engineer | audit-lead |
| Testing Specialist | Engineer | audit-lead |
| Tooling Engineer | Engineer | engineering-lead |
| Variant Analyst | Engineer | audit-lead |
| Verification Lead | Engineer | chief-security-officer |
| Zeroize Auditor | Engineer | verification-lead |

### Skills

| Skill | Description | Source |
|-------|-------------|--------|
| agentic-actions-auditor | Audits GitHub Actions workflows for security vulnerabilities in AI agent integrations (Claude Code Action, Gemini CLI, OpenAI Codex, GitHub AI Inference) | [github](https://github.com/trailofbits/skills/blob/main/plugins/agentic-actions-auditor/skills/agentic-actions-auditor/SKILL.md) |
| ask-questions-if-underspecified | Clarify ambiguous requirements by asking questions before implementing. Only when invoked explicitly. | [github](https://github.com/trailofbits/skills/blob/main/plugins/ask-questions-if-underspecified/skills/ask-questions-if-underspecified/SKILL.md) |
| audit-context-building | Build deep architectural context through ultra-granular code analysis before vulnerability hunting | [github](https://github.com/trailofbits/skills/blob/main/plugins/audit-context-building/skills/audit-context-building/SKILL.md) |
| building-secure-contracts | Comprehensive smart contract security toolkit based on Trail of Bits' Building Secure Contracts framework. Includes vulnerability scanners for 6 blockchains and 5 development guideline assistants. | [github](https://github.com/trailofbits/skills/blob/main/plugins/building-secure-contracts/skills/guidelines-advisor/SKILL.md) |
| burpsuite-project-parser | Search and extract data from Burp Suite project files (.burp) for security analysis | [github](https://github.com/trailofbits/skills/blob/main/plugins/burpsuite-project-parser/skills/burpsuite-project-parser/SKILL.md) |
| claude-in-chrome-troubleshooting | Diagnose and fix Claude in Chrome MCP extension connectivity issues | [github](https://github.com/trailofbits/skills/blob/main/plugins/claude-in-chrome-troubleshooting/skills/claude-in-chrome-troubleshooting/SKILL.md) |
| constant-time-analysis | Detect compiler-induced timing side-channels in cryptographic code | [github](https://github.com/trailofbits/skills/blob/main/plugins/constant-time-analysis/skills/constant-time-analysis/SKILL.md) |
| culture-index | Interprets Culture Index survey results for individuals and teams | [github](https://github.com/trailofbits/skills/blob/main/plugins/culture-index/skills/interpreting-culture-index/SKILL.md) |
| debug-buttercup | Debug Buttercup Kubernetes deployments | [github](https://github.com/trailofbits/skills/blob/main/plugins/debug-buttercup/skills/debug-buttercup/SKILL.md) |
| devcontainer-setup | Create pre-configured devcontainers with Claude Code and language-specific tooling | [github](https://github.com/trailofbits/skills/blob/main/plugins/devcontainer-setup/skills/devcontainer-setup/SKILL.md) |
| differential-review | Security-focused differential review of code changes with git history analysis and blast radius estimation | [github](https://github.com/trailofbits/skills/blob/main/plugins/differential-review/skills/differential-review/SKILL.md) |
| dwarf-expert | Interact with and understand the DWARF debugging format | [github](https://github.com/trailofbits/skills/blob/main/plugins/dwarf-expert/skills/dwarf-expert/SKILL.md) |
| entry-point-analyzer | Analyzes smart contract codebases to identify state-changing entry points for security auditing. Detects externally callable functions that modify state, categorizes them by access level, and generates structured audit reports. | [github](https://github.com/trailofbits/skills/blob/main/plugins/entry-point-analyzer/skills/entry-point-analyzer/SKILL.md) |
| firebase-apk-scanner | Scan Android APKs for Firebase security misconfigurations including open databases, storage buckets, authentication issues, and exposed cloud functions. For authorized security research only. | [github](https://github.com/trailofbits/skills/blob/main/plugins/firebase-apk-scanner/skills/firebase-apk-scanner/SKILL.md) |
| fp-check | Systematic false positive verification for security bug analysis with mandatory gate reviews | [github](https://github.com/trailofbits/skills/blob/main/plugins/fp-check/skills/fp-check/SKILL.md) |
| gh-cli | Intercepts GitHub URL fetches and curl/wget commands, redirecting to the authenticated gh CLI. | [github](https://github.com/trailofbits/skills/blob/main/.codex/skills/gh-cli/SKILL.md) |
| git-cleanup | Safely analyzes and cleans up local git branches and worktrees by categorizing them as merged, squash-merged, superseded, or active work. | [github](https://github.com/trailofbits/skills/blob/main/plugins/git-cleanup/skills/git-cleanup/SKILL.md) |
| insecure-defaults | Detects insecure default configurations including hardcoded credentials, fallback secrets, weak authentication defaults, and dangerous values in production | [github](https://github.com/trailofbits/skills/blob/main/plugins/insecure-defaults/skills/insecure-defaults/SKILL.md) |
| let-fate-decide | Draws Tarot cards using cryptographic randomness to add entropy to vague or underspecified planning. Interprets the spread to guide next steps. | [github](https://github.com/trailofbits/skills/blob/main/plugins/let-fate-decide/skills/let-fate-decide/SKILL.md) |
| modern-python | Modern Python best practices. Use when creating new Python projects, writing Python scripts, or migrating existing projects from legacy tools. | [github](https://github.com/trailofbits/skills/blob/main/plugins/modern-python/skills/modern-python/SKILL.md) |
| property-based-testing | Property-based testing guidance for multiple languages and smart contracts | [github](https://github.com/trailofbits/skills/blob/main/plugins/property-based-testing/skills/property-based-testing/SKILL.md) |
| seatbelt-sandboxer | Generate minimal macOS Seatbelt sandbox configurations for applications | [github](https://github.com/trailofbits/skills/blob/main/plugins/seatbelt-sandboxer/skills/seatbelt-sandboxer/SKILL.md) |
| second-opinion | Runs code reviews using external LLM CLIs (OpenAI Codex, Google Gemini) on uncommitted changes, branch diffs, or specific commits. | [github](https://github.com/trailofbits/skills/blob/main/plugins/second-opinion/skills/second-opinion/SKILL.md) |
| semgrep-rule-creator | Create custom Semgrep rules for detecting bug patterns and security vulnerabilities | [github](https://github.com/trailofbits/skills/blob/main/plugins/semgrep-rule-creator/skills/semgrep-rule-creator/SKILL.md) |
| semgrep-rule-variant-creator | Creates language variants of existing Semgrep rules with proper applicability analysis and test-driven validation | [github](https://github.com/trailofbits/skills/blob/main/plugins/semgrep-rule-variant-creator/skills/semgrep-rule-variant-creator/SKILL.md) |
| sharp-edges | Identify error-prone APIs, dangerous configurations, and footgun designs that enable security mistakes | [github](https://github.com/trailofbits/skills/blob/main/plugins/sharp-edges/skills/sharp-edges/SKILL.md) |
| skill-improver | Automatically reviews and fixes Claude Code skills through iterative refinement until they meet quality standards. | [github](https://github.com/trailofbits/skills/blob/main/plugins/skill-improver/skills/skill-improver/SKILL.md) |
| spec-to-code-compliance | Specification-to-code compliance checker for blockchain audits with evidence-based alignment analysis | [github](https://github.com/trailofbits/skills/blob/main/plugins/spec-to-code-compliance/skills/spec-to-code-compliance/SKILL.md) |
| static-analysis | Static analysis toolkit with CodeQL, Semgrep, and SARIF parsing for security vulnerability detection | [github](https://github.com/trailofbits/skills/blob/main/plugins/static-analysis/skills/semgrep/SKILL.md) |
| supply-chain-risk-auditor | Audit supply-chain threat landscape of project dependencies for exploitation or takeover risk | [github](https://github.com/trailofbits/skills/blob/main/plugins/supply-chain-risk-auditor/skills/supply-chain-risk-auditor/SKILL.md) |
| testing-handbook-skills | Skills from the Trail of Bits Application Security Testing Handbook (appsec.guide) | [github](https://github.com/trailofbits/skills/blob/main/plugins/testing-handbook-skills/skills/harness-writing/SKILL.md) |
| variant-analysis | Find similar vulnerabilities and bugs across codebases using pattern-based analysis | [github](https://github.com/trailofbits/skills/blob/main/plugins/variant-analysis/skills/variant-analysis/SKILL.md) |
| workflow-skill-design | Teaches design patterns for workflow-based Claude Code skills and provides a review agent for auditing existing skills | [github](https://github.com/trailofbits/skills/blob/main/plugins/workflow-skill-design/skills/designing-workflow-skills/SKILL.md) |
| yara-authoring | YARA-X detection rule authoring with linting and quality analysis | [github](https://github.com/trailofbits/skills/blob/main/plugins/yara-authoring/skills/yara-rule-authoring/SKILL.md) |
| zeroize-audit | Detects missing or compiler-optimized zeroization of sensitive data with assembly and control-flow analysis | [github](https://github.com/trailofbits/skills/blob/main/plugins/zeroize-audit/skills/zeroize-audit/SKILL.md) |

## Getting Started

```bash
npx paperclipai company import this-github-url-or-folder
```

See [Paperclip](https://paperclip.ing) for more information.

---
Exported from [Paperclip](https://paperclip.ing) on 2026-03-23
