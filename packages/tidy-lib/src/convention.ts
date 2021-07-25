/** Describes the 'canon' general casings. */
export const generalCasings = [
  "preserve",
  "lower case",
  "Title Case",
  "UPPER CASE",
  "camelCase",
  "PascalCase",
  "kebab-case",
  "COBOL-CASE",
  "Train-Case",
  "snake_case",
  "Snake_Title_Case",
  "UPPER_SNAKE_CASE",
  "sPoNGEcAsE",
] as const;

/** Aliases that can be used for general casings in configs etc ... */
export const generalAliases = {
  "CONSTANT_CASE": "UPPER_SNAKE_CASE",
  "UpperCamelCase": "PascalCase",
  "Header-Case": "Train-Case",
  "lower-header-case": "kebab-case",
  "dash-case": "kebab-case",
  "UPPER-DASH-CASE": "COBOL-CASE",
  "UPPER-KEBAB-CASE": "COBOL-CASE",
} as const;

/** Describes the supported extension casings. */
export const extensionCasings = ["p", "lc", "UC", "Tc"] as const;

/** A general casing can be applied to any fragment of the name. */
export type GeneralCasing = typeof generalCasings[number];
/** An extension casing can only be applied to the extension of the name (the last fragment). */
export type ExtensionCasing = typeof extensionCasings[number];
/** Denotes that this can be either a general casing, or an extension casing. */
export type EitherCasing = GeneralCasing | ExtensionCasing;
/** An alias for a general casing */
export type GeneralAlias = keyof typeof generalAliases;
/** Describes how each fragment of a name should be formatted. */
export type NameFormat = (GeneralCasing | GeneralAlias)[];

/** Describes which files should apply what name format. */
export interface NameConvention {
  /** The glob pattern to match. */
  readonly glob: string;
  /**
   * The format of the name to use for the
   * files or folders that match the glob.
   */
  readonly format: NameFormat;
}

/** Resolve the casing from a potential alias into the canon casing name. */
export const resolveCasing = (casingOrAlias: GeneralAlias | EitherCasing) =>
  generalAliases[casingOrAlias as GeneralAlias] ?? casingOrAlias;
