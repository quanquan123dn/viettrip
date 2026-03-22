export type TravelMode = "DRIVE" | "MOTORBIKE";
export type TripStyle = "CHILL" | "EXPLORE" | "FOOD" | "NATURE" | "SPIRITUAL";

export type Trip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  originName?: string;
  originLat?: number;
  originLng?: number;
  travelMode: TravelMode;
  tripStyle: TripStyle;
  status: string;
  days: TripDay[];
};

export type TripDay = {
  id: string;
  dayNumber: number;
  date: string;
  baseCityName?: string;
  notes?: string;
  stops: TripStop[];
  route?: DayRoute;
  review?: DayReview;
};

export type TripStop = {
  id: string;
  placeId?: string;
  placeName: string;
  address?: string;
  lat: number;
  lng: number;
  startTime?: string;
  durationMinutes: number;
  note?: string;
  estimatedCost?: number;
  category?: string;
  priority?: number;
  sortOrder: number;
};

export type RouteLeg = {
  startPlaceName: string;
  endPlaceName: string;
  distanceMeters: number;
  durationSeconds: number;
};

export type DayRoute = {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  encodedPolyline: string;
  legs: RouteLeg[];
};

export type DayReview = {
  score: number;
  warnings: string[];
  suggestions: string[];
};

export type TripReview = {
  tripScore: number;
  dayReviews: (DayReview & { dayId: string })[];
};

// Form types
export type CreateTripInput = {
  title: string;
  startDate: string;
  endDate: string;
  originName?: string;
  originLat?: number;
  originLng?: number;
  travelMode: TravelMode;
  tripStyle: TripStyle;
};

export type AddStopInput = {
  placeId?: string;
  placeName: string;
  address?: string;
  lat: number;
  lng: number;
  startTime?: string;
  durationMinutes?: number;
  note?: string;
  estimatedCost?: number;
  category?: string;
  priority?: number;
};

export type PlaceResult = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
};
