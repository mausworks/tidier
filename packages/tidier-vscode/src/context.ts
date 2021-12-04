import { Glob, Problem, Project, Projects, check, fix } from "@tidier/lib";
import { DiagnosticCollection, languages, Range, Uri } from "vscode";
import { VSCodeFolder } from "./folder";
import * as output from "./output";
import { showErrorDialog } from "./ui";
import * as settings from "./settings";

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

    for (const [path, { expectedName, type, format }] of problems) {
      if (!settings.isEnabledFor(enabledFor, type)) {
        continue;
      }

      const uri = this.getUri(project, path);
      const formatStr = format.join(".");
      const message = `Expected ${type} to be named '${expectedName}' to match format '${formatStr}'`;

      this.#diagnostics.set(uri, [
        {
          message,
          range: NO_RANGE,
          severity,
        },
      ]);
    }
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
    const enabledFor = settings.fixes.enabledFor();

    const shouldFix = ([, { type }]: Problem) =>
      settings.isEnabledFor(enabledFor, type);

    for (const project of projects) {
      const problems = await check(project);

      for (const problem of problems) {
        try {
          if (shouldFix(problem)) {
            await fix(project, problem);
          }
        } catch (error) {
          const [path] = problem;
          const title = `Fixing '${path}' failed:`;
          const message =
            error instanceof Error ? error.message : String(error);

          showErrorDialog([title, message].join(" "));
          output.log(title);
          output.log(String(error));
        }
      }
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
