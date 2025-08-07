import nodemailer from 'nodemailer'

export const sendOTPEmail = async (email, otp) => {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "venkatesh619dx@gmail.com",
        pass: "epnr nxro tuwg lmhu",
      },
    });
  
    await transporter.sendMail({
      from: "venkatesh619dx@gmail.com",
      to: email,
      subject: "OTP from Staking website",
      html: `<p> OTP : <b>${otp}</b></p><span>expired in 20 seconds</span>`,
     
    });
  };
  
  export const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();
  