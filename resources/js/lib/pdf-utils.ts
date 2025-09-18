import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Add type definitions for autoTable
interface AutoTableOptions {
    head?: (string | number)[][];
    body?: (string | number)[][];
    startY?: number;
    theme?: string;
    headStyles?: Record<string, unknown>;
    styles?: Record<string, unknown>;
    columnStyles?: Record<string, Record<string, unknown>>;
    alternateRowStyles?: Record<string, unknown>;
}

// Extend the jsPDF interface to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: AutoTableOptions) => jsPDF;
        lastAutoTable?: {
            finalY: number;
        };
    }
}

interface SavingsMember {
    id: number;
    name: string;
    email: string;
    target_amount: number;
}

interface SavingsPreviewData {
    quarter: {
        quarter_number: number;
        year: number;
    };
    month: string;
    total_amount: number;
    member_count: number;
    members: SavingsMember[];
}

export function generateSavingsPDF(data: SavingsPreviewData): void {
    const doc = new jsPDF();

    // Add header with organization info
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SACCO Monthly Savings Report', 20, 25);

    // Add subtitle with month and quarter info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const monthName = new Date(data.month + '-01').toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
    doc.text(`${monthName} - Quarter ${data.quarter.quarter_number}, ${data.quarter.year}`, 20, 35);

    // Add a line separator
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Add summary section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, 55);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Participating Members: ${data.member_count}`, 20, 65);
    doc.text(`Total Monthly Savings: $${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 20, 75);

    const averageAmount = data.member_count > 0 ? data.total_amount / data.member_count : 0;
    doc.text(`Average per Member: $${averageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 20, 85);

    // Add member contributions section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Member Contributions', 20, 105);

    // Prepare table data
    const tableData = data.members.map((member, index) => [
        (index + 1).toString(),
        member.name,
        member.email,
        `$${member.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);

    // Add member contributions table
    autoTable(doc, {
        head: [['#', 'Member Name', 'Email Address', 'Monthly Target']],
        body: tableData,
        startY: 115,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246], // Blue color
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 11,
        },
        styles: {
            fontSize: 10,
            cellPadding: 6,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252], // Light gray for alternate rows
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 55 },
            2: { cellWidth: 65 },
            3: { cellWidth: 35, halign: 'right' },
        },
    });

    // Add summary totals at the bottom of the table
    // When using autoTable function directly, finalY is attached to the doc
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 135, finalY + 15);
    doc.text(`$${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 155, finalY + 15);

    // Add footer with generation info
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, pageHeight - 30, 190, pageHeight - 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Report generated on ${new Date().toLocaleDateString('en-US')} at ${new Date().toLocaleTimeString('en-US')}`, 20, pageHeight - 20);

    doc.text('SACCO Management System', 190, pageHeight - 20, { align: 'right' });

    // Generate filename and save
    const filename = `SACCO-Savings-${data.month}-Q${data.quarter.quarter_number}-${data.quarter.year}.pdf`;
    doc.save(filename);
}
