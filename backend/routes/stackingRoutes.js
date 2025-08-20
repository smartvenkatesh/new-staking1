import express from "express";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import Web3 from "web3";
import Wallet from "../models/Wallet.js";
import mongoose from "mongoose";
import Staking from "../models/Staking.js";
import cron from "node-cron";
import Currency from "../models/Currency.js";
import { generateOTP, sendOTPEmail } from "../utils/sendMail.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { generateToken } from "../utils/auth.js";
import Config from "../models/Config.js";
import History from "../models/History.js";

const fetchCryptoRates = async () => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,avalanche-2&vs_currencies=usd"
    );
    const data = await response.json();
    return {
      ETH: data.ethereum.usd,
      AVAX: data["avalanche-2"].usd,
    };

  } catch (error) {
    console.error("Error fetching crypto rates:", error);
    return { ETH: 0, AVAX: 0 };
  }
};

const getBalance = async (address, network) => {
  let rpcUrl;
  let cryptoRate;

  const { ethRate, avaxRate } = await fetchCryptoRates();

  if (network === "ETH") {
    rpcUrl = "https://sepolia.infura.io/v3/1a91b5d9c415499e9ef832508938e497";
    cryptoRate = ethRate;
    console.log("cryptoRate", cryptoRate);
  } else if (network === "AVAX") {
    rpcUrl = "https://api.avax.network/ext/bc/C/rpc";
    cryptoRate = avaxRate;
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  const balance = await web3.eth.getBalance(address);
  console.log("balance", balance);

  const balanceInEth = web3.utils.fromWei(balance, "ether");
  console.log("balanceInEth", balanceInEth);

  const virtualMoneyInUsd = 100;

  const virtualMoneyInCrypto = virtualMoneyInUsd / cryptoRate;

  console.log(
    "Virtual money in crypto (ETH/AVAX equivalent):",
    virtualMoneyInCrypto
  );

  return { balanceInEth, virtualMoneyInCrypto };
};

const router = express.Router();


router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body.formData;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newAppUser = {
      username,
      email,
      password,
    };

    const saved = await User.create(newAppUser);

    res
      .status(200)
      .json({ message: "user successfully register", userId: saved._id });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body.form;
  try {
    const user = await User.findOne({ email: email });

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const otp = generateOTP()
    user.otp = otp
    await user.save()
    await sendOTPEmail(email, otp)
    setTimeout(async () => {
      user.otp = null
      await user.save()
    }, 20000)

    res.status(200).json({
      message: "Login successful",
      user_id: user._id,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/login/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;
  console.log('req.body', req.body);

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    user.loginCheck = true;
    user.otp = null;
    await user.save();
    console.log("user after verify", user);

    const jwtToken = generateToken(user)
    console.log("jwtToken", jwtToken);

    res.status(200).json({ message: "OTP verified successfully", user, jwtToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login/resendOtp", async (req, res) => {
  const { userId } = req.body;
  try {
    const resend = await User.findById(userId);
    const otp = generateOTP();
    resend.otp = otp;
    await resend.save();
    await sendOTPEmail(resend.email, otp);
    setTimeout(async () => {
      resend.otp = null;
      await resend.save();
    }, 20000);

    const token = generateToken(resend);

    return res.json({
      success: true,
      token,
      userId: resend._id,
      name: resend.name,
      role: "user" || resend.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post("/addCurrency", authenticate, authorize("admin"), async (req, res) => {
  const { currencyName, currencySymbol} = req.body;
  console.log('req.body',req.body);
  
  try {
    const currency = await Currency.findOne({ currencySymbol });
    if (currency) {
      return res.status(400).json({ message: "This currency already added" });
    }
    const addCurrency = new Currency({
      currencyName,
      currencySymbol,
    });

    await addCurrency.save();
    res.status(200).json({ message: "New Currency Added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/createConfig",authenticate,authorize("admin"),
  async (req, res) => {
    const { network, type, plans } = req.body;
    
    try {
      const currency = await Currency.findOne({ currencyName: network });
      const exists = await Config.find({currencySymbol:currency.currencySymbol})
      let result = exists.map((exit) => exit.type);
      let final = result.includes("flexible");
      console.log("final",final);
      
      if(exists.length >= 3 && type === "fixed"){
        return res.status(400).json({message:"Only 3 plans allowed"})
      }

      if(final === true && type === "flexible"){
        return res.status(400).json({message:`Already flexible type added in
           ${currency.currencySymbol}`})
      }
      
      const config = new Config({
        currencySymbol:currency.currencySymbol,
        type,
        plans,
      });

      await config.save();
      res.status(200).json({ message: "Config created successfully" });
    } catch (err) {
      console.error("Config create error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.put(
  "/updateConfig/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    const { duration, apr } = req.body;

    try {
      const config = await Config.findById(req.params.id);
      if (!config) return res.status(404).json({ message: "Config not found" });

      const plan = config.plans.find((p) => p.duration === duration);
      if (!plan) return res.status(404).json({ message: "Duration not found" });

      plan.apr = apr;
      await config.save();

      res.status(200).json({ message: "Config updated successfully", config });
    } catch (err) {
      console.error("Config update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete("/deleteConfig/:id", authenticate, authorize("admin"),
async(req,res)=>{
  const {id} = req.params
  try {
    const config = await Config.findByIdAndDelete({_id:id})
    
    res.json({message:"Config successfully deleted"})

  } catch (error) {
     console.error("Config delete error:", err);
     res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/getCurrency", authenticate, authorize("admin","user"), async(req, res)=>{
  const currency = await Currency.find({})
  res.status(200).json(currency)
});

router.get("/getConfig/:currencySymbol",authenticate,authorize("admin","user"),async(req,res)=>{
  const {currencySymbol} = req.params
  const config = (await Config.find({currencySymbol}).sort({plans:1})).reverse()

  res.status(200).json(config)
})

router.get("/getConfigAdmin",authenticate,authorize("admin", "user"),async (req, res) => {

    const config = await Config.find({});

    res.status(200).json(config);
  }
);

router.post("/wallet", authenticate, authorize("user"), async (req, res) => {
  const { user_id, address, key, type } = req.body;

  try {
    const addAddress = await User.findById(user_id);
    const addWallets = new Wallet({
      userId: user_id,
      address: address,
      privateKey: key,
      type: type,
      amount: 0,
    });
    await addWallets.save();

    res.status(200).json(addWallets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Wallet creation failed" });
  }
});

router.get("/address/:userId", authenticate, authorize("admin", "user"), async (req, res) => {
  const { userId } = req.params;

  if (!userId || userId === "null") {
    return res.status(400).json({ message: "Invalid userId" });
  }

  const newUserId = new mongoose.Types.ObjectId(userId);

  try {
    const user = await Wallet.find({ userId: newUserId });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/getCurrency", authenticate, authorize("admin", "user"), async (req, res) => {
  try {
    const getCurrency = await Currency.find({});
    res.json(getCurrency);
  } catch (error) {
    console.log(error);
  }
});

router.post("/addAddress", authenticate, authorize("user"), async (req, res) => {
  const { userId, address, currencyName, privateKey } = req.body;
  try {
    const currency = await Currency.findOne(
      { currencyName: currencyName },
      { _id: 1, currencySymbol: 1 }
    );
    const exists = await Wallet.findOne({ userId: userId, currencyId: currency._id });
    console.log('exists', exists);

    if (exists) {
      return res
        .status(400)
        .json({ message: "Already address created this currency" });
    }

    const addAddress = {
      userId,
      currencyId: currency._id,
      address,
      currencyType: currency.currencySymbol,
      privateKey,
    };
    console.log("addAddress", addAddress);

    await Wallet.create(addAddress);
    res.status(200).json({ message: "Address created Succefully" });
  } catch (error) {
    console.log(error);
  }
});

router.get("/balance/:address/:network", authenticate, authorize("admin", "user"), async (req, res) => {
  const { address, network } = req.params;

  try {
    const wallet = await Wallet.findOne({ address });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const virtualUsd = parseFloat(wallet.amount || 0);

    const { ethRate, avaxRate } = await fetchCryptoRates();

    let virtualInCrypto;
    if (network === "ETH") {
      virtualInCrypto = virtualUsd / ethRate;
      console.log("virtualInCrypto", virtualInCrypto);
    } else if (network === "AVAX") {
      virtualInCrypto = virtualUsd / avaxRate;
    }

    const realBal = await getBalance(address, network);

    res.json({
      address,
      network,
      realBalanceInCrypto: realBal.balanceInEth,
      virtualUsd,
      virtualInCrypto: virtualInCrypto.toFixed(6),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching balance" });
  }
});

router.get("/getAddress/:depositId", authenticate, authorize("user"), async (req, res) => {
  const { depositId } = req.params;
  const newUserId = new mongoose.Types.ObjectId(depositId);

  try {
    const getUser = await Wallet.find(
      { userId: newUserId },
      { _id: 1, address: 1 }
    );

    res.status(200).json(getUser);
  } catch (error) {
    console.log(error);
  }
});

// router.get("/getConfig", authenticate, authorize("user"), async (req, res) => {
//   const config = await Config.find({})
//   res.status(200).json(config)
// })

router.post("/addAmount", authenticate, authorize("user"), async (req, res) => {
  const { account, amount } = req.body;
  try {
    let wallet = await Wallet.findOne({ address: account });

    wallet.amount = (parseFloat(wallet.amount) || 0) + parseFloat(amount);
    await wallet.save();

    res.status(200).json({ message: "Amount added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all-wallets", authenticate, authorize("admin"), async (req, res) => {
  try {
    const wallets = await Wallet.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "admin",
        },
      },
      { $unwind: "$admin" },
      {
        $project: {
          _id: 1,
          address: 1,
          currencyType: 1,
          amount: 1,
          "admin.username": 1,
        },
      },
    ]);
    res.status(200).json(wallets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching wallets" });
  }
});

router.post("/stake", authenticate, authorize("user"), async (req, res) => {
  const { userId, walletId, amount, duration, apr, stakeType, network } = req.body;
  console.log('req.body', req.body);

  try {

    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.amount < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if(wallet.amount - amount < 30){
      return res.status(400).json({message:"Atleast maintain minimum balance 30 usd"})
    }

    if (stakeType === "flexible" && duration < 0) {
      return res.status(404).json({ message: "flexible stake available only 24 hours" })
    }
    
    wallet.amount -= amount;
    await wallet.save();

    const newStake = new Staking({
      userId,
      walletId,
      amount,
      duration: stakeType === "flexible" ? 0 : duration,
      apr,
      type: stakeType,
      network,
    });

    await newStake.save();

    res.status(200).json({ message: "Staking successful", stake: newStake });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Staking failed" });
  }
});

router.get("/stakes/:select", authenticate, authorize("admin", "user"), async (req, res) => {
  const { select } = req.params;
  try {
    const stakes = await Staking.aggregate([
      { $match: { type: select } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "_id",
          as: "wallet_details",
        },
      },
      { $unwind: "$wallet_details" },
      {
        $project: {
          _id: 1,
          amount: 1,
          network: 1,
          duration: 1,
          status: 1,
          stakeDate: 1,
          rewards: 1,
          type: 1,
          "user_details.username": 1,
          "wallet_details.address": 1,
          "wallet_details.amount": 1,
        },
      },
    ]);

    res.status(200).json(stakes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stakes" });
  }
});

router.get("/stakes", authenticate, authorize("admin", "user"), async (req, res) => {
  try {
    const stakes = await Staking.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "_id",
          as: "wallet_details",
        },
      },
      { $unwind: "$wallet_details" },
      {
        $project: {
          _id: 1,
          amount: 1,
          network: 1,
          duration: 1,
          status: 1,
          stakeDate: 1,
          rewards: 1,
          type: 1,
          "user_details.username": 1,
          "wallet_details.address": 1,
          "wallet_details.amount": 1,
        },
      },
    ]);

    res.status(200).json(stakes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stakes" });
  }
});

router.get("/customerStake/:userId", authenticate, authorize("admin", "user"), async (req, res) => {
  const { userId } = req.params;
  const newUserId = new mongoose.Types.ObjectId(userId);

  try {
    const customer = await Staking.aggregate([
      { $match: { userId: newUserId } },
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "_id",
          as: "stakeDetails",
        },
      },
      { $unwind: "$stakeDetails" },
      {
        $project: {
          _id: 1,
          amount: 1,
          type: 1,
          rewards: 1,
          status: 1,
          "stakeDetails.amount": 1,
          "stakeDetails.address": 1,
          "stakeDetails.currencyType": 1
        },
      },
    ]);

    res.status(200).json(customer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/radeem/:stakeId", authenticate, authorize("user"), async (req, res) => {
  const { stakeId } = req.params
  const newUserId = new mongoose.Types.ObjectId(stakeId);
  try {
    const stake = await Staking.aggregate([
      { $match: { _id: newUserId } },
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "_id",
          as: "walletDetails"
        }
      }, {
        $unwind: "$walletDetails"
      }, {
        $project: {
          _id: 0,
          "walletDetails.address": 1,
          amount: 1,
          network: 1,
          type: 1,
          rewards: 1
        }
      }
    ])
    console.log('radeem stake', stake);
    res.status(200).json(stake)

  } catch (error) {
    console.log(error);
  }
})

router.get("/stakeAmount/:account", authenticate, authorize("admin", "user"), async (req, res) => {
  const { account } = req.params;
  try {
    const wallet = await Wallet.aggregate([
      { $match: { address: account } },
      {
        $lookup: {
          from: "stakings",
          localField: "_id",
          foreignField: "walletId",
          as: "stakeAmount",
        },
      },
      {
        $unwind: "$stakeAmount",
      },
      {
        $project: {
          _id: 1,
          "stakeAmount.amount": 1,
          "stakeAmount.status": 1,
        },
      },
    ]);
    const result = wallet.filter(
      (wall) => wall.stakeAmount.status === "active"
    );
    console.log("result", result);
    res.status(200).json(result[0].stakeAmount.amount);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Stake Not Found" });
  }
});

router.get("/radeemAmount/:stakeId", authenticate, authorize("user"), async (req, res) => {
  const { stakeId } = req.params
  try {
    const radeem = await Staking.findOne({ _id: stakeId }, { _id: 0, amount: 1 })
    res.status(200).json(radeem)
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" })
  }
})

router.post("/withdraw/radeem/:stakeId", authenticate, authorize("admin", "user"), async (req, res) => {
  const { stakeId } = req.params
  const newUserId = new mongoose.Types.ObjectId(stakeId);
  const { account } = req.body;
  const wallet = await Wallet.findOne({ address: account });
  const stake = await Staking.findOne({
    _id: newUserId,
  });
  const history = new History({
    userId:stake.userId,
    walletId:stake.walletId,
    stakeAddress:wallet.address,
    amount:stake.amount,
    network:stake.network,
    stakeDate:stake.stakeDate,
    duration:stake.duration,
    apr:stake.apr,
    type:stake.type,
    status:stake.status,
    rewards:stake.rewards,
    update:stake.update
  })

  await history.save()

  const now = Date.now();
  const stakeEnd =
    new Date(stake.stakeDate).getTime() + stake.duration * 24 * 60 * 60 * 1000;
  const daysPassed = Math.floor((now - new Date(stake.stakeDate)) / (1000 * 60 * 60 * 24));

  const hoursPassed =
    (Date.now() - new Date(stake.stakeDate)) / (1000 * 60 * 60);
    if(stake.amount === 0){
      return res.status(400).json({message:"stake amount is 0"})
    }

  if (stake.type === "fixed") {
    if (now >= stakeEnd) {
      wallet.amount += stake.amount + (stake.rewards || 0);
      stake.status = "completed";
      stake.rewards = 0;
      stake.amount = 0;
      console.log("test 1");
      
    }else if (daysPassed >= 2 && stake.status === "active") {
      wallet.amount += stake.amount + stake.rewards / 2;
      stake.status = "cancelled";
      stake.rewards = 0;
      stake.amount = 0;
      console.log("wallet.amount", wallet.amount);
      console.log("test 2");
    } else {
      wallet.amount += stake.amount;
      stake.status = "cancelled";
      stake.rewards = 0;
      stake.amount = 0;
      console.log("test 3");
       await wallet.save();
       await stake.save();
       history.status = stake.status;
       await history.save();
       res.status(200).json({ message: "Withdraw Successful" });
      return;
    }
  } 
  
  const flexibleCheck = now >= stakeEnd
  console.log("flexibleCheck",flexibleCheck);

  if (stake.type === "flexible") {
    if(stake.status === "completed"){
    wallet.amount += stake.amount + (stake.rewards || 0);
    stake.rewards = 0;
    stake.amount = 0;
    console.log("test 4");
    }else{
      wallet.amount += stake.amount;
      stake.status = "cancelled";
      stake.amount = 0;
      stake.rewards = 0;
      console.log("test 5");
    }
  } 
  console.log("test 6");
  await wallet.save();
  await stake.save();
  history.status = stake.status;
  await history.save();
  res.status(200).json({ message: "Withdraw processed" });
});

router.get("/getHistory/:userId",authenticate,authorize("admin","user"),async(req,res)=>{
   const { userId } = req.params;
   const newUserId = new mongoose.Types.ObjectId(userId);
   try {
    const history = await History.aggregate([
      {$match:{userId:newUserId}},
      {$lookup:{
        from:"wallets",
        localField:"walletId",
        foreignField:"_id",
        as:"walletAddress"
      }},{
        $unwind:"$walletAddress"
      },
      {
        $project:{
          _id:0,
          "walletAddress.address":1,
          amount:1,
          network:1,
          duration:1,
          apr:1,
          stakeDate:1,
          type:1,
          status:1,
          rewards:1,
          update:1
        }
      }
    ])
    
    res.status(200).json(history)
   } catch (error) {
    console.log(error);
    res.status(500).json({message:"Internal server error"})
   }
})

cron.schedule("*/10 * * * *", async () => {
  console.log("Running staking reward cron...");

  try {
    const activeStakes = await Staking.find({ status: "active" });
    const cryptoRates = await fetchCryptoRates();
    console.log('cryptoRates', cryptoRates);

    for (const stake of activeStakes) {
      const stakeDate = new Date(stake.stakeDate);
      console.log('stakeDate',stakeDate);
      
      const now = new Date();
      console.log('now',now);
      
      const hoursPassed = (now - stakeDate) / (1000 * 60 * 60);
      console.log("hoursPassed", hoursPassed);
      const daysPassed = Math.floor(hoursPassed / 24);
        const stakeEnd =
          new Date(stake.stakeDate).getTime() +
          stake.duration * 24 * 60 * 60 * 1000;
          console.log('stakeEnd',stakeEnd);
        
          const check = new Date(stake.stakeDate).getTime()
          console.log('check',check);
          
      const { amount, network, apr, type, duration ,status} = stake;
      const rate = cryptoRates[network];

     
      if (!rate) {
        console.warn(`Rate not found for ${network}`);
        continue;
      }

      const amountInUsd = amount * rate;

      const dailyRate = apr / rate / 365 / 100;
      console.log('dailyRate',dailyRate);

      const dailyRewardInUsd = amountInUsd * dailyRate;

      const dailyRewardInCrypto = dailyRewardInUsd / rate;

      if (type === "flexible") {
        if (hoursPassed <= 24 && status === "active") {
          stake.rewards = (stake.rewards || 0) + dailyRewardInCrypto;
          stake.update += 1
        }if(hoursPassed >= 24){
          stake.status = "completed"
          console.log("hi venky");
          
        }
      }
       if (type === "fixed") {
        if (daysPassed <= duration) {
          stake.rewards = (stake.rewards || 0) + dailyRewardInCrypto;
          stake.update += 1
        }
        if (daysPassed >= duration) {
          stake.status = "completed";
        }
      }

      await stake.save();
    }

    console.log("Staking rewards updated.");
  } catch (err) {
    console.error("Error calculating staking rewards:", err);
  }
});


export default router;
