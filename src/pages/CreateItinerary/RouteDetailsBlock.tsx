// FILE: src/pages/CreateItinerary/RouteDetailsBlock.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AutoSuggestSelect, AutoSuggestOption } from "./CreateItineraryAutoSuggestSelect";
import {
  LocationOption,
  fetchLocations,
} from "@/services/itineraryDropdownsMock";

type RouteDetailRow = {
  day: number;
  date: string;
  source: string;
  next: string;
  via: string;
  directVisit: string;
};

type ValidationErrors = {
  [key: string]: string;
};

type RouteDetailsBlockProps = {
  routeDetails: RouteDetailRow[];
  setRouteDetails: React.Dispatch<React.SetStateAction<RouteDetailRow[]>>;
  locations: LocationOption[];

  // optional hooks from parent
  onOpenViaRoutes?: (row: RouteDetailRow) => void;
  addDay?: () => void;

  // optional validation from parent
  validationErrors?: ValidationErrors;
};

export const RouteDetailsBlock = ({
  routeDetails,
  setRouteDetails,
  locations,
  onOpenViaRoutes,
  addDay,
  validationErrors,
}: RouteDetailsBlockProps) => {
  // Global fallback options (like PHP selectize list)
  const globalLocationOptions: AutoSuggestOption[] = locations.map((loc) => ({
    value: loc.name,
    label: loc.name,
  }));

  // Row-specific NEXT DESTINATION options (per source)
  const [destinationOptionsMap, setDestinationOptionsMap] = useState<
    Record<number, AutoSuggestOption[]>
  >({});
  const [loadedSources, setLoadedSources] = useState<Record<number, string>>(
    {}
  );

  // After adding a day: focus previous last day's "Next Destination"
  const [focusNextIdx, setFocusNextIdx] = useState<number | null>(null);

  useEffect(() => {
    if (focusNextIdx === null) return;

    const hostId = `next-destination-${focusNextIdx}`;
    const t = window.setTimeout(() => {
      const host = document.getElementById(hostId);
      const focusTarget =
        (host?.querySelector("input") as HTMLElement | null) ||
        (host?.querySelector("button") as HTMLElement | null) ||
        (host?.querySelector("[role='combobox']") as HTMLElement | null);

      focusTarget?.focus();
      setFocusNextIdx(null);
    }, 0);

    return () => window.clearTimeout(t);
  }, [focusNextIdx]);

  // For each row that has a source, load destination list if we haven't yet
  useEffect(() => {
    routeDetails.forEach((row, idx) => {
      if (!row.source) return;

      const alreadyLoadedForThisSource =
        loadedSources[idx] && loadedSources[idx] === row.source;
      if (alreadyLoadedForThisSource) return;

      (async () => {
        try {
          const destLocations = await fetchLocations("destination", row.source);
          const opts: AutoSuggestOption[] = destLocations.map((loc) => ({
            value: loc.name,
            label: loc.name,
          }));
          setDestinationOptionsMap((prev) => ({
            ...prev,
            [idx]: opts,
          }));
          setLoadedSources((prev) => ({
            ...prev,
            [idx]: row.source,
          }));
        } catch (err) {
          console.error(
            "Failed to load destination locations for",
            row.source,
            err
          );
        }
      })();
    });
  }, [routeDetails, loadedSources]);

  const parseDDMMYYYY = (value: string): Date | null => {
    if (!value) return null;
    const [d, m, y] = value.split("/").map(Number);
    if (!d || !m || !y) return null;
    const dt = new Date(y, m - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const addOneDay = (value: string): string => {
    const dt = parseDDMMYYYY(value);
    if (!dt) return "";
    dt.setDate(dt.getDate() + 1);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleAddDay = () => {
    if (addDay) {
      addDay();
      return;
    }

    // PHP-like behaviour:
    // 1) New day date = last date + 1
    // 2) Move final destination (last.next) down to NEW day "next"
    // 3) Copy last.source into NEW day "source"
    // 4) Clear last.next and focus it (user will pick new destination for last day)
    setRouteDetails((prev) => {
      if (!prev.length) {
        return [
          {
            day: 1,
            date: "",
            source: "",
            next: "",
            via: "",
            directVisit: "",
          },
        ];
      }

      const lastIdx = prev.length - 1;
      const last = prev[lastIdx];

      const movedFinalDestination = last.next; // goes to new day next
      const copiedSource = last.source; // goes to new day source

      const updated = [...prev];

      // Clear last day destination (so user selects new Day-Last "Next Destination")
      updated[lastIdx] = {
        ...last,
        next: "",
      };

      // Add new day row
      updated.push({
        day: last.day + 1,
        date: addOneDay(last.date),
        source: copiedSource,
        next: movedFinalDestination,
        via: "",
        directVisit: "",
      });

      return updated;
    });

    // Focus previous last row's "Next Destination" (e.g., Day 8 destination)
    setFocusNextIdx(Math.max(0, routeDetails.length - 1));
  };

  const firstRouteSourceError = validationErrors?.firstRouteSource;
  const firstRouteNextError = validationErrors?.firstRouteNext;

  return (
    <Card className="border border-[#efdef8] rounded-lg bg-white shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[#4a4260]">
          Route Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#faf1ff]">
              <TableHead className="text-xs text-[#4a4260] w-[80px]">DAY</TableHead>
              <TableHead className="text-xs text-[#4a4260] w-[140px]">DATE</TableHead>
              <TableHead className="text-xs text-[#4a4260] w-[200px]">
                SOURCE DESTINATION
              </TableHead>
              <TableHead className="text-xs text-[#4a4260] w-[280px]">
                NEXT DESTINATION
              </TableHead>
              <TableHead className="text-xs text-[#4a4260] w-[100px] text-center">
                VIA ROUTE
              </TableHead>
              <TableHead className="text-xs text-[#4a4260] w-[120px] text-center">
                DIRECT DESTINATION VISIT
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routeDetails.map((row, idx) => {
              const rowSpecificOptions =
                destinationOptionsMap[idx] &&
                destinationOptionsMap[idx]!.length > 0
                  ? destinationOptionsMap[idx]!
                  : globalLocationOptions;

              const isFirstRow = idx === 0;

              return (
                <TableRow key={idx}>
                  <TableCell>{`DAY ${row.day}`}</TableCell>

                  {/* DATE – read-only from selected range */}
                  <TableCell>
                    <Input
                      readOnly
                      tabIndex={-1}
                      placeholder="DD/MM/YYYY"
                      value={row.date}
                      className="h-8 rounded-md border-[#e5d7f6] bg-[#f9f4ff] cursor-not-allowed text-xs"
                    />
                  </TableCell>

                  {/* SOURCE DESTINATION – read only, but validated for first row */}
                  <TableCell
                    data-field={isFirstRow ? "firstRouteSource" : undefined}
                    className={
                      isFirstRow && firstRouteSourceError ? "align-top" : ""
                    }
                  >
                    <div
                      className={
                        isFirstRow && firstRouteSourceError
                          ? "border border-red-500 rounded-md p-1"
                          : ""
                      }
                    >
                      <Input
                        readOnly
                        tabIndex={-1}
                        placeholder="Source Location"
                        value={row.source}
                        className="h-8 rounded-md border-[#e5d7f6] bg-[#f9f4ff] cursor-not-allowed"
                      />
                    </div>
                    {isFirstRow && firstRouteSourceError && (
                      <p className="mt-1 text-xs text-red-500">
                        {firstRouteSourceError}
                      </p>
                    )}
                  </TableCell>

                  {/* NEXT DESTINATION – autosuggest, chained to next row source */}
                  <TableCell
                    data-field={isFirstRow ? "firstRouteNext" : undefined}
                    className={
                      isFirstRow && firstRouteNextError ? "align-top" : ""
                    }
                  >
                    <div
                      id={`next-destination-${idx}`}
                      className={
                        isFirstRow && firstRouteNextError
                          ? "border border-red-500 rounded-md p-1"
                          : ""
                      }
                    >
                      <AutoSuggestSelect
                        mode="single"
                        value={row.next}
                        onChange={(val) =>
                          setRouteDetails((prev) => {
                            const updated = [...prev];
                            const chosen = (val as string) || "";

                            updated[idx] = {
                              ...updated[idx],
                              next: chosen,
                            };

                            // PHP behaviour: selected NEXT becomes SOURCE of next day
                            if (idx + 1 < updated.length) {
                              updated[idx + 1] = {
                                ...updated[idx + 1],
                                source: chosen,
                              };
                            }

                            return updated;
                          })
                        }
                        options={rowSpecificOptions}
                        placeholder="Next Destination"
                      />
                    </div>
                    {isFirstRow && firstRouteNextError && (
                      <p className="mt-1 text-xs text-red-500">
                        {firstRouteNextError}
                      </p>
                    )}
                  </TableCell>

                  {/* VIA ROUTE – icon button opens popup */}
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => onOpenViaRoutes?.(row)}
                      className="btn btn-outline-primary btn-sm"
                      title="Via Route"
                    >
                      <i className="ti ti-route ti-tada-hover"></i>
                    </button>
                  </TableCell>

                  {/* DIRECT DESTINATION VISIT – toggle button */}
                  <TableCell className="text-center">
                    <button
                      type="button"
                      aria-pressed={row.directVisit === "Yes"}
                      className={`hotel-toggle ${row.directVisit === "Yes" ? "active" : ""}`}
                      title={row.directVisit === "Yes" ? "Active" : "Inactive"}
                      onClick={() =>
                        setRouteDetails((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  directVisit: r.directVisit === "Yes" ? "" : "Yes",
                                }
                              : r
                          )
                        )
                      }
                    >
                      <span className="hotel-toggle-knob"></span>
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Button
          onClick={handleAddDay}
          className="mt-4 bg-[#f054b5] hover:bg-[#e249a9]"
        >
          + Add Day
        </Button>
      </CardContent>
    </Card>
  );
};
