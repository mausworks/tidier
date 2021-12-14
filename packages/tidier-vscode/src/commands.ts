import { commands } from "vscode";
import { TidierContext } from "./context";

export function registerCommands(tidier: TidierContext) {
  commands.registerCommand(
    "tidier.scan",
    async () => await tidier.detectProblems()
  );
  commands.registerCommand("tidier.fixAll", async () => await tidier.fix());
}
