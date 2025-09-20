"use client";

import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from 'jspdf';
import { Chart as ChartJS } from 'chart.js';

export default function ExcelToChartsPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chartSuggestions, setChartSuggestions] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<unknown[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [charts, setCharts] = useState<Array<{type: string, data: unknown, title: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartComponents, setChartComponents] = useState<any>(null);
  
  // Chart refs for PDF export
  const barRef = useRef<ChartJS|null>(null);
  const lineRef = useRef<ChartJS|null>(null);
  const pieRef = useRef<ChartJS|null>(null);
  const scatRef = useRef<ChartJS|null>(null);
  
  // Fixed color palette for pie charts
  const PIE_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F472B6','#84CC16'];

  // Helper function for high-resolution chart capture with real dimensions
  async function captureChartHiDPI(chart: any, scale = 3) {
    if (!chart) return null;
    const w = chart.width, h = chart.height;
    chart.resize(w * scale, h * scale);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const url = chart.toBase64Image('image/png', 1.0);
    chart.resize(w, h);
    // probe natural size from the dataURL
    const img = new Image();
    const dims = await new Promise((res) => { 
      img.onload = () => res({w: img.naturalWidth, h: img.naturalHeight}); 
      img.src = url; 
    });
    return { url, ...dims };
  }

  // Load Chart.js dynamically on client side
  useEffect(() => {
    const loadChartJs = async () => {
      try {
        const { Chart: ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } = await import('chart.js');
        const { Bar, Line, Pie, Scatter } = await import('react-chartjs-2');
        
        // Register Chart.js components
        ChartJS.register(
          CategoryScale,
          LinearScale,
          BarElement,
          LineElement,
          PointElement,
          ArcElement,
          Title,
          Tooltip,
          Legend
        );
        
        setChartComponents({ Bar, Line, Pie, Scatter });
        console.log('Chart components loaded:', { Bar, Line, Pie, Scatter });
      } catch (error) {
        console.error('Failed to load Chart.js:', error);
      }
    };

    loadChartJs();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('No data found in Excel file');
      }
      
      const data = jsonData as unknown[][];
      const headerRow = data[0] as string[];
      const dataRows = data.slice(1);
      
      setHeaders(headerRow);
      setExcelData(dataRows);
      
      // Generate chart suggestions based on data
      const suggestions = generateChartSuggestions(headerRow, dataRows);
      setChartSuggestions(suggestions);
      
      console.log('Excel processed:', file.name, 'Rows:', dataRows.length, 'Columns:', headerRow.length);
    } catch (error) {
      console.error('Error processing Excel:', error);
      alert('Error processing Excel file');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateChartSuggestions = (headers: string[], data: unknown[][]): string[] => {
    const suggestions: string[] = [];
    
    // Find numeric columns
    const numericColumns = headers.map((header, index) => {
      const columnData = data.map(row => row[index]);
      const isNumeric = columnData.every(val => !isNaN(parseFloat(String(val))) && val !== '');
      return { header, index, isNumeric };
    }).filter(col => col.isNumeric);
    
    // Find text/category columns
    const categoryColumns = headers.map((header, index) => {
      const columnData = data.map(row => row[index]);
      const hasText = columnData.some(val => typeof val === 'string' && val.trim() !== '');
      return { header, index, hasText };
    }).filter(col => col.hasText);
    
    if (numericColumns.length >= 1 && categoryColumns.length >= 1) {
      suggestions.push(`Bar Chart - ${categoryColumns[0].header} vs ${numericColumns[0].header}`);
    }
    
    if (numericColumns.length >= 2) {
      suggestions.push(`Line Chart - ${numericColumns[0].header} Trend`);
      suggestions.push(`Scatter Plot - ${numericColumns[0].header} vs ${numericColumns[1].header}`);
    }
    
    if (numericColumns.length >= 1 && categoryColumns.length >= 1) {
      suggestions.push(`Pie Chart - ${categoryColumns[0].header} Distribution`);
    }
    
    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel' ||
                 file.name.endsWith('.xlsx') || 
                 file.name.endsWith('.xls'))) {
      processExcelFile(file);
    } else {
      alert('Please drop an Excel file (.xlsx or .xls)');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const generateAllCharts = async () => {
    if (headers.length === 0 || excelData.length === 0) return;
    
    setIsGenerating(true);
    try {
      const generatedCharts: Array<{type: string, data: unknown, title: string}> = [];
      
      console.log('Generating charts with data:', { headers, excelData: excelData.slice(0, 3) });
      
      // Find numeric and category columns
      const numericColumns = headers.map((header, index) => {
        const columnData = excelData.map(row => row[index]);
        const isNumeric = columnData.every(val => !isNaN(parseFloat(String(val))) && val !== '');
        return { header, index, isNumeric };
      }).filter(col => col.isNumeric);
      
      const categoryColumns = headers.map((header, index) => {
        const columnData = excelData.map(row => row[index]);
        const hasText = columnData.some(val => typeof val === 'string' && val.trim() !== '');
        return { header, index, hasText };
      }).filter(col => col.hasText);
      
      // Generate Bar Chart
      if (numericColumns.length >= 1 && categoryColumns.length >= 1) {
        const categoryData = excelData.map(row => row[categoryColumns[0].index]);
        const numericData = excelData.map(row => parseFloat(String(row[numericColumns[0].index])));
        
        const barChartData = {
          labels: categoryData,
          datasets: [{
            label: numericColumns[0].header,
            data: numericData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }]
        };
        
        generatedCharts.push({
          type: 'bar',
          data: barChartData,
          title: `${categoryColumns[0].header} vs ${numericColumns[0].header}`
        });
      }
      
      // Generate Line Chart
      if (numericColumns.length >= 1) {
        const numericData = excelData.map(row => parseFloat(String(row[numericColumns[0].index])));
        const labels = excelData.map((_, index) => `Row ${index + 1}`);
        
        const lineChartData = {
          labels,
          datasets: [{
            label: numericColumns[0].header,
            data: numericData,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.25,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false
          }]
        };
        
        generatedCharts.push({
          type: 'line',
          data: lineChartData,
          title: `${numericColumns[0].header} Trend`
        });
      }
      
      // Generate Pie Chart
      if (numericColumns.length >= 1 && categoryColumns.length >= 1) {
        const categoryData = excelData.map(row => row[categoryColumns[0].index]);
        const numericData = excelData.map(row => parseFloat(String(row[numericColumns[0].index])));
        
        // Group by category and sum values
        const groupedData: {[key: string]: number} = {};
        categoryData.forEach((category, index) => {
          groupedData[String(category)] = (groupedData[String(category)] || 0) + numericData[index];
        });
        
        const pieChartData = {
          labels: Object.keys(groupedData),
          datasets: [{
            data: Object.values(groupedData),
            backgroundColor: PIE_COLORS.slice(0, Object.keys(groupedData).length),
            borderWidth: 0
          }]
        };
        
        generatedCharts.push({
          type: 'pie',
          data: pieChartData,
          title: `${categoryColumns[0].header} Distribution`
        });
      }
      
      // Generate Scatter Plot
      if (numericColumns.length >= 2) {
        const xData = excelData.map(row => parseFloat(String(row[numericColumns[0].index])));
        const yData = excelData.map(row => parseFloat(String(row[numericColumns[1].index])));
        
        const scatterChartData = {
          datasets: [{
            label: `${numericColumns[0].header} vs ${numericColumns[1].header}`,
            data: xData.map((x, index) => ({ x, y: yData[index] })),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5
          }]
        };
        
        generatedCharts.push({
          type: 'scatter',
          data: scatterChartData,
          title: `${numericColumns[0].header} vs ${numericColumns[1].header}`
        });
      }
      
      console.log('Generated charts:', generatedCharts);
      setCharts(generatedCharts);
      
    } catch (error) {
      console.error('Error generating charts:', error);
      alert('Error generating charts');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportChartsToPDF = async () => {
    if (charts.length === 0 || !chartComponents) return;
    
    try {
      // Wait for charts to render properly
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      
      // Get chart images from refs using HiDPI capture
      const imgs = [
        { title: 'Month vs Sales',     cap: await captureChartHiDPI(barRef.current, 3) },
        { title: 'Sales Trend',        cap: await captureChartHiDPI(lineRef.current, 3) },
        { title: 'Month Distribution', cap: await captureChartHiDPI(pieRef.current, 3) },
        { title: 'Sales vs Expenses',  cap: await captureChartHiDPI(scatRef.current, 3) },
      ].filter(x => x.cap);
      
      if (imgs.length === 0) {
        alert('No charts available for export');
        return;
      }
      
      // Build PDF with true fit (1 chart per page)
      const M = 40; // margins
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const boxW  = pageW - 2*M;
      const boxH  = pageH - 2*M - 18; // minus title line
      
      imgs.forEach((x, i) => {
        if (i > 0) pdf.addPage();
        pdf.setFont('helvetica', 'bold'); 
        pdf.setFontSize(14);
        pdf.text(x.title, M, M - 8);
        const { w: iw, h: ih, url } = x.cap!;
        const s = Math.min(boxW / iw, boxH / ih);
        const drawW = iw * s, drawH = ih * s;
        const y = M + 6; // below title
        pdf.addImage(url, 'PNG', M, y, drawW, drawH, undefined, 'FAST');
      });
      
      pdf.save('charts-report.pdf');
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting charts to PDF');
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12" aria-labelledby="excel-charts-heading">
      <div className="text-center mb-8">
        <h1 id="excel-charts-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">Excel → Auto-Charts</h1>
        <p className="mt-3 text-neutral-700">Drop in a sheet and get instant bar, line, and pie charts.</p>
      </div>

      {/* Demo Block */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <div className="aspect-video bg-neutral-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
          <img 
            src="/demo-excel-charts.svg" 
            alt="Excel to charts conversion example" 
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-sm text-neutral-600 text-center">Dataset rendered into four charts.</p>
      </div>

      {/* Features */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        <h2 className="text-lg font-semibold mb-4">What you get:</h2>
        <ul className="space-y-2 text-neutral-700">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Smart column detection
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Clean presets
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Export to PDF/PNG (coming)
          </li>
        </ul>
      </div>

      {/* Upload Area */}
      <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
        {!chartComponents ? (
          <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full"></div>
            </div>
            <p className="text-neutral-600 mb-4">Loading chart processing library...</p>
          </div>
        ) : (
          <div 
            className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('excel-upload')?.click()}
          >
          <div className="w-12 h-12 mx-auto mb-4 bg-neutral-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">📈</span>
          </div>
          <p className="text-neutral-600 mb-4">Drop your Excel file here or click to browse</p>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button 
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('excel-upload')?.click();
            }}
          >
            Choose Excel File
          </button>
        </div>
        )}
      </div>

      {/* Processing Results */}
      {isProcessing && (
        <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Analyzing your Excel data...</p>
          </div>
        </div>
      )}

      {uploadedFile && chartSuggestions.length > 0 && (
        <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Chart Suggestions</h3>
          <p className="text-sm text-neutral-600 mb-4">File: {uploadedFile.name}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {chartSuggestions.map((suggestion, index) => (
              <div key={index} className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📊</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900">{suggestion}</h4>
                    <p className="text-xs text-neutral-600">Recommended chart type</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={generateAllCharts}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate All Charts'}
            </button>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={exportChartsToPDF}
              disabled={charts.length === 0}
            >
              Export Charts
            </button>
            <button 
              className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              onClick={() => {
                setUploadedFile(null);
                setChartSuggestions([]);
                setCharts([]);
                setExcelData([]);
                setHeaders([]);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Generated Charts Display */}
      {charts.length > 0 && (
        <div className="mb-8 rounded-2xl bg-white shadow-sm shadow-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Generated Charts</h3>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Debug Info:</strong> Charts: {charts.length} | Components loaded: {chartComponents ? 'Yes' : 'No'} | 
              {chartComponents && ` Bar: ${chartComponents.Bar ? 'Yes' : 'No'}, Line: ${chartComponents.Line ? 'Yes' : 'No'}, Pie: ${chartComponents.Pie ? 'Yes' : 'No'}, Scatter: ${chartComponents.Scatter ? 'Yes' : 'No'}`}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts.map((chart, index) => {
              // Destructure components at the top level
              const { Bar, Line, Pie, Scatter } = chartComponents || {};
              
              return (
                <div key={index} className="border border-neutral-200 rounded-lg p-4">
                  <h4 className="font-medium text-neutral-900 mb-3">{chart.title} (Type: {chart.type})</h4>
                  <div className="h-[340px]">
                    {chartComponents && chart.type === 'bar' && Bar && (
                      <Bar 
                        ref={barRef}
                        data={chart.data as any} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          devicePixelRatio: 2,
                          plugins: {
                            tooltip: {},
                            legend: {
                              position: 'top',
                              labels: {
                                usePointStyle: true
                              }
                            }
                          },
                          scales: {
                            x: {
                              grid: {
                                color: 'rgba(0,0,0,0.06)'
                              }
                            },
                            y: {
                              grid: {
                                color: 'rgba(0,0,0,0.06)'
                              }
                            }
                          }
                        }}
                        onLoad={() => {
                          if (barRef.current?.canvas) {
                            barRef.current.canvas.style.background = '#fff';
                          }
                        }}
                      />
                    )}
                    {chartComponents && chart.type === 'line' && Line && (
                      <Line 
                        ref={lineRef}
                        data={chart.data as any} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          devicePixelRatio: 2,
                          plugins: {
                            tooltip: {},
                            legend: {
                              position: 'top',
                              labels: {
                                usePointStyle: true
                              }
                            }
                          },
                          scales: {
                            x: {
                              grid: {
                                color: 'rgba(0,0,0,0.06)'
                              }
                            },
                            y: {
                              grid: {
                                color: 'rgba(0,0,0,0.06)'
                              }
                            }
                          }
                        }}
                        onLoad={() => {
                          if (lineRef.current?.canvas) {
                            lineRef.current.canvas.style.background = '#fff';
                          }
                        }}
                      />
                    )}
                    {chartComponents && chart.type === 'pie' && Pie && (
                      <Pie 
                        ref={pieRef}
                        data={chart.data as any} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          devicePixelRatio: 2,
                          plugins: {
                            tooltip: {},
                            legend: {
                              position: 'top',
                              labels: {
                                usePointStyle: true
                              }
                            }
                          }
                        }}
                        onLoad={() => {
                          if (pieRef.current?.canvas) {
                            pieRef.current.canvas.style.background = '#fff';
                          }
                        }}
                      />
                    )}
                    {chartComponents && chart.type === 'scatter' && Scatter && (
                      <Scatter 
                        ref={scatRef}
                        data={chart.data as any} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          devicePixelRatio: 2,
                          plugins: {
                            tooltip: {},
                            legend: {
                              position: 'top',
                              labels: {
                                usePointStyle: true
                              }
                            }
                          },
                          scales: {
                            x: {
                              type: 'linear',
                              position: 'bottom',
                              grid: {
                                color: 'rgba(0,0,0,0.06)'
                              }
                            },
                            y: {
                              grid: {
                                color: 'rgba(0,0,0,0.06)'
                              }
                            }
                          }
                        }}
                        onLoad={() => {
                          if (scatRef.current?.canvas) {
                            scatRef.current.canvas.style.background = '#fff';
                          }
                        }}
                      />
                    )}
                    {!chartComponents && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full mx-auto mb-2"></div>
                          <p className="text-neutral-600 text-sm">Loading chart components...</p>
                        </div>
                      </div>
                    )}
                    {chartComponents && chart.type === 'bar' && !Bar && (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <p className="text-neutral-600 mb-2">Bar component not available</p>
                          <p className="text-sm text-neutral-500">Chart type: {chart.type}</p>
                        </div>
                      </div>
                    )}
                    {chartComponents && chart.type === 'line' && !Line && (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <p className="text-neutral-600 mb-2">Line component not available</p>
                          <p className="text-sm text-neutral-500">Chart type: {chart.type}</p>
                        </div>
                      </div>
                    )}
                    {chartComponents && chart.type === 'pie' && !Pie && (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <p className="text-neutral-600 mb-2">Pie component not available</p>
                          <p className="text-sm text-neutral-500">Chart type: {chart.type}</p>
                        </div>
                      </div>
                    )}
                    {chartComponents && chart.type === 'scatter' && !Scatter && (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <p className="text-neutral-600 mb-2">Scatter component not available</p>
                          <p className="text-sm text-neutral-500">Chart type: {chart.type}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
            <h3 className="font-medium text-neutral-900">What chart types are supported?</h3>
            <p className="text-sm text-neutral-600 mt-1">Bar, line, pie, and scatter charts. More chart types coming soon.</p>
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">How does smart column detection work?</h3>
            <p className="text-sm text-neutral-600 mt-1">We analyze your data to automatically suggest the best chart types and axis configurations.</p>
          </div>
          <div>
            <h3 className="font-medium text-neutral-900">Can I customize the chart appearance?</h3>
            <p className="text-sm text-neutral-600 mt-1">Basic customization is available now.</p>
          </div>
        </div>
      </div>
    </section>
  );
}