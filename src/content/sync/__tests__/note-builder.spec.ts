import { noteTestCases } from '../__fixtures__/notes';
import { buildNoteBlocks } from '../note-builder';

describe('buildNoteBlocks', () => {
  it('throws error if note content does not match expected format', () => {
    const html = '<h1>Unexpected</h1>';

    expect(() => buildNoteBlocks(html)).toThrow(
      new Error('Failed to load note content')
    );
  });

  it.each(noteTestCases)(
    'returns expected blocks for "$name"',
    ({ html, expected }) => {
      expect(buildNoteBlocks(html)).toStrictEqual(expected);
    }
  );
});
