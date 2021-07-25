import fc from "fast-check";

import * as ac from "../test/arbitrary-casing";
import * as ap from "../test/arbitrary-paths";
import { parseNamePattern } from "./config";
import { rename } from "./rename";

interface Expectation {
  readonly input: string;
  readonly format: string;
  readonly output: string;
}

/*
  I don't think it's useful to try to test the renaming overall.
  I think it's better that it serves as a playground instead,
  where you can test your expectations and see what you get out of it.

  Obviously, if you think something is wrong: fix it!
*/

const expectations: Expectation[] = [
  { input: "some.file.name", format: "PascalCase", output: "Some.File.Name" },
  { input: "some file name", format: "kebab-case", output: "some-file-name" },
  { input: "some.file.name", format: "PascalCase", output: "Some.File.Name" },
  { input: "readme.md", format: "UPPER CASE.lc", output: "README.md" },
  {
    input: "some-file.test.tsx",
    format: "PascalCase.kebab-case.lc",
    output: "SomeFile.test.tsx",
  },
];

test("expectations of renames", () => {
  for (const { input, format, output } of expectations) {
    const convention = parseNamePattern(format);

    expect(rename(input, convention)).toBe(output);
  }
});

/*
 * The following tests are pretty valid sanity checks:
 *
 * I also invented saneGeneralFormat and saneFileFormat,
 * just because this "sPoNGEcAsE" guy is entirely unpredictable.
 */

test("formats should match themselves", () => {
  fc.assert(
    fc.property(
      fc.oneof(ac.saneGeneralFormat(), ac.saneFileFormat()),
      (format) => {
        expect(rename(format, parseNamePattern(format))).toBe(format);
      }
    )
  );
});

test("that sPoNGEcAsE contains at least one upper case and lower case character", () => {
  fc.assert(
    fc.property(ap.fragment(10, 15), (name) => {
      const newName = rename(name, ["sPoNGEcAsE"]);

      expect(newName.split("").some((c) => c === c.toUpperCase()));
      expect(newName.split("").some((c) => c === c.toLocaleLowerCase()));
    })
  );
});
