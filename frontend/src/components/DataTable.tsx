import React from 'react';

interface TableProps {
    headers: string[];
    data: string[][];
}

export default function DataTable({ headers, data }: TableProps) {
    return (
        <div className="ml-4 w-fit max-h-64 overflow-y-scroll border border-gray-400">
            <table className="border-collapse w-full">
                <thead className="sticky top-0 bg-black text-white">
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index} className="border border-gray-300 p-2">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="border border-gray-300 p-1">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
