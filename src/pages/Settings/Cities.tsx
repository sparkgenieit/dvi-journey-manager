// FILE: src/pages/Settings/Cities.tsx

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  getCities,
  getStates,
  createCity,
  updateCity,
  deleteCity,
  City,
  State,
} from "@/services/settings";

export const CitiesPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    city_name: "",
    state_id: "",
    status: "1",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [citiesData, statesData] = await Promise.all([
        getCities(),
        getStates(),
      ]);
      setCities(citiesData);
      setStates(statesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCity(null);
    setFormData({
      city_name: "",
      state_id: "",
      status: "1",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (city: City) => {
    setEditingCity(city);
    setFormData({
      city_name: city.city_name,
      state_id: String(city.state_id),
      status: String(city.status),
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.city_name || !formData.state_id) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        city_name: formData.city_name,
        state_id: Number(formData.state_id),
        status: Number(formData.status),
      };

      if (editingCity) {
        await updateCity(editingCity.city_id, payload);
        toast({
          description: "City updated successfully",
        });
      } else {
        await createCity(payload);
        toast({
          description: "City created successfully",
        });
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingCity ? "update" : "create"} city`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (cityId: number) => {
    if (!confirm("Are you sure you want to delete this city?")) {
      return;
    }

    try {
      await deleteCity(cityId);
      toast({
        description: "City deleted successfully",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete city",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#4a4260]">Cities</h1>
          <p className="text-sm text-gray-500">Manage cities and locations</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-[#ff68b4] to-[#9b5cff]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add City
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City ID</TableHead>
                <TableHead>City Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No cities found
                  </TableCell>
                </TableRow>
              ) : (
                cities.map((city) => (
                  <TableRow key={city.city_id}>
                    <TableCell>{city.city_id}</TableCell>
                    <TableCell>{city.city_name}</TableCell>
                    <TableCell>{city.state?.state_name || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          city.status === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {city.status === 1 ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(city)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(city.city_id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCity ? "Edit City" : "Add New City"}
            </DialogTitle>
            <DialogDescription>
              {editingCity
                ? "Update city information"
                : "Create a new city entry"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>City Name *</Label>
              <Input
                value={formData.city_name}
                onChange={(e) =>
                  setFormData({ ...formData, city_name: e.target.value })
                }
                placeholder="Enter city name"
              />
            </div>

            <div>
              <Label>State *</Label>
              <Select
                value={formData.state_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, state_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.state_id} value={String(state.state_id)}>
                      {state.state_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-[#ff68b4] to-[#9b5cff]"
            >
              {editingCity ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
