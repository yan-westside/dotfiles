import assert from 'node:assert/strict';
import test from 'node:test';
import { UserError } from 'fastmcp';

import * as GDocsHelpers from '../src/googleDocsApiHelpers.ts';

function makeParagraph(
  startIndex: number,
  endIndex: number,
  text: string,
  namedStyleType = 'NORMAL_TEXT',
) {
  return {
    startIndex,
    endIndex,
    paragraph: {
      elements: [
        {
          startIndex,
          endIndex,
          textRun: { content: `${text}\n` },
        },
      ],
      paragraphStyle: { namedStyleType },
    },
  };
}

function makeNamedRanges() {
  return {
    sectionA: {
      namedRanges: [
        {
          namedRangeId: 'nr-section-a',
          name: 'sectionA',
          ranges: [{ startIndex: 10, endIndex: 20 }],
        },
      ],
    },
    duplicate: {
      namedRanges: [
        {
          namedRangeId: 'nr-duplicate-1',
          name: 'duplicate',
          ranges: [{ startIndex: 21, endIndex: 30 }],
        },
        {
          namedRangeId: 'nr-duplicate-2',
          name: 'duplicate',
          ranges: [{ startIndex: 31, endIndex: 40 }],
        },
      ],
    },
    splitRange: {
      namedRanges: [
        {
          namedRangeId: 'nr-split',
          name: 'splitRange',
          ranges: [
            { startIndex: 41, endIndex: 50 },
            { startIndex: 60, endIndex: 70 },
          ],
        },
      ],
    },
  };
}

function makeDocumentWithTabs() {
  return {
    tabs: [
      {
        tabProperties: {
          tabId: 'tab-1',
          title: 'Tab 1',
          index: 0,
        },
        documentTab: {
          body: {
            content: [makeParagraph(1, 12, 'Tab one body')],
          },
          namedRanges: {
            uniqueA: {
              namedRanges: [
                {
                  namedRangeId: 'nr-unique-a',
                  name: 'uniqueA',
                  ranges: [{ startIndex: 10, endIndex: 20, tabId: 'tab-1' }],
                },
              ],
            },
            shared: {
              namedRanges: [
                {
                  namedRangeId: 'nr-shared-a',
                  name: 'shared',
                  ranges: [{ startIndex: 21, endIndex: 30, tabId: 'tab-1' }],
                },
              ],
            },
          },
        },
      },
      {
        tabProperties: {
          tabId: 'tab-2',
          title: 'Tab 2',
          index: 1,
        },
        documentTab: {
          body: {
            content: [makeParagraph(1, 12, 'Tab two body')],
          },
          namedRanges: {
            uniqueB: {
              namedRanges: [
                {
                  namedRangeId: 'nr-unique-b',
                  name: 'uniqueB',
                  ranges: [{ startIndex: 31, endIndex: 40, tabId: 'tab-2' }],
                },
              ],
            },
            shared: {
              namedRanges: [
                {
                  namedRangeId: 'nr-shared-b',
                  name: 'shared',
                  ranges: [{ startIndex: 41, endIndex: 50, tabId: 'tab-2' }],
                },
              ],
            },
          },
        },
      },
    ],
  };
}

test('buildWriteControl rejects conflicting required and target revision IDs', () => {
  const buildWriteControl = (GDocsHelpers as any).buildWriteControl;

  assert.equal(typeof buildWriteControl, 'function');
  assert.throws(
    () =>
      buildWriteControl({
        requiredRevisionId: 'rev-1',
        targetRevisionId: 'rev-2',
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('Choose only one'),
  );
});

test('flattenDocumentNamedRanges collects named ranges from all tabs', () => {
  const flattenDocumentNamedRanges = (GDocsHelpers as any).flattenDocumentNamedRanges;

  assert.equal(typeof flattenDocumentNamedRanges, 'function');
  assert.deepEqual(
    flattenDocumentNamedRanges(makeDocumentWithTabs()).map((range: any) => ({
      name: range.name,
      namedRangeId: range.namedRangeId,
      tabId: range.tabId,
    })),
    [
      { name: 'uniqueA', namedRangeId: 'nr-unique-a', tabId: 'tab-1' },
      { name: 'shared', namedRangeId: 'nr-shared-a', tabId: 'tab-1' },
      { name: 'uniqueB', namedRangeId: 'nr-unique-b', tabId: 'tab-2' },
      { name: 'shared', namedRangeId: 'nr-shared-b', tabId: 'tab-2' },
    ],
  );
});

test('resolveUniqueNamedRangeFromDocument errors when the same name exists in multiple tabs', () => {
  const resolveUniqueNamedRangeFromDocument = (GDocsHelpers as any).resolveUniqueNamedRangeFromDocument;

  assert.equal(typeof resolveUniqueNamedRangeFromDocument, 'function');
  assert.throws(
    () =>
      resolveUniqueNamedRangeFromDocument(makeDocumentWithTabs(), {
        namedRangeName: 'shared',
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('Multiple named ranges found with name "shared"') &&
      error.message.includes('tab-1') &&
      error.message.includes('tab-2'),
  );
});

test('resolveUniqueNamedRangeFromDocument resolves by exact id even when names collide', () => {
  const resolveUniqueNamedRangeFromDocument = (GDocsHelpers as any).resolveUniqueNamedRangeFromDocument;

  assert.equal(typeof resolveUniqueNamedRangeFromDocument, 'function');
  assert.deepEqual(
    resolveUniqueNamedRangeFromDocument(makeDocumentWithTabs(), {
      namedRangeId: 'nr-shared-b',
    }),
    {
      name: 'shared',
      namedRangeId: 'nr-shared-b',
      tabId: 'tab-2',
      tabTitle: 'Tab 2',
      ranges: [{ startIndex: 41, endIndex: 50, tabId: 'tab-2' }],
    },
  );
});

test('buildWriteControl returns requiredRevisionId when provided', () => {
  const buildWriteControl = (GDocsHelpers as any).buildWriteControl;

  assert.equal(typeof buildWriteControl, 'function');
  assert.deepEqual(
    buildWriteControl({ requiredRevisionId: 'rev-1' }),
    { requiredRevisionId: 'rev-1' },
  );
});

test('buildDeleteNamedRangeRequest adds tabsCriteria when tabId is provided', () => {
  const buildDeleteNamedRangeRequest = (GDocsHelpers as any).buildDeleteNamedRangeRequest;

  assert.equal(typeof buildDeleteNamedRangeRequest, 'function');
  assert.deepEqual(
    buildDeleteNamedRangeRequest({
      namedRangeId: 'nr-1',
      tabId: 'tab-123',
    }),
    {
      deleteNamedRange: {
        namedRangeId: 'nr-1',
        tabsCriteria: {
          tabIds: ['tab-123'],
        },
      },
    },
  );
});

test('buildReplaceNamedRangeContentRequest adds tabsCriteria when tabId is provided', () => {
  const buildReplaceNamedRangeContentRequest = (GDocsHelpers as any).buildReplaceNamedRangeContentRequest;

  assert.equal(typeof buildReplaceNamedRangeContentRequest, 'function');
  assert.deepEqual(
    buildReplaceNamedRangeContentRequest({
      namedRangeId: 'nr-1',
      text: 'replacement',
      tabId: 'tab-123',
    }),
    {
      replaceNamedRangeContent: {
        namedRangeId: 'nr-1',
        text: 'replacement',
        tabsCriteria: {
          tabIds: ['tab-123'],
        },
      },
    },
  );
});

test('resolveSemanticInsertPosition returns end-of-body metadata', () => {
  const resolveSemanticInsertPosition = (GDocsHelpers as any).resolveSemanticInsertPosition;

  assert.equal(typeof resolveSemanticInsertPosition, 'function');
  assert.deepEqual(
    resolveSemanticInsertPosition({
      bodyContent: [
        { endIndex: 1, sectionBreak: {} },
        makeParagraph(1, 33, 'Doc Title'),
      ],
      positionType: 'endOfBody',
    }),
    {
      index: 32,
      endOfSegmentLocation: { segmentId: '' },
    },
  );
});

test('resolveSemanticInsertPosition errors when duplicate headings match', () => {
  const resolveSemanticInsertPosition = (GDocsHelpers as any).resolveSemanticInsertPosition;

  assert.equal(typeof resolveSemanticInsertPosition, 'function');
  assert.throws(
    () =>
      resolveSemanticInsertPosition({
        bodyContent: [
          { endIndex: 1, sectionBreak: {} },
          makeParagraph(1, 12, 'Overview', 'HEADING_2'),
          makeParagraph(12, 24, 'Overview', 'HEADING_2'),
        ],
        positionType: 'afterHeading',
        headingText: 'Overview',
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('Multiple headings'),
  );
});

test('resolveSemanticInsertPosition resolves a unique heading', () => {
  const resolveSemanticInsertPosition = (GDocsHelpers as any).resolveSemanticInsertPosition;

  assert.equal(typeof resolveSemanticInsertPosition, 'function');
  assert.deepEqual(
    resolveSemanticInsertPosition({
      bodyContent: [
        { endIndex: 1, sectionBreak: {} },
        makeParagraph(1, 12, 'Overview', 'HEADING_2'),
        makeParagraph(12, 25, 'Body paragraph'),
      ],
      positionType: 'afterHeading',
      headingText: 'Overview',
    }),
    { index: 12 },
  );
});

test('resolveSemanticInsertPosition errors when named range names are duplicated', () => {
  const resolveSemanticInsertPosition = (GDocsHelpers as any).resolveSemanticInsertPosition;

  assert.equal(typeof resolveSemanticInsertPosition, 'function');
  assert.throws(
    () =>
      resolveSemanticInsertPosition({
        bodyContent: [makeParagraph(1, 12, 'Overview', 'HEADING_2')],
        namedRanges: makeNamedRanges(),
        positionType: 'startOfNamedRange',
        namedRangeName: 'duplicate',
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('Multiple named ranges'),
  );
});

test('resolveSemanticInsertPosition errors for split named ranges', () => {
  const resolveSemanticInsertPosition = (GDocsHelpers as any).resolveSemanticInsertPosition;

  assert.equal(typeof resolveSemanticInsertPosition, 'function');
  assert.throws(
    () =>
      resolveSemanticInsertPosition({
        bodyContent: [makeParagraph(1, 12, 'Overview', 'HEADING_2')],
        namedRanges: makeNamedRanges(),
        positionType: 'endOfNamedRange',
        namedRangeName: 'splitRange',
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('split into multiple ranges'),
  );
});

test('resolveSemanticInsertPosition resolves a unique named range by name', () => {
  const resolveSemanticInsertPosition = (GDocsHelpers as any).resolveSemanticInsertPosition;

  assert.equal(typeof resolveSemanticInsertPosition, 'function');
  assert.deepEqual(
    resolveSemanticInsertPosition({
      bodyContent: [makeParagraph(1, 12, 'Overview', 'HEADING_2')],
      namedRanges: makeNamedRanges(),
      positionType: 'endOfNamedRange',
      namedRangeName: 'sectionA',
    }),
    { index: 20 },
  );
});
