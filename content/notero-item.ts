const APA_STYLE = 'bibliography=http://www.zotero.org/styles/apa';

export default class NoteroItem {
  private static getQuickCopyFormat(): string {
    const format = Zotero.Prefs.get('export.quickCopy.setting');

    if (typeof format === 'string' && format) {
      return format;
    }
    return APA_STYLE;
  }

  private readonly zoteroItem: Zotero.Item;
  private _fullCitation?: string | null;
  private _inTextCitation?: string | null;

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

  private getCitation(format: string, inTextCitation: boolean): Promise<string | null> {
    return new Promise(resolve => {
      const result = Zotero.QuickCopy.getContentFromItems(
        [this.zoteroItem],
        format,
        (obj, worked) => {
          resolve(worked ? obj.string.trim() : null);
        },
        inTextCitation
      );

      if (result === false) {
        resolve(null);
      } else if (result !== true) {
        resolve(result.text.trim());
      }
    });
  }

  public async getFullCitation(): Promise<string | null> {
    if (this._fullCitation === undefined) {
      this._fullCitation = await this.getCitation(NoteroItem.getQuickCopyFormat(), false);
    }
    return this._fullCitation;
  }

  public async getInTextCitation(): Promise<string | null> {
    if (this._inTextCitation === undefined) {
      this._inTextCitation = await this.getCitation(APA_STYLE, true);
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
