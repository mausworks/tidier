import fs from "fs/promises";
import { resolve, dirname } from "path";
import {
  createProject,
  nearestConfig,
  convertConfig,
  readConfig,
} from "@tidier/lib";

import { TidierProjectOptions } from "./options";

export async function resolveConfigPath(path?: string): Promise<string | null> {
  if (path && path.endsWith("tidier.config.json")) {
    const fullPath = resolve(process.cwd(), path);

    try {
      const status = await fs.stat(fullPath);

      if (!status.isFile()) {
        throw new Error("Config is not a file.");
      }
    } catch (error) {
      throw new Error(`Failed to find config '${path}': ${error.message}`);
    }

    return fullPath;
  } else {
    return null;
  }
}

export async function resolveProjectPath(
  projectPath?: string
): Promise<string | null> {
  if (projectPath) {
    const path = resolve(process.cwd(), projectPath);

    try {
      const status = await fs.stat(path);

      if (!status.isDirectory()) {
        throw new Error("Project is not a folder.");
      }
    } catch (error) {
      throw new Error(
        `Failed to resolve project root '${projectPath}': ${error.message}`
      );
    }

    return path;
  } else {
    return null;
  }
}

export async function projectFromOptions(options: TidierProjectOptions) {
  const projectDirectory = await resolveProjectPath(options.project);

  const configPath =
    (await resolveConfigPath(options.config)) ??
    (await nearestConfig(projectDirectory ?? process.cwd()));

  if (!configPath) {
    throw new Error(
      "Failed to resolve project, a config was not found nor specified."
    );
  }

  const config = await readConfig(configPath).then(convertConfig);
  const root = projectDirectory ?? dirname(configPath);

  return await createProject(root, config);
}
