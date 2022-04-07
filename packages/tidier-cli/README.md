# Tidier

The file & folder name formatter

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

The configuration consists two sets of naming conventions: one for files, and one for folders.
Each convention consists of a glob, and a _name format_.

Globs are always matched from the location of the configuration file. 
The first glob that matches gets priority, so conventions with higher specificity should be declared at the top.

If you want to learn more about how Tidier applies name formats to files and folders,
see the [main README for Tidier on GitHub](https://github.com/mausworks/tidier#tidier--names).

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

### Using a specific ignorefile

By default, the CLI will load the .gitignore at the root of your project.
To override this, specify the `--ignore-path`.

```sh
tidier -c --ignore-path .npmignore --ignore-path .eslintignore
```
