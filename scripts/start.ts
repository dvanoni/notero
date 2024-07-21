/**
 * Set up environment for plugin development and start Zotero with plugin.
 *
 * @see https://www.zotero.org/support/dev/client_coding/plugin_development
 */
import assert from 'node:assert/strict';
import child_process, { StdioOptions } from 'node:child_process';
import path from 'node:path';

import fs from 'fs-extra';
import JSON5 from 'json5';

import pkg from '../package.json';

import { buildDir, rootDir } from './paths';

type Config = {
  profile?: {
    name?: string;
    path?: string;
  };
  scripts?: {
    prestart?: string;
    poststart?: string;
  };
  zotero?: {
    betaPath?: string;
    logFile?: string;
    path?: string;
    preserveLog?: boolean;
  };
};

const configFile = path.join(rootDir, 'zotero.config.json');
const configJson = fs.readFileSync(configFile, 'utf8');
const config = JSON5.parse<Config>(configJson);

const isBetaRun = process.argv.slice(2).includes('--beta');

function runScript(name: keyof Required<Config>['scripts']): void {
  const script = config.scripts?.[name];
  if (!script) return;

  console.group(`Running ${name} script`);
  console.log(`Command: ${script}`);

  try {
    child_process.execSync(script);
  } catch (err) {
    console.warn(String(err));
  }

  console.groupEnd();
}

function writePluginProxyFile(): void {
  const proxyFile = path.join(getProfilePath(), 'extensions', pkg.xpi.id);

  console.group('Writing plugin source path to proxy file');
  console.log(`Source path: ${buildDir}`);
  console.log(`Proxy file path: ${proxyFile}`);
  console.groupEnd();

  fs.outputFileSync(proxyFile, buildDir);
}

function resetPrefs(): void {
  const prefsFile = path.join(getProfilePath(), 'prefs.js');
  if (!fs.existsSync(prefsFile)) return;

  console.log('Resetting prefs.js');

  const prefsContent = fs
    .readFileSync(prefsFile, 'utf8')
    .replace(/user_pref\(.extensions\.lastAppBuildId.+$/m, '')
    .replace(/user_pref\(.extensions\.lastAppVersion.+$/m, '');

  fs.writeFileSync(prefsFile, prefsContent);
}

function getProfilePath(): string {
  assert.ok(
    config.profile?.path && fs.existsSync(config.profile.path),
    'Invalid profile path',
  );
  return config.profile.path;
}

function getStdio(): StdioOptions {
  const { logFile, preserveLog } = config.zotero || {};
  if (!logFile) return 'ignore';

  console.log(
    `${preserveLog ? 'Appending' : 'Writing'} to log file: ${logFile}`,
  );

  const flags = preserveLog ? 'a' : 'w';
  const out = fs.openSync(logFile, flags);
  const err = fs.openSync(logFile, flags);

  return ['ignore', out, err];
}

function getZoteroArgs(): string[] {
  const zoteroArgs = [
    '-purgecaches',
    '-ZoteroDebugText',
    '-datadir',
    'profile',
  ];

  if (isBetaRun) {
    zoteroArgs.push('-jsdebugger');
  } else {
    zoteroArgs.push('-jsconsole', '-debugger');
  }

  if (config.profile?.name) {
    zoteroArgs.push('-p', config.profile.name);
  }

  return zoteroArgs;
}

function getZoteroPath(): string {
  if (isBetaRun) {
    assert.ok(
      config.zotero?.betaPath && fs.existsSync(config.zotero.betaPath),
      'Invalid path to Zotero beta',
    );
    return config.zotero.betaPath;
  }
  if (config.zotero?.path) {
    assert.ok(fs.existsSync(config.zotero.path), 'Invalid path to Zotero');
    return config.zotero.path;
  }
  if (process.platform === 'darwin') {
    return '/Applications/Zotero.app/Contents/MacOS/zotero';
  }
  if (process.platform === 'linux') {
    return '/usr/lib/zotero/zotero';
  }
  if (process.platform === 'win32') {
    return 'C:/Program Files (x86)/Zotero/Zotero.exe';
  }

  throw new Error('Unrecognized platform');
}

function startZotero(): void {
  const zoteroPath = getZoteroPath();
  const zoteroArgs = getZoteroArgs();

  console.group(`Starting Zotero${isBetaRun ? ' beta' : ''}`);
  console.log(`Command: ${zoteroPath}`);
  console.log(`Arguments: ${zoteroArgs.join(' ')}`);

  const subprocess = child_process.spawn(zoteroPath, zoteroArgs, {
    detached: true,
    stdio: getStdio(),
  });

  subprocess.on('error', (err) => {
    console.error('Failed to start Zotero');
    console.error(err);
  });

  subprocess.unref();

  console.groupEnd();
}

runScript('prestart');
writePluginProxyFile();
resetPrefs();
startZotero();
runScript('poststart');
