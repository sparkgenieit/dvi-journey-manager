// FILE: src/pages/Settings/HotelCategory.tsx

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getHotelCategories,
  createHotelCategory,
  updateHotelCategory,
  deleteHotelCategory,
  HotelCategory,
} from "@/services/settings";

export const HotelCategoryPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<HotelCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HotelCategory | null>(null);
  const [formData, setFormData] = useState({
    hotel_category: "",
    category_title: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getHotelCategories();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load hotel categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({
      hotel_category: "",
      category_title: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: HotelCategory) => {
    setEditingCategory(category);
    setFormData({
      hotel_category: String(category.hotel_category),
      category_title: category.category_title,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.hotel_category || !formData.category_title) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        hotel_category: Number(formData.hotel_category),
        category_title: formData.category_title,
      };

      if (editingCategory) {
        await updateHotelCategory(editingCategory.hotel_category_id, payload);
        toast({
          description: "Hotel category updated successfully",
        });
      } else {
        await createHotelCategory(payload);
        toast({
          description: "Hotel category created successfully",
        });
      }

      setIsDialogOpen(false);
      loadCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingCategory ? "update" : "create"} hotel category`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this hotel category?")) {
      return;
    }

    try {
      await deleteHotelCategory(categoryId);
      toast({
        description: "Hotel category deleted successfully",
      });
      loadCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete hotel category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#4a4260]">Hotel Categories</h1>
          <p className="text-sm text-gray-500">Manage hotel category types</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-[#ff68b4] to-[#9b5cff]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category ID</TableHead>
                <TableHead>Hotel Category</TableHead>
                <TableHead>Category Title</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No hotel categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.hotel_category_id}>
                    <TableCell>{category.hotel_category_id}</TableCell>
                    <TableCell>{category.hotel_category}</TableCell>
                    <TableCell>{category.category_title}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.hotel_category_id)}
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
              {editingCategory ? "Edit Hotel Category" : "Add New Hotel Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update hotel category information"
                : "Create a new hotel category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Hotel Category (Number) *</Label>
              <Input
                type="number"
                value={formData.hotel_category}
                onChange={(e) =>
                  setFormData({ ...formData, hotel_category: e.target.value })
                }
                placeholder="e.g., 1, 2, 3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter category level (1=Budget, 2=Standard, 3=Premium, etc.)
              </p>
            </div>

            <div>
              <Label>Category Title *</Label>
              <Input
                value={formData.category_title}
                onChange={(e) =>
                  setFormData({ ...formData, category_title: e.target.value })
                }
                placeholder="e.g., Budget, Standard, Premium"
              />
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
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
