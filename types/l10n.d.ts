declare namespace L10n {
  type L10nRegistry = unknown;

  type L10nResourceId = string;

  interface L10nArgs {
    [key: string]: string | number;
  }

  interface L10nIdArgs {
    id: string | null;
    args?: L10nArgs | null;
  }

  type L10nKey = string | L10nIdArgs;

  interface AttributeNameValue {
    name: string;
    value: string;
  }

  interface L10nMessage {
    value?: string;
    attributes?: AttributeNameValue[];
  }

  /**
   * @see https://searchfox.org/mozilla-esr102/source/dom/webidl/Localization.webidl
   */
  interface Localization {
    (
      resourceIds: L10nResourceId[],
      sync?: boolean,
      registry?: L10nRegistry,
      locales?: string[],
    ): Localization;

    addResourceIds(resourceIds: L10nResourceId[]): void;

    removeResourceIds(resourceIds: L10nResourceId[]): number;

    formatValue(id: string, args?: L10nArgs): Promise<string | null>;

    formatValues(keys: L10nKey[]): Promise<(string | null)[]>;

    formatMessages(keys: L10nKey[]): Promise<(L10nMessage | null)[]>;

    setAsync(): void;

    formatValueSync(id: string, args?: L10nArgs): string | null;

    formatValuesSync(keys: L10nKey[]): (string | null)[];

    formatMessagesSync(keys: L10nKey[]): (L10nMessage | null)[];
  }

  /**
   * @see https://searchfox.org/mozilla-esr102/source/dom/webidl/DOMLocalization.webidl
   */
  interface DOMLocalization extends Localization {
    connectRoot(element: Node): void;

    disconnectRoot(element: Node): void;

    pauseObserving(): void;

    resumeObserving(): void;

    setAttributes(element: Element, id: string, args?: object): void;

    getAttributes(element: Element): L10nIdArgs;

    translateFragment(node: Node): Promise<unknown>;

    translateElements(elements: Element[]): Promise<void>;

    translateRoots(): Promise<void>;
  }
}
