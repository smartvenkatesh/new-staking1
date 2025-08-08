import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "react-bootstrap";
import decodeToken from "../utils/decode";

const PORT = "http://localhost:8080/staking";

const Stake = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [userId,setUserId] = useState("")
  const [stakeAmount, setStakeAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [stakeType, setStakeType] = useState("fixed");
  const [stakeConfig,setStakeConfig] = useState([])
  const [apr,setApr] = useState("")

  const getConfig = () => {
    axios
      .get("http://localhost:8080/staking/getConfig", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const allConfigs = res.data;
        
        const matchedConfig = allConfigs.find(
          (cfg) =>
            cfg.currencySymbol === state.type && cfg.type === stakeType
        );
        if (matchedConfig) {
          const reverse = matchedConfig.duration.reverse()
          console.log('reverse',reverse)
          setStakeConfig(matchedConfig);
          setApr(matchedConfig.apr)

          if (matchedConfig.type === "fixed") {

            if (matchedConfig.duration.includes(duration)) {
              const firstNumber = reverse.slice(0,1)
              console.log(firstNumber[0])
            if(firstNumber[0] !== duration){
              const calculatedApr = matchedConfig.apr / (8 / duration);
              setApr(calculatedApr);
            }else if(firstNumber[0] === duration){
              const calculatedApr = matchedConfig.apr / (6 / duration);
              console.log("welcome")
              setApr(calculatedApr);
            }
            } else {
              console.warn("Selected duration not found in config");
            }
          } else {
            setApr(matchedConfig.apr);
          }
          // if(duration === reverse[0]){
          //   setApr(matchedConfig.apr)
          // console.log("duration[0]",apr)
          // }else if(duration === reverse[1] ){
          // setApr(matchedConfig.apr/duration)
          // console.log("duration[1]",apr)
          // }else if(duration === reverse[2] ){
          //   setApr(matchedConfig.apr/duration)
          // console.log("duration[2]",apr)
          //   }
        } else {
          setStakeConfig([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching config", err);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log('token',token);
    
    const decoder = decodeToken(token)._id
    console.log('decoder',decoder);
    
    if (decoder) {
      setUserId(decoder);
    }
  }, []);

  useEffect(()=>{
    getConfig()
  },[stakeType,duration])

  const handleStakeSubmit = async () => {
    console.log(stakeAmount)
    console.log(duration)
    if ((!stakeAmount && stakeType === "fixed") || (!duration && stakeType === "fixed")) {
      toast.error("Please enter stake amount and duration");
      return;
    }

    try {
      await axios.post(`${PORT}/stake`, {
        userId,
        walletId: state.walletId,
        amount: stakeAmount,
        duration,
        network: state.type,
        apr,
        stakeType,
      },{headers:
        {Authorization:`Bearer ${localStorage.getItem("token")}`}});

      toast.success("Staking successful!");
      setDuration("");
      setStakeAmount("");
      setStakeType("fixed");
      setTimeout(() => navigate("/staking/home"), 1500);
    } catch (err) {
      console.error(err);
      if(err.response.status === 404 ){
        toast.warning(err.response?.data?.message)
        console.log("warning");
        
      }
      toast.error(err.response?.data?.message || "Stake failed");
    }
  };

  return (
    <div className="deposit-page">
      <div className="deposit-card">
        <Button onClick={() => navigate("/staking/home")} className="home-btn">
          Home
        </Button>
        <h2>Stake Wallet</h2>
        <p>
          <strong>Address:</strong> {state.address}
        </p>
        <p>
          <strong>Balance:</strong> {state.amount} USD
        </p>

        <select value={stakeType} onChange={(e) => setStakeType(e.target.value)}>
         <option value="fixed">Fixed</option>
         <option value="flexible">Flexible</option>
        </select>

        <p><strong>APR</strong> : {apr}%</p>

   {stakeConfig?.duration && stakeType === "fixed" && (
     <div>
       <label>Duration (days):</label>
        <div style={{ display: "flex",justifyContent:"center", gap: "10px" }}>
        {stakeConfig.duration.map((d, idx) => (
        <button
          key={idx}
          onClick={() => setDuration(d)}
          style={{
            padding: "8px 12px",
            backgroundColor: duration === d ? "green" : "#e0e0e0",
            color: duration === d ? "white" : "black",
            border: "none",
            borderRadius: "15px",
          }}
        >
          {d}
        </button>
       ))}
      </div>
     </div>
    )}

          <div>
          <label>Amount: </label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>
        

        <button
          onClick={handleStakeSubmit}
          style={{
            marginTop: "10px",
            background: "green",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Confirm Stake
        </button>
      </div>
      <div className="deposit-card-read">
        <h1>Read before staking</h1>
        <p>* minimum stake amount 30 USD</p>
        <p>* maximum stake amount 140 USD</p>
        <p>* interest calculate APR method </p>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Stake;
