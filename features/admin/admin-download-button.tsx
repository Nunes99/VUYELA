"use client";

import { Download } from "lucide-react";

export function AdminDownloadButton({
  data,
  filename,
  label = "Exportar dados"
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  filename: string;
  label?: string;
}) {
  function download() {
    const rows = Array.isArray(data) ? data : [data];
    const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const csv = [
      keys.map(csvCell).join(","),
      ...rows.map((row) => keys.map((key) => csvCell(row[key])).join(","))
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="admin-secondary-button" onClick={download} type="button">
      <Download aria-hidden="true" size={17} />
      {label}
    </button>
  );
}

function csvCell(value: unknown): string {
  const serialized =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return `"${serialized.replaceAll('"', '""')}"`;
}
