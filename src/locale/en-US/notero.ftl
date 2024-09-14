## Menus

notero-collection-menu-sync =
    .label = Sync Items to Notion
notero-item-menu-sync =
    .label = Sync to Notion
notero-tools-menu-preferences =
    .label = Notero Preferences…

## Notion preferences

notero-preferences-notion-groupbox-heading = Notion Preferences
notero-preferences-notion-groupbox-description = For instructions on obtaining these values, view the <label data-l10n-name="notero-preferences-readme">README</label>.
notero-preferences-notion-token = Integration Token:
notero-preferences-notion-token-visibility =
    .tooltiptext = { $action ->
        [conceal] Conceal token
       *[reveal] Reveal token
    }
notero-preferences-notion-database = Database:

## Property preferences

notero-preferences-properties-groupbox-heading = Property Preferences
notero-preferences-properties-groupbox-description = Customize how item properties sync to Notion.
notero-preferences-page-title-format = Notion Page Title:

## Page title format options

notero-page-title-format-item-author-date-citation =
    .label = Item Author-Date Citation
notero-page-title-format-item-citation-key =
    .label = Item Citation Key (requires Better-BibTeX)
notero-page-title-format-item-full-citation =
    .label = Item Full Citation
notero-page-title-format-item-in-text-citation =
    .label = Item In-Text Citation
notero-page-title-format-item-short-title =
    .label = Item Short Title
notero-page-title-format-item-title =
    .label = Item Title

## Sync preferences

notero-preferences-sync-groupbox-heading = Sync Preferences
notero-preferences-sync-groupbox-description1 = Notero will monitor the collections enabled below. Items in the enabled collections will sync to Notion when added to that collection and whenever the items are modified.
notero-preferences-sync-groupbox-description2 = To enable/disable a collection, either select the row and press the {"[Enter]"} key or double-click the row. To select multiple rows, hold {"[Shift]"} and then click.
notero-preferences-collection-column = Collection
notero-preferences-sync-enabled-column = Sync Enabled
notero-preferences-sync-on-modify-items =
    .label = Sync when items are modified
notero-preferences-sync-notes =
    .label = Sync notes

## Errors

notero-error-missing-notion-database = Notion database not selected. Please select your database in Notero preferences.
notero-error-missing-notion-token = Notion integration token not provided. Please enter your token in Notero preferences.
notero-error-missing-pref = Missing value for { $pref }. Please enter it in Notero preferences.
notero-error-no-notion-databases = No Notion databases are accessible.
notero-error-note-conversion-failed = Failed to convert note content to Notion blocks.
notero-error-note-parent-not-synced = Cannot sync note for item that is not synced.
notero-error-note-sync-failed = Failed to sync note to Notion.
notero-error-notion-link-attachment = Failed to create Notion link attachment. This will result in duplicate Notion pages. Please ensure that the "read content" capability is enabled for the Notero integration at www.notion.so/my-integrations.
