# Notero

A [Zotero plugin](https://www.zotero.org/support/plugins) for syncing items into
[Notion](https://www.notion.so/Intro-to-databases-fd8cd2d212f74c50954c11086d85997e)

![Notero in action](docs/notero.gif)

Concept by [@arhoff](https://github.com/arhoff) 👩🏻‍🔬 |
Built with ❤️ by [@dvanoni](https://github.com/dvanoni)

## Why Use Notero?

- Allows you to integrate your reference manager, task list, reading notes,
  analytical tables, and drafts in one location.
- The name of database entries is the in-text citation, which allows you to
  easily link to references when writing in Notion.
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
existing pages instead of creating duplicate pages for a given Zotero item.

### Syncing Items

By default, Notero will sync items in your monitored collections whenever they
are modified. You can disable this functionality by unchecking the **Sync when
items are modified** option in Notero preferences.

If you disable **Sync when items are modified** and would like to trigger a
re-sync of an item, you can remove the item from the monitored collection and
add it back in.

⚠️ _**Note:** To prevent the "sync on modify" functionality from saving to Notion
multiple times, Notero does not notify Zotero when the tag and link attachment
are added to an item. This means they may not appear in Zotero immediately, and
you may need to navigate to a different item and back to make them appear._

## Installation and Setup

The [latest release](https://github.com/dvanoni/notero/releases/latest) of the
plugin is available on GitHub.
See the [changelog](CHANGELOG.md) for release notes.

Detailed setup instructions are below.

### Configure Notion

1.  Obtain a Notion internal integration token from https://www.notion.com/my-integrations.

    - See [Notion developer docs](https://developers.notion.com/docs/getting-started#step-1-create-an-integration)
      for detailed instructions.

1.  Create the database that you would like to sync Zotero items into.

    - See [examples](#example-notion-databases) below that you can duplicate
      into your Notion workspace.

1.  Share the database with the integration you created in step 1.

    - See [Notion developer docs](https://developers.notion.com/docs/getting-started#step-2-share-a-database-with-your-integration)
      for detailed instructions.

1.  Take note of the database ID.

    - From the [Notion developer docs](https://developers.notion.com/docs/working-with-databases#adding-pages-to-a-database),
      here's a quick procedure to find the database ID:

      > Open the database as a full page in Notion. Use the **Share** menu to
      > **Copy link**. Now paste the link in your text editor so you can take a
      > closer look. The URL uses the following format:
      >
      >     https://www.notion.so/{workspace_name}/{database_id}?v={view_id}
      >
      > Find the part that corresponds to `{database_id}` in the URL you pasted.
      > It is a 36 character long string. This value is your database ID.

1.  Configure the database properties as desired. See the
    [database properties](#notion-database-properties) section below for more details.

#### Notion Database Properties

Notero can sync data for the properties listed below. The only property required
by Notero is one with the **Title** property type. The other properties are
optional, so you can use only the ones that suit your needs.

The **Title** property can be named something other than `Name` as long as it
does not conflict with any of the other property names. The name and type of
the other properties must be configured exactly as specified here.

| Property Name      | Property Type | Required |
| ------------------ | ------------- | -------- |
| `Name`             | Title         | Yes      |
| `Abstract`         | Text          | No       |
| `Authors`          | Text          | No       |
| `DOI`              | URL           | No       |
| `Editors`          | Text          | No       |
| `File Path`        | Text          | No       |
| `Full Citation`    | Text          | No       |
| `In-Text Citation` | Text          | No       |
| `Item Type`        | Select        | No       |
| `Tags`             | Multi-select  | No       |
| `Title`            | Text          | No       |
| `URL`              | URL           | No       |
| `Year`             | Number        | No       |
| `Zotero URI`       | URL           | No       |

### Install and Configure Notero Plugin

1. Download the [latest version](https://github.com/dvanoni/notero/releases/latest)
   of the `.xpi` file.
1. Open the Zotero Add-ons Manager via the **Tools → Add-ons** menu item.
1. Install the `.xpi` file by either:
   - dragging and dropping it into the Add-ons Manager window _or_
   - selecting it using the **Install Add-on From File...** option in the
     gear menu in the top-right corner of the window
1. Restart Zotero to activate the plugin.
1. Open the Notero preferences from the **Tools → Notero Preferences...** menu
   item, and enter the required preferences.

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

Notero was scaffolded with [generator-zotero-plugin](https://github.com/retorquere/generator-zotero-plugin)
and is built with [zotero-plugin-webpack](https://github.com/retorquere/zotero-plugin-webpack).

### Local Setup

The steps below should allow you to build and run Notero yourself.

1.  To avoid any potential damage to your default Zotero profile, you can
    [create a new profile](https://www.zotero.org/support/kb/multiple_profiles)
    for development purposes.

1.  [Configure Zotero](https://www.zotero.org/support/dev/client_coding/plugin_development)
    to run the plugin directly from source. Because the `start` script already
    handles most of the steps, you only need to ensure your
    [Zotero profile directory](https://www.zotero.org/support/kb/profile_directory)
    has a directory named `extensions`.

    - **Note:** The `start` script does not currently support Windows.
      If developing on Windows, you will need to follow all the configuration
      steps in the Zotero docs.

1.  Create a `profile.json` file by copying [`profile.json.example`](profile.json.example).
    This file is used by the [`zotero-start`](https://github.com/retorquere/zotero-plugin-webpack/blob/bc5532000c8b395792ab82e381b5493a8ebd9cfd/bin/start.ts)
    command to determine where to install the extension when running a
    development build.

    - `dir` is the absolute path to your [Zotero profile directory](https://www.zotero.org/support/kb/profile_directory)
    - `log` is the name of the file that Zotero debug output will be written to
    - `name` is the name of your Zotero profile (e.g. `default`)

1.  Install dependencies:

        npm ci

1.  Build the plugin and start Zotero with it installed:

        npm start

    The `start` script runs [`zotero-start`](https://github.com/retorquere/zotero-plugin-webpack/blob/bc5532000c8b395792ab82e381b5493a8ebd9cfd/bin/start.ts)
    which performs a number of steps:

    1.  Executes `npm run build` to build the plugin into the `build/` directory.
    1.  Removes the `extensions.json` file and Notero `.xpi` file from your
        Zotero profile directory.
    1.  Writes a new `.xpi` file containing the absolute path to the `build/` directory.
    1.  Starts Zotero with the profile specified in `profile.json` and the
        following command line arguments:

            -purgecaches -jsconsole -ZoteroDebugText

    If you would like to see the commands without executing them, you can run:

        npm start -- --dryRun

### Releasing a New Version

1.  Run the `version` script (not to be confused with `npm version`) to run
    [`standard-version`](https://github.com/conventional-changelog/standard-version).
    This will create a new commit with a bumped package version and updated
    changelog, and then it will create a version tag on the commit.

        npm run version

1.  Push the new version to GitHub:

        git push --follow-tags

1.  GitHub Actions will run the [`release`](.github/workflows/release.yml)
    workflow upon any new commit. This workflow will build the `.xpi` file and
    then use the [`zotero-plugin-release`](https://github.com/retorquere/zotero-plugin-webpack/blob/master/bin/release.ts)
    command from `zotero-plugin-webpack` to create a GitHub release with the
    `.xpi` file.
