export const addGuideOptionsDB: Record<
  string,
  Record<
    string,
    {
      itineraryId: string;
      dayId: string;
      dayNumber: number;
      date: string;
      availableLanguages: Array<{
        code: "en" | "ta" | "hi";
        label: "English" | "Tamil" | "Hindi";
        isAvailable: boolean;
        costAvailable: boolean;
        reason?: string;
      }>;
      availableSlots: Array<{
        slotId: string;
        start: string;
        end: string;
        available: boolean;
      }>;
    }
  >
> = {
  ITI_1001: {
    DAY_1: {
      itineraryId: "ITI_1001",
      dayId: "DAY_1",
      dayNumber: 1,
      date: "2026-05-29",
      availableLanguages: [
        { code: "en", label: "English", isAvailable: true, costAvailable: true },
        { code: "ta", label: "Tamil", isAvailable: true, costAvailable: true },
        // Hindi NOT available in Day 1
        {
          code: "hi",
          label: "Hindi",
          isAvailable: false,
          costAvailable: false,
          reason: "Sorry, Guide Cost Not Available. So Unable to Add",
        },
      ],
      availableSlots: [
        {
          slotId: "SLOT_001",
          start: "2026-05-29T09:00:00+05:30",
          end: "2026-05-29T13:00:00+05:30",
          available: true,
        },
        {
          slotId: "SLOT_002",
          start: "2026-05-29T14:00:00+05:30",
          end: "2026-05-29T16:00:00+05:30",
          available: true,
        },
      ],
    },

    DAY_2: {
      itineraryId: "ITI_1001",
      dayId: "DAY_2",
      dayNumber: 2,
      date: "2026-05-30",
      availableLanguages: [
        { code: "en", label: "English", isAvailable: true, costAvailable: true },
        { code: "ta", label: "Tamil", isAvailable: true, costAvailable: true },
        // Hindi AVAILABLE in Day 2
        { code: "hi", label: "Hindi", isAvailable: true, costAvailable: true },
      ],
      availableSlots: [
        {
          slotId: "SLOT_003",
          start: "2026-05-30T10:00:00+05:30",
          end: "2026-05-30T12:00:00+05:30",
          available: true,
        },
        {
          slotId: "SLOT_004",
          start: "2026-05-30T15:00:00+05:30",
          end: "2026-05-30T18:00:00+05:30",
          available: true,
        },
      ],
    },
    
    DAY_3: {
      itineraryId: "ITI_1001",
      dayId: "DAY_3",
      dayNumber: 3,
      date: "2026-05-30",
      availableLanguages: [
        { code: "en", label: "English", isAvailable: true, costAvailable: true },
        { code: "ta", label: "Tamil", isAvailable: true, costAvailable: true },
        // Hindi AVAILABLE in Day 3
        { code: "hi", label: "Hindi", isAvailable: true, costAvailable: true },
      ],
      availableSlots: [
        {
          slotId: "SLOT_004",
          start: "2026-05-30T10:00:00+05:30",
          end: "2026-05-30T12:00:00+05:30",
          available: true,
        },
        {
          slotId: "SLOT_005",
          start: "2026-05-30T15:00:00+05:30",
          end: "2026-05-30T18:00:00+05:30",
          available: true,
        },
      ],
    },
  },
};
