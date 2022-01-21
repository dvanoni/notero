/**
 * @see https://udn.realityripple.com/docs/Mozilla/Tech/XPCOM/Reference/Interface
 */
declare namespace XPCOM {
  interface nsITreeBoxObject {
    invalidate(): void;
    invalidateRow(index: number): void;
    rowCountChanged(index: number, count: number): void;
    beginUpdateBatch(): void;
    endUpdateBatch(): void;
  }

  interface nsITreeColumn {
    readonly cycler: boolean;
    readonly editable: boolean;
    readonly element: Element;
    readonly id: string;
    readonly index: number;
    readonly primary: boolean;
    readonly type: number;
    readonly width: number;
    readonly x: number;
  }

  interface nsITreeSelection {
    readonly count: number;
    currentColumn: nsITreeColumn;
    currentIndex: number;
    single: boolean;
    clearSelection(): void;
  }

  interface nsITreeView {
    readonly rowCount: number;
    selection: nsITreeSelection;
    canDrop?(index: number, orientation: number): boolean;
    cycleCell?(row: number, col: nsITreeColumn): void;
    cycleHeader(col: nsITreeColumn): void;
    drop?(row: number, orientation: number): void;
    getCellProperties?(row: number, col: nsITreeColumn): string;
    getCellText(row: number, col: nsITreeColumn): string;
    getCellValue?(row: number, col: nsITreeColumn): string;
    getColumnProperties?(col: nsITreeColumn): string;
    getImageSrc?(row: number, col: nsITreeColumn): string;
    getLevel(index: number): number;
    getParentIndex?(rowIndex: number): number;
    getProgressMode?(row: number, col: nsITreeColumn): number;
    getRowProperties?(index: number): string;
    hasNextSibling?(rowIndex: number, afterIndex: number): boolean;
    isContainer(index: number): boolean;
    isContainerEmpty?(index: number): boolean;
    isContainerOpen?(index: number): boolean;
    isEditable(row: number, col: nsITreeColumn): boolean;
    isSeparator(index: number): boolean;
    isSorted(): boolean;
    performAction?(action: string): void;
    performActionOnCell?(action: string, row: number, col: nsITreeColumn): void;
    performActionOnRow?(action: string, row: number): void;
    selectionChanged?(): void;
    setCellText?(row: number, col: nsITreeColumn, value: string): void;
    setCellValue?(row: number, col: nsITreeColumn, value: string): void;
    setTree?(tree: nsITreeBoxObject): void;
    toggleOpenState?(index: number): void;
  }
}
