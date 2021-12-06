import {
  Glob,
  Problem,
  Project,
  Projects,
  check,
  fix,
  getProblem,
  ProblemDetails,
} from "@tidier/lib";
import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  languages,
  Range,
  Uri,
} from "vscode";
import { VSCodeFolder } from "./folder";
import * as output from "./output";
import { showErrorDialog } from "./ui";
import * as settings from "./settings";
import { basename, dirname, join } from "path";

const NO_RANGE = new Range(0, 0, 0, 0);

export class TidierContext {
  readonly projects: Projects;

  readonly #diagnostics: DiagnosticCollection;

  constructor(projects: Projects) {
    this.projects = projects;
    this.#diagnostics = languages.createDiagnosticCollection("Tidier");
  }

  setProblems(project: Project, problems: readonly Problem[]) {
    const enabledFor = settings.problems.enabledFor();

    if (enabledFor === "none") {
      return;
    }

    const severity = settings.problems.severity();

    for (const [path, details] of problems) {
      if (!settings.isEnabledFor(enabledFor, details.type)) {
        continue;
      }

      const uri = this.getUri(project, path);

      this.#diagnostics.set(uri, [createDiagnostic(severity, details)]);
    }
  }

  /**
   * Checks the URI for potential problems.
   * If fixes are enabled for: attempts to fix the problem.
   * If problems are enabled: and there is a problem with the entry,
   * the problem is added to the problems pane.
   *
   */
  async handle(uri: Uri): Promise<void> {
    const { path } = uri;
    const project = this.projects.bestMatch(uri.path);

    if (project) {
      const relative = project.folder.relative(path);
      const details = await getProblem(project, relative);

      if (details) {
        this.#handleProblem(project, uri, [relative, details]);
      } else {
        this.removeProblem(uri);
      }
    }
  }

  async removeProblem(uri: Uri) {
    this.#diagnostics.delete(uri);
  }

  /**
   * Scans the provided projects,
   * or all projects in the context if no projects are provided,
   * then returns the projects which have problems.
   */
  async scan(...projects: readonly Project[]): Promise<readonly Project[]> {
    projects = !projects.length ? this.projects.list() : projects;
    const problemProjects: Project[] = [];

    this.#diagnostics.clear();

    for (const project of projects) {
      const problems = await check(project, Glob.ANYTHING);

      if (problems.length > 0) {
        problemProjects.push(project);
      }

      this.setProblems(project, problems);
    }

    return problemProjects;
  }

  /**
   * Fixes all problems in the provided projects,
   * or all in all projects in the context if no projects are provided.
   */
  async fix(...projects: readonly Project[]) {
    projects = !projects.length ? this.projects.list() : projects;
    const fixes = settings.fixes.enabledFor();

    if (fixes === "none") {
      return;
    }

    const shouldFix = ([, { type }]: Problem) =>
      settings.isEnabledFor(fixes, type);

    for (const project of projects) {
      const problems = await check(project);

      attemptFix(project, problems.filter(shouldFix));
    }
  }

  async #handleProblem(
    project: Project,
    uri: Uri,
    [path, details]: Problem
  ): Promise<void> {
    const fixes = settings.fixes.enabledFor();
    const problems = settings.problems.enabledFor();

    if (settings.isEnabledFor(fixes, details.type)) {
      await attemptFix(project, [[path, details]]);
    } else if (settings.isEnabledFor(problems, details.type)) {
      const severity = settings.problems.severity();

      this.#diagnostics.set(uri, [createDiagnostic(severity, details)]);
    }
  }

  getUri({ folder }: Project, path: string): Uri {
    if (folder instanceof VSCodeFolder) {
      return Uri.joinPath(folder.uri, path);
    } else {
      throw new Error("The folder is not a VSCode folder.");
    }
  }
}

async function attemptFix(project: Project, problems: readonly Problem[]) {
  for (const problem of problems) {
    try {
      await fix(project, problem);

      logFix(problem);
    } catch (error) {
      const [path] = problem;
      const title = `Fixing '${path}' failed:`;
      const message = error instanceof Error ? error.message : String(error);

      showErrorDialog([title, message].join(" "));
      output.log(title);
      output.log(String(error));
    }
  }
}

const createDiagnostic = (
  severity: DiagnosticSeverity,
  { type, expectedName, format }: ProblemDetails
): Diagnostic => ({
  message:
    `Expected ${type} to be named '${expectedName}' ` +
    `to match format '${format.join(".")}'`,
  range: NO_RANGE,
  severity,
});

const logFix = ([path, { expectedName, format }]: Problem) =>
  output.log(`Renamed '${path}' -> '${expectedName}' [${format.join(".")}]`);
