jest.mock("fs");
jest.mock("fs/promises");

import fc from "fast-check";
import { vol, fs } from "memfs";
import { dirname, join } from "path";

import * as ac from "./__arbitraries__/arbitrary-casing";
import { createProjectSettings, parseNamePattern } from "./config";

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
    const { ignore } = createProjectSettings({
      ignore: undefined,
      files: {},
      folders: {},
    });

    expect(ignore).toBeTruthy();
  });
});
