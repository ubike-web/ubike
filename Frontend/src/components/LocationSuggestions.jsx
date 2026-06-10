import { MapPin } from "lucide-react";

function LocationSuggestions({
  suggestions = [],
  setSuggestions,
  setPickupLocation,
  setDestinationLocation,
  input,
}) {
  return (
    <div>
      {suggestions.map((suggestion, index) => (
        <div
          onClick={() => {
            if (input === "pickup") {
              setPickupLocation(suggestion);
            } else {
              setDestinationLocation(suggestion);
            }
            setSuggestions([]);
          }}
          key={index}
          className="cursor-pointer flex items-center gap-2 border-b-2 last:border-b-0 py-3 border-gray-200"
        >
          <div className="bg-gray-100 p-2 rounded-full flex-shrink-0">
            <MapPin size={20} />
          </div>
          <p className="text-sm font-medium line-clamp-2">{suggestion}</p>
        </div>
      ))}
    </div>
  );
}

export default LocationSuggestions;
