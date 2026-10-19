import * as vscode from "vscode";

const MCP_ENTRY = {
  command: "npx",
  args: ["-y", "@yaaif/platform-mcp@1.3.8", "--client", "vscode"],
};

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

async function openGovernance(context: vscode.ExtensionContext): Promise<void> {
  const base = vscode.Uri.joinPath(context.extensionUri, "skills", "yaaif-governance");
  const files = ["SKILL.md", "references/requirements.md", "references/diagnosis.md"];
  const instructions = await Promise.all(files.map(async file => {
    const bytes = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(base, file));
    return new TextDecoder().decode(bytes);
  }));
  await openCopilotChat("Use the bundled YAAIF governance workflow below. Start with yaaif_governance_capabilities; obtain explicit confirmation of the exact proposal before apply.\n\n" + instructions.join("\n\n"));
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
    vscode.commands.registerCommand("yaaif.openGovernance", () => openGovernance(context)),
    vscode.commands.registerCommand("yaaif.openCopilotChat", () => openCopilotChat()),
  );
}

export function deactivate(): void {}
