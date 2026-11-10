import * as vscode from "vscode";

const MCP_ENTRY = {
  command: "npx",
  args: ["-y", "@yaaif/platform-mcp@1.7.0", "--client", "vscode"],
};

const WORKFLOWS = [
  "yaaif-auth",
  "yaaif-doctor",
  "yaaif-plan-usecase",
  "yaaif-scenario",
  "yaaif-create-skill",
  "yaaif-create-mcp",
  "yaaif-create-ambient",
  "yaaif-create-file-workflow",
  "yaaif-platform-tools",
  "yaaif-platform-updates",
  "yaaif-wiki",
  "yaaif-docs",
  "yaaif-kg-enhance",
  "yaaif-kg-skill-plan",
  "yaaif-ops-support",
  "yaaif-requirements",
  "yaaif-governance",
] as const;

function handoffPrompt(uri: vscode.Uri): string | undefined {
  if (uri.path !== "/handoff") return undefined;
  const prompt = new URLSearchParams(uri.query).get("prompt")?.trim();
  return prompt || undefined;
}

async function openCopilotChat(prompt?: string): Promise<void> {
  if (prompt) await vscode.env.clipboard.writeText(prompt);
  try {
    await vscode.commands.executeCommand("workbench.action.chat.open", prompt ? { query: prompt } : undefined);
  } catch {
    await vscode.commands.executeCommand("workbench.action.chat.open");
  }
  if (prompt) {
    void vscode.window.showInformationMessage("YAAIF handoff copied to the clipboard. Paste it into Copilot Chat if it was not prefilled.");
  }
}

async function configureMcpBridge(): Promise<void> {
  const choice = await vscode.window.showInformationMessage(
    "Configure the YAAIF MCP bridge for this VS Code profile?",
    { modal: true },
    "Open MCP Configuration",
  );
  if (choice !== "Open MCP Configuration") return;

  await vscode.env.clipboard.writeText(JSON.stringify({ servers: { yaaif: MCP_ENTRY } }, null, 2));
  try {
    await vscode.commands.executeCommand("workbench.action.openMcpConfig");
  } catch {
    await vscode.commands.executeCommand("workbench.action.openSettings", "mcp");
  }
  void vscode.window.showInformationMessage("YAAIF MCP configuration was copied. Add it to your user-level MCP configuration, then reload Copilot Chat.");
}

async function skillFiles(root: vscode.Uri, relative = ""): Promise<string[]> {
  const directory = relative ? vscode.Uri.joinPath(root, relative) : root;
  const entries = await vscode.workspace.fs.readDirectory(directory);
  const files: string[] = [];
  for (const [name, type] of entries) {
    const path = relative ? `${relative}/${name}` : name;
    if (type === vscode.FileType.Directory) files.push(...await skillFiles(root, path));
    if (type === vscode.FileType.File) files.push(path);
  }
  return files.sort((left, right) => left === "SKILL.md" ? -1 : right === "SKILL.md" ? 1 : left.localeCompare(right));
}

async function openWorkflow(context: vscode.ExtensionContext, selected?: string): Promise<void> {
  const skill = selected ?? await vscode.window.showQuickPick([...WORKFLOWS], {
    title: "YAAIF: Platform Workflow",
    placeHolder: "Choose the YAAIF workflow to start in Copilot Chat",
  });
  if (!skill) return;
  const root = vscode.Uri.joinPath(context.extensionUri, "skills", skill);
  const instructions = await Promise.all((await skillFiles(root)).map(async file => {
    const bytes = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(root, file));
    return new TextDecoder().decode(bytes);
  }));
  await openCopilotChat(
    `Use the bundled YAAIF ${skill} workflow below. Ensure the YAAIF session and tenant first, use the matching yaaif_* MCP tools, and obtain explicit confirmation before reviewed apply operations.\n\n${instructions.join("\n\n")}`,
  );
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: async (uri) => {
        const prompt = handoffPrompt(uri);
        if (!prompt) {
          void vscode.window.showWarningMessage("The YAAIF handoff link did not contain a prompt.");
          return;
        }
        await openCopilotChat(prompt);
      },
    }),
    vscode.commands.registerCommand("yaaif.configureMcpBridge", configureMcpBridge),
    vscode.commands.registerCommand("yaaif.openWorkflow", () => openWorkflow(context)),
    vscode.commands.registerCommand("yaaif.openGovernance", () => openWorkflow(context, "yaaif-governance")),
    vscode.commands.registerCommand("yaaif.openCopilotChat", () => openCopilotChat()),
  );
}

export function deactivate(): void {}
