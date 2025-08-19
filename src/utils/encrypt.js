import CryptoJS from "crypto-js";
import dotenv from "dotenv"
dotenv.config()

const secret = process.env.SECRET_KEY;
console.log('secret',secret);


export const encrypt=(data)=>{
    const cipherText = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      process.env.SECRET_KEY
    ).toString();
    return {encryptedData:cipherText}
}