/** Options for targeting a specific project. */
export interface TidierProjectOptions {
  /**
   * The project root folder to use, relative to CWD.
   * This directory must either include a tidier configuration file,
   * or a config has to be specified explicitly
   * with the config option.
   *
   * If a project root is not explicitly provided, it will be resolved
   * from where the closest tidier configuration file is located.
   *
   * If a nearby root cannot be resolved, the application will err.
   */
  readonly "project"?: string;
  /**
   * Paths to ignorefiles; such as .gitignore or .eslintignore.
   *
   * Tidier will include the patterns
   * specified in these files and never check
   * or attempt fixes for entries matching them.
   */
  readonly "ignore-path": readonly string[];
}

/** Actions that can be performed by the CLI. */
export interface TidierCLIActions {
  /** If true, check for problems in the project. */
  readonly check?: boolean;
  /** If true, write fixes for problems to the project. */
  readonly write?: boolean;
}

/** A combination of all the available options for the Tidier CLI. */
export type TidierCLIOptions = TidierProjectOptions & TidierCLIActions;
