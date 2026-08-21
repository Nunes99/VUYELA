import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export type TableAlignment = "left" | "center" | "right";

export interface TableColumn<Row> {
  key: string;
  header: string;
  align?: TableAlignment;
  render: (row: Row) => ReactNode;
}

export interface TableProps<Row> extends HTMLAttributes<HTMLDivElement> {
  columns: TableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, index: number) => string;
  emptyLabel?: string | undefined;
}

export function Table<Row>({
  columns,
  rows,
  getRowKey,
  emptyLabel = "Sem dados para apresentar.",
  className = "",
  ...props
}: TableProps<Row>) {
  return (
    <div className={["vy-table-wrap", className].filter(Boolean).join(" ")} {...props}>
      <table className="vy-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} data-align={column.align ?? "left"}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <td key={column.key} data-align={column.align ?? "left"}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>{emptyLabel}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface DataTableProps<Row> extends TableProps<Row> {
  title: string;
  description?: string | undefined;
  toolbar?: ReactNode;
}

export function DataTable<Row>({
  title,
  description,
  toolbar,
  columns,
  rows,
  getRowKey,
  emptyLabel,
  className = "",
  ...props
}: DataTableProps<Row>) {
  return (
    <section className={["vy-data-table", className].filter(Boolean).join(" ")} {...props}>
      <header className="vy-data-table__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {toolbar ? <div className="vy-data-table__toolbar">{toolbar}</div> : null}
      </header>
      <Table columns={columns} rows={rows} getRowKey={getRowKey} emptyLabel={emptyLabel} />
    </section>
  );
}

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  page: number;
  pageCount: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function Pagination({
  page,
  pageCount,
  onPrevious,
  onNext,
  className = "",
  ...props
}: PaginationProps) {
  return (
    <nav
      className={["vy-pagination", className].filter(Boolean).join(" ")}
      aria-label="Páginação"
      {...props}
    >
      <button type="button" onClick={onPrevious} disabled={page <= 1}>
        Anterior
      </button>
      <span>
        Página {page} de {pageCount}
      </span>
      <button type="button" onClick={onNext} disabled={page >= pageCount}>
        Seguinte
      </button>
    </nav>
  );
}

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function SearchInput({ label = "Pesquisar", className = "", ...props }: SearchInputProps) {
  return (
    <label className={["vy-search", className].filter(Boolean).join(" ")}>
      <span className="vy-sr-only">{label}</span>
      <input type="search" placeholder={label} {...props} />
    </label>
  );
}

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  actions?: ReactNode;
}

export function FilterBar({ children, actions, className = "", ...props }: FilterBarProps) {
  return (
    <div className={["vy-filter-bar", className].filter(Boolean).join(" ")} {...props}>
      <div className="vy-filter-bar__controls">{children}</div>
      {actions ? <div className="vy-filter-bar__actions">{actions}</div> : null}
    </div>
  );
}
