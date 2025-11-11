// src/pages/hotel.tsx
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
import { listHotels, updateHotel, type Hotel } from "@/services/hotels";
import { useNavigate } from "react-router-dom";

/** ================= UI Types ================= */
type HotelRow = {
  // UI running serial number only (not backend id)
  id: number;
  // backend id used for PATCH
  backendId: string;
  name: string;
  code: string;
  state: string;
  city: string;
  mobile: string;
  isActive: boolean;
};

type SortKey = "id" | "name" | "code" | "state" | "city" | "mobile";
type SortDir = "asc" | "desc";

const arrow = (active: boolean, dir: SortDir) =>
  !active ? (
    <span className="hotel-sort-placeholder">↕</span>
  ) : dir === "asc" ? (
    <span className="hotel-sort-active">▲</span>
  ) : (
    <span className="hotel-sort-active">▼</span>
  );

/** ================= Page ================= */
const HotelPage: React.FC = () => {
  // toolbar / filters / paging
  const [showFilter, setShowFilter] = useState(false);
  const [entries, setEntries] = useState(10);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const navigate = useNavigate();

  // data
  const [rows, setRows] = useState<HotelRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // adapter: API → UI row
  const toRow = (h: Hotel, ix: number): HotelRow => ({
    id: (page - 1) * entries + ix + 1,
    backendId: String(h.id ?? ""),
    name: h.name ?? "",
    code: h.code ?? "",
    state: h.state ?? "",
    city: h.city ?? "",
    mobile: h.phone ?? "",
    isActive: !!h.isActive,
  });

  // fetch
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await listHotels({ search, page, limit: entries });
        let list = (resp.items ?? []).map(toRow);

        // keep existing UI behaviour: client filters + search + sort
        if (filterState) list = list.filter((r) => r.state === filterState);
        if (filterCity) list = list.filter((r) => r.city === filterCity);

        // NEW: client-side search across key columns (works even if backend ignores ?search=)
        const q = (search || "").trim().toLowerCase();
        if (q) {
          list = list.filter((r) => {
            const fields = [
              String(r.id),
              r.name,
              r.code,
              r.state,
              r.city,
              r.mobile,
            ];
            return fields.some((v) =>
              (v ?? "").toString().toLowerCase().includes(q)
            );
          });
        }

        list = list.slice().sort((a, b) => {
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

        if (!aborted) {
          setRows(list);
          const anyClientFilter = !!filterState || !!filterCity;
          setTotal(
            anyClientFilter
              ? list.length
              : Number(resp.total ?? list.length)
          );
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [page, entries, search, filterState, filterCity, sortKey, sortDir]);

  // handlers
  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleCopy = () => {
    const txt = rows
      .map(
        (r) =>
          `${r.id}\t${r.name}\t${r.code}\t${r.state}\t${r.city}\t${r.mobile}\t${
            r.isActive ? "Active" : "Inactive"
          }`
      )
      .join("\n");
    navigator.clipboard.writeText(txt).catch(() => {});
  };

  const toggleStatus = async (row: HotelRow) => {
    const next = !row.isActive;
    try {
      setSavingId(row.backendId);
      // Your service maps { isActive: boolean } → backend { status: 1|0 }
      await updateHotel(row.backendId, { isActive: next });
      setRows((prev) =>
        prev.map((r) =>
          r.backendId === row.backendId ? { ...r, isActive: next } : r
        )
      );
    } finally {
      setSavingId(null);
    }
  };

  const totalPages = Math.ceil(total / entries) || 1;
  const safePage = Math.min(page, totalPages);
  const startItem = total === 0 ? 0 : (safePage - 1) * entries + 1;
  const endItem = Math.min(safePage * entries, total);

  // Compact pagination window (max 5 numbers)
  const windowSize = 5;
  const startPage = Math.max(
    1,
    Math.min(
      page - Math.floor(windowSize / 2),
      Math.max(1, totalPages - windowSize + 1)
    )
  );
  const endPage = Math.min(totalPages, startPage + windowSize - 1);
  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const cityOptions = useMemo(() => {
    if (filterState === "Karnataka")
      return [
        "Ankola",
        "Bangalore",
        "Bengaluru",
        "Mysore",
        "Manipal",
        "Hubli",
        "Udupi",
      ];
    if (filterState === "Kerala") return ["Alappuzha", "Munnar", "Kovalam"];
    if (filterState === "Pondicherry") return ["Pondicherry"];
    if (filterState === "Tamil Nadu")
      return ["Rameswaram", "Palani", "Chennai"];
    if (filterState === "Andhra Pradesh")
      return ["Vijayawada", "Visakhapatnam"];
    if (filterState === "Goa") return ["Panaji", "Margao"];
    return ["Bengaluru", "Rameswaram", "Palani", "Alappuzha"];
  }, [filterState]);

  return (
    <div className="hotel-page-wrapper" style={{ padding: 0 }}>
      <div className="hotel-card">
        {/* header */}
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
            <button
              className="hotel-add-btn"
              onClick={() => navigate("/hotels/new")} // <-- open new page in same tab
            >
              + Add Hotel
            </button>
            <div className="hotel-pricebook-btn">
              <span>Price Book</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* filter */}
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
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
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

        {/* toolbar */}
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
                {/* NEW COLUMN — matches screenshot #2 (right beside Hotel Mobile) */}
                <th>
                  <div className="hotel-th-inner">
                    <span>Hotel Status</span>
                    <span className="hotel-sort-placeholder">↕</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="hotel-empty">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="hotel-empty">
                    No data found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.backendId}-${row.id}`}>
                    <td>{row.id}</td>
                    <td>
                      <div className="hotel-action-col">
                        <button
                          className="hotel-action-circle view"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="hotel-action-circle edit"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="hotel-action-circle del"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td>{row.name}</td>
                    <td>{row.code}</td>
                    <td>{row.state}</td>
                    <td>{row.city}</td>
                    <td>{row.mobile}</td>
                    {/* NEW: purple toggle exactly like screenshot 2 */}
                    <td>
                      <button
                        aria-pressed={row.isActive}
                        onClick={() => toggleStatus(row)}
                        disabled={savingId === row.backendId}
                        className={`hotel-toggle ${
                          row.isActive ? "active" : "off"
                        }`}
                        title={row.isActive ? "Active" : "Inactive"}
                      >
                        <span className="hotel-toggle-knob" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="hotel-footer">
          <p>
            Showing{" "}
            <strong>
              {total === 0
                ? 0
                : (Math.min(page, Math.ceil(total / entries)) - 1) * entries +
                  1}
            </strong>{" "}
            to <strong>{Math.min(page * entries, total)}</strong> of{" "}
            <strong>{total}</strong> entries
          </p>

          <div className="hotel-pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            {visiblePages.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={page === pageNum ? "active" : ""}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (Math.ceil(total / entries) || 1)}
            >
              Next
            </button>
          </div>
        </div>

        <div className="hotel-footer-note">DVI Holidays @ 2025</div>
      </div>

      {/* Styles: your toggle + wide layout overrides */}
      <style>{`
            /* ===== Toggle styles ===== */
            .hotel-toggle {
              position: relative;
              width: 40px;
              height: 22px;
              border-radius: 9999px;
              display: inline-flex;
              align-items: center;
              padding: 0;
              border: 2px solid #8b5cf6;        /* violet border */
              background: #ffffff;              /* OFF track = white */
              cursor: pointer;
              transition: background .18s ease, border-color .18s ease, opacity .2s ease;
            }
            .hotel-toggle[disabled]{ opacity:.6; cursor:not-allowed; }
            .hotel-toggle:focus{ outline:none; }

            /* ON state */
            .hotel-toggle.active{
              background:#8b5cf6;              /* ON track = violet */
              border-color:#8b5cf6;
            }

            /* Knob */
            .hotel-toggle-knob{
              position:absolute;
              width:18px;
              height:18px;
              border-radius:9999px;
              box-shadow:0 1px 2px rgba(0,0,0,.15);
              transition: transform .18s ease-in-out, background-color .18s ease-in-out;
              left:2px;                        /* start position */
              transform: translateX(0);
            }

            /* OFF knob color */
            .hotel-toggle.off .hotel-toggle-knob{
              background:#cbd5e1;        /* slate-300 (lighter) */
              border:1px solid #94a3b8;    /* slate-400 outline */
              box-shadow:0 1px 1px rgba(0,0,0,.16), inset 0 0 0 2px rgba(255,255,255,.28);
            }

            /* ON knob color + position */
            .hotel-toggle.active .hotel-toggle-knob{
              background:#ffffff;            /* white on violet track */
              transform: translateX(18px);    /* slide to right */
            }

            /* ===== WIDE LAYOUT OVERRIDES (Hotel page) ===== */
            .hotel-page-wrapper {
              position: relative;
              z-index: 10;
              /* We removed the padding from here */
            }

            .hotel-card {
              max-width: none !important;
              width: 100% !important;
              overflow: visible;
              /* Add the page padding directly to the card */
              padding-left: 1rem;
              padding-right: 1rem;
            }

            /* This adds the larger padding for desktop screens */
            @media (min-width: 1024px) { /* This is the 'lg:' breakpoint */
              .hotel-card {
                padding-left: 1.5rem;  /* This is your old 'lg:px-6' */
                padding-right: 1.5rem; /* This is your old 'lg:px-6' */
              }
            }

            /* Tighten internal padding so more width goes to the table */
            .hotel-card-head,
            .hotel-toolbar { padding-left:.5rem; padding-right:.5rem; max-width:100%; overflow:hidden; }

            .hotel-table-wrap{
              padding-left:.25rem;
              padding-right:.25rem;
              overflow-x:auto;      /* keep as-is: you can change to hidden if you never want a bar */
              overflow-y:visible;
              max-width:100%;
            }

            /* Ensure the grid stretches edge-to-edge inside the card */
            .hotel-table{ width:100%; table-layout:auto; }

            /* (second table rule kept to preserve your current behaviour) */
            .hotel-table{
              width:100%;
              min-width:1100px;      /* tweak if needed */
              table-layout:auto;
            }

            /* ===== Pagination stays inside the rounded card ===== */
            .hotel-footer{
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:1rem;
              flex-wrap:wrap;        /* wrap onto next line when needed */
              padding:.75rem .75rem;     /* keep away from rounded edges */
              max-width:100%;
              overflow:hidden;        /* prevent visual spill over card radius */
            }
            .hotel-footer > p{ margin:0; }

            .hotel-pagination{
              display:flex;
              flex-wrap:wrap;        /* key fix */
              gap:.5rem;
              align-items:center;
              justify-content:flex-start;
              width:100%;
              max-width:100%;
              overflow-x:hidden;      /* no horizontal scrollbar */
              padding-right:.25rem;
            }
            .hotel-pagination button{
              min-width:2rem;
              height:2rem;
              padding:0 .6rem;
              border-radius:.75rem;
              line-height:2rem;
              white-space:nowrap;
            }
            .hotel-pagination button.active{ font-weight:600; }
          `}</style>
    </div>
  );
};

export default HotelPage;