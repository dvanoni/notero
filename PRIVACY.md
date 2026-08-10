# Privacy Policy

Last updated: August 10, 2026

The Captero plugin primarily interacts with the user's local Zotero client and
the Capacities API. This document describes the data that the plugin accesses
and how it is used.

## Capacities Authorization

The Captero plugin uses a Capacities API token, provided by the user, to
authorize access to a single Capacities space. Unlike the original Notero
project's Notion integration, there is no OAuth flow and no third-party proxy
service involved — the user generates the token directly in Capacities and
pastes it into the Captero preferences.

The Captero plugin securely stores the API token, along with the ID and name
of the associated Capacities space, using the
[Zotero login manager][]. Data stored with the login manager is encrypted and
stored on the user's local computer within the [Zotero profile directory][].

## User Data

The Captero plugin stores user-specific data, including the selected
Capacities Structure and Collection IDs and object URLs, on the user's local
computer within the [Zotero profile directory][]. These values are
transmitted to Capacities for purposes of synchronization and are not
transmitted anywhere else.

As part of the synchronization process, user-generated Zotero item data may be
transmitted to Capacities. These may include but are not limited to notes,
tags, and custom fields. Data saved in Capacities is subject to
[Capacities' terms and privacy policy][].

The Captero plugin does not communicate with any services other than the
Capacities API.

[Capacities' terms and privacy policy]: https://capacities.io/terms-and-conditions
[Zotero login manager]: https://udn.realityripple.com/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsILoginManager/Using_nsILoginManager
[Zotero profile directory]: https://www.zotero.org/support/kb/profile_directory
