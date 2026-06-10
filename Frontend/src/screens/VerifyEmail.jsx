import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import mailImg from "/mail.png";
import { Button, Spinner } from "../components";

const VerifyEmail = () => {
  const { userType } = useParams();
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase puts tokens in the URL hash after email verification
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const type = params.get("type");
    const accessToken = params.get("access_token");

    if (accessToken && type === "signup") {
      setVerified(true);
      setMessage("Your email has been verified successfully. You can now log in.");
    } else if (accessToken) {
      // Any valid token redirect counts as verified
      setVerified(true);
      setMessage("Your email has been verified successfully. You can now log in.");
    } else {
      setMessage("Invalid or expired verification link. Please request a new one.");
    }
  }, []);

  return (
    <div className="w-full h-dvh flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-2xl font-bold">Email Verification</h1>
      <img src={mailImg} alt="Verify Email" className="h-24 mx-auto mb-4" />
      <p className="text-md font-semibold">{message || <Spinner />}</p>
      <Button
        title={verified ? "Go to Login" : "Go to Home"}
        classes="mt-6"
        fun={() => navigate(verified
          ? (userType === "captain" ? "/captain/login" : "/login")
          : (userType === "captain" ? "/captain/home" : "/home")
        )}
      />
    </div>
  );
};

export default VerifyEmail;
