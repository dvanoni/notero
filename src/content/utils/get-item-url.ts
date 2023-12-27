/**
 * Return URL to item in web library, if user is signed in.
 * If user is not signed in, the URLs will lead to a 404.
 *
 * @param item Zotero item to return URL for
 */
export function getItemURL(item: Zotero.Item): string {
  const zoteroURI = Zotero.URI.getItemURI(item).replace(/^http:/, 'https:');
  const username = Zotero.Users.getCurrentUsername();

  if (!username) return zoteroURI;

  return zoteroURI.replace(/users\/(?!local\/)\w+/, slugify(username));
}

/**
 * Generate url friendly slug from name
 *
 * From https://github.com/zotero/dataserver/blob/97267cbee6441350b66baff4c34e1f8f9833118a/model/Utilities.inc.php#L88-L100
 * As suggested in https://forums.zotero.org/discussion/comment/422291/#Comment_422291
 *
 * @param input name to generate slug from
 */
function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace('/[^a-z0-9 ._-]/g', '')
    .replace(/ /g, '_');
}
