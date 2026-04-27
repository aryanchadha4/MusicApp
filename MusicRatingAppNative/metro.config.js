const path = require('path');
const fs = require('fs');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const sharedSrcRoot = path.resolve(workspaceRoot, 'src');
const projectNodeModules = path.resolve(projectRoot, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');

function resolvePackage(name) {
  const localPath = path.join(projectNodeModules, name);
  if (fs.existsSync(localPath)) return localPath;
  return path.join(workspaceNodeModules, name);
}

const config = {
  // Only watch the shared source tree we import from this workspace.
  // Watching the entire repo quickly exhausts file watchers on macOS.
  watchFolders: [sharedSrcRoot],
  resolver: {
    disableHierarchicalLookup: true,
    nodeModulesPaths: [projectNodeModules, workspaceNodeModules],
    extraNodeModules: new Proxy(
      {},
      {
        get: (_target, name) => resolvePackage(name),
      }
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
