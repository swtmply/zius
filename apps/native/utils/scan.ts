import type { OcrBlock } from "expo-ocr-kit";
import { z } from "zod";

export type ReceiptLine = {
  blocks: OcrBlock[];
  y: number;
};

export type ReceiptItem = {
  name: string;
  quantity: number;
  priceMinor: number;
};

export type ParsedReceipt = {
  items: ReceiptItem[];
  totalMinor?: number;
};

const parsedReceiptSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      priceMinor: z.number(),
    }),
  ),
  totalMinor: z.number().optional(),
});

export function parseReceiptParam(value: string | string[] | undefined): ParsedReceipt | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  try {
    const result = parsedReceiptSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

function centerY(block: OcrBlock) {
  const { y, height } = block.boundingBox;

  return y + height / 2;
}

export function groupReceiptLines(blocks: OcrBlock[]): ReceiptLine[] {
  const sorted = [...blocks].sort((a, b) => centerY(a) - centerY(b));

  const lines: ReceiptLine[] = [];

  for (const block of sorted) {
    const blockCenterY = centerY(block);

    let closestLine: ReceiptLine | undefined;
    let closestDistance = Infinity;

    for (const line of lines) {
      const averageHeight =
        line.blocks.reduce((sum, current) => sum + current.boundingBox.height, 0) /
        line.blocks.length;

      const tolerance = Math.max(averageHeight, block.boundingBox.height) * 0.6;

      const distance = Math.abs(blockCenterY - line.y);

      if (distance <= tolerance && distance < closestDistance) {
        closestLine = line;
        closestDistance = distance;
      }
    }

    if (closestLine) {
      closestLine.blocks.push(block);

      closestLine.y =
        closestLine.blocks.reduce((sum, current) => sum + centerY(current), 0) /
        closestLine.blocks.length;
    } else {
      lines.push({
        blocks: [block],
        y: blockCenterY,
      });
    }
  }

  return lines
    .map((line) => ({
      ...line,

      // Left → right
      blocks: [...line.blocks].sort((a, b) => a.boundingBox.x - b.boundingBox.x),
    }))
    .sort((a, b) => a.y - b.y);
}

const MONEY_REGEX = /(?:₱|PHP|P)?\s*[\d,]+[.,]\d{2}$/i;

function isMoney(text: string) {
  return MONEY_REGEX.test(text.trim());
}

function parseMoney(text: string) {
  const normalized = text
    .replace(/PHP|₱/gi, "")
    .replace(/^P(?=\s*\d)/i, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/[Oo]/g, "0");

  const value = Number.parseFloat(normalized);

  if (Number.isNaN(value)) {
    return undefined;
  }

  return Math.round(value * 100);
}

export function parseReceiptLines(lines: ReceiptLine[]): ParsedReceipt {
  const items: ReceiptItem[] = [];

  let totalMinor: number | undefined;

  for (const line of lines) {
    const moneyBlocks = line.blocks.filter((block) => isMoney(block.text));

    if (!moneyBlocks.length) {
      continue;
    }

    // The rightmost monetary block is most likely
    // the line total / price.
    const priceBlock = moneyBlocks.reduce((rightmost, current) =>
      current.boundingBox.x > rightmost.boundingBox.x ? current : rightmost,
    );

    const priceMinor = parseMoney(priceBlock.text);

    if (priceMinor === undefined) {
      continue;
    }

    const priceStartX = priceBlock.boundingBox.x;

    // Everything visually to the left of the
    // price is treated as the description.
    const descriptionBlocks = line.blocks.filter((block) => {
      if (block === priceBlock) {
        return false;
      }

      const blockCenterX = block.boundingBox.x + block.boundingBox.width / 2;

      return blockCenterX < priceStartX;
    });

    const description = descriptionBlocks
      .map((block) => block.text.trim())
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!description) {
      continue;
    }

    // TOTAL
    if (
      /\b(grand\s*total|amount\s*due|total)\b/i.test(description) &&
      !/\b(sub\s*total|subtotal)\b/i.test(description)
    ) {
      totalMinor = priceMinor;
      continue;
    }

    // Ignore summary rows.
    if (/\b(subtotal|sub\s*total|vat|tax|discount|cash|change|tendered)\b/i.test(description)) {
      continue;
    }

    let quantity = 1;
    let name = description;

    // Supports:
    //
    // 2 Burger
    // 2x Burger
    // 2 X Burger
    const quantityMatch = description.match(/^(\d+)\s*[xX]?\s+(.+)$/);

    if (quantityMatch) {
      quantity = Number.parseInt(quantityMatch[1], 10) || 1;

      name = quantityMatch[2].trim();
    }

    items.push({
      name,
      quantity,
      priceMinor,
    });
  }

  return {
    items,
    totalMinor,
  };
}
