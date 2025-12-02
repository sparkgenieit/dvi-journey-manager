import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteModal } from "@/components/hotspot/DeleteModal";
import { hotspotService } from "@/services/hotspotService";
import { Hotspot } from "@/types/hotspot";
import { toast } from "sonner";

export default function HotspotList() {
  const navigate = useNavigate();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [filteredHotspots, setFilteredHotspots] = useState<Hotspot[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadHotspots();
  }, []);

  useEffect(() => {
    const filtered = hotspots.filter(
      (h) =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.locations.some((loc) => loc.toLowerCase().includes(search.toLowerCase()))
    );
    setFilteredHotspots(filtered);
    setCurrentPage(1);
  }, [search, hotspots]);

  const loadHotspots = async () => {
    const data = await hotspotService.listHotspots();
    setHotspots(data);
    setFilteredHotspots(data);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await hotspotService.deleteHotspot(deleteId);
    toast.success("Hotspot deleted successfully");
    setDeleteId(null);
    loadHotspots();
  };

  const handlePriorityChange = async (id: string, priority: number) => {
    await hotspotService.updateHotspot(id, { priority });
    loadHotspots();
  };

  const paginatedData = filteredHotspots.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredHotspots.length / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">List of Hotspot</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/hotspots/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hotspot
          </Button>
          <Button variant="outline">Parking charges</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <Input
              className="w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button size="sm" variant="outline">
              Copy
            </Button>
            <Button size="sm" variant="outline">
              Excel
            </Button>
            <Button size="sm" variant="outline">
              CSV
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.NO</TableHead>
              <TableHead>ACTION</TableHead>
              <TableHead>HOTSPOT IMAGE</TableHead>
              <TableHead>HOTSPOT NAME</TableHead>
              <TableHead>HOTSPOT PRIORITY</TableHead>
              <TableHead>HOTSPOT PLACE</TableHead>
              <TableHead>LOCAL PERSON</TableHead>
              <TableHead>FOREIGN PERSON</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((hotspot, index) => (
              <TableRow key={hotspot.id}>
                <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/hotspots/${hotspot.id}/preview`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/hotspots/${hotspot.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(hotspot.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <img
                    src={hotspot.galleryImages[0] || "/placeholder.svg"}
                    alt={hotspot.name}
                    className="h-12 w-16 object-cover rounded"
                  />
                </TableCell>
                <TableCell>{hotspot.name}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={hotspot.priority}
                    onChange={(e) =>
                      handlePriorityChange(hotspot.id, Number(e.target.value))
                    }
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    {hotspot.locations.slice(0, 3).map((loc, i) => (
                      <div key={i}>{loc}</div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Adult - ₹{hotspot.adultCost}</div>
                    <div>Children - ₹{hotspot.childCost}</div>
                    <div>Infants - ₹{hotspot.infantCost}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Adult - ₹{hotspot.foreignAdultCost}</div>
                    <div>Children - ₹{hotspot.foreignChildCost}</div>
                    <div>Infants - ₹{hotspot.foreignInfantCost}</div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredHotspots.length)} of{" "}
            {filteredHotspots.length} entries
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            {totalPages > 5 && <span className="px-2">...</span>}
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <DeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
