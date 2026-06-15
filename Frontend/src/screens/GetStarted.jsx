import { useEffect, useState } from "react";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "../components/index";
import background from "/get_started_illustration.jpg";
import { useNavigate } from "react-router-dom";
import logo from '/icon-ubike.png';

function GetStarted() {
  const navigate = useNavigate();
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      if (JSON.parse(userData).type == "user") {
        navigate("/home", { replace: true });
      } else if (JSON.parse(userData).type == "captain") {
        navigate("/captain/home", { replace: true });
      }
    }
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      className="flex flex-col justify-between w-full h-full bg-cover bg-center"
      style={{ backgroundImage: `url(${background})` }}
    >
      <img
        className="h-[120px] object-contain m-4 self-start"
        src={logo}
        alt="Logo"
      />

      {/* Download banner — only on Android/mobile */}
      {isAndroid && (
        <div
          className="mx-3 mb-2 flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #040F26ee, #0A2D6Eee)',
            border: '1px solid rgba(66,200,245,0.3)',
            boxShadow: '0 4px 20px rgba(14,134,202,0.3)',
          }}
          onClick={() => navigate("/download")}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0A2D6E, #0E86CA)' }}
          >
            <Download size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold leading-tight">Get the U-bike App</p>
            <p className="text-[#42C8F5] text-xs truncate">Tap to download · Free · Android</p>
          </div>
          <div
            className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: '#42C8F5', color: '#0A1A2E' }}
          >
            Install
          </div>
        </div>
      )}

      <div className="flex flex-col bg-white p-4 pb-8 gap-8 rounded-t-lg">
        <h1 className="text-2xl font-semibold">Get started with U-bike</h1>
        <Button
          title={"Continue"}
          path={"/login"}
          type={"link"}
          icon={<ArrowRight />}
        />
      </div>
    </div>
  );
}

export default GetStarted;
