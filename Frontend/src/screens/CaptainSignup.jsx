import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Console from "../utils/console";

// Panel 1 → Personal details
// Panel 2 → Vehicle details
// Panel 3 → Documents (National ID + Licence)

function CaptainSignup() {
  const [responseError, setResponseError] = useState("");
  const [panel, setPanel] = useState(1); // 1 | 2 | 3
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();

  const signupCaptain = async (data) => {
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
      },
    };
    Console.log(captainData);

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/captain/register`, captainData);
      navigation("/captain/login?registered=true");
    } catch (error) {
      setResponseError(
        error.response?.data?.[0]?.msg ||
        error.response?.data?.message ||
        "Registration failed"
      );
      setPanel(1);
      Console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (responseError) setTimeout(() => setResponseError(""), 5000);
  }, [responseError]);

  return (
    <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6">
      <div>
        <Heading title={"Captain Sign Up 🚕"} />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${panel >= step ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
              >
                {step}
              </div>
              {step < 3 && (
                <div className={`h-0.5 w-8 ${panel > step ? "bg-black" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-gray-500">
            {panel === 1 ? "Personal Info" : panel === 2 ? "Vehicle Details" : "Documents"}
          </span>
        </div>

        <form onSubmit={handleSubmit(signupCaptain)}>

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

              {responseError && (
                <p className="text-sm text-center mb-4 text-red-500">{responseError}</p>
              )}
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
              <Input
                label="Vehicle type"
                type="select"
                options={["Car", "Bike", "Auto"]}
                name="type"
                register={register}
                error={errors.type}
              />
              <div className="flex gap-4 -my-2">
                <Input label="Make (e.g. Toyota)" name="make" register={register} error={errors.make} />
                <Input label="Model (e.g. Axio)" name="model" register={register} error={errors.model} />
              </div>
              <Input label="Year (e.g. 2019)" type="number" name="year" register={register} error={errors.year} />

              {responseError && (
                <p className="text-sm text-center mb-4 text-red-500">{responseError}</p>
              )}
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
                Your documents are kept private and used only for identity verification.
              </p>

              <Input
                label="National ID Number"
                name="nationalIdNumber"
                register={register}
                error={errors.nationalIdNumber}
                placeholder="e.g. 12345678"
              />
              <Input
                label="Driving Licence Number"
                name="licenseNumber"
                register={register}
                error={errors.licenseNumber}
                placeholder="e.g. DL/001/2020"
              />

              {responseError && (
                <p className="text-sm text-center mb-4 text-red-500">{responseError}</p>
              )}
              <Button title="Create Account" loading={loading} type="submit" />
            </>
          )}
        </form>

        <p className="text-sm font-normal text-center mt-4">
          Already have an account?{" "}
          <Link to="/captain/login" className="font-semibold">
            Login
          </Link>
        </p>
      </div>

      <div>
        <Button type="link" path="/signup" title="Sign Up as User" classes="bg-green-500" />
        <p className="text-xs font-normal text-center self-end mt-6">
          This site is protected by reCAPTCHA and the Google{" "}
          <span className="font-semibold underline">Privacy Policy</span> and{" "}
          <span className="font-semibold underline">Terms of Service</span> apply.
        </p>
      </div>
    </div>
  );
}

export default CaptainSignup;
