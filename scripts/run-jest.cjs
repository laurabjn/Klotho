// Runs the Jest version declared by the current workspace.
//
// The mobile app is on Jest 29 (pinned by jest-expo) while the API and packages
// are on Jest 30. The `jest` binary uses import-local, which resolves `jest-cli`
// from the working directory and can pick the other major depending on how npm
// hoisted it. Resolving `jest-cli` next to the workspace's own `jest` avoids that.
const path = require('node:path');

const jestDir = path.dirname(
  require.resolve('jest/package.json', { paths: [process.cwd()] }),
);
const jestCli = require.resolve('jest-cli', { paths: [jestDir] });

require(jestCli).run();
