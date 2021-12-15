import fc from "fast-check";

import { ac } from "tidier-test";
import { resolveCasing } from "./convention";
import { validateCasing } from "./recase";

describe("resolving aliases", () => {
  test("general casings return themselves", () => {
    fc.assert(
      fc.property(ac.general(), (casing) => {
        return resolveCasing(casing) === casing;
      })
    );
  });

  test("general aliases return a valid general casing", () => {
    fc.assert(
      fc.property(ac.generalAlias(), (alias) => {
        return validateCasing(resolveCasing(alias)) !== null;
      })
    );
  });
});
