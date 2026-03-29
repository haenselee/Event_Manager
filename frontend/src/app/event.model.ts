export interface Event {
  id?: number;
  title: string;
  description: string;
  location: string;
  date: string;
  price: number;
  maxParticipants?: number | null;
}
