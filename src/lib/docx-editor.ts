"use client";

// Minimal, formatting-preserving .docx text editor.
//
// A .docx file is a zip of XML parts. The actual document body lives in
// word/document.xml as a tree of paragraphs (w:p) containing runs (w:r),
// each run carrying its own formatting (w:rPr: bold/italic/underline/
// font/size/color) and its text (w:t).
//
// Instead of re-building the document from scratch (which risks losing
// formatting), we parse word/document.xml into a live DOM, let the user
// edit the *text* of each run in the browser, and on save we write the
// edited text straight back into the original <w:t> nodes of that same
// DOM — every other node (styles, fonts, sizes, everything) is untouched.

import JSZip from "jszip";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const DOCUMENT_PATH = "word/document.xml";

export interface DocxRun {
  id: string;
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontFamily?: string;
  fontSizePt?: number;
  color?: string;
}

export type DocxSegment =
  | { type: "run"; run: DocxRun }
  | { type: "tab" }
  | { type: "break" };

export interface DocxParagraph {
  id: string;
  align?: "left" | "center" | "right" | "justify";
  segments: DocxSegment[];
}

export interface DocxDocument {
  zip: JSZip;
  xmlDoc: Document;
  paragraphs: DocxParagraph[];
  // Map from run id -> the live <w:t> node(s) whose text should be replaced on save.
  runTextNodes: Map<string, Element[]>;
}

function boolAttr(el: Element | null): boolean {
  if (!el) return false;
  const val = el.getAttribute("w:val");
  if (val === null) return true;
  return !(val === "false" || val === "0" || val === "off");
}

function alignFromJc(val: string | null): DocxParagraph["align"] | undefined {
  switch (val) {
    case "center":
      return "center";
    case "right":
    case "end":
      return "right";
    case "both":
    case "justify":
      return "justify";
    case "left":
    case "start":
      return "left";
    default:
      return undefined;
  }
}

export async function loadDocx(arrayBuffer: ArrayBuffer): Promise<DocxDocument> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docFile = zip.file(DOCUMENT_PATH);
  if (!docFile) throw new Error("This file doesn't look like a valid .docx document.");
  const xmlText = await docFile.async("text");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
  if (parserError) throw new Error("Couldn't read this document's contents.");

  const paragraphs: DocxParagraph[] = [];
  const runTextNodes = new Map<string, Element[]>();

  const body = xmlDoc.getElementsByTagNameNS(W_NS, "body")[0];
  const pNodes = body ? Array.from(body.getElementsByTagNameNS(W_NS, "p")) : [];

  pNodes.forEach((pEl, pi) => {
    // Only take paragraphs that are direct-ish content (skip ones nested inside tables'
    // nested content twice etc. — for our simple templates this is a non-issue).
    const pPr = pEl.getElementsByTagNameNS(W_NS, "pPr")[0];
    const jc = pPr?.getElementsByTagNameNS(W_NS, "jc")[0];
    const align = alignFromJc(jc?.getAttribute("w:val") ?? null);

    const segments: DocxSegment[] = [];
    const runNodes = Array.from(pEl.getElementsByTagNameNS(W_NS, "r"));

    runNodes.forEach((rEl, ri) => {
      const rPr = rEl.getElementsByTagNameNS(W_NS, "rPr")[0] ?? null;
      const bold = boolAttr(rPr?.getElementsByTagNameNS(W_NS, "b")[0] ?? null);
      const italic = boolAttr(rPr?.getElementsByTagNameNS(W_NS, "i")[0] ?? null);
      const uEl = rPr?.getElementsByTagNameNS(W_NS, "u")[0] ?? null;
      const underline = !!uEl && uEl.getAttribute("w:val") !== "none";
      const rFonts = rPr?.getElementsByTagNameNS(W_NS, "rFonts")[0] ?? null;
      const fontFamily =
        rFonts?.getAttribute("w:ascii") ?? rFonts?.getAttribute("w:hAnsi") ?? undefined;
      const szEl = rPr?.getElementsByTagNameNS(W_NS, "sz")[0] ?? null;
      const szVal = szEl?.getAttribute("w:val");
      const fontSizePt = szVal ? Number(szVal) / 2 : undefined;
      const colorEl = rPr?.getElementsByTagNameNS(W_NS, "color")[0] ?? null;
      const colorVal = colorEl?.getAttribute("w:val");
      const color = colorVal && colorVal !== "auto" ? `#${colorVal}` : undefined;

      const tNodes = Array.from(rEl.getElementsByTagNameNS(W_NS, "t"));
      const hasTab = rEl.getElementsByTagNameNS(W_NS, "tab").length > 0;
      const hasBreak = rEl.getElementsByTagNameNS(W_NS, "br").length > 0;

      if (tNodes.length > 0) {
        const id = `p${pi}-r${ri}`;
        const text = tNodes.map((t) => t.textContent ?? "").join("");
        runTextNodes.set(id, tNodes);
        segments.push({
          type: "run",
          run: { id, text, bold, italic, underline, fontFamily, fontSizePt, color },
        });
      }
      if (hasTab) segments.push({ type: "tab" });
      if (hasBreak) segments.push({ type: "break" });
    });

    paragraphs.push({ id: `p${pi}`, align, segments });
  });

  return { zip, xmlDoc, paragraphs, runTextNodes };
}

export function updateRunText(doc: DocxDocument, runId: string, newText: string) {
  const nodes = doc.runTextNodes.get(runId);
  if (!nodes || nodes.length === 0) return;
  // Preserve leading/trailing whitespace exactly as typed.
  nodes[0].setAttribute("xml:space", "preserve");
  nodes[0].textContent = newText;
  // Collapse any extra <w:t> nodes that used to make up this run's text.
  for (let i = 1; i < nodes.length; i++) {
    nodes[i].textContent = "";
  }
}

export async function saveDocx(doc: DocxDocument): Promise<Blob> {
  const serializer = new XMLSerializer();
  const xmlString = serializer.serializeToString(doc.xmlDoc);
  doc.zip.file(DOCUMENT_PATH, xmlString);
  return doc.zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
