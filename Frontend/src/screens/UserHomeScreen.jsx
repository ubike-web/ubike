import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "../contexts/UserContext";
import map from "/map.png";
import {
  Button,
  LocationSuggestions,
  SelectVehicle,
  RideDetails,
  Sidebar,
} from "../components";
import axios from "axios";
import debounce from "lodash.debounce";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";
import { LocateFixed } from "lucide-react";
import { usePaystack } from "../hooks/usePaystack";
import { useNavigate } from "react-router-dom";

function UserHomeScreen() {
  const token = localStorage.getItem("token");
  const { socket } = useContext(SocketDataContext);
  const { user } = useUser();
  const navigate = useNavigate();
  const { pay } = usePaystack();

  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("messages")) || []
  );
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedInput, setSelectedInput] = useState("pickup");
  const [locationSuggestion, setLocationSuggestion] = useState([]);
  const [mapLocation, setMapLocation] = useState("");
  const [rideCreated, setRideCreated] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Second-half payment panel
  const [showSecondPayment, setShowSecondPayment] = useState(false);
  const [completedRideId, setCompletedRideId] = useState(null);

  // Ride details
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("car");
  const [fare, setFare] = useState({ auto: 0, car: 0, bike: 0 });
  const [confirmedRideData, setConfirmedRideData] = useState(null);
  const rideTimeout = useRef(null);

  // Panels
  const [showFindTripPanel, setShowFindTripPanel] = useState(true);
  const [showSelectVehiclePanel, setShowSelectVehiclePanel] = useState(false);
  const [showRideDetailsPanel, setShowRideDetailsPanel] = useState(false);

  const handleLocationChange = useCallback(
    debounce(async (inputValue, token) => {
      if (inputValue.length >= 3) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/map/get-suggestions?input=${inputValue}`,
            { headers: { token } }
          );
          setLocationSuggestion(response.data);
        } catch (error) {
          Console.error(error);
        }
      }
    }, 700),
    []
  );

  const onChangeHandler = (e) => {
    setSelectedInput(e.target.id);
    const value = e.target.value;
    if (e.target.id === "pickup") setPickupLocation(value);
    else if (e.target.id === "destination") setDestinationLocation(value);

    if (value.length >= 3) {
      handleLocationChange(value, token);
    } else {
      setLocationSuggestion([]);
    }
  };

  const handleSuggestionSelect = (suggestion, inputField) => {
    if (inputField === "pickup") {
      setPickupLocation(suggestion);
    } else {
      setDestinationLocation(suggestion);
    }
    setLocationSuggestion([]);

    const pickup = inputField === "pickup" ? suggestion : pickupLocation;
    const destination = inputField === "destination" ? suggestion : destinationLocation;
    if (pickup.length > 2 && destination.length > 2) {
      getDistanceAndFare(pickup, destination);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapLocation(
          `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`
        );
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/map/reverse-geocode?lat=${latitude}&lng=${longitude}`
          );
          setPickupLocation(res.data.address);
        } catch {
          setPickupLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationDenied(true);
        }
        Console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getDistanceAndFare = async (pickup, destination) => {
    setSearchError("");
    try {
      setLoading(true);
      setMapLocation(
        `https://www.google.com/maps?q=${pickup} to ${destination}&output=embed`
      );
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/get-fare?pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`,
        { headers: { token } }
      );
      setFare(response.data.fare);
      setShowFindTripPanel(false);
      setShowSelectVehiclePanel(true);
      setLocationSuggestion([]);
    } catch (error) {
      Console.error(error);
      const msg = error.response?.data?.message || "Could not calculate fare. Check your locations and try again.";
      setSearchError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Pay first half → creates ride → broadcasts to captains
  const payFirstHalf = async () => {
    const halfFare = Math.ceil(fare[selectedVehicle] / 2);
    setPaymentLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/payment/initialize`,
        { amount: halfFare, email: user.email, description: `U-bike first payment – ${pickupLocation} to ${destinationLocation}` },
        { headers: { token } }
      );

      pay({
        email: user.email,
        amount: halfFare,
        onSuccess: async (reference) => {
          try {
            const rideRes = await axios.post(
              `${import.meta.env.VITE_SERVER_URL}/payment/confirm-first`,
              { reference, pickup: pickupLocation, destination: destinationLocation, vehicleType: selectedVehicle },
              { headers: { token } }
            );
            const rideData = {
              pickup: pickupLocation,
              destination: destinationLocation,
              vehicleType: selectedVehicle,
              fare,
              confirmedRideData,
              _id: rideRes.data._id,
            };
            localStorage.setItem("rideDetails", JSON.stringify(rideData));
            setRideCreated(true);
            rideTimeout.current = setTimeout(() => {
              cancelRide();
            }, import.meta.env.VITE_RIDE_TIMEOUT);
          } catch (err) {
            Console.error(err);
            setSearchError("Payment verified but ride creation failed. Contact support.");
          }
        },
        onClose: () => {},
      });
    } catch (err) {
      Console.error(err);
      setSearchError("Could not initialise payment. Try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Pay second half after ride ends
  const paySecondHalf = async () => {
    const halfFare = Math.ceil(fare[selectedVehicle] / 2);
    const rideId = completedRideId;
    setPaymentLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/payment/initialize`,
        { amount: halfFare, email: user.email, description: `U-bike second payment – ${pickupLocation} to ${destinationLocation}` },
        { headers: { token } }
      );

      pay({
        email: user.email,
        amount: halfFare,
        onSuccess: async (reference) => {
          try {
            await axios.post(
              `${import.meta.env.VITE_SERVER_URL}/payment/confirm-second`,
              { reference, rideId },
              { headers: { token } }
            );
            setShowSecondPayment(false);
            navigate(`/user/rate/${rideId}`);
          } catch (err) {
            Console.error(err);
          }
        },
        onClose: () => {},
      });
    } catch (err) {
      Console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const cancelRide = async () => {
    const rideDetails = JSON.parse(localStorage.getItem("rideDetails"));
    try {
      setLoading(true);
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/cancel?rideId=${rideDetails._id || rideDetails.confirmedRideData?._id}`,
        { headers: { token } }
      );
      setShowRideDetailsPanel(false);
      setShowSelectVehiclePanel(false);
      setShowFindTripPanel(true);
      setDefaults();
      detectLocation();
      ["rideDetails", "panelDetails", "messages", "showPanel", "showBtn"].forEach((k) =>
        localStorage.removeItem(k)
      );
    } catch (error) {
      Console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const setDefaults = () => {
    setPickupLocation("");
    setDestinationLocation("");
    setSelectedVehicle("car");
    setFare({ auto: 0, car: 0, bike: 0 });
    setConfirmedRideData(null);
    setRideCreated(false);
    setSearchError("");
    setShowSecondPayment(false);
    setCompletedRideId(null);
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (user._id) {
      socket.emit("join", { userId: user._id, userType: "user" });
    }

    socket.on("ride-confirmed", (data) => {
      clearTimeout(rideTimeout.current);
      setMapLocation(
        `https://www.google.com/maps?q=${data.captain.location.coordinates[1]},${data.captain.location.coordinates[0]} to ${pickupLocation}&output=embed`
      );
      setConfirmedRideData(data);
    });

    socket.on("ride-started", (data) => {
      setMapLocation(
        `https://www.google.com/maps?q=${data.pickup} to ${data.destination}&output=embed`
      );
    });

    socket.on("ride-ended", (data) => {
      const rideId = data?._id || JSON.parse(localStorage.getItem("rideDetails"))?._id;
      setCompletedRideId(rideId);
      setShowRideDetailsPanel(false);
      setShowSelectVehiclePanel(false);
      setShowFindTripPanel(false);
      setShowSecondPayment(true);
      localStorage.removeItem("panelDetails");
    });
  }, [user]);

  useEffect(() => {
    const storedRideDetails = localStorage.getItem("rideDetails");
    const storedPanelDetails = localStorage.getItem("panelDetails");
    if (storedRideDetails) {
      const ride = JSON.parse(storedRideDetails);
      setPickupLocation(ride.pickup);
      setDestinationLocation(ride.destination);
      setSelectedVehicle(ride.vehicleType);
      setFare(ride.fare);
      setConfirmedRideData(ride.confirmedRideData);
    }
    if (storedPanelDetails) {
      const panels = JSON.parse(storedPanelDetails);
      setShowFindTripPanel(panels.showFindTripPanel);
      setShowSelectVehiclePanel(panels.showSelectVehiclePanel);
      setShowRideDetailsPanel(panels.showRideDetailsPanel);
    }
  }, []);

  useEffect(() => {
    const rideData = { pickup: pickupLocation, destination: destinationLocation, vehicleType: selectedVehicle, fare, confirmedRideData };
    localStorage.setItem("rideDetails", JSON.stringify(rideData));
  }, [pickupLocation, destinationLocation, selectedVehicle, fare, confirmedRideData]);

  useEffect(() => {
    localStorage.setItem("panelDetails", JSON.stringify({ showFindTripPanel, showSelectVehiclePanel, showRideDetailsPanel }));
  }, [showFindTripPanel, showSelectVehiclePanel, showRideDetailsPanel]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", confirmedRideData?._id);
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });
    return () => socket.off("receiveMessage");
  }, [confirmedRideData]);

  return (
    <div
      className="relative w-full h-dvh bg-contain"
      style={{ backgroundImage: `url(${map})` }}
    >
      <Sidebar />
      <iframe
        src={mapLocation}
        className="absolute map w-full h-[120vh]"
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>

      {showFindTripPanel && (
        <div className="absolute b-0 flex flex-col justify-start p-4 pb-2 gap-3 rounded-b-lg bg-white h-fit w-full">
          <h1 className="text-2xl font-semibold">Find a trip</h1>

          <div className="flex items-center relative w-full h-fit">
            <div className="h-3/5 w-[3px] flex flex-col items-center justify-between bg-black rounded-full absolute mx-5">
              <div className="w-2 h-2 rounded-full border-[3px] bg-white border-black"></div>
              <div className="w-2 h-2 rounded-sm border-[3px] bg-white border-black"></div>
            </div>
            <div className="w-full">
              <div className="relative">
                <input
                  id="pickup"
                  placeholder="Add a pick-up location"
                  className="w-full bg-zinc-100 pl-10 pr-10 py-3 rounded-lg outline-black text-sm mb-2 truncate"
                  value={pickupLocation}
                  onChange={onChangeHandler}
                  onFocus={() => setSelectedInput("pickup")}
                  autoComplete="off"
                />
                <button
                  onClick={detectLocation}
                  className="absolute right-2 top-3 text-gray-400 hover:text-black"
                  title="Use my location"
                >
                  <LocateFixed size={18} className={locating ? "animate-pulse text-blue-500" : ""} />
                </button>
              </div>
              <input
                id="destination"
                placeholder="Add a drop-off location"
                className="w-full bg-zinc-100 pl-10 pr-4 py-3 rounded-lg outline-black text-sm truncate"
                value={destinationLocation}
                onChange={onChangeHandler}
                onFocus={() => setSelectedInput("destination")}
                autoComplete="off"
              />
            </div>
          </div>

          {locationDenied && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
              Location access denied. Please allow location in your browser settings, or type your pickup address manually.
            </p>
          )}

          {searchError && (
            <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2">{searchError}</p>
          )}

          {pickupLocation.length > 2 && destinationLocation.length > 2 && (
            <Button
              title={"Search"}
              loading={loading}
              fun={() => getDistanceAndFare(pickupLocation, destinationLocation)}
            />
          )}

          <div className="w-full max-h-48 overflow-y-auto">
            {locationSuggestion.length > 0 && (
              <LocationSuggestions
                suggestions={locationSuggestion}
                setSuggestions={setLocationSuggestion}
                setPickupLocation={(s) => handleSuggestionSelect(s, "pickup")}
                setDestinationLocation={(s) => handleSuggestionSelect(s, "destination")}
                input={selectedInput}
              />
            )}
          </div>
        </div>
      )}

      <SelectVehicle
        selectedVehicle={setSelectedVehicle}
        showPanel={showSelectVehiclePanel}
        setShowPanel={setShowSelectVehiclePanel}
        showPreviousPanel={setShowFindTripPanel}
        showNextPanel={setShowRideDetailsPanel}
        fare={fare}
      />

      <RideDetails
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        selectedVehicle={selectedVehicle}
        fare={fare}
        showPanel={showRideDetailsPanel}
        setShowPanel={setShowRideDetailsPanel}
        showPreviousPanel={setShowSelectVehiclePanel}
        createRide={payFirstHalf}
        cancelRide={cancelRide}
        loading={loading || paymentLoading}
        rideCreated={rideCreated}
        confirmedRideData={confirmedRideData}
      />

      {/* Second-half payment panel */}
      {showSecondPayment && (
        <div className="absolute bottom-0 bg-white w-full rounded-t-xl p-5 shadow-xl">
          <h2 className="text-xl font-semibold mb-1">Ride Completed!</h2>
          <p className="text-sm text-zinc-500 mb-4">
            {pickupLocation.split(", ")[0]} → {destinationLocation.split(", ")[0]}
          </p>
          <div className="flex justify-between items-center bg-zinc-50 rounded-lg px-4 py-3 mb-4">
            <span className="text-sm text-zinc-600">Remaining balance</span>
            <span className="font-bold text-lg">KES {Math.ceil(fare[selectedVehicle] / 2)}</span>
          </div>
          <Button
            title={`Pay KES ${Math.ceil(fare[selectedVehicle] / 2)}`}
            loading={paymentLoading}
            fun={paySecondHalf}
          />
        </div>
      )}
    </div>
  );
}

export default UserHomeScreen;
