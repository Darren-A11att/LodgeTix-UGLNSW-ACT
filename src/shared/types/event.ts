export interface EventType {
  id: string;
  title: string;
  day: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: string;
  price?: number;
  maxAttendees?: number;
  featured: boolean;
  imageSrc?: string;
}