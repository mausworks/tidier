import {
  Glob,
  Problem,
  Project,
  Projects,
  check,
  fix,
  checkPath,
  ProblemDetails,
} from "tidier-core";
import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  env,
  languages,
  Range,
  Uri,
} from "vscode";
import { VSCodeFolder } from "./folder";
import * as output from "./output";
import { showErrorDialog } from "./ui";
import * as settings from "./settings";

const NO_RANGE = new Range(0, 0, 0, 0);

export class TidierContext {
  readonly projects: Projects;

  readonly #diagnostics: DiagnosticCollection;

  constructor() {
    this.projects = new Projects();
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
   * If fixes are enabled: they are applied automatically.
   * If problems are enabled: they are added to the problems pane.
   */
  async handle(uri: Uri): Promise<void> {
    const { path } = uri;
    const project = this.projects.bestMatch(uri.path);

    if (project) {
      const relative = project.folder.relative(path);
      const details = await checkPath(project, relative);

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
   * Detects problems in the provided projects,
   * or all projects in the context if no projects are provided.
   */
  async detectProblems(
    ...projects: readonly Project[]
  ): Promise<[Project, readonly Problem[]][]> {
    projects = !projects.length ? this.projects.list() : projects;
    const entries: [Project, readonly Problem[]][] = [];

    this.#diagnostics.clear();

    for (const project of projects) {
      const problems = await check(project, Glob.ANYTHING);

      if (problems.length > 0) {
        entries.push([project, problems]);
        this.setProblems(project, problems);
      }
    }

    return entries;
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

      attemptFixes(project, problems.filter(shouldFix));
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
      await attemptFixes(project, [[path, details]]);
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

// There doesn't seem to be anything built into the VSCode
// extension API that allows you to get the platform.
const isWindows = () => Boolean(env.appRoot && env.appRoot[0] !== "/");

async function attemptFixes(project: Project, problems: readonly Problem[]) {
  // Windows being weird:
  // The Windows API for `stat` is case-insensitive, unlike NTFS.
  // This means that if we stat "FooBar.js" when renaming from "fooBar.js",
  // it will say that "FooBar.js" does indeed exist, even though it's named "fooBar.js".
  const overwrite = isWindows();

  for (const problem of problems) {
    try {
      await fix(project, problem, overwrite);

      logFix(problem);
    } catch (error) {
      const [path] = problem;
      const title = `Fixing '${path}' failed:`;
      const message = error instanceof Error ? error.message : String(error);

      showErrorDialog(`${title} ${message}`);
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
