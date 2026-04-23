// src/server.ts
import { FastMCP, UserError } from 'fastmcp';
import { z } from 'zod';
import { google, docs_v1, drive_v3, sheets_v4, calendar_v3, gmail_v1 } from 'googleapis';
import { authorize } from './auth.js';
import { OAuth2Client } from 'google-auth-library';

google.options({ headers: { "User-Agent": "awesome-vibe-coding" } });

import {
DocumentIdParameter,
RangeParameters,
OptionalRangeParameters,
TextFindParameter,
TextStyleParameters,
TextStyleArgs,
ParagraphStyleParameters,
ParagraphStyleArgs,
ApplyTextStyleToolParameters, ApplyTextStyleToolArgs,
ApplyParagraphStyleToolParameters, ApplyParagraphStyleToolArgs,
NotImplementedError
} from './types.js';
import * as GDocsHelpers from './googleDocsApiHelpers.js';
import * as SheetsHelpers from './googleSheetsApiHelpers.js';
import * as CalendarHelpers from './googleCalendarApiHelpers.js';
import * as GmailHelpers from './googleGmailApiHelpers.js';

let authClient: OAuth2Client | null = null;
let googleDocs: docs_v1.Docs | null = null;
let googleDrive: drive_v3.Drive | null = null;
let googleSheets: sheets_v4.Sheets | null = null;
let googleCalendar: calendar_v3.Calendar | null = null;
let googleGmail: gmail_v1.Gmail | null = null;

async function initializeGoogleClient() {
if (googleDocs && googleDrive && googleSheets && googleCalendar && googleGmail) return { authClient, googleDocs, googleDrive, googleSheets, googleCalendar, googleGmail };
if (!authClient) {
try {
console.error("Attempting to authorize Google API client...");
const client = await authorize();
authClient = client;
googleDocs = google.docs({ version: 'v1', auth: authClient });
googleDrive = google.drive({ version: 'v3', auth: authClient });
googleSheets = google.sheets({ version: 'v4', auth: authClient });
googleCalendar = google.calendar({ version: 'v3', auth: authClient });
googleGmail = google.gmail({ version: 'v1', auth: authClient });
console.error("Google API client authorized successfully.");
} catch (error) {
console.error("FATAL: Failed to initialize Google API client:", error);
authClient = null;
googleDocs = null;
googleDrive = null;
googleSheets = null;
googleCalendar = null;
googleGmail = null;
throw new Error("Google client initialization failed. Cannot start server tools.");
}
}
if (authClient && !googleDocs) googleDocs = google.docs({ version: 'v1', auth: authClient });
if (authClient && !googleDrive) googleDrive = google.drive({ version: 'v3', auth: authClient });
if (authClient && !googleSheets) googleSheets = google.sheets({ version: 'v4', auth: authClient });
if (authClient && !googleCalendar) googleCalendar = google.calendar({ version: 'v3', auth: authClient });
if (authClient && !googleGmail) googleGmail = google.gmail({ version: 'v1', auth: authClient });

if (!googleDocs || !googleDrive || !googleSheets || !googleCalendar || !googleGmail) {
throw new Error("Google Docs, Drive, Sheets, Calendar, and Gmail clients could not be initialized.");
}
return { authClient, googleDocs, googleDrive, googleSheets, googleCalendar, googleGmail };
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

const server = new FastMCP({
  name: 'Google Workspace MCP Server',
  version: '2.0.0'
});

async function getDocsClient() {
const { googleDocs: docs } = await initializeGoogleClient();
if (!docs) throw new UserError("Google Docs client is not initialized.");
return docs;
}

async function getDriveClient() {
const { googleDrive: drive } = await initializeGoogleClient();
if (!drive) throw new UserError("Google Drive client is not initialized.");
return drive;
}

async function getSheetsClient() {
const { googleSheets: sheets } = await initializeGoogleClient();
if (!sheets) throw new UserError("Google Sheets client is not initialized.");
return sheets;
}

async function getCalendarClient() {
const { googleCalendar: calendar } = await initializeGoogleClient();
if (!calendar) throw new UserError("Google Calendar client is not initialized.");
return calendar;
}

async function getGmailClient() {
const { googleGmail: gmail } = await initializeGoogleClient();
if (!gmail) throw new UserError("Google Gmail client is not initialized.");
return gmail;
}

// === HELPER FUNCTIONS ===

function convertDocsJsonToMarkdown(docData: any): string {
    let markdown = '';
    if (!docData.body?.content) return 'Document appears to be empty.';
    docData.body.content.forEach((element: any) => {
        if (element.paragraph) markdown += convertParagraphToMarkdown(element.paragraph);
        else if (element.table) markdown += convertTableToMarkdown(element.table, element.startIndex);
        else if (element.sectionBreak) markdown += '\n---\n\n';
    });
    return markdown.trim();
}

function convertParagraphToMarkdown(paragraph: any): string {
    let text = '';
    let isHeading = false;
    let headingLevel = 0;
    let isList = false;

    if (paragraph.paragraphStyle?.namedStyleType) {
        const styleType = paragraph.paragraphStyle.namedStyleType;
        if (styleType.startsWith('HEADING_')) { isHeading = true; headingLevel = parseInt(styleType.replace('HEADING_', '')); }
        else if (styleType === 'TITLE') { isHeading = true; headingLevel = 1; }
        else if (styleType === 'SUBTITLE') { isHeading = true; headingLevel = 2; }
    }
    if (paragraph.bullet) isList = true;

    const paraStyle = paragraph.paragraphStyle;
    let styleAnnotation = '';
    if (paraStyle) {
        const parts: string[] = [];
        if (paraStyle.namedStyleType && paraStyle.namedStyleType !== 'NORMAL_TEXT') parts.push(`style:${paraStyle.namedStyleType}`);
        if (paraStyle.alignment && paraStyle.alignment !== 'START') parts.push(`align:${paraStyle.alignment}`);
        if (paraStyle.spaceAbove?.magnitude) parts.push(`spaceAbove:${paraStyle.spaceAbove.magnitude}pt`);
        if (paraStyle.spaceBelow?.magnitude) parts.push(`spaceBelow:${paraStyle.spaceBelow.magnitude}pt`);
        if (paraStyle.indentStart?.magnitude) parts.push(`indent:${paraStyle.indentStart.magnitude}pt`);
        if (paraStyle.lineSpacing) parts.push(`lineSpacing:${paraStyle.lineSpacing}%`);
        if (parts.length > 0) styleAnnotation = ` <!-- ${parts.join(' | ')} -->`;
    }

    if (paragraph.elements) {
        paragraph.elements.forEach((element: any) => {
            if (element.textRun) text += convertTextRunToMarkdown(element.textRun);
        });
    }
    if (isHeading && text.trim()) return `${'#'.repeat(Math.min(headingLevel, 6))} ${text.trim()}${styleAnnotation}\n\n`;
    if (isList && text.trim()) return `- ${text.trim()}${styleAnnotation}\n`;
    if (text.trim()) return `${text.trim()}${styleAnnotation}\n\n`;
    return '\n';
}

function rgbToHex(rgb: any): string | null {
    if (!rgb) return null;
    const r = Math.round((rgb.red || 0) * 255);
    const g = Math.round((rgb.green || 0) * 255);
    const b = Math.round((rgb.blue || 0) * 255);
    if (r === 0 && g === 0 && b === 0) return null;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function convertTextRunToMarkdown(textRun: any): string {
    let text = textRun.content || '';
    if (!text.trim()) return text;
    const trailing = text.endsWith('\n') ? '\n' : '';
    text = text.trim();
    const style = textRun.textStyle;
    if (style) {
        if (style.bold && style.italic) text = `***${text}***`;
        else if (style.bold) text = `**${text}**`;
        else if (style.italic) text = `*${text}*`;
        if (style.underline && !style.link) text = `<u>${text}</u>`;
        if (style.strikethrough) text = `~~${text}~~`;
        if (style.link?.url) text = `[${text}](${style.link.url})`;

        const extras: string[] = [];
        if (style.fontSize?.magnitude) extras.push(`${style.fontSize.magnitude}pt`);
        if (style.weightedFontFamily?.fontFamily) extras.push(`font:${style.weightedFontFamily.fontFamily}`);
        const fg = rgbToHex(style.foregroundColor?.color?.rgbColor);
        if (fg) extras.push(`color:${fg}`);
        const bg = rgbToHex(style.backgroundColor?.color?.rgbColor);
        if (bg) extras.push(`bg:${bg}`);
        if (extras.length > 0) text = `${text}<!-- ${extras.join(' ')} -->`;
    }
    return text + trailing;
}

function convertTableToMarkdown(table: any, elementStartIndex?: number): string {
    if (!table.tableRows || table.tableRows.length === 0) return '';
    const rows = table.tableRows.length;
    const cols = table.tableRows[0]?.tableCells?.length || 0;
    let tableStartIdx = elementStartIndex !== undefined
        ? ` <!-- tableStartIndex:${elementStartIndex} rows:${rows} cols:${cols} -->`
        : '';
    let markdown = `\n${tableStartIdx}\n`;
    let isFirstRow = true;
    table.tableRows.forEach((row: any, rowIdx: number) => {
        if (!row.tableCells) return;
        let rowText = '|';
        row.tableCells.forEach((cell: any) => {
            let cellText = '';
            if (cell.content) {
                cell.content.forEach((element: any) => {
                    if (element.paragraph?.elements) {
                        element.paragraph.elements.forEach((pe: any) => {
                            if (pe.textRun) cellText += convertTextRunToMarkdown(pe.textRun).replace(/\n/g, ' ').trim();
                        });
                    }
                });
            }
            rowText += ` ${cellText} |`;
        });
        markdown += rowText + '\n';
        if (isFirstRow) {
            let separator = '|';
            for (let i = 0; i < row.tableCells.length; i++) separator += ' --- |';
            markdown += separator + '\n';
            isFirstRow = false;
        }
    });
    return markdown + '\n';
}

function unescapeText(text: string): string {
    return text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
}

const HeadingStyleTypeValues = ['HEADING_1', 'HEADING_2', 'HEADING_3', 'HEADING_4', 'HEADING_5', 'HEADING_6'] as const;
const SemanticPositionTypeValues = ['endOfBody', 'endOfTab', 'afterHeading', 'startOfNamedRange', 'endOfNamedRange'] as const;
const HeadingStyleTypeEnum = z.enum(HeadingStyleTypeValues);
const SemanticPositionTypeEnum = z.enum(SemanticPositionTypeValues);
const NamedRangeListFields = 'documentId,namedRanges,tabs';
const SemanticResolutionFields = 'body,namedRanges,tabs';
const TableLookupBodyFields =
    'body(content(startIndex,endIndex,table(tableRows(tableCells(content(startIndex,endIndex,paragraph(elements(startIndex,endIndex,textRun(content)))))))))';
const TableLookupFields = `${TableLookupBodyFields},tabs`;
const PostInsertTableBodyFields =
    'body(content(startIndex,endIndex,table(tableRows(tableCells(content(startIndex,endIndex,paragraph(elements(startIndex,endIndex))))))))';
const PostInsertTableFields = `${PostInsertTableBodyFields},tabs`;

function getWriteControlFromArgs(args: { requiredRevisionId?: string; targetRevisionId?: string }) {
    return GDocsHelpers.buildWriteControl({
        requiredRevisionId: args.requiredRevisionId,
        targetRevisionId: args.targetRevisionId,
    });
}

function getDocumentBodyContent(documentData: any, tabId?: string): any[] {
    if (tabId) {
        const targetTab = GDocsHelpers.findTabById(documentData, tabId);
        if (!targetTab) throw new UserError(`Tab with ID "${tabId}" not found.`);
        return targetTab.documentTab?.body?.content || [];
    }

    if (documentData.body?.content) {
        return documentData.body.content;
    }

    const firstTab = GDocsHelpers.getAllTabs(documentData)[0];
    return firstTab?.documentTab?.body?.content || [];
}

function getDocumentNamedRanges(documentData: any, tabId?: string): Record<string, any> {
    if (tabId) {
        const targetTab = GDocsHelpers.findTabById(documentData, tabId);
        if (!targetTab) throw new UserError(`Tab with ID "${tabId}" not found.`);
        return targetTab.documentTab?.namedRanges || {};
    }

    if (documentData.namedRanges) {
        return documentData.namedRanges;
    }

    const firstTab = GDocsHelpers.getAllTabs(documentData)[0];
    return firstTab?.documentTab?.namedRanges || {};
}

function getEffectiveTabId(documentData: any, requestedTabId?: string): string | undefined {
    if (requestedTabId) {
        const targetTab = GDocsHelpers.findTabById(documentData, requestedTabId);
        if (!targetTab) {
            throw new UserError(`Tab with ID "${requestedTabId}" not found.`);
        }
        return requestedTabId;
    }

    const firstTab = GDocsHelpers.getAllTabs(documentData)[0];
    return firstTab?.tabProperties?.tabId ?? undefined;
}

function getEffectiveBodyTarget(documentData: any, requestedTabId?: string): { bodyContent: any[]; tabId?: string } {
    const effectiveTabId = getEffectiveTabId(documentData, requestedTabId);
    return {
        bodyContent: getDocumentBodyContent(documentData, effectiveTabId),
        tabId: effectiveTabId,
    };
}

function resolveNamedRangeForMutation(
    documentData: docs_v1.Schema$Document,
    args: { namedRangeName?: string; namedRangeId?: string; tabId?: string }
) {
    return GDocsHelpers.resolveUniqueNamedRangeFromDocument(documentData, {
        namedRangeName: args.namedRangeName,
        namedRangeId: args.namedRangeId,
        expectedTabId: args.tabId,
    });
}

type ResolvedInsertPosition = {
    index?: number;
    endOfSegmentLocation?: docs_v1.Schema$EndOfSegmentLocation;
    tabId?: string;
};

function resolveInsertPositionFromDocumentData(
    documentData: docs_v1.Schema$Document,
    args: {
        action: string;
        index?: number;
        positionType?: typeof SemanticPositionTypeValues[number];
        tabId?: string;
        headingText?: string;
        headingNamedStyleType?: typeof HeadingStyleTypeValues[number];
        namedRangeName?: string;
        namedRangeId?: string;
    }
): ResolvedInsertPosition {
    if (args.index !== undefined && args.positionType) {
        throw new UserError('Provide either index or positionType, not both.');
    }

    const effectiveTabId = getEffectiveTabId(documentData, args.tabId);

    if (!args.positionType) {
        if (args.index === undefined) throw new UserError(`index is required for action "${args.action}".`);
        return { index: args.index, tabId: effectiveTabId };
    }

    if (args.positionType === 'startOfNamedRange' || args.positionType === 'endOfNamedRange') {
        const namedRange = GDocsHelpers.resolveUniqueNamedRangeFromDocument(documentData, {
            namedRangeName: args.namedRangeName,
            namedRangeId: args.namedRangeId,
            expectedTabId: args.tabId,
        });
        if (!Array.isArray(namedRange.ranges) || namedRange.ranges.length === 0) {
            throw new UserError(`Named range "${namedRange.name}" has no ranges to target.`);
        }
        if (namedRange.ranges.length > 1) {
            throw new UserError(
                `Named range "${namedRange.name}" is split into multiple ranges. Use a more specific anchor before applying a semantic insert position.`
            );
        }
        const range = namedRange.ranges[0];
        const index = args.positionType === 'startOfNamedRange' ? range.startIndex : range.endIndex;
        if (typeof index !== 'number') {
            throw new UserError(
                `Named range "${namedRange.name}" does not have a usable ${args.positionType === 'startOfNamedRange' ? 'start' : 'end'} index.`
            );
        }
        return {
            index,
            tabId: namedRange.tabId ?? args.tabId,
        };
    }

    const semanticPositionType =
        !args.tabId && effectiveTabId && args.positionType === 'endOfBody'
            ? 'endOfTab'
            : args.positionType;
    const semanticTabId = semanticPositionType === 'endOfBody' ? undefined : effectiveTabId;
    const { bodyContent } = getEffectiveBodyTarget(documentData, semanticTabId);
    const resolvedPosition = GDocsHelpers.resolveSemanticInsertPosition({
        bodyContent,
        positionType: semanticPositionType,
        tabId: semanticTabId,
        headingText: args.headingText,
        headingNamedStyleType: args.headingNamedStyleType,
    });

    return {
        ...resolvedPosition,
        endOfSegmentLocation: resolvedPosition.endOfSegmentLocation
            ? {
                ...resolvedPosition.endOfSegmentLocation,
                ...(semanticTabId && !resolvedPosition.endOfSegmentLocation.tabId ? { tabId: semanticTabId } : {}),
            }
            : undefined,
        tabId: semanticTabId,
    };
}

async function resolveInsertPositionFromArgs(
    docs: docs_v1.Docs,
    documentId: string,
    args: {
        action: string;
        index?: number;
        positionType?: typeof SemanticPositionTypeValues[number];
        tabId?: string;
        headingText?: string;
        headingNamedStyleType?: typeof HeadingStyleTypeValues[number];
        namedRangeName?: string;
        namedRangeId?: string;
    }
) {
    const documentResponse = await docs.documents.get({
        documentId,
        includeTabsContent: true,
        fields: SemanticResolutionFields,
    });
    return resolveInsertPositionFromDocumentData(documentResponse.data, args);
}

function handleDocError(error: any, documentId: string, operation: string): never {
    if (error instanceof UserError) throw error;
    if (error instanceof NotImplementedError) throw error;
    if (error.code === 404) throw new UserError(`Document not found (ID: ${documentId}).`);
    if (error.code === 403) throw new UserError(`Permission denied for document (ID: ${documentId}).`);
    const errorDetails = error.response?.data?.error?.message || error.message || 'Unknown error';
    const errorCode = error.response?.data?.error?.code || error.code;
    throw new UserError(`Failed to ${operation}: ${errorDetails}${errorCode ? ` (Code: ${errorCode})` : ''}`);
}

function handleDriveError(error: any, operation: string): never {
    if (error instanceof UserError) throw error;
    if (error.code === 404) throw new UserError(`Resource not found. Check the ID.`);
    if (error.code === 403) throw new UserError(`Permission denied: ${error.errors?.[0]?.message || error.message || 'Unknown reason'}`);
    throw new UserError(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
}

// ============================================================
// CONSOLIDATED TOOL DEFINITIONS (7 tools, ~50 actions)
// ============================================================

// ── Tool 1: googleDoc ──────────────────────────────────────
server.addTool({
name: 'googleDoc',
description: `Read, discover, and manage Google Document structure and tabs.

Actions:
- read: Read document content (text/json/markdown/markdownExport). Requires: documentId. Optional: format, maxLength, tabId. markdownExport uses Google Drive's native text/markdown export and reads the whole doc only.
- info: Get document metadata plus the latest Docs revisionId. Requires: documentId.
- list: List Google Docs from Drive. Optional: query, maxResults, orderBy.
- search: Search docs by name/content. Requires: query. Optional: searchIn, maxResults, modifiedAfter, modifiedBefore.
- recent: Get recently modified docs. Optional: maxResults, daysBack.
- listTabs: List all tabs and hierarchy. Requires: documentId. Optional: includeContent.
- listNamedRanges: List named ranges in the target tab or default body. Requires: documentId. Optional: tabId.
- createNamedRange: Create a named range with a document-global unique name. Requires: documentId, name, and either startIndex+endIndex or textToFind. Optional: matchInstance, tabId, requiredRevisionId, targetRevisionId.
- deleteNamedRange: Delete a named range by a document-global unique name or exact ID. Requires: documentId and namedRangeName or namedRangeId. Optional: tabId, requiredRevisionId, targetRevisionId.
- findElement: Find elements by criteria (not implemented). Requires: documentId. Optional: elementType, textQuery.
- addTab: Create a new tab. Requires: documentId. Optional: title, index, parentTabId, requiredRevisionId, targetRevisionId.
- deleteTab: Delete a tab. Requires: documentId, tabId. Optional: requiredRevisionId, targetRevisionId.
- updateTab: Rename/reorder/nest a tab. Requires: documentId, tabId. Optional: title, index, parentTabId, requiredRevisionId, targetRevisionId.`,
parameters: z.object({
  action: z.enum(['read', 'info', 'list', 'search', 'recent', 'listTabs', 'listNamedRanges', 'createNamedRange', 'deleteNamedRange', 'findElement', 'addTab', 'deleteTab', 'updateTab'])
    .describe('The operation to perform.'),
  documentId: z.string().optional().describe('The ID of the Google Document (from the URL).'),
  tabId: z.string().optional().describe('Tab ID. Used by read (target tab), deleteTab (tab to delete), updateTab (tab to update).'),
  format: z.enum(['text', 'json', 'markdown', 'markdownExport']).optional().default('text').describe('[read] Output format. markdownExport uses Google Drive\'s native text/markdown export for the whole document.'),
  maxLength: z.number().optional().describe('[read] Maximum character limit for output.'),
  includeContent: z.boolean().optional().default(false).describe('[listTabs] Whether to include a content summary for each tab.'),
  query: z.string().optional().describe('[list/search] Search query to filter documents.'),
  searchIn: z.enum(['name', 'content', 'both']).optional().default('both').describe('[search] Where to search.'),
  maxResults: z.number().int().min(1).max(100).optional().default(20).describe('[list/search/recent] Maximum results to return.'),
  orderBy: z.enum(['name', 'modifiedTime', 'createdTime']).optional().default('modifiedTime').describe('[list] Sort order.'),
  modifiedAfter: z.string().optional().describe('[search] Only docs modified after this date (ISO 8601).'),
  modifiedBefore: z.string().optional().describe('[search] Only docs modified before this date (ISO 8601).'),
  daysBack: z.number().int().min(1).max(365).optional().default(30).describe('[recent] Only docs modified within this many days.'),
  elementType: z.enum(['paragraph', 'table', 'list', 'image']).optional().describe('[findElement] Element type to find.'),
  textQuery: z.string().optional().describe('[findElement] Text to search for.'),
  textToFind: z.string().optional().describe('[createNamedRange] Exact text to anchor a named range to.'),
  matchInstance: z.number().int().min(1).optional().default(1).describe('[createNamedRange] Which instance of textToFind to use.'),
  name: z.string().optional().describe('[createNamedRange] Named range name. This MCP enforces uniqueness across the entire document, not just one tab.'),
  namedRangeName: z.string().optional().describe('[deleteNamedRange] Named range name. Must resolve to exactly one named range across the entire document. If duplicates exist in any tab, use namedRangeId instead.'),
  namedRangeId: z.string().optional().describe('[deleteNamedRange] Exact named range ID.'),
  title: z.string().optional().describe('[addTab/updateTab] Tab title.'),
  index: z.number().int().min(0).optional().describe('[addTab/updateTab] Tab index (0-based).'),
  parentTabId: z.string().optional().describe('[addTab/updateTab] Parent tab ID for nesting. Use "" to unnest.'),
  startIndex: z.number().int().min(1).optional().describe('[createNamedRange] Start index (inclusive) when creating a named range from a range.'),
  endIndex: z.number().int().min(1).optional().describe('[createNamedRange] End index (exclusive) when creating a named range from a range.'),
  requiredRevisionId: z.string().optional().describe('[createNamedRange/deleteNamedRange/addTab/deleteTab/updateTab] Require the document to still be at this revision.'),
  targetRevisionId: z.string().optional().describe('[createNamedRange/deleteNamedRange/addTab/deleteTab/updateTab] Rebase the write onto this revision if possible.'),
}),
execute: async (args, { log }) => {
  const requireDocId = () => {
    if (!args.documentId) throw new UserError(`documentId is required for action "${args.action}".`);
    return args.documentId;
  };

  switch (args.action) {

    // ── read ──
    case 'read': {
      const documentId = requireDocId();
      const docs = await getDocsClient();
      log.info(`Reading Google Doc: ${documentId}, Format: ${args.format}${args.tabId ? `, Tab: ${args.tabId}` : ''}`);
      try {
        if (args.format === 'markdownExport') {
            if (args.tabId) {
                throw new UserError('format "markdownExport" reads the whole document via Drive export and does not support tabId.');
            }

            const drive = await getDriveClient();
            const exportResponse = await drive.files.export(
                {
                    fileId: documentId,
                    mimeType: 'text/markdown',
                },
                {
                    responseType: 'arraybuffer',
                } as any
            );
            const rawMarkdown = exportResponse.data as any;
            const markdown =
                typeof rawMarkdown === 'string'
                    ? rawMarkdown
                    : Buffer.from(rawMarkdown).toString('utf8');
            if (args.maxLength && markdown.length > args.maxLength) {
                return markdown.substring(0, args.maxLength) + `\n\n... [Markdown export truncated to ${args.maxLength} of ${markdown.length} total chars.]`;
            }
            return markdown;
        }

        const needsTabsContent = !!args.tabId;
        const fields = args.format === 'json' || args.format === 'markdown'
            ? '*'
            : 'body(content(startIndex,endIndex,paragraph(elements(textRun(content))),table(tableRows(tableCells(content(paragraph(elements(textRun(content)))))))))';
        const res = await docs.documents.get({
            documentId,
            includeTabsContent: needsTabsContent,
            fields: needsTabsContent ? '*' : fields,
        });

        let contentSource: any;
        if (args.tabId) {
            const targetTab = GDocsHelpers.findTabById(res.data, args.tabId);
            if (!targetTab) throw new UserError(`Tab with ID "${args.tabId}" not found in document.`);
            if (!targetTab.documentTab) throw new UserError(`Tab "${args.tabId}" does not have content.`);
            contentSource = { body: targetTab.documentTab.body };
        } else {
            contentSource = res.data;
        }

        if (args.format === 'json') {
            const jsonContent = JSON.stringify(contentSource, null, 2);
            if (args.maxLength && jsonContent.length > args.maxLength)
                return jsonContent.substring(0, args.maxLength) + `\n... [JSON truncated: ${jsonContent.length} total chars]`;
            return jsonContent;
        }
        if (args.format === 'markdown') {
            const md = convertDocsJsonToMarkdown(contentSource);
            if (args.maxLength && md.length > args.maxLength)
                return md.substring(0, args.maxLength) + `\n\n... [Markdown truncated to ${args.maxLength} of ${md.length} total chars.]`;
            return md;
        }

        let textContent = '';
        contentSource.body?.content?.forEach((element: any) => {
            if (element.paragraph?.elements) {
                element.paragraph.elements.forEach((pe: any) => { if (pe.textRun?.content) textContent += pe.textRun.content; });
            }
            if (element.table?.tableRows) {
                const rows = element.table.tableRows;
                rows.forEach((row: any, ri: number) => {
                    if (!row.tableCells) return;
                    row.tableCells.forEach((cell: any, ci: number) => {
                        let cellText = '';
                        cell.content?.forEach((ce: any) => {
                            ce.paragraph?.elements?.forEach((pe: any) => { if (pe.textRun?.content) cellText += pe.textRun.content.trim(); });
                        });
                        textContent += `[${ri},${ci}] ${cellText}\t`;
                    });
                    textContent += '\n';
                });
                textContent += '\n';
            }
        });

        if (!textContent.trim()) return "Document found, but appears empty.";
        if (args.maxLength && textContent.length > args.maxLength)
            return `Content (truncated to ${args.maxLength} of ${textContent.length} total chars):\n---\n${textContent.substring(0, args.maxLength)}\n\n... [Document continues]`;
        return `Content (${textContent.length} characters):\n---\n${textContent}`;
      } catch (error: any) {
        log.error(`Error reading doc ${documentId}: ${error.message || error}`);
        handleDocError(error, documentId, 'read document');
      }
    }

    // ── info ──
    case 'info': {
      const documentId = requireDocId();
      const drive = await getDriveClient();
      const docs = await getDocsClient();
      try {
        const [driveResponse, docsResponse] = await Promise.all([
            drive.files.get({
                fileId: documentId,
                fields: 'id,name,description,mimeType,size,createdTime,modifiedTime,webViewLink,owners(displayName,emailAddress),lastModifyingUser(displayName,emailAddress),shared,parents,version',
            }),
            docs.documents.get({
                documentId,
                fields: 'revisionId',
            }),
        ]);
        const file = driveResponse.data;
        if (!file) throw new UserError(`Document with ID ${documentId} not found.`);
        const owner = file.owners?.[0];
        const lastModifier = file.lastModifyingUser;
        let result = `**Document Information:**\n\n**Name:** ${file.name}\n**ID:** ${file.id}\n**Type:** Google Document\n`;
        result += `**Created:** ${file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Unknown'}\n`;
        result += `**Last Modified:** ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : 'Unknown'}\n`;
        if (docsResponse.data.revisionId) result += `**Docs Revision ID:** ${docsResponse.data.revisionId}\n`;
        if (owner) result += `**Owner:** ${owner.displayName} (${owner.emailAddress})\n`;
        if (lastModifier) result += `**Last Modified By:** ${lastModifier.displayName} (${lastModifier.emailAddress})\n`;
        result += `**Shared:** ${file.shared ? 'Yes' : 'No'}\n**View Link:** ${file.webViewLink}\n`;
        if (file.description) result += `**Description:** ${file.description}\n`;
        return result;
      } catch (error: any) {
        handleDocError(error, documentId, 'get document info');
      }
    }

    // ── list ──
    case 'list': {
      const drive = await getDriveClient();
      try {
        let q = "mimeType='application/vnd.google-apps.document' and trashed=false";
        const hasFullText = !!args.query;
        if (args.query) q += ` and (name contains '${args.query}' or fullText contains '${args.query}')`;
        const listParams: any = { q, pageSize: args.maxResults, fields: 'files(id,name,modifiedTime,createdTime,webViewLink,owners(displayName,emailAddress))' };
        if (!hasFullText) listParams.orderBy = args.orderBy === 'name' ? 'name' : args.orderBy;
        const response = await drive.files.list(listParams);
        const files = response.data.files || [];
        if (files.length === 0) return "No Google Docs found matching your criteria.";
        let result = `Found ${files.length} Google Document(s):\n\n`;
        files.forEach((file, i) => {
            result += `${i + 1}. **${file.name}**\n   ID: ${file.id}\n   Modified: ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown'}\n   Owner: ${file.owners?.[0]?.displayName || 'Unknown'}\n   Link: ${file.webViewLink}\n\n`;
        });
        return result;
      } catch (error: any) {
        handleDriveError(error, 'list documents');
      }
    }

    // ── search ──
    case 'search': {
      if (!args.query) throw new UserError('query is required for action "search".');
      const drive = await getDriveClient();
      try {
        let q = "mimeType='application/vnd.google-apps.document' and trashed=false";
        const nameOnly = args.searchIn === 'name';
        if (nameOnly) q += ` and name contains '${args.query}'`;
        else if (args.searchIn === 'content') q += ` and fullText contains '${args.query}'`;
        else q += ` and (name contains '${args.query}' or fullText contains '${args.query}')`;
        if (args.modifiedAfter) q += ` and modifiedTime > '${args.modifiedAfter}'`;
        if (args.modifiedBefore) q += ` and modifiedTime < '${args.modifiedBefore}'`;
        const searchParams: any = { q, pageSize: args.maxResults, fields: 'files(id,name,modifiedTime,webViewLink,owners(displayName))' };
        if (nameOnly) searchParams.orderBy = 'modifiedTime desc';
        const response = await drive.files.list(searchParams);
        const files = response.data.files || [];
        if (files.length === 0) return `No Google Docs found containing "${args.query}".`;
        let result = `Found ${files.length} document(s) matching "${args.query}":\n\n`;
        files.forEach((file, i) => {
            result += `${i + 1}. **${file.name}**\n   ID: ${file.id}\n   Modified: ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown'}\n   Owner: ${file.owners?.[0]?.displayName || 'Unknown'}\n   Link: ${file.webViewLink}\n\n`;
        });
        return result;
      } catch (error: any) {
        handleDriveError(error, 'search documents');
      }
    }

    // ── recent ──
    case 'recent': {
      const drive = await getDriveClient();
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (args.daysBack ?? 30));
        const q = `mimeType='application/vnd.google-apps.document' and trashed=false and modifiedTime > '${cutoff.toISOString()}'`;
        const response = await drive.files.list({
            q, pageSize: args.maxResults, orderBy: 'modifiedTime desc',
            fields: 'files(id,name,modifiedTime,webViewLink,owners(displayName),lastModifyingUser(displayName))',
        });
        const files = response.data.files || [];
        if (files.length === 0) return `No Google Docs modified in the last ${args.daysBack ?? 30} days.`;
        let result = `${files.length} recently modified document(s) (last ${args.daysBack ?? 30} days):\n\n`;
        files.forEach((file, i) => {
            result += `${i + 1}. **${file.name}**\n   ID: ${file.id}\n   Last Modified: ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : 'Unknown'} by ${file.lastModifyingUser?.displayName || 'Unknown'}\n   Link: ${file.webViewLink}\n\n`;
        });
        return result;
      } catch (error: any) {
        handleDriveError(error, 'get recent documents');
      }
    }

    // ── listTabs ──
    case 'listTabs': {
      const documentId = requireDocId();
      const docs = await getDocsClient();
      try {
        const res = await docs.documents.get({
            documentId, includeTabsContent: true,
            fields: args.includeContent ? 'title,tabs' : 'title,tabs(tabProperties,childTabs)'
        });
        const docTitle = res.data.title || 'Untitled Document';
        const allTabs = GDocsHelpers.getAllTabs(res.data);
        if (allTabs.length === 0) return `Document "${docTitle}" appears to have no tabs.`;
        const isSingleTab = allTabs.length === 1;
        let result = `**Document:** "${docTitle}"\n**Total tabs:** ${allTabs.length}${isSingleTab ? ' (single-tab document)\n\n' : '\n\n'}`;
        if (!isSingleTab) result += `**Tab Structure:**\n${'─'.repeat(50)}\n\n`;
        allTabs.forEach((tab: GDocsHelpers.TabWithLevel, i: number) => {
            const props = tab.tabProperties || {};
            const indent = '  '.repeat(tab.level);
            if (isSingleTab) {
                result += `**Default Tab:**\n- Tab ID: ${props.tabId || 'Unknown'}\n- Title: ${props.title || '(Untitled)'}\n`;
            } else {
                const prefix = tab.level > 0 ? '└─ ' : '';
                result += `${indent}${prefix}**Tab ${i + 1}:** "${props.title || 'Untitled Tab'}"\n${indent}   - ID: ${props.tabId || 'Unknown'}\n${indent}   - Index: ${props.index !== undefined ? props.index : 'N/A'}\n`;
                if (props.parentTabId) result += `${indent}   - Parent Tab ID: ${props.parentTabId}\n`;
            }
            if (args.includeContent && tab.documentTab) {
                const textLen = GDocsHelpers.getTabTextLength(tab.documentTab);
                result += `${indent}   - Content: ${textLen > 0 ? `${textLen.toLocaleString()} characters` : 'Empty'}\n`;
            }
            if (!isSingleTab) result += '\n';
        });
        if (!isSingleTab) result += `\nUse tab IDs with other tools to target specific tabs.`;
        return result;
      } catch (error: any) {
        handleDocError(error, documentId, 'list tabs');
      }
    }

    // ── listNamedRanges ──
    case 'listNamedRanges': {
      const documentId = requireDocId();
      const docs = await getDocsClient();
      try {
        const response = await docs.documents.get({
            documentId,
            includeTabsContent: true,
            fields: NamedRangeListFields,
        });
        const namedRanges = getDocumentNamedRanges(response.data, args.tabId);
        const flattenedNamedRanges = GDocsHelpers.flattenNamedRanges(namedRanges);
        if (flattenedNamedRanges.length === 0) {
            return `No named ranges found${args.tabId ? ` in tab ${args.tabId}` : ' in the default body/tab'}.`;
        }

        let result = `Found ${flattenedNamedRanges.length} named range(s)${args.tabId ? ` in tab ${args.tabId}` : ' in the default body/tab'}:\n\n`;
        flattenedNamedRanges.forEach((namedRange, index) => {
            const rangesSummary = namedRange.ranges
                .map(range => `${range.startIndex ?? '?'}-${range.endIndex ?? '?'}`)
                .join(', ');
            result += `${index + 1}. **${namedRange.name}**\n   ID: ${namedRange.namedRangeId}\n   Ranges: ${rangesSummary || 'None'}\n\n`;
        });
        return result;
      } catch (error: any) {
        handleDocError(error, documentId, 'list named ranges');
      }
    }

    // ── createNamedRange ──
    case 'createNamedRange': {
      const documentId = requireDocId();
      const docs = await getDocsClient();
      if (!args.name) throw new UserError('name is required for action "createNamedRange".');
      const writeControl = getWriteControlFromArgs(args);
      try {
        const existingDocument = await docs.documents.get({
            documentId,
            includeTabsContent: true,
        });
        const effectiveTabId = getEffectiveTabId(existingDocument.data, args.tabId);
        const duplicateNames = GDocsHelpers.flattenDocumentNamedRanges(existingDocument.data).filter(
            namedRange => namedRange.name === args.name
        );
        if (duplicateNames.length > 0) {
            throw new UserError(
                `Named range "${args.name}" already exists somewhere in the document. Delete or rename the existing range before creating another.`
            );
        }

        let range: any;
        if (args.textToFind) {
            const textRange = await GDocsHelpers.findTextRange(
                docs,
                documentId,
                args.textToFind,
                args.matchInstance,
                effectiveTabId,
            );
            if (!textRange) {
                throw new UserError(`Could not find instance ${args.matchInstance} of text "${args.textToFind}" to create a named range.`);
            }
            range = { startIndex: textRange.startIndex, endIndex: textRange.endIndex };
        } else if (args.startIndex !== undefined && args.endIndex !== undefined) {
            if (args.endIndex <= args.startIndex) throw new UserError('endIndex must be greater than startIndex.');
            range = { startIndex: args.startIndex, endIndex: args.endIndex };
        } else {
            throw new UserError('Provide either textToFind or startIndex+endIndex for action "createNamedRange".');
        }

        if (effectiveTabId) range.tabId = effectiveTabId;

        await GDocsHelpers.executeBatchUpdate(
            docs,
            documentId,
            [{ createNamedRange: { name: args.name, range } }],
            writeControl,
        );
        return `Named range "${args.name}" created successfully${args.tabId ? ` in tab ${args.tabId}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, documentId, 'create named range');
      }
    }

    // ── deleteNamedRange ──
    case 'deleteNamedRange': {
      const documentId = requireDocId();
      const docs = await getDocsClient();
      const writeControl = getWriteControlFromArgs(args);
      try {
        const existingDocument = await docs.documents.get({
            documentId,
            includeTabsContent: true,
        });
        const namedRange = resolveNamedRangeForMutation(
            existingDocument.data,
            {
                namedRangeName: args.namedRangeName,
                namedRangeId: args.namedRangeId,
                tabId: args.tabId,
            }
        );

        await GDocsHelpers.executeBatchUpdate(
            docs,
            documentId,
            [GDocsHelpers.buildDeleteNamedRangeRequest({
                namedRangeId: namedRange.namedRangeId,
                tabId: namedRange.tabId ?? args.tabId,
            })],
            writeControl,
        );
        const targetTabLabel = namedRange.tabId ?? args.tabId;
        return `Named range "${namedRange.name}" (${namedRange.namedRangeId}) deleted successfully${targetTabLabel ? ` from tab ${targetTabLabel}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, documentId, 'delete named range');
      }
    }

    // ── findElement ──
    case 'findElement': {
      requireDocId();
      throw new NotImplementedError("Finding elements by complex criteria is not yet implemented.");
    }

    // ── addTab ──
    case 'addTab': {
      const documentId = requireDocId();
      const docs = await getDocsClient();
      const writeControl = getWriteControlFromArgs(args);
      try {
        const tabProperties: any = {};
        if (args.title !== undefined) tabProperties.title = args.title;
        if (args.index !== undefined) tabProperties.index = args.index;
        if (args.parentTabId !== undefined) tabProperties.parentTabId = args.parentTabId;
        const request: any = { addDocumentTab: { tabProperties: Object.keys(tabProperties).length > 0 ? tabProperties : undefined } };
        const res = await GDocsHelpers.executeBatchUpdate(docs, documentId, [request], writeControl);
        const addDocumentTabReply = (res.replies?.[0] as any)?.addDocumentTab;
        const newTabId = addDocumentTabReply?.tabProperties?.tabId ?? addDocumentTabReply?.tabId;
        let result = `Tab created successfully in document ${documentId}.`;
        if (newTabId) result += `\nNew tab ID: ${newTabId}`;
        if (args.title) result += `\nTitle: ${args.title}`;
        if (args.parentTabId) result += `\nNested under parent tab: ${args.parentTabId}`;
        return result;
      } catch (error: any) {
        handleDocError(error, documentId, 'create tab');
      }
    }

    // ── deleteTab ──
    case 'deleteTab': {
      const documentId = requireDocId();
      if (!args.tabId) throw new UserError('tabId is required for action "deleteTab".');
      const docs = await getDocsClient();
      const writeControl = getWriteControlFromArgs(args);
      try {
        const request: any = { deleteTab: { tabId: args.tabId } };
        await GDocsHelpers.executeBatchUpdate(docs, documentId, [request], writeControl);
        return `Tab ${args.tabId} deleted successfully from document ${documentId}.`;
      } catch (error: any) {
        if (error.code === 400) {
          const msg = error.response?.data?.error?.message || error.message || '';
          if (msg.includes('last tab')) throw new UserError('Cannot delete the last remaining tab in a document.');
          throw new UserError(`Invalid request: ${msg}`);
        }
        handleDocError(error, documentId, 'delete tab');
      }
    }

    // ── updateTab ──
    case 'updateTab': {
      const documentId = requireDocId();
      if (!args.tabId) throw new UserError('tabId is required for action "updateTab".');
      const docs = await getDocsClient();
      const writeControl = getWriteControlFromArgs(args);
      try {
        const tabProperties: any = {};
        const fieldsToUpdate: string[] = [];
        if (args.title !== undefined) { tabProperties.title = args.title; fieldsToUpdate.push('title'); }
        if (args.index !== undefined) { tabProperties.index = args.index; fieldsToUpdate.push('index'); }
        if (args.parentTabId !== undefined) { tabProperties.parentTabId = args.parentTabId; fieldsToUpdate.push('parentTabId'); }
        if (fieldsToUpdate.length === 0) throw new UserError('At least one property must be specified to update (title, index, or parentTabId).');
        tabProperties.tabId = args.tabId;
        const request: any = { updateDocumentTabProperties: { tabProperties, fields: fieldsToUpdate.join(',') } };
        await GDocsHelpers.executeBatchUpdate(docs, documentId, [request], writeControl);
        const changes: string[] = [];
        if (args.title !== undefined) changes.push(`title → "${args.title}"`);
        if (args.index !== undefined) changes.push(`index → ${args.index}`);
        if (args.parentTabId !== undefined) changes.push(args.parentTabId === '' ? 'moved to top-level' : `nested under tab ${args.parentTabId}`);
        return `Tab ${args.tabId} updated successfully: ${changes.join(', ')}.`;
      } catch (error: any) {
        handleDocError(error, documentId, 'update tab');
      }
    }

    default:
      throw new UserError(`Unknown action: ${args.action}`);
  }
}
});


// ── Tool 2: googleDocEdit ──────────────────────────────────
server.addTool({
name: 'googleDocEdit',
description: `Mutate Google Document content: insert/delete text, images, tables, and page breaks.

Important:
- All index-based actions in this tool must be invoked sequentially. Do not call them in parallel.
- Re-read the document after each write before issuing another index-based write, because indices can shift after edits.

Actions:
- append: Append text to end. Requires: documentId, text. Optional: addNewlineIfNeeded, tabId.
- insertText: Insert text at an index or semantic position. Requires: documentId, text, and either index or positionType. Optional: tabId, requiredRevisionId, targetRevisionId.
- deleteRange: Delete by index range. Requires: documentId, startIndex, endIndex. Optional: tabId.
- insertPageBreak: Insert page break at an index or semantic position. Requires: documentId and either index or positionType. Optional: tabId, requiredRevisionId, targetRevisionId.
- insertImage: Insert image from URL or local path at an index or semantic position. Requires: documentId, imageUrl OR localImagePath, and either index or positionType. Optional: width, height, uploadToSameFolder, tabId, requiredRevisionId, targetRevisionId.
- insertTable: Insert table at an index or semantic position. Requires: documentId, rows, columns, and either index or positionType. Optional: tabId, requiredRevisionId, targetRevisionId.
- editTableCell: Edit one table cell content/style. Requires: documentId, tableStartIndex, rowIndex, columnIndex. Do not invoke in parallel with any other index-based action.
- batchEditTableCells: Edit a rectangular table cell block while passing tableStartIndex once. Requires: documentId, tableStartIndex, rowIndex, columnIndex, cellMatrix. Use "[KEEP-AS-IS]" to preserve existing cell text while still applying shared styles. Do not invoke in parallel with any other index-based action.
- replaceNamedRangeContent: Replace content in a uniquely resolved named range. Requires: documentId, text, and namedRangeName or namedRangeId. Optional: tabId, requiredRevisionId, targetRevisionId.
- fixList: Convert text-like lists to proper lists. Requires: documentId. Optional: startIndex, endIndex.`,
parameters: z.object({
  action: z.enum(['append', 'insertText', 'deleteRange', 'insertPageBreak', 'insertImage', 'insertTable', 'editTableCell', 'batchEditTableCells', 'replaceNamedRangeContent', 'fixList'])
    .describe('The edit operation to perform.'),
  documentId: z.string().describe('The ID of the Google Document.'),
  tabId: z.string().optional().describe('Target tab ID. If not specified, targets the first/default tab.'),
  text: z.string().optional().describe('[append/insertText/replaceNamedRangeContent] The text to add or replace with.'),
  addNewlineIfNeeded: z.boolean().optional().default(true).describe('[append] Auto-add newline before appended text.'),
  index: z.number().int().min(1).optional().describe('[insertText/insertPageBreak/insertImage/insertTable] Raw 1-based insertion index. Use either index or positionType, not both.'),
  startIndex: z.number().int().min(1).optional().describe('[deleteRange/fixList] Start index (inclusive).'),
  endIndex: z.number().int().min(1).optional().describe('[deleteRange/fixList] End index (exclusive).'),
  imageUrl: z.string().optional().describe('[insertImage] Public URL to the image.'),
  localImagePath: z.string().optional().describe('[insertImage] Absolute path to local image file.'),
  width: z.number().min(1).optional().describe('[insertImage] Image width in points.'),
  height: z.number().min(1).optional().describe('[insertImage] Image height in points.'),
  uploadToSameFolder: z.boolean().optional().default(true).describe('[insertImage] Upload local image to same folder as document.'),
  rows: z.number().int().min(1).optional().describe('[insertTable] Number of rows.'),
  columns: z.number().int().min(1).optional().describe('[insertTable] Number of columns.'),
  positionType: SemanticPositionTypeEnum.optional().describe('[insertText/insertPageBreak/insertImage/insertTable] Semantic insertion anchor.'),
  headingText: z.string().optional().describe('[insertText/insertPageBreak/insertImage/insertTable] Used with positionType "afterHeading". Must match a unique heading exactly.'),
  headingNamedStyleType: HeadingStyleTypeEnum.optional().describe('[insertText/insertPageBreak/insertImage/insertTable] Optional heading style filter for positionType "afterHeading".'),
  namedRangeName: z.string().optional().describe('[insertText/insertPageBreak/insertImage/insertTable/replaceNamedRangeContent] Named range name. Must resolve uniquely across the entire document. If duplicates exist in any tab, use namedRangeId instead.'),
  namedRangeId: z.string().optional().describe('[insertText/insertPageBreak/insertImage/insertTable/replaceNamedRangeContent] Exact named range ID. If tabId is also provided, the ID must belong to that tab.'),
  tableStartIndex: z.number().int().min(1).optional().describe('[editTableCell/batchEditTableCells] Starting index of the table element. Re-read the document before reusing this after writes.'),
  rowIndex: z.number().int().min(0).optional().describe('[editTableCell/batchEditTableCells] Starting row index (0-based).'),
  columnIndex: z.number().int().min(0).optional().describe('[editTableCell/batchEditTableCells] Starting column index (0-based).'),
  textContent: z.string().optional().describe('[editTableCell] New text content for the cell.'),
  cellMatrix: z.array(z.array(z.string())).optional().describe('[batchEditTableCells] Rectangular 2D matrix of cell text values anchored at {rowIndex, columnIndex}. Use "[KEEP-AS-IS]" to keep a cell\'s existing text.'),
  textStyle: TextStyleParameters.optional().describe('[editTableCell/batchEditTableCells] Text styles to apply.'),
  paragraphStyle: ParagraphStyleParameters.optional().describe('[editTableCell/batchEditTableCells] Paragraph styles to apply.'),
  requiredRevisionId: z.string().optional().describe('[append/insertText/deleteRange/insertPageBreak/insertImage/insertTable/editTableCell/batchEditTableCells/replaceNamedRangeContent] Require the document to still be at this revision.'),
  targetRevisionId: z.string().optional().describe('[append/insertText/deleteRange/insertPageBreak/insertImage/insertTable/editTableCell/batchEditTableCells/replaceNamedRangeContent] Rebase the write onto this revision if possible.'),
}),
execute: async (args, { log }) => {
  const docs = await getDocsClient();
  const docId = args.documentId;
  const writeControl = getWriteControlFromArgs(args);

  switch (args.action) {

    // ── append ──
    case 'append': {
      if (!args.text) throw new UserError('text is required for action "append".');
      const appendText = unescapeText(args.text);
      log.info(`Appending to doc ${docId}${args.tabId ? ` (tab: ${args.tabId})` : ''}`);
      try {
        const needsTabsContent = !!args.tabId;
        const docInfo = await docs.documents.get({
            documentId: docId, includeTabsContent: needsTabsContent,
            fields: needsTabsContent ? 'tabs' : 'body(content(endIndex)),documentStyle(pageSize)'
        });
        let endIndex = 1;
        let bodyContent: any;
        if (args.tabId) {
            const targetTab = GDocsHelpers.findTabById(docInfo.data, args.tabId);
            if (!targetTab) throw new UserError(`Tab with ID "${args.tabId}" not found.`);
            if (!targetTab.documentTab) throw new UserError(`Tab "${args.tabId}" does not have content.`);
            bodyContent = targetTab.documentTab.body?.content;
        } else {
            bodyContent = docInfo.data.body?.content;
        }
        if (bodyContent) {
            const lastElement = bodyContent[bodyContent.length - 1];
            if (lastElement?.endIndex) endIndex = lastElement.endIndex - 1;
        }
        const textToInsert = (args.addNewlineIfNeeded && endIndex > 1 ? '\n' : '') + appendText;
        if (!textToInsert) return "Nothing to append.";
        const location: any = { index: endIndex };
        if (args.tabId) location.tabId = args.tabId;
        const request: docs_v1.Schema$Request = { insertText: { location, text: textToInsert } };
        await GDocsHelpers.executeBatchUpdate(docs, docId, [request], writeControl);
        return `Successfully appended text to ${args.tabId ? `tab ${args.tabId} in ` : ''}document ${docId}.`;
      } catch (error: any) {
        handleDocError(error, docId, 'append to document');
      }
    }

    // ── insertText ──
    case 'insertText': {
      if (!args.text) throw new UserError('text is required for action "insertText".');
      const insertTextVal = unescapeText(args.text);
      log.info(`Inserting text in doc ${docId}${args.tabId ? ` (tab: ${args.tabId})` : ''}`);
      try {
        const resolvedPosition = await resolveInsertPositionFromArgs(docs, docId, args);
        const targetTabId = resolvedPosition.tabId ?? args.tabId;
        await GDocsHelpers.insertText(
            docs,
            docId,
            insertTextVal,
            resolvedPosition.index ?? 1,
            targetTabId,
            writeControl,
            resolvedPosition.endOfSegmentLocation,
        );
        const targetDescription = args.positionType ? `semantic position ${args.positionType}` : `index ${resolvedPosition.index}`;
        return `Successfully inserted text at ${targetDescription}${targetTabId ? ` in tab ${targetTabId}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, docId, 'insert text');
      }
    }

    // ── deleteRange ──
    case 'deleteRange': {
      if (args.startIndex === undefined || args.endIndex === undefined)
        throw new UserError('startIndex and endIndex are required for action "deleteRange".');
      if (args.endIndex <= args.startIndex)
        throw new UserError("endIndex must be greater than startIndex.");
      log.info(`Deleting range ${args.startIndex}-${args.endIndex} in doc ${docId}${args.tabId ? ` (tab: ${args.tabId})` : ''}`);
      try {
        if (args.tabId) {
            const docInfo = await docs.documents.get({ documentId: docId, includeTabsContent: true, fields: 'tabs' });
            const targetTab = GDocsHelpers.findTabById(docInfo.data, args.tabId);
            if (!targetTab) throw new UserError(`Tab with ID "${args.tabId}" not found.`);
        }
        const range: any = { startIndex: args.startIndex, endIndex: args.endIndex };
        if (args.tabId) range.tabId = args.tabId;
        const request: docs_v1.Schema$Request = { deleteContentRange: { range } };
        await GDocsHelpers.executeBatchUpdate(docs, docId, [request], writeControl);
        return `Successfully deleted content in range ${args.startIndex}-${args.endIndex}${args.tabId ? ` in tab ${args.tabId}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, docId, 'delete range');
      }
    }

    // ── insertPageBreak ──
    case 'insertPageBreak': {
      try {
        const resolvedPosition = await resolveInsertPositionFromArgs(docs, docId, args);
        const targetTabId = resolvedPosition.tabId ?? args.tabId;
        const request: docs_v1.Schema$Request = resolvedPosition.endOfSegmentLocation
            ? { insertPageBreak: { endOfSegmentLocation: resolvedPosition.endOfSegmentLocation } }
            : {
                insertPageBreak: {
                    location: {
                        index: resolvedPosition.index!,
                        ...(targetTabId ? { tabId: targetTabId } : {}),
                    },
                },
            };
        await GDocsHelpers.executeBatchUpdate(docs, docId, [request], writeControl);
        const targetDescription = args.positionType ? `semantic position ${args.positionType}` : `index ${resolvedPosition.index}`;
        return `Successfully inserted page break at ${targetDescription}${targetTabId ? ` in tab ${targetTabId}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, docId, 'insert page break');
      }
    }

    // ── insertImage ──
    case 'insertImage': {
      if (!args.imageUrl && !args.localImagePath) throw new UserError('Either imageUrl or localImagePath is required for action "insertImage".');

      const sizeInfo = (args.width && args.height) ? ` with size ${args.width}x${args.height}pt` : '';

      try {
        const resolvedPosition = await resolveInsertPositionFromArgs(docs, docId, args);
        const targetTabId = resolvedPosition.tabId ?? args.tabId;

        if (args.localImagePath) {
          const drive = await getDriveClient();
          let parentFolderId: string | undefined;
          if (args.uploadToSameFolder) {
              try {
                  const docInfo = await drive.files.get({ fileId: docId, fields: 'parents' });
                  if (docInfo.data.parents?.length) parentFolderId = docInfo.data.parents[0];
              } catch (_) { /* use root */ }
          }
          const imageUrl = await GDocsHelpers.uploadImageToDrive(drive, args.localImagePath, parentFolderId);
          await GDocsHelpers.insertInlineImage(
              docs,
              docId,
              imageUrl,
              resolvedPosition.index ?? 1,
              args.width,
              args.height,
              targetTabId,
              writeControl,
              resolvedPosition.endOfSegmentLocation,
          );
          const targetDescription = args.positionType ? `semantic position ${args.positionType}` : `index ${resolvedPosition.index}`;
          return `Successfully uploaded and inserted local image at ${targetDescription}${sizeInfo}${targetTabId ? ` in tab ${targetTabId}` : ''}.\nImage URL: ${imageUrl}`;
        }

        if (args.imageUrl) {
          await GDocsHelpers.insertInlineImage(
              docs,
              docId,
              args.imageUrl!,
              resolvedPosition.index ?? 1,
              args.width,
              args.height,
              targetTabId,
              writeControl,
              resolvedPosition.endOfSegmentLocation,
          );
          const targetDescription = args.positionType ? `semantic position ${args.positionType}` : `index ${resolvedPosition.index}`;
          return `Successfully inserted image from URL at ${targetDescription}${sizeInfo}${targetTabId ? ` in tab ${targetTabId}` : ''}.`;
        }
        throw new UserError('Either imageUrl or localImagePath is required for action "insertImage".');
      } catch (error: any) {
        handleDocError(error, docId, args.localImagePath ? 'upload/insert local image' : 'insert image');
      }
    }

    // ── insertTable ──
    case 'insertTable': {
      if (!args.rows || !args.columns) throw new UserError('rows and columns are required for action "insertTable".');
      try {
        const preInsertDoc = await docs.documents.get({
          documentId: docId,
          includeTabsContent: true,
          fields: SemanticResolutionFields,
        });
        const resolvedPosition = resolveInsertPositionFromDocumentData(preInsertDoc.data, args);
        const targetTabId = resolvedPosition.tabId ?? args.tabId;
        const preInsertContent = getDocumentBodyContent(preInsertDoc.data, targetTabId);

        const insertRequests = resolvedPosition.endOfSegmentLocation
            ? GDocsHelpers.buildInsertTableRequests({
                endOfSegmentLocation: resolvedPosition.endOfSegmentLocation,
                rows: args.rows,
                columns: args.columns,
                tabId: targetTabId,
            })
            : GDocsHelpers.buildInsertTableRequests({
                bodyContent: preInsertContent,
                index: resolvedPosition.index,
                rows: args.rows,
                columns: args.columns,
                tabId: targetTabId,
            });
        let currentWriteControl = writeControl;
        const firstBatchResponse = await GDocsHelpers.executeBatchUpdate(docs, docId, insertRequests, currentWriteControl);
        currentWriteControl = firstBatchResponse.writeControl ?? currentWriteControl;

        const res = await docs.documents.get({
          documentId: docId,
          includeTabsContent: true,
          fields: PostInsertTableFields,
        });

        let postInsertContent: any[];
        if (targetTabId) {
          const tab = GDocsHelpers.findTabById(res.data, targetTabId);
          if (!tab) throw new UserError(`Tab "${targetTabId}" not found.`);
          postInsertContent = tab.documentTab?.body?.content || [];
        } else {
          postInsertContent = res.data.body?.content || [];
        }

        const insertionAnchor = resolvedPosition.index ?? 0;
        const candidateTables = postInsertContent
            .filter((el: any) => el.table && typeof el.startIndex === 'number')
            .sort((left: any, right: any) => (left.startIndex ?? 0) - (right.startIndex ?? 0));
        const tableEl = candidateTables.find((el: any) => (el.startIndex ?? 0) > insertionAnchor) ?? candidateTables.at(-1);
        const tableStartIdx = tableEl?.startIndex;

        if (tableEl && tableStartIdx !== undefined) {
          const trailingLoc: any = { index: tableEl.endIndex };
          if (targetTabId) trailingLoc.tabId = targetTabId;
          const trailingBatchResponse = await GDocsHelpers.executeBatchUpdate(
              docs,
              docId,
              [{ insertText: { location: trailingLoc, text: '\n' } }],
              currentWriteControl,
          );
          currentWriteControl = trailingBatchResponse.writeControl ?? currentWriteControl;

          const headerStyleRequests: docs_v1.Schema$Request[] = [];
          const headerRow = tableEl.table?.tableRows?.[0];
          if (headerRow?.tableCells) {
            const tableStartLocation: any = { index: tableStartIdx };
            if (targetTabId) tableStartLocation.tabId = targetTabId;
            headerStyleRequests.push({
              updateTableCellStyle: {
                tableRange: {
                  tableCellLocation: { tableStartLocation, rowIndex: 0, columnIndex: 0 },
                  rowSpan: 1,
                  columnSpan: args.columns,
                },
                tableCellStyle: {
                  backgroundColor: { color: { rgbColor: { red: 0.937, green: 0.937, blue: 0.937 } } },
                },
                fields: 'backgroundColor',
              },
            });

            for (const cell of headerRow.tableCells) {
              const cellStart = cell.content?.[0]?.startIndex;
              const cellEnd = cell.content?.[cell.content.length - 1]?.endIndex;
              if (cellStart != null && cellEnd != null && cellEnd - 1 > cellStart) {
                const range: any = { startIndex: cellStart, endIndex: cellEnd - 1 };
                if (targetTabId) range.tabId = targetTabId;
                headerStyleRequests.push({
                  updateTextStyle: { range, textStyle: { bold: true }, fields: 'bold' },
                });
              }
            }
          }
          if (headerStyleRequests.length > 0) {
            await GDocsHelpers.executeBatchUpdate(docs, docId, headerStyleRequests, currentWriteControl);
          }
        }

        const targetDescription = args.positionType ? `semantic position ${args.positionType}` : `index ${resolvedPosition.index}`;
        return `Successfully inserted a ${args.rows}x${args.columns} table with styled header at ${targetDescription}${targetTabId ? ` in tab ${targetTabId}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, docId, 'insert table');
      }
    }

    // ── editTableCell ──
    case 'editTableCell': {
      if (args.tableStartIndex === undefined) throw new UserError('tableStartIndex is required for action "editTableCell".');
      if (args.rowIndex === undefined) throw new UserError('rowIndex is required for action "editTableCell".');
      if (args.columnIndex === undefined) throw new UserError('columnIndex is required for action "editTableCell".');
      log.info(`Editing table cell [${args.rowIndex},${args.columnIndex}] at table index ${args.tableStartIndex} in doc ${docId}`);
      try {
        const res = await docs.documents.get({
            documentId: docId,
            includeTabsContent: true,
            fields: TableLookupFields,
        });
        const { bodyContent, tabId: targetTabId } = getEffectiveBodyTarget(res.data, args.tabId);

        const tableElement = bodyContent.find((el: any) => el.table && el.startIndex === args.tableStartIndex);
        if (!tableElement) {
            const tables = bodyContent.filter((el: any) => el.table).map((el: any) => el.startIndex);
            throw new UserError(`No table found at index ${args.tableStartIndex}. Tables found at indices: [${tables.join(', ')}]`);
        }

        const rows = tableElement.table.tableRows;
        if (!rows || args.rowIndex >= rows.length) throw new UserError(`Row index ${args.rowIndex} out of range. Table has ${rows?.length || 0} rows.`);
        const cells = rows[args.rowIndex].tableCells;
        if (!cells || args.columnIndex >= cells.length) throw new UserError(`Column index ${args.columnIndex} out of range. Row has ${cells?.length || 0} columns.`);

        const cell = cells[args.columnIndex];
        const cellRange = GDocsHelpers.getTableCellContentRange(cell);
        const requests = GDocsHelpers.buildTableCellEditRequests({
            cellStartIndex: cellRange.startIndex,
            cellTextEndIndex: cellRange.textEndIndex,
            textContent: args.textContent !== undefined ? unescapeText(args.textContent) : undefined,
            textStyle: args.textStyle as any,
            paragraphStyle: args.paragraphStyle as any,
            tabId: targetTabId,
        });

        if (requests.length === 0) throw new UserError('No changes specified. Provide textContent, textStyle, or paragraphStyle.');
        await GDocsHelpers.executeBatchUpdate(docs, docId, requests, writeControl);
        return `Successfully edited table cell [row=${args.rowIndex}, col=${args.columnIndex}] in doc ${docId}${targetTabId ? ` in tab ${targetTabId}` : ''}.`;
      } catch (error: any) {
        if (error instanceof UserError) throw error;
        handleDocError(error, docId, 'edit table cell');
      }
    }

    // ── batchEditTableCells ──
    case 'batchEditTableCells': {
      if (args.tableStartIndex === undefined) throw new UserError('tableStartIndex is required for action "batchEditTableCells".');
      if (args.rowIndex === undefined) throw new UserError('rowIndex is required for action "batchEditTableCells".');
      if (args.columnIndex === undefined) throw new UserError('columnIndex is required for action "batchEditTableCells".');
      if (!args.cellMatrix) throw new UserError('cellMatrix is required for action "batchEditTableCells".');
      log.info(`Editing table block starting at [${args.rowIndex},${args.columnIndex}] at table index ${args.tableStartIndex} in doc ${docId}`);
      try {
        const res = await docs.documents.get({
            documentId: docId,
            includeTabsContent: true,
            fields: TableLookupFields,
        });
        const { bodyContent, tabId: targetTabId } = getEffectiveBodyTarget(res.data, args.tabId);

        const tableElement = bodyContent.find((el: any) => el.table && el.startIndex === args.tableStartIndex);
        if (!tableElement) {
            const tables = bodyContent.filter((el: any) => el.table).map((el: any) => el.startIndex);
            throw new UserError(`No table found at index ${args.tableStartIndex}. Tables found at indices: [${tables.join(', ')}]`);
        }

        const rows = tableElement.table.tableRows || [];
        const cellMatrix = args.cellMatrix.map(row =>
            row.map(cellValue =>
                cellValue === GDocsHelpers.KEEP_AS_IS_SENTINEL ? cellValue : unescapeText(cellValue)
            )
        );
        const requests = GDocsHelpers.buildBatchTableCellEditRequests({
            tableRows: rows,
            rowIndex: args.rowIndex,
            columnIndex: args.columnIndex,
            cellMatrix,
            textStyle: args.textStyle as any,
            paragraphStyle: args.paragraphStyle as any,
            tabId: targetTabId,
        });
        await GDocsHelpers.executeBatchUpdate(docs, docId, requests, writeControl);
        const rowCount = cellMatrix.length;
        const columnCount = cellMatrix[0]?.length ?? 0;
        return `Successfully edited a ${rowCount}x${columnCount} table cell block starting at [row=${args.rowIndex}, col=${args.columnIndex}] in doc ${docId}${targetTabId ? ` in tab ${targetTabId}` : ''}.`;
      } catch (error: any) {
        if (error instanceof UserError) throw error;
        handleDocError(error, docId, 'batch edit table cells');
      }
    }

    // ── replaceNamedRangeContent ──
    case 'replaceNamedRangeContent': {
      if (!args.text) throw new UserError('text is required for action "replaceNamedRangeContent".');
      try {
        const documentResponse = await docs.documents.get({
            documentId: docId,
            includeTabsContent: true,
        });
        const namedRange = resolveNamedRangeForMutation(
            documentResponse.data,
            {
                namedRangeName: args.namedRangeName,
                namedRangeId: args.namedRangeId,
                tabId: args.tabId,
            }
        );
        const request = GDocsHelpers.buildReplaceNamedRangeContentRequest({
            namedRangeId: namedRange.namedRangeId,
            text: unescapeText(args.text),
            tabId: namedRange.tabId ?? args.tabId,
        });
        await GDocsHelpers.executeBatchUpdate(docs, docId, [request], writeControl);
        const targetTabLabel = namedRange.tabId ?? args.tabId;
        return `Successfully replaced content in named range "${namedRange.name}" (${namedRange.namedRangeId})${targetTabLabel ? ` in tab ${targetTabLabel}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, docId, 'replace named range content');
      }
    }

    // ── fixList ──
    case 'fixList': {
      try {
        await GDocsHelpers.detectAndFormatLists(docs, docId, args.startIndex, args.endIndex);
        return `Attempted to fix list formatting. Please review the document for accuracy.`;
      } catch (error: any) {
        handleDocError(error, docId, 'fix list formatting');
      }
    }

    default:
      throw new UserError(`Unknown action: ${args.action}`);
  }
}
});


// ── Tool 3: googleDocFormat ────────────────────────────────
server.addTool({
name: 'googleDocFormat',
description: `Apply formatting and styles to Google Document content.

Actions:
- textStyle: Apply character formatting (bold, color, font, etc.) by range or text match.
  Target by EITHER {startIndex, endIndex} OR {textToFind, matchInstance}.
  Requires: documentId + target + at least one style param.
- paragraphStyle: Apply paragraph formatting (alignment, heading style, spacing).
  Target by {startIndex, endIndex} OR {textToFind, matchInstance} OR {indexWithinParagraph}.
  Requires: documentId + target + at least one style param.`,
parameters: z.object({
  action: z.enum(['textStyle', 'paragraphStyle']).describe('The formatting operation.'),
  documentId: z.string().describe('The ID of the Google Document.'),
  tabId: z.string().optional().describe('Target tab ID.'),
  // Targeting
  startIndex: z.number().int().min(1).optional().describe('Start index (inclusive) for range targeting.'),
  endIndex: z.number().int().min(1).optional().describe('End index (exclusive) for range targeting.'),
  textToFind: z.string().optional().describe('Exact text string to locate for text targeting.'),
  matchInstance: z.number().int().min(1).optional().default(1).describe('Which instance of textToFind to target (1st, 2nd, etc.).'),
  indexWithinParagraph: z.number().int().min(1).optional().describe('[paragraphStyle only] An index within the target paragraph.'),
  // Text style params
  bold: z.boolean().optional().describe('Apply bold formatting.'),
  italic: z.boolean().optional().describe('Apply italic formatting.'),
  underline: z.boolean().optional().describe('Apply underline formatting.'),
  strikethrough: z.boolean().optional().describe('Apply strikethrough formatting.'),
  fontSize: z.number().min(1).optional().describe('Font size in points.'),
  fontFamily: z.string().optional().describe('Font family (e.g., "Arial").'),
  foregroundColor: z.string().optional().describe('Text color in hex (e.g., "#FF0000").'),
  backgroundColor: z.string().optional().describe('Text background color in hex.'),
  linkUrl: z.string().optional().describe('Make text a hyperlink.'),
  // Paragraph style params
  alignment: z.enum(['START', 'END', 'CENTER', 'JUSTIFIED']).optional().describe('[paragraphStyle] Paragraph alignment.'),
  namedStyleType: z.enum(['NORMAL_TEXT', 'TITLE', 'SUBTITLE', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'HEADING_4', 'HEADING_5', 'HEADING_6']).optional().describe('[paragraphStyle] Named paragraph style.'),
  indentStart: z.number().min(0).optional().describe('[paragraphStyle] Left indent in points.'),
  indentEnd: z.number().min(0).optional().describe('[paragraphStyle] Right indent in points.'),
  spaceAbove: z.number().min(0).optional().describe('[paragraphStyle] Space before paragraph in points.'),
  spaceBelow: z.number().min(0).optional().describe('[paragraphStyle] Space after paragraph in points.'),
  keepWithNext: z.boolean().optional().describe('[paragraphStyle] Keep with next paragraph on same page.'),
  requiredRevisionId: z.string().optional().describe('[textStyle/paragraphStyle] Require the document to still be at this revision.'),
  targetRevisionId: z.string().optional().describe('[textStyle/paragraphStyle] Rebase the write onto this revision if possible.'),
}),
execute: async (args, { log }) => {
  const docs = await getDocsClient();
  const docId = args.documentId;
  const writeControl = getWriteControlFromArgs(args);

  switch (args.action) {

    // ── textStyle ──
    case 'textStyle': {
      log.info(`Applying text style in doc ${docId}${args.tabId ? ` (tab: ${args.tabId})` : ''}`);
      try {
        let si: number | undefined;
        let ei: number | undefined;

        if (args.textToFind) {
            const range = await GDocsHelpers.findTextRange(docs, docId, args.textToFind, args.matchInstance, args.tabId);
            if (!range) throw new UserError(`Could not find instance ${args.matchInstance} of text "${args.textToFind}".`);
            si = range.startIndex;
            ei = range.endIndex;
        } else if (args.startIndex !== undefined && args.endIndex !== undefined) {
            si = args.startIndex;
            ei = args.endIndex;
        } else {
            throw new UserError('Provide either textToFind or startIndex+endIndex for targeting.');
        }

        if (si === undefined || ei === undefined) throw new UserError("Target range could not be determined.");
        if (ei <= si) throw new UserError("endIndex must be greater than startIndex.");

        const styleParams: TextStyleArgs = {};
        if (args.bold !== undefined) styleParams.bold = args.bold;
        if (args.italic !== undefined) styleParams.italic = args.italic;
        if (args.underline !== undefined) styleParams.underline = args.underline;
        if (args.strikethrough !== undefined) styleParams.strikethrough = args.strikethrough;
        if (args.fontSize !== undefined) styleParams.fontSize = args.fontSize;
        if (args.fontFamily !== undefined) styleParams.fontFamily = args.fontFamily;
        if (args.foregroundColor !== undefined) styleParams.foregroundColor = args.foregroundColor;
        if (args.backgroundColor !== undefined) styleParams.backgroundColor = args.backgroundColor;
        if (args.linkUrl !== undefined) styleParams.linkUrl = args.linkUrl;

        const requestInfo = GDocsHelpers.buildUpdateTextStyleRequest(si, ei, styleParams, args.tabId);
        if (!requestInfo) return "No valid text styling options were provided.";
        await GDocsHelpers.executeBatchUpdate(docs, docId, [requestInfo.request], writeControl);
        const targetDesc = args.textToFind ? `"${args.textToFind}" (instance ${args.matchInstance})` : `range ${si}-${ei}`;
        return `Successfully applied text style (${requestInfo.fields.join(', ')}) to ${targetDesc}${args.tabId ? ` in tab ${args.tabId}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, docId, 'apply text style');
      }
    }

    // ── paragraphStyle ──
    case 'paragraphStyle': {
      log.info(`Applying paragraph style in doc ${docId}${args.tabId ? ` (tab: ${args.tabId})` : ''}`);
      try {
        let si: number | undefined;
        let ei: number | undefined;

        if (args.textToFind) {
            const textRange = await GDocsHelpers.findTextRange(docs, docId, args.textToFind, args.matchInstance || 1, args.tabId);
            if (!textRange) throw new UserError(`Could not find "${args.textToFind}" in the document.`);
            const pRange = await GDocsHelpers.getParagraphRange(docs, docId, textRange.startIndex, args.tabId);
            if (!pRange) throw new UserError(`Found text but could not determine paragraph boundaries.`);
            si = pRange.startIndex;
            ei = pRange.endIndex;
        } else if (args.indexWithinParagraph !== undefined) {
            const pRange = await GDocsHelpers.getParagraphRange(docs, docId, args.indexWithinParagraph, args.tabId);
            if (!pRange) throw new UserError(`Could not find paragraph containing index ${args.indexWithinParagraph}.`);
            si = pRange.startIndex;
            ei = pRange.endIndex;
        } else if (args.startIndex !== undefined && args.endIndex !== undefined) {
            si = args.startIndex;
            ei = args.endIndex;
        } else {
            throw new UserError('Provide textToFind, indexWithinParagraph, or startIndex+endIndex for targeting.');
        }

        if (si === undefined || ei === undefined) throw new UserError("Could not determine target paragraph range.");
        if (ei <= si) throw new UserError(`Invalid range: end (${ei}) must be > start (${si}).`);

        const styleParams: ParagraphStyleArgs = {};
        if (args.alignment !== undefined) styleParams.alignment = args.alignment;
        if (args.namedStyleType !== undefined) styleParams.namedStyleType = args.namedStyleType;
        if (args.indentStart !== undefined) styleParams.indentStart = args.indentStart;
        if (args.indentEnd !== undefined) styleParams.indentEnd = args.indentEnd;
        if (args.spaceAbove !== undefined) styleParams.spaceAbove = args.spaceAbove;
        if (args.spaceBelow !== undefined) styleParams.spaceBelow = args.spaceBelow;
        if (args.keepWithNext !== undefined) styleParams.keepWithNext = args.keepWithNext;

        const requestInfo = GDocsHelpers.buildUpdateParagraphStyleRequest(si, ei, styleParams, args.tabId);
        if (!requestInfo) return "No valid paragraph styling options were provided.";
        await GDocsHelpers.executeBatchUpdate(docs, docId, [requestInfo.request], writeControl);
        return `Successfully applied paragraph styles (${requestInfo.fields.join(', ')})${args.tabId ? ` in tab ${args.tabId}` : ''}.`;
      } catch (error: any) {
        handleDocError(error, docId, 'apply paragraph style');
      }
    }

    default:
      throw new UserError(`Unknown action: ${args.action}`);
  }
}
});


// ── Tool 4: googleDocComment ───────────────────────────────
server.addTool({
name: 'googleDocComment',
description: `Manage comments on a Google Document.

Actions:
- list: List all comments. Requires: documentId.
- get: Get a comment with replies. Requires: documentId, commentId.
- add: Add a comment anchored to text range. Requires: documentId, startIndex, endIndex, commentText.
- reply: Reply to a comment. Requires: documentId, commentId, replyText.
- resolve: Mark comment as resolved. Requires: documentId, commentId.
- delete: Delete a comment. Requires: documentId, commentId.`,
parameters: z.object({
  action: z.enum(['list', 'get', 'add', 'reply', 'resolve', 'delete']).describe('The comment operation.'),
  documentId: z.string().describe('The ID of the Google Document.'),
  commentId: z.string().optional().describe('Comment ID (required for: get, reply, resolve, delete).'),
  commentText: z.string().optional().describe('[add] The content of the comment.'),
  replyText: z.string().optional().describe('[reply] The content of the reply.'),
  startIndex: z.number().int().min(1).optional().describe('[add] Start index of the text range to anchor to (inclusive).'),
  endIndex: z.number().int().min(1).optional().describe('[add] End index of the text range (exclusive).'),
}),
execute: async (args, { log }) => {
  const docId = args.documentId;
  const requireCommentId = () => {
    if (!args.commentId) throw new UserError(`commentId is required for action "${args.action}".`);
    return args.commentId;
  };

  switch (args.action) {

    // ── list ──
    case 'list': {
      await getDocsClient();
      try {
        const drive = google.drive({ version: 'v3', auth: authClient! });
        const response = await drive.comments.list({
            fileId: docId,
            fields: 'comments(id,content,quotedFileContent,author,createdTime,resolved)',
            pageSize: 100
        });
        const comments = response.data.comments || [];
        if (comments.length === 0) return 'No comments found in this document.';
        const formatted = comments.map((comment: any, i: number) => {
            const replies = comment.replies?.length || 0;
            const status = comment.resolved ? ' [RESOLVED]' : '';
            const author = comment.author?.displayName || 'Unknown';
            const date = comment.createdTime ? new Date(comment.createdTime).toLocaleDateString() : 'Unknown date';
            const quotedText = comment.quotedFileContent?.value || 'No quoted text';
            const anchor = quotedText !== 'No quoted text' ? ` (anchored to: "${quotedText.substring(0, 100)}${quotedText.length > 100 ? '...' : ''}")` : '';
            let result = `\n${i + 1}. **${author}** (${date})${status}${anchor}\n   ${comment.content}`;
            if (replies > 0) result += `\n   └─ ${replies} ${replies === 1 ? 'reply' : 'replies'}`;
            result += `\n   Comment ID: ${comment.id}`;
            return result;
        }).join('\n');
        return `Found ${comments.length} comment${comments.length === 1 ? '' : 's'}:\n${formatted}`;
      } catch (error: any) {
        throw new UserError(`Failed to list comments: ${error.message || 'Unknown error'}`);
      }
    }

    // ── get ──
    case 'get': {
      const commentId = requireCommentId();
      try {
        const drive = google.drive({ version: 'v3', auth: authClient! });
        const response = await drive.comments.get({
            fileId: docId, commentId,
            fields: 'id,content,quotedFileContent,author,createdTime,resolved,replies(id,content,author,createdTime)'
        });
        const c = response.data;
        const author = c.author?.displayName || 'Unknown';
        const date = c.createdTime ? new Date(c.createdTime).toLocaleDateString() : 'Unknown date';
        const status = c.resolved ? ' [RESOLVED]' : '';
        const qt = c.quotedFileContent?.value || 'No quoted text';
        const anchor = qt !== 'No quoted text' ? `\nAnchored to: "${qt}"` : '';
        let result = `**${author}** (${date})${status}${anchor}\n${c.content}`;
        if (c.replies && c.replies.length > 0) {
            result += '\n\n**Replies:**';
            c.replies.forEach((reply: any, i: number) => {
                result += `\n${i + 1}. **${reply.author?.displayName || 'Unknown'}** (${reply.createdTime ? new Date(reply.createdTime).toLocaleDateString() : 'Unknown date'})\n   ${reply.content}`;
            });
        }
        return result;
      } catch (error: any) {
        throw new UserError(`Failed to get comment: ${error.message || 'Unknown error'}`);
      }
    }

    // ── add ──
    case 'add': {
      if (!args.commentText) throw new UserError('commentText is required for action "add".');
      if (args.startIndex === undefined || args.endIndex === undefined) throw new UserError('startIndex and endIndex are required for action "add".');
      if (args.endIndex <= args.startIndex) throw new UserError('endIndex must be greater than startIndex.');
      try {
        const docsClient = await getDocsClient();
        const doc = await docsClient.documents.get({ documentId: docId });
        let quotedText = '';
        const content = doc.data.body?.content || [];
        for (const element of content) {
            if (element.paragraph) {
                for (const te of (element.paragraph.elements || [])) {
                    if (te.textRun) {
                        const es = te.startIndex || 0;
                        const ee = te.endIndex || 0;
                        if (ee > args.startIndex && es < args.endIndex) {
                            const text = te.textRun.content || '';
                            quotedText += text.substring(Math.max(0, args.startIndex - es), Math.min(text.length, args.endIndex - es));
                        }
                    }
                }
            }
        }
        const drive = google.drive({ version: 'v3', auth: authClient! });
        const response = await drive.comments.create({
            fileId: docId,
            fields: 'id,content,quotedFileContent,author,createdTime,resolved',
            requestBody: {
                content: args.commentText,
                quotedFileContent: { value: quotedText, mimeType: 'text/html' },
                anchor: JSON.stringify({ r: docId, a: [{ txt: { o: args.startIndex - 1, l: args.endIndex - args.startIndex, ml: args.endIndex - args.startIndex } }] })
            }
        });
        return `Comment added successfully. Comment ID: ${response.data.id}`;
      } catch (error: any) {
        throw new UserError(`Failed to add comment: ${error.message || 'Unknown error'}`);
      }
    }

    // ── reply ──
    case 'reply': {
      const commentId = requireCommentId();
      if (!args.replyText) throw new UserError('replyText is required for action "reply".');
      try {
        const drive = google.drive({ version: 'v3', auth: authClient! });
        const response = await drive.replies.create({
            fileId: docId, commentId,
            fields: 'id,content,author,createdTime',
            requestBody: { content: args.replyText }
        });
        return `Reply added successfully. Reply ID: ${response.data.id}`;
      } catch (error: any) {
        throw new UserError(`Failed to add reply: ${error.message || 'Unknown error'}`);
      }
    }

    // ── resolve ──
    case 'resolve': {
      const commentId = requireCommentId();
      try {
        const drive = google.drive({ version: 'v3', auth: authClient! });
        const current = await drive.comments.get({ fileId: docId, commentId, fields: 'content' });
        await drive.comments.update({ fileId: docId, commentId, fields: 'id,resolved', requestBody: { content: current.data.content, resolved: true } });
        const verify = await drive.comments.get({ fileId: docId, commentId, fields: 'resolved' });
        if (verify.data.resolved) return `Comment ${commentId} has been marked as resolved.`;
        return `Attempted to resolve comment ${commentId}, but resolved status may not persist in the Google Docs UI due to API limitations.`;
      } catch (error: any) {
        throw new UserError(`Failed to resolve comment: ${error.message || 'Unknown error'}`);
      }
    }

    // ── delete ──
    case 'delete': {
      const commentId = requireCommentId();
      try {
        const drive = google.drive({ version: 'v3', auth: authClient! });
        await drive.comments.delete({ fileId: docId, commentId });
        return `Comment ${commentId} has been deleted.`;
      } catch (error: any) {
        throw new UserError(`Failed to delete comment: ${error.message || 'Unknown error'}`);
      }
    }

    default:
      throw new UserError(`Unknown action: ${args.action}`);
  }
}
});


// ── Tool 5: googleDrive ────────────────────────────────────
server.addTool({
name: 'googleDrive',
description: `Manage files and folders in Google Drive, and create new documents.

Actions:
- createFolder: Create a folder. Requires: name. Optional: parentFolderId.
- listFolder: List folder contents. Requires: folderId. Optional: includeSubfolders, includeFiles, maxResults.
- folderInfo: Get folder metadata. Requires: folderId.
- move: Move file/folder. Requires: fileId, newParentId. Optional: removeFromAllParents.
- copy: Copy a file. Requires: fileId. Optional: newName, parentFolderId.
- rename: Rename file/folder. Requires: fileId, newName.
- delete: Delete file/folder. Requires: fileId. Optional: skipTrash.
- createDoc: Create a new Google Document. Requires: title. Optional: parentFolderId, initialContent.
- createFromTemplate: Create doc from template. Requires: templateId, title. Optional: parentFolderId, replacements.`,
parameters: z.object({
  action: z.enum(['createFolder', 'listFolder', 'folderInfo', 'move', 'copy', 'rename', 'delete', 'createDoc', 'createFromTemplate'])
    .describe('The Drive operation to perform.'),
  fileId: z.string().optional().describe('File or folder ID (for: move, copy, rename, delete).'),
  folderId: z.string().optional().describe('Folder ID (for: listFolder, folderInfo). Use "root" for root Drive folder.'),
  name: z.string().optional().describe('[createFolder] Folder name.'),
  newName: z.string().optional().describe('[copy/rename] New name for file/folder.'),
  newParentId: z.string().optional().describe('[move] Destination folder ID.'),
  parentFolderId: z.string().optional().describe('[createFolder/copy/createDoc/createFromTemplate] Parent folder ID.'),
  removeFromAllParents: z.boolean().optional().default(false).describe('[move] Remove from all current parents.'),
  skipTrash: z.boolean().optional().default(false).describe('[delete] If true, permanently deletes.'),
  includeSubfolders: z.boolean().optional().default(true).describe('[listFolder] Include subfolders.'),
  includeFiles: z.boolean().optional().default(true).describe('[listFolder] Include files.'),
  maxResults: z.number().int().min(1).max(100).optional().default(50).describe('[listFolder] Maximum items.'),
  title: z.string().optional().describe('[createDoc/createFromTemplate] Document title.'),
  initialContent: z.string().optional().describe('[createDoc] Initial text content.'),
  templateId: z.string().optional().describe('[createFromTemplate] Template document ID.'),
  replacements: z.record(z.string()).optional().describe('[createFromTemplate] Key-value pairs for text replacements.'),
}),
execute: async (args, { log }) => {
  const drive = await getDriveClient();

  switch (args.action) {

    // ── createFolder ──
    case 'createFolder': {
      if (!args.name) throw new UserError('name is required for action "createFolder".');
      try {
        const meta: drive_v3.Schema$File = { name: args.name, mimeType: 'application/vnd.google-apps.folder' };
        if (args.parentFolderId) meta.parents = [args.parentFolderId];
        const response = await drive.files.create({ requestBody: meta, fields: 'id,name,parents,webViewLink' });
        return `Successfully created folder "${response.data.name}" (ID: ${response.data.id})\nLink: ${response.data.webViewLink}`;
      } catch (error: any) { handleDriveError(error, 'create folder'); }
    }

    // ── listFolder ──
    case 'listFolder': {
      if (!args.folderId) throw new UserError('folderId is required for action "listFolder".');
      try {
        let q = `'${args.folderId}' in parents and trashed=false`;
        if (!args.includeSubfolders && !args.includeFiles) throw new UserError("At least one of includeSubfolders or includeFiles must be true.");
        if (!args.includeSubfolders) q += ` and mimeType!='application/vnd.google-apps.folder'`;
        else if (!args.includeFiles) q += ` and mimeType='application/vnd.google-apps.folder'`;
        const response = await drive.files.list({ q, pageSize: args.maxResults, orderBy: 'folder,name', fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,owners(displayName))' });
        const items = response.data.files || [];
        if (items.length === 0) return "The folder is empty or you don't have permission to view its contents.";
        let result = `Contents of folder (${items.length} item${items.length !== 1 ? 's' : ''}):\n\n`;
        const folders = items.filter(i => i.mimeType === 'application/vnd.google-apps.folder');
        const files = items.filter(i => i.mimeType !== 'application/vnd.google-apps.folder');
        if (folders.length > 0 && args.includeSubfolders) {
            result += `**Folders (${folders.length}):**\n`;
            folders.forEach(f => { result += `📁 ${f.name} (ID: ${f.id})\n`; });
            result += '\n';
        }
        if (files.length > 0 && args.includeFiles) {
            result += `**Files (${files.length}):\n`;
            files.forEach(f => {
                const icon = f.mimeType === 'application/vnd.google-apps.document' ? '📄' : f.mimeType === 'application/vnd.google-apps.spreadsheet' ? '📊' : '📎';
                result += `${icon} ${f.name}\n   ID: ${f.id}\n   Modified: ${f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'Unknown'}\n   Link: ${f.webViewLink}\n\n`;
            });
        }
        return result;
      } catch (error: any) { handleDriveError(error, 'list folder contents'); }
    }

    // ── folderInfo ──
    case 'folderInfo': {
      if (!args.folderId) throw new UserError('folderId is required for action "folderInfo".');
      try {
        const response = await drive.files.get({ fileId: args.folderId, fields: 'id,name,description,createdTime,modifiedTime,webViewLink,owners(displayName,emailAddress),lastModifyingUser(displayName),shared,parents' });
        const f = response.data;
        let result = `**Folder Information:**\n\n**Name:** ${f.name}\n**ID:** ${f.id}\n`;
        result += `**Created:** ${f.createdTime ? new Date(f.createdTime).toLocaleString() : 'Unknown'}\n`;
        result += `**Last Modified:** ${f.modifiedTime ? new Date(f.modifiedTime).toLocaleString() : 'Unknown'}\n`;
        if (f.owners?.[0]) result += `**Owner:** ${f.owners[0].displayName} (${f.owners[0].emailAddress})\n`;
        result += `**Shared:** ${f.shared ? 'Yes' : 'No'}\n**View Link:** ${f.webViewLink}\n`;
        if (f.description) result += `**Description:** ${f.description}\n`;
        if (f.parents?.length) result += `**Parent Folder ID:** ${f.parents[0]}\n`;
        return result;
      } catch (error: any) { handleDriveError(error, 'get folder info'); }
    }

    // ── move ──
    case 'move': {
      if (!args.fileId) throw new UserError('fileId is required for action "move".');
      if (!args.newParentId) throw new UserError('newParentId is required for action "move".');
      try {
        const fileInfo = await drive.files.get({ fileId: args.fileId, fields: 'name,parents' });
        const currentParents = fileInfo.data.parents || [];
        let updateParams: any = { fileId: args.fileId, addParents: args.newParentId, fields: 'id,name,parents' };
        if (args.removeFromAllParents && currentParents.length > 0) updateParams.removeParents = currentParents.join(',');
        const response = await drive.files.update(updateParams);
        return `Successfully ${args.removeFromAllParents ? 'moved' : 'added'} "${fileInfo.data.name}" to new location.\nFile ID: ${response.data.id}`;
      } catch (error: any) { handleDriveError(error, 'move file'); }
    }

    // ── copy ──
    case 'copy': {
      if (!args.fileId) throw new UserError('fileId is required for action "copy".');
      try {
        const orig = await drive.files.get({ fileId: args.fileId, fields: 'name,parents' });
        const meta: drive_v3.Schema$File = { name: args.newName || `Copy of ${orig.data.name}` };
        if (args.parentFolderId) meta.parents = [args.parentFolderId];
        else if (orig.data.parents) meta.parents = orig.data.parents;
        const response = await drive.files.copy({ fileId: args.fileId, requestBody: meta, fields: 'id,name,webViewLink' });
        return `Successfully created copy "${response.data.name}" (ID: ${response.data.id})\nLink: ${response.data.webViewLink}`;
      } catch (error: any) { handleDriveError(error, 'copy file'); }
    }

    // ── rename ──
    case 'rename': {
      if (!args.fileId) throw new UserError('fileId is required for action "rename".');
      if (!args.newName) throw new UserError('newName is required for action "rename".');
      try {
        const response = await drive.files.update({ fileId: args.fileId, requestBody: { name: args.newName }, fields: 'id,name,webViewLink' });
        return `Successfully renamed to "${response.data.name}" (ID: ${response.data.id})\nLink: ${response.data.webViewLink}`;
      } catch (error: any) { handleDriveError(error, 'rename file'); }
    }

    // ── delete ──
    case 'delete': {
      if (!args.fileId) throw new UserError('fileId is required for action "delete".');
      try {
        const fileInfo = await drive.files.get({ fileId: args.fileId, fields: 'name,mimeType' });
        const isFolder = fileInfo.data.mimeType === 'application/vnd.google-apps.folder';
        const label = isFolder ? 'folder' : 'file';
        if (args.skipTrash) {
            await drive.files.delete({ fileId: args.fileId });
            return `Permanently deleted ${label} "${fileInfo.data.name}".`;
        } else {
            await drive.files.update({ fileId: args.fileId, requestBody: { trashed: true } });
            return `Moved ${label} "${fileInfo.data.name}" to trash. It can be restored.`;
        }
      } catch (error: any) { handleDriveError(error, 'delete file'); }
    }

    // ── createDoc ──
    case 'createDoc': {
      if (!args.title) throw new UserError('title is required for action "createDoc".');
      try {
        const meta: drive_v3.Schema$File = { name: args.title, mimeType: 'application/vnd.google-apps.document' };
        if (args.parentFolderId) meta.parents = [args.parentFolderId];
        const response = await drive.files.create({ requestBody: meta, fields: 'id,name,webViewLink' });
        const doc = response.data;
        let result = `Successfully created document "${doc.name}" (ID: ${doc.id})\nView Link: ${doc.webViewLink}`;
        if (args.initialContent) {
            try {
                const docs = await getDocsClient();
                await docs.documents.batchUpdate({ documentId: doc.id!, requestBody: { requests: [{ insertText: { location: { index: 1 }, text: args.initialContent } }] } });
                result += `\n\nInitial content added.`;
            } catch (_) { result += `\n\nDocument created but failed to add initial content.`; }
        }
        return result;
      } catch (error: any) { handleDriveError(error, 'create document'); }
    }

    // ── createFromTemplate ──
    case 'createFromTemplate': {
      if (!args.templateId) throw new UserError('templateId is required for action "createFromTemplate".');
      if (!args.title) throw new UserError('title is required for action "createFromTemplate".');
      try {
        const meta: drive_v3.Schema$File = { name: args.title };
        if (args.parentFolderId) meta.parents = [args.parentFolderId];
        const response = await drive.files.copy({ fileId: args.templateId, requestBody: meta, fields: 'id,name,webViewLink' });
        const doc = response.data;
        let result = `Successfully created document "${doc.name}" from template (ID: ${doc.id})\nView Link: ${doc.webViewLink}`;
        if (args.replacements && Object.keys(args.replacements).length > 0) {
            try {
                const docs = await getDocsClient();
                const requests: docs_v1.Schema$Request[] = Object.entries(args.replacements).map(([searchText, replaceText]) => ({
                    replaceAllText: { containsText: { text: searchText, matchCase: false }, replaceText }
                }));
                await docs.documents.batchUpdate({ documentId: doc.id!, requestBody: { requests } });
                result += `\n\nApplied ${Object.keys(args.replacements).length} text replacement(s).`;
            } catch (_) { result += `\n\nDocument created but failed to apply text replacements.`; }
        }
        return result;
      } catch (error: any) { handleDriveError(error, 'create document from template'); }
    }

    default:
      throw new UserError(`Unknown action: ${args.action}`);
  }
}
});


// ── Tool 6: googleSheet ────────────────────────────────────
server.addTool({
name: 'googleSheet',
description: `Manage Google Spreadsheets: read/write data, manage sheets, and discover spreadsheets.

Actions:
- read: Read data from a range. Requires: spreadsheetId, range. Optional: valueRenderOption.
- write: Write data to a range. Requires: spreadsheetId, range, values. Optional: valueInputOption.
- append: Append rows. Requires: spreadsheetId, range, values. Optional: valueInputOption.
- clear: Clear a range. Requires: spreadsheetId, range.
- info: Get spreadsheet metadata and sheet list. Requires: spreadsheetId.
- addSheet: Add a new sheet/tab. Requires: spreadsheetId, sheetTitle.
- create: Create a new spreadsheet. Requires: title. Optional: parentFolderId, initialData.
- list: List spreadsheets from Drive. Optional: query, maxResults, orderBy.`,
parameters: z.object({
  action: z.enum(['read', 'write', 'append', 'clear', 'info', 'addSheet', 'create', 'list'])
    .describe('The spreadsheet operation to perform.'),
  spreadsheetId: z.string().optional().describe('Spreadsheet ID (required for: read, write, append, clear, info, addSheet).'),
  range: z.string().optional().describe('[read/write/append/clear] A1 notation range (e.g., "A1:B10" or "Sheet1!A1:B10").'),
  values: z.array(z.array(z.any())).optional().describe('[write/append/create] 2D array of values. Each inner array is a row.'),
  valueRenderOption: z.enum(['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA']).optional().default('FORMATTED_VALUE').describe('[read] How values should be rendered.'),
  valueInputOption: z.enum(['RAW', 'USER_ENTERED']).optional().default('USER_ENTERED').describe('[write/append] How input should be interpreted.'),
  sheetTitle: z.string().optional().describe('[addSheet] Title for the new sheet/tab.'),
  title: z.string().optional().describe('[create] Title for the new spreadsheet.'),
  parentFolderId: z.string().optional().describe('[create] Parent folder ID.'),
  initialData: z.array(z.array(z.any())).optional().describe('[create] Initial data for first sheet.'),
  query: z.string().optional().describe('[list] Search query to filter spreadsheets.'),
  maxResults: z.number().int().min(1).max(100).optional().default(20).describe('[list] Maximum results.'),
  orderBy: z.enum(['name', 'modifiedTime', 'createdTime']).optional().default('modifiedTime').describe('[list] Sort order.'),
}),
execute: async (args, { log }) => {
  const requireSheetId = () => {
    if (!args.spreadsheetId) throw new UserError(`spreadsheetId is required for action "${args.action}".`);
    return args.spreadsheetId;
  };
  const requireRange = () => {
    if (!args.range) throw new UserError(`range is required for action "${args.action}".`);
    return args.range;
  };

  switch (args.action) {

    // ── read ──
    case 'read': {
      const sheetId = requireSheetId();
      const range = requireRange();
      const sheets = await getSheetsClient();
      try {
        const response = await SheetsHelpers.readRange(sheets, sheetId, range);
        const values = response.values || [];
        if (values.length === 0) return `Range ${range} is empty or does not exist.`;
        let result = `**Spreadsheet Range:** ${range}\n\n`;
        values.forEach((row, i) => { result += `Row ${i + 1}: ${JSON.stringify(row)}\n`; });
        return result;
      } catch (error: any) {
        if (error instanceof UserError) throw error;
        throw new UserError(`Failed to read spreadsheet: ${error.message || 'Unknown error'}`);
      }
    }

    // ── write ──
    case 'write': {
      const sheetId = requireSheetId();
      const range = requireRange();
      if (!args.values) throw new UserError('values is required for action "write".');
      const sheets = await getSheetsClient();
      try {
        const response = await SheetsHelpers.writeRange(sheets, sheetId, range, args.values, args.valueInputOption);
        return `Successfully wrote ${response.updatedCells || 0} cells (${response.updatedRows || 0} rows, ${response.updatedColumns || 0} columns) to range ${range}.`;
      } catch (error: any) {
        if (error instanceof UserError) throw error;
        throw new UserError(`Failed to write to spreadsheet: ${error.message || 'Unknown error'}`);
      }
    }

    // ── append ──
    case 'append': {
      const sheetId = requireSheetId();
      const range = requireRange();
      if (!args.values) throw new UserError('values is required for action "append".');
      const sheets = await getSheetsClient();
      try {
        const response = await SheetsHelpers.appendValues(sheets, sheetId, range, args.values, args.valueInputOption);
        return `Successfully appended ${response.updates?.updatedRows || 0} row(s) (${response.updates?.updatedCells || 0} cells). Updated range: ${response.updates?.updatedRange || range}`;
      } catch (error: any) {
        if (error instanceof UserError) throw error;
        throw new UserError(`Failed to append to spreadsheet: ${error.message || 'Unknown error'}`);
      }
    }

    // ── clear ──
    case 'clear': {
      const sheetId = requireSheetId();
      const range = requireRange();
      const sheets = await getSheetsClient();
      try {
        const response = await SheetsHelpers.clearRange(sheets, sheetId, range);
        return `Successfully cleared range ${response.clearedRange || range}.`;
      } catch (error: any) {
        if (error instanceof UserError) throw error;
        throw new UserError(`Failed to clear range: ${error.message || 'Unknown error'}`);
      }
    }

    // ── info ──
    case 'info': {
      const sheetId = requireSheetId();
      const sheets = await getSheetsClient();
      try {
        const metadata = await SheetsHelpers.getSpreadsheetMetadata(sheets, sheetId);
        let result = `**Spreadsheet Information:**\n\n**Title:** ${metadata.properties?.title || 'Untitled'}\n**ID:** ${metadata.spreadsheetId}\n**URL:** https://docs.google.com/spreadsheets/d/${metadata.spreadsheetId}\n\n`;
        const sheetList = metadata.sheets || [];
        result += `**Sheets (${sheetList.length}):**\n`;
        sheetList.forEach((sheet, i) => {
            const p = sheet.properties;
            result += `${i + 1}. **${p?.title || 'Untitled'}**\n   - Sheet ID: ${p?.sheetId}\n   - Grid: ${p?.gridProperties?.rowCount || 0} rows × ${p?.gridProperties?.columnCount || 0} columns\n`;
            if (p?.hidden) result += `   - Status: Hidden\n`;
            result += '\n';
        });
        return result;
      } catch (error: any) {
        if (error instanceof UserError) throw error;
        throw new UserError(`Failed to get spreadsheet info: ${error.message || 'Unknown error'}`);
      }
    }

    // ── addSheet ──
    case 'addSheet': {
      const sheetId = requireSheetId();
      if (!args.sheetTitle) throw new UserError('sheetTitle is required for action "addSheet".');
      const sheets = await getSheetsClient();
      try {
        const response = await SheetsHelpers.addSheet(sheets, sheetId, args.sheetTitle);
        const added = response.replies?.[0]?.addSheet?.properties;
        if (!added) throw new UserError('Failed to add sheet.');
        return `Successfully added sheet "${added.title}" (Sheet ID: ${added.sheetId}).`;
      } catch (error: any) {
        if (error instanceof UserError) throw error;
        throw new UserError(`Failed to add sheet: ${error.message || 'Unknown error'}`);
      }
    }

    // ── create ──
    case 'create': {
      if (!args.title) throw new UserError('title is required for action "create".');
      const drive = await getDriveClient();
      const sheets = await getSheetsClient();
      try {
        const meta: drive_v3.Schema$File = { name: args.title, mimeType: 'application/vnd.google-apps.spreadsheet' };
        if (args.parentFolderId) meta.parents = [args.parentFolderId];
        const driveRes = await drive.files.create({ requestBody: meta, fields: 'id,name,webViewLink' });
        const id = driveRes.data.id;
        if (!id) throw new UserError('Failed to create spreadsheet - no ID returned.');
        let result = `Successfully created spreadsheet "${driveRes.data.name}" (ID: ${id})\nView Link: ${driveRes.data.webViewLink}`;
        const data = args.initialData || args.values;
        if (data && data.length > 0) {
            try {
                await SheetsHelpers.writeRange(sheets, id, 'A1', data, 'USER_ENTERED');
                result += `\n\nInitial data added.`;
            } catch (_) { result += `\n\nSpreadsheet created but failed to add initial data.`; }
        }
        return result;
      } catch (error: any) { handleDriveError(error, 'create spreadsheet'); }
    }

    // ── list ──
    case 'list': {
      const drive = await getDriveClient();
      try {
        let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
        const hasFullTextSheet = !!args.query;
        if (args.query) q += ` and (name contains '${args.query}' or fullText contains '${args.query}')`;
        const sheetListParams: any = { q, pageSize: args.maxResults, fields: 'files(id,name,modifiedTime,createdTime,webViewLink,owners(displayName,emailAddress))' };
        if (!hasFullTextSheet) sheetListParams.orderBy = args.orderBy === 'name' ? 'name' : args.orderBy;
        const response = await drive.files.list(sheetListParams);
        const files = response.data.files || [];
        if (files.length === 0) return "No Google Spreadsheets found matching your criteria.";
        let result = `Found ${files.length} Google Spreadsheet(s):\n\n`;
        files.forEach((file, i) => {
            result += `${i + 1}. **${file.name}**\n   ID: ${file.id}\n   Modified: ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown'}\n   Owner: ${file.owners?.[0]?.displayName || 'Unknown'}\n   Link: ${file.webViewLink}\n\n`;
        });
        return result;
      } catch (error: any) { handleDriveError(error, 'list spreadsheets'); }
    }

    default:
      throw new UserError(`Unknown action: ${args.action}`);
  }
}
});


// ── Tool 7: googleCalendar ─────────────────────────────────
server.addTool({
name: 'googleCalendar',
description: `Manage Google Calendar events: list, create, update, search.

Actions:
- list: List events with time filtering. Optional: calendarId, maxResults, timeMin, timeMax, orderBy.
- get: Get event details. Requires: eventId. Optional: calendarId.
- create: Create a new event. Requires: summary, startDateTime, endDateTime. Optional: calendarId, description, location, attendees, timeZone.
- update: Update an event (only provided fields). Requires: eventId. Optional: calendarId, summary, description, startDateTime, endDateTime, location, attendees.
- search: Search events by text. Requires: query. Optional: calendarId, maxResults, timeMin, timeMax.
- delete: Delete an event. Requires: eventId. Optional: calendarId.`,
parameters: z.object({
  action: z.enum(['list', 'get', 'create', 'update', 'search', 'delete']).describe('The calendar operation.'),
  calendarId: z.string().optional().default('primary').describe('Calendar ID (default: "primary").'),
  eventId: z.string().optional().describe('Event ID (required for: get, update, delete).'),
  summary: z.string().optional().describe('[create/update] Event title.'),
  description: z.string().optional().describe('[create/update] Event description.'),
  startDateTime: z.string().optional().describe('[create/update] Start date/time (ISO8601 or date-only).'),
  endDateTime: z.string().optional().describe('[create/update] End date/time (ISO8601 or date-only).'),
  location: z.string().optional().describe('[create/update] Event location.'),
  attendees: z.array(z.string()).optional().describe('[create/update] List of attendee email addresses.'),
  timeZone: z.string().optional().describe('[create] Time zone (e.g., "America/Los_Angeles").'),
  query: z.string().optional().describe('[search] Search query text.'),
  maxResults: z.number().optional().default(10).describe('[list/search] Maximum events to return.'),
  timeMin: z.string().optional().describe('[list/search] Lower bound for event start time (ISO8601).'),
  timeMax: z.string().optional().describe('[list/search] Upper bound for event end time (ISO8601).'),
  orderBy: z.enum(['startTime', 'updated']).optional().default('startTime').describe('[list] Order of results.'),
}),
execute: async (args, { log }) => {
  const calendar = await getCalendarClient();
  const calendarId = CalendarHelpers.validateCalendarId(args.calendarId || 'primary');

  const formatEventList = (events: any[]) => {
    let result = '';
    events.forEach((event, i) => {
      const fe = CalendarHelpers.formatEventForResponse(event);
      result += `${i + 1}. **${fe.summary}**\n   ID: ${fe.id}\n   Start: ${fe.start}\n   End: ${fe.end}\n`;
      if (fe.location) result += `   Location: ${fe.location}\n`;
      if (fe.attendees?.length) result += `   Attendees: ${fe.attendees.map((a: any) => a.email).join(', ')}\n`;
      if (fe.description && args.action === 'search') result += `   Description: ${fe.description.substring(0, 100)}${fe.description.length > 100 ? '...' : ''}\n`;
      result += `   Link: ${fe.htmlLink}\n\n`;
    });
    return result;
  };

  switch (args.action) {

    // ── list ──
    case 'list': {
      try {
        const timeBounds = CalendarHelpers.formatTimeBounds(args.timeMin, args.timeMax);
        const response = await calendar.events.list({ calendarId, maxResults: Math.min(args.maxResults ?? 10, 250), singleEvents: true, orderBy: args.orderBy, ...timeBounds });
        const events = response.data.items || [];
        if (events.length === 0) return 'No events found for the specified time range.';
        return `Found ${events.length} event(s):\n\n` + formatEventList(events);
      } catch (error: any) {
        throw new UserError(`Failed to list events: ${error.message || 'Unknown error'}`);
      }
    }

    // ── get ──
    case 'get': {
      if (!args.eventId) throw new UserError('eventId is required for action "get".');
      try {
        const response = await calendar.events.get({ calendarId, eventId: args.eventId });
        const ev = CalendarHelpers.formatEventForResponse(response.data);
        let result = `**${ev.summary}**\nID: ${ev.id}\nStart: ${ev.start}\nEnd: ${ev.end}\nStatus: ${ev.status}\n`;
        if (ev.description) result += `Description: ${ev.description}\n`;
        if (ev.location) result += `Location: ${ev.location}\n`;
        if (ev.attendees?.length) result += `Attendees: ${ev.attendees.map((a: any) => a.email).join(', ')}\n`;
        if (ev.organizer) result += `Organizer: ${ev.organizer.email || ev.organizer.displayName || 'Unknown'}\n`;
        result += `Link: ${ev.htmlLink}\n`;
        return result;
      } catch (error: any) {
        if (error.code === 404) throw new UserError(`Event not found: ${args.eventId}`);
        throw new UserError(`Failed to get event: ${error.message || 'Unknown error'}`);
      }
    }

    // ── create ──
    case 'create': {
      if (!args.summary) throw new UserError('summary is required for action "create".');
      if (!args.startDateTime) throw new UserError('startDateTime is required for action "create".');
      if (!args.endDateTime) throw new UserError('endDateTime is required for action "create".');
      try {
        const eventResource = CalendarHelpers.buildEventResource({ summary: args.summary, description: args.description, startDateTime: args.startDateTime, endDateTime: args.endDateTime, location: args.location, attendees: args.attendees, timeZone: args.timeZone });
        const response = await calendar.events.insert({ calendarId, requestBody: eventResource });
        const created = CalendarHelpers.formatEventForResponse(response.data);
        let result = `Event created successfully!\n\n**${created.summary}**\nID: ${created.id}\nStart: ${created.start}\nEnd: ${created.end}\n`;
        if (created.location) result += `Location: ${created.location}\n`;
        if (created.attendees?.length) result += `Attendees: ${created.attendees.map((a: any) => a.email).join(', ')}\n`;
        result += `Link: ${created.htmlLink}\n`;
        return result;
      } catch (error: any) {
        throw new UserError(`Failed to create event: ${error.message || 'Unknown error'}`);
      }
    }

    // ── update ──
    case 'update': {
      if (!args.eventId) throw new UserError('eventId is required for action "update".');
      try {
        const existing = await calendar.events.get({ calendarId, eventId: args.eventId });
        const updates: any = {};
        if (args.summary !== undefined) updates.summary = args.summary;
        if (args.description !== undefined) updates.description = args.description;
        if (args.location !== undefined) updates.location = args.location;
        if (args.startDateTime !== undefined) updates.start = CalendarHelpers.parseDateTime(args.startDateTime);
        if (args.endDateTime !== undefined) updates.end = CalendarHelpers.parseDateTime(args.endDateTime);
        if (args.attendees !== undefined) updates.attendees = args.attendees.map(email => ({ email }));
        const merged = CalendarHelpers.mergeEventUpdates(existing.data, updates);
        const response = await calendar.events.update({ calendarId, eventId: args.eventId, requestBody: merged });
        const updated = CalendarHelpers.formatEventForResponse(response.data);
        let result = `Event updated successfully!\n\n**${updated.summary}**\nID: ${updated.id}\nStart: ${updated.start}\nEnd: ${updated.end}\n`;
        if (updated.location) result += `Location: ${updated.location}\n`;
        if (updated.attendees?.length) result += `Attendees: ${updated.attendees.map((a: any) => a.email).join(', ')}\n`;
        result += `Link: ${updated.htmlLink}\n`;
        return result;
      } catch (error: any) {
        if (error.code === 404) throw new UserError(`Event not found: ${args.eventId}`);
        throw new UserError(`Failed to update event: ${error.message || 'Unknown error'}`);
      }
    }

    // ── search ──
    case 'search': {
      if (!args.query) throw new UserError('query is required for action "search".');
      try {
        const timeBounds = CalendarHelpers.formatTimeBounds(args.timeMin, args.timeMax);
        const response = await calendar.events.list({ calendarId, q: args.query, maxResults: Math.min(args.maxResults ?? 10, 250), singleEvents: true, orderBy: 'startTime', ...timeBounds });
        const events = response.data.items || [];
        if (events.length === 0) return `No events found matching "${args.query}"`;
        return `Found ${events.length} event(s) matching "${args.query}":\n\n` + formatEventList(events);
      } catch (error: any) {
        throw new UserError(`Failed to search events: ${error.message || 'Unknown error'}`);
      }
    }

    // ── delete ──
    case 'delete': {
      if (!args.eventId) throw new UserError('eventId is required for action "delete".');
      try {
        await calendar.events.delete({ calendarId, eventId: args.eventId });
        return `Event ${args.eventId} deleted successfully.`;
      } catch (error: any) {
        if (error.code === 404) throw new UserError(`Event not found: ${args.eventId}`);
        throw new UserError(`Failed to delete event: ${error.message || 'Unknown error'}`);
      }
    }

    default:
      throw new UserError(`Unknown action: ${args.action}`);
  }
}
});


// ── Tool 8: googleGmail ────────────────────────────────────
server.addTool({
name: 'googleGmail',
description: `Manage Gmail: read, send, reply, organize messages.

Actions:
- list: List messages. Optional: query (Gmail search syntax), maxResults (default 20), labelIds, pageToken.
- get: Get full message content. Requires: messageId.
- send: Send an email. Requires: to, subject, body. Optional: cc, bcc.
- reply: Reply to a message (keeps thread). Requires: messageId, body. Optional: cc.
- trash: Move message to Trash. Requires: messageId.
- modify: Add/remove labels. Requires: messageId + at least one of addLabelIds/removeLabelIds.
  Common label IDs: UNREAD, INBOX, STARRED, SPAM, IMPORTANT.
- listLabels: List all Gmail labels (system and user-created).
- createDraft: Save a draft. Requires: to, subject, body. Optional: cc, bcc.`,
parameters: z.object({
  action: z.enum(['list', 'get', 'send', 'reply', 'trash', 'modify', 'listLabels', 'createDraft'])
    .describe('The Gmail operation to perform.'),
  messageId: z.string().optional().describe('Gmail message ID (required for: get, reply, trash, modify).'),
  to: z.string().optional().describe('[send/createDraft] Recipient email address(es).'),
  subject: z.string().optional().describe('[send/createDraft] Email subject.'),
  body: z.string().optional().describe('[send/reply/createDraft] Email body text.'),
  cc: z.string().optional().describe('[send/reply/createDraft] CC email address(es).'),
  bcc: z.string().optional().describe('[send/createDraft] BCC email address(es).'),
  query: z.string().optional().describe('[list] Gmail search query (e.g. "is:unread", "from:user@example.com").'),
  maxResults: z.number().optional().default(20).describe('[list] Maximum messages to return (default 20).'),
  labelIds: z.array(z.string()).optional().describe('[list] Filter by label IDs (e.g. ["INBOX", "UNREAD"]).'),
  pageToken: z.string().optional().describe('[list] Page token for pagination.'),
  addLabelIds: z.array(z.string()).optional().describe('[modify] Label IDs to add.'),
  removeLabelIds: z.array(z.string()).optional().describe('[modify] Label IDs to remove.'),
}),
execute: async (args, { log }) => {
  const gmail = await getGmailClient();

  switch (args.action) {

    // ── list ──
    case 'list': {
      try {
        const listParams: any = {
          userId: 'me',
          maxResults: Math.min(args.maxResults ?? 20, 500),
        };
        if (args.query) listParams.q = args.query;
        if (args.labelIds?.length) listParams.labelIds = args.labelIds;
        if (args.pageToken) listParams.pageToken = args.pageToken;

        const listRes = await gmail.users.messages.list(listParams);
        const messages = listRes.data.messages || [];
        if (messages.length === 0) return 'No messages found matching your criteria.';

        const details = await Promise.all(
          messages.map(m => gmail.users.messages.get({
            userId: 'me',
            id: m.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          }))
        );

        let result = `Found ${messages.length} message(s):\n\n`;
        details.forEach((res, i) => {
          const msg = res.data;
          const headers = GmailHelpers.extractHeaders(msg.payload?.headers, ['From', 'Subject', 'Date']);
          result += `${i + 1}. **${headers['Subject'] || '(No subject)'}**\n`;
          result += `   ID: ${msg.id}\n`;
          result += `   From: ${headers['From'] || 'Unknown'}\n`;
          result += `   Date: ${headers['Date'] || 'Unknown'}\n`;
          if (msg.snippet) result += `   Preview: ${msg.snippet.substring(0, 100)}${msg.snippet.length > 100 ? '...' : ''}\n`;
          result += '\n';
        });

        if (listRes.data.nextPageToken) {
          result += `\nNext page token: ${listRes.data.nextPageToken}`;
        }
        return result;
      } catch (error: any) {
        GmailHelpers.handleGmailError(error, 'list messages');
      }
    }

    // ── get ──
    case 'get': {
      if (!args.messageId) throw new UserError('messageId is required for action "get".');
      try {
        const res = await gmail.users.messages.get({ userId: 'me', id: args.messageId, format: 'full' });
        const formatted = GmailHelpers.formatMessageForResponse(res.data) as any;
        let result = `**${formatted.subject}**\n`;
        result += `ID: ${formatted.id}\n`;
        result += `Thread ID: ${formatted.threadId}\n`;
        result += `From: ${formatted.from}\n`;
        result += `To: ${formatted.to}\n`;
        if (formatted.cc) result += `CC: ${formatted.cc}\n`;
        result += `Date: ${formatted.date}\n`;
        if (formatted.labelIds?.length) result += `Labels: ${formatted.labelIds.join(', ')}\n`;
        result += `\n${formatted.body || formatted.snippet || '(No body)'}`;
        return result;
      } catch (error: any) {
        GmailHelpers.handleGmailError(error, 'get message');
      }
    }

    // ── send ──
    case 'send': {
      if (!args.to) throw new UserError('to is required for action "send".');
      if (!args.subject) throw new UserError('subject is required for action "send".');
      if (!args.body) throw new UserError('body is required for action "send".');
      try {
        const raw = GmailHelpers.buildRfc2822Message({
          to: args.to,
          subject: args.subject,
          body: args.body,
          cc: args.cc,
          bcc: args.bcc,
        });
        const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
        return `Email sent successfully!\nMessage ID: ${res.data.id}\nThread ID: ${res.data.threadId}`;
      } catch (error: any) {
        GmailHelpers.handleGmailError(error, 'send message');
      }
    }

    // ── reply ──
    case 'reply': {
      if (!args.messageId) throw new UserError('messageId is required for action "reply".');
      if (!args.body) throw new UserError('body is required for action "reply".');
      try {
        const original = await gmail.users.messages.get({ userId: 'me', id: args.messageId, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Message-ID', 'References'] });
        const raw = GmailHelpers.buildReplyRfc2822Message({
          originalMessage: original.data,
          body: args.body,
          cc: args.cc,
        });
        const res = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw, threadId: original.data.threadId! },
        });
        return `Reply sent successfully!\nMessage ID: ${res.data.id}\nThread ID: ${res.data.threadId}`;
      } catch (error: any) {
        GmailHelpers.handleGmailError(error, 'reply to message');
      }
    }

    // ── trash ──
    case 'trash': {
      if (!args.messageId) throw new UserError('messageId is required for action "trash".');
      try {
        await gmail.users.messages.trash({ userId: 'me', id: args.messageId });
        return `Message ${args.messageId} moved to Trash.`;
      } catch (error: any) {
        GmailHelpers.handleGmailError(error, 'trash message');
      }
    }

    // ── modify ──
    case 'modify': {
      if (!args.messageId) throw new UserError('messageId is required for action "modify".');
      if (!args.addLabelIds?.length && !args.removeLabelIds?.length) {
        throw new UserError('At least one of addLabelIds or removeLabelIds is required for action "modify".');
      }
      try {
        const res = await gmail.users.messages.modify({
          userId: 'me',
          id: args.messageId,
          requestBody: {
            addLabelIds: args.addLabelIds || [],
            removeLabelIds: args.removeLabelIds || [],
          },
        });
        const labels = res.data.labelIds || [];
        return `Message ${args.messageId} updated.\nCurrent labels: ${labels.join(', ') || '(none)'}`;
      } catch (error: any) {
        GmailHelpers.handleGmailError(error, 'modify message');
      }
    }

    // ── listLabels ──
    case 'listLabels': {
      try {
        const res = await gmail.users.labels.list({ userId: 'me' });
        const labels = res.data.labels || [];
        const system = labels.filter(l => l.type === 'system');
        const user = labels.filter(l => l.type === 'user');

        let result = `**Gmail Labels (${labels.length} total):**\n\n`;
        result += `**System Labels (${system.length}):**\n`;
        system.forEach(l => {
          const fmt = GmailHelpers.formatLabelForResponse(l) as any;
          result += `- ${fmt.name} (ID: ${fmt.id})`;
          if (fmt.messagesUnread) result += ` — ${fmt.messagesUnread} unread`;
          result += '\n';
        });
        if (user.length > 0) {
          result += `\n**User Labels (${user.length}):**\n`;
          user.forEach(l => {
            const fmt = GmailHelpers.formatLabelForResponse(l) as any;
            result += `- ${fmt.name} (ID: ${fmt.id})`;
            if (fmt.messagesTotal) result += ` — ${fmt.messagesTotal} messages`;
            result += '\n';
          });
        }
        return result;
      } catch (error: any) {
        GmailHelpers.handleGmailError(error, 'list labels');
      }
    }

    // ── createDraft ──
    case 'createDraft': {
      if (!args.to) throw new UserError('to is required for action "createDraft".');
      if (!args.subject) throw new UserError('subject is required for action "createDraft".');
      if (!args.body) throw new UserError('body is required for action "createDraft".');
      try {
        const raw = GmailHelpers.buildRfc2822Message({
          to: args.to,
          subject: args.subject,
          body: args.body,
          cc: args.cc,
          bcc: args.bcc,
        });
        const res = await gmail.users.drafts.create({
          userId: 'me',
          requestBody: { message: { raw } },
        });
        return `Draft created successfully!\nDraft ID: ${res.data.id}\nMessage ID: ${res.data.message?.id}`;
      } catch (error: any) {
        GmailHelpers.handleGmailError(error, 'create draft');
      }
    }

    default:
      throw new UserError(`Unknown action: ${(args as any).action}`);
  }
}
});


// --- Server Startup ---
async function startServer() {
try {
await initializeGoogleClient();
console.error("Starting Google Workspace MCP server...");
      const configToUse = { transportType: "stdio" as const };
      server.start(configToUse);
      console.error(`MCP Server running using ${configToUse.transportType}. Awaiting client connection...`);
      console.error('Process-level error handling configured to prevent crashes from timeout errors.');
} catch(startError: any) {
console.error("FATAL: Server failed to start:", startError.message || startError);
process.exit(1);
}
}

startServer();
