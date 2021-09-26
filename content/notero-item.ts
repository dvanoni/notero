export default class NoteroItem {
  private static getQuickCopyFormat(): string {
    const format = Zotero.Prefs.get('export.quickCopy.setting');

    if (typeof format === 'string' && format) {
      return format;
    }
    return 'bibliography=http://www.zotero.org/styles/apa';
  }

  private zoteroItem: Zotero.Item;
  private _fullCitation?: string;
  private _inTextCitation?: string;

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
    if (!this._fullCitation) {
      const content = Zotero.QuickCopy.getContentFromItems(
        [this.zoteroItem],
        NoteroItem.getQuickCopyFormat()
      );
      this._fullCitation = content.text.trim();
    }
    return this._fullCitation;
  }

  public get inTextCitation(): string {
    if (!this._inTextCitation) {
      const content = Zotero.QuickCopy.getContentFromItems(
        [this.zoteroItem],
        NoteroItem.getQuickCopyFormat(),
        undefined,
        true
      );
      this._inTextCitation = content.text.trim();
    }
    return this._inTextCitation;
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
