export interface Note {
  id: string;
  entityType: "contact" | "company" | "deal" | "ticket";
  entityId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
