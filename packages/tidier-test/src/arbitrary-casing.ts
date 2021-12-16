import fc from "fast-check";
import {
  generalCasings,
  extensionCasings,
  generalAliases,
  GeneralAlias,
} from "tidier-core";

export const general = () => fc.oneof(...generalCasings.map(fc.constant));

export const generalSane = () =>
  fc.oneof(
    ...generalCasings.filter((c) => c !== "sPoNGEcAsE").map(fc.constant)
  );

export const extension = () => fc.oneof(...extensionCasings.map(fc.constant));

export const generalConvention = () => fc.array(general(), { minLength: 1 });

export const generalAlias = (): fc.Arbitrary<GeneralAlias> =>
  fc.oneof(
    ...Object.keys(generalAliases).map((a) => fc.constant(a as GeneralAlias))
  );

export const fileConvention = () =>
  fc
    .array(general(), { minLength: 1 })
    .chain((fragments) =>
      extension().chain((ext) => fc.constant([...fragments, ext]))
    );

export const saneGeneralFormat = (maxLength = 2) =>
  fc
    .array(generalSane(), { minLength: 1, maxLength })
    .map((casings) => casings.join("."));

export const generalFormat = (maxLength = 2) =>
  fc
    .array(general(), { minLength: 1, maxLength })
    .map((casings) => casings.join("."));

export const fileFormat = (maxLength = 3) =>
  fc
    .array(general(), { minLength: 1, maxLength: maxLength - 1 })
    .chain((casings) => extension().map((ext) => [...casings, ext].join(".")));

export const saneFileFormat = (maxLength = 3) =>
  fc
    .array(generalSane(), { minLength: 1, maxLength: maxLength - 1 })
    .chain((casings) => extension().map((ext) => [...casings, ext].join(".")));
