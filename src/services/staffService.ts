// src/services/staffService.ts

import type { Staff, StaffListRow } from "@/types/staff";

// Mock data matching screenshots
const mockStaff: Staff[] = [
  { id: 1, name: "Nisha", mobileNumber: "9595959595", email: "sales5@dvi.co.in", agentName: "--", status: 1, roleAccess: "Travel Expert" },
  { id: 2, name: "Virendra Patil 2", mobileNumber: "9999999876", email: "shubhamfunholidays@gmail.com", agentName: "--", status: 1, roleAccess: "Agent" },
  { id: 3, name: "Yogesh Sharma", mobileNumber: "9555131777", email: "YogeshV.Sharma@tctours.in", agentName: "Amit Semwal", status: 1, roleAccess: "Staff" },
  { id: 4, name: "Deva", mobileNumber: "7743852271", email: "deva.ingale@sotc.in", agentName: "Amit Semwal", status: 1, roleAccess: "Staff" },
  { id: 5, name: "Sharmishtha Shukla", mobileNumber: "8400299329", email: "ops@simplyindiaholidays.com", agentName: "Praveen Chaturvedi", status: 1, roleAccess: "Agent" },
  { id: 6, name: "Aulendra Kumar", mobileNumber: "8470014509", email: "aulendra.kumar@easemytrip.com", agentName: "Aman Verma", status: 1, roleAccess: "Staff" },
  { id: 7, name: "Prasoon Jain", mobileNumber: "7827318371", email: "prasoon.jain@easemytrip.com", agentName: "Aman Verma", status: 1, roleAccess: "Staff" },
  { id: 8, name: "Suraj Srivastav", mobileNumber: "9654004687", email: "suraj.srivastava@easemytrip.com", agentName: "Aman Verma", status: 1, roleAccess: "Staff" },
  { id: 9, name: "Chetak Sharma", mobileNumber: "9355030304", email: "chetak3.sharma@easemytrip.com", agentName: "Aman Verma", status: 1, roleAccess: "Staff" },
  { id: 10, name: "Janhvi Manjrekar", mobileNumber: "8424884579", email: "janhvi.manjrekar@tctours.in", agentName: "Amit Semwal", status: 1, roleAccess: "Staff" },
];

let staffData = [...mockStaff];

export const StaffAPI = {
  async list(): Promise<StaffListRow[]> {
    await new Promise((r) => setTimeout(r, 200));
    return staffData.map((s) => ({
      id: s.id,
      name: s.name,
      mobileNumber: s.mobileNumber,
      email: s.email,
      agentName: s.agentName,
      status: s.status,
      roleAccess: s.roleAccess,
    }));
  },

  async get(id: number): Promise<Staff | null> {
    await new Promise((r) => setTimeout(r, 100));
    return staffData.find((s) => s.id === id) ?? null;
  },

  async create(payload: Omit<Staff, "id">): Promise<Staff> {
    await new Promise((r) => setTimeout(r, 200));
    const newStaff: Staff = {
      ...payload,
      id: Math.max(...staffData.map((s) => s.id)) + 1,
    };
    staffData.push(newStaff);
    return newStaff;
  },

  async update(id: number, payload: Partial<Staff>): Promise<Staff> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = staffData.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Staff not found");
    staffData[idx] = { ...staffData[idx], ...payload };
    return staffData[idx];
  },

  async delete(id: number): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    staffData = staffData.filter((s) => s.id !== id);
  },

  async toggleStatus(id: number, status: 0 | 1): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    const idx = staffData.findIndex((s) => s.id === id);
    if (idx !== -1) staffData[idx].status = status;
  },
};
