# Change Log

All notable changes to the Tidies is documented here.


### 0.3.0

- Fix so that the extension (hopefully) works on Windows
- Remove dependency on 'fs' from core lib

### 0.2.0

- Support "border characters" in names. `[slug].tsx` will no longer be renamed to `slug.tsx` when the format is set to e.g `camel-case`.
- Unify problem handling to no longer rely on `WorkspaceEdit`: All renames are now handled through `workspace.fs`
- Fixed a bug where if you manually renamed or deleted a file and 'manually fixed a problem', the problem persisted in the problems pane
- Removed so that all unhandled rejections are no longer displayed in the Tidier output log

### 0.1.0

Initial release, including the features:

- Automatically detect and fix naming issues for files and folders as they are created or renamed
- Syntax highlighting and validation of the .tidierrc config file
- Commands for scanning projects and fixing issues
- Automatic detect problems on project start-up
- Multi-workspace support
