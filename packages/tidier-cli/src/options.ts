/** Options for targeting a specific project. */
export interface TidierProjectOptions {
  /**
   * The project root folder to use, relative to CWD.
   * This path must either include a `tidier.config.json`,
   * or a config has to be specified explicitly
   * with the config option.
   *
   * If a project root is not explicitly provided, it will be resolved
   * from where the closest `tidier.config.json` file is located.
   *
   * If a nearby root cannot be resolved, the application will err.
   */
  readonly project?: string;
  /**
   * Override the config in the project,
   * or explicitly specify a configuration
   * together with the project option.
   *
   * If a config in not explicitly provided, it will be resolved
   * automatically once the project root is resolved.
   */
  readonly config?: string;
}

/** Actions that can be performed by the CLI. */
export interface TidierCLIActions {
  /** If true, check for problems in the project. */
  readonly check?: boolean;
  /** If true, write fixes for problems to the project. */
  readonly write?: boolean;
  /**
   * If true, files and folders within the project will be watched for problems.
   * Combine with `check` or `write` to get automatic linting linting and fixes.
   */
  readonly watch?: boolean;
}

/** A combination of all the available options for the Tidier CLI. */
export type TidierCLIOptions = TidierProjectOptions & TidierCLIActions;
