import { window } from "vscode";

import * as output from "./output";

const SHOW_OUTPUT = "Show Output";

export function showErrorDialog(message: string) {
  window.showErrorMessage(message, SHOW_OUTPUT).then((clicked) => {
    if (clicked === SHOW_OUTPUT) {
      output.focus();
    }
  });
}
