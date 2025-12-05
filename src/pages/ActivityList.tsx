import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2, Copy, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Activity } from "@/types/activity";
import { activityService } from "@/services/activityService";
import { DeleteActivityModal } from "@/components/activity/DeleteActivityModal";
import { toast } from "sonner";

const ActivityList = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    activity: Activity | null;
  }>({ open: false, activity: null });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    const data = await activityService.listActivities();
    setActivities(data);
    setLoading(false);
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.hotspot.toLowerCase().includes(search.toLowerCase()) ||
        a.hotspotPlace.toLowerCase().includes(search.toLowerCase())
    );
  }, [activities, search]);

  const totalPages = Math.ceil(filteredActivities.length / pageSize);
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  const handleStatusChange = async (id: string, status: boolean) => {
    await activityService.updateActivity(id, { status });
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const handleDelete = async () => {
    if (deleteModal.activity) {
      await activityService.deleteActivity(deleteModal.activity.id);
      setActivities((prev) =>
        prev.filter((a) => a.id !== deleteModal.activity?.id)
      );
      toast.success("Activity deleted successfully");
      setDeleteModal({ open: false, activity: null });
    }
  };

  const handleCopy = () => {
    console.log("Copy clicked");
    toast.info("Copy functionality - coming soon");
  };

  const handleExcel = () => {
    console.log("Excel export clicked");
    toast.info("Excel export - coming soon");
  };

  const handleCSV = () => {
    console.log("CSV export clicked");
    toast.info("CSV export - coming soon");
  };

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, 4, 5);
      if (totalPages > 6) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={idx} className="px-2">
              ...
            </span>
          ) : (
            <Button
              key={idx}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className={
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : ""
              }
              onClick={() => setCurrentPage(page as number)}
            >
              {page}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, filteredActivities.length);

  return (
    <div className="p-6 bg-pink-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">List of Activity</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="text-primary hover:underline">
            Dashboard
          </Link>
          <span>&gt;</span>
          <span className="text-primary">List of Activity</span>
        </div>
      </div>

      {/* Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-medium">List of Activity</CardTitle>
          <Button
            onClick={() => navigate("/activities/new")}
            className="bg-primary hover:bg-primary/90"
          >
            + Add Activity
          </Button>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
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
              <span className="text-sm text-gray-600">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Search:</span>
              <Input
                placeholder=""
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-48"
              />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={handleExcel}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleCSV}>
                <FileText className="w-4 h-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">S.NO</TableHead>
                  <TableHead className="font-semibold">ACTION</TableHead>
                  <TableHead className="font-semibold">ACTIVITY TITLE</TableHead>
                  <TableHead className="font-semibold">HOTSPOT</TableHead>
                  <TableHead className="font-semibold">HOTSPOT PLACE</TableHead>
                  <TableHead className="font-semibold">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedActivities.map((activity, index) => (
                    <TableRow key={activity.id} className="hover:bg-gray-50">
                      <TableCell>
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                            onClick={() =>
                              navigate(`/activities/${activity.id}/edit?tab=preview&readonly=true`)
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-800"
                            onClick={() =>
                              navigate(`/activities/${activity.id}/edit`)
                            }
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                            onClick={() =>
                              setDeleteModal({ open: true, activity })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-primary font-medium">
                        {activity.title}
                      </TableCell>
                      <TableCell>{activity.hotspot}</TableCell>
                      <TableCell>{activity.hotspotPlace}</TableCell>
                      <TableCell>
                        <Switch
                          checked={activity.status}
                          onCheckedChange={(checked) =>
                            handleStatusChange(activity.id, checked)
                          }
                          className="data-[state=checked]:bg-primary"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              Showing {startEntry} to {endEntry} of {filteredActivities.length}{" "}
              entries
            </span>
            {renderPagination()}
          </div>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <DeleteActivityModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, activity: null })}
        onConfirm={handleDelete}
        activityTitle={deleteModal.activity?.title}
      />
    </div>
  );
};

export default ActivityList;
