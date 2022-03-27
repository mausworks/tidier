# Change Log

All notable changes to the Tidies is documented here.

### 1.1.0

Fixes issues with not being able to rename files on MacOS

- Adds the setting `tidier.renameOverwrite.enabled` which is set to 'auto' by default, 
  which means it's enabled on MacOS and Windows by default, and disabled on Linux.

### 1.0.0

Initial release, featuring:

- Automatically detect and fix naming issues for files and folders as they are created or renamed
- Multi-workspace support
- Includes commands for scanning & fixing problems across all workspaces
- Files or folders with bad names show up in the problems pane
- Syntax highlighting and validation of the .tidierrc configuration file
- Automatic detect problems on project start-up
