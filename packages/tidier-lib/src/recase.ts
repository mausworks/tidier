import {
  camelCase,
  capitalCase,
  headerCase,
  paramCase,
  pascalCase,
  snakeCase,
} from "change-case";
import { spongeCase } from "sponge-case";
import { titleCase } from "title-case";

import {
  EitherCasing,
  ExtensionCasing,
  GeneralAlias,
  NameFormat,
  resolveCasing,
} from "./convention";

export type Recaser = (word: string) => string;

export interface Recasing {
  readonly name: string;
  readonly format: string;
}

const lowerCase = (frag: string) => frag.toLowerCase();
const upperCase = (frag: string) => frag.toUpperCase();

const recasers: Record<EitherCasing, Recaser> = {
  "preserve": (frag) => frag,
  "lower case": (frag) => lowerCase(frag),
  "Title Case": (frag) => titleCase(frag),
  "UPPER CASE": (frag) => upperCase(frag),
  "kebab-case": (frag) => paramCase(frag),
  "Train-Case": (frag) => headerCase(frag),
  "COBOL-CASE": (frag) => paramCase(frag, { transform: upperCase }),
  "snake_case": (frag) => snakeCase(frag),
  "Snake_Title_Case": (frag) =>
    capitalCase(frag, { delimiter: "_", transform: titleCase }),
  "UPPER_SNAKE_CASE": (frag) => snakeCase(frag, { transform: upperCase }),
  "camelCase": (frag) => camelCase(frag, { delimiter: "" }),
  "PascalCase": (frag) => pascalCase(frag, { delimiter: "" }),
  "sPoNGEcAsE": (frag) => spongeCase(frag),
  "p": (frag) => frag,
  "lc": (frag) => lowerCase(frag),
  "Tc": (frag) => titleCase(frag),
  "UC": (frag) => upperCase(frag),
};

const getCasing = (
  format: NameFormat,
  index: number
): EitherCasing | GeneralAlias => format[Math.min(index, format.length - 1)];

/**
 * Checks if the provided casing is supported.
 * Note: This function does not check or resolve aliases.
 */
export const validateCasing = (casing: string): EitherCasing | null =>
  recasers[casing as EitherCasing] ? (casing as EitherCasing) : null;

/**
 * Returns true if the provided casing is an extension casing.
 *
 * Note: This check is lazy, so you must only provide values
 * to this function which are either a casing or an alias.
 */
export const isExtensionCasing = (
  casing: EitherCasing | GeneralAlias
): boolean => casing.length <= 2;

/**
 * If the format ends with an extension casing,
 * this function returns said casing;
 * otherwise this function returns null.
 * @param format The format to extract the extension casing from.
 */
export const getExtensionCasing = (
  format: NameFormat
): ExtensionCasing | null =>
  isExtensionCasing(format[format.length - 1])
    ? (format[format.length - 1] as ExtensionCasing)
    : null;

/**
 * Constitutes a set of leading or trailing characters,
 * these characters are to ignored when recasing if they are either leading or trailing.
 */
export const borderCharacters: readonly string[] = ["_", "[", "]", "(", ")"];

const isBorderChar = (char: string) => borderCharacters.includes(char);

function getLeading(fragment: string) {
  let leading = "";
  let i = 0;

  while (isBorderChar(fragment[i])) {
    leading = leading + fragment[i];
    i++;
  }

  return leading;
}

function getTrailing(fragment: string) {
  let trailing = "";
  let i = fragment.length - 1;

  while (isBorderChar(fragment[i])) {
    trailing = fragment[i] + trailing;
    i--;
  }

  return trailing;
}

const omitBorders = (leading: string, fragment: string, trailing: string) =>
  fragment.substr(
    leading.length,
    fragment.length - leading.length - trailing.length
  );

/**
 * Converts the case of a file or folder name.
 * @param name The name of the file or folder
 * @param format The file or folder format to apply
 */
export function recase(name: string, format: NameFormat): string {
  const fragments = name.split(".");
  const recasedFrags: string[] = [];
  const extensionCasing = getExtensionCasing(format);

  for (let i = 0; i < fragments.length; i++) {
    const isExtension =
      !!extensionCasing && fragments.length > 1 && i === fragments.length - 1;
    const fragment = fragments[i];
    const leading = getLeading(fragment);
    const trailing = getTrailing(fragment);
    const word = omitBorders(leading, fragment, trailing);

    const recaseFn = isExtension
      ? recasers[extensionCasing]
      : recasers[resolveCasing(getCasing(format, i))];

    recasedFrags.push(leading + recaseFn(word) + trailing);
  }

  return recasedFrags.join(".");
}
