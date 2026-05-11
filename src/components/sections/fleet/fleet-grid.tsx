import { VehicleCard } from './vehicle-card';

interface Vehicle {
  id: string;
  name: string;
  image: string;
  location: string;
  seats: number;
  transmission: string;
  pricePerDay: number;
  pricePerHour?: number;
  maxDiscount?: number;
}

interface FleetGridProps {
  vehicles: Vehicle[];
  bookingQuery?: string;
  selectedFleetId?: string;
  unavailableFleetIds?: Set<string>;
}

export function FleetGrid({ vehicles, bookingQuery = '', selectedFleetId, unavailableFleetIds }: FleetGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id}>
          <VehicleCard
            id={vehicle.id}
            name={vehicle.name}
            image={vehicle.image}
            location={vehicle.location}
            seats={vehicle.seats}
            transmission={vehicle.transmission}
            pricePerDay={vehicle.pricePerDay}
            pricePerHour={vehicle.pricePerHour}
            maxDiscount={vehicle.maxDiscount}
            bookingQuery={bookingQuery}
            selected={vehicle.id === selectedFleetId}
            unavailable={unavailableFleetIds?.has(vehicle.id) ?? false}
          />
        </div>
      ))}
    </div>
  );
}
