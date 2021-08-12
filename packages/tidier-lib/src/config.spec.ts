jest.mock("fs");
jest.mock("fs/promises");

import fc from "fast-check";
import { vol, fs } from "memfs";
import { dirname, join } from "path";

import * as ac from "../test/arbitrary-casing";
import * as ap from "../test/arbitrary-paths";
import {
  containsConfig,
  convertConfig,
  nearestConfig,
  parseNamePattern,
  readConfig,
  TidierJSONConfig,
} from "./config";

describe("parsing conventions", () => {
  it("parses general formats", () => {
    fc.assert(
      fc.property(ac.generalConvention(), (casings) => {
        expect(parseNamePattern(casings.join("."))).toEqual(casings);
      })
    );
  });

  it("parses file formats", () => {
    fc.assert(
      fc.property(ac.fileConvention(), (casings) => {
        expect(parseNamePattern(casings.join("."))).toEqual(casings);
      })
    );
  });

  it("fails to parse invalid formats", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 2 }),
        (casings) => {
          expect(() => parseNamePattern(casings.join("."))).toThrow();
        }
      )
    );
  });

  it("throws if extension format is not last", () => {
    fc.assert(
      fc.property(
        fc.array(ac.general(), { minLength: 0 }),
        ac.extension(),
        fc.array(ac.general(), { minLength: 1 }),
        (head, extension, tail) => {
          expect(() =>
            parseNamePattern([...head, extension, ...tail].join("."))
          ).toThrowError(
            /the extension must be the last fragment of the pattern./i
          );
        }
      )
    );
  });
});

describe("config conversion", () => {
  it("defaults to an empty array of ignore", () => {
    const { ignore } = convertConfig({
      ignore: undefined,
      files: {},
      folders: {},
    });

    expect(ignore).toBeTruthy();
  });
});

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

describe("finding the nearest config", () => {
  it("returns the starting path if it is the config file", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (root) => {
        seedVolume(root, ["tidier.config.json"], []);

        const configPath = await nearestConfig(
          join(root, "tidier.config.json")
        );

        expect(configPath).toBe(join(root, "tidier.config.json"));
      })
    );
  });

  it("only searches for the specified amount of levels", async () => {
    const levels = 5;

    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        ap.folder(false, { minLength: levels, maxLength: levels }),
        async (root, startFolder) => {
          seedVolume(root, ["tidier.config.json"], [startFolder]);

          const configPath = await nearestConfig(
            join(root, startFolder),
            levels - 1
          );

          expect(configPath).toBe(null);
        }
      )
    );
  });

  it("searches 'up' from the starting directory", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        ap.folder(),
        async (root, startPath) => {
          seedVolume(root, ["tidier.config.json"], [startPath]);

          const configPath = await nearestConfig(
            join(root, startPath),
            Infinity
          );

          expect(configPath).toBe(join(root, "tidier.config.json"));
        }
      )
    );
  });

  it("returns null if no config is found", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        ap.folder(),
        async (root, startPath) => {
          seedVolume(root, [], [startPath]);

          const configPath = await nearestConfig(
            join(root, startPath),
            Infinity
          );

          expect(configPath).toBe(null);
        }
      )
    );
  });

  it("returns null if the path is not the config file or a folder", async () => {
    await fc.assert(
      fc.asyncProperty(
        ap.folder(true),
        ap.fileName(),
        async (root, fileName) => {
          seedVolume(root, [fileName], []);

          const configPath = await nearestConfig(
            join(root, fileName),
            Infinity
          );

          expect(configPath).toBe(null);
        }
      )
    );
  });
});

describe("checking if a config exists", () => {
  it("returns true if a config exists", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (root) => {
        seedVolume(root, ["tidier.config.json"], []);

        await expect(containsConfig(root)).resolves.toBe(true);
      })
    );
  });

  it("returns false if no config exists", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (root) => {
        seedVolume(root, [], []);

        await expect(containsConfig(root)).resolves.toBe(false);
      })
    );
  });

  it("returns false if config is not a file", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (root) => {
        // Make tidier.config.json a folder
        seedVolume(root, [], ["tidier.config.json"]);

        await expect(containsConfig(root)).resolves.toBe(false);
      })
    );
  });
});

describe("reading config off disk", () => {
  it("reads the config", async () => {
    await fc.assert(
      fc.asyncProperty(ap.folder(true), async (root) => {
        const config: TidierJSONConfig = { files: {}, folders: {} };

        seedVolume(root, [], []);
        fs.writeFileSync(
          join(root, "tidier.config.json"),
          JSON.stringify(config)
        );

        await expect(
          readConfig(join(root, "tidier.config.json"))
        ).resolves.toEqual(config);
      })
    );
  });
});
