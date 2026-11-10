# YAAIF for Visual Studio Code

Install and build the extension with the matching 1.7.0 npx installer:

```bash
npx -y @yaaif/platform-mcp@1.7.0 --install --client vscode
```

This downloads the 1.7.0 source, runs `npm ci` and `npm run package`, then uses
the `code` CLI to install the VSIX. If `code` is unavailable, the installer
prints the manual VSIX path. Use `--code-path /path/to/code` to override it or
`--build-only` to leave the VSIX under `~/.yaaif/vscode/packages/` without
modifying VS Code. Successful updates remove older VSIX artifacts and move them
to `~/.yaaif/vscode/plugin-backups/`; use `--keep-old-versions` to retain them. If verification fails after installation, the installer reinstalls the previous VSIX when a backup is available. Source overrides and verification use `--plugin-src`,
`--plugin-ref`, `--plugin-sha256`, and `--plugin-source-base-url`.

Run **YAAIF: Configure MCP Bridge**, then authenticate
with the YAAIF bridge in Copilot Chat. **YAAIF: Platform Workflow** offers the
shared auth, planning, Scenario, skill, MCP, ambient, file-workflow, Wiki,
platform-update, docs, and operations workflows bundled under `skills/`. The Admin UI **Open in VS Code**
action opens Copilot Chat with the selected catalog context; the prompt is
copied as a fallback when the installed VS Code chat API cannot prefill it.
The auth and doctor workflows use `yaaif_features` to distinguish missing
permissions from backends that need an upgrade.

## Tenant governance

`yaaif-governance` gathers authorized tenant business context, interviews for missing requirements, diagnoses failures, and prepares guardrail/harness policy changes. It starts with effective permissions and uses a preview → explicit confirmation → apply workflow. It never grants permissions or treats tenant documents as authorization. Retention is inspection only; infrastructure, data purges and run controls are excluded.

OpenCode: `/yaaif-governance`. Cursor/Claude Code: the `yaaif-governance` command or skill. Codex: `$yaaif-governance`. VS Code/JetBrains: **YAAIF: Governance Agent** (JetBrains copies the bundled instructions for AI Assistant).

Requires a bridge and backend containing the governance tools, validation routes and conditional-write middleware. Prepare and test the packages together before publishing; do not point a live install at an unpublished version. A saved configuration does not by itself prove runtime enforcement.
