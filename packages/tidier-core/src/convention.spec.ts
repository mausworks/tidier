import fc from "fast-check";

import { arb } from "tidier-test";
import { resolveCasing } from "./convention";
import { validateCasing } from "./recase";

describe("resolving aliases", () => {
  test("general casings return themselves", () => {
    fc.assert(
      fc.property(arb.generalCasing(), (casing) => {
        return resolveCasing(casing) === casing;
      })
    );
  });

  test("general aliases return a valid general casing", () => {
    fc.assert(
      fc.property(arb.generalCasingAlias(), (alias) => {
        return validateCasing(resolveCasing(alias)) !== null;
      })
    );
  });
});
