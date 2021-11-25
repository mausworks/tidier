import { Validator } from "jsonschema";

import { EitherCasing, NameConvention, NameFormat } from "./convention";
import { isExtensionCasing, validateCasing } from "./recase";
import { createGlob } from "./glob";

import schema from "./.tidierrc.schema.json";

export const TIDIER_CONFIG_NAME = ".tidierrc";

/**
 * The rules in the JSON file consists of globs as keys,
 * and name formats as values.
 */
export type NameRules = { [glob: string]: string };

/** Describes the shape of the Tidier JSON configuration file. */
export interface TidierConfig {
  /** Files to ignore (other than from e.g .gitignore). */
  readonly ignore?: string[];
  /** File name conventions. */
  readonly files?: NameRules;
  /** Folder name conventions. */
  readonly folders?: NameRules;
}

export interface ProjectSettings {
  /** Glob patterns of what to exclude. */
  readonly ignore: string[];
  /** The naming conventions to use for files within the project. */
  readonly fileConventions: NameConvention[];
  /** The naming conventions to use for folders within the project. */
  readonly folderConventions: NameConvention[];
}

const validator = new Validator();

/** Parses and validates the configuration from a JSON string. */
export function parseConfig(jsonString: string): TidierConfig {
  try {
    const config = JSON.parse(jsonString);

    validator.validate(config, schema, { throwError: true });

    return config as TidierConfig;
  } catch (error) {
    throw new Error(
      `Failed to parse '${TIDIER_CONFIG_NAME}'.\n ` + String(error)
    );
  }
}

/**
 * Parses the name pattern into a name format.
 * @param namePattern The name pattern string to parse the format from; e.g `"UPPER CASE.lc"`.
 */
export function parseNamePattern(namePattern: string): NameFormat {
  const format: EitherCasing[] = [];
  const casings = namePattern.split(".");

  for (let i = 0; i < casings.length; i++) {
    const casing = validateCasing(casings[i]);

    if (!casing) {
      throw new Error(`Unknown casing: '${casings[i]}'.`);
    }

    const isExtension = isExtensionCasing(casing);
    const isLast = i === casings.length - 1;

    if (isExtension && !isLast) {
      throw new Error(
        `The extension must be the last fragment of the pattern.`
      );
    }

    format.push(casing);
  }

  return format as NameFormat;
}

const parseConventions = (rules: NameRules): NameConvention[] =>
  Object.entries(rules).map(([glob, format]) => ({
    glob: createGlob(glob),
    format: parseNamePattern(format),
  }));

/** Converts the JSON config to a project configuration. */
export const createProjectSettings = ({
  ignore = [],
  files,
  folders,
}: TidierConfig): ProjectSettings => ({
  ignore,
  folderConventions: folders ? parseConventions(folders) : [],
  fileConventions: files ? parseConventions(files) : [],
});
