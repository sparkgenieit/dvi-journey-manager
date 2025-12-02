import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { hotspotService } from "@/services/hotspotService";
import { Hotspot } from "@/types/hotspot";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function HotspotPreview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);

  useEffect(() => {
    if (id) loadHotspot(id);
  }, [id]);

  const loadHotspot = async (hotspotId: string) => {
    const data = await hotspotService.getHotspot(hotspotId);
    if (data) setHotspot(data);
  };

  if (!hotspot) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Hotspot Details */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-primary">Hotspot Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Hotspot Type</p>
                <p className="font-medium">{hotspot.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hotspot Name</p>
                <p className="font-medium">{hotspot.name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Hotspot Place</p>
                <p className="font-medium">{hotspot.locations.join(", ")}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{hotspot.address}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{hotspot.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Landmark</p>
                <p className="font-medium">{hotspot.landmark}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adult Entry Cost</p>
                <p className="font-medium">{hotspot.adultCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Child Entry Cost</p>
                <p className="font-medium">{hotspot.childCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Infant Entry Cost</p>
                <p className="font-medium">{hotspot.infantCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Foreigner Adult Entry Cost</p>
                <p className="font-medium">{hotspot.foreignAdultCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Foreigner Child Entry Cost</p>
                <p className="font-medium">{hotspot.foreignChildCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Foreigner Infant Entry Cost</p>
                <p className="font-medium">{hotspot.foreignInfantCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-medium">{hotspot.rating}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Hotspot Video URL</p>
                <p className="font-medium text-blue-600 break-all">{hotspot.videoUrl}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Hotspot Images</p>
            <div className="space-y-2">
              {hotspot.galleryImages.map((img, i) => (
                <img key={i} src={img} alt="" className="w-full rounded border" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Parking Charge Details */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold text-primary">Vehicle Parking Charge Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(hotspot.parkingCharges).map(([key, value]) => (
            <div key={key}>
              <p className="text-sm text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="font-medium">{value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Location & Opening Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-primary">Location</h2>
          <p className="text-sm font-medium">
            {hotspot.latitude}°N {hotspot.longitude}°E
          </p>
          <div className="w-full h-64 bg-gray-200 rounded border">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              src={`https://www.google.com/maps?q=${hotspot.latitude},${hotspot.longitude}&output=embed`}
              title="Map"
            />
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-primary">Opening Hours</h2>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const dayKey = day.toLowerCase();
              const hours = hotspot.openingHours[dayKey];
              return (
                <div key={day} className="flex justify-between py-2 border-b">
                  <span className="font-medium">{day}</span>
                  <span className="text-primary">
                    {hours?.is24Hours ? "Open 24 Hours" : "Custom Hours"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => navigate("/hotspots")}>Back</Button>
      </div>
    </div>
  );
}
