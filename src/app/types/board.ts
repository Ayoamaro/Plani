export type Id = string;

export interface User {
  id: Id;
  name: string;
  avatar: string;
}

export interface Ticket {
  id: Id;
  title: string;
  description?: string;
  assigneeId?: Id;
  priority: Priority;
  createdAt: number;
}

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const PRIORITY_LABEL_ES: Record<Priority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export interface Column {
  id: Id;
  title: string;
  ticketIds: Id[];
}

export const COLUMN_TITLE_ES_BY_EN: Record<string, string> = {
  "To Do": "Por hacer",
  "In Progress": "En progreso",
  Done: "Terminado",
};

export type TicketEvent =
  | {
      type: "MOVED";
      ticketId: Id;
      fromColumnId: Id;
      toColumnId: Id;
      at: number;
    }
  | {
      type: "COMPLETED";
      ticketId: Id;
      at: number;
    };

export interface BoardState {
  users: User[];
  tickets: Record<Id, Ticket>;
  columns: Column[];
  events: TicketEvent[];
  ui: {
    activeTicketId: Id | null;
  };
}
