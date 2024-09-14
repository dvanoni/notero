declare namespace L10n {
  type L10nRegistry = unknown;

  type L10nResourceId = string;

  interface L10nArgs {
    [key: string]: string | number;
  }

  interface L10nIdArgs<I extends string> {
    id: I | null;
    args?: L10nArgs | null;
  }

  type L10nKey<I extends string> = I | L10nIdArgs<I>;

  interface AttributeNameValue {
    name: string;
    value: string;
  }

  interface L10nMessage {
    value?: string;
    attributes?: AttributeNameValue[];
  }

  /**
   * @see https://searchfox.org/mozilla-esr115/source/dom/webidl/Localization.webidl
   */
  interface Localization<I extends string = string> {
    (
      resourceIds: L10nResourceId[],
      sync?: boolean,
      registry?: L10nRegistry,
      locales?: string[],
    ): Localization;

    addResourceIds(resourceIds: L10nResourceId[]): void;

    removeResourceIds(resourceIds: L10nResourceId[]): number;

    formatValue(id: I, args?: L10nArgs): Promise<string | null>;

    formatValues(keys: L10nKey<I>[]): Promise<(string | null)[]>;

    formatMessages(keys: L10nKey<I>[]): Promise<(L10nMessage | null)[]>;

    setAsync(): void;

    formatValueSync(id: I, args?: L10nArgs): string | null;

    formatValuesSync(keys: L10nKey<I>[]): (string | null)[];

    formatMessagesSync(keys: L10nKey<I>[]): (L10nMessage | null)[];
  }

  /**
   * @see https://searchfox.org/mozilla-esr115/source/dom/webidl/DOMLocalization.webidl
   */
  interface DOMLocalization<I extends string = string> extends Localization<I> {
    connectRoot(element: Node): void;

    disconnectRoot(element: Node): void;

    pauseObserving(): void;

    resumeObserving(): void;

    setAttributes(element: Element, id: I, args?: object): void;

    getAttributes(element: Element): L10nIdArgs<I>;

    setArgs(element: Element, args?: object): void;

    translateFragment(node: Node): Promise<unknown>;

    translateElements(elements: Element[]): Promise<void>;

    translateRoots(): Promise<void>;
  }
}
