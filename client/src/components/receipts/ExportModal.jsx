import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Check,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import toast from '@/lib/toast';

export function ExportModal({ open, onClose, receipts = [], user = null }) {
  const [selectedFormat, setSelectedFormat] = useState('pdf'); // 'pdf' | 'csv' | 'excel'
  const [includeLineItems, setIncludeLineItems] = useState(true);
  const [includeTaxes, setIncludeTaxes] = useState(true);
  const [includeWarranties, setIncludeWarranties] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!open) return null;

  const count = receipts.length;
  const totalAmount = receipts.reduce((acc, r) => {
    const val = r.grandTotal != null ? r.grandTotal : (r.totalAmount != null ? r.totalAmount : 0);
    return acc + Number(val || 0);
  }, 0);

  // Generate CSV Data
  const generateCSV = (isExcel = false) => {
    const delimiter = isExcel ? '\t' : ',';
    const extension = isExcel ? 'xls' : 'csv';
    const mime = isExcel ? 'application/vnd.ms-excel;charset=utf-8' : 'text/csv;charset=utf-8';

    const headers = [
      'Store Name',
      'Invoice Number',
      'Date',
      'Category',
      'Items Count',
      ...(includeLineItems ? ['Itemized Products'] : []),
      'Subtotal (INR)',
      ...(includeTaxes ? ['Taxes (INR)'] : []),
      'Grand Total (INR)',
      ...(includeWarranties ? ['Warranty Status', 'Warranty Expiry'] : []),
      'Tags',
      'Notes',
    ];

    const rows = receipts.map((r) => {
      const products = r.products || [];
      const cat = products[0]?.category || r.category || 'General';
      const date = r.purchaseDate ? new Date(r.purchaseDate).toISOString().slice(0, 10) : '';
      const subtotal = r.subtotal != null ? r.subtotal : '';
      const tax = r.taxAmount != null ? r.taxAmount : 0;
      const grandTotal = r.grandTotal != null ? r.grandTotal : (r.totalAmount != null ? r.totalAmount : 0);
      const tags = Array.isArray(r.tags) ? r.tags.join('; ') : '';
      
      const itemizedDesc = products.map((p) => `${p.productName} (x${p.quantity || 1} @ ₹${p.unitPrice || 0})`).join('; ');
      const warrantyStatus = products[0]?.warrantyStatus || 'none';
      const warrantyExpiry = products[0]?.warrantyExpiryDate ? new Date(products[0].warrantyExpiryDate).toISOString().slice(0, 10) : 'N/A';

      const escape = (val) => {
        const s = String(val == null ? '' : val).replace(/"/g, '""');
        return isExcel ? s : `"${s}"`;
      };

      const row = [
        escape(r.storeName || 'Merchant'),
        escape(r.invoiceNumber || ''),
        escape(date),
        escape(cat),
        escape(products.length || 1),
        ...(includeLineItems ? [escape(itemizedDesc)] : []),
        escape(subtotal),
        ...(includeTaxes ? [escape(tax)] : []),
        escape(grandTotal),
        ...(includeWarranties ? [escape(warrantyStatus), escape(warrantyExpiry)] : []),
        escape(tags),
        escape(r.notes || ''),
      ];

      return row.join(delimiter);
    });

    const fileContent = 'data:' + mime + ',' + encodeURIComponent([headers.join(delimiter), ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', fileContent);
    link.setAttribute('download', `billbox-expense-report-${new Date().toISOString().slice(0, 10)}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${count} receipts successfully!`);
    onClose();
  };

  // Generate Printable Formatted HTML / PDF Report
  const generatePDFReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to generate PDF report.');
      return;
    }

    const reportDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const rowsHtml = receipts.map((r, i) => {
      const products = r.products || [];
      const date = r.purchaseDate ? new Date(r.purchaseDate).toLocaleDateString('en-IN') : 'N/A';
      const grandTotal = Number(r.grandTotal != null ? r.grandTotal : (r.totalAmount || 0));
      const itemsList = products.map((p) => p.productName).join(', ') || 'General Expense';
      const warrantyBadge = products[0]?.warrantyStatus === 'active'
        ? `<span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Active</span>`
        : products[0]?.warrantyStatus === 'expiring_soon'
        ? `<span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Expiring Soon</span>`
        : `<span style="color: #94a3b8; font-size: 11px;">None</span>`;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
          <td style="padding: 10px 8px; color: #64748b;">${i + 1}</td>
          <td style="padding: 10px 8px; font-weight: 600; color: #0f172a;">${r.storeName || 'Merchant'}</td>
          <td style="padding: 10px 8px; color: #475569;">${r.invoiceNumber || '—'}</td>
          <td style="padding: 10px 8px; color: #475569;">${date}</td>
          ${includeLineItems ? `<td style="padding: 10px 8px; color: #334155;">${itemsList}</td>` : ''}
          ${includeWarranties ? `<td style="padding: 10px 8px;">${warrantyBadge}</td>` : ''}
          ${includeTaxes ? `<td style="padding: 10px 8px; text-align: right; color: #64748b;">₹${Number(r.taxAmount || 0).toLocaleString('en-IN')}</td>` : ''}
          <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #0f172a;">₹${grandTotal.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>BillBox Expense & Warranty Report - ${reportDate}</title>
          <style>
            @page { size: A4 portrait; margin: 16mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { background: #f1f5f9; padding: 8px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
            .print-btn { background: #23778E; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right;">
            <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
          </div>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #23778E;">BillBox Financial Report</h1>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Official Expense Vault &amp; Warranty Audit</p>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <p style="margin: 0;"><strong>Date:</strong> ${reportDate}</p>
              <p style="margin: 4px 0 0;"><strong>User:</strong> ${user?.name || user?.email || 'Vault Owner'}</p>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi-card">
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Total Expenditures</span>
              <p style="margin: 4px 0 0; font-size: 22px; font-weight: 800; color: #0f172a;">₹${totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div class="kpi-card">
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Receipts Archived</span>
              <p style="margin: 4px 0 0; font-size: 22px; font-weight: 800; color: #0f172a;">${count}</p>
            </div>
            <div class="kpi-card">
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Status</span>
              <p style="margin: 4px 0 0; font-size: 22px; font-weight: 800; color: #059669;">Verified Records</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Store</th>
                <th>Invoice</th>
                <th>Date</th>
                ${includeLineItems ? '<th>Products</th>' : ''}
                ${includeWarranties ? '<th>Warranty</th>' : ''}
                ${includeTaxes ? '<th style="text-align: right;">Tax</th>' : ''}
                <th style="text-align: right;">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
            Generated by BillBox Smart Receipt &amp; Warranty Vault. All documents are cryptographically encrypted.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('Generated PDF Report! Use your browser dialog to save or print.');
    onClose();
  };

  const handleExecuteExport = () => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'pdf') {
        generatePDFReport();
      } else if (selectedFormat === 'excel') {
        generateCSV(true);
      } else {
        generateCSV(false);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-surface text-fg border border-line shadow-2xl p-6 rounded-3xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Download className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-fg">Export Vault Records</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-fg-3">
            Download your financial records, tax tabulations, and warranty expirations in formatted spreadsheets or printable PDFs.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Card */}
        <div className="my-3 p-3.5 rounded-2xl bg-subtle/50 border border-line-subtle flex items-center justify-between text-xs">
          <div>
            <p className="text-fg-3">Selected Dataset</p>
            <p className="font-bold text-fg text-sm">{count} Receipts</p>
          </div>
          <div className="text-right">
            <p className="text-fg-3">Cumulative Value</p>
            <p className="font-mono font-bold text-accent text-sm">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Format Selection Cards */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-fg-2">Choose Output Format</label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* PDF Report */}
            <button
              type="button"
              onClick={() => setSelectedFormat('pdf')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                selectedFormat === 'pdf'
                  ? 'border-accent bg-accent/10 shadow-xs'
                  : 'border-line bg-surface hover:bg-hover text-fg-2'
              }`}
            >
              <Printer className={`size-5 mb-2 ${selectedFormat === 'pdf' ? 'text-accent' : 'text-fg-3'}`} />
              <div>
                <p className="font-bold text-xs text-fg">PDF Report</p>
                <p className="text-[10px] text-fg-3">Print / Archive</p>
              </div>
            </button>

            {/* CSV */}
            <button
              type="button"
              onClick={() => setSelectedFormat('csv')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                selectedFormat === 'csv'
                  ? 'border-accent bg-accent/10 shadow-xs'
                  : 'border-line bg-surface hover:bg-hover text-fg-2'
              }`}
            >
              <FileText className={`size-5 mb-2 ${selectedFormat === 'csv' ? 'text-accent' : 'text-fg-3'}`} />
              <div>
                <p className="font-bold text-xs text-fg">CSV File</p>
                <p className="text-[10px] text-fg-3">Raw Tabular</p>
              </div>
            </button>

            {/* Excel */}
            <button
              type="button"
              onClick={() => setSelectedFormat('excel')}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                selectedFormat === 'excel'
                  ? 'border-accent bg-accent/10 shadow-xs'
                  : 'border-line bg-surface hover:bg-hover text-fg-2'
              }`}
            >
              <FileSpreadsheet className={`size-5 mb-2 ${selectedFormat === 'excel' ? 'text-accent' : 'text-fg-3'}`} />
              <div>
                <p className="font-bold text-xs text-fg">Excel Sheet</p>
                <p className="text-[10px] text-fg-3">Spreadsheet</p>
              </div>
            </button>
          </div>
        </div>

        {/* Export Field Options */}
        <div className="mt-4 pt-3 border-t border-line-subtle space-y-2.5">
          <label className="text-xs font-semibold text-fg-2">Included Columns</label>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={includeLineItems} onCheckedChange={setIncludeLineItems} />
              <span className="text-fg">Include Itemized Products &amp; Prices</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={includeTaxes} onCheckedChange={setIncludeTaxes} />
              <span className="text-fg">Include Tax / GST Columns</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox checked={includeWarranties} onCheckedChange={setIncludeWarranties} />
              <span className="text-fg">Include Warranty Expiration Dates</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-line">
          <Button variant="ghost" type="button" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExecuteExport}
            disabled={isExporting || count === 0}
            className="h-9 px-5 text-xs font-semibold bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            <span>{selectedFormat === 'pdf' ? 'Generate PDF Report' : 'Download File'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
