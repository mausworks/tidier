# Tidier - The workspace formatter

Tidier helps you keep your projects & workspaces clean automatically renaming files to keep a consistent format

https://user-images.githubusercontent.com/8259221/126910139-162c5e89-b2c7-403a-8c9d-0091a229fe0d.mp4

## Configuration

Create a `.tidierrc` at the root of your project.
Here is an example which is made to work with most a React projects, 
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
then just keep reading below!

## Tidier & names

Tidier conceptualizes each file or folder name as a _sequence of fragments_ delimited by the `.` (period) character.

As a quick example: A file named `App.test.tsx` consists of three fragments: `App`, `test` and `tsx`.
If the name consists of more than one fragment, then tidier will _always_ consider the last fragment 
to be the sole _extension fragment_ (`tsx` in this case); this goes for both file and folder names.

## Name formats

Name formats are the backbone of Tidier, so they are meant to be intuitive&mdash;
so let's jump right into it, and see how it goes!

Using the `UPPER CASE` format enforces that upper case
is used for _every fragment_ of the file or folder name;
this includes the extension of files:

```
UPPER CASE -> README.MD
```

If you want to change the extension to use lower case
then you can specify `UPPER CASE.lc` as the name format instead; 
`lc` is an _extension casing_ (lc = "lower case") and it is only applied to the _extension fragment_.
This means that all fragments leading up to the extension, will still be in upper case.

```
UPPER CASE.lc -> README.md
```

Using the _general casing_ `lower case` has a similar effect,
where all fragments subsequent to the first will be in lower case, including the extension.

```
UPPER CASE            -> README.MD, SOME.LONGER.FILE NAME.TXT
UPPER CASE.lc         -> README.md, SOME.LONGER.FILE NAME.txt
UPPER CASE.lower case -> README.md, SOME.longer.file name.txt
```

The extension casing can only be used _once_ within the name format,
and it always has to be the last fragment of the convention as well.

You can of course use the extension format together with multiple general formats,
here are a few more nuanced examples:

```
PascalCase.kebab-case.lc    -> Readme.md, App.spec.ts, App.en.spec.ts
Title Case.COBOL-CASE.UC    -> Readme.MD, Old School Document.VERY-IMPORTANT.TXT
snake_case.UPPER_SNAKE_CASE -> readme.MD, why_anybody.WOULD_USE_THIS.FORMAT.IS_BEYOND.ME
Title Case.sPoNGEcAsE.Tc    -> Readme.Md, Some.lOnGEr.fIlE nAMe.Txt *
```

> \* = Approximate &mdash; `sPoNGEcAsE` differs every time
