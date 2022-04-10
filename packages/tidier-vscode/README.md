# Tidier

Tidier helps you keep your projects & workspaces tidy by automatically renaming files and folders to a specified format.

## Features

- Automatically detect and fix naming issues for files and folders as they are created or renamed
- Syntax highlighting and validation of the .tidierrc config file
- Commands for scanning projects and fixing issues
- Automatic detect problems on project start-up
- Multi-workspace support

## Getting started

## Getting started

To start using Tidier, create a `.tidierrc` to the root of your project.
This is where you will configure your file & folder name conventions.
By default, Tidier will ignore files specified in your project's `.gitignore`,
but you can add additional patterns in the "ignore"-section in the configuration file if need be.

The example configuration below uses common React conventions,
but it can be adapted to work with any project of any framework or language.

```json
{
  "ignore": [ "**/build" ],
  "files": {
    "**/src/(setupTests|reportWebVitals).*": "camelCase",
    "**/src/**/index.*": "camelCase",
    "**/src/**/*.{tsx,jsx,css,scss,sass}": "PascalCase.kebab-case",
    "**/(README|LICENSE)*": "UPPER CASE.lc",
    "**/*": "kebab-case"
  },
  "folders": {
    "**/*": "kebab-case"
  }
}
```

The configuration consists two sets of naming conventions: one for files, and one for folders.
Each convention consists of a glob, and a _name format_.

Globs are always matched from the location of the configuration file. 
The first glob that matches gets priority, so conventions with higher specificity should be declared at the top.

If you want to learn more about how Tidier applies name formats to files and folders,
see the [main README for Tidier on GitHub](https://github.com/mausworks/tidier#tidier--names).


## Commands

The following commands are available through the command palette:

- `tidier.fixAll` — attempt to automatically fix all problems in the workspace
- `tidier.scan` — manually scan all workspaces for problems

## Settings

The following settings are available to customize the behavior of the extension:

- `tidier.fixes.enabled` — Determines which fixes are automatically applied.
- `tidier.problems.enabled` — Determines which problems are displayed in the problems pane
- `tidier.problems.severity` — Determines the severity of problems in the problems pane.
