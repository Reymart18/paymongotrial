export default function AdminDashboardPrintStyles() {
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
                    .print-settled, .print-settled * {
                        visibility: visible;
                    }
                    .print-settled {
                        position: static !important;
                        left: 0;
                    .print-overpaid, .print-overpaid * {
                        visibility: visible;
                    }
                    .print-overpaid {
                        position: static !important;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        background: #fff;
                    }
                    .print-overpaid .print-overpaid-table {
                        max-height: none !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .print-overpaid * {
                        overflow: visible !important;
                    }
                    .print-overpaid table {
                        width: 100% !important;
                        border-collapse: collapse;
                        page-break-inside: auto;
                    }
                    .print-overpaid thead {
                        display: table-header-group;
                    }
                    .print-overpaid tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-overpaid tbody {
                        page-break-inside: auto;
                    }
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        background: #fff;
                    }
                    .print-settled .print-settled-table {
                        max-height: none !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .print-settled * {
                        overflow: visible !important;
                    }
                    .print-settled table {
                        width: 100% !important;
                        border-collapse: collapse;
                        page-break-inside: auto;
                    }
                    .print-settled thead {
                        display: table-header-group;
                    }
                    .print-settled tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    .print-settled tbody {
                        page-break-inside: auto;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
    );
}
