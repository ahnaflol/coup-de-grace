"use client";

export function DataTable({
  headers,
  rows,
  stickyHeader = false,
}: {
  headers: string[];
  rows: Record<string, string>[];
  stickyHeader?: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <table className="w-full text-sm">
      <thead className={stickyHeader ? "sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10" : undefined}>
        <tr>
          <th className="text-left text-[10px] font-medium uppercase tracking-wider text-zinc-500 px-3 py-2 border-b border-zinc-800 w-10">
            #
          </th>
          {headers.map((h) => (
            <th
              key={h}
              className="text-left text-[10px] font-medium uppercase tracking-wider text-zinc-500 px-3 py-2 border-b border-zinc-800 whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            className="border-b border-zinc-800/40 hover:bg-zinc-900/50 transition-colors"
          >
            <td className="px-3 py-2 text-xs text-zinc-600 font-mono">
              {i + 1}
            </td>
            {headers.map((h) => (
              <td
                key={h}
                className="px-3 py-2 text-zinc-300 whitespace-nowrap max-w-[200px] truncate"
              >
                {row[h] ?? ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
