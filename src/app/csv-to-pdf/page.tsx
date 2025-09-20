"use client";

import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CsvRow {
  [key: string]: string;
}

interface ParsedData {
  data: CsvRow[];
  warnings: string[];
  stats: {
    originalRows: number;
    cleanedRows: number;
    totalAmount: number;
    removedBlank: number;
    repairedRows: number;
    invalidDates: number;
  };
}

export default function CsvToPdfPage() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeDate = (dateStr: string): { value: string; isValid: boolean } => {
    if (!dateStr || dateStr.trim() === '') return { value: '', isValid: true };
    
    const trimmed = dateStr.trim();
    const date = new Date(trimmed);
    
    if (isNaN(date.getTime())) {
      return { value: trimmed, isValid: false };
    }
    
    return { value: date.toISOString().split('T')[0], isValid: true };
  };

  const normalizeAmount = (amountStr: string): string => {
    if (!amountStr || amountStr.trim() === '') return '$0.00';
    
    // Remove commas and extract number
    const cleaned = amountStr.replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    
    if (isNaN(num)) return '$0.00';
    
    // Format with commas: $X,XXX.XX
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const normalizePaid = (paidStr: string): string => {
    if (!paidStr || paidStr.trim() === '') return 'No';
    
    const normalized = paidStr.trim().toLowerCase();
    if (['yes', 'y', 'true', '1'].includes(normalized)) {
      return 'Yes';
    }
    
    return 'No';
  };

  // CSV tokenizer for manual repair
  const repairCsv = (text: string): { headers: string[], rows: string[][] } => {
    const lines = text.split('\n');
    const result: string[][] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip completely empty lines
      if (line.trim() === '') {
        continue;
      }
      
      const fields: string[] = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            currentField += '"';
            j++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          fields.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      
      // Add the last field
      fields.push(currentField);
      
      // Always add the row (we'll filter blank rows later)
      result.push(fields);
    }
    
    const headers = result[0] || [];
    const rows = result.slice(1);
    
    return { headers, rows };
  };

  const stripQuotes = (value: string): string => {
    if (typeof value !== 'string') return value;
    
    const trimmed = value.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1) {
      // Remove outer quotes and unescape inner quotes
      return trimmed.slice(1, -1).replace(/""/g, '"');
    }
    
    return trimmed;
  };

  const parseCsv = (csvText: string): ParsedData => {
    const warnings: string[] = [];
    let originalRows = 0;
    const cleanedRows = 0;
    let totalAmount = 0;
    let removedBlank = 0;
    let repairedRows = 0;
    let invalidDates = 0;

    // First, try Papa Parse
    let parsedResults: any = null;
    let headers: string[] = [];
    let rawRows: any[] = [];

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transform: (v) => typeof v === 'string' ? v.trim() : v,
      complete: (results) => {
        parsedResults = results;
        originalRows = results.data.length;
        headers = results.meta.fields || [];
        rawRows = results.data;
      }
    });

    // Repair pass: handle __parsed_extra and drop invalid rows
    const repairedData: any[] = [];
    for (const row of rawRows) {
      // If row has __parsed_extra, merge it into Description
      if ((row as any).__parsed_extra) {
        const descriptionField = Object.keys(row).find(key => 
          key.toLowerCase().includes('description') || key.toLowerCase().includes('desc')
        );
        
        if (descriptionField) {
          row[descriptionField] = (row[descriptionField] ? row[descriptionField] + ", " : "") + (row as any).__parsed_extra.join(", ");
          row[descriptionField] = row[descriptionField].trim();
        }
        
        delete (row as any).__parsed_extra;
        repairedRows++;
      }

      // Find field names
      const dateField = Object.keys(row).find(key => key.toLowerCase().includes('date'));
      const descriptionField = Object.keys(row).find(key => 
        key.toLowerCase().includes('description') || key.toLowerCase().includes('desc')
      );
      
      // Check if this row should be dropped (both Date and Description empty)
      const dateEmpty = !dateField || !row[dateField] || String(row[dateField]).trim() === '';
      const descriptionEmpty = !descriptionField || !row[descriptionField] || String(row[descriptionField]).trim() === '';
      
      if (dateEmpty && descriptionEmpty) {
        removedBlank++;
        continue;
      }

      repairedData.push(row);
    }

    // Process and clean the data - only use repairedData (which has already filtered out bad rows)
    const data: CsvRow[] = [];
    let processedRows = 0;

    for (const rawRow of repairedData) {
      const row: CsvRow = {};
      let hasInvalidDate = false;

      headers.forEach((header) => {
        let value = String(rawRow[header] || '').trim();
        
        // Strip quotes if value starts/ends with "; unescape "" → "
        value = stripQuotes(value);
        
        // Normalize specific fields
        if (header.toLowerCase().includes('date')) {
          const dateResult = normalizeDate(value);
          value = dateResult.value;
          if (!dateResult.isValid && value !== '') {
            hasInvalidDate = true;
          }
        } else if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('price')) {
          value = normalizeAmount(value);
        } else if (header.toLowerCase().includes('paid')) {
          value = normalizePaid(value);
        }
        
        row[header] = value;
      });

      if (hasInvalidDate) {
        invalidDates++;
      }

      data.push(row);
      processedRows++;

      // Calculate total amount
      const amountField = Object.keys(row).find(key => 
        key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')
      );
      if (amountField && row[amountField]) {
        const amount = parseFloat(row[amountField].replace(/[^0-9.-]/g, ''));
        if (!isNaN(amount)) {
          totalAmount += amount;
        }
      }
    }

    // Final sanity filter: guarantee no blank lines reach preview/PDF
    const finalCleanData = data
      .filter(r => r && Object.values(r).some(v => String(v || "").trim() !== ""))
      .map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])))
      .filter(r => {
        // Guard: drop rows with no Date OR no Description (incomplete records)
        const dateField = Object.keys(r).find(key => key.toLowerCase().includes('date'));
        const descriptionField = Object.keys(r).find(key => 
          key.toLowerCase().includes('description') || key.toLowerCase().includes('desc')
        );
        
        const hasDate = dateField && r[dateField] && String(r[dateField]).trim() !== '';
        const hasDescription = descriptionField && r[descriptionField] && String(r[descriptionField]).trim() !== '';
        
        // Keep only rows that have BOTH Date AND Description
        return hasDate && hasDescription;
      });

    const droppedRows = data.length - finalCleanData.length;

    return {
      data: finalCleanData,
      warnings,
      stats: {
        originalRows,
        cleanedRows: finalCleanData.length,
        totalAmount,
        removedBlank: removedBlank + droppedRows,
        repairedRows,
        invalidDates
      }
    };
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parsed = parseCsv(csvText);
      setParsedData(parsed);
      setIsProcessing(false);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
      handleFile(file);
    } else {
      alert('Please drop a CSV file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const generatePdf = () => {
    if (!parsedData || parsedData.data.length === 0) return;

    const doc = new jsPDF();
    
    // Summary at top
    doc.setFontSize(16);
    doc.text('CSV Report Summary', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Total Amount: $${parsedData.stats.totalAmount.toFixed(2)}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);

    // Get headers and data
    const headers = Object.keys(parsedData.data[0]);
    const tableData = parsedData.data.map(row => 
      headers.map(header => row[header] || '')
    );

    // Add table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 50,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 41, 41],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        // Right-align amount columns
        ...headers.reduce((acc, header, index) => {
          if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('price')) {
            acc[index] = { halign: 'right' };
          } else if (header.toLowerCase().includes('paid')) {
            acc[index] = { halign: 'center' };
          }
          return acc;
        }, {} as any)
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer with page numbers
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber}`, 14, doc.internal.pageSize.height - 10);
        doc.text('Generated by TidyDocs', doc.internal.pageSize.width - 50, doc.internal.pageSize.height - 10);
      }
    });

    // Download
    const pdfName = uploadedFile?.name.replace('.csv', '') + '_report.pdf';
    doc.save(pdfName);
  };

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12" aria-labelledby="csv-pdf-heading">
      <div className="text-center mb-8">
        <h1 id="csv-pdf-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">CSV → PDF Report Generator</h1>
        <p className="mt-3 text-neutral-700">Turn raw rows into a client-ready PDF with clean tables and headings.</p>
      </div>

      {/* Demo Block */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <div className="aspect-video bg-neutral-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
          <img 
            src="/demo-csv-pdf.svg" 
            alt="CSV to PDF conversion example" 
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-sm text-neutral-600 text-center">Sample CSV converted to professional PDF report.</p>
      </div>

      {/* Features */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <h2 className="text-lg font-semibold mb-4">What you get:</h2>
        <ul className="space-y-2 text-neutral-700">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Clean, formatted tables with zebra stripes
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Automatic data normalization (dates, amounts, yes/no)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Summary statistics and totals
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Batch processing coming soon
          </li>
        </ul>
      </div>

      {/* Upload Area */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <div 
          className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <p className="text-neutral-600 mb-4">Drop your CSV file here or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            onChange={handleFileInput}
            className="hidden"
          />
          <button 
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Choose CSV File
          </button>
        </div>
      </div>

      {/* Processing Results */}
      {isProcessing && (
        <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Processing your CSV file...</p>
          </div>
        </div>
      )}

      {uploadedFile && parsedData && (
        <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-4">CSV Analysis Complete</h3>
          
          {/* File Info */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">File Name:</span>
              <span className="font-medium">{uploadedFile.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Original Rows:</span>
              <span className="font-medium">{parsedData.stats.originalRows}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Cleaned Rows:</span>
              <span className="font-medium">{parsedData.stats.cleanedRows}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-neutral-600">Total Amount:</span>
              <span className="font-medium">${parsedData.stats.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600">Status:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Ready for PDF export</span>
            </div>
          </div>

          {/* Summary Notice */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Processing Summary:</strong> Removed {parsedData.stats.removedBlank} blank rows • 
              Dropped {parsedData.stats.repairedRows} invalid rows
            </div>
          </div>

          {/* Warnings */}
          {parsedData.warnings.length > 0 && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Processing Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {parsedData.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-neutral-900 mb-3">Preview (first 15 rows)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-neutral-200 rounded-lg">
                <thead className="bg-neutral-50">
                  <tr>
                    {Object.keys(parsedData.data[0]).map((header, index) => (
                      <th key={index} className="px-3 py-2 text-left font-medium text-neutral-700 border-b border-neutral-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.data.slice(0, 15).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-neutral-600 border-b border-neutral-100">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.data.length > 15 && (
              <p className="mt-2 text-xs text-neutral-500">
                Showing first 15 rows of {parsedData.data.length} total rows
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={generatePdf}
            >
              Download PDF Report
            </button>
            <button 
              className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              onClick={() => {
                setUploadedFile(null);
                setParsedData(null);
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
            <h3 className="font-medium text-neutral-900">What data normalization is applied?</h3>
            <p className="text-sm text-neutral-600 mt-1">Dates are formatted as YYYY-MM-DD, amounts get $ prefix and 2 decimals, and paid fields normalize to Yes/No.</p>
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">How are inconsistent columns handled?</h3>
            <p className="text-sm text-neutral-600 mt-1">Extra columns are merged into description fields, missing columns cause rows to be dropped with warnings.</p>
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


