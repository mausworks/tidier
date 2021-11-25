jest.mock("fs");
jest.mock("fs/promises");

import { vol } from "memfs";
import fc from "fast-check";
import * as ap from "./__arbitraries__/arbitrary-paths";

import { createProjectSettings, ProjectSettings, TidierConfig } from "./config";
import { Project } from "./project";
import { Projects } from "./projects";
import { FileDirectory } from ".";
import { S } from "memfs/lib/constants";

const basicJSONConfig: TidierConfig = {
  ignore: [],
  files: { "**/*": "kebab-case.lc" },
  folders: { "**/*": "kebab-case" },
};

const basicSettings: ProjectSettings = createProjectSettings(basicJSONConfig);

describe("lifecycle", () => {
  beforeEach(() => vol.reset());

  it("includes new projects on include", async () => {
    fc.assert(
      fc.property(ap.folder(true), (rootPath) => {
        vol.mkdirSync(rootPath, { recursive: true });

        const projects = new Projects();
        const project = new Project(new FileDirectory(rootPath), basicSettings);
        projects.add(project);

        expect(projects.count).toBe(1);
        expect(projects.list()[0]).toBe(project);
        expect(projects.find(project.folder.path)).toBe(project);
        expect(projects.bestMatch(project.folder.path)).toBe(project);
      })
    );
  });

  it("removes projects by path", async () => {
    fc.assert(
      fc.property(ap.folder(true), (rootPath) => {
        vol.mkdirSync(rootPath, { recursive: true });

        const projects = new Projects();
        const project = new Project(new FileDirectory(rootPath), basicSettings);
        projects.add(project);
        projects.remove(project.folder.path);

        expect(projects.count).toBe(0);
        expect(projects.list()[0]).toBe(undefined);
        expect(projects.find(project.folder.path)).toBe(null);
        expect(projects.bestMatch(project.folder.path)).toBe(null);
      })
    );
  });
});

describe("combining projects", () => {
  it("combines projects without duplicates", async () => {
    fc.assert(
      fc.property(
        fc.array(ap.folder(true), { minLength: 5, maxLength: 10 }),
        (rootPaths) => {
          const projects = new Projects();
          const moreProjects = new Projects();

          for (const root of rootPaths) {
            vol.mkdirSync(root, { recursive: true });

            const folder = new FileDirectory(root);
            const project = new Project(folder, basicSettings);
            const sameProject = new Project(folder, basicSettings);

            projects.add(project);
            moreProjects.add(sameProject);
          }

          projects.combine(moreProjects);

          expect(projects.count).toBe(rootPaths.length);

          const seen = new Set<string>();

          for (const project of projects.list()) {
            expect(seen.has(project.folder.path)).toBe(false);
            seen.add(project.folder.path);
          }
        }
      )
    );
  });
});
