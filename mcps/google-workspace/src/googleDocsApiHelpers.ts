// src/googleDocsApiHelpers.ts
import { google, docs_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { UserError } from 'fastmcp';
import { TextStyleArgs, ParagraphStyleArgs, hexToRgbColor, NotImplementedError } from './types.js';

type Docs = docs_v1.Docs; // Alias for convenience

// --- Constants ---
const MAX_BATCH_UPDATE_REQUESTS = 50; // Google API limits batch size

type BuildWriteControlArgs = {
    requiredRevisionId?: string;
    targetRevisionId?: string;
};

type BuildNamedRangeMutationArgs = {
    namedRangeId: string;
    tabId?: string;
};

type BuildReplaceNamedRangeContentRequestArgs = BuildNamedRangeMutationArgs & {
    text: string;
};

type SemanticPositionType =
    | 'endOfBody'
    | 'endOfTab'
    | 'afterHeading'
    | 'startOfNamedRange'
    | 'endOfNamedRange';

type FlattenedNamedRange = {
    name: string;
    namedRangeId: string;
    ranges: docs_v1.Schema$Range[];
    tabId?: string;
    tabTitle?: string;
};

type ResolveUniqueNamedRangeFromDocumentArgs = {
    namedRangeName?: string;
    namedRangeId?: string;
    expectedTabId?: string;
};

type ResolveSemanticInsertPositionArgs = {
    bodyContent: any[];
    namedRanges?: Record<string, any>;
    positionType: SemanticPositionType;
    tabId?: string;
    headingText?: string;
    headingNamedStyleType?: string;
    namedRangeName?: string;
    namedRangeId?: string;
};

type ResolvedSemanticInsertPosition = {
    index?: number;
    endOfSegmentLocation?: docs_v1.Schema$EndOfSegmentLocation;
};

// --- Core Helper to Execute Batch Updates ---
export async function executeBatchUpdate(
    docs: Docs,
    documentId: string,
    requests: docs_v1.Schema$Request[],
    writeControl?: docs_v1.Schema$WriteControl
): Promise<docs_v1.Schema$BatchUpdateDocumentResponse> {
if (!requests || requests.length === 0) {
// console.warn("executeBatchUpdate called with no requests.");
return {}; // Nothing to do
}

    // TODO: Consider splitting large request arrays into multiple batches if needed
    if (requests.length > MAX_BATCH_UPDATE_REQUESTS) {
         console.warn(`Attempting batch update with ${requests.length} requests, exceeding typical limits. May fail.`);
    }

    try {
        const response = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests,
                ...(writeControl ? { writeControl } : {}),
            },
        });
        return response.data;
    } catch (error: any) {
        console.error(`Google API batchUpdate Error for doc ${documentId}:`, error.response?.data || error.message);
        // Translate common API errors to UserErrors
        if (error.code === 400 && error.message.includes('Invalid requests')) {
             // Try to extract more specific info if available
             const details = error.response?.data?.error?.details;
             let detailMsg = '';
             if (details && Array.isArray(details)) {
                 detailMsg = details.map(d => d.description || JSON.stringify(d)).join('; ');
             }
            throw new UserError(`Invalid request sent to Google Docs API. Details: ${detailMsg || error.message}`);
        }
        if (error.code === 404) throw new UserError(`Document not found (ID: ${documentId}). Check the ID.`);
        if (error.code === 403) throw new UserError(`Permission denied for document (ID: ${documentId}). Ensure the authenticated user has edit access.`);
        // Generic internal error for others
        throw new Error(`Google API Error (${error.code}): ${error.message}`);
    }

}

// --- Text Finding Helper ---
// This improved version is more robust in handling various text structure scenarios
export async function findTextRange(docs: Docs, documentId: string, textToFind: string, instance: number = 1, tabId?: string): Promise<{ startIndex: number; endIndex: number } | null> {
try {
    let bodyContent: any[];

    if (tabId) {
        const res = await docs.documents.get({
            documentId,
            includeTabsContent: true,
        });
        const tab = findTabById(res.data, tabId);
        if (!tab) throw new UserError(`Tab with ID "${tabId}" not found in document.`);
        if (!tab.documentTab?.body?.content) {
            console.warn(`No content found in tab ${tabId} of document ${documentId}`);
            return null;
        }
        bodyContent = tab.documentTab.body.content;
    } else {
        const res = await docs.documents.get({
            documentId,
            fields: 'body(content(paragraph(elements(startIndex,endIndex,textRun(content))),table,sectionBreak,tableOfContents,startIndex,endIndex))',
        });
        if (!res.data.body?.content) {
            console.warn(`No content found in document ${documentId}`);
            return null;
        }
        bodyContent = res.data.body.content;
    }

    // More robust text collection and index tracking
    let fullText = '';
    const segments: { text: string, start: number, end: number }[] = [];

    // Process all content elements, including structural ones
    const collectTextFromContent = (content: any[]) => {
        content.forEach(element => {
            // Handle paragraph elements
            if (element.paragraph?.elements) {
                element.paragraph.elements.forEach((pe: any) => {
                    if (pe.textRun?.content && pe.startIndex !== undefined && pe.endIndex !== undefined) {
                        const content = pe.textRun.content;
                        fullText += content;
                        segments.push({
                            text: content,
                            start: pe.startIndex,
                            end: pe.endIndex
                        });
                    }
                });
            }

            // Handle table elements - this is simplified and might need expansion
            if (element.table && element.table.tableRows) {
                element.table.tableRows.forEach((row: any) => {
                    if (row.tableCells) {
                        row.tableCells.forEach((cell: any) => {
                            if (cell.content) {
                                collectTextFromContent(cell.content);
                            }
                        });
                    }
                });
            }

            // Add handling for other structural elements as needed
        });
    };

    collectTextFromContent(bodyContent);

    // Sort segments by starting position to ensure correct ordering
    segments.sort((a, b) => a.start - b.start);

    console.log(`Document ${documentId} contains ${segments.length} text segments and ${fullText.length} characters in total.`);

    // Find the specified instance of the text
    let startIndex = -1;
    let endIndex = -1;
    let foundCount = 0;
    let searchStartIndex = 0;

    while (foundCount < instance) {
        const currentIndex = fullText.indexOf(textToFind, searchStartIndex);
        if (currentIndex === -1) {
            console.log(`Search text "${textToFind}" not found for instance ${foundCount + 1} (requested: ${instance})`);
            break;
        }

        foundCount++;
        console.log(`Found instance ${foundCount} of "${textToFind}" at position ${currentIndex} in full text`);

        if (foundCount === instance) {
            const targetStartInFullText = currentIndex;
            const targetEndInFullText = currentIndex + textToFind.length;
            let currentPosInFullText = 0;

            console.log(`Target text range in full text: ${targetStartInFullText}-${targetEndInFullText}`);

            for (const seg of segments) {
                const segStartInFullText = currentPosInFullText;
                const segTextLength = seg.text.length;
                const segEndInFullText = segStartInFullText + segTextLength;

                // Map from reconstructed text position to actual document indices
                if (startIndex === -1 && targetStartInFullText >= segStartInFullText && targetStartInFullText < segEndInFullText) {
                    startIndex = seg.start + (targetStartInFullText - segStartInFullText);
                    console.log(`Mapped start to segment ${seg.start}-${seg.end}, position ${startIndex}`);
                }

                if (targetEndInFullText > segStartInFullText && targetEndInFullText <= segEndInFullText) {
                    endIndex = seg.start + (targetEndInFullText - segStartInFullText);
                    console.log(`Mapped end to segment ${seg.start}-${seg.end}, position ${endIndex}`);
                    break;
                }

                currentPosInFullText = segEndInFullText;
            }

            if (startIndex === -1 || endIndex === -1) {
                console.warn(`Failed to map text "${textToFind}" instance ${instance} to actual document indices`);
                // Reset and try next occurrence
                startIndex = -1;
                endIndex = -1;
                searchStartIndex = currentIndex + 1;
                foundCount--;
                continue;
            }

            console.log(`Successfully mapped "${textToFind}" to document range ${startIndex}-${endIndex}`);
            return { startIndex, endIndex };
        }

        // Prepare for next search iteration
        searchStartIndex = currentIndex + 1;
    }

    console.warn(`Could not find instance ${instance} of text "${textToFind}" in document ${documentId}`);
    return null; // Instance not found or mapping failed for all attempts
} catch (error: any) {
    console.error(`Error finding text "${textToFind}" in doc ${documentId}: ${error.message || 'Unknown error'}`);
    if (error.code === 404) throw new UserError(`Document not found while searching text (ID: ${documentId}).`);
    if (error.code === 403) throw new UserError(`Permission denied while searching text in doc ${documentId}.`);
    throw new Error(`Failed to retrieve doc for text searching: ${error.message || 'Unknown error'}`);
}
}

// --- Paragraph Boundary Helper ---
// Enhanced version to handle document structural elements more robustly
export async function getParagraphRange(docs: Docs, documentId: string, indexWithin: number, tabId?: string): Promise<{ startIndex: number; endIndex: number } | null> {
try {
    console.log(`Finding paragraph containing index ${indexWithin} in document ${documentId}${tabId ? ` (tab: ${tabId})` : ''}`);

    let bodyContent: any[];

    if (tabId) {
        const res = await docs.documents.get({
            documentId,
            includeTabsContent: true,
        });
        const tab = findTabById(res.data, tabId);
        if (!tab) throw new UserError(`Tab with ID "${tabId}" not found in document.`);
        if (!tab.documentTab?.body?.content) {
            console.warn(`No content found in tab ${tabId} of document ${documentId}`);
            return null;
        }
        bodyContent = tab.documentTab.body.content;
    } else {
        const res = await docs.documents.get({
            documentId,
            fields: 'body(content(startIndex,endIndex,paragraph,table,sectionBreak,tableOfContents))',
        });
        if (!res.data.body?.content) {
            console.warn(`No content found in document ${documentId}`);
            return null;
        }
        bodyContent = res.data.body.content;
    }

    // Find paragraph containing the index
    // We'll look at all structural elements recursively
    const findParagraphInContent = (content: any[]): { startIndex: number; endIndex: number } | null => {
        for (const element of content) {
            // Check if we have element boundaries defined
            if (element.startIndex !== undefined && element.endIndex !== undefined) {
                // Check if index is within this element's range first
                if (indexWithin >= element.startIndex && indexWithin < element.endIndex) {
                    // If it's a paragraph, we've found our target
                    if (element.paragraph) {
                        console.log(`Found paragraph containing index ${indexWithin}, range: ${element.startIndex}-${element.endIndex}`);
                        return {
                            startIndex: element.startIndex,
                            endIndex: element.endIndex
                        };
                    }

                    // If it's a table, we need to check cells recursively
                    if (element.table && element.table.tableRows) {
                        console.log(`Index ${indexWithin} is within a table, searching cells...`);
                        for (const row of element.table.tableRows) {
                            if (row.tableCells) {
                                for (const cell of row.tableCells) {
                                    if (cell.content) {
                                        const result = findParagraphInContent(cell.content);
                                        if (result) return result;
                                    }
                                }
                            }
                        }
                    }

                    // For other structural elements, we didn't find a paragraph
                    // but we know the index is within this element
                    console.warn(`Index ${indexWithin} is within element (${element.startIndex}-${element.endIndex}) but not in a paragraph`);
                }
            }
        }

        return null;
    };

    const paragraphRange = findParagraphInContent(bodyContent);

    if (!paragraphRange) {
        console.warn(`Could not find paragraph containing index ${indexWithin}`);
    } else {
        console.log(`Returning paragraph range: ${paragraphRange.startIndex}-${paragraphRange.endIndex}`);
    }

    return paragraphRange;

} catch (error: any) {
    console.error(`Error getting paragraph range for index ${indexWithin} in doc ${documentId}: ${error.message || 'Unknown error'}`);
    if (error.code === 404) throw new UserError(`Document not found while finding paragraph (ID: ${documentId}).`);
    if (error.code === 403) throw new UserError(`Permission denied while accessing doc ${documentId}.`);
    throw new Error(`Failed to find paragraph: ${error.message || 'Unknown error'}`);
}
}

export const KEEP_AS_IS_SENTINEL = '[KEEP-AS-IS]';

type TableCellContentRange = {
    startIndex: number;
    endIndex: number;
    textEndIndex: number;
};

type BuildTableCellEditRequestsArgs = {
    cellStartIndex: number;
    cellTextEndIndex: number;
    textContent?: string;
    textStyle?: TextStyleArgs;
    paragraphStyle?: ParagraphStyleArgs;
    tabId?: string;
};

type BuildBatchTableCellEditRequestsArgs = {
    tableRows: any[];
    rowIndex: number;
    columnIndex: number;
    cellMatrix: string[][];
    textStyle?: TextStyleArgs;
    paragraphStyle?: ParagraphStyleArgs;
    tabId?: string;
    keepAsIsSentinel?: string;
};

type BuildInsertTableRequestsArgs = {
    rows: number;
    columns: number;
    tabId?: string;
    bodyContent?: any[];
    index?: number;
    endOfSegmentLocation?: docs_v1.Schema$EndOfSegmentLocation;
};

export function buildWriteControl(args: BuildWriteControlArgs): docs_v1.Schema$WriteControl | undefined {
    if (args.requiredRevisionId && args.targetRevisionId) {
        throw new UserError('Choose only one of requiredRevisionId or targetRevisionId.');
    }

    if (args.requiredRevisionId) {
        return { requiredRevisionId: args.requiredRevisionId };
    }

    if (args.targetRevisionId) {
        return { targetRevisionId: args.targetRevisionId };
    }

    return undefined;
}

export function buildTabsCriteria(tabId?: string): docs_v1.Schema$TabsCriteria | undefined {
    if (!tabId) {
        return undefined;
    }

    return {
        tabIds: [tabId],
    };
}

export function buildDeleteNamedRangeRequest(
    args: BuildNamedRangeMutationArgs
): docs_v1.Schema$Request {
    const tabsCriteria = buildTabsCriteria(args.tabId);
    return {
        deleteNamedRange: {
            namedRangeId: args.namedRangeId,
            ...(tabsCriteria ? { tabsCriteria } : {}),
        },
    };
}

export function buildReplaceNamedRangeContentRequest(
    args: BuildReplaceNamedRangeContentRequestArgs
): docs_v1.Schema$Request {
    const tabsCriteria = buildTabsCriteria(args.tabId);
    return {
        replaceNamedRangeContent: {
            namedRangeId: args.namedRangeId,
            text: args.text,
            ...(tabsCriteria ? { tabsCriteria } : {}),
        },
    };
}

export function getBodyEndIndex(bodyContent: any[]): number {
    return bodyContent.reduce((maxEndIndex: number, element: any) => {
        const elementEndIndex = typeof element?.endIndex === 'number' ? element.endIndex : 0;
        return Math.max(maxEndIndex, elementEndIndex);
    }, 0);
}

function getParagraphText(paragraph: any): string {
    const text = paragraph?.elements?.map((element: any) => element?.textRun?.content || '').join('') || '';
    return text.replace(/\n+$/, '');
}

export function flattenNamedRanges(namedRanges?: Record<string, any>, tabId?: string, tabTitle?: string): FlattenedNamedRange[] {
    if (!namedRanges || typeof namedRanges !== 'object') {
        return [];
    }

    return Object.entries(namedRanges).flatMap(([name, value]) => {
        const ranges = Array.isArray((value as any)?.namedRanges) ? (value as any).namedRanges : [];
        return ranges
            .filter((namedRange: any) => namedRange?.namedRangeId)
            .map((namedRange: any) => ({
                name,
                namedRangeId: namedRange.namedRangeId,
                ranges: Array.isArray(namedRange.ranges) ? namedRange.ranges : [],
                tabId,
                tabTitle,
            }));
    });
}

export function flattenDocumentNamedRanges(documentData: docs_v1.Schema$Document): FlattenedNamedRange[] {
    const allTabs = getAllTabs(documentData);
    if (allTabs.length > 0) {
        return allTabs.flatMap(tab =>
            flattenNamedRanges(
                tab.documentTab?.namedRanges as Record<string, any> | undefined,
                tab.tabProperties?.tabId ?? undefined,
                tab.tabProperties?.title ?? undefined,
            )
        );
    }

    return flattenNamedRanges((documentData as any).namedRanges);
}

export function resolveUniqueNamedRangeFromDocument(
    documentData: docs_v1.Schema$Document,
    args: ResolveUniqueNamedRangeFromDocumentArgs
): FlattenedNamedRange {
    if (args.namedRangeName && args.namedRangeId) {
        throw new UserError('Provide either namedRangeName or namedRangeId, not both.');
    }

    const flattenedRanges = flattenDocumentNamedRanges(documentData);
    if (flattenedRanges.length === 0) {
        throw new UserError('No named ranges were found in the target document.');
    }

    if (args.namedRangeId) {
        const namedRange = flattenedRanges.find(range => range.namedRangeId === args.namedRangeId);
        if (!namedRange) {
            throw new UserError(`No named range found with ID "${args.namedRangeId}".`);
        }
        if (args.expectedTabId && namedRange.tabId && namedRange.tabId !== args.expectedTabId) {
            throw new UserError(
                `Named range ID "${args.namedRangeId}" belongs to tab ${namedRange.tabId}, not ${args.expectedTabId}.`
            );
        }
        return namedRange;
    }

    if (!args.namedRangeName) {
        throw new UserError('namedRangeName or namedRangeId is required.');
    }

    const matchingRanges = flattenedRanges.filter(range => range.name === args.namedRangeName);
    if (matchingRanges.length === 0) {
        throw new UserError(`No named range found with name "${args.namedRangeName}".`);
    }

    if (matchingRanges.length > 1) {
        const matchSummary = matchingRanges
            .map(range => `${range.namedRangeId}@${range.tabId ?? 'document'}${range.tabTitle ? `(${range.tabTitle})` : ''}`)
            .join(', ');
        throw new UserError(
            `Multiple named ranges found with name "${args.namedRangeName}" across the document. Use a specific namedRangeId instead. Matches: [${matchSummary}]`
        );
    }

    const namedRange = matchingRanges[0];
    if (args.expectedTabId && namedRange.tabId && namedRange.tabId !== args.expectedTabId) {
        throw new UserError(
            `Named range "${args.namedRangeName}" belongs to tab ${namedRange.tabId}, not ${args.expectedTabId}.`
        );
    }

    return namedRange;
}

function resolveUniqueNamedRange(
    namedRanges: Record<string, any> | undefined,
    args: { namedRangeName?: string; namedRangeId?: string }
): FlattenedNamedRange {
    if (args.namedRangeName && args.namedRangeId) {
        throw new UserError('Provide either namedRangeName or namedRangeId, not both.');
    }

    const flattenedRanges = flattenNamedRanges(namedRanges);
    if (flattenedRanges.length === 0) {
        throw new UserError('No named ranges were found in the target document or tab.');
    }

    if (args.namedRangeId) {
        const namedRange = flattenedRanges.find(range => range.namedRangeId === args.namedRangeId);
        if (!namedRange) {
            throw new UserError(`No named range found with ID "${args.namedRangeId}".`);
        }
        return namedRange;
    }

    if (!args.namedRangeName) {
        throw new UserError('namedRangeName or namedRangeId is required.');
    }

    const matchingRanges = flattenedRanges.filter(range => range.name === args.namedRangeName);
    if (matchingRanges.length === 0) {
        throw new UserError(`No named range found with name "${args.namedRangeName}".`);
    }

    if (matchingRanges.length > 1) {
        const ids = matchingRanges.map(range => range.namedRangeId).join(', ');
        throw new UserError(
            `Multiple named ranges found with name "${args.namedRangeName}". Resolve the conflict first or target a specific namedRangeId. Matching IDs: [${ids}]`
        );
    }

    return matchingRanges[0];
}

function getSingleNamedRangeRange(namedRange: FlattenedNamedRange): docs_v1.Schema$Range {
    if (!Array.isArray(namedRange.ranges) || namedRange.ranges.length === 0) {
        throw new UserError(`Named range "${namedRange.name}" has no ranges to target.`);
    }

    if (namedRange.ranges.length > 1) {
        throw new UserError(
            `Named range "${namedRange.name}" is split into multiple ranges. Use a more specific anchor before applying a semantic insert position.`
        );
    }

    return namedRange.ranges[0];
}

export function resolveSemanticInsertPosition(
    args: ResolveSemanticInsertPositionArgs
): ResolvedSemanticInsertPosition {
    switch (args.positionType) {
        case 'endOfBody':
        case 'endOfTab': {
            if (args.positionType === 'endOfBody' && args.tabId) {
                throw new UserError('endOfBody cannot be combined with tabId. Use endOfTab when targeting a specific tab.');
            }

            const bodyEndIndex = getBodyEndIndex(args.bodyContent);
            const lastWritableIndex = bodyEndIndex > 1 ? bodyEndIndex - 1 : 1;
            return {
                index: lastWritableIndex,
                endOfSegmentLocation: {
                    segmentId: '',
                    ...(args.tabId ? { tabId: args.tabId } : {}),
                },
            };
        }
        case 'afterHeading': {
            if (!args.headingText) {
                throw new UserError('headingText is required for positionType "afterHeading".');
            }

            const normalizedHeadingText = args.headingText.trim();
            const matches = args.bodyContent
                .filter((element: any) => element?.paragraph)
                .map((element: any) => ({
                    startIndex: element.startIndex,
                    endIndex: element.endIndex,
                    text: getParagraphText(element.paragraph).trim(),
                    namedStyleType: element.paragraph?.paragraphStyle?.namedStyleType,
                }))
                .filter((paragraph: any) => {
                    const isHeading =
                        args.headingNamedStyleType !== undefined
                            ? paragraph.namedStyleType === args.headingNamedStyleType
                            : /^HEADING_[1-6]$/.test(paragraph.namedStyleType || '');
                    return isHeading && paragraph.text === normalizedHeadingText;
                });

            if (matches.length === 0) {
                const styleHint = args.headingNamedStyleType ? ` with style ${args.headingNamedStyleType}` : '';
                throw new UserError(`No heading found with text "${normalizedHeadingText}"${styleHint}.`);
            }

            if (matches.length > 1) {
                const matchSummary = matches
                    .map((match: any) => `${match.namedStyleType || 'UNKNOWN'}@${match.startIndex}-${match.endIndex}`)
                    .join(', ');
                throw new UserError(
                    `Multiple headings matched "${normalizedHeadingText}". Resolve the conflict first or anchor by named range. Matches: [${matchSummary}]`
                );
            }

            return { index: matches[0].endIndex };
        }
        case 'startOfNamedRange':
        case 'endOfNamedRange': {
            const namedRange = resolveUniqueNamedRange(args.namedRanges, {
                namedRangeName: args.namedRangeName,
                namedRangeId: args.namedRangeId,
            });
            const range = getSingleNamedRangeRange(namedRange);
            const index = args.positionType === 'startOfNamedRange' ? range.startIndex : range.endIndex;
            if (typeof index !== 'number') {
                throw new UserError(`Named range "${namedRange.name}" does not have a usable ${args.positionType === 'startOfNamedRange' ? 'start' : 'end'} index.`);
            }
            return { index };
        }
        default:
            throw new UserError(`Unsupported semantic position type "${args.positionType}".`);
    }
}

export function validateTableCellMatrix(cellMatrix: string[][]): { rowCount: number; columnCount: number } {
    if (!Array.isArray(cellMatrix) || cellMatrix.length === 0) {
        throw new UserError('cellMatrix must contain at least one row.');
    }

    const firstRow = cellMatrix[0];
    if (!Array.isArray(firstRow) || firstRow.length === 0) {
        throw new UserError('cellMatrix must contain at least one column.');
    }

    const columnCount = firstRow.length;
    for (const row of cellMatrix) {
        if (!Array.isArray(row) || row.length !== columnCount) {
            throw new UserError('cellMatrix must be a rectangular matrix with the same number of columns in each row.');
        }
    }

    return { rowCount: cellMatrix.length, columnCount };
}

export function getTableCellContentRange(cell: any): TableCellContentRange {
    const cellContent = cell?.content || [];

    let cellStartIndex = -1;
    let cellEndIndex = -1;
    for (const contentElement of cellContent) {
        if (contentElement.startIndex !== undefined && (cellStartIndex === -1 || contentElement.startIndex < cellStartIndex)) {
            cellStartIndex = contentElement.startIndex;
        }
        if (contentElement.endIndex !== undefined && contentElement.endIndex > cellEndIndex) {
            cellEndIndex = contentElement.endIndex;
        }
    }

    if (cellStartIndex === -1) {
        throw new UserError('Could not determine cell content range.');
    }

    return {
        startIndex: cellStartIndex,
        endIndex: cellEndIndex,
        textEndIndex: Math.max(cellStartIndex, cellEndIndex - 1),
    };
}

export function buildTableCellEditRequests(args: BuildTableCellEditRequestsArgs): docs_v1.Schema$Request[] {
    const requests: docs_v1.Schema$Request[] = [];

    if (args.textContent !== undefined) {
        if (args.cellTextEndIndex > args.cellStartIndex) {
            const deleteRange: any = {
                startIndex: args.cellStartIndex,
                endIndex: args.cellTextEndIndex,
            };
            if (args.tabId) deleteRange.tabId = args.tabId;
            requests.push({ deleteContentRange: { range: deleteRange } });
        }

        if (args.textContent.length > 0) {
            const location: any = { index: args.cellStartIndex };
            if (args.tabId) location.tabId = args.tabId;
            requests.push({ insertText: { location, text: args.textContent } });
        }

        if (args.textStyle && args.textContent.length > 0) {
            const styleResult = buildUpdateTextStyleRequest(
                args.cellStartIndex,
                args.cellStartIndex + args.textContent.length,
                args.textStyle,
                args.tabId,
            );
            if (styleResult) requests.push(styleResult.request);
        }

        if (args.paragraphStyle && args.textContent.length > 0) {
            const paragraphResult = buildUpdateParagraphStyleRequest(
                args.cellStartIndex,
                args.cellStartIndex + args.textContent.length,
                args.paragraphStyle,
                args.tabId,
            );
            if (paragraphResult) requests.push(paragraphResult.request);
        }

        return requests;
    }

    if (args.textStyle && args.cellTextEndIndex > args.cellStartIndex) {
        const styleResult = buildUpdateTextStyleRequest(
            args.cellStartIndex,
            args.cellTextEndIndex,
            args.textStyle,
            args.tabId,
        );
        if (styleResult) requests.push(styleResult.request);
    }

    if (args.paragraphStyle && args.cellTextEndIndex > args.cellStartIndex) {
        const paragraphResult = buildUpdateParagraphStyleRequest(
            args.cellStartIndex,
            args.cellTextEndIndex,
            args.paragraphStyle,
            args.tabId,
        );
        if (paragraphResult) requests.push(paragraphResult.request);
    }

    return requests;
}

export function buildBatchTableCellEditRequests(args: BuildBatchTableCellEditRequestsArgs): docs_v1.Schema$Request[] {
    const { rowCount, columnCount } = validateTableCellMatrix(args.cellMatrix);
    const keepAsIsSentinel = args.keepAsIsSentinel ?? KEEP_AS_IS_SENTINEL;

    if (!args.tableRows || args.rowIndex >= args.tableRows.length) {
        throw new UserError(`Row index ${args.rowIndex} out of range. Table has ${args.tableRows?.length || 0} rows.`);
    }

    if (args.rowIndex < 0 || args.columnIndex < 0) {
        throw new UserError('rowIndex and columnIndex must be zero or greater.');
    }

    const requestedRowEnd = args.rowIndex + rowCount;
    if (requestedRowEnd > args.tableRows.length) {
        throw new UserError(`Requested row range is out of range. Table has ${args.tableRows.length} rows.`);
    }

    const hasTextReplacement = args.cellMatrix.some(row => row.some(cell => cell !== keepAsIsSentinel));
    if (!hasTextReplacement && !args.textStyle && !args.paragraphStyle) {
        throw new UserError('No changes specified. Provide new text in cellMatrix or shared textStyle/paragraphStyle.');
    }

    const plannedCellRequests: { startIndex: number; requests: docs_v1.Schema$Request[] }[] = [];

    for (let rowOffset = 0; rowOffset < rowCount; rowOffset++) {
        const targetRowIndex = args.rowIndex + rowOffset;
        const tableCells = args.tableRows[targetRowIndex]?.tableCells;
        const targetColumnEnd = args.columnIndex + columnCount;

        if (!tableCells || targetColumnEnd > tableCells.length) {
            throw new UserError(`Requested column range is out of range. Row ${targetRowIndex} has ${tableCells?.length || 0} columns.`);
        }

        for (let columnOffset = 0; columnOffset < columnCount; columnOffset++) {
            const targetColumnIndex = args.columnIndex + columnOffset;
            const cell = tableCells[targetColumnIndex];
            const range = getTableCellContentRange(cell);
            const cellValue = args.cellMatrix[rowOffset][columnOffset];
            const requests = buildTableCellEditRequests({
                cellStartIndex: range.startIndex,
                cellTextEndIndex: range.textEndIndex,
                textContent: cellValue === keepAsIsSentinel ? undefined : cellValue,
                textStyle: args.textStyle,
                paragraphStyle: args.paragraphStyle,
                tabId: args.tabId,
            });

            if (requests.length > 0) {
                plannedCellRequests.push({
                    startIndex: range.startIndex,
                    requests,
                });
            }
        }
    }

    if (plannedCellRequests.length === 0) {
        throw new UserError('No changes specified. Provide new text in cellMatrix or shared textStyle/paragraphStyle.');
    }

    plannedCellRequests.sort((left, right) => right.startIndex - left.startIndex);
    const requests = plannedCellRequests.flatMap(cellPlan => cellPlan.requests);

    if (requests.length > MAX_BATCH_UPDATE_REQUESTS) {
        throw new UserError(
            `Planned ${requests.length} Google Docs batchUpdate requests, which exceeds the maximum supported batch size of ${MAX_BATCH_UPDATE_REQUESTS}. Split the table edit into smaller batches.`
        );
    }

    return requests;
}

export function buildInsertTableRequests(args: BuildInsertTableRequestsArgs): docs_v1.Schema$Request[] {
    if (args.endOfSegmentLocation) {
        const endOfSegmentLocation = { ...args.endOfSegmentLocation };
        if (args.tabId) {
            if (endOfSegmentLocation.tabId && endOfSegmentLocation.tabId !== args.tabId) {
                throw new UserError(
                    `Conflicting tab IDs provided for endOfSegmentLocation: ${endOfSegmentLocation.tabId} and ${args.tabId}.`
                );
            }
            endOfSegmentLocation.tabId = args.tabId;
        }

        return [
            {
                insertText: {
                    endOfSegmentLocation,
                    text: '\n',
                },
            },
            {
                insertTable: {
                    endOfSegmentLocation,
                    rows: args.rows,
                    columns: args.columns,
                },
            },
        ];
    }

    if (args.index === undefined || !args.bodyContent) {
        throw new UserError('buildInsertTableRequests requires either endOfSegmentLocation or both bodyContent and index.');
    }

    let normalizedIndex = args.index;

    // Google Docs insertText cannot target the terminal body end index directly.
    // When callers pass the document end index from a read response, rewrite it to
    // the last writable position just before the implicit trailing newline.
    const bodyEndIndex = getBodyEndIndex(args.bodyContent);

    if (bodyEndIndex > 1 && args.index === bodyEndIndex) {
        normalizedIndex = bodyEndIndex - 1;
    }

    const location: any = { index: normalizedIndex };
    if (args.tabId) location.tabId = args.tabId;

    return [
        { insertText: { location: { ...location }, text: '\n' } },
        { insertTable: { location: { ...location, index: normalizedIndex + 1 }, rows: args.rows, columns: args.columns } },
    ];
}

// --- Style Request Builders ---

export function buildUpdateTextStyleRequest(
startIndex: number,
endIndex: number,
style: TextStyleArgs,
tabId?: string
): { request: docs_v1.Schema$Request, fields: string[] } | null {
    const textStyle: docs_v1.Schema$TextStyle = {};
const fieldsToUpdate: string[] = [];

    if (style.bold !== undefined) { textStyle.bold = style.bold; fieldsToUpdate.push('bold'); }
    if (style.italic !== undefined) { textStyle.italic = style.italic; fieldsToUpdate.push('italic'); }
    if (style.underline !== undefined) { textStyle.underline = style.underline; fieldsToUpdate.push('underline'); }
    if (style.strikethrough !== undefined) { textStyle.strikethrough = style.strikethrough; fieldsToUpdate.push('strikethrough'); }
    if (style.fontSize !== undefined) { textStyle.fontSize = { magnitude: style.fontSize, unit: 'PT' }; fieldsToUpdate.push('fontSize'); }
    if (style.fontFamily !== undefined) { textStyle.weightedFontFamily = { fontFamily: style.fontFamily }; fieldsToUpdate.push('weightedFontFamily'); }
    if (style.foregroundColor !== undefined) {
        const rgbColor = hexToRgbColor(style.foregroundColor);
        if (!rgbColor) throw new UserError(`Invalid foreground hex color format: ${style.foregroundColor}`);
        textStyle.foregroundColor = { color: { rgbColor: rgbColor } }; fieldsToUpdate.push('foregroundColor');
    }
     if (style.backgroundColor !== undefined) {
        const rgbColor = hexToRgbColor(style.backgroundColor);
        if (!rgbColor) throw new UserError(`Invalid background hex color format: ${style.backgroundColor}`);
        textStyle.backgroundColor = { color: { rgbColor: rgbColor } }; fieldsToUpdate.push('backgroundColor');
    }
    if (style.linkUrl !== undefined) {
        textStyle.link = { url: style.linkUrl }; fieldsToUpdate.push('link');
    }
    // TODO: Handle clearing formatting

    if (fieldsToUpdate.length === 0) return null; // No styles to apply

    const range: any = { startIndex, endIndex };
    if (tabId) range.tabId = tabId;

    const request: docs_v1.Schema$Request = {
        updateTextStyle: {
            range,
            textStyle: textStyle,
            fields: fieldsToUpdate.join(','),
        }
    };
    return { request, fields: fieldsToUpdate };

}

export function buildUpdateParagraphStyleRequest(
startIndex: number,
endIndex: number,
style: ParagraphStyleArgs,
tabId?: string
): { request: docs_v1.Schema$Request, fields: string[] } | null {
    // Create style object and track which fields to update
    const paragraphStyle: docs_v1.Schema$ParagraphStyle = {};
    const fieldsToUpdate: string[] = [];

    console.log(`Building paragraph style request for range ${startIndex}-${endIndex} with options:`, style);

    // Process alignment option (LEFT, CENTER, RIGHT, JUSTIFIED)
    if (style.alignment !== undefined) {
        paragraphStyle.alignment = style.alignment;
        fieldsToUpdate.push('alignment');
        console.log(`Setting alignment to ${style.alignment}`);
    }

    // Process indentation options
    if (style.indentStart !== undefined) {
        paragraphStyle.indentStart = { magnitude: style.indentStart, unit: 'PT' };
        fieldsToUpdate.push('indentStart');
        console.log(`Setting left indent to ${style.indentStart}pt`);
    }

    if (style.indentEnd !== undefined) {
        paragraphStyle.indentEnd = { magnitude: style.indentEnd, unit: 'PT' };
        fieldsToUpdate.push('indentEnd');
        console.log(`Setting right indent to ${style.indentEnd}pt`);
    }

    // Process spacing options
    if (style.spaceAbove !== undefined) {
        paragraphStyle.spaceAbove = { magnitude: style.spaceAbove, unit: 'PT' };
        fieldsToUpdate.push('spaceAbove');
        console.log(`Setting space above to ${style.spaceAbove}pt`);
    }

    if (style.spaceBelow !== undefined) {
        paragraphStyle.spaceBelow = { magnitude: style.spaceBelow, unit: 'PT' };
        fieldsToUpdate.push('spaceBelow');
        console.log(`Setting space below to ${style.spaceBelow}pt`);
    }

    // Process named style types (headings, etc.)
    if (style.namedStyleType !== undefined) {
        paragraphStyle.namedStyleType = style.namedStyleType;
        fieldsToUpdate.push('namedStyleType');
        console.log(`Setting named style to ${style.namedStyleType}`);
    }

    // Process page break control
    if (style.keepWithNext !== undefined) {
        paragraphStyle.keepWithNext = style.keepWithNext;
        fieldsToUpdate.push('keepWithNext');
        console.log(`Setting keepWithNext to ${style.keepWithNext}`);
    }

    // Verify we have styles to apply
    if (fieldsToUpdate.length === 0) {
        console.warn("No paragraph styling options were provided");
        return null; // No styles to apply
    }

    // Build the request object
    const range: any = { startIndex, endIndex };
    if (tabId) range.tabId = tabId;

    const request: docs_v1.Schema$Request = {
        updateParagraphStyle: {
            range,
            paragraphStyle: paragraphStyle,
            fields: fieldsToUpdate.join(','),
        }
    };

    console.log(`Created paragraph style request with fields: ${fieldsToUpdate.join(', ')}`);
    return { request, fields: fieldsToUpdate };
}

// --- Specific Feature Helpers ---

export async function createTable(
    docs: Docs,
    documentId: string,
    rows: number,
    columns: number,
    index: number,
    tabId?: string,
    writeControl?: docs_v1.Schema$WriteControl
): Promise<docs_v1.Schema$BatchUpdateDocumentResponse> {
    if (rows < 1 || columns < 1) {
        throw new UserError("Table must have at least 1 row and 1 column.");
    }
    const location: any = { index };
    if (tabId) location.tabId = tabId;
    const request: docs_v1.Schema$Request = {
insertTable: {
location,
rows: rows,
columns: columns,
}
};
return executeBatchUpdate(docs, documentId, [request], writeControl);
}

export async function insertText(
    docs: Docs,
    documentId: string,
    text: string,
    index: number,
    tabId?: string,
    writeControl?: docs_v1.Schema$WriteControl,
    endOfSegmentLocation?: docs_v1.Schema$EndOfSegmentLocation
): Promise<docs_v1.Schema$BatchUpdateDocumentResponse> {
    if (!text) return {}; // Nothing to insert
    const request: docs_v1.Schema$Request = {
insertText: {
...(endOfSegmentLocation
    ? { endOfSegmentLocation }
    : {
        location: {
            index,
            ...(tabId ? { tabId } : {}),
        },
    }),
text: text,
}
};
return executeBatchUpdate(docs, documentId, [request], writeControl);
}

// --- Complex / Stubbed Helpers ---

export async function findParagraphsMatchingStyle(
docs: Docs,
documentId: string,
styleCriteria: any // Define a proper type for criteria (e.g., { fontFamily: 'Arial', bold: true })
): Promise<{ startIndex: number; endIndex: number }[]> {
// TODO: Implement logic
// 1. Get document content with paragraph elements and their styles.
// 2. Iterate through paragraphs.
// 3. For each paragraph, check if its computed style matches the criteria.
// 4. Return ranges of matching paragraphs.
console.warn("findParagraphsMatchingStyle is not implemented.");
throw new NotImplementedError("Finding paragraphs by style criteria is not yet implemented.");
// return [];
}

export async function detectAndFormatLists(
docs: Docs,
documentId: string,
startIndex?: number,
endIndex?: number
): Promise<docs_v1.Schema$BatchUpdateDocumentResponse> {
// TODO: Implement complex logic
// 1. Get document content (paragraphs, text runs) in the specified range (or whole doc).
// 2. Iterate through paragraphs.
// 3. Identify sequences of paragraphs starting with list-like markers (e.g., "-", "*", "1.", "a)").
// 4. Determine nesting levels based on indentation or marker patterns.
// 5. Generate CreateParagraphBulletsRequests for the identified sequences.
// 6. Potentially delete the original marker text.
// 7. Execute the batch update.
console.warn("detectAndFormatLists is not implemented.");
throw new NotImplementedError("Automatic list detection and formatting is not yet implemented.");
// return {};
}

export async function addCommentHelper(docs: Docs, documentId: string, text: string, startIndex: number, endIndex: number): Promise<void> {
// NOTE: Adding comments typically requires the Google Drive API v3 and different scopes!
// 'https://www.googleapis.com/auth/drive' or more specific comment scopes.
// This helper is a placeholder assuming Drive API client (`drive`) is available and authorized.
/*
const drive = google.drive({version: 'v3', auth: authClient}); // Assuming authClient is available
await drive.comments.create({
fileId: documentId,
requestBody: {
content: text,
anchor: JSON.stringify({ // Anchor format might need verification
'type': 'workbook#textAnchor', // Or appropriate type for Docs
'refs': [{
'docRevisionId': 'head', // Or specific revision
'range': {
'start': startIndex,
'end': endIndex,
}
}]
})
},
fields: 'id'
});
*/
console.warn("addCommentHelper requires Google Drive API and is not implemented.");
throw new NotImplementedError("Adding comments requires Drive API setup and is not yet implemented.");
}

// --- Image Insertion Helpers ---

/**
 * Inserts an inline image into a document from a publicly accessible URL
 * @param docs - Google Docs API client
 * @param documentId - The document ID
 * @param imageUrl - Publicly accessible URL to the image
 * @param index - Position in the document where image should be inserted (1-based)
 * @param width - Optional width in points
 * @param height - Optional height in points
 * @returns Promise with batch update response
 */
export async function insertInlineImage(
    docs: Docs,
    documentId: string,
    imageUrl: string,
    index: number,
    width?: number,
    height?: number,
    tabId?: string,
    writeControl?: docs_v1.Schema$WriteControl,
    endOfSegmentLocation?: docs_v1.Schema$EndOfSegmentLocation
): Promise<docs_v1.Schema$BatchUpdateDocumentResponse> {
    // Validate URL format
    try {
        new URL(imageUrl);
    } catch (e) {
        throw new UserError(`Invalid image URL format: ${imageUrl}`);
    }

    const request: docs_v1.Schema$Request = {
        insertInlineImage: {
            ...(endOfSegmentLocation
                ? { endOfSegmentLocation }
                : {
                    location: {
                        index,
                        ...(tabId ? { tabId } : {}),
                    },
                }),
            uri: imageUrl,
            ...(width && height && {
                objectSize: {
                    height: { magnitude: height, unit: 'PT' },
                    width: { magnitude: width, unit: 'PT' }
                }
            })
        }
    };

    return executeBatchUpdate(docs, documentId, [request], writeControl);
}

/**
 * Uploads a local image file to Google Drive and returns its public URL
 * @param drive - Google Drive API client
 * @param localFilePath - Path to the local image file
 * @param parentFolderId - Optional parent folder ID (defaults to root)
 * @returns Promise with the public webContentLink URL
 */
export async function uploadImageToDrive(
    drive: any, // drive_v3.Drive type
    localFilePath: string,
    parentFolderId?: string
): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');

    // Verify file exists
    if (!fs.existsSync(localFilePath)) {
        throw new UserError(`Image file not found: ${localFilePath}`);
    }

    // Get file name and mime type
    const fileName = path.basename(localFilePath);
    const mimeTypeMap: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
    };

    const ext = path.extname(localFilePath).toLowerCase();
    const mimeType = mimeTypeMap[ext] || 'application/octet-stream';

    // Upload file to Drive
    const fileMetadata: any = {
        name: fileName,
        mimeType: mimeType
    };

    if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
    }

    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(localFilePath)
    };

    const uploadResponse = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,webViewLink,webContentLink'
    });

    const fileId = uploadResponse.data.id;
    if (!fileId) {
        throw new Error('Failed to upload image to Drive - no file ID returned');
    }

    // Make the file publicly readable
    await drive.permissions.create({
        fileId: fileId,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    // Get the webContentLink
    const fileInfo = await drive.files.get({
        fileId: fileId,
        fields: 'webContentLink'
    });

    const webContentLink = fileInfo.data.webContentLink;
    if (!webContentLink) {
        throw new Error('Failed to get public URL for uploaded image');
    }

    return webContentLink;
}

// --- Tab Management Helpers ---

/**
 * Interface for a tab with hierarchy level information
 */
export interface TabWithLevel extends docs_v1.Schema$Tab {
    level: number;
}

/**
 * Recursively collect all tabs from a document in a flat list with hierarchy info
 * @param doc - The Google Doc document object
 * @returns Array of tabs with nesting level information
 */
export function getAllTabs(doc: docs_v1.Schema$Document): TabWithLevel[] {
    const allTabs: TabWithLevel[] = [];
    if (!doc.tabs || doc.tabs.length === 0) {
        return allTabs;
    }

    for (const tab of doc.tabs) {
        addCurrentAndChildTabs(tab, allTabs, 0);
    }
    return allTabs;
}

/**
 * Recursive helper to add tabs with their nesting level
 * @param tab - The tab to add
 * @param allTabs - The accumulator array
 * @param level - Current nesting level (0 for top-level)
 */
function addCurrentAndChildTabs(tab: docs_v1.Schema$Tab, allTabs: TabWithLevel[], level: number): void {
    allTabs.push({ ...tab, level });
    if (tab.childTabs && tab.childTabs.length > 0) {
        for (const childTab of tab.childTabs) {
            addCurrentAndChildTabs(childTab, allTabs, level + 1);
        }
    }
}

/**
 * Get the text length from a DocumentTab
 * @param documentTab - The DocumentTab object
 * @returns Total character count
 */
export function getTabTextLength(documentTab: docs_v1.Schema$DocumentTab | undefined): number {
    let totalLength = 0;

    if (!documentTab?.body?.content) {
        return 0;
    }

    documentTab.body.content.forEach((element: any) => {
        // Handle paragraphs
        if (element.paragraph?.elements) {
            element.paragraph.elements.forEach((pe: any) => {
                if (pe.textRun?.content) {
                    totalLength += pe.textRun.content.length;
                }
            });
        }

        // Handle tables
        if (element.table?.tableRows) {
            element.table.tableRows.forEach((row: any) => {
                row.tableCells?.forEach((cell: any) => {
                    cell.content?.forEach((cellElement: any) => {
                        cellElement.paragraph?.elements?.forEach((pe: any) => {
                            if (pe.textRun?.content) {
                                totalLength += pe.textRun.content.length;
                            }
                        });
                    });
                });
            });
        }
    });

    return totalLength;
}

/**
 * Find a specific tab by ID in a document (searches recursively through child tabs)
 * @param doc - The Google Doc document object
 * @param tabId - The tab ID to search for
 * @returns The tab object if found, null otherwise
 */
export function findTabById(doc: docs_v1.Schema$Document, tabId: string): docs_v1.Schema$Tab | null {
    if (!doc.tabs || doc.tabs.length === 0) {
        return null;
    }

    // Helper function to search through tabs recursively
    const searchTabs = (tabs: docs_v1.Schema$Tab[]): docs_v1.Schema$Tab | null => {
        for (const tab of tabs) {
            if (tab.tabProperties?.tabId === tabId) {
                return tab;
            }
            // Recursively search child tabs
            if (tab.childTabs && tab.childTabs.length > 0) {
                const found = searchTabs(tab.childTabs);
                if (found) return found;
            }
        }
        return null;
    };

    return searchTabs(doc.tabs);
}
