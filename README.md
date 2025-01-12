# Notero

[![Latest release](https://img.shields.io/github/v/release/dvanoni/notero)](https://github.com/dvanoni/notero/releases/latest)
[![Total downloads](https://img.shields.io/github/downloads/dvanoni/notero/latest/total?sort=semver)][download]
[![Works with Zotero](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fdvanoni%2Fnotero%2Fmain%2Fpackage.json&query=%24.xpi.zoteroMinVersion&prefix=v&suffix=%2B&logo=zotero&label=Works%20with%20Zotero&color=%23CC2936)](https://www.zotero.org/)
[![Buy me a coffee](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapp.buymeacoffee.com%2Fapi%2Fcreators%2Fslug%2Fdvanoni&query=%24.data.public_supporters_count&prefix=%F0%9F%92%9C%20&style=social&logo=buymeacoffee&label=Buy%20me%20a%20coffee)](https://www.buymeacoffee.com/dvanoni)

Notero is a [Zotero plugin](https://www.zotero.org/support/plugins) for syncing
items and notes into [Notion](https://www.notion.so/product). To use it:

1. 💾 [Install][] the Notero plugin into Zotero.
2. 📔 [Connect][] and configure your Notion database.
3. 📁 Choose your Zotero collections to monitor.
4. 📝 Add or update items in your collections.
5. 🔄 Watch your items sync into Notion!

[Install]: #install-and-configure-notero-plugin
[Connect]: #connect-to-notion

![Notero in action](docs/notero.gif)

Concept by [@arhoff](https://github.com/arhoff) 👩🏻‍🔬 |
Built with 💜 by [@dvanoni](https://github.com/dvanoni)

## Table of Contents

- [Why Use Notero?](#why-use-notero)
- [How Notero Works](#how-notero-works)
- [Installation and Setup](#installation-and-setup)
- [Usage Guides](#usage-guides)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Example Notion Databases](#example-notion-databases)
- [Development](#development)

## Why Use Notero?

- Integrate your reference manager, task list, reading notes, analytical tables,
  and drafts in one location.
- Easily link to references when writing in Notion.
- Create custom views to filter and sort large reference lists by project,
  tag, author, etc.
- Backlinks make it easy to locate any of the notes and drafts that mention
  a reference.
- Link references to entries in other databases, such as projects, tasks,
  manuscripts in your publication pipeline, publishing outlets, etc.

## How Notero Works

The Notero plugin watches for Zotero items being added to or modified within
any collections that you specify in the Notero preferences. Whenever an item
is added or modified, Notero does a few things:

- Save a page with the Zotero item's properties (title, authors, etc.) into the
  Notion database specified in Notero preferences.
- Add a `notion` tag to the Zotero item.
- Add an attachment to the Zotero item that links to the page in Notion.

In addition to providing a convenient way to open a Notion page from Zotero,
the link attachment also serves as a reference for Notero so that it can update
the corresponding Notion page for a given Zotero item.

### Syncing Items

By default, Notero will sync items in your monitored collections whenever they
are modified. You can disable this functionality by unchecking the **Sync when
items are modified** option in the Notero preferences.

You can also sync items from the collection or item context menus (right-click):

- To sync all items in a collection, open the context menu for the collection
  and select **Sync Items to Notion**.
- To sync one item or multiple items, select the item(s) in the main pane, open
  the context menu, and select **Sync to Notion**.

> [!NOTE]
> To prevent the "sync on modify" functionality from saving to Notion multiple
> times, Notero does not notify Zotero when the tag and link attachment are
> added to an item. This means they may not appear in Zotero immediately, and
> you may need to navigate to a different item and back to make them appear.

### Syncing Notes and PDF Annotations

Zotero notes associated with an item can be synced into Notion as content of the
corresponding page for that item. As with regular items, you can manually sync
notes using the **Sync to Notion** option in the context menu.

Automatic syncing of notes can be enabled via the **Sync notes** option in the
Notero preferences. When enabled, notes will automatically sync whenever they
are modified. Additionally, when a regular item is synced, all of its notes will
also sync if they have not already.

To sync annotations (notes and highlights) from a PDF, you'll first need to
extract them into a Zotero note:

1. Select an item or PDF, open the context menu, and select
   **Add Note from Annotations**.
2. If desired, enable highlight colors from the menu at the top-right of the
   note panel.

<details>
  <summary>Example of creating a note from PDF annotations</summary>
  <video src="https://github.com/dvanoni/notero/assets/299357/4cda5dc7-ba5b-4f5a-8f53-d6bc2c44b1dc" />
</details>

## Installation and Setup

Using Notero involves installing the plugin in Zotero and connecting it to a
Notion database. Detailed setup instructions are below.

### Install and Configure Notero Plugin

> [!IMPORTANT]
>
> - The latest release of Notero requires Zotero 7.0 or above.
> - Support for Zotero 6.0.27 and above is available in Notero [v0.5.17][].
> - See the [changelog](CHANGELOG.md) for all release notes.

1. [Download][] the latest release of the `.xpi` file.
   - Note for Firefox users: You'll need to right-click the above download link
     and choose **Save Link As...** in order to properly download the file.
   - If the above download link does not work, you can download the `.xpi` file
     from the **Assets** section of the [latest release][] page.
2. Open the Zotero Plugins Manager via the **Tools → Plugins** menu item.
3. Install the `.xpi` file by either:
   - dragging and dropping it into the Plugins Manager window _or_
   - selecting it using the **Install Plugin From File...** option in the
     gear menu in the top-right corner of the window
4. Open the Notero preferences from either the **Tools → Notero Preferences...**
   menu item or the sidebar in the main Zotero preferences window.
5. Configure the Notero preferences as desired.

[download]: https://download.notero.vanoni.dev
[latest release]: https://github.com/dvanoni/notero/releases/latest
[v0.5.17]: https://github.com/dvanoni/notero/releases/tag/v0.5.17

### Connect to Notion

> [!NOTE]
>
> Prior to version 1.0.0, Notero required you to create your own Notion internal
> integration and manually set the integration secret in the Notero preferences.
> This is no longer necessary as Notero now uses a public integration with an
> authentication flow provided by Notion.
>
> If you previously set up Notero with an internal integration, you can click
> the **Upgrade Connection** button in the Notero preferences to switch to the
> public integration as described below (starting at step 2). Once complete, you
> can delete your internal integration from
> https://www.notion.so/profile/integrations.

1. Start the Notion connection process by clicking the **Connect to Notion**
   button in the Notero preferences. This will open the Notion connection page
   in your default web browser.
2. On the Notion connection page, select your desired workspace from the menu
   at the top (if you have multiple). Then, click **Next**.
3. On the next page, choose whether you want to use a template database or
   connect to an existing database page.
   - If you choose to use a template, the [basic example](#basic-example)
     database will be duplicated into your workspace.
   - If you choose to select an existing database, you can search for and
     select the database you want to use on the next page. You can also select
     no database and connect one later in Notion.
4. Click **Allow access** to give Notero access to your Notion workspace and
   database. You will then be redirected to a page that prompts you to open
   Zotero.
5. Click the **Open Zotero** button (or equivalent, depending on your web
   browser) to complete the connection process in Zotero. The Notero preferences
   should show that you are connected to your Notion workspace.

<details>
  <summary>Example of connecting to Notion</summary>
  <video src="https://github.com/user-attachments/assets/6c759c9d-f032-4060-bfd0-8da285ce0c2a" />
</details>

### Configure Notion Database

If you choose not to use the template database during the Notion connection
process, you will need to create your own database. See
[examples](#example-notion-databases) below that you can duplicate into
your workspace, or create one from scratch with properties described in the
[database properties](#notion-database-properties) section below.

To give Notero access to your database, follow these steps:

1. Go to the database page in your workspace.
2. Click on the **•••** More menu in the top-right corner of the page.
3. Scroll down to and click **Connections**.
4. Search for and select **Notero** in the **Search for connections...** menu.

<details>
  <summary>Example of connecting database to Notero</summary>
  <video src="https://github.com/user-attachments/assets/c4c25fbe-4d66-4985-a23f-1972762906a7" />
</details>

#### Notion Database Properties

Notero can sync data for the properties listed below. The only property required
by Notero is one with the **Title** property type. The other properties are
optional, so you can use only the ones that suit your needs.

The **Title** property can be named something other than `Name` as long as it
does not conflict with any of the other property names. The name and type of
the other properties must be configured exactly as specified here. Note that
property names are case-sensitive, so the capitalization must match exactly.

Support for customizing properties is planned for the future;
see issue [#355](https://github.com/dvanoni/notero/issues/355).

| Property Name       | Property Type | Notes                                                                          |
| ------------------- | ------------- | ------------------------------------------------------------------------------ |
| `Name`              | Title         | Format configurable via the **Notion Page Title** option in Notero preferences |
| `Abstract`          | Text          |                                                                                |
| `Authors`           | Text          |                                                                                |
| `Citation Key`      | Text          | Requires [Better BibTeX](https://retorque.re/zotero-better-bibtex/)            |
| `Collections`       | Multi-select  |                                                                                |
| `Date`              | Text          |                                                                                |
| `Date Added`        | Date          |                                                                                |
| `Date Modified`     | Date          |                                                                                |
| `DOI`               | URL           |                                                                                |
| `Editors`           | Text          |                                                                                |
| `Extra`             | Text          |                                                                                |
| `File Path`         | Text          |                                                                                |
| `Full Citation`     | Text          | Format based on the Zotero setting for **Export → Quick Copy → Item Format**   |
| `In-Text Citation`  | Text          | Format based on the Zotero setting for **Export → Quick Copy → Item Format**   |
| `Item Type`         | Select        |                                                                                |
| `Place`             | Text          |                                                                                |
| `Proceedings Title` | Text          |                                                                                |
| `Publication`       | Text          |                                                                                |
| `Series Title`      | Text          |                                                                                |
| `Short Title`       | Text          |                                                                                |
| `Tags`              | Multi-select  |                                                                                |
| `Title`             | Text          |                                                                                |
| `URL`               | URL           |                                                                                |
| `Year`              | Number        |                                                                                |
| `Zotero URI`        | URL           | Opens items in web library if signed in to Zotero                              |

## Usage Guides

For more visual guides of setting up and using Notero, see the following
resources made by wonderful members of the community.

> [!NOTE]
> Some aspects of these resources may be outdated, so be sure to refer to this
> README for the latest information.

- [Using Notion and Zotero to build a literature tracker](https://sciquest.netlify.app/posts/notion_literature/)
  (blog post) by [Jewel Johnson](https://jeweljohnsonj.github.io/jewel_resume/)
- [How To Sync Zotero → Notion // Research Paper Workflow (2023 Tutorial)](https://youtu.be/8RFFxFcrLCo)
  (video) by [Holly Jane](https://hollyjane.org/)
- [Smart notetaking by starting with integrating Zotero and Notion: A first step](https://youtu.be/4Z_5tskdNsY?t=1173)
  (video) by [Dr. Jingjing Lin](https://jingjing-lin.com/)

_If you'd like to share how you use Notero and want to be listed here, please
feel free to submit a PR or [contact me](https://github.com/dvanoni)!_

## Frequently Asked Questions

### How to sync from Notion back into Zotero

Bidirectional sync between Notion and Zotero, while desirable, falls outside the
scope of this plugin. Implementing this functionality would require developing a
separate hosted service that could both listen for Notion webhooks and interact
with the Zotero API to propagate changes. While technically feasible as a
standalone project, this capability is not part of Notero's functionality.

Notion's current [webhook actions](https://www.notion.com/help/webhook-actions)
also impose some limitations that make this less practical:

- Webhook actions are only available to Notion users on paid plans.
- Actions are only triggered when editing page properties but not page content.

### How to sync attached files into Notion

There currently isn't a good way to sync files or link to local files due to the
following limitations with Notion:

- The Notion API [does not currently support uploading files](https://developers.notion.com/reference/file-object#externally-hosted-files-vs-files-hosted-by-notion).
- Notion only supports `http:` and `https:` URLs, so it's not possible to link
  directly to the file using a `file:` URL.

For now, the best workarounds are:

- Use the `File Path` property to point you to the location of the local file.
- If you sync your files into your Zotero account, you can open the Zotero web
  interface from the `Zotero URI` property and then open the file from there.

### How to bulk sync existing items

To sync multiple items that are already in a monitored collection, you can do so
from the collection or item context menus.
See the [Syncing Items](#syncing-items) section above.

### How to fix Notion API errors

#### Could not find database

If you receive the following error:

> APIResponseError: Could not find database with ID: _xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx_

This most likely means you have not given Notero access to your Notion database.
Ensure you follow the steps in the
[Configure Notion Database](#configure-notion-database) section. Clicking the
**•••** button in the top-right corner of your database should show a connection
for the Notero integration.

#### Can't update a page that is archived

If you receive the following error:

> APIResponseError: Can't update a page that is archived. You must unarchive the
> page before updating.

This can happen when Notero tries to sync an item that already had a Notion page
created for it from a previous sync, but that page has since been deleted.
(Note that deleting a Notion page moves it into the trash, and the Notion API
refers to this as "archived.")

As described in the [How Notero Works](#how-notero-works) section, Notero
associates Zotero items with Notion pages through a link named `Notion` attached
to the item. To resolve the issue, delete this link attachment on the offending
item(s) and then perform the sync again.

#### Not a property that exists

If you receive the following error:

> APIResponseError: _property_ is not a property that exists

This can happen if you previously synced items into one Notion database and then
change your Notero preferences to specify a different database. Notero may be
trying to update pages in the old database instead of creating pages in the new
database, and this error can occur if different properties were configured in
the different databases.

To solve this, you should delete the old database in Notion and then permanently
delete it from the Trash in Notion.

## Example Notion Databases

We provide some example Notion databases that have been configured with all the
properties synced by Notero.

Once you've opened one of the examples, click the **Duplicate** button in the
top-right corner of the page to duplicate it into your Notion workspace.

### [Basic Example](https://dvanoni.notion.site/5ba9956716ac4218be77d2b4655911f5)

An empty database that contains only the properties synced by Notero.
Useful if you want to start from scratch and customize it yourself.

### [Advanced Example](https://dvanoni.notion.site/79b17005bc374209b0f373b1a3cde0ae)

A database with multiple views and some sample entries.
See below for descriptions of how you can use the different views.

#### Bibliographic Info Table View

- Table view enables easy editing of entries.
- Easily navigate to the original source by clicking on the `DOI` or `URL` property.
  - DOIs for books may need to be copy & pasted manually from the `Extra`
    field in Zotero.
- Click on the `Zotero URI` property to view/edit the entry in Zotero or to
  export the bibliography entry in a different citation style.

#### Reading Status Board View

- Keep track of promising references you need to locate, books and articles you
  requested via interlibrary loan, and works that are relevant enough to warrant
  taking in-depth notes or writing a memo.

#### Literature Review Table View

- Quickly analyze and compare attributes of literature you are reviewing
  (e.g., theoretical framework, sample, methods used, key findings, etc.)
- Easily link to other works using the `Related References` property
  (e.g., articles in the same special issue, book chapters in the same edited
  book, studies and commentary that respond to or extend other works).

#### Books Gallery View

- Add a cover image (e.g., right click → copy image address from Amazon).
- Keep track of which books you own, borrow, and lend to others.
  - Add due dates and reminders for library books and interlibrary loans.

## Development

Notero was scaffolded with [generator-zotero-plugin][] and uses build scripts
heavily inspired by [zotero-plugin][].
Many thanks to [@retorquere](https://github.com/retorquere) for creating these.

### Local Setup

The steps below are based on the [Zotero Plugin Development][plugin-development]
documentation and should allow you to build and run Notero yourself.

1.  To avoid any potential damage to your default Zotero profile, you can
    [create a new profile][zotero-profiles] for development purposes.

2.  Create a file named `zotero.config.json` that will contain the config
    options used to start Zotero.
    See [`zotero.config.example.json`](zotero.config.example.json) for an
    example file that has descriptions of all available config options.

3.  Install dependencies:

        npm ci

4.  Build Notero and start Zotero with the plugin installed:

        npm start

    Alternatively, you can start your desired beta version of Zotero:

        npm run start-beta

    The `start` script performs a number of steps:

    1.  Execute `npm run build` to build the plugin into the `build` directory.
    2.  If defined, run the `scripts.prestart` command specified in
        `zotero.config.json`.
    3.  Write a file containing the absolute path to the `build` directory into
        the `extensions` directory in the Zotero profile directory.
    4.  Remove the `extensions.lastAppBuildId` and `extensions.lastAppVersion`
        lines from `prefs.js` in the Zotero profile directory.
    5.  Start Zotero with the profile specified in `zotero.config.json` and the
        following command line arguments:

            -purgecaches -ZoteroDebugText -jsdebugger -datadir profile

    6.  If defined, run the `scripts.poststart` command specified in
        `zotero.config.json`, providing it with a `ZOTERO_PID` environment variable.

[generator-zotero-plugin]: https://github.com/retorquere/generator-zotero-plugin
[zotero-plugin]: https://github.com/retorquere/zotero-plugin
[plugin-development]: https://www.zotero.org/support/dev/client_coding/plugin_development
[zotero-profiles]: https://www.zotero.org/support/kb/multiple_profiles

### Releasing a New Version

Releases are performed via GitHub Actions. The
[`release`](.github/workflows/release.yml) workflow defines the following jobs:

#### `release-please`

This job uses the [release-please][] action to create release PRs when new
user-facing commits are pushed to the `main` branch. A release PR will bump the
package version and update the changelog. When the PR is merged, this job then
creates a new version tag and GitHub release.

#### `publish-artifacts`

This job runs when a new release is created by the `release-please` job. It
builds the `.xpi` file and publishes it to the release. It also generates an
updated manifest file and publishes it to the [`release`][release-tag] release.

[release-please]: https://github.com/googleapis/release-please-action
[release-tag]: https://github.com/dvanoni/notero/releases/tag/release
