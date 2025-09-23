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

// Loan interfaces for PDF generation
interface LoanUser {
    id: number;
    name: string;
    email: string;
}

interface Loan {
    id: number;
    user: LoanUser;
    loan_number: string;
    amount: number;
    total_amount: number;
    outstanding_balance: number;
    status: 'pending' | 'approved' | 'disbursed' | 'completed' | 'rejected';
    purpose: string;
    applied_date: string;
    approved_date?: string;
    disbursed_date?: string;
    expected_repayment_date: string;
    actual_repayment_date?: string;
    repayment_period_months?: number;
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
    doc.setDrawColor(0, 0, 0); // Black color
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Add summary section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, 55);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Participating Members: ${data.member_count}`, 20, 65);
    doc.text(`Total Monthly Savings: $${Math.round(data.total_amount).toLocaleString('en-US')}`, 20, 75);

    const averageAmount = data.member_count > 0 ? data.total_amount / data.member_count : 0;
    doc.text(`Average per Member: $${Math.round(averageAmount).toLocaleString('en-US')}`, 20, 85);

    // Add member contributions section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Member Contributions', 20, 105);

    // Prepare table data
    const tableData = data.members.map((member, index) => [
        (index + 1).toString(),
        member.name,
        member.email,
        `$${Math.round(member.target_amount).toLocaleString('en-US')}`,
    ]);

    // Add member contributions table
    autoTable(doc, {
        head: [['#', 'Member Name', 'Email Address', 'Monthly Target']],
        body: tableData,
        startY: 115,
        theme: 'grid',
        headStyles: {
            fillColor: [0, 0, 0], // Black color
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
            fillColor: [240, 240, 240], // Light gray for alternate rows
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
    doc.text(`$${Math.round(data.total_amount).toLocaleString('en-US')}`, 155, finalY + 15);

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

export function generateLoansToBePaidPDF(loans: Loan[]): void {
    const doc = new jsPDF();

    // Filter loans that need to be paid (approved and disbursed loans with outstanding balance)
    const loansToBePaid = loans.filter((loan) => (loan.status === 'approved' || loan.status === 'disbursed') && Number(loan.outstanding_balance) > 0);

    // Add header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SACCO Loans to be Paid Report', 20, 25);

    // Add subtitle with date
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(
        `Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}`,
        20,
        35,
    );

    // Add a line separator
    doc.setDrawColor(0, 0, 0); // Black color
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Add summary section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, 55);

    const totalOutstanding = loansToBePaid.reduce((sum, loan) => sum + Number(loan.outstanding_balance), 0);
    const totalApproved = loansToBePaid.filter((loan) => loan.status === 'approved').length;
    const totalDisbursed = loansToBePaid.filter((loan) => loan.status === 'disbursed').length;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Loans to be Paid: ${loansToBePaid.length}`, 20, 65);
    doc.text(`Approved (pending disbursement): ${totalApproved}`, 20, 75);
    doc.text(`Disbursed (active repayment): ${totalDisbursed}`, 20, 85);
    doc.text(`Total Outstanding Amount: $${Math.round(totalOutstanding).toLocaleString('en-US')}`, 20, 95);

    if (loansToBePaid.length === 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('✓ No loans requiring payment at this time.', 20, 120);
        doc.text('All loans are either pending approval, completed, or rejected.', 20, 135);
    } else {
        // Add loans section
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.text('Loan Details', 20, 110);

        // Prepare table data
        const tableData = loansToBePaid.map((loan) => [
            loan.loan_number,
            loan.user.name,
            loan.purpose.length > 30 ? loan.purpose.substring(0, 30) + '...' : loan.purpose,
            `$${Math.round(Number(loan.amount)).toLocaleString('en-US')}`,
            `$${Math.round(Number(loan.outstanding_balance)).toLocaleString('en-US')}`,
            loan.status.charAt(0).toUpperCase() + loan.status.slice(1),
            new Date(loan.expected_repayment_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
        ]);

        // Add loans table
        autoTable(doc, {
            head: [['Loan #', 'Borrower', 'Purpose', 'Amount', 'Outstanding', 'Status', 'Due Date']],
            body: tableData,
            startY: 120,
            theme: 'grid',
            headStyles: {
                fillColor: [0, 0, 0], // Black color
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10,
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240], // Light gray for alternate rows
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Loan #
                1: { cellWidth: 35 }, // Borrower
                2: { cellWidth: 35 }, // Purpose
                3: { cellWidth: 25, halign: 'right' }, // Amount
                4: { cellWidth: 25, halign: 'right' }, // Outstanding
                5: { cellWidth: 20, halign: 'center' }, // Status
                6: { cellWidth: 25, halign: 'center' }, // Due Date
            },
        });

        // Add totals at the bottom of the table
        const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 200;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.text('TOTAL OUTSTANDING:', 120, finalY + 15);
        doc.text(`$${Math.round(totalOutstanding).toLocaleString('en-US')}`, 160, finalY + 15);
    }

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
    const today = new Date();
    const filename = `SACCO-Loans-ToBePaid-${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}.pdf`;
    doc.save(filename);
}
