const quarterOptions = [
    { value: 1, label: 'Q1 (Jan - Mar)' },
    { value: 2, label: 'Q2 (Apr - Jun)' },
    { value: 3, label: 'Q3 (Jul - Sep)' },
    { value: 4, label: 'Q4 (Oct - Dec)' },
];

export default function ReportsHeader({ year, quarter, onYearChange, onQuarterChange }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6">
            <div>
                <h2 className="text-3xl font-semibold text-slate-900">Quarterly Reports</h2>
                <p className="text-sm text-slate-500">
                    Total billed, collected, and outstanding balances by quarter.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    id="reports-year"
                    name="reportsYear"
                    type="number"
                    aria-label="Report year"
                    className="w-full sm:w-28 rounded-lg px-3 py-2 text-sm bg-[#F3E4C9]"
                    value={year}
                    onChange={(event) => onYearChange(Number(event.target.value))}
                />
                <select
                    id="reports-quarter"
                    name="reportsQuarter"
                    aria-label="Report quarter"
                    className="w-full sm:w-52 rounded-lg  px-3 py-2 text-sm bg-[#F3E4C9]"
                    value={quarter}
                    onChange={(event) => onQuarterChange(Number(event.target.value))}
                >
                    {quarterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
