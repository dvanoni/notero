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

function isProxiedMethod(
  prop: string | number | symbol,
): prop is ProxiedMethod {
  return prop in PROXIED_METHODS;
}

function getLogLevel(method: ProxiedMethod): LogLevel {
  return PROXIED_METHODS[method];
}

const LEVEL_MAX_LENGTH = Math.max(
  ...Object.values(PROXIED_METHODS).map((level) => level.length),
);

function printLevel(level: LogLevel): string {
  return `[${level.padEnd(LEVEL_MAX_LENGTH)}]`;
}

let indentation = 0;

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

export const logger = new Proxy(Zotero.getMainWindow().console, {
  get(target, prop, receiver) {
    Zotero.debug(`NOTERO TARGET: ${String(target)}`);

    if (prop === 'groupEnd') {
      indentation -= 1;
    }

    if (!isProxiedMethod(prop)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.get(target, prop, receiver);
    }

    return function (...args: unknown[]) {
      target[prop](...STYLED_LOG_PREFIX, ...args);
      zoteroDebug(getLogLevel(prop), args);

      if (prop === 'group' || prop === 'groupCollapsed') {
        indentation += 1;
      }
    };
  },
});
