# Tidier

Tidier helps you keep your projects & workspaces clean automatically renaming files to keep a consistent format

## Features

- Automatically detect and fix naming issues for files and folders as they are created, renamed or moved
- Syntax highlighting and schema validation for the .tidierrc config file
- Commands for scanning projects and fixing issues
- Automatic detect problems on project start-up
- Multi-workspace support

## Getting started

Create a `.tidierrc` at the root of your project.
Here is an example which is made conforms to the naming convention used in most React projects,
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

If you want to learn more about how Tidier applies name conventions to files and folders,
see the main [readme for the Tidier project on GitHub](https://github.com/mausworks/tidier#tidier--names).

Tidier will automatically ignore files specified in your projects `.gitignore`,
but you can add additional patterns in the "ignore"-section in the `.tidierrc` 

## Release Notes

Updates to the project will be included in this,
however the list might not capture all minute details for all changes.

### 0.1.0

Initial release, including the features:

- Automatically detect and fix naming issues for files and folders as they are created, renamed or moved.
- Syntax highlighting and schema validation for the .tidierrc config file
- Commands for scanning projects and fixing issues
- Multi-workspace support
- Automatically detect problems once a project is loaded
- Automatically ignores files specified in .gitignored files

