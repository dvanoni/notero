# Captero

[![Works with Zotero](https://img.shields.io/github/package-json/v/oyvindbso/captero?label=Captero&color=%23CC2936)](https://www.zotero.org/)

Captero is a [Zotero plugin](https://www.zotero.org/support/plugins) — a fork
of [Notero](https://github.com/dvanoni/notero) retargeted at
[Capacities](https://capacities.io/) instead of Notion — for syncing items and
notes into Capacities. To use it:

1. 💾 [Install][] the Captero plugin into Zotero.
2. 🔑 [Connect][] it to Capacities with an API token.
3. 🗂️ [Configure][] a Structure (and optionally a Collection) to sync into.
4. 📁 Choose your Zotero collections to monitor.
5. 📝 Add or update items in your collections.
6. 🔄 Watch your items sync into Capacities!

[Install]: #install-and-configure-captero-plugin
[Connect]: #connect-to-capacities
[Configure]: #configure-your-capacities-structure

Original concept and implementation (Notero, for Notion) by
[@arhoff](https://github.com/arhoff) and [@dvanoni](https://github.com/dvanoni) |
Adapted for Capacities by [@oyvindbso](https://github.com/oyvindbso)

## Table of Contents

- [Why Use Captero?](#why-use-captero)
- [How Captero Works](#how-captero-works)
- [Installation and Setup](#installation-and-setup)
- [Configure Your Capacities Structure](#configure-your-capacities-structure)
- [Known Limitations](#known-limitations)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Development](#development)

## Why Use Captero?

- Integrate your reference manager with your networked notes, reading lists,
  and drafts in one Capacities space.
- Link references into your other notes and objects as you write in
  Capacities.
- Create custom views to filter and sort large reference lists by structure
  property, tag, author, etc.
- Jump straight from a Zotero item to its corresponding object in Capacities
  via the link attachment Captero adds.

## How Captero Works

The Captero plugin watches for Zotero items being added to or modified within
any collections that you specify in the Captero preferences. Whenever an item
is added or modified, Captero does a few things:

- Save an object with the Zotero item's properties (title, authors, etc.) into
  the Capacities Structure specified in Captero preferences.
- Add a `capacities` tag to the Zotero item.
- Add an attachment to the Zotero item that links to the object in Capacities
  (a URL of the form `https://app.capacities.io/<space-id>/<object-id>`).

In addition to providing a convenient way to open a Capacities object from
Zotero, the link attachment also serves as a reference for Captero so that it
can update the corresponding object for a given Zotero item on future syncs.

### Syncing Items

By default, Captero will sync items in your monitored collections whenever
they are modified. You can disable this functionality by unchecking the **Sync
when items are modified** option in the Captero preferences.

You can also sync items from the collection or item context menus (right-click):

- To sync all items in a collection, open the context menu for the collection
  and select **Sync Items to Capacities**.
- To sync one item or multiple items, select the item(s) in the main pane,
  open the context menu, and select **Sync to Capacities**.

> [!NOTE]
> To prevent the "sync on modify" functionality from saving to Capacities
> multiple times, Captero does not notify Zotero when the tag and link
> attachment are added to an item. This means they may not appear in Zotero
> immediately, and you may need to navigate to a different item and back to
> make them appear.

### Syncing Notes and PDF Annotations

Zotero notes associated with an item can be synced into Capacities as content
of the corresponding object for that item. As with regular items, you can
manually sync notes using the **Sync to Capacities** option in the context
menu.

Automatic syncing of notes can be enabled via the **Sync notes** option in the
Captero preferences. When enabled, notes will automatically sync whenever
they are modified. Additionally, when a regular item is synced, all of its
notes will also sync if they have not already.

To sync annotations (notes and highlights) from a PDF, you'll first need to
extract them into a Zotero note, same as with the original Notero:

1. Select an item or PDF, open the context menu, and select
   **Add Note from Annotations**.
2. If desired, enable highlight colors from the menu at the top-right of the
   note panel.

> [!NOTE]
> Zotero note HTML is converted to Markdown before being sent to Capacities
> (which then converts it into native blocks). Basic formatting — headings,
> bold/italic/strikethrough, links, lists, blockquotes, code blocks — comes
> through. Highlight colors and PDF annotation backlinks have no Markdown
> equivalent and are currently flattened to plain text. See
> [Known Limitations](#known-limitations).

## Installation and Setup

Using Captero involves installing the plugin in Zotero and connecting it to a
Capacities space. Detailed setup instructions are below.

### Install and Configure Captero Plugin

> [!IMPORTANT]
>
> - Captero requires Zotero 7.0 or above.
> - There is no separate legacy build for Zotero 6.
> - See the [changelog](CHANGELOG.md) for release notes.
> - No packaged release has been published yet for this fork — for now, build
>   the `.xpi` yourself. See [Development](#development) below.

1. Build or download the `.xpi` file (see [Development](#development) until
   packaged releases are available).
2. Open the Zotero Plugins Manager via the **Tools → Plugins** menu item.
3. Install the `.xpi` file by either:
   - dragging and dropping it into the Plugins Manager window _or_
   - selecting it using the **Install Plugin From File...** option in the
     gear menu in the top-right corner of the window
4. Open the Captero preferences from either the
   **Tools → Captero Preferences...** menu item or the sidebar in the main
   Zotero preferences window.
5. Configure the Captero preferences as desired.

### Connect to Capacities

1. In Capacities, generate an API token (`cap-api-...`) for your space. Check
   Capacities' own documentation for the current location of this setting, as
   it may move as their API evolves.
2. Paste the token into the **API Token** field in the Captero preferences and
   click **Connect**.
3. Once connected, Captero shows the name of your Capacities space and lets
   you pick a **Structure** to sync into, plus an optional **Collection**
   within that Structure.

> [!NOTE]
> Unlike Notero's Notion integration, there is no OAuth flow here — a
> Capacities API token is scoped to a single space, so pasting the token and
> connecting is the entire setup.

## Configure Your Capacities Structure

Captero requires you to choose one **Structure** (Capacities' term for an
object type) to sync Zotero items into — for example, one you create and name
"Reference" or "Paper". This is the only hard requirement; without one
selected, sync fails with a "structure not selected" error.

Everything else is optional. Captero matches Zotero fields to your Structure's
properties **by exact name (case-insensitive) and by property type**. If a
property with the matching name and type doesn't exist on your Structure, that
field is silently skipped — no error, it just won't sync. Add only the
properties you want.

| Property Name       | Property Type | Notes                                                                          |
| ------------------- | ------------- | ------------------------------------------------------------------------------ |
| _(built-in title)_  | Title         | Format configurable via the **Capacities Title** option in Captero preferences |
| `Abstract`          | Text          |                                                                                |
| `Authors`           | Text          |                                                                                |
| `Citation Key`      | Text          | Requires [Better BibTeX](https://retorque.re/zotero-better-bibtex/)            |
| `Collections`       | Text          | Comma-separated list of Zotero collection names — see note below               |
| `Date`              | Text          |                                                                                |
| `Date Added`        | Date          |                                                                                |
| `Date Modified`     | Date          |                                                                                |
| `DOI`               | URL           |                                                                                |
| `Editors`           | Text          |                                                                                |
| `Extra`             | Text          |                                                                                |
| `File Path`         | Text          |                                                                                |
| `Full Citation`     | Text          | Format based on the Zotero setting for **Export → Quick Copy → Item Format**   |
| `In-Text Citation`  | Text          | Format based on the Zotero setting for **Export → Quick Copy → Item Format**   |
| `Item Type`         | Label         | Only populates for label options you've already created — see note below       |
| `Place`             | Text          |                                                                                |
| `Proceedings Title` | Text          |                                                                                |
| `Publication`       | Text          |                                                                                |
| `Series Title`      | Text          |                                                                                |
| `Short Title`       | Text          |                                                                                |
| `Tags`              | Text          | Comma-separated list of Zotero tags — see note below                           |
| `Title`             | Text          | Separate from the object's built-in title, if you want a duplicate             |
| `URL`               | URL           |                                                                                |
| `Year`              | Number        |                                                                                |
| `Zotero URI`        | URL           | Opens items in web library if signed in to Zotero                              |

> [!IMPORTANT]
>
> **Why `Item Type` needs setup, but `Tags`/`Collections` don't.**
>
> Capacities' `label` property type (used for `Item Type`) can only hold
> _existing_ options — the API has no way to create a new label option on the
> fly, unlike Notion's auto-creating `select`/`multi_select`. So:
>
> - **`Tags` and `Collections`** are mapped to plain **Text** properties on
>   purpose, so any Zotero tag or collection name flows through with zero
>   setup.
> - **`Item Type`** is mapped to a **Label** property. If you want it
>   populated, add a property named `Item Type` of type Label to your
>   Structure, then manually add one label option per Zotero item type you
>   use, with the option name matching Zotero's type name exactly (e.g.
>   "Journal Article", "Book Section", "Conference Paper", "Thesis", "Report",
>   "Web Page"). Types without a matching option simply sync with an empty
>   `Item Type`.
>
> Note that Capacities' native "Collections" (the ones listed in
> **Structure → Collections**, used for the optional Collection picker in
> Captero preferences) are a different concept from the `Collections`
> **property** in the table above, which just mirrors Zotero folder
> membership as text.

## Known Limitations

This is a young fork of Notero, rebuilt against the Capacities API. A few
things are worth knowing before you rely on it:

- **No dynamic tag/label creation.** As described above, `Item Type` only
  populates for label options you've pre-created; `Tags`/`Collections` use
  plain text specifically to avoid this constraint.
- **Note formatting is simplified.** Highlight colors and PDF annotation
  backlinks (features Notero supported for Notion) have no Markdown
  equivalent and are flattened to plain text when notes sync.
- **No file/attachment upload.** Same limitation Notero had with Notion —
  there's no way to sync local files or link to them directly. Use the
  `File Path` property to record the local path, or the `Zotero URI` property
  to open the item in your Zotero web library.
- **No Chinese (zh-CN) translation.** It was dropped during this rewrite
  since the strings changed substantially; contributions to restore it are
  welcome.
- **Not yet verified against a live Capacities workspace end-to-end** by the
  maintainer as of this writing — it's built strictly against the published
  Capacities API 2.0 OpenAPI spec. If you hit unexpected behavior, please
  [open an issue](https://github.com/oyvindbso/captero/issues).

## Frequently Asked Questions

### How to sync from Capacities back into Zotero

Bidirectional sync, while desirable, falls outside the scope of this plugin.
Implementing this functionality would require a separate hosted service that
listens for changes in Capacities and interacts with the Zotero API to
propagate them back. This capability is not part of Captero's functionality.

### How to sync attached files into Capacities

There currently isn't a way to sync files or link to local files through
Captero. For now, the best workarounds are:

- Use the `File Path` property to point you to the location of the local file.
- If you sync your files into your Zotero account, you can open the Zotero web
  interface from the `Zotero URI` property and then open the file from there.

(Capacities does have a media upload API, but Captero doesn't currently use it
for item attachments.)

### How to bulk sync existing items

To sync multiple items that are already in a monitored collection, you can do
so from the collection or item context menus. See the
[Syncing Items](#syncing-items) section above.

### "Capacities structure not selected"

This means you haven't chosen a Structure in the Captero preferences yet. See
[Configure Your Capacities Structure](#configure-your-capacities-structure).

### "Not connected to Capacities"

This means Captero doesn't have a valid API token. Reconnect via the Captero
preferences — see [Connect to Capacities](#connect-to-capacities).

### A property I configured isn't syncing

Captero only fills in a property if your Structure has one with a matching
name (case-insensitive) **and** the exact property type listed in the
[property table](#configure-your-capacities-structure) above. Double-check
both the name and the type — this is the most common reason a property is
silently skipped.

### Captero created a duplicate object instead of updating the existing one

Captero finds the previously-synced object via a hidden link attachment on the
Zotero item. If that object was deleted in Capacities (or the link attachment
itself is missing/corrupted), Captero can't find it and creates a new one on
the next sync. If this happens repeatedly, delete the stale `Capacities` link
attachment on the item and re-sync.

## Development

Captero was scaffolded, as Notero, with [generator-zotero-plugin][] and uses
build scripts heavily inspired by [zotero-plugin][]. Many thanks to
[@retorquere](https://github.com/retorquere) for creating these, and to the
original [Notero](https://github.com/dvanoni/notero) project this fork is
built on.

### Local Setup

Captero uses [Vite+][], a unified toolchain for dependency management,
linting, formatting, testing, and task orchestration. The plugin build still
runs through the project's existing esbuild scripts. You'll need to install
the `vp` CLI before getting started. See the [Vite+ website][Vite+] for
installation instructions.

The steps below are based on the [Zotero Plugin Development][plugin-development]
documentation and should allow you to build and run Captero yourself.

1.  To avoid any potential damage to your default Zotero profile, you can
    [create a new profile][zotero-profiles] for development purposes.

2.  Create a file named `zotero.config.json` that will contain the config
    options used to start Zotero.
    See [`zotero.config.example.json`](zotero.config.example.json) for an
    example file that has descriptions of all available config options.

3.  Install dependencies:

        vp install

4.  Build Captero and start Zotero with the plugin installed:

        vp run start

    Alternatively, you can start your desired beta or dev version of Zotero:

        vp run start:beta
        vp run start:dev

    The `start` script performs a number of steps:
    1.  Run `scripts/build.mts` to build the plugin into the `build` directory
        and watch for changes, rebuilding when necessary.
    2.  Use [web-ext][] to start Zotero with the profile specified in
        `zotero.config.json` and install the plugin as temporary, reloading when
        the plugin is rebuilt.
    3.  Write Zotero debug output to the `logFile` if specified in
        `zotero.config.json`.

5.  To produce a standalone `.xpi` you can install manually, run:

        vp run build
        vp run create-xpi

[generator-zotero-plugin]: https://github.com/retorquere/generator-zotero-plugin
[zotero-plugin]: https://github.com/retorquere/zotero-plugin
[plugin-development]: https://www.zotero.org/support/dev/client_coding/plugin_development
[zotero-profiles]: https://www.zotero.org/support/kb/multiple_profiles
[Vite+]: https://viteplus.dev
[web-ext]: https://github.com/mozilla/web-ext

### Releasing a New Version

Releases are performed via GitHub Actions. The
[`release`](.github/workflows/release.yml) workflow defines the following jobs,
inherited from Notero and not yet exercised for this fork:

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
[release-tag]: https://github.com/oyvindbso/captero/releases/tag/release
