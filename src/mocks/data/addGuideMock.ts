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
        code: "en" | "ta" | "ml" | "hi" | "fr";
        label: "English" | "Tamil" | "Malayalam" | "Hindi" | "French";
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
        {code: "hi",label: "Hindi",isAvailable: false,costAvailable: false,reason: "Hindi is not available",},
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
  date: "2026-05-31",
  availableLanguages: [
    { code: "en", label: "English", isAvailable: true, costAvailable: true },
    { code: "ta", label: "Tamil", isAvailable: true, costAvailable: true },
    { code: "ml", label: "Malayalam", isAvailable: true, costAvailable: true },
    {
      code: "hi",
      label: "Hindi",
      isAvailable: false,
      costAvailable: false,
      reason: "Hindi is not available",
    },
    {
      code: "fr",
      label: "French",
      isAvailable: false,
      costAvailable: false,
      reason: "French is not available",
    },
  ],
  availableSlots: [
    {
      slotId: "SLOT_005",
      start: "2026-05-31T09:00:00+05:30",
      end: "2026-05-31T13:00:00+05:30",
      available: true,
    },
  ],
},

DAY_4: {
  itineraryId: "ITI_1001",
  dayId: "DAY_4",
  dayNumber: 4,
  date: "2026-06-01",
  availableLanguages: [
    { code: "en", label: "English", isAvailable: true, costAvailable: true },
    { code: "ta", label: "Tamil", isAvailable: true, costAvailable: true },
    { code: "ml", label: "Malayalam", isAvailable: true, costAvailable: true },
    {
      code: "hi",
      label: "Hindi",
      isAvailable: false,
      costAvailable: false,
      reason: "Hindi is not available",
    },
    {
      code: "fr",
      label: "French",
      isAvailable: false,
      costAvailable: false,
      reason: "French is not available",
    },
  ],
  availableSlots: [
    {
      slotId: "SLOT_006",
      start: "2026-06-01T10:00:00+05:30",
      end: "2026-06-01T14:00:00+05:30",
      available: true,
    },
  ],
},
  },
};
