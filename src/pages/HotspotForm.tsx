import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { hotspotService } from "@/services/hotspotService";
import { Hotspot } from "@/types/hotspot";
import { toast } from "sonner";

const AVAILABLE_LOCATIONS = [
  "Mangalore, Central",
  "Mangalore, Bus Stop",
  "Mangalore, Railway Station",
  "Mangalore, Bus Stop, Bejai",
  "Mangalore, Karnataka, India",
  "Mangalore, international Airport",
  "Mangalore, Railway Station, Attavar",
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function HotspotForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Hotspot>>({
    name: "",
    type: "Tourist Attraction",
    priority: 0,
    description: "",
    landmark: "",
    address: "",
    adultCost: 0,
    childCost: 0,
    infantCost: 0,
    foreignAdultCost: 0,
    foreignChildCost: 0,
    foreignInfantCost: 0,
    rating: 0,
    duration: "01:00",
    latitude: "",
    longitude: "",
    videoUrl: "",
    locations: [],
    galleryImages: [],
    parkingCharges: {
      sedan: 0,
      innova: 0,
      innovaCrysta6: 0,
      tempoTraveller12: 0,
      muv6: 0,
      innova7: 0,
      innovaCrysta7: 0,
      benz26: 0,
      leyland36: 0,
      leyland40: 0,
      benzLarge45: 0,
      volvo43: 0,
    },
    openingHours: DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { is24Hours: true, timeSlots: [] }
    }), {}),
  });

  useEffect(() => {
    if (isEdit && id) {
      loadHotspot(id);
    }
  }, [id, isEdit]);

  const loadHotspot = async (hotspotId: string) => {
    const data = await hotspotService.getHotspot(hotspotId);
    if (data) setFormData(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && id) {
        await hotspotService.updateHotspot(id, formData);
        toast.success("Hotspot updated successfully");
      } else {
        await hotspotService.createHotspot(formData as Omit<Hotspot, "id">);
        toast.success("Hotspot saved successfully");
      }
      navigate("/hotspots");
    } catch (error) {
      toast.error("Failed to save hotspot");
    }
  };

  const toggleLocation = (location: string) => {
    const current = formData.locations || [];
    if (current.includes(location)) {
      setFormData({ ...formData, locations: current.filter(l => l !== location) });
    } else {
      setFormData({ ...formData, locations: [...current, location] });
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-primary">Basic Info</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Hotspot Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Hotspot Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tourist Attraction">Tourist Attraction</SelectItem>
                  <SelectItem value="Temple">Temple</SelectItem>
                  <SelectItem value="Museum">Museum</SelectItem>
                  <SelectItem value="Beach">Beach</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adultCost">Adult Entry Cost (₹)</Label>
              <Input
                id="adultCost"
                type="number"
                value={formData.adultCost}
                onChange={(e) => setFormData({ ...formData, adultCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="childCost">Child Entry Cost (₹)</Label>
              <Input
                id="childCost"
                type="number"
                value={formData.childCost}
                onChange={(e) => setFormData({ ...formData, childCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="infantCost">Infant Entry Cost (₹)</Label>
              <Input
                id="infantCost"
                type="number"
                value={formData.infantCost}
                onChange={(e) => setFormData({ ...formData, infantCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="foreignAdultCost">Foreign Adult Entry Cost (₹)</Label>
              <Input
                id="foreignAdultCost"
                type="number"
                value={formData.foreignAdultCost}
                onChange={(e) => setFormData({ ...formData, foreignAdultCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="foreignChildCost">Foreign Child Entry Cost (₹)</Label>
              <Input
                id="foreignChildCost"
                type="number"
                value={formData.foreignChildCost}
                onChange={(e) => setFormData({ ...formData, foreignChildCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="foreignInfantCost">Foreign Infant Entry Cost (₹)</Label>
              <Input
                id="foreignInfantCost"
                type="number"
                value={formData.foreignInfantCost}
                onChange={(e) => setFormData({ ...formData, foreignInfantCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="rating">Rating *</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Hotspot Priority *</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="landmark">Hotspot Landmark *</Label>
              <Input
                id="landmark"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Hotspot Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="videoUrl">Hotspot Video URL *</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Hotspot Gallery</Label>
            <Input type="file" multiple accept="image/*" />
            <div className="mt-2">
              <p className="text-sm font-medium mb-2">Uploaded hotspot Gallery</p>
              <div className="flex gap-2">
                {formData.galleryImages?.map((img, i) => (
                  <img key={i} src={img} alt="" className="h-20 w-20 object-cover rounded" />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Hotspot Location *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_LOCATIONS.map((loc) => (
                <Badge
                  key={loc}
                  variant={formData.locations?.includes(loc) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleLocation(loc)}
                >
                  {loc}
                  {formData.locations?.includes(loc) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Vehicle Parking Charge Details */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-primary">Vehicle Parking Charge Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(formData.parkingCharges || {}).map(([key, value]) => (
              <div key={key}>
                <Label className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parkingCharges: {
                        ...formData.parkingCharges!,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-primary">Opening Hours</h2>
          <div className="space-y-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4 p-3 border rounded">
                <span className="w-24 capitalize font-medium">{day}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Opens 24 Hours</Label>
                  <Switch
                    checked={formData.openingHours?.[day]?.is24Hours}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        openingHours: {
                          ...formData.openingHours!,
                          [day]: { ...formData.openingHours![day], is24Hours: checked },
                        },
                      })
                    }
                  />
                </div>
                <Badge variant="secondary">
                  {formData.openingHours?.[day]?.is24Hours ? "Opens 24 Hours" : "Custom Hours"}
                </Badge>
                <Button type="button" size="sm" variant="outline">
                  Add More
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => navigate("/hotspots")}>
            Back
          </Button>
          <Button type="submit">{isEdit ? "Update" : "Save"}</Button>
        </div>
      </form>
    </div>
  );
}
