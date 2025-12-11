// src/pages/agent/AgentListPage.tsx

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Download, Copy as CopyIcon, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AgentAPI } from "@/services/agentService";
import type { AgentListRow } from "@/types/agent";

export default function AgentListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AgentListRow[]>([]);
  const [filtered, setFiltered] = useState<AgentListRow[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AgentAPI.list();
      setRows(data);
      setFiltered(data);
    } catch { toast.error("Failed to load agents"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)));
    setCurrentPage(1);
  }, [search, rows]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Agent</h1>
        <div className="text-sm text-muted-foreground">Dashboard &gt; Agent</div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">List of Agent</h2>
          <Button variant="outline" className="border-primary text-primary">
            <Download className="mr-2 h-4 w-4" /> Download Voucher
          </Button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entries</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">Search:</span>
            <Input className="w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="inline-flex items-center rounded-md px-3 py-1.5 text-sm border border-violet-300 text-violet-700 hover:bg-violet-50"><CopyIcon className="mr-1.5 h-4 w-4" />Copy</button>
            <button className="inline-flex items-center rounded-md px-3 py-1.5 text-sm border border-emerald-400 text-emerald-600 hover:bg-emerald-50"><FileSpreadsheet className="mr-1.5 h-4 w-4" />Excel</button>
            <button className="inline-flex items-center rounded-md px-3 py-1.5 text-sm border border-gray-300 text-gray-600 hover:bg-gray-50"><FileText className="mr-1.5 h-4 w-4" />CSV</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.NO</TableHead>
                <TableHead>ACTION</TableHead>
                <TableHead>AGENT NAME</TableHead>
                <TableHead>AGENT EMAIL</TableHead>
                <TableHead>MOBILE NUMBER</TableHead>
                <TableHead>TRAVEL EXPERT</TableHead>
                <TableHead>CITY</TableHead>
                <TableHead>STATE</TableHead>
                <TableHead>NATIONALITY</TableHead>
                <TableHead>SUBS.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={10}>Loading…</TableCell></TableRow> :
               paginated.length === 0 ? <TableRow><TableCell colSpan={10}>No agents found</TableCell></TableRow> :
               paginated.map((r, idx) => (
                <TableRow key={r.id}>
                  <TableCell>{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => navigate(`/agent/${r.id}/edit`)}><Eye className="h-4 w-4 text-gray-500" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => navigate(`/agent/${r.id}/edit`)}><Pencil className="h-4 w-4 text-gray-500" /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.email}</TableCell>
                  <TableCell>{r.mobileNumber}</TableCell>
                  <TableCell>{r.travelExpert}</TableCell>
                  <TableCell>{r.city}</TableCell>
                  <TableCell>{r.state}</TableCell>
                  <TableCell>{r.nationality}</TableCell>
                  <TableCell>{r.subscriptionType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filtered.length > 0 ? `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries` : "No entries"}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
            {[1,2,3,4,5].filter(p => p <= totalPages).map(p => (
              <Button key={p} size="sm" variant={currentPage === p ? "default" : "outline"} className={currentPage === p ? "bg-violet-500" : ""} onClick={() => setCurrentPage(p)}>{p}</Button>
            ))}
            {totalPages > 5 && <span className="px-2">…</span>}
            {totalPages > 5 && <Button size="sm" variant="outline" onClick={() => setCurrentPage(totalPages)}>{totalPages}</Button>}
            <Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
