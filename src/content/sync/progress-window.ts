import { FluentMessageId } from '../../locale/fluent-types';

export class ProgressWindow {
  private readonly itemCount: number;
  private itemProgress!: Zotero.ProgressWindow.ItemProgress;
  private readonly l10n: L10n.Localization<FluentMessageId>;
  private readonly progressWindow: Zotero.ProgressWindow;

  public constructor(itemCount: number, window: Window) {
    this.itemCount = itemCount;
    this.l10n = window.document.l10n;
    this.progressWindow = new Zotero.ProgressWindow({ window });
  }

  public async show() {
    const headline = await this.l10n.formatValue('notero-progress-headline');
    this.progressWindow.changeHeadline(headline || 'Syncing items to Notion…');
    this.progressWindow.show();
    this.itemProgress = new this.progressWindow.ItemProgress('document', '');
  }

  public async updateText(step: number) {
    const args = { step, total: this.itemCount };
    const message =
      (await this.l10n.formatValue('notero-progress-item', args)) ||
      `Item ${step} of ${this.itemCount}`;
    this.itemProgress.setText(message);
  }

  public updateProgress(step: number) {
    const percentage = (step / this.itemCount) * 100;
    this.itemProgress.setProgress(percentage);
  }

  public complete() {
    this.progressWindow.startCloseTimer();
  }

  public fail(errorMessage: string, failedItem?: Zotero.Item) {
    if (failedItem) {
      new this.progressWindow.ItemProgress(
        failedItem.itemType,
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
