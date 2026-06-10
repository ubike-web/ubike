const blacklistTokenModel = require("../models/blacklistToken.model");
const supabase = require("../config/supabase");
const userModel = require("../models/user.model");
const captainModel = require("../models/captain.model");

async function getAuthUser(token) {
  const isBlacklisted = await blacklistTokenModel.findOne({ token });
  if (isBlacklisted) return { error: "blacklisted" };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: "invalid" };

  return { user };
}

module.exports.authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.token;
  if (!token) return res.status(401).json({ message: "Unauthorized User" });

  const { user, error } = await getAuthUser(token);
  if (error) return res.status(401).json({ message: "Unauthorized User" });

  if (user.user_metadata?.userType !== 'user') {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  const profile = await userModel.findOne({ _id: user.id });
  if (!profile) return res.status(401).json({ message: "Unauthorized User" });

  req.user = {
    _id: profile._id,
    fullname: profile.fullname,
    email: profile.email,
    phone: profile.phone,
    rides: profile.rides,
    socketId: profile.socketId,
    emailVerified: !!user.email_confirmed_at,
  };
  req.userType = "user";
  next();
};

module.exports.authCaptain = async (req, res, next) => {
  const token = req.cookies.token || req.headers.token;
  if (!token) return res.status(401).json({ message: "Unauthorized User" });

  const { user, error } = await getAuthUser(token);
  if (error) return res.status(401).json({ message: "Unauthorized User" });

  if (user.user_metadata?.userType !== 'captain') {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  const profile = await captainModel.findOne({ _id: user.id });
  if (!profile) return res.status(401).json({ message: "Unauthorized User" });

  req.captain = {
    _id: profile._id,
    fullname: profile.fullname,
    email: profile.email,
    phone: profile.phone,
    rides: profile.rides,
    socketId: profile.socketId,
    emailVerified: !!user.email_confirmed_at,
    vehicle: profile.vehicle,
    status: profile.status,
  };
  req.userType = "captain";
  next();
};
