# Tidier Core Abstractions

These are the core abstractions used for the [Tidier CLI](https://npmjs.org/package/tidier) and the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=mausworks.tidier-vscode).

## Getting started

If you want to integrate Tidier in your own projects without using the CLI,
you first need to implement the Folder interface for your project.

To facilitate cross-platform compatibility, these core abstractions does not have a concrete implementation.

If you are looking for an implementation based on `'fs/promises'`, 
have a look at [`Directory` class in the Tidier CLI](https://github.com/mausworks/tidier/blob/main/packages/tidier-cli/src/directory.ts).

### Projects

A folder that contains a Tidier config (`.tidierrc`) is considered a _Tidier project_.
All child entries of this folder is considered part of the project,
unless it is ignored by the project settings or if a folder contains another Tidier config,
in which case it considered the root of another project.

#### Loading a project

The `Project` class is the backbone of Tidier, and it acts like a state container
for the project settings and folder, and it also has a few handy utility methods.

```typescript
// Load a project from a folder:
const project = await Project.load(folder);
// Load a project form a folder, or any of its parents:
const project = await Project.near(folder);
// 'Manually' loading a project from a folder with explicit settings:
const project = new Project(folder, settings);
```

Both `Project.load` and `Project.near` will pick up the `.gitignore` for said folder and add it to the project settings.

#### Handling multiple projects

The `Projects` class is used to manage multiple projects at the same time.

In the following project structure, there are two projects: `root-project` and `child-project`.

```plaintext
root-project/
├─ .tidierrc
├─ .gitignore
├─ packages/
│  ├─ package-a/
│  ├─ package-c/
│  ├─ child-project/
│  │  ├─ .tidierrc
```

These projects have their own individual settings, 
which means that the neither the `.tidierrc` or `.gitignore` from
`root-project` affects `child-project`.

To discover all projects within a directory, you can use `Projects.discover` method:

```typescript
const projects = await Projects.discover(folder);
```

You can then add projects with `projects.add(project)` remove projects with `projects.remove(path)`,
and combine projects with `projects.combine(otherProjects)`.

Since the `Projects` class manages multiple projects without any inherent hierarchy, 
all paths that are accepted by its methods must be absolute.

To find out which file belongs to which project, 
you can use `projects.bestMatch(path)`.

```typescript
const path = '/root-project/packages/child-project/src/App.tsx';
// This will return the `child-project`:
const project = await projects.bestMatch(path);
```

### Problems

A file or folder that does not match an expected format is considered _a problem_.

Each problem has its own unique problem details, consisting of:

```typescript
interface ProblemDetails {
  /** The type of the entry. */
  readonly type: 'file' | 'folder';
  /** The expected name of the entry. */
  readonly expectedName: string;
  /** The format that the entry is expected to follow. */
  readonly format: NameFormat;
}
```

#### Checking for problems.

There are two ways to check for problems, by path or by glob.

```typescript
// Find all problems within a project:
const problems = check(project);
// Find all problems for .ts-files for the project:
const problems = check(project, new Glob("**/*.ts"));
// Get the problem details for a specific path:
const details = checkPath(project, "packages/package-a/src/FooBar.ts");
```

#### Fixing problems

Once you have checked for problems within a project, you can fix them using the `fix` function.

```typescript
for (const [path, details] of problems) {
  await fix(project, [path, details])
}
```

Note: By default `fix` will not overwrite other files by renaming.
It does so by `stat`:ing the `expectedPath` to ensure that there is no entry there.

But since the Windows file API is not case-sensitive, 
it is advisable to pass a third argument (`overwrite`) into `fix`, 
otherwise the fix is likely to not be applied, and an error will be thrown instead.

```typescript
const overwrite = process.platform === "win32"

await fix(project, [path, details], overwrite);
```
