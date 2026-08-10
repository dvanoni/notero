/**
 * Converts Zotero note HTML into Markdown suitable for the `markdown` field
 * accepted by the Capacities `/blocks/append` endpoint, which converts it
 * into native blocks on Capacities' side.
 *
 * This intentionally supports a subset of Zotero's note HTML: headings,
 * paragraphs, bold/italic/strikethrough/code text, links, lists, blockquotes,
 * and code blocks. Zotero-specific highlight/citation annotations and text
 * colors have no Markdown equivalent and are flattened to plain text.
 */
export function convertHtmlToMarkdown(htmlString: string): string {
  const root = getRootElement(htmlString);
  if (!root) throw new Error('Failed to load HTML content');

  return convertBlockChildren(root).trim();
}

function getRootElement(htmlString: string): Element | null {
  const domParser = new DOMParser();
  const { body } = domParser.parseFromString(htmlString, 'text/html');
  const containerDiv = body.querySelector('div[data-schema-version]');
  return containerDiv || body;
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function isHTMLElement(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'UL',
  'OL',
]);

/** Joins block-level Markdown segments, each separated by a blank line. */
function convertBlockChildren(node: Node): string {
  return Array.from(node.childNodes)
    .map((child) => convertBlockNode(child))
    .filter((segment) => segment.length > 0)
    .join('\n\n');
}

function convertBlockNode(node: Node): string {
  if (!isHTMLElement(node)) {
    const text = convertInlineNode(node).trim();
    return text;
  }

  switch (node.tagName) {
    case 'H1':
      return `# ${convertInlineChildren(node).trim()}`;
    case 'H2':
      return `## ${convertInlineChildren(node).trim()}`;
    case 'H3':
      return `### ${convertInlineChildren(node).trim()}`;
    case 'H4':
      return `#### ${convertInlineChildren(node).trim()}`;
    case 'H5':
      return `##### ${convertInlineChildren(node).trim()}`;
    case 'H6':
      return `###### ${convertInlineChildren(node).trim()}`;
    case 'BLOCKQUOTE':
      return convertInlineChildren(node)
        .trim()
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    case 'PRE':
      return `\`\`\`\n${node.textContent || ''}\n\`\`\``;
    case 'UL':
      return convertList(node, 'bullet');
    case 'OL':
      return convertList(node, 'number');
    case 'P':
    case 'DIV':
      return hasOnlyBlockChildren(node)
        ? convertBlockChildren(node)
        : convertInlineChildren(node).trim();
    default:
      return convertInlineChildren(node).trim();
  }
}

function hasOnlyBlockChildren(element: HTMLElement): boolean {
  return Array.from(element.children).some((child) =>
    BLOCK_TAGS.has(child.tagName),
  );
}

function convertList(element: HTMLElement, type: 'bullet' | 'number'): string {
  const items = Array.from(element.children).filter(
    (child) => child.tagName === 'LI',
  );

  return items
    .map((item, index) => {
      const marker = type === 'bullet' ? '-' : `${index + 1}.`;
      const nestedLists = Array.from(item.children).filter((child) =>
        ['UL', 'OL'].includes(child.tagName),
      );

      const inlineContent = convertInlineChildren(
        item,
        (child) => !nestedLists.some((list) => list === child),
      ).trim();

      const nestedContent = nestedLists
        .map((list) => indent(convertBlockNode(list)))
        .join('\n');

      return [`${marker} ${inlineContent}`, nestedContent]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

function convertInlineChildren(
  node: Node,
  filter: (child: ChildNode) => boolean = () => true,
): string {
  return Array.from(node.childNodes)
    .filter((child) => filter(child))
    .map((child) => convertInlineNode(child))
    .join('');
}

function isBold(element: HTMLElement): boolean {
  if (element.tagName === 'B' || element.tagName === 'STRONG') return true;
  const { fontWeight } = element.style;
  return fontWeight === 'bold' || Number(fontWeight) >= 600;
}

function isItalic(element: HTMLElement): boolean {
  return (
    element.tagName === 'I' ||
    element.tagName === 'EM' ||
    element.style.fontStyle === 'italic'
  );
}

function isStrikethrough(element: HTMLElement): boolean {
  if (['S', 'STRIKE', 'DEL'].includes(element.tagName)) return true;
  return element.style.textDecoration === 'line-through';
}

function isCode(element: HTMLElement): boolean {
  return element.tagName === 'CODE';
}

function convertInlineNode(node: Node): string {
  if (isTextNode(node)) {
    return node.textContent || '';
  }

  if (!isHTMLElement(node)) return '';

  if (node.tagName === 'BR') return '\n';

  if (BLOCK_TAGS.has(node.tagName)) {
    return `\n\n${convertBlockNode(node)}\n\n`;
  }

  if (node.tagName === 'A') {
    const href = node.getAttribute('href') || '';
    const text = convertInlineChildren(node);
    return href ? `[${text}](${href})` : text;
  }

  let text = convertInlineChildren(node);
  if (!text.trim()) return text;

  if (isCode(node)) return `\`${text}\``;
  if (isBold(node)) text = `**${text}**`;
  if (isItalic(node)) text = `_${text}_`;
  if (isStrikethrough(node)) text = `~~${text}~~`;

  return text;
}
