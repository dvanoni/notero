# Notero

A [Zotero plugin](https://www.zotero.org/support/plugins) that syncs items into
a [Notion database](https://www.notion.so/Intro-to-databases-fd8cd2d212f74c50954c11086d85997e)
when added to a specific collection.

Scaffolded with [generator-zotero-plugin](https://github.com/retorquere/generator-zotero-plugin)
and built with [zotero-plugin-webpack](https://github.com/retorquere/zotero-plugin-webpack).

![Notero in action](docs/notero.gif)

## Why use Notero?

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

## Installation and Setup

The [latest release](https://github.com/dvanoni/notero/releases/latest) of the
plugin is available on GitHub.

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

1.  Ensure the database has the following required properties:

    | Property Name      | Property Type |
    | ------------------ | ------------- |
    | `Name`\*           | Title         |
    | `Item Type`        | Select        |
    | `Title`            | Text          |
    | `Authors`          | Text          |
    | `Year`             | Number        |
    | `DOI`              | URL           |
    | `URL`              | URL           |
    | `Zotero URI`       | URL           |
    | `Full Citation`    | Text          |
    | `In-Text Citation` | Text          |

    \* The title property can be named something other than `Name` as long as
    it does not conflict with any of the other property names.

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

### Install Notero Plugin

1. Download the [latest version](https://github.com/dvanoni/notero/releases/latest)
   of the `.xpi` file.
1. Open the Zotero Add-ons Manager via the **Tools → Add-ons** menu item.
1. Install the `.xpi` file by either:
   - dragging and dropping it into the Add-ons Manager window _or_
   - selecting it using the **Install Add-on From File...** option in the
     gear menu in the top-right corner of the window
1. Restart Zotero to activate the plugin.

### Configure Notero Preferences

1.  Open the Notero preferences from the **Tools → Notero Preferences...** menu item.
1.  Enter the required preferences:

    | Field                    | Description                                            |
    | ------------------------ | ------------------------------------------------------ |
    | Collection Name          | Name of the Zotero collection to monitor for new items |
    | Notion Integration Token | Your personal Notion internal integration token        |
    | Notion Database ID       | ID of the Notion database to sync items into           |

## Example Notion Databases

We provide some example Notion databases that have been configured with all the
properties required by Notero.

Once you've opened one of the examples, click the **Duplicate** button in the
top-right corner of the page to duplicate it into your Notion workspace.

### [Basic Example](https://dvanoni.notion.site/5ba9956716ac4218be77d2b4655911f5)

An empty database that contains only the required properties.
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
