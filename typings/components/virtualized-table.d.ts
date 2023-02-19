declare module 'components/virtualized-table' {
  type Column<DataKey extends string> = {
    /** Required, see use in ItemTree#_getRowData() */
    dataKey: DataKey;
    /** Default: 1. -1 for descending sort */
    defaultSort?: number;
    hidden?: boolean;
    /** Default: 1. When the column is added to the tree how much space it should occupy as a flex ratio */
    flex?: number;
    /** A column width instead of flex ratio. See above. */
    width?: number;
    /** Default: false. Set to true to disable column resizing */
    fixedWidth?: boolean;
    /** Default: false. Set to true to prevent columns from changing width when the width of the tree increases or decreases */
    staticWidth?: boolean;
    /** Override the default [20px] column min-width for resizing */
    minWidth?: number;
    /** The column label. Either a string or the id to an i18n string. */
    label: string;
    /** Set an Icon label instead of a text-based one */
    iconLabel?: React.Component;
    type?: string;
    /** Which column properties should be persisted between zotero close */
    zoteroPersist?: Set<string>;
  };

  type RenderItem<DataKey extends string> = (
    index: number,
    selection: TreeSelection,
    oldElem: Element | null,
    columns: (Column<DataKey> & { className: string })[]
  ) => Element;

  export class TreeSelection {
    /** The selection "pivot". This is the first item the user selected as part of a ranged select (i.e. shift-select). */
    pivot: number;
    /** The currently selected/focused item. */
    focused: number;
    /** The number of selected items */
    count: number;
    /** The set of currently selected items */
    selected: Set<number>;
    /** Controls whether select events are triggered on selection change. */
    selectEventsSuppressed: boolean;
    /**
     * Returns whether the given index is selected.
     * @param index The index is 0-clamped.
     */
    isSelected(index: number): boolean;
    /**
     * Toggles an item's selection state, updates focused item to index.
     * @param index The index is 0-clamped.
     * @param shouldDebounce Whether the update to the tree should be debounced
     */
    toggleSelect(index: number, shouldDebounce: boolean): void;
    clearSelection(): void;
    /**
     * Selects an item, updates focused item to index.
     * @param index The index is 0-clamped.
     * @param shouldDebounce Whether the update to the tree should be debounced
     * @returns False if nothing to select and select handlers won't be called
     */
    select(index: number, shouldDebounce: boolean): boolean;
  }

  export type VirtualizedTableProps<DataKey extends string> = {
    id: string;
    getRowCount: () => number;
    renderItem: RenderItem<DataKey>;
    /** Row height specified as lines of text per row. Defaults to 1 */
    linesPerRow?: number;
    /** Do not adjust for Zotero-defined font scaling */
    disableFontSizeScaling?: boolean;
    /** An array of two elements for alternating row colors */
    alternatingRowColors?: string[];
    /** For screen-readers */
    label?: string;
    role?: string;
    showHeader?: boolean;
    /** Array of column objects like the ones in itemTreeColumns.js */
    columns: readonly Column<DataKey>[];
    onColumnPickerMenu?: (event: Event) => void;
    onColumnSort?: (index: number, sortDirection: number) => void;
    getColumnPrefs?: () => { [dataKey in DataKey]: unknown };
    storeColumnPrefs?: (prefs: {
      [dataKey in DataKey]: unknown;
    }) => void;
    getDefaultColumnOrder?: () => { [dataKey in DataKey]: number };
    /** Makes columns unmovable, unsortable, etc */
    staticColumns?: boolean;
    /** Used for initial column widths calculation */
    containerWidth?: number;
    /** Internal windowed-list ref */
    treeboxRef?: (list: WindowedList) => void;
    /** Render with display: none */
    hide?: boolean;
    multiSelect?: boolean;
    onSelectionChange?: (
      selection: TreeSelection,
      shouldDebounce: boolean
    ) => void;
    // The below are for arrow-key navigation
    isSelectable?: (index: number) => boolean;
    getParentIndex?: (index: number) => number;
    isContainer?: (index: number) => boolean;
    isContainerEmpty?: (index: number) => boolean;
    isContainerOpen?: (index: number) => boolean;
    toggleOpenState?: (index: number) => void;
    /** A function with signature (index:Number) => result:String which will be used
     * for find-as-you-type navigation. Find-as-you-type is disabled if prop is undefined. */
    getRowString?: (index: number) => string;
    /** If you want to perform custom key handling it should be in this function
     *  if it returns false then virtualized-table's own key handler won't run */
    onKeyDown?: (event: KeyboardEvent) => boolean;
    onKeyUp?: (event: KeyboardEvent) => void;
    onDragOver?: (event: MouseEvent) => void;
    onDrop?: (event: MouseEvent) => void;
    /** Enter, double-clicking */
    onActivate?: (event: KeyboardEvent | MouseEvent, indices: number[]) => void;
    onFocus?: (event: FocusEvent) => void;
    onItemContextMenu?: (
      event: KeyboardEvent | MouseEvent,
      x: number,
      y: number
    ) => void;
  };

  class VirtualizedTable<DataKey extends string> extends React.Component<
    VirtualizedTableProps<DataKey>
  > {
    /** Invalidates the underlying windowed-list */
    invalidate(): void;
    /** Rerender a row in the underlying windowed-list */
    invalidateRow(index: number): void;
    readonly selection: TreeSelection;
  }

  export function renderCell<DataKey extends string>(
    index: number,
    data: unknown,
    column: Column<DataKey>
  ): HTMLSpanElement;

  export function renderCheckboxCell<DataKey extends string>(
    index: number,
    data: unknown,
    column: Column<DataKey>
  ): HTMLSpanElement;

  export function makeRowRenderer<DataKey extends string>(
    getRowData: (index: number) => { [dataKey: string]: unknown }
  ): RenderItem<DataKey>;

  // eslint-disable-next-line import/no-default-export
  export default VirtualizedTable;

  class WindowedList {}
}
