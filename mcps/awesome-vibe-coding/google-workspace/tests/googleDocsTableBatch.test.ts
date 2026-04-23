import assert from 'node:assert/strict';
import test from 'node:test';
import { UserError } from 'fastmcp';

import * as GDocsHelpers from '../src/googleDocsApiHelpers.ts';

const KEEP_AS_IS_SENTINEL = '[KEEP-AS-IS]';

function makeCell(startIndex: number, endIndex: number, text: string) {
  return {
    content: [
      {
        startIndex,
        endIndex,
        paragraph: {
          elements: [
            {
              startIndex,
              endIndex,
              textRun: { content: text },
            },
          ],
        },
      },
    ],
  };
}

function makeTableRows() {
  return [
    {
      tableCells: [
        makeCell(10, 12, 'A\n'),
        makeCell(20, 22, 'B\n'),
        makeCell(30, 32, 'C\n'),
      ],
    },
    {
      tableCells: [
        makeCell(40, 42, 'D\n'),
        makeCell(50, 52, 'E\n'),
        makeCell(60, 62, 'F\n'),
      ],
    },
  ];
}

function makeLargeTableRows(rowCount: number, columnCount: number) {
  let nextIndex = 10;

  return Array.from({ length: rowCount }, () => ({
    tableCells: Array.from({ length: columnCount }, () => {
      const cell = makeCell(nextIndex, nextIndex + 2, 'X\n');
      nextIndex += 10;
      return cell;
    }),
  }));
}

function makeBodyContent(endIndex = 33) {
  return [
    { endIndex: 1, sectionBreak: {} },
    {
      startIndex: 1,
      endIndex,
      paragraph: {
        elements: [
          {
            startIndex: 1,
            endIndex,
            textRun: { content: 'Google Workspace MCP smoke test\n' },
          },
        ],
      },
    },
  ];
}

test('validateTableCellMatrix rejects ragged matrices', () => {
  const validateTableCellMatrix = (GDocsHelpers as any).validateTableCellMatrix;

  assert.equal(typeof validateTableCellMatrix, 'function');
  assert.throws(
    () => validateTableCellMatrix([['A', 'B'], ['C']]),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('rectangular'),
  );
});

test('buildBatchTableCellEditRequests rejects out-of-bounds rectangles', () => {
  const buildBatchTableCellEditRequests = (GDocsHelpers as any).buildBatchTableCellEditRequests;

  assert.equal(typeof buildBatchTableCellEditRequests, 'function');
  assert.throws(
    () =>
      buildBatchTableCellEditRequests({
        tableRows: makeTableRows(),
        rowIndex: 1,
        columnIndex: 2,
        cellMatrix: [
          ['X', 'Y'],
          ['Z', 'W'],
        ],
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('out of range'),
  );
});

test('buildBatchTableCellEditRequests plans a descending rectangular batch and preserves keep-as-is text', () => {
  const buildBatchTableCellEditRequests = (GDocsHelpers as any).buildBatchTableCellEditRequests;

  assert.equal(typeof buildBatchTableCellEditRequests, 'function');

  const requests = buildBatchTableCellEditRequests({
    tableRows: makeTableRows(),
    rowIndex: 0,
    columnIndex: 1,
    cellMatrix: [
      [KEEP_AS_IS_SENTINEL, 'C2'],
      ['E2', 'F2'],
    ],
    textStyle: { bold: true },
  });

  assert.equal(requests.length, 10);

  assert.deepEqual(requests[0], {
    deleteContentRange: {
      range: { startIndex: 60, endIndex: 61 },
    },
  });
  assert.deepEqual(requests[1], {
    insertText: {
      location: { index: 60 },
      text: 'F2',
    },
  });
  assert.deepEqual(requests[2], {
    updateTextStyle: {
      range: { startIndex: 60, endIndex: 62 },
      textStyle: { bold: true },
      fields: 'bold',
    },
  });

  const lastRequest = requests[requests.length - 1];
  assert.deepEqual(lastRequest, {
    updateTextStyle: {
      range: { startIndex: 20, endIndex: 21 },
      textStyle: { bold: true },
      fields: 'bold',
    },
  });
});

test('buildBatchTableCellEditRequests rejects keep-as-is batches without style changes', () => {
  const buildBatchTableCellEditRequests = (GDocsHelpers as any).buildBatchTableCellEditRequests;

  assert.equal(typeof buildBatchTableCellEditRequests, 'function');
  assert.throws(
    () =>
      buildBatchTableCellEditRequests({
        tableRows: makeTableRows(),
        rowIndex: 0,
        columnIndex: 0,
        cellMatrix: [[KEEP_AS_IS_SENTINEL]],
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('No changes specified'),
  );
});

test('buildBatchTableCellEditRequests rejects batches that exceed the Docs request cap', () => {
  const buildBatchTableCellEditRequests = (GDocsHelpers as any).buildBatchTableCellEditRequests;

  assert.equal(typeof buildBatchTableCellEditRequests, 'function');
  assert.throws(
    () =>
      buildBatchTableCellEditRequests({
        tableRows: makeLargeTableRows(5, 6),
        rowIndex: 0,
        columnIndex: 0,
        cellMatrix: Array.from({ length: 5 }, () => Array.from({ length: 6 }, () => 'Z')),
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('exceeds the maximum supported batch size'),
  );
});

test('buildInsertTableRequests rewrites a document-end index to the last writable position', () => {
  const buildInsertTableRequests = (GDocsHelpers as any).buildInsertTableRequests;

  assert.equal(typeof buildInsertTableRequests, 'function');

  const requests = buildInsertTableRequests({
    bodyContent: makeBodyContent(33),
    index: 33,
    rows: 2,
    columns: 2,
  });

  assert.deepEqual(requests, [
    { insertText: { location: { index: 32 }, text: '\n' } },
    { insertTable: { location: { index: 33 }, rows: 2, columns: 2 } },
  ]);
});

test('buildInsertTableRequests preserves interior insertion indices', () => {
  const buildInsertTableRequests = (GDocsHelpers as any).buildInsertTableRequests;

  assert.equal(typeof buildInsertTableRequests, 'function');

  const requests = buildInsertTableRequests({
    bodyContent: makeBodyContent(40),
    index: 10,
    rows: 2,
    columns: 3,
  });

  assert.deepEqual(requests, [
    { insertText: { location: { index: 10 }, text: '\n' } },
    { insertTable: { location: { index: 11 }, rows: 2, columns: 3 } },
  ]);
});

test('buildInsertTableRequests applies tabId to endOfSegmentLocation requests', () => {
  const buildInsertTableRequests = (GDocsHelpers as any).buildInsertTableRequests;

  assert.equal(typeof buildInsertTableRequests, 'function');

  const requests = buildInsertTableRequests({
    endOfSegmentLocation: { segmentId: '' },
    tabId: 'tab-123',
    rows: 2,
    columns: 2,
  });

  assert.deepEqual(requests, [
    {
      insertText: {
        endOfSegmentLocation: { segmentId: '', tabId: 'tab-123' },
        text: '\n',
      },
    },
    {
      insertTable: {
        endOfSegmentLocation: { segmentId: '', tabId: 'tab-123' },
        rows: 2,
        columns: 2,
      },
    },
  ]);
});

test('buildInsertTableRequests rejects conflicting tab IDs for endOfSegmentLocation', () => {
  const buildInsertTableRequests = (GDocsHelpers as any).buildInsertTableRequests;

  assert.equal(typeof buildInsertTableRequests, 'function');
  assert.throws(
    () =>
      buildInsertTableRequests({
        endOfSegmentLocation: { segmentId: '', tabId: 'tab-a' },
        tabId: 'tab-b',
        rows: 1,
        columns: 1,
      }),
    (error: unknown) =>
      error instanceof UserError &&
      error.message.includes('Conflicting tab IDs'),
  );
});
