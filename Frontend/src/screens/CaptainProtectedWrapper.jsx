import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCaptain } from "../contexts/CaptainContext";
import VerifyEmail from "../components/VerifyEmail";
import Loading from "./Loading";
import CaptainPendingApproval from "./CaptainPendingApproval";
import CaptainModeSelect from "./CaptainModeSelect";

function CaptainProtectedWrapper({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { captain, setCaptain } = useCaptain();

  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [vehicleType, setVehicleType] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/captain/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/captain/profile`, {
        headers: { token },
      })
      .then((response) => {
        if (response.status === 200) {
          const captainData = response.data.captain;
          setCaptain(captainData);
          localStorage.setItem("userData", JSON.stringify({ type: "captain", data: captainData }));
          setIsVerified(captainData.emailVerified);
          setApprovalStatus(captainData.approvalStatus || "pending");
          setActiveMode(captainData.activeMode || null);
          setVehicleType(captainData.vehicle?.type || null);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        navigate("/captain/login");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Loading />;

  if (isVerified === false) {
    return <VerifyEmail user={captain} role={"captain"} />;
  }

  if (approvalStatus === "pending" || approvalStatus === "rejected") {
    return <CaptainPendingApproval captain={captain} />;
  }

  // Approved — check if mode needs to be selected
  // Bike captains must choose between rides or errands
  // Car / auto captains are rides-only, skip selection
  if (approvalStatus === "approved" && vehicleType === "bike" && !activeMode) {
    return <CaptainModeSelect captain={captain} />;
  }

  return <>{children}</>;
}

export default CaptainProtectedWrapper;
