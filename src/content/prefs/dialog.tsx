import { isFullPage } from '@notionhq/client';

import { getGlobalNotero, getXULElementById } from '../utils';
import { setMenuItems } from '../utils/elements';

import { getNoteroPref, NoteroPref } from './notero-pref';

type DialogArguments = {
  accepted: boolean;
  associatedLink: string;
  syncEnabled: boolean;
};

class Dialog {
  private collectionDialogContainer!: XUL.XULElement;
  private associatedLinkElement!: XUL.MenuListElement;
  private syncEnabledElement!: XUL.CheckboxElement;
  private params!: DialogArguments;

  public async init(): Promise<void> {
    await Zotero.uiReadyPromise;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    this.params = window.arguments![0]! as DialogArguments;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    this.collectionDialogContainer = getXULElementById(
      'notero-collection-dialog',
    )!;
    this.associatedLinkElement = getXULElementById('notero-associatedLink')!;

    const notero = getGlobalNotero();
    const pref = getNoteroPref(NoteroPref.linkedCollectionID);
    if (pref) {
      const client = await notero.getNotionClient();
      const res = await client.databases.query({ database_id: pref });
      const results = res.results
        .map((result: (typeof res.results)[0]) => {
          if (isFullPage(result)) {
            return {
              value: result.id,
              label: Object.values(result.properties).find(
                (prop) => prop.type === 'title',
              )?.title[0]!.plain_text,
            };
          }
        })
        .filter((item) => item != undefined);
      setMenuItems(this.associatedLinkElement, results);
    }

    this.associatedLinkElement.value = this.params.associatedLink;
    this.syncEnabledElement = getXULElementById('notero-syncEnabled')!;
    this.syncEnabledElement.checked = this.params.syncEnabled;
    document.addEventListener('dialogaccept', () => {
      return this.accept();
    });
  }
  accept(): boolean {
    // @ts-expect-error dataOut is not defined in the type
    window.arguments![0]!.dataOut = {
      associatedLink: this.associatedLinkElement.value,
      syncEnabled: this.syncEnabledElement.checked,
      accepted: true,
    };
    return true;
  }
}

module.exports = {
  dialog: new Dialog(),
};
