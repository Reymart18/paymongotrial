export default function ReportsPrintStyles() {
    return (
        <style>{`
            @media print {
                html, body {
                    height: auto !important;
                    overflow: visible !important;
                }
                body * {
                    visibility: hidden;
                }
                .print-overdue, .print-overdue * {
                    visibility: visible;
                }
                .print-overdue {
                    position: static !important;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: auto !important;
                    max-height: none !important;
                    overflow: visible !important;
                    background: #fff;
                }
                .print-overdue .print-overdue-table {
                    max-height: none !important;
                    height: auto !important;
                    overflow: visible !important;
                }
                .print-overdue * {
                    overflow: visible !important;
                }
                .print-overdue table {
                    width: 100% !important;
                    border-collapse: collapse;
                    page-break-inside: auto;
                }
                .print-overdue thead {
                    display: table-header-group;
                }
                .print-overdue tr {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .print-overdue tbody {
                    page-break-inside: auto;
                }
                .no-print {
                    display: none !important;
                }
            }
        `}</style>
    );
}
