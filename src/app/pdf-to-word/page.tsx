"use client";

import { useState, useEffect } from "react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";

export default function PdfToWordPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileInfo, setFileInfo] = useState<{size: string, pages?: number, text?: string, pageData?: any[]} | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);

  // Load PDF.js dynamically on client side
  useEffect(() => {
    const loadPdfjs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        // Configure PDF.js worker
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';
        setPdfjsLib(pdfjs);
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
      }
    };

    loadPdfjs();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && pdfjsLib) {
      processPdfFile(file);
    } else if (file && !pdfjsLib) {
      alert('PDF processing library is still loading. Please wait a moment and try again.');
    }
  };

  const processPdfFile = async (file: File) => {
    if (!pdfjsLib) {
      alert('PDF processing library is still loading. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);
    
    try {
      // Read PDF file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const pageData: any[] = [];
      
      // Extract text from all pages with formatting information
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Store detailed text items with formatting info
        const textItems = textContent.items
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => ({
            text: item.str,
            fontName: item.fontName || 'Arial',
            fontSize: item.height || 12,
            transform: item.transform,
            x: item.transform ? item.transform[4] : 0,
            y: item.transform ? item.transform[5] : 0,
            width: item.width || 0,
            height: item.height || 12
          }));
        
        pageData.push({
          pageNum,
          items: textItems
        });
        
        const pageText = textItems.map((item: any) => item.text).join(' ');
        fullText += pageText + '\n';
      }
      
      // Basic file info
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setFileInfo({
        size: `${sizeInMB} MB`,
        pages: pdf.numPages,
        text: fullText,
        pageData: pageData
      });
      
      console.log('PDF processed:', file.name, 'Pages:', pdf.numPages);
    } catch (error) {
      console.error('Error processing PDF:', error);
      let errorMessage = 'Error processing PDF file';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          errorMessage = 'Invalid PDF file format';
        } else if (error.message.includes('Password')) {
          errorMessage = 'PDF is password protected';
        } else if (error.message.includes('corrupted')) {
          errorMessage = 'PDF file appears to be corrupted';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      if (pdfjsLib) {
        processPdfFile(file);
      } else {
        alert('PDF processing library is still loading. Please wait a moment and try again.');
      }
    } else {
      alert('Please drop a PDF file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const convertToWord = async () => {
    if (!fileInfo?.text) return;
    
    setIsConverting(true);
    try {
      const docElements: any[] = [];
      
      if (fileInfo.pageData) {
        // Use enhanced formatting data if available
        for (const page of fileInfo.pageData) {
          // Add page break (except for first page)
          if (page.pageNum > 1) {
            docElements.push(new Paragraph({
              children: [new TextRun({ text: "", break: 1 })],
            }));
          }
          
          // Group text items by lines (similar Y positions)
          const lines = groupTextItemsByLines(page.items);
          
          for (const line of lines) {
            if (line.length === 0) continue;
            
            // Detect if this might be a heading (larger font or specific patterns)
            const avgFontSize = line.reduce((sum: number, item: any) => sum + item.fontSize, 0) / line.length;
            const isHeading = avgFontSize > 14 || line.some((item: any) => 
              item.text.match(/^(Chapter|Section|Part|Title|Header)/i)
            );
            
            // Detect if this might be a table row
            const isTableRow = line.length > 2 && line.some((item: any, index: number) => 
              index > 0 && Math.abs(item.x - line[index - 1].x) > 50
            );
            
            if (isTableRow) {
              // Create table row
              const tableRow = new TableRow({
                children: line.map((item: any) => new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: item.text,
                      size: Math.round(item.fontSize * 2),
                      font: item.fontName
                    })]
                  })],
                  width: { size: 20, type: WidthType.PERCENTAGE }
                }))
              });
              
              docElements.push(new Table({
                rows: [tableRow],
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 }
                }
              }));
            } else {
              // Create regular paragraph
              const textRuns = line.map((item: any) => new TextRun({
                text: item.text + ' ',
                size: Math.round(item.fontSize * 2),
                font: item.fontName,
                bold: isHeading,
                color: item.fontName.includes('Bold') ? '000000' : '000000'
              }));
              
              docElements.push(new Paragraph({
                children: textRuns,
                spacing: { after: isHeading ? 400 : 200 },
                heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
                alignment: AlignmentType.LEFT
              }));
            }
          }
        }
      } else {
        // Fallback to simple text parsing
        const paragraphs = fileInfo.text
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => new Paragraph({
            children: [new TextRun(line.trim())],
            spacing: { after: 200 }
          }));
        
        docElements.push(...paragraphs);
      }

      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: docElements,
        }],
      });

      // Generate and download
      const buffer = await Packer.toBuffer(doc);
      const uint8Array = new Uint8Array(buffer);
      const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${uploadedFile?.name.replace('.pdf', '') || 'converted'}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error converting to Word:', error);
      alert('Error converting to Word format');
    } finally {
      setIsConverting(false);
    }
  };

  // Helper function to group text items by lines
  const groupTextItemsByLines = (items: any[]) => {
    if (items.length === 0) return [];
    
    // Sort items by Y position (top to bottom)
    const sortedItems = items.sort((a, b) => b.y - a.y);
    const lines: any[][] = [];
    
    let currentLine: any[] = [];
    let lastY = sortedItems[0].y;
    const lineThreshold = 5; // Pixels tolerance for grouping into same line
    
    for (const item of sortedItems) {
      if (Math.abs(item.y - lastY) <= lineThreshold) {
        currentLine.push(item);
      } else {
        if (currentLine.length > 0) {
          // Sort items in line by X position (left to right)
          currentLine.sort((a, b) => a.x - b.x);
          lines.push(currentLine);
        }
        currentLine = [item];
        lastY = item.y;
      }
    }
    
    if (currentLine.length > 0) {
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine);
    }
    
    return lines;
  };


  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12" aria-labelledby="pdf-word-heading">
      <div className="text-center mb-8">
        <h1 id="pdf-word-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">PDF → Word Converter</h1>
        <p className="mt-3 text-neutral-700">Convert your PDFs to editable Word documents while preserving formatting.</p>
      </div>

      {/* Demo Block */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <div className="aspect-video bg-neutral-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
          <img 
            src="/demo-pdf-word.svg" 
            alt="PDF to Word conversion example" 
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-sm text-neutral-600 text-center">Sample PDF converted to Word layout.</p>
      </div>

      {/* Features */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <h2 className="text-lg font-semibold mb-4">What you get:</h2>
        <ul className="space-y-2 text-neutral-700">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Keeps tables where possible
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Fast, browser-first
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Batch coming soon
          </li>
        </ul>
      </div>

      {/* Upload Area */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        {!pdfjsLib ? (
          <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full"></div>
            </div>
            <p className="text-neutral-600 mb-4">Loading PDF processing library...</p>
          </div>
        ) : (
          <div 
            className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('pdf-upload')?.click()}
          >
          <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">📄</span>
          </div>
          <p className="text-neutral-600 mb-4">Drop your PDF file here or click to browse</p>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button 
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('pdf-upload')?.click();
            }}
          >
            Choose PDF File
          </button>
        </div>
        )}
      </div>

      {/* Processing Results */}
      {isProcessing && (
        <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Analyzing your PDF file...</p>
          </div>
        </div>
      )}

      {uploadedFile && fileInfo && (
        <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-4">PDF Analysis Complete</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">File Name:</span>
              <span className="font-medium">{uploadedFile.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">File Size:</span>
              <span className="font-medium">{fileInfo.size}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Pages:</span>
              <span className="font-medium">{fileInfo.pages}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Status:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Ready for conversion</span>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              onClick={convertToWord}
              disabled={isConverting}
            >
              {isConverting ? 'Converting...' : 'Convert to Word'}
            </button>
            <button 
              className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              onClick={() => {
                setUploadedFile(null);
                setFileInfo(null);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Email Capture */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Stay updated</h3>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
            aria-label="Email address"
          />
          <button className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500">
            Notify me when pro features go live
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <h2 className="text-lg font-semibold mb-4">FAQ</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-neutral-900">What output formats are supported?</h3>
            <p className="text-sm text-neutral-600 mt-1">Word (DOCX) format with preserved formatting. More formats coming soon.</p>
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">How accurate is the conversion?</h3>
            <p className="text-sm text-neutral-600 mt-1">We preserve text, tables, and basic formatting. Complex layouts may need manual adjustment.</p>
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">Is there a file size limit?</h3>
            <p className="text-sm text-neutral-600 mt-1">Currently 10MB per file.</p>
          </div>
        </div>
      </div>
    </section>
  );
}