/**
 * Start Zotero with plugin temporarily installed using web-ext.
 *
 * @see https://github.com/mozilla/web-ext
 * @see https://www.zotero.org/support/dev/client_coding/plugin_development
 */
import assert from 'node:assert/strict';
import path from 'node:path';

import fs from 'fs-extra';
import JSON5 from 'json5';
import { cmd, type MultiExtensionRunner } from 'web-ext';

import { build } from './build.mts';
import { buildDir, rootDir } from './utils/paths.mts';

type Config = {
  profile?: {
    path?: string;
  };
  zotero?: {
    betaPath?: string;
    devPath?: string;
    logFile?: string;
    path?: string;
    preserveLog?: boolean;
  };
};

type Version = 'beta' | 'dev' | null;

const configFile = path.join(rootDir, 'zotero.config.json');
const configJson = fs.readFileSync(configFile, 'utf8');
const config = JSON5.parse<Config>(configJson);

function getProfilePath(): string {
  assert.ok(
    config.profile?.path && fs.existsSync(config.profile.path),
    'Invalid profile path',
  );
  return config.profile.path;
}

function getValidatedManifest(sourceDir: string): Promise<unknown> {
  return fs.readJson(path.join(sourceDir, 'manifest.json'));
}

function getVersion(): Version {
  const args = process.argv.slice(2);
  if (args.includes('--beta')) return 'beta';
  if (args.includes('--dev')) return 'dev';
  return null;
}

function getZoteroArgs(version: Version): string[] {
  const zoteroArgs = ['-ZoteroDebugText', '-datadir', 'profile'];

  if (version === 'beta' || version === 'dev') {
    zoteroArgs.push('-jsdebugger');
  } else {
    zoteroArgs.push('-jsconsole', '-debugger');
  }

  return zoteroArgs;
}

function getZoteroPath(version: Version): string {
  if (version === 'beta' || version === 'dev') {
    const path = config.zotero?.[`${version}Path`];
    assert.ok(path && fs.existsSync(path), `Invalid path to Zotero ${version}`);
    return path;
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

async function startZotero(): Promise<void> {
  const profilePath = getProfilePath();
  const version = getVersion();
  const zoteroPath = getZoteroPath(version);
  const zoteroArgs = getZoteroArgs(version);

  console.group('Starting build watcher');
  const cleanup = await build({ sourcemap: true, watch: true });
  console.groupEnd();

  console.group(`Starting Zotero${version ? ` ${version}` : ''}`);
  console.log(`Command: ${zoteroPath}`);
  console.log(`Arguments: ${zoteroArgs.join(' ')}`);
  console.groupEnd();

  const extensionRunner = await cmd.run(
    {
      args: zoteroArgs,
      firefox: zoteroPath,
      firefoxProfile: profilePath,
      sourceDir: buildDir,
    },
    {
      getValidatedManifest,
    },
  );

  if (cleanup) {
    extensionRunner.registerCleanup(() => {
      void cleanup();
    });
  }

  writeToLogIfRequested(extensionRunner);
}

function writeToLogIfRequested(extensionRunner: MultiExtensionRunner): void {
  const { logFile, preserveLog } = config.zotero || {};
  if (!logFile) return;

  const { stderr, stdout } =
    extensionRunner.extensionRunners[0]?.runningInfo?.firefox || {};

  if (!stderr || !stdout) {
    console.warn('No stderr or stdout available for logging');
    return;
  }

  console.log(
    `${preserveLog ? 'Appending' : 'Writing'} to log file: ${logFile}`,
  );

  const flags = preserveLog ? 'a' : 'w';
  const logStream = fs.createWriteStream(logFile, { flags });

  const writeToLog = (data: unknown) => {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] ${String(data)}`);
  };

  stderr.on('data', writeToLog);
  stdout.on('data', writeToLog);

  extensionRunner.registerCleanup(() => {
    console.log('Closing log file');
    logStream.end();
  });
}

await startZotero();
