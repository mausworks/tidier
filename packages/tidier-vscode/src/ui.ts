import { Project } from "@tidier/core";
import { basename } from "path";
import { commands, window } from "vscode";
import { TidierContext } from "./context";

import * as output from "./output";

const SHOW_OUTPUT = "Show Output";
const FIX_PROBLEMS = "Fix Problems";
const SHOW_PROBLEMS = "Show Problems";

export function showErrorDialog(message: string) {
  window.showErrorMessage(message, SHOW_OUTPUT).then((clicked) => {
    if (clicked === SHOW_OUTPUT) {
      output.focus();
    }
  });
}

export function showProblemsDetectedDialog(
  tidier: TidierContext,
  project: Project
) {
  const projectName = basename(project.folder.path);
  const title = `Tidier has detected problems in '${projectName}'.`;

  window
    .showInformationMessage(title, FIX_PROBLEMS, SHOW_PROBLEMS)
    .then(async (clicked) => {
      if (clicked === FIX_PROBLEMS) {
        tidier.fix(project);
      } else if (clicked === SHOW_PROBLEMS) {
        commands.executeCommand("workbench.panel.markers.view.focus");
      }
    });
}
