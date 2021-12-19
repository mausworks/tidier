# Tidier

Tidier helps you keep your projects & workspaces tidy by automatically renaming files and folders to a specified format.

## Features

- Automatically detect and fix naming issues for files and folders as they are created or renamed
- Syntax highlighting and validation of the .tidierrc config file
- Commands for scanning projects and fixing issues
- Automatic detect problems on project start-up
- Multi-workspace support

## Getting started

Create a `.tidierrc` at the root of your project.

As soon as the configuration has been created, the extension should start working, 
and all problems within the project should show up in the 'problems' pane.

Below you will find an example configuration that uses common naming convention for React projects,
it should serve as a good baseline for whatever project you are currently working on.

```json
{
  "ignore": [ "**/build" ],
  "files": {
    "**/src/setupTests.*": "camelCase.lc",
    "**/src/reportWebVitals.ts": "camelCase.lc",
    "**/src/**/index.*": "camelCase.lc",
    "**/src/**/*.{tsx,jsx,css,scss,sass}": "PascalCase.kebab-case.lc",
    "**/src/*": "kebab-case.lc",
    "**/README*": "UPPER CASE.lc",
    "**/LICENSE*": "UPPER CASE.lc",
    "**/Dockerfile*": "PascalCase.lc",
    "**/Procfile*": "PascalCase.lc",
    "**/*.{ts,js}": "kebab-case.lc",
    "**/*": "kebab-case.lc"
  },
  "folders": {
    "**/*": "kebab-case"
  }
}
```

The configuration consists two sets of name conventions: one for files, and one for folders. 
The first glob that matches gets priority, so more specific name conventions should be specified at the top.

If you want to learn more about how Tidier applies name formats to files and folders,
see the [main readme for the Tidier project on GitHub](https://github.com/mausworks/tidier#tidier--names).

Tidier will automatically ignore files specified in your project's `.gitignore`,
but you can add additional patterns in the "ignore"-section in the `.tidierrc` 

## Commands

The following commands are available through the command palette:

- `tidier.fixAll` — attempt to automatically fix all problems in the workspace
- `tidier.scan` — manually scan all workspaces for problems

## Settings

The following settings are available to customize the behavior of the extension:

- `tidier.fixes.enabled` — Determines which fixes are automatically applied.
- `tidier.problems.enabled` — Determines which problems are displayed in the problems pane
- `tidier.problems.severity` — Determines the severity of problems in the problems pane.
