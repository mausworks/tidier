import { Project, Projects, recase, TIDIER_CONFIG_NAME } from "@tidier/lib";
import { basename, dirname, join } from "path";
import {
  workspace,
  FileDeleteEvent,
  ExtensionContext,
  Disposable,
  WorkspaceEdit,
  Uri,
  FileCreateEvent,
  FileRenameEvent,
  TextDocument,
} from "vscode";
import { VSCodeFolder } from "./folder";
import * as output from "./output";
import {
  handleProjectReload,
  handleLoadProject,
  discoverProjectsInWorkspace,
} from "./project";

const disposables: Disposable[] = [];
const projects = new Projects();

process.on("unhandledRejection", (err) => output.log(String(err)));

export async function activate(_: ExtensionContext) {
  output.registerOutputChannel();
  output.log("Tidier activated. 🧹");

  disposables.push(workspace.onDidDeleteFiles(onDeleteFile));
  disposables.push(workspace.onDidSaveTextDocument(onSaveFile));
  disposables.push(workspace.onDidCreateFiles(onCreateFile));
  disposables.push(workspace.onDidRenameFiles(onRenameFile));

  if (workspace.workspaceFolders) {
    await discoverProjectsInWorkspace(projects, workspace.workspaceFolders);
  }
}

export function deactivate() {
  output.log("Tidier deactivated. 👋");
  output.unregisterOutputChannel();

  disposables.forEach((disposable) => disposable.dispose());
}

async function getConvention(path: string) {
  const project = projects.bestMatch(path);

  if (project) {
    const relative = project.folder.relative(path);
    const type = await project.folder.entryType(relative);

    if (type) {
      return project.getConvention(type, relative);
    } else {
      output.log(`Cannot resolve ${path} to a known entry type.`);
      output.log(`Either it cannot be found or is neither a folder or file.`);
    }
  }

  return null;
}

async function createRenameEdit(uri: Uri): Promise<WorkspaceEdit> {
  const edit = new WorkspaceEdit();
  const convention = await getConvention(uri.path);

  if (convention) {
    const name = basename(uri.fsPath);
    const newName = recase(name, convention.format);

    if (name !== newName) {
      const newPath = join(dirname(uri.fsPath), newName);
      const newUri = uri.with({ path: newPath });
      const nameFormat = convention.format.join(".");

      output.log(`Recasing '${name}' -> '${newName}' [${nameFormat}]`);

      edit.renameFile(uri, newUri);
    }
  }

  return edit;
}

async function onCreateFile(event: FileCreateEvent) {
  for (const uri of event.files) {
    const name = basename(uri.fsPath);

    if (name === TIDIER_CONFIG_NAME) {
      const folderUri = uri.with({ path: dirname(uri.path) });
      const folder = new VSCodeFolder(folderUri);
      const project = await Project.load(folder);

      projects.add(project);
    } else {
      workspace.applyEdit(await createRenameEdit(uri));
    }
  }
}

async function onRenameFile(event: FileRenameEvent) {
  for (const { newUri } of event.files) {
    workspace.applyEdit(await createRenameEdit(newUri));
  }
}

async function onSaveFile({ uri }: TextDocument) {
  const name = basename(uri.path);

  if (name === TIDIER_CONFIG_NAME || name === ".gitignore") {
    const folderPath = dirname(uri.path);
    const project = projects.find(folderPath);

    if (project) {
      await handleProjectReload(project);
    } else if (name !== ".gitignore") {
      const folderUri = uri.with({ path: folderPath });

      await handleLoadProject(projects, folderUri);
    }
  }
}

async function onDeleteFile({ files }: FileDeleteEvent) {
  for (const file of files) {
    const name = basename(file.path);

    if (name === TIDIER_CONFIG_NAME) {
      const project = projects.bestMatch(file.path);

      if (project) {
        projects.remove(project.folder.path);
        output.log(`Unloaded project at '${project.folder.path}'.`);
      }
    } else if (name === ".gitignore") {
      const project = projects.bestMatch(file.path);

      if (project) {
        await handleProjectReload(project);
      }
    }
  }
}
