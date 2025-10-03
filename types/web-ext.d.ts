declare module 'web-ext' {
  import type { ChildProcess } from 'node:child_process';

  // Common types
  export interface BaseOptions {
    sourceDir?: string;
    artifactsDir?: string;
    ignoreFiles?: string[];
    verbose?: boolean;
  }

  // Build command types
  export interface BuildOptions extends BaseOptions {
    asNeeded?: boolean;
    overwriteDest?: boolean;
    filename?: string;
  }

  export interface BuildResult {
    extensionPath: string;
  }

  // Run command types
  export interface RunOptions extends BaseOptions {
    browserConsole?: boolean;
    devtools?: boolean;
    pref?: Record<string, unknown>;
    firefox?: string;
    firefoxProfile?: string;
    profileCreateIfMissing?: boolean;
    keepProfileChanges?: boolean;
    noInput?: boolean;
    noReload?: boolean;
    preInstall?: boolean;
    watchFile?: string[];
    watchIgnored?: string[];
    startUrl?: string | string[];
    target?: string[];
    args?: string[];
    // Android CLI options
    adbBin?: string;
    adbHost?: string;
    adbPort?: number;
    adbDevice?: string;
    adbDiscoveryTimeout?: number;
    adbRemoveOldArtifacts?: boolean;
    firefoxApk?: string;
    firefoxApkComponent?: string;
    // Chromium CLI options
    chromiumBinary?: string;
    chromiumProfile?: string;
  }

  export interface RunDependencies {
    getValidatedManifest?: (sourceDir: string) => Promise<unknown>;
  }

  // Lint command types
  export interface LintOptions extends BaseOptions {
    boring?: boolean;
    metadata?: boolean;
    output?: 'json' | 'text';
    pretty?: boolean;
    privileged?: boolean;
    selfHosted?: boolean;
    warningsAsErrors?: boolean;
  }

  // Sign command types
  export interface SignOptions extends BaseOptions {
    amoBaseUrl?: string;
    apiKey?: string;
    apiProxy?: string;
    apiSecret?: string;
    timeout?: number;
    approvalTimeout?: number;
    channel?: 'listed' | 'unlisted';
    amoMetadata?: Record<string, unknown>;
    uploadSourceCode?: boolean;
    webextVersion?: string;
  }

  // Docs command types
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DocsOptions {
    // No specific options documented for docs command
  }

  // Dump config command types
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DumpConfigOptions extends BaseOptions {
    // Inherits from BaseOptions
  }

  // Extension runner types
  export interface ExtensionRunnerReloadResult {
    runnerName: string;
    reloadError?: Error;
    sourceDir?: string;
  }

  export interface RunningInfo {
    firefox: ChildProcess;
    debuggerPort: number;
  }

  export interface ExtensionRunner {
    getName(): string;
    run(): Promise<void>;
    reloadAllExtensions(): Promise<ExtensionRunnerReloadResult[]>;
    reloadExtensionBySourceDir(
      sourceDir: string,
    ): Promise<ExtensionRunnerReloadResult[]>;
    registerCleanup(cleanupCallback: () => void): void;
    exit(): Promise<void>;
    runningInfo?: RunningInfo;
  }

  export interface MultiExtensionRunner extends ExtensionRunner {
    extensionRunners: ExtensionRunner[];
  }

  // Main function types
  export interface MainOptions {
    getVersion?: (packageDir: string) => Promise<string>;
    commands?: Record<string, unknown>;
    argv?: string[];
    runOptions?: Record<string, unknown>;
  }

  // Command functions interface
  export interface CmdInterface {
    build(
      options?: BuildOptions,
      dependencies?: Record<string, unknown>,
    ): Promise<BuildResult>;
    run(
      options?: RunOptions,
      dependencies?: RunDependencies,
    ): Promise<MultiExtensionRunner>;
    lint(
      options?: LintOptions,
      dependencies?: Record<string, unknown>,
    ): Promise<void>;
    sign(
      options?: SignOptions,
      dependencies?: Record<string, unknown>,
    ): Promise<void>;
    docs(
      options?: DocsOptions,
      dependencies?: Record<string, unknown>,
    ): Promise<void>;
    dumpConfig(
      options?: DumpConfigOptions,
      dependencies?: Record<string, unknown>,
    ): Promise<void>;
  }

  // Main export interface
  export interface WebExtInterface {
    main(absolutePackageDir: string, options?: MainOptions): Promise<void>;
    cmd: CmdInterface;
  }

  // Default export
  const webext: WebExtInterface;
  // eslint-disable-next-line import-x/no-default-export
  export default webext;

  // Named exports
  export const main: WebExtInterface['main'];
  export const cmd: CmdInterface;
}
