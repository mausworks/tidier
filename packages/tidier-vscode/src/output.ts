import { window, OutputChannel } from "vscode";

let channel: OutputChannel | null = null;

export function registerOutputChannel() {
  channel = window.createOutputChannel("Tidier");
}

export function unregisterOutputChannel() {
  channel?.dispose();
  channel = null;
}

export function focus() {
  channel?.show(true);
}

export const log = (value: string) => channel?.appendLine(value);
