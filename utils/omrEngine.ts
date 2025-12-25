import { Question, QuestionType, LETTERS } from '../types';

// Constants for processing
const THRESHOLD_VALUE = 120; 
const FILL_THRESHOLD = 0.35; 

export const processImagePipeline = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number
): Uint8ClampedArray => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = avg < THRESHOLD_VALUE ? 0 : 255;
    data[i] = val;    
    data[i + 1] = val;
    data[i + 2] = val;
  }
  
  return data;
};

const getRegionDensity = (
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number
): number => {
  let blackPixels = 0;
  const totalPixels = w * h;
  
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      const index = (row * width + col) * 4;
      if (data[index] === 0) {
        blackPixels++;
      }
    }
  }
  
  return blackPixels / totalPixels;
};

export interface DetectedAnswer {
  questionNum: number;
  detected: string | null; 
  confidence: number;
}

export const gradeExam = (
  canvas: HTMLCanvasElement,
  questions: Question[],
  layoutConfig?: { columnCount: number, bubbleSize?: 'sm' | 'md' | 'lg' }
): DetectedAnswer[] => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  const width = canvas.width;
  const height = canvas.height;

  // 1. Preprocess
  const pixelData = processImagePipeline(ctx, width, height);

  const results: DetectedAnswer[] = [];

  // 2. Define Layout Geometry dynamically
  const columnCount = layoutConfig?.columnCount || 2;
  const bubbleSize = layoutConfig?.bubbleSize || 'md';
  
  const START_Y = height * 0.34; // Start processing questions from 34% height
  
  // Dynamic Row Height matching SheetRenderer percentages
  // sm: 2.8%, md: 3.3%, lg: 4.0%
  const rowHeightMap: Record<string, number> = {
      sm: 0.028,
      md: 0.033,
      lg: 0.040
  };
  const ROW_H = height * (rowHeightMap[bubbleSize] || 0.033);
  
  // Calculate margins and column widths
  // Assuming 10% margins left and right
  const MARGIN_LEFT_PCT = 0.10;
  const MARGIN_RIGHT_PCT = 0.10;
  const USABLE_WIDTH = width * (1 - MARGIN_LEFT_PCT - MARGIN_RIGHT_PCT);
  const COL_WIDTH = USABLE_WIDTH / columnCount;

  // Distance between Question Number and first Bubble
  const QUESTION_NUM_OFFSET = width * 0.04;
  const BUBBLE_SPACING = width * 0.055; 

  // Distribute questions per column
  const totalQuestions = questions.length;
  const perColumn = Math.ceil(totalQuestions / columnCount);

  questions.forEach((q, index) => {
    // Determine column index (0, 1, 2...)
    const colIndex = Math.floor(index / perColumn);
    // Row index within that column
    const rowIndex = index % perColumn;

    // Calculate X start for this column
    // Start X = Left Margin + (Column Index * Column Width) + Internal Padding
    const colStartX = (width * MARGIN_LEFT_PCT) + (colIndex * COL_WIDTH) + QUESTION_NUM_OFFSET;

    const y = START_Y + (rowIndex * ROW_H);
    
    let bestOption = null;
    let maxDensity = 0;
    let optionsToCheck: { label: string, xOffset: number }[] = [];

    // NOTE: SheetRenderer now uses dir="ltr" for bubbles.
    // So 'A' is Leftmost. Logic: x + 0, B: x + spacing, etc.
    
    if (q.type === QuestionType.MCQ || q.type === QuestionType.MATCHING) {
      const count = q.optionsCount || 4;
      optionsToCheck = LETTERS.slice(0, count).map((l, i) => ({
        label: l,
        xOffset: colStartX + (i * BUBBLE_SPACING)
      }));
    } else if (q.type === QuestionType.TRUE_FALSE) {
      // T/F standard
      optionsToCheck = [
        { label: 'F', xOffset: colStartX },
        { label: 'T', xOffset: colStartX + BUBBLE_SPACING }
      ];
    }

    // Check each bubble
    optionsToCheck.forEach(opt => {
      const roiX = Math.floor(opt.xOffset);
      const roiY = Math.floor(y);
      const roiW = Math.floor(width * 0.035); // Bubble width approx
      const roiH = Math.floor(ROW_H * 0.75); // Scan area is 75% of row height

      if (roiX + roiW < width && roiY + roiH < height) {
        const density = getRegionDensity(pixelData, width, roiX, roiY, roiW, roiH);

        if (density > FILL_THRESHOLD && density > maxDensity) {
          maxDensity = density;
          bestOption = opt.label;
        }
      }
    });

    results.push({
      questionNum: q.number,
      detected: bestOption,
      confidence: maxDensity
    });
  });

  return results;
};