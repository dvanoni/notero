const getTickIcon = () => `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`;

export class ProgressWindow {
  private readonly itemCount: number;
  private readonly itemProgress: Zotero.ProgressWindow.ItemProgress;
  private readonly progressWindow: Zotero.ProgressWindow;
  private readonly useNewIcons: boolean;

  public constructor(itemCount: number) {
    this.itemCount = itemCount;

    this.progressWindow = new Zotero.ProgressWindow();
    this.progressWindow.changeHeadline('Syncing items to Notion…');
    this.progressWindow.show();

    this.itemProgress = new this.progressWindow.ItemProgress('document', '');

    // See https://github.com/zotero/zotero/pull/4047
    this.useNewIcons =
      typeof this.itemProgress.setItemTypeAndIcon === 'function';
  }

  public updateText(step: number) {
    this.itemProgress.setText(`Item ${step} of ${this.itemCount}`);
  }

  public updateProgress(step: number) {
    const percentage = (step / this.itemCount) * 100;
    this.itemProgress.setProgress(percentage);
  }

  public complete() {
    if (typeof this.itemProgress.setIcon === 'function') {
      this.itemProgress.setIcon(getTickIcon());
    }
    this.progressWindow.startCloseTimer();
  }

  public fail(errorMessage: string, failedItem?: Zotero.Item) {
    if (failedItem) {
      const iconSrc = this.useNewIcons
        ? failedItem.itemType
        : Zotero.ItemTypes.getImageSrc(failedItem.itemType);
      new this.progressWindow.ItemProgress(
        iconSrc,
        failedItem.getDisplayTitle(),
        this.itemProgress,
      ).setProgress(100);
      new this.progressWindow.ItemProgress('', errorMessage).setError();
    } else {
      this.itemProgress.setError();
      this.itemProgress.setText(errorMessage);
      this.progressWindow.addDescription(''); // Hack to force window resize
    }
  }
}
