import { http } from "../../shared/http/http";

export type BugReport = {
  id: number;
  title: string;
  description: string;
  page: string | null;
  characterName: string | null;
  userId: number | null;
  status: "open" | "in_progress" | "resolved";
  resolution: string | null;
  createdAt: string;
};

export type CreateBugReportPayload = {
  title: string;
  description: string;
  page?: string;
  characterName?: string;
};

export async function submitBugReport(payload: CreateBugReportPayload): Promise<BugReport> {
  const { data } = await http.post<BugReport>("/bug-reports", payload);
  return data;
}

export async function getBugReports(): Promise<BugReport[]> {
  const { data } = await http.get<BugReport[]>("/bug-reports");
  return data;
}

export async function updateBugReport(
  id: number,
  payload: { status?: string; resolution?: string },
): Promise<BugReport> {
  const { data } = await http.patch<BugReport>(`/bug-reports/${id}`, payload);
  return data;
}

export async function deleteBugReport(id: number): Promise<void> {
  await http.delete(`/bug-reports/${id}`);
}
