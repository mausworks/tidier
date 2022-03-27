import { Project, TIDIER_CONFIG_NAME } from "tidier-core";
import { basename, dirname } from "path";
import {
  workspace,
  FileDeleteEvent,
  ExtensionContext,
  Disposable,
  FileCreateEvent,
  FileRenameEvent,
  TextDocument,
} from "vscode";
import { registerCommands } from "./commands";
import { TidierContext } from "./context";
import { VSCodeFolder } from "./folder";
import * as output from "./output";
import {
  handleProjectReload,
  handleLoadProject,
  discoverProjectsInWorkspace,
} from "./project";
import { showProblemsDetectedDialog } from "./ui";

const disposables: Disposable[] = [];
const tidier = new TidierContext();

export async function activate(_: ExtensionContext) {
  output.registerOutputChannel();
  output.log("Tidier activated. 🧹");

  disposables.push(workspace.onDidDeleteFiles(onDeleteFiles));
  disposables.push(workspace.onDidSaveTextDocument(onSaveFile));
  disposables.push(workspace.onDidCreateFiles(onCreateFile));
  disposables.push(workspace.onDidRenameFiles(onRenameFiles));

  registerCommands(tidier);

  if (workspace.workspaceFolders) {
    await discoverProjectsInWorkspace(
      tidier.projects,
      workspace.workspaceFolders
    );
    const entries = await tidier.detectProblems();

    for (const [project] of entries) {
      showProblemsDetectedDialog(tidier, project);
    }
  }
}

export function deactivate() {
  output.log("Tidier deactivated. 👋");
  output.unregisterOutputChannel();

  disposables.forEach((disposable) => disposable.dispose());
}

async function onCreateFile(event: FileCreateEvent) {
  for (const uri of event.files) {
    const name = basename(uri.fsPath);

    if (name === TIDIER_CONFIG_NAME) {
      const folderUri = uri.with({ path: dirname(uri.path) });
      const folder = new VSCodeFolder(folderUri);
      const project = await Project.load(folder);

      tidier.projects.add(project);
    } else {
      await tidier.handle(uri);
    }
  }
}

async function onRenameFiles(event: FileRenameEvent) {
  for (const { oldUri, newUri } of event.files) {
    await tidier.handle(newUri);
    await tidier.removeProblem(oldUri);
  }
}

async function onSaveFile({ uri }: TextDocument) {
  const name = basename(uri.path);

  if (name === TIDIER_CONFIG_NAME || name === ".gitignore") {
    const folderPath = dirname(uri.path);
    const project = tidier.projects.find(folderPath);

    if (project) {
      await handleProjectReload(tidier, project);
    } else if (name !== ".gitignore") {
      const folderUri = uri.with({ path: folderPath });

      await handleLoadProject(tidier, folderUri);
    }
  }
}

async function onDeleteFiles({ files }: FileDeleteEvent) {
  for (const uri of files) {
    tidier.removeProblem(uri);

    const name = basename(uri.path);

    if (name === TIDIER_CONFIG_NAME) {
      const project = tidier.projects.bestMatch(uri.path);

      if (project) {
        tidier.projects.remove(project.folder.path);
        output.log(`Unloaded project at ${project.folder.path}`);
      }
    } else if (name === ".gitignore") {
      const project = tidier.projects.bestMatch(uri.path);

      if (project) {
        await handleProjectReload(tidier, project);
      }
    }
  }
}
