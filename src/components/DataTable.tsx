import React from 'react';

interface TableProps {
    headers: string[];
    data: string[][];
}

export default function DataTable({ headers, data }: TableProps) {
    return (
        <table className="table-auto border-collapse border border-gray-400">
            <thead>
                <tr>
                    {headers.map((header, index) => (
                        <th key={index} className="border border-gray-300 px-4 py-2">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
