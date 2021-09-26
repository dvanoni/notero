export default class NoteroItem {
  private static getQuickCopyFormat(): string {
    const format = Zotero.Prefs.get('export.quickCopy.setting');

    if (typeof format === 'string' && format) {
      return format;
    }
    return 'bibliography=http://www.zotero.org/styles/apa';
  }

  private zoteroItem: Zotero.Item;

  public constructor(zoteroItem: Zotero.Item) {
    this.zoteroItem = zoteroItem;
  }

  public get authors(): string[] {
    return this.zoteroItem
      .getCreators()
      .map(({ firstName, lastName }) => `${lastName}, ${firstName}`);
  }

  public get doi(): string | null {
    return this.zoteroItem.getField('DOI') || null;
  }

  public get fullCitation(): string {
    const content = Zotero.QuickCopy.getContentFromItems(
      [this.zoteroItem],
      NoteroItem.getQuickCopyFormat()
    );
    return content.text.trim();
  }

  public get inTextCitation(): string {
    const content = Zotero.QuickCopy.getContentFromItems(
      [this.zoteroItem],
      NoteroItem.getQuickCopyFormat(),
      undefined,
      true
    );
    return content.text.trim();
  }

  public get itemType(): string {
    return Zotero.ItemTypes.getLocalizedString(this.zoteroItem.itemTypeID);
  }

  public get title(): string {
    return this.zoteroItem.getDisplayTitle();
  }

  public get url(): string | null {
    return this.zoteroItem.getField('url') || null;
  }

  public get year(): number | null {
    const year = Number.parseInt(this.zoteroItem.getField('year') || '');
    return Number.isNaN(year) ? null : year;
  }

  public get zoteroURI(): string {
    return Zotero.URI.getItemURI(this.zoteroItem);
  }
}
