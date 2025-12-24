// FILE: CreateItineraryAutoSuggestSelect.tsx
//
// Local, Create-Itinerary-scoped AutoSuggestSelect that supports:
// ✅ Enter to select
// ✅ Tab to select + move to next field (NO preventDefault)
// ✅ Arrow up/down navigation
// ✅ Single + Multi mode
//
// We keep the public API compatible with the CreateItinerary module usage so we
// don't need to touch shared "@/components/AutoSuggestSelect" (not included in the zip).

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export type AutoSuggestOption = {
  value: string;
  label: string;
};

type BaseProps = {
  options: AutoSuggestOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

type SingleProps = BaseProps & {
  mode: "single";
  value: string; // option.value
  onChange: (value: string) => void;
};

type MultiProps = BaseProps & {
  mode: "multi";
  value: string[]; // array of option.value
  onChange: (value: string[]) => void;
  maxSelected?: number;
};

type Props = SingleProps | MultiProps;

function norm(s: string) {
  return (s ?? "").trim().toLowerCase();
}

export function AutoSuggestSelect(props: Props) {
  const { options, placeholder, disabled, className } = props;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Map value -> label for quick lookup
  const labelByValue = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of options) m.set(String(o.value), o.label);
    return m;
  }, [options]);

  const selectedValues = useMemo(() => {
    if (props.mode === "single") return props.value ? [props.value] : [];
    return props.value ?? [];
  }, [props]);

  const filtered = useMemo(() => {
    const q = norm(query);

    // In multi mode, hide already-selected items from dropdown to match typical UX.
    const selectedSet = new Set(selectedValues.map(String));

    const base = options.filter((o) => {
      if (props.mode === "multi" && selectedSet.has(String(o.value))) return false;
      return true;
    });

    if (!q) return base;

    return base.filter((o) => norm(o.label).includes(q) || norm(String(o.value)).includes(q));
  }, [options, query, props.mode, selectedValues]);

  // Keep activeIndex within range when filtered list changes
  useEffect(() => {
    setActiveIndex((i) => {
      const max = Math.max(0, filtered.length - 1);
      if (i < 0) return 0;
      if (i > max) return 0;
      return i;
    });
  }, [filtered.length]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && !root.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const commitSingle = (value: string) => {
    const v = String(value);
    if (props.mode !== "single") return;
    props.onChange(v);
    setQuery(labelByValue.get(v) ?? "");
    setOpen(false);
  };

  const commitMultiAdd = (value: string) => {
    const v = String(value);
    if (props.mode !== "multi") return;

    const current = Array.isArray(props.value) ? props.value.map(String) : [];
    const max = props.maxSelected ?? Infinity;

    if (current.includes(v)) return;
    if (current.length >= max) return;

    props.onChange([...current, v]);
    setQuery("");
    setOpen(false);
  };

  const removeMulti = (value: string) => {
    if (props.mode !== "multi") return;
    const v = String(value);
    const current = Array.isArray(props.value) ? props.value.map(String) : [];
    props.onChange(current.filter((x) => x !== v));
  };

  const selectActive = () => {
    const opt = filtered[activeIndex] ?? filtered[0] ?? null;
    if (!opt) return;

    if (props.mode === "single") commitSingle(opt.value);
    else commitMultiAdd(opt.value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      if (!open) setOpen(true);
      if (filtered.length) {
        e.preventDefault();
        selectActive();
      }
      return;
    }

    // ✅ NEW: Tab selects (if dropdown is open) and then moves to next field.
    if (e.key === "Tab") {
      if (open && filtered.length) {
        selectActive();
      }
      setOpen(false);
      // IMPORTANT: DO NOT preventDefault — Tab must move focus.
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
  };

  const onChangeQuery = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setQuery(next);
    setOpen(true);
    setActiveIndex(0);

    // If single mode and user clears text, clear selection too.
    if (props.mode === "single" && !next.trim()) {
      props.onChange("");
    }
  };

  // In single mode, show selected label when not actively typing.
  useEffect(() => {
    if (props.mode !== "single") return;

    const selectedValue = props.value ? String(props.value) : "";
    const label = selectedValue ? labelByValue.get(selectedValue) : "";

    // If dropdown isn't open and query is empty OR equals old label, keep synced.
    if (!open) {
      if (!query || query === label) setQuery(label ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, props.value, labelByValue, open]);

  const controlClasses =
    "w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 " +
    (disabled ? "opacity-60 pointer-events-none " : "") +
    (className ? className + " " : "") +
    "border-[#e5d7f6]";

  const renderDropdown = () => {
    if (!open) return null;
    if (!filtered.length) return null;

    return (
      <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md max-h-60 overflow-auto">
        {filtered.map((opt, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={String(opt.value)}
              className={
                "px-3 py-2 text-sm cursor-pointer " +
                (isActive ? "bg-accent" : "")
              }
              onMouseEnter={() => setActiveIndex(idx)}
              // use onMouseDown so selection happens before blur
              onMouseDown={(ev) => {
                ev.preventDefault();
                if (props.mode === "single") commitSingle(opt.value);
                else commitMultiAdd(opt.value);
              }}
            >
              {opt.label}
            </div>
          );
        })}
      </div>
    );
  };

  // SINGLE
  if (props.mode === "single") {
    return (
      <div ref={rootRef} className="relative">
        <Input
          ref={inputRef}
          className={controlClasses}
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => {
            setOpen(true);
            setActiveIndex(0);
          }}
          onChange={onChangeQuery}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        {renderDropdown()}
      </div>
    );
  }

  // MULTI
  const selectedLabels = selectedValues
    .map((v) => ({ value: v, label: labelByValue.get(String(v)) ?? String(v) }))
    .filter((x) => x.label);

  const max = props.maxSelected ?? Infinity;
  const reachedMax = selectedValues.length >= max;

  return (
    <div ref={rootRef} className="relative">
      <div
        className={
          "min-h-[36px] w-full rounded-md border border-[#e5d7f6] px-2 py-1 flex flex-wrap gap-2 items-center " +
          (disabled ? "opacity-60 pointer-events-none " : "") +
          (className ? className : "")
        }
        onMouseDown={(e) => {
          // Focus the input when user clicks anywhere inside the control.
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {selectedLabels.map((t) => (
          <span
            key={String(t.value)}
            className="inline-flex items-center gap-1 rounded-md bg-[#f7ecff] border border-[#e9d4ff] px-2 py-1 text-xs"
          >
            {t.label}
            <button
              type="button"
              className="ml-1 hover:opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                removeMulti(t.value);
              }}
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <Input
          ref={inputRef}
          className="border-0 shadow-none focus-visible:ring-0 h-7 px-0 text-sm flex-1 min-w-[120px]"
          value={query}
          placeholder={selectedLabels.length ? "" : placeholder}
          disabled={disabled || reachedMax}
          onFocus={() => {
            if (!reachedMax) {
              setOpen(true);
              setActiveIndex(0);
            }
          }}
          onChange={onChangeQuery}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
      </div>

      {renderDropdown()}

      {props.maxSelected != null && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          Selected {selectedValues.length}/{props.maxSelected}
        </div>
      )}
    </div>
  );
}
