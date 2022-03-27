import { EntryType } from "tidier-core";
import { DiagnosticSeverity, workspace } from "vscode";

const severityMap: Record<string, DiagnosticSeverity> = {
  hint: DiagnosticSeverity.Hint,
  information: DiagnosticSeverity.Information,
  warning: DiagnosticSeverity.Warning,
  error: DiagnosticSeverity.Error,
};

const section = workspace.getConfiguration;

type FeatureType = "all" | "files" | "folders" | "none";
type RenameOverwriteFeature = "auto" | "always" | "never";

export const isEnabledFor = (feature: FeatureType, entry: EntryType) =>
  feature === "all"
    ? true
    : feature === "files"
    ? entry === "file"
    : feature === "folders"
    ? entry === "folder"
    : false;

export const fixes = {
  enabledFor: () => section("tidier.fixes").get<FeatureType>("enabled", "all"),
};

export const problems = {
  enabledFor: () =>
    section("tidier.problems").get<FeatureType>("enabled", "all"),
  severity() {
    const value = section("tidier.problems").get<string>(
      "severity",
      "information"
    );

    return severityMap[value] ?? DiagnosticSeverity.Information;
  },
};

export const renameOverwrite = {
  enabled: () =>
    section("tidier.renameOverwrite.enabled").get<RenameOverwriteFeature>(
      "enabled",
      "auto"
    ),
};
