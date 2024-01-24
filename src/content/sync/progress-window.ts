const NOTION_LOGO = 'chrome://notero/content/style/notion-logo-32.png';

const getTickIcon = () => `chrome://zotero/skin/tick${Zotero.hiDPISuffix}.png`;

export class ProgressWindow {
  private readonly itemCount: number;
  private readonly itemProgress: Zotero.ProgressWindow.ItemProgress;
  private readonly progressWindow: Zotero.ProgressWindow;

  public constructor(itemCount: number) {
    this.itemCount = itemCount;

    this.progressWindow = new Zotero.ProgressWindow();
    this.progressWindow.changeHeadline(
      'Syncing items to Notion...',
      NOTION_LOGO,
    );
    this.progressWindow.show();

    this.itemProgress = new this.progressWindow.ItemProgress('', '');
  }

  public updateText(step: number) {
    this.itemProgress.setText(`Item ${step} of ${this.itemCount}`);
  }

  public updateProgress(step: number) {
    const percentage = (step / this.itemCount) * 100;
    this.itemProgress.setProgress(percentage);
  }

  public complete() {
    this.itemProgress.setIcon(getTickIcon());
    this.progressWindow.startCloseTimer();
  }

  public fail(errorMessage: string, failedItem?: Zotero.Item) {
    if (failedItem) {
      new this.progressWindow.ItemProgress(
        Zotero.ItemTypes.getImageSrc(failedItem.itemType),
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
