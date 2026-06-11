import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { ArrowLeft, ChevronRight, Upload, X } from "lucide-react";
import Console from "../utils/console";
import CameraCapture from "../components/CameraCapture";

function FilePicker({ label, hint, value, onChange }) {
  const ref = useRef();
  return (
    <div className="my-2">
      <h1 className="font-semibold mb-1">{label}</h1>
      {value ? (
        <div className="relative w-full h-36 rounded-lg overflow-hidden bg-zinc-100">
          <img src={value.preview} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => ref.current.click()}
          className="cursor-pointer w-full h-36 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 transition-colors"
        >
          <Upload size={24} className="text-zinc-400" />
          <span className="text-sm text-zinc-500">{hint || "Tap to upload photo"}</span>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const preview = URL.createObjectURL(file);
          onChange({ file, preview });
        }}
      />
    </div>
  );
}

function CaptainSignup() {
  const [responseError, setResponseError] = useState("");
  const [panel, setPanel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nationalIdPhoto, setNationalIdPhoto] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null); // base64 dataUrl from CameraCapture

  const { register, formState: { errors }, getValues } = useForm();
  const navigation = useNavigate();

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const loadPaystack = () => new Promise((resolve) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload = resolve;
    s.onerror = () => resolve(); // fail gracefully
    document.head.appendChild(s);
  });

  const submitRegistration = async (data, paymentReference) => {
    try {
      const [nationalIdBase64, licenseBase64] = await Promise.all([
        toBase64(nationalIdPhoto.file),
        toBase64(licensePhoto.file),
      ]);

      const captainData = {
        fullname: { firstname: data.firstname, lastname: data.lastname },
        email: data.email,
        password: data.password,
        phone: data.phone,
        vehicle: {
          color: data.color,
          number: data.number,
          capacity: data.capacity,
          type: data.type.toLowerCase(),
          make: data.make,
          model: data.model,
          year: data.year,
        },
        documents: {
          nationalIdNumber: data.nationalIdNumber,
          licenseNumber: data.licenseNumber,
          nationalIdPhoto: nationalIdBase64,
          licensePhoto: licenseBase64,
          selfiePhoto,
        },
        paymentReference,
      };

      Console.log(captainData);
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/captain/register`, captainData);
      navigation("/captain/login?registered=true");
    } catch (error) {
      setResponseError(
        error.response?.data?.[0]?.msg ||
        error.response?.data?.message ||
        "Registration failed after payment. Please contact support."
      );
      setPanel(1);
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayAndRegister = async () => {
    if (!nationalIdPhoto) { setResponseError("Please upload National ID photo"); setPanel(3); return; }
    if (!licensePhoto) { setResponseError("Please upload Driving Licence photo"); setPanel(3); return; }
    if (!selfiePhoto) { setResponseError("Please complete face verification first"); return; }

    const data = getValues();
    if (!data.firstname || !data.email || !data.password || !data.phone) {
      setResponseError("Please fill in all personal details");
      setPanel(1);
      return;
    }

    setLoading(true);
    await loadPaystack();

    if (!window.PaystackPop) {
      setResponseError("Payment service unavailable. Check your internet connection.");
      setLoading(false);
      return;
    }

    window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: data.email,
      amount: 200000, // KES 2000 in kobo (1 KES = 100 kobo)
      currency: 'KES',
      metadata: { type: 'captain_registration', name: `${data.firstname} ${data.lastname}` },
      callback: (response) => {
        submitRegistration(data, response.reference);
      },
      onClose: () => {
        setLoading(false);
        setResponseError('Payment was not completed. You must pay KES 2,000 to register.');
      },
    }).openIframe();
  };

  useEffect(() => {
    if (responseError) setTimeout(() => setResponseError(""), 5000);
  }, [responseError]);

  return (
    <div className="w-full min-h-dvh flex flex-col justify-between p-4 pt-6">
      <div>
        <Heading title={"Captain Sign Up 🚕"} />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${panel >= step ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
                {step}
              </div>
              {step < 4 && <div className={`h-0.5 w-6 ${panel > step ? "bg-black" : "bg-gray-200"}`} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-gray-500">
            {panel === 1 ? "Personal Info" : panel === 2 ? "Vehicle Details" : panel === 3 ? "Documents" : "Face Verification"}
          </span>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>

          {/* ── Panel 1: Personal Info ── */}
          {panel === 1 && (
            <>
              <div className="flex gap-4 -mb-2">
                <Input label="First name" name="firstname" register={register} error={errors.firstname} />
                <Input label="Last name" name="lastname" register={register} error={errors.lastname} />
              </div>
              <Input label="Phone Number" type="number" name="phone" register={register} error={errors.phone} />
              <Input label="Email" type="email" name="email" register={register} error={errors.email} />
              <Input label="Password" type="password" name="password" register={register} error={errors.password} />
              {responseError && <p className="text-sm text-center mb-4 text-red-500">{responseError}</p>}
              <div
                className="cursor-pointer flex justify-center items-center gap-2 py-3 font-semibold bg-black text-white w-full rounded-lg"
                onClick={() => setPanel(2)}
              >
                Next — Vehicle Details <ChevronRight strokeWidth={2.5} />
              </div>
            </>
          )}

          {/* ── Panel 2: Vehicle Details ── */}
          {panel === 2 && (
            <>
              <ArrowLeft onClick={() => setPanel(1)} className="cursor-pointer -ml-1 mb-4" />
              <div className="flex gap-4 -my-2">
                <Input label="Vehicle colour" name="color" register={register} error={errors.color} />
                <Input label="Capacity" type="number" name="capacity" register={register} error={errors.capacity} />
              </div>
              <Input label="Number plate" name="number" register={register} error={errors.number} />
              <Input label="Vehicle type" type="select" options={["Car", "Bike", "Auto"]} name="type" register={register} error={errors.type} />
              <div className="flex gap-4 -my-2">
                <Input label="Make (e.g. Toyota)" name="make" register={register} error={errors.make} />
                <Input label="Model (e.g. Axio)" name="model" register={register} error={errors.model} />
              </div>
              <Input label="Year (e.g. 2019)" type="number" name="year" register={register} error={errors.year} />
              {responseError && <p className="text-sm text-center mb-4 text-red-500">{responseError}</p>}
              <div
                className="cursor-pointer flex justify-center items-center gap-2 py-3 font-semibold bg-black text-white w-full rounded-lg"
                onClick={() => setPanel(3)}
              >
                Next — Documents <ChevronRight strokeWidth={2.5} />
              </div>
            </>
          )}

          {/* ── Panel 3: Documents ── */}
          {panel === 3 && (
            <>
              <ArrowLeft onClick={() => setPanel(2)} className="cursor-pointer -ml-1 mb-4" />
              <p className="text-sm text-gray-500 mb-4">
                Your documents are kept private and used only for identity verification by our team.
              </p>

              <Input label="National ID Number" name="nationalIdNumber" register={register} error={errors.nationalIdNumber} placeholder="e.g. 12345678" />
              <FilePicker
                label="National ID Photo"
                hint="Take a clear photo of your National ID card"
                value={nationalIdPhoto}
                onChange={setNationalIdPhoto}
              />

              <Input label="Driving Licence Number" name="licenseNumber" register={register} error={errors.licenseNumber} placeholder="e.g. DL/001/2020" />
              <FilePicker
                label="Driving Licence Photo"
                hint="Take a clear photo of your Driving Licence"
                value={licensePhoto}
                onChange={setLicensePhoto}
              />

              {responseError && <p className="text-sm text-center mb-4 text-red-500">{responseError}</p>}
              <div
                className="cursor-pointer flex justify-center items-center gap-2 py-3 font-semibold bg-black text-white w-full rounded-lg"
                onClick={() => {
                  if (!nationalIdPhoto) { setResponseError("Please upload a photo of your National ID"); return; }
                  if (!licensePhoto)    { setResponseError("Please upload a photo of your Driving Licence"); return; }
                  setResponseError("");
                  setPanel(4);
                }}
              >
                Next — Face Verification <ChevronRight strokeWidth={2.5} />
              </div>
            </>
          )}

          {/* ── Panel 4: Face Verification ── */}
          {panel === 4 && (
            <>
              <ArrowLeft onClick={() => setPanel(3)} className="cursor-pointer -ml-1 mb-4" />
              <p className="text-sm text-gray-500 mb-4">
                Take a clear selfie so we can verify your identity. Look straight at the camera in a well-lit area.
              </p>

              <CameraCapture
                onCapture={(dataUrl) => setSelfiePhoto(dataUrl)}
                onError={(msg) => setResponseError(msg)}
              />

              {responseError && <p className="text-sm text-center mt-3 mb-2 text-red-500">{responseError}</p>}

              {selfiePhoto && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handlePayAndRegister}
                    disabled={loading}
                    className="w-full py-3.5 bg-black text-white rounded-xl font-semibold flex flex-col items-center justify-center disabled:opacity-60 transition"
                  >
                    {loading ? "Processing…" : "Pay KES 2,000 & Create Account"}
                    {!loading && (
                      <span className="text-xs font-normal opacity-70 mt-0.5">
                        Registration fee · Secure payment via Paystack
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </form>

        <p className="text-sm font-normal text-center mt-4">
          Already have an account?{" "}
          <Link to="/captain/login" className="font-semibold">Login</Link>
        </p>
      </div>

      <div className="mt-6">
        <Button type="link" path="/signup" title="Sign Up as User" classes="bg-green-500" />
        <p className="text-xs font-normal text-center mt-4">
          This site is protected by reCAPTCHA and the Google{" "}
          <span className="font-semibold underline">Privacy Policy</span> and{" "}
          <span className="font-semibold underline">Terms of Service</span> apply.
        </p>
      </div>
    </div>
  );
}

export default CaptainSignup;
