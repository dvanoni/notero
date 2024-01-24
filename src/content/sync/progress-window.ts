const NOTION_LOGO = 'chrome://notero/content/style/notion-logo-32.png';

function getIcon(type: 'tick' | 'warning') {
  return `chrome://zotero/skin/${type}${Zotero.hiDPISuffix}.png`;
}

export class ProgressWindow {
  private itemCount = 0;
  private failedCount = 0;
  private readonly totalItems: number;
  private readonly progressWindow: Zotero.ProgressWindow;
  private _itemProgress?: Zotero.ProgressWindow.ItemProgress;

  public constructor(totalItems: number) {
    this.totalItems = totalItems;

    this.progressWindow = new Zotero.ProgressWindow();
    this.progressWindow.changeHeadline('Syncing items to Notion...');
    this.progressWindow.show();

    // this.itemProgress = new this.progressWindow.ItemProgress(NOTION_LOGO, '');
  }

  private get itemProgress(): Zotero.ProgressWindow.ItemProgress {
    if (!this._itemProgress) {
      this._itemProgress = new this.progressWindow.ItemProgress('', '');
    }
    return this._itemProgress;
  }

  private startNewItemProgress() {
    this._itemProgress = undefined;
  }

  public startItem() {
    this.itemCount += 1;
    this.itemProgress.setText(`Item ${this.itemCount} of ${this.totalItems}`);
  }

  public completeItem() {
    const percentage = (this.itemCount / this.totalItems) * 100;
    this.itemProgress.setProgress(percentage);
  }

  public updateText(step: number) {
    this.itemProgress.setText(`Item ${step} of ${this.totalItems}`);
  }

  public updateProgress(step: number) {
    const percentage = (step / this.totalItems) * 100;
    this.itemProgress.setProgress(percentage);
  }

  public addItemError(item: Zotero.Item, errorMessage: string) {
    this.itemProgress.setError();
    this.itemProgress.setText(errorMessage);

    new this.progressWindow.ItemProgress(
      Zotero.ItemTypes.getImageSrc(item.itemType),
      item.getDisplayTitle(),
      this.itemProgress,
    );

    this.startNewItemProgress();
    this.failedCount += 1;
  }

  public complete() {
    if (this.failedCount === 0) {
      this.itemProgress.setIcon(getIcon('tick'));
      this.progressWindow.startCloseTimer();
    } else {
      this.itemProgress.setIcon(getIcon('warning'));
      this.itemProgress.setText(`Failed to sync ${this.failedCount} items`);
    }
  }

  public fail(errorMessage: string) {
    this.itemProgress.setError();
    this.itemProgress.setText(errorMessage);
  }
}
