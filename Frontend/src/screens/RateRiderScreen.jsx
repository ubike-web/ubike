import { useState } from "react";
import { Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Button from "../components/Button";

function RateRiderScreen() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitRating = async () => {
    if (!rating) {
      setError("Please select a star rating");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/rate`,
        { rideId, rating },
        { headers: { token } }
      );
      ["rideDetails", "panelDetails", "messages", "showPanel", "showBtn"].forEach((k) =>
        localStorage.removeItem(k)
      );
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit rating. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const skipRating = () => {
    ["rideDetails", "panelDetails", "messages", "showPanel", "showBtn"].forEach((k) =>
      localStorage.removeItem(k)
    );
    navigate("/home");
  };

  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-white px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
          <Star size={36} className="text-yellow-400 fill-yellow-400" />
        </div>
        <h1 className="text-2xl font-bold mb-1">Rate your rider</h1>
        <p className="text-sm text-zinc-500 mb-8">
          How was your experience? Your feedback helps improve the service.
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform active:scale-90"
            >
              <Star
                size={40}
                className={`transition-colors ${
                  star <= (hovered || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-zinc-300"
                }`}
              />
            </button>
          ))}
        </div>

        {(hovered || rating) > 0 && (
          <p className="text-sm font-semibold text-zinc-700 mb-6">
            {labels[hovered || rating]}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2 mb-4">{error}</p>
        )}

        <Button
          title="Submit Rating"
          loading={loading}
          fun={submitRating}
          classes="mb-3"
        />
        <button
          onClick={skipRating}
          className="w-full text-sm text-zinc-400 hover:text-zinc-600 py-2"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default RateRiderScreen;
