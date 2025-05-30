import { readNxJson, type Tree } from '@nx/devkit';
import {
  determineProjectNameAndRootOptions,
  ensureRootProjectName,
} from '@nx/devkit/src/generators/project-name-and-root-utils';
import { isUsingTsSolutionSetup } from '@nx/js/src/utils/typescript/ts-solution-setup';
import { type NxRemixGeneratorSchema } from '../schema';

export interface NormalizedSchema extends NxRemixGeneratorSchema {
  projectName: string;
  projectRoot: string;
  importPath: string;
  e2eProjectName: string;
  e2eProjectRoot: string;
  parsedTags: string[];
  isUsingTsSolutionConfig: boolean;
}

export async function normalizeOptions(
  tree: Tree,
  options: NxRemixGeneratorSchema
): Promise<NormalizedSchema> {
  await ensureRootProjectName(options, 'application');
  const { projectName, projectRoot, importPath } =
    await determineProjectNameAndRootOptions(tree, {
      name: options.name,
      projectType: 'application',
      directory: options.directory,
      rootProject: options.rootProject,
    });
  options.rootProject = projectRoot === '.';
  const nxJson = readNxJson(tree);
  const addPluginDefault =
    process.env.NX_ADD_PLUGINS !== 'false' &&
    nxJson.useInferencePlugins !== false;
  options.addPlugin ??= addPluginDefault;

  const isUsingTsSolutionConfig = isUsingTsSolutionSetup(tree);
  const appProjectName =
    !isUsingTsSolutionConfig || options.name ? projectName : importPath;

  const e2eProjectName = options.rootProject ? 'e2e' : `${appProjectName}-e2e`;
  const e2eProjectRoot = options.rootProject ? 'e2e' : `${projectRoot}-e2e`;

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    linter: options.linter ?? 'eslint',
    projectName: appProjectName,
    projectRoot,
    importPath,
    e2eProjectName,
    e2eProjectRoot,
    parsedTags,
    useTsSolution: isUsingTsSolutionConfig,
    isUsingTsSolutionConfig,
    useProjectJson: options.useProjectJson ?? !isUsingTsSolutionConfig,
  };
}
