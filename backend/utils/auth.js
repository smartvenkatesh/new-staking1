
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEYS.split(",");

export const generateToken = (user) => {
  const keyIndex = Math.floor(Math.random() * SECRET_KEY.length);
  const secret = SECRET_KEY[keyIndex];
  console.log('secret',secret);

  return jwt.sign(
    {
      _id: user._id,
      role: user.role || "user",
      name: user.username,
    },
    secret,
    {
      expiresIn: "1d",
      header: { kid: keyIndex },
    }
  );
};
