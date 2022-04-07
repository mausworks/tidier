jest.mock("fs");
jest.mock("fs/promises");

import fc from "fast-check";
import { arb } from "tidier-test";
import { FileDirectory } from "./directory";
import { dirname, join } from "path";
import { vol } from "memfs";

const seedVolume = (
  root: string,
  filePaths: string[],
  folderPaths: string[]
) => {
  vol.reset();
  vol.mkdirSync(root, { recursive: true });

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

describe("creating a file directory", () => {
  it("fails to create when the root does not exist", async () => {
    await fc.assert(
      fc.asyncProperty(arb.folderPath(true), async (root) => {
        await expect(FileDirectory.resolve(root)).rejects.toThrow();
      })
    );
  });

  it("fails to create a when the root is a file", async () => {
    await fc.assert(
      fc.asyncProperty(
        arb.folderPath(true),
        arb.fileName(),
        async (rootPath, filePath) => {
          seedVolume(rootPath, [filePath], []);
          const path = join(rootPath, filePath);

          const expected = expect(FileDirectory.resolve(path)).rejects;
          await expected.toThrow(/The path /);
          await expected.toThrow(filePath);
          await expected.toThrow(/does not resolve to a directory/);
        }
      )
    );
  });
});

describe("getting an entry type", () => {
  it("returns null if the file or folder does not exist", async () => {
    await fc.assert(
      fc.asyncProperty(
        arb.folderPath(true),
        arb.folderPath(),
        arb.fileName(),
        async (rootPath, filePath, folderPath) => {
          seedVolume(rootPath, [], []);
          const root = await FileDirectory.resolve(rootPath);

          await expect(root.entryType(filePath)).resolves.toEqual(null);
          await expect(root.entryType(folderPath)).resolves.toEqual(null);
        }
      )
    );
  });
});

describe("listing files", () => {
  it("lists files and folders within a directory", async () => {
    await fc.assert(
      fc.asyncProperty(
        arb.folderPath(true),
        fc.set(arb.fileName(3), { minLength: 5, maxLength: 10 }),
        async (rootPath, names) => {
          const mid = Math.min(names.length / 2);
          const folders = names.slice(0, mid);
          const files = names.slice(mid, names.length);
          seedVolume(rootPath, files, folders);

          const root = await FileDirectory.resolve(rootPath);

          for (const [name, type] of await root.list("./")) {
            if (type === "file") {
              expect(files.includes(name)).toBe(true);
            } else if (type === "folder") {
              expect(folders.includes(name)).toBe(true);
            }
          }
        }
      )
    );
  });
});

describe("traversing parents", () => {
  it("returns null at the root", () => {
    const root = process.platform === "win32" ? "C:\\" : "/";
    seedVolume(root, [], []);

    const folder = new FileDirectory(root);

    expect(folder.parent()).toBe(null);
  });
});
