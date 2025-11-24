// FILE: src/pages/CreateItinerary/CreateItinerary.tsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ItineraryService } from "@/services/itinerary";
import { AgentOption, fetchAgents } from "@/services/accountsManagerApi";
import {
  fetchLocations,
  fetchItineraryTypes,
  fetchTravelTypes,
  fetchEntryTicketOptions,
  fetchGuideOptions,
  fetchNationalities,
  fetchFoodPreferences,
  fetchVehicleTypes,
  fetchHotelCategories,
  fetchHotelFacilities,
  fetchViaRouteForm,
  LocationOption,
  SimpleOption,
} from "@/services/itineraryDropdownsMock";
import { ItineraryPlanBlock } from "./ItineraryPlanBlock";
import { RouteDetailsBlock } from "./RouteDetailsBlock";
import { VehicleBlock } from "./VehicleBlock";
import { RoomsBlock } from "./RoomsBlock";
import { ViaRouteDialog } from "./ViaRouteDialog";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";

// ----------------- types -----------------

type RouteRow = {
  id: number;
  day: number;
  date: string;
  source: string;
  next: string;
  via: string; // comma separated hotspots for this segment
  directVisit: "Yes" | "No";
};

type VehicleRow = {
  id: number;
  type: string;
  count: number;
};

// ----------------- helpers -----------------

function toDDMMYYYY(date: Date) {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function toISOFromDDMMYYYY(dateStr: string) {
  const [d, m, y] = dateStr.split("/").map(Number);
  if (!d || !m || !y) return new Date().toISOString();
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

// "Mahabalipuram, Kanchipuram" -> ["Mahabalipuram","Kanchipuram"]
function splitViaString(via: string | undefined | null): string[] {
  if (!via) return [];
  return via
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// React-side equivalent of PHP session_id() for itinerary via-routes
const ITINERARY_SESSION_KEY = "dvi_itinerary_session_id";

function getOrCreateItinerarySessionId(): string {
  if (typeof window === "undefined") return "";
  let current = window.localStorage.getItem(ITINERARY_SESSION_KEY);
  if (!current) {
    current = `react_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(ITINERARY_SESSION_KEY, current);
  }
  return current;
}

// ----------------- main component ------------

export const CreateItinerary = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [itinerarySessionId] = useState<string>(() =>
    getOrCreateItinerarySessionId()
  );

  // agents / dropdown data
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [itineraryTypes, setItineraryTypes] = useState<SimpleOption[]>([]);
  const [travelTypes, setTravelTypes] = useState<SimpleOption[]>([]);
  const [entryTicketOptions, setEntryTicketOptions] = useState<SimpleOption[]>(
    []
  );
  const [guideOptions, setGuideOptions] = useState<SimpleOption[]>([]);
  const [nationalities, setNationalities] = useState<SimpleOption[]>([]);
  const [foodPreferences, setFoodPreferences] = useState<SimpleOption[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<SimpleOption[]>([]);
  const [hotelCategoryOptions, setHotelCategoryOptions] = useState<
    SimpleOption[]
  >([]);
  const [hotelFacilityOptions, setHotelFacilityOptions] = useState<
    SimpleOption[]
  >([]);

  // header selections
  const [itineraryPreference, setItineraryPreference] = useState<
    "vehicle" | "hotel" | "both"
  >("hotel");
  const [agentId, setAgentId] = useState<number | null>(null);

  const [arrivalLocation, setArrivalLocation] = useState("");
  const [departureLocation, setDepartureLocation] = useState("");

  const [itineraryTypeSelect, setItineraryTypeSelect] = useState("");
  const [arrivalType, setArrivalType] = useState("");
  const [departureType, setDepartureType] = useState("");
  const [entryTicketRequired, setEntryTicketRequired] = useState("");
  const [guideRequired, setGuideRequired] = useState("");
  const [nationality, setNationality] = useState("");
  const [foodPreference, setFoodPreference] = useState("");

  const [tripStartDate, setTripStartDate] = useState<string>("");
  const [tripEndDate, setTripEndDate] = useState<string>("");

  // rooms & vehicles
  type RoomRow = {
    id: number;
    roomCount: number;
    adults: number;
    children: number;
    infants: number;
    childrenDetails: {
      age: number | "";
      bedType: string;
    }[];
  };

  const [rooms, setRooms] = useState<RoomRow[]>([
    {
      id: 1,
      roomCount: 1,
      adults: 2,
      children: 0,
      infants: 0,
      childrenDetails: [],
    },
  ]);

  const [vehicles, setVehicles] = useState<VehicleRow[]>([
    {
      id: 1,
      type: "",
      count: 1,
    },
  ]);

  const [budget, setBudget] = useState<number | "">("");

  const [routeDetails, setRouteDetails] = useState<RouteRow[]>([
    {
      id: 1,
      day: 1,
      date: "",
      source: "",
      next: "",
      via: "",
      directVisit: "Yes",
    },
  ]);

  // via route dialog
  const [viaDialogOpen, setViaDialogOpen] = useState(false);
  const [activeViaRouteRow, setActiveViaRouteRow] = useState<RouteRow | null>(
    null
  );
  const [viaRoutes, setViaRoutes] = useState<SimpleOption[]>([]);
  const [viaRoutesLoading, setViaRoutesLoading] = useState(false);

  // NEW: for pre-populating the dialog with existing via_route_location IDs
  const [activeViaRouteIds, setActiveViaRouteIds] = useState<string[]>([]);

  // loading / saving
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ----------------- effects -----------------

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [
          agentsRes,
          locationsRes,
          itineraryTypesRes,
          travelTypesRes,
          entryTicketRes,
          guideRes,
          nationalityRes,
          foodRes,
          vehicleTypesRes,
          hotelCatRes,
          hotelFacilityRes,
        ] = await Promise.all([
          fetchAgents(),
          fetchLocations("source"),
          fetchItineraryTypes(),
          fetchTravelTypes(),
          fetchEntryTicketOptions(),
          fetchGuideOptions(),
          fetchNationalities(),
          fetchFoodPreferences(),
          fetchVehicleTypes(),
          fetchHotelCategories(),
          fetchHotelFacilities(),
        ]);

        setAgents(agentsRes);
        setLocations(locationsRes);
        setItineraryTypes(itineraryTypesRes);
        setTravelTypes(travelTypesRes);
        setEntryTicketOptions(entryTicketRes);
        setGuideOptions(guideRes);
        setNationalities(nationalityRes);
        setFoodPreferences(foodRes);
        setVehicleTypes(vehicleTypesRes);
        setHotelCategoryOptions(hotelCatRes);
        setHotelFacilityOptions(hotelFacilityRes);

        if (id) {
          const parsedId = Number(id);
          if (!Number.isNaN(parsedId)) {
            const existing = await ItineraryService.getOne(parsedId);
            if (existing?.plan) {
              const p = existing.plan;

              setAgentId(p.agent_id ?? null);
              setArrivalLocation(p.arrival_point ?? "");
              setDepartureLocation(p.departure_point ?? "");
              setTripStartDate(
                p.trip_start_date ? toDDMMYYYY(new Date(p.trip_start_date)) : ""
              );
              setTripEndDate(
                p.trip_end_date ? toDDMMYYYY(new Date(p.trip_end_date)) : ""
              );
              setBudget(p.budget ?? "");
              setArrivalType(p.arrival_type ? String(p.arrival_type) : "");
              setDepartureType(
                p.departure_type ? String(p.departure_type) : ""
              );
              setItineraryPreference(
                p.itinerary_preference === 2
                  ? "vehicle"
                  : p.itinerary_preference === 1
                  ? "hotel"
                  : "both"
              );
              setItineraryTypeSelect(
                p.itinerary_type ? String(p.itinerary_type) : ""
              );
              setEntryTicketRequired(
                p.entry_ticket_required != null
                  ? String(p.entry_ticket_required)
                  : ""
              );
              setGuideRequired(
                p.guide_for_itinerary != null
                  ? String(p.guide_for_itinerary)
                  : ""
              );
              setNationality(
                p.nationality != null ? String(p.nationality) : ""
              );
              setFoodPreference(
                p.food_type === 1
                  ? "veg"
                  : p.food_type === 2
                  ? "non-veg"
                  : p.food_type === 3
                  ? "egg"
                  : ""
              );

              if (Array.isArray(existing.routes) && existing.routes.length) {
                setRouteDetails(
                  existing.routes.map((r: any, idx: number) => ({
                    id: idx + 1,
                    day: r.no_of_days ?? idx + 1,
                    date: r.itinerary_route_date
                      ? toDDMMYYYY(new Date(r.itinerary_route_date))
                      : "",
                    source: r.location_name ?? "",
                    next: r.next_visiting_location ?? "",
                    via: r.via_route ?? "",
                    directVisit:
                      r.direct_to_next_visiting_place === 1 ? "Yes" : "No",
                  }))
                );
              }

              if (Array.isArray(existing.vehicles) && existing.vehicles.length) {
                setVehicles(
                  existing.vehicles.map((v: any, idx: number) => ({
                    id: idx + 1,
                    type: v.vehicle_type_id ? String(v.vehicle_type_id) : "",
                    count: v.vehicle_count ?? 1,
                  }))
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Auto-generate Route Details rows based on trip start/end dates
  // and prefill first/last locations from Arrival / Departure.
  useEffect(() => {
    if (!tripStartDate || !tripEndDate) return;

    const parse = (value: string): Date | null => {
      const [d, m, y] = value.split("/").map(Number);
      if (!d || !m || !y) return null;
      return new Date(y - 0, m - 1, d);
    };

    const start = parse(tripStartDate);
    const end = parse(tripEndDate);

    if (!start || !end || end < start) return;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const totalDays =
      Math.floor((end.getTime() - start.getTime()) / ONE_DAY) + 1;

    setRouteDetails((prev) => {
      const nextRoutes: RouteRow[] = [];

      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(start.getTime() + i * ONE_DAY);
        const existing = prev[i];

        nextRoutes.push({
          id: existing?.id ?? i + 1,
          day: i + 1,
          date: toDDMMYYYY(currentDate),
          source: existing?.source ?? "",
          next: existing?.next ?? "",
          via: existing?.via ?? "",
          directVisit: existing?.directVisit ?? "Yes",
        });
      }

      // Prefill DAY 1 source from Arrival
      if (arrivalLocation && nextRoutes.length) {
        nextRoutes[0] = {
          ...nextRoutes[0],
          source: arrivalLocation,
        };
      }

      // Prefill LAST DAY next destination from Departure
      if (departureLocation && nextRoutes.length) {
        const lastIndex = nextRoutes.length - 1;
        nextRoutes[lastIndex] = {
          ...nextRoutes[lastIndex],
          next: departureLocation,
        };
      }

      return nextRoutes;
    });
  }, [tripStartDate, tripEndDate, arrivalLocation, departureLocation]);

  // ----------------- handlers -----------------

  const addRoom = () => {
    setRooms((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          id: last.id + 1,
          roomCount: 1,
          adults: 2,
          children: 0,
          infants: 0,
          childrenDetails: [],
        },
      ];
    });
  };

  const removeRoom = (idToRemove: number) => {
    setRooms((prev) => prev.filter((r) => r.id !== idToRemove));
  };

  const addVehicle = () => {
    setVehicles((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          id: last.id + 1,
          type: "",
          count: 1,
        },
      ];
    });
  };

  const removeVehicle = (idToRemove: number) => {
    setVehicles((prev) => prev.filter((v) => v.id !== idToRemove));
  };

  // open the PHP-style Via Route popup for a specific day row
  const openViaRoutes = async (row: RouteRow) => {
    if (!row.source || !row.next) {
      toast({
        title: "Select locations first",
        description:
          "Please choose both Source Location and Next Visiting Place before adding via routes.",
        variant: "destructive",
      });
      return;
    }

    // reset IDs for the newly opened row
    setActiveViaRouteIds([]);
    setActiveViaRouteRow(row);
    setViaDialogOpen(true);

    try {
      setViaRoutesLoading(true);

      const form = await fetchViaRouteForm({
        dayNo: row.day,
        source: row.source,
        next: row.next,
        date: row.date || "",
        itineraryPlanId: id ? Number(id) : null,
        itinerarySessionId,
      });

      setViaRoutes(form.options);
      setActiveViaRouteIds(form.existingIds ?? []);

      // Prefer what backend says; fall back to whatever was already in the row
      const viaLabels =
        form.existingLabels && form.existingLabels.length
          ? form.existingLabels
          : splitViaString(row.via);

      if (viaLabels.length) {
        const viaText = viaLabels.join(", ");

        setRouteDetails((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, via: viaText } : r
          )
        );

        setActiveViaRouteRow((prev) =>
          prev && prev.id === row.id ? { ...prev, via: viaText } : prev
        );
      }
    } catch (err) {
      console.error("Failed to open via routes form", err);
      setViaRoutes([]);
      setActiveViaRouteIds([]);
    } finally {
      setViaRoutesLoading(false);
    }
  };

  // when user clicks "Submit" inside Via Route popup
// REPLACE the entire handleViaDialogSubmit function in CreateItinerary.tsx
const handleViaDialogSubmit = async (selectedOptions: SimpleOption[]) => {
  if (!activeViaRouteRow) {
    setViaDialogOpen(false);
    return;
  }

  try {
    const viaRouteIds = selectedOptions.map((o) => o.id);

    // CASE 1: User removed all via routes → just clear them in DB
    if (!viaRouteIds.length) {
      const clearBody = {
        via_route_location: [], // IMPORTANT: empty array means "delete only"
        hidden_route_date: activeViaRouteRow.date, // DD/MM/YYYY
        hidden_source_location: activeViaRouteRow.source,
        hidden_destination_location: activeViaRouteRow.next,
        hidden_itineary_via_route_id: [],
        itinerary_route_ID: null,
        itinerary_plan_ID: id ? Number(id) : null,
        itinerary_session_id: itinerarySessionId,
      };

      const clearData = await api("/itinerary-via-routes/add", {
        method: "POST",
        body: clearBody,
      });

      if (!clearData?.success) {
        const msg =
          clearData?.errors?.result_error ||
          "Unable to clear Via Route.";
        toast({
          title: "Via Route Error",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      // Local UI: clear VIA column
      setRouteDetails((prev) =>
        prev.map((r) =>
          r.id === activeViaRouteRow.id ? { ...r, via: "" } : r
        )
      );

      setViaDialogOpen(false);
      setActiveViaRouteRow(null);
      setActiveViaRouteIds([]);

      toast({
        description: "Via Route removed for this day.",
      });

      return;
    }

    // CASE 2: We have via routes selected → check distance limit then save
    const checkBody = {
      source: activeViaRouteRow.source,
      destination: activeViaRouteRow.next,
      via_routes: viaRouteIds,
    };

    const checkData = await api(
      "/itinerary-via-routes/check-distance-limit",
      {
        method: "POST",
        body: checkBody,
      }
    );

    if (!checkData?.success) {
      const msg =
        checkData?.errors?.result_error || "Distance KM Limit Exceeded !!!";
      toast({
        title: "Via Route Limit",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    const addBody = {
      via_route_location: viaRouteIds,
      hidden_route_date: activeViaRouteRow.date, // DD/MM/YYYY
      hidden_source_location: activeViaRouteRow.source,
      hidden_destination_location: activeViaRouteRow.next,
      hidden_itineary_via_route_id: [], // we now do a full replace on backend
      itinerary_route_ID: null,
      itinerary_plan_ID: id ? Number(id) : null,
      itinerary_session_id: itinerarySessionId,
    };

    const addData = await api("/itinerary-via-routes/add", {
      method: "POST",
      body: addBody,
    });

    if (!addData?.success) {
      const msg =
        addData?.errors?.result_error || "Unable to add Via Route.";
      toast({
        title: "Via Route Error",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    // Local UI update – VIA column
    const viaText = selectedOptions.map((o) => o.label).join(", ");

    setRouteDetails((prev) =>
      prev.map((r) =>
        r.id === activeViaRouteRow.id ? { ...r, via: viaText } : r
      )
    );

    setViaDialogOpen(false);
    setActiveViaRouteRow(null);
    setActiveViaRouteIds([]);

    toast({
      description: "Via Route Added Successfully",
    });
  } catch (err) {
    console.error("Via route submit failed", err);
    toast({
      title: "Via Route Error",
      description: "Something went wrong while saving via route.",
      variant: "destructive",
    });
  }
};

  // ----------------- SAVE -----------------

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const totalAdults = rooms.reduce((sum, r) => sum + (r.adults ?? 0), 0);
      const totalChildren = rooms.reduce(
        (sum, r) => sum + (r.children ?? 0),
        0
      );
      const totalInfants = rooms.reduce(
        (sum, r) => sum + (r.infants ?? 0),
        0
      );

      const itinerary_type =
        itineraryTypeSelect && itineraryTypeSelect !== ""
          ? Number(itineraryTypeSelect)
          : itineraryPreference === "vehicle"
          ? 1
          : itineraryPreference === "hotel"
          ? 2
          : 3;

      const itinerary_preference =
        itineraryPreference === "vehicle"
          ? 2
          : itineraryPreference === "hotel"
          ? 1
          : 3;

      const routes = routeDetails.map((r) => ({
        location_name: r.source || "",
        next_visiting_location: r.next || "",
        itinerary_route_date: r.date
          ? toISOFromDDMMYYYY(r.date)
          : undefined,
        no_of_days: r.day,
        direct_to_next_visiting_place:
          r.directVisit === "Yes" ? 1 : 0,
        via_route: r.via || "",
      }));

      const payload: any = {
        plan: {
          agent_id: agentId,
          arrival_point: arrivalLocation || "",
          departure_point: departureLocation || "",
          itinerary_preference,
          itinerary_type,
          trip_start_date: tripStartDate
            ? toISOFromDDMMYYYY(tripStartDate)
            : undefined,
          trip_end_date: tripEndDate
            ? toISOFromDDMMYYYY(tripEndDate)
            : undefined,
          arrival_type: arrivalType ? Number(arrivalType) : null,
          departure_type: departureType ? Number(departureType) : null,
          no_of_nights: routeDetails.length - 1,
          no_of_days: routeDetails.length,
          budget: budget === "" ? null : Number(budget),
          entry_ticket_required: entryTicketRequired
            ? Number(entryTicketRequired)
            : null,
          guide_for_itinerary: guideRequired
            ? Number(guideRequired)
            : null,
          nationality: nationality ? Number(nationality) : null,
          food_type:
            foodPreference === "veg"
              ? 1
              : foodPreference === "non-veg"
              ? 2
              : foodPreference === "egg"
              ? 3
              : null,
          adult_count: totalAdults,
          child_count: totalChildren,
          infant_count: totalInfants,
        },
        routes,
        vehicles: vehicles.map((v) => ({
          vehicle_type_id: v.type ? Number(v.type) : null,
          vehicle_count: v.count ?? 1,
        })),
      };

      if (id) {
        await ItineraryService.update(Number(id), payload);
        toast({
          title: "Itinerary updated",
          description: "The itinerary has been updated successfully.",
        });
      } else {
        await ItineraryService.create(payload);
        toast({
          title: "Itinerary created",
          description: "The itinerary has been created successfully.",
        });
      }
    } catch (err) {
      console.error("Failed to save itinerary", err);
      toast({
        title: "Save failed",
        description: "There was an error while saving the itinerary.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------- UI -----------------

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Top: Itinerary Plan */}
      <ItineraryPlanBlock
        agents={agents}
        agentId={agentId}
        setAgentId={setAgentId}
        locations={locations}
        arrivalLocation={arrivalLocation}
        setArrivalLocation={setArrivalLocation}
        departureLocation={departureLocation}
        setDepartureLocation={setDepartureLocation}
        itineraryTypes={itineraryTypes}
        itineraryTypeSelect={itineraryTypeSelect}
        setItineraryTypeSelect={setItineraryTypeSelect}
        itineraryPreference={itineraryPreference}
        setItineraryPreference={setItineraryPreference}
        travelTypes={travelTypes}
        arrivalType={arrivalType}
        setArrivalType={setArrivalType}
        departureType={departureType}
        setDepartureType={setDepartureType}
        entryTicketOptions={entryTicketOptions}
        entryTicketRequired={entryTicketRequired}
        setEntryTicketRequired={setEntryTicketRequired}
        budget={budget}
        setBudget={setBudget}
        rooms={rooms}
        setRooms={setRooms}
        addRoom={addRoom}
        removeRoom={removeRoom}
        guideOptions={guideOptions}
        guideRequired={guideRequired}
        setGuideRequired={setGuideRequired}
        nationalities={nationalities}
        nationality={nationality}
        setNationality={setNationality}
        foodPreferences={foodPreferences}
        foodPreference={foodPreference}
        setFoodPreference={setFoodPreference}
        tripStartDate={tripStartDate}
        setTripStartDate={setTripStartDate}
        tripEndDate={tripEndDate}
        setTripEndDate={setTripEndDate}
        hotelCategoryOptions={hotelCategoryOptions}
        hotelFacilityOptions={hotelFacilityOptions}
      />

      {/* Route Details */}
      <RouteDetailsBlock
        locations={locations}
        routeDetails={routeDetails}
        setRouteDetails={setRouteDetails}
        onOpenViaRoutes={openViaRoutes}
      />

      {/* Vehicles */}
      <VehicleBlock
        vehicleTypes={vehicleTypes}
        vehicles={vehicles}
        setVehicles={setVehicles}
        addVehicle={addVehicle}
        removeVehicle={removeVehicle}
      />

      {/* Save / Cancel */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          className="border-[#e0d2f5] text-[#4a4260]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#7b3fe4] hover:bg-[#6a34cf]"
        >
          {isSaving ? "Saving..." : "Save Itinerary"}
        </Button>
      </div>

      {/* Via Route Dialog – PHP-style UI */}
      <ViaRouteDialog
        open={viaDialogOpen}
        onOpenChange={(isOpen) => {
          setViaDialogOpen(isOpen);
          if (!isOpen) {
            setActiveViaRouteRow(null);
            setActiveViaRouteIds([]);
          }
        }}
        routes={viaRoutes}
        loading={viaRoutesLoading}
        activeRoute={
          activeViaRouteRow
            ? {
                day: activeViaRouteRow.day,
                date: activeViaRouteRow.date,
                source: activeViaRouteRow.source,
                next: activeViaRouteRow.next,
                initialSelected: splitViaString(activeViaRouteRow.via),
              }
            : null
        }
        initialIds={activeViaRouteIds}
        maxRoutes={2}
        onSubmit={handleViaDialogSubmit}
      />
    </div>
  );
};

export default CreateItinerary;
