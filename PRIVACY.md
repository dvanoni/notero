# Privacy Policy

Last updated: January 10, 2025

The Notero plugin primarily interacts with the user's local Zotero client and
the Notion API. This document describes the data that the plugin accesses and
how it is used.

## Notion Authorization

The Notero plugin uses a Notion public integration to authorize access to the
user's selected Notion workspace(s) and database(s). For details on the
authorization process, see the [Notion authorization guide][].

The authorization process follows the OAuth 2.0 protocol and uses a proxy
service to keep the OAuth client secret secure. The OAuth proxy service is
managed by the Notero developer and is [open source][notero-auth]. The proxy
service does not store any user data other than logs of basic network request
information (e.g., IP address and user agent) captured by the hosting provider,
[Cloudflare][Cloudflare Trust Hub].

When the user completes the Notion authorization flow, the Notero plugin
receives a Notion access token and securely stores it using the
[Zotero login manager][]. Data stored with the login manager is encrypted and
stored on the user's local computer within the [Zotero profile directory][].

## User Data

The Notero plugin stores user-specific data, including Notion database IDs and
page URLs, on the user's local computer within the [Zotero profile directory][].
These values are transmitted to Notion for purposes of synchronization and are
not transmitted anywhere else.

As part of the synchronization process, user-generated Zotero item data may be
transmitted to Notion. These may include but are not limited to notes, tags, and
custom fields. Data saved in Notion is subject to [Notion terms and privacy][].

The Notero plugin does not communicate with any services other than Notion and
the OAuth proxy service.

[notero-auth]: https://github.com/dvanoni/notero-auth
[Cloudflare Trust Hub]: https://www.cloudflare.com/trust-hub/
[Notion authorization guide]: https://developers.notion.com/docs/authorization
[Notion terms and privacy]: https://www.notion.so/28ffdd083dc3473e9c2da6ec011b58ac
[Zotero login manager]: https://udn.realityripple.com/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsILoginManager/Using_nsILoginManager
[Zotero profile directory]: https://www.zotero.org/support/kb/profile_directory
