type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

type ProxiedMethod = keyof typeof PROXIED_METHODS;

const LOG_PREFIX = '[Notero]';

const STYLED_LOG_PREFIX = [
  `%c${LOG_PREFIX}`,
  'color: #19855A; font-weight: bold',
];

const PROXIED_METHODS = {
  debug: 'DEBUG',
  error: 'ERROR',
  group: 'INFO',
  groupCollapsed: 'INFO',
  info: 'INFO',
  log: 'INFO',
  warn: 'WARN',
} as const satisfies Partial<Record<keyof Console, LogLevel>>;

const LEVEL_MAX_LENGTH = Math.max(
  ...Object.values(PROXIED_METHODS).map((level) => level.length),
);

let indentation = 0;

let zoteroConsole: Console | undefined;

function getLogLevel(method: ProxiedMethod): LogLevel {
  return PROXIED_METHODS[method];
}

function getZoteroConsole(): Console | undefined {
  zoteroConsole = Zotero.getMainWindow()?.console ?? zoteroConsole;
  return zoteroConsole;
}

function isProxiedMethod(
  prop: string | number | symbol,
): prop is ProxiedMethod {
  return prop in PROXIED_METHODS;
}

function noOp() {}

function printLevel(level: LogLevel): string {
  return `[${level.padEnd(LEVEL_MAX_LENGTH)}]`;
}

function printIndentation(): string {
  return '\t'.repeat(indentation);
}

function printLogArg(arg: unknown): string {
  if (!(arg instanceof Error)) return String(arg);

  let message = String(arg);
  if (arg.stack) message += `\n${arg.stack}`;
  if (arg.cause) message += `\nCaused by: ${printLogArg(arg.cause)}`;
  return message;
}

function zoteroDebug(level: LogLevel, args: unknown[]): void {
  const message = args.map(printLogArg).join(' ');
  Zotero.debug(
    `${LOG_PREFIX}${printLevel(level)} ${printIndentation()}${message}`,
  );
}

export const logger = new Proxy(
  {},
  {
    get(_, prop, receiver) {
      const console = getZoteroConsole();

      if (prop === 'groupEnd') {
        indentation -= 1;
      }

      if (!isProxiedMethod(prop)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return console ? Reflect.get(console, prop, receiver) : noOp;
      }

      return function (...args: unknown[]) {
        console?.[prop](...STYLED_LOG_PREFIX, ...args);
        zoteroDebug(getLogLevel(prop), args);

        if (prop === 'group' || prop === 'groupCollapsed') {
          indentation += 1;
        }
      };
    },
  },
) as Console;
