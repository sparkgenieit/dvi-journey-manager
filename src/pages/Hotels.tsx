// src/pages/Hotels.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type HotelRow = {
  id: number;
  name: string;
  code: string;
  state: string;
  city: string;
  mobile: string;
};

type SortKey = "id" | "name" | "code" | "state" | "city" | "mobile";
type SortDir = "asc" | "desc";

// ─────────────────────────────────────────────
// BASE DATA (like PHP list)
// ─────────────────────────────────────────────
const BASE_ROWS: HotelRow[] = [
  {
    id: 1,
    name: "ZiP By Spree Hotels",
    code: "198",
    state: "Karnataka",
    city: "Bengaluru",
    mobile: "90923 44111",
  },
  {
    id: 2,
    name: "Hotel Brindavan Elite",
    code: "182",
    state: "Tamil Nadu",
    city: "Rameswaram",
    mobile: "7598164666 / 9342794514",
  },
  {
    id: 3,
    name: "GANPAT GRAND",
    code: "DVIHTL962410",
    state: "Tamil Nadu",
    city: "Palani",
    mobile: "9047074242 / 9047107373",
  },
  {
    id: 4,
    name: "Southern Panorama Cruises",
    code: "175",
    state: "Kerala",
    city: "Alappuzha",
    mobile: "7902603333",
  },
  {
    id: 5,
    name: "Dream Coconut Villa Resort",
    code: "197",
    state: "Kerala",
    city: "Munnar",
    mobile: "8086128820",
  },
  {
    id: 6,
    name: "HAWAH BEACH RESORT",
    code: "DVIHTL469749",
    state: "Kerala",
    city: "Kovalam",
    mobile: "8592929230",
  },
  {
    id: 7,
    name: "Tea Tree Suites",
    code: "DVIHTL538499",
    state: "Karnataka",
    city: "Manipal",
    mobile: "9845122077 / 08204207777",
  },
  {
    id: 8,
    name: "The Promenade",
    code: "106",
    state: "Pondicherry",
    city: "Pondicherry",
    mobile: "9655249753 / 0413 222 7750",
  },
];

// build 120 rows to simulate real list
const buildAllHotels = (): HotelRow[] => {
  const out: HotelRow[] = [];
  for (let i = 0; i < 120; i++) {
    const b = BASE_ROWS[i % BASE_ROWS.length];
    out.push({
      ...b,
      id: i + 1,
      // just to vary code a bit
      code: b.code + (i % 5 === 0 ? "" : "-" + String(i).padStart(3, "0")),
    });
  }
  return out;
};
const ALL_HOTELS = buildAllHotels();

// ─────────────────────────────────────────────
// MOCK "API"
// ─────────────────────────────────────────────
async function mockFetchHotels({
  page,
  pageSize,
  search,
  filterState,
  filterCity,
  sortKey,
  sortDir,
}: {
  page: number;
  pageSize: number;
  search: string;
  filterState: string;
  filterCity: string;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  // simulate latency
  await new Promise((res) => setTimeout(res, 80));

  // 1) filter
  let rows = ALL_HOTELS.slice();

  if (search.trim() !== "") {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.mobile.toLowerCase().includes(q)
    );
  }

  if (filterState) {
    rows = rows.filter((r) => r.state === filterState);
  }

  if (filterCity) {
    rows = rows.filter((r) => r.city === filterCity);
  }

  // 2) sort (server style)
  rows = rows.sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === "number" && typeof vb === "number") {
      return sortDir === "asc" ? va - vb : vb - va;
    }
    const sa = String(va).toLowerCase();
    const sb = String(vb).toLowerCase();
    if (sa < sb) return sortDir === "asc" ? -1 : 1;
    if (sa > sb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const total = rows.length;

  // 3) pagination
  const start = (page - 1) * pageSize;
  const data = rows.slice(start, start + pageSize);

  // 4) dropdowns (can be from API)
  const dropdowns = {
    states: [
      "Andhra Pradesh",
      "Goa",
      "Karnataka",
      "Kerala",
      "Pondicherry",
      "Tamil Nadu",
    ],
    // in real API, this would depend on state
    citiesByState: {
      "Karnataka": ["Ankola", "Bangalore", "Bengaluru", "Mysore", "Manipal", "Hubli", "Udupi"],
      "Kerala": ["Alappuzha", "Munnar", "Kovalam"],
      "Pondicherry": ["Pondicherry"],
      "Tamil Nadu": ["Rameswaram", "Palani", "Chennai"],
      "Andhra Pradesh": ["Vijayawada", "Visakhapatnam"],
      "Goa": ["Panaji", "Margao"],
    } as Record<string, string[]>,
  };

  return {
    data,
    total,
    dropdowns,
  };
}

// small helper for header arrow
const arrow = (active: boolean, dir: SortDir) => {
  if (!active) return <span className="hotel-sort-placeholder">↕</span>;
  return dir === "asc" ? (
    <span className="hotel-sort-active">▲</span>
  ) : (
    <span className="hotel-sort-active">▼</span>
  );
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
const Hotels: React.FC = () => {
  // ui
  const [showFilter, setShowFilter] = useState(false);
  const [entries, setEntries] = useState(10); // pageSize
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // filters
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");

  // sorting
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // data from "API"
  const [rows, setRows] = useState<HotelRow[]>([]);
  const [total, setTotal] = useState(0);
  const [citiesFromApi, setCitiesFromApi] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch whenever something changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await mockFetchHotels({
        page,
        pageSize: entries,
        search,
        filterState,
        filterCity,
        sortKey,
        sortDir,
      });
      if (!cancelled) {
        setRows(res.data);
        setTotal(res.total);
        // update cities list based on selected state
        if (filterState && res.dropdowns.citiesByState[filterState]) {
          setCitiesFromApi(res.dropdowns.citiesByState[filterState]);
        } else {
          // fallback list for filter open
          setCitiesFromApi(["Bengaluru", "Rameswaram", "Palani", "Alappuzha"]);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, entries, search, filterState, filterCity, sortKey, sortDir]);

  // total pages from API count
  const totalPages = Math.ceil(total / entries) || 1;
  const safePage = Math.min(page, totalPages);

  // sort handler — also go to page 1 like server tables
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  // for copy we only copy current page rows (rows is already current page)
  const handleCopy = () => {
    const text = rows
      .map(
        (r) =>
          `${r.id}\t${r.name}\t${r.code}\t${r.state}\t${r.city}\t${r.mobile}`
      )
      .join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  // for footer "showing X to Y"
  const startItem = total === 0 ? 0 : (safePage - 1) * entries + 1;
  const endItem = Math.min(safePage * entries, total);

  return (
    <div className="hotel-page-wrapper">
      {/* main card */}
      <div className="hotel-card">
        {/* header row */}
        <div className="hotel-card-head">
          <h2 className="hotel-card-title">List of Hotel</h2>
          <div className="hotel-head-actions">
            <button
              type="button"
              onClick={() => setShowFilter((p) => !p)}
              className={`hotel-filter-btn ${
                showFilter ? "hotel-filter-btn-active" : ""
              }`}
            >
              <span>Filter</span>
              {showFilter ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button className="hotel-add-btn">+ Add Hotel</button>
            <div className="hotel-pricebook-btn">
              <span>Price Book</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* FILTER (collapsed by default) */}
        {showFilter && (
          <div className="hotel-filter-box">
            <div className="hotel-filter-item">
              <label className="hotel-filter-label">State *</label>
              <select
                value={filterState}
                onChange={(e) => {
                  setFilterState(e.target.value);
                  setFilterCity("");
                  setPage(1);
                }}
                className="hotel-filter-select"
              >
                <option value="">Choose State</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Goa">Goa</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Pondicherry">Pondicherry</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>
            <div className="hotel-filter-item">
              <label className="hotel-filter-label">City *</label>
              <select
                value={filterCity}
                onChange={(e) => {
                  setFilterCity(e.target.value);
                  setPage(1);
                }}
                className="hotel-filter-select"
              >
                <option value="">Please Choose City</option>
                {filterState
                  ? citiesFromApi.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))
                  : // no state selected → small fallback list
                    ["Bengaluru", "Rameswaram", "Palani", "Alappuzha"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
              </select>
            </div>
            <div className="hotel-filter-actions">
              <button
                type="button"
                onClick={() => {
                  setFilterState("");
                  setFilterCity("");
                  setPage(1);
                }}
                className="hotel-filter-clear"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* toolbar row (show entries / search / export buttons) */}
        <div className="hotel-toolbar">
          <div className="hotel-show-entries">
            <span>Show</span>
            <select
              value={entries}
              onChange={(e) => {
                setEntries(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="hotel-right-tools">
            <div className="hotel-export-group">
              <button onClick={handleCopy} className="hotel-copy-btn">
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
              <button className="hotel-excel-btn">
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button className="hotel-csv-btn">
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>

            <div className="hotel-search-box">
              <label>Search:</label>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* table */}
        <div className="hotel-table-wrap">
          <table className="hotel-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")}>
                  <div className="hotel-th-inner">
                    <span>S.NO</span>
                    {arrow(sortKey === "id", sortDir)}
                  </div>
                </th>
                <th>
                  <span>Action</span>
                </th>
                <th onClick={() => handleSort("name")}>
                  <div className="hotel-th-inner">
                    <span>Hotel Name</span>
                    {arrow(sortKey === "name", sortDir)}
                  </div>
                </th>
                <th onClick={() => handleSort("code")}>
                  <div className="hotel-th-inner">
                    <span>Hotel Code</span>
                    {arrow(sortKey === "code", sortDir)}
                  </div>
                </th>
                <th onClick={() => handleSort("state")}>
                  <div className="hotel-th-inner">
                    <span>Hotel State</span>
                    {arrow(sortKey === "state", sortDir)}
                  </div>
                </th>
                <th onClick={() => handleSort("city")}>
                  <div className="hotel-th-inner">
                    <span>Hotel City</span>
                    {arrow(sortKey === "city", sortDir)}
                  </div>
                </th>
                <th onClick={() => handleSort("mobile")}>
                  <div className="hotel-th-inner">
                    <span>Hotel Mobile</span>
                    {arrow(sortKey === "mobile", sortDir)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="hotel-empty">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="hotel-empty">
                    No data found
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * entries + index + 1}</td>
                    <td>
                      <div className="hotel-action-col">
                        <button className="hotel-action-circle view">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="hotel-action-circle edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="hotel-action-circle del">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td>{row.name}</td>
                    <td>{row.code}</td>
                    <td>{row.state}</td>
                    <td>{row.city}</td>
                    <td>{row.mobile}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* footer / pagination */}
        <div className="hotel-footer">
          <p>
            Showing <strong>{startItem}</strong> to{" "}
            <strong>{endItem}</strong> of <strong>{total}</strong> entries
          </p>

          <div className="hotel-pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (totalPages > 6) {
                if (pageNum <= 4 || pageNum === totalPages) {
                  return (
                    <button
                      key={i}
                      onClick={() => setPage(pageNum)}
                      className={pageNum === safePage ? "active" : ""}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === 5) {
                  return (
                    <span key={i} className="hotel-dots">
                      ...
                    </span>
                  );
                }
                return null;
              }
              return (
                <button
                  key={i}
                  onClick={() => setPage(pageNum)}
                  className={pageNum === safePage ? "active" : ""}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        <div className="hotel-footer-note">DVI Holidays @ 2025</div>
      </div>
    </div>
  );
};

export default Hotels;
