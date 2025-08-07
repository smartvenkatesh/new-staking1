import { jwtDecode } from "jwt-decode";

export default function decodeToken(token) {
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}