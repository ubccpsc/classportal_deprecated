#!/usr/bin / env node

// Gist by ibratoev: https://gist.github.com/ibratoev/0caca1b3b7a122595523f790e2620301

// Script to update typings to their latest versions.
// Note that it should be executed in the folder where typings.json is.
const { exec, execSync } = require('child_process');
const path = require('path');
const typings = require(path.join(process.cwd(), 'typings.json'));

exec('typings ls', (error, _, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    exit(1);
  }

  if (stderr) {
    lines = stderr.match(/[^\r\n]+/g);
    lines.forEach(line => {
      const re = /registry:(\S*)\/(\S*)(#|$)/;
      const m = re.exec(line);
      if (m !== null) {
        const [, source, name] = m;
        const isGlobal = typings.globalDependencies && typings.globalDependencies[name];
        const isLocal = typings.dependencies && typings.dependencies[name];
        if (isGlobal === isLocal) {
          console.error(`error searching for typings: ${name}`);
          exit(1);
        }
        console.log(`Updating typings for ${name}`);
        execSync(`typings i ${source}~${name} -S ${isGlobal ? '-G' : ''}`);
      }
    });
  }
  else {
    console.log("Typings are up to date.");
  }
});