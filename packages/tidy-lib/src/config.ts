import * as fs from "fs/promises";
import { basename, dirname, join } from "path";
import { Validator } from "jsonschema";

import { EitherCasing, NameConvention, NameFormat } from "./convention";
import { isExtensionCasing, validateCasing } from "./rename";
import schema from "./tidy.config.schema.json";

/**
 * The rule-set in the JSON file consists of globs as keys,
 * and name convention formats as values.
 */
export type NameRules = { [glob: string]: string };

/** Describes the shape of the Tidy JSON configuration file. */
export interface TidyJSONConfig {
  /** Files to ignore (other than from e.g .gitignore). */
  readonly ignore?: string[];
  /** File name conventions. */
  readonly files: NameRules;
  /** Folder name conventions. */
  readonly folders: NameRules;
}

/** Describes the shape of the configuration used internally withing Tidy. */
export interface TidyConfig {
  /** Glob patterns of what to exclude. */
  readonly ignore: string[];
  /** The naming conventions to use for files within the project. */
  readonly fileConventions: NameConvention[];
  /** The naming conventions to use for folders within the project. */
  readonly folderConventions: NameConvention[];
}

const validator = new Validator();

/**
 * Reads the configuration file at the provided path.
 * @param path The path to read the config from: an absolute path.
 */
export async function readConfig(path: string): Promise<TidyJSONConfig> {
  const json = await fs.readFile(path, "utf-8").then(JSON.parse);

  validator.validate(json, schema, { throwError: true });

  return json as TidyJSONConfig;
}

/**
 * Parses the name pattern into a name format.
 * @param namePattern The string to parse the format from, e.g `"UPPER CASE.lc"`.
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

/**
 * Attempts to locate the config nearest to the given path.
 * It does this by searching "upwards" in the directory tree.
 * @param path The absolute path to search from, can either be a file or a folder.
 * @param levels The maximum number of levels to search.
 */
export async function nearestConfig(
  path: string,
  levels = 5
): Promise<string | null> {
  if (levels-- === 0 || !path || path === "/") {
    return null;
  }

  const status = await fs.stat(path);
  const name = basename(path);

  if (status.isFile() && name === "tidy.config.json") {
    return path;
  } else if (status.isDirectory()) {
    const entries = await fs.readdir(path, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name === "tidy.config.json") {
        return join(path, entry.name);
      }
    }

    return await nearestConfig(dirname(path), levels);
  } else {
    return null;
  }
}

/**
 * Checks whether the provided root directory contains a config file.
 * @param root The directory to search: an absolute path.
 */
export async function containsConfig(root: string): Promise<boolean> {
  try {
    const status = await fs.stat(join(root, "tidy.config.json"));

    if (!status.isFile()) {
      throw new Error(`The config at '${root}' is not a file.`);
    } else {
      return true;
    }
  } catch (error) {
    // This will do just good for now
    return false;
  }
}

const parseConventions = (rules: NameRules): NameConvention[] =>
  Object.entries(rules).map(([glob, format]) => ({
    glob,
    format: parseNamePattern(format),
  }));

/** Converts the JSON config to the internal format.  */
export const convertConfig = ({
  ignore = [],
  files,
  folders,
}: TidyJSONConfig): TidyConfig => ({
  ignore,
  folderConventions: parseConventions(folders),
  fileConventions: parseConventions(files),
});
