jest.mock("fs");
jest.mock("fs/promises");

import { join, dirname } from "path";
import { fs, vol } from "memfs";
import fc from "fast-check";

import * as ap from "../test/arbitrary-paths";
import { convertConfig, TidyConfig, TidyJSONConfig } from "./config";
import { createProject } from "./project";

const basicJSONConfig: TidyJSONConfig = {
  ignore: [],
  files: {
    "**/*": "kebab-case.lc",
  },
  folders: {
    "**/*": "kebab-case",
  },
};

const basicConfig: TidyConfig = convertConfig(basicJSONConfig);

const seedVolume = (
  root: string,
  filePaths: string[],
  folderPaths: string[]
) => {
  vol.reset();
  vol.fromJSON({ [root]: null });

  for (const path of folderPaths) {
    if (!vol.existsSync(join(root, path))) {
      vol.mkdirSync(join(root, path), { recursive: true });
    }
  }

  for (const path of filePaths) {
    if (!vol.existsSync(join(root, dirname(path)))) {
      vol.mkdirSync(join(root, dirname(path)), { recursive: true });
    }

    vol.writeFileSync(join(root, path), "_file");
  }
};

describe("project creation", () => {
  it("creates a project when the root folder exists, and a config is provided", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (root) => {
        seedVolume(root, [], []);

        const project = await createProject(root, basicConfig);

        expect(project.ignore).toEqual(basicConfig.ignore);
        expect(project.fileConventions).toEqual(basicConfig.fileConventions);
        expect(project.folderConventions).toEqual(
          basicConfig.folderConventions
        );
      })
    );
  });

  it("reads the .gitignore files from the project root", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.array(fc.oneof(ap.folder(), ap.filePath()), { minLength: 1 }),
        async (root, ignore) => {
          seedVolume(root, [], []);

          fs.writeFileSync(join(root, ".gitignore"), ignore.join("\n"));

          const project = await createProject(root, basicConfig);

          for (const path of ignore) {
            expect(project.ignores(path)).toBe(true);
          }
        }
      )
    );
  });

  it("fails to create the root when the folder does not exist", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (root) => {
        await expect(createProject(root, basicConfig)).rejects.toThrow(
          /Could not create project/
        );
      })
    );
  });

  it("fails to create a project when the project root is a file", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        ap.fileName(),
        async (root, filePath) => {
          seedVolume(root, [filePath], []);

          const expected = expect(
            createProject(join(root, filePath), basicConfig)
          ).rejects;
          await expected.toThrow(/Could not create project/);
          await expected.toThrow(filePath);
          await expected.toThrow(/is not a folder/);
        }
      )
    );
  });
});

describe("resolving paths", () => {
  it("resolves paths relative to the root", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.oneof(ap.folder(), ap.filePath()),
        async (root, path) => {
          seedVolume(root, [], []);

          const project = await createProject(root, basicConfig);

          expect(project.resolve(path)).toBe(join(root, path));
        }
      )
    );
  });

  it("fails to resolve absolute paths", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.set(ap.folder(true), { minLength: 2, maxLength: 2 }),
        async ([root, absolutePath]) => {
          seedVolume(root, [], []);

          const project = await createProject(root, basicConfig);

          expect(() => project.resolve(absolutePath)).toThrow(absolutePath);
        }
      )
    );
  });
});

describe("listing", () => {
  it("lists all files (except ignored) with '**/*'", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.set(ap.filePath(), { minLength: 1 }),
        async (root, files) => {
          seedVolume(root, files, []);
          const ignore = files.slice(0, files.length / 2);

          const project = await createProject(root, { ...basicConfig, ignore });
          const paths = await project.listFiles("**/*");

          for (const file of files) {
            expect(paths.includes(file)).toBe(!ignore.includes(file));
          }
        }
      )
    );
  });

  it("lists all folders (except ignored) with '**/*'", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.set(ap.folder(), { minLength: 1 }),
        async (root, folders) => {
          seedVolume(root, [], folders);
          const ignore = folders.slice(0, folders.length / 2);

          const project = await createProject(root, { ...basicConfig, ignore });
          const paths = await project.listFolders("**/*");

          for (const folder of folders) {
            expect(paths.includes(folder)).toBe(!ignore.includes(folder));
          }
        }
      )
    );
  });

  it("does not include other project files", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.set(ap.folder(), { minLength: 2 }),
        async (root, folders) => {
          seedVolume(root, [], folders);
          const otherRoot = folders[folders.length - 1];
          fs.writeFileSync(join(root, otherRoot, "tidy.config.json"), "{}");

          const project = await createProject(root, basicConfig);
          const paths = await project.listFolders("**/*");

          expect(paths.includes(otherRoot)).toBe(false);
        }
      )
    );
  });
});

describe("checking whether a file or folder exists", () => {
  it("has a file if it's not ignored", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.set(ap.filePath(), { minLength: 5 }),
        async (root, files) => {
          seedVolume(root, files, []);
          const ignore = files.slice(0, Math.floor(files.length / 2));

          const shouldExist = files[files.length - 1];
          const shouldBeIgnored = files[0];

          const project = await createProject(root, { ...basicConfig, ignore });

          await expect(project.hasFile(shouldExist)).resolves.toBe(true);
          await expect(project.hasFile(shouldBeIgnored)).resolves.toBe(false);
        }
      )
    );
  });

  it("has a folder if it's not ignored", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        fc.set(ap.folder(), { minLength: 5 }),
        async (root, directories) => {
          seedVolume(root, [], directories);
          const ignore = directories.slice(0, directories.length / 2);

          const shouldExist = directories[directories.length - 1];
          const shouldBeIgnored = directories[0];

          const project = await createProject(root, { ...basicConfig, ignore });

          await expect(project.hasFolder(shouldExist)).resolves.toBe(true);
          await expect(project.hasFolder(shouldBeIgnored)).resolves.toBe(false);
        }
      )
    );
  });

  it("does not have a file or folder if it's not in the file system", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        ap.folder(),
        ap.fileName(),
        async (root, filePath, folderPath) => {
          seedVolume(root, [], []);

          const project = await createProject(root, basicConfig);

          await expect(project.hasFile(filePath)).resolves.toBe(false);
          await expect(project.hasFolder(folderPath)).resolves.toBe(false);
        }
      )
    );
  });
});
