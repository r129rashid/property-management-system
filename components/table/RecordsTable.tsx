"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Pencil,
  ArrowUpDown,
  Search,
  Download,
  Columns,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  FileText,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RecordForm } from "@/components/forms/RecordForm"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { AddColumnDialog } from "./AddColumnDialog"
import { createClient } from "@/lib/supabase/client"
import {
  cn,
  formatCurrency,
  maskAadhar,
  getRecordStatus,
  formatDueDay,
  formatDate,
} from "@/lib/utils"
import { generatePDF } from "@/lib/pdf"
import type { RecordRow, CustomColumnRow, Json, RentPaymentRow } from "@/types/database"
import type { RecordFormData } from "@/lib/validations/record"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  paid: {
    label: "Paid",
    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  "due-soon": {
    label: "Due Soon",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  overdue: {
    label: "Overdue",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  excused: {
    label: "Excused",
    cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  carried: {
    label: "Carried Fwd",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
} as const

type EffectiveStatus = keyof typeof STATUS_CONFIG

function getEffectiveStatus(rec: RecordRow, payment?: RentPaymentRow): EffectiveStatus {
  if (payment?.excused) return "excused"
  if (payment?.notes === "carried") return "carried"
  if (payment?.paid) return "paid"
  return getRecordStatus(rec.due_day, rec.amount_paid)
}

// ─── Payment History Dialog ───────────────────────────────────────────────────
function PaymentHistoryDialog({
  record,
  open,
  onClose,
}: {
  record: RecordRow | null
  open: boolean
  onClose: () => void
}) {
  const supabase = createClient()
  const [payments, setPayments] = useState<RentPaymentRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !record) return
    setLoading(true)
    supabase
      .from("rent_payments")
      .select("*")
      .eq("record_id", record.id)
      .order("month", { ascending: false })
      .then(({ data }) => {
        setPayments(data ?? [])
        setLoading(false)
      })
  }, [open, record?.id])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            {record?.tenant_name} · {record?.property_name}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No payment history yet. Use the Admin console to generate monthly entries.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs">Month</TableHead>
                <TableHead className="text-xs">Amount Due</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Paid On</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                let statusLabel = "Unpaid"
                let statusCls =
                  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                if (p.paid) {
                  statusLabel = "Paid"
                  statusCls =
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                } else if (p.excused) {
                  statusLabel = "Excused"
                  statusCls =
                    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                } else if (p.notes === "carried") {
                  statusLabel = "Carried Fwd"
                  statusCls =
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                } else if (p.carried_from) {
                  statusLabel = "Carry-in"
                  statusCls =
                    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                }
                return (
                  <TableRow key={p.id} className="border-b border-border/30">
                    <TableCell className="text-sm font-medium py-3">{p.month}</TableCell>
                    <TableCell className="text-sm py-3 font-semibold">
                      {formatCurrency(p.amount_due)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={cn("border-0 text-xs", statusCls)}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm py-3 text-muted-foreground">
                      {p.paid_on ? formatDate(p.paid_on) : "—"}
                    </TableCell>
                    <TableCell className="text-xs py-3 text-muted-foreground">
                      {p.carried_from ? "Carried from prev. month" : (p.notes ?? "—")}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Activity log helper ──────────────────────────────────────────────────────
function logActivity(action: string) {
  try {
    const log = JSON.parse(localStorage.getItem("pms_activity_log") ?? "[]") as {
      message: string
      timestamp: string
    }[]
    log.unshift({ message: action, timestamp: new Date().toISOString() })
    localStorage.setItem("pms_activity_log", JSON.stringify(log.slice(0, 20)))
  } catch {}
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface RecordsTableProps {
  initialRecords: RecordRow[]
  customColumns: CustomColumnRow[]
  userId: string
  currentMonthPayments?: Record<string, RentPaymentRow>
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RecordsTable({
  initialRecords,
  customColumns: initCols,
  userId,
  currentMonthPayments = {},
}: RecordsTableProps) {
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Data state
  const [records, setRecords] = useState<RecordRow[]>(initialRecords)
  const [customColumns, setCustomColumns] = useState<CustomColumnRow[]>(initCols)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "overdue">(() => {
    const s = searchParams.get("status")
    if (s === "overdue" || s === "paid" || s === "unpaid") return s
    return "all"
  })
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // UI state
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<RecordRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [historyRecord, setHistoryRecord] = useState<RecordRow | null>(null)

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const status = getEffectiveStatus(r, currentMonthPayments[r.id])
      if (statusFilter === "paid" && status !== "paid") return false
      if (statusFilter === "unpaid" && (status === "paid" || status === "excused")) return false
      if (statusFilter === "overdue" && status !== "overdue") return false
      return true
    })
  }, [records, statusFilter, currentMonthPayments])

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<RecordRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "property_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-medium"
            onClick={() => column.toggleSorting()}
          >
            Property <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.property_name}</span>
        ),
      },
      {
        accessorKey: "tenant_name",
        header: "Tenant",
      },
      {
        accessorKey: "contact_number",
        header: "Contact",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.contact_number}</span>
        ),
      },
      {
        accessorKey: "aadhar_number",
        header: "Aadhar",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{maskAadhar(row.original.aadhar_number)}</span>
        ),
      },
      {
        accessorKey: "rent_amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-medium"
            onClick={() => column.toggleSorting()}
          >
            Rent <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{formatCurrency(row.original.rent_amount)}</span>
        ),
      },
      {
        accessorKey: "due_day",
        header: "Due Day",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDueDay(row.original.due_day)} of month
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = getEffectiveStatus(row.original, currentMonthPayments[row.original.id])
          const cfg = STATUS_CONFIG[s]
          return (
            <Badge className={cn("text-xs font-medium border-0", cfg.cls)}>
              {cfg.label}
            </Badge>
          )
        },
      },
      // Dynamic custom columns
      ...customColumns.map<ColumnDef<RecordRow>>((col) => ({
        id: `cf_${col.id}`,
        header: col.name,
        cell: ({ row }) => {
          const val = (row.original.custom_fields as Record<string, unknown>)?.[col.id]
          if (col.data_type === "boolean") return val ? "Yes" : "No"
          if (col.data_type === "date" && val) return formatDate(String(val))
          return val !== undefined && val !== null ? String(val) : "—"
        },
      })),
      {
        id: "actions",
        cell: ({ row }) => {
          const rec = row.original
          const status = getEffectiveStatus(rec, currentMonthPayments[rec.id])
          const isActionable = status !== "paid" && status !== "excused" && status !== "carried"
          return (
            <div className="flex items-center gap-1">
              {isActionable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
                  onClick={() => handleMarkPaid(rec.id)}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark as paid
                </Button>
              ) : status === "paid" ? (
                <span className="flex items-center gap-1 px-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Paid
                </span>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-3.5 w-3.5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditRecord(rec)
                      setShowForm(true)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHistoryRecord(rec)}>
                    <History className="h-3.5 w-3.5 mr-2" />
                    Payment History
                  </DropdownMenuItem>
                  {isActionable ? (
                    <DropdownMenuItem
                      className="text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
                      onClick={() => handleMarkPaid(rec.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                      Mark as paid
                    </DropdownMenuItem>
                  ) : status === "paid" ? (
                    <DropdownMenuItem onClick={() => handleMarkUnpaid(rec.id)}>
                      <XCircle className="h-3.5 w-3.5 mr-2" />
                      Mark as unpaid
                    </DropdownMenuItem>
                  ) : null}
                  {status === "paid" && (
                    <DropdownMenuItem onClick={() => generatePDF(rec)}>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Download receipt
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem disabled>
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Generate agreement
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteId(rec.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [customColumns, currentMonthPayments]
  )

  // ── Table instance ────────────────────────────────────────────────────────
  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreate = async (
    data: RecordFormData & { custom_fields: Record<string, unknown> }
  ) => {
    setFormLoading(true)
    const { custom_fields, ...rest } = data
    const { data: newRec, error } = await supabase
      .from("records")
      .insert({ ...rest, user_id: userId, custom_fields: custom_fields as Json })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      setFormLoading(false)
      return
    }
    setRecords((prev) => [newRec, ...prev])
    logActivity(`Created record for ${data.tenant_name}`)
    toast.success("Record created")
    setShowForm(false)
    setFormLoading(false)
  }

  const handleUpdate = async (
    data: RecordFormData & { custom_fields: Record<string, unknown> }
  ) => {
    if (!editRecord) return
    setFormLoading(true)
    const { custom_fields, ...rest } = data
    const { data: updated, error } = await supabase
      .from("records")
      .update({ ...rest, custom_fields: custom_fields as Json })
      .eq("id", editRecord.id)
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      setFormLoading(false)
      return
    }
    setRecords((prev) =>
      prev.map((r) => (r.id === editRecord.id ? updated : r))
    )
    logActivity(`Updated record for ${data.tenant_name}`)
    toast.success("Record updated")
    setShowForm(false)
    setEditRecord(null)
    setFormLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    const deleted = records.find((r) => r.id === deleteId)
    const { error } = await supabase.from("records").delete().eq("id", deleteId)
    if (error) {
      toast.error(error.message)
      setDeleteLoading(false)
      return
    }
    setRecords((prev) => prev.filter((r) => r.id !== deleteId))
    logActivity(`Deleted record for ${deleted?.tenant_name}`)
    toast.success("Record deleted")
    setDeleteId(null)
    setDeleteLoading(false)
  }

  const handleBulkPaid = async () => {
    const selectedIds = Object.keys(rowSelection)
      .map((i) => filteredRecords[Number(i)]?.id)
      .filter(Boolean) as string[]
    if (!selectedIds.length) return
    const { error } = await supabase
      .from("records")
      .update({ amount_paid: true })
      .in("id", selectedIds)
    if (error) { toast.error(error.message); return }
    setRecords((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) ? { ...r, amount_paid: true } : r))
    )
    setRowSelection({})
    toast.success(`${selectedIds.length} record(s) marked as paid`)
    logActivity(`Bulk marked ${selectedIds.length} records as paid`)
  }

  const handleMarkPaid = async (id: string) => {
    const rec = records.find((r) => r.id === id)
    const { error } = await supabase
      .from("records")
      .update({ amount_paid: true })
      .eq("id", id)
    if (error) { toast.error(error.message); return }
    // Sync to rent_payments if an entry exists for current month
    const payment = currentMonthPayments[id]
    if (payment && !payment.paid) {
      const today = new Date().toISOString().split("T")[0]
      await supabase.from("rent_payments")
        .update({ paid: true, paid_on: today })
        .eq("id", payment.id)
    }
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, amount_paid: true } : r)))
    toast.success("Marked as paid")
    logActivity(`Marked ${rec?.tenant_name} as paid`)
  }

  const handleMarkUnpaid = async (id: string) => {
    const rec = records.find((r) => r.id === id)
    const { error } = await supabase
      .from("records")
      .update({ amount_paid: false })
      .eq("id", id)
    if (error) { toast.error(error.message); return }
    // Sync to rent_payments if an entry exists for current month
    const payment = currentMonthPayments[id]
    if (payment?.paid) {
      await supabase.from("rent_payments")
        .update({ paid: false, paid_on: null })
        .eq("id", payment.id)
    }
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, amount_paid: false } : r)))
    toast.success("Marked as unpaid")
    logActivity(`Marked ${rec?.tenant_name} as unpaid`)
  }

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 shrink-0">
          {selectedCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkPaid} className="h-9">
              Mark {selectedCount} paid
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setShowAddColumn(true)}
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Columns</span>
          </Button>
          <Button
            size="sm"
            className="h-9 bg-indigo-500 hover:bg-indigo-600 text-white"
            onClick={() => {
              setEditRecord(null)
              setShowForm(true)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Record
          </Button>
        </div>
      </div>

      {/* ── Desktop table ────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40 border-b border-border/50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs py-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    No records match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ delay: i * 0.025, duration: 0.15 }}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile cards ─────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          filteredRecords.map((rec) => {
            const status = getEffectiveStatus(rec, currentMonthPayments[rec.id])
            const cfg = STATUS_CONFIG[status]
            const isActionable = status !== "paid" && status !== "excused" && status !== "carried"
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/50 bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{rec.property_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{rec.tenant_name}</p>
                  </div>
                  <Badge className={cn("text-xs border-0 shrink-0", cfg.cls)}>
                    {cfg.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(rec.rent_amount)}
                  </span>
                  <span>Due on {formatDueDay(rec.due_day)}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => {
                      setEditRecord(rec)
                      setShowForm(true)
                    }}
                  >
                    Edit
                  </Button>
                  {isActionable ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-emerald-600 border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
                      onClick={() => handleMarkPaid(rec.id)}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Mark as paid
                    </Button>
                  ) : status === "paid" ? (
                    <span className="flex items-center gap-1 px-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Paid
                    </span>
                  ) : null}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 px-0 shrink-0">
                        <MoreVertical className="h-3 w-3" />
                        <span className="sr-only">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setHistoryRecord(rec)}>
                        <History className="h-3.5 w-3.5 mr-2" />
                        Payment History
                      </DropdownMenuItem>
                      {isActionable ? (
                        <DropdownMenuItem
                          className="text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
                          onClick={() => handleMarkPaid(rec.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                          Mark as paid
                        </DropdownMenuItem>
                      ) : status === "paid" ? (
                        <>
                          <DropdownMenuItem onClick={() => handleMarkUnpaid(rec.id)}>
                            <XCircle className="h-3.5 w-3.5 mr-2" />
                            Mark as unpaid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generatePDF(rec)}>
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Download receipt
                          </DropdownMenuItem>
                        </>
                      ) : null}
                      <DropdownMenuItem disabled>
                        <FileText className="h-3.5 w-3.5 mr-2" />
                        Generate agreement
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(rec.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Empty state — desktop */}
      {records.length === 0 && (
        <div className="hidden md:block">
          <EmptyState onAdd={() => setShowForm(true)} />
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} record(s)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs px-2">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <RecordForm
        open={showForm}
        onOpenChange={(o) => {
          setShowForm(o)
          if (!o) setEditRecord(null)
        }}
        onSubmit={editRecord ? handleUpdate : handleCreate}
        defaultValues={editRecord ?? undefined}
        customColumns={customColumns}
        loading={formLoading}
        mode={editRecord ? "edit" : "create"}
      />

      <PaymentHistoryDialog
        record={historyRecord}
        open={!!historyRecord}
        onClose={() => setHistoryRecord(null)}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null) }}
        title="Delete record?"
        description="This action cannot be undone. All data for this record will be permanently deleted."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <AddColumnDialog
        open={showAddColumn}
        onOpenChange={setShowAddColumn}
        userId={userId}
        onColumnAdded={(col) => setCustomColumns((prev) => [...prev, col])}
        onColumnDeleted={(id) =>
          setCustomColumns((prev) => prev.filter((c) => c.id !== id))
        }
        existingColumns={customColumns}
      />
    </div>
  )
}
