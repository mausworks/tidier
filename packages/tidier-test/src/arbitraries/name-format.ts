import fc from "fast-check";
import {
  generalCasings,
  extensionCasings,
  generalAliases,
  GeneralAlias,
} from "tidier-core";

/** Generates one of the general casings. */
export const generalCasing = () => fc.oneof(...generalCasings.map(fc.constant));

/** Generates one of the general casings, except `"sPoNGEcAsE"`. */
export const generalSaneCasing = () =>
  fc.oneof(
    ...generalCasings.filter((c) => c !== "sPoNGEcAsE").map(fc.constant)
  );

/** Generates one of the extension casings. */
export const extensionCasing = () =>
  fc.oneof(...extensionCasings.map(fc.constant));

/** Generates one of the aliases for general casings. */
export const generalCasingAlias = (): fc.Arbitrary<GeneralAlias> =>
  fc.oneof(
    ...Object.keys(generalAliases).map((a) => fc.constant(a as GeneralAlias))
  );

/** Generates a name format array constructed from various general casings. */
export const generalNameFormat = () =>
  fc.array(generalCasing(), { minLength: 1 });

/** Generates a name format array which ends with an extension casing. */
export const fileNameFormat = () =>
  fc
    .array(generalCasing(), { minLength: 1 })
    .chain((fragments) =>
      extensionCasing().chain((ext) => fc.constant([...fragments, ext]))
    );

/** Generates a name format string constructed from various general casings. */
export const generalNameFormatString = (maxLength = 2) =>
  fc
    .array(generalCasing(), { minLength: 1, maxLength })
    .map((casings) => casings.join("."));

/** Generates a name format string which does no include `"sPoNGEcAsE"` */
export const saneGeneralNameFormatString = (maxLength = 2) =>
  fc
    .array(generalSaneCasing(), { minLength: 1, maxLength })
    .map((casings) => casings.join("."));

/** Generates a name format string which ends with an extension casing. */
export const fileNameFormatString = (maxLength = 3) =>
  fc
    .array(generalCasing(), { minLength: 1, maxLength: maxLength - 1 })
    .chain((casings) =>
      extensionCasing().map((ext) => [...casings, ext].join("."))
    );

/** Generates a name format string which ends with an extension casing. */
export const saneFileNameFormatString = (maxLength = 3) =>
  fc
    .array(generalSaneCasing(), { minLength: 1, maxLength: maxLength - 1 })
    .chain((casings) =>
      extensionCasing().map((ext) => [...casings, ext].join("."))
    );
