# Tidier

A CLI for keeping your projects tidier

## Getting started

Create a `.tidierrc` at the root of your project.
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

Navigate to your project and run:

## Usage

To check for problems within a project:

```sh
tidier -c
```

To fix all problems:

```sh
tidier -w
```

### Checking specific entries

If you want to check specific entries within a project, 
you can specify a list of paths, either via glob expansion or by providing multiple path arguments to the CLI.

```sh
# Check Foo.ts and Bar.ts in the CWD
tidier -c Foo.ts Bar.ts
# Check all TS files relative to the CWD
tidier -c '**/*.ts'
```

To prevent passing too many arguments into tidier (and hitting the OS `ARG_MAX` limit),
you should always quote your glob patterns before passing them to Tidier.
