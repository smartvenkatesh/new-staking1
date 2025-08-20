import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "react-bootstrap";
import decodeToken from "../utils/decode";
import '../App.css'

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
    const currencySymbol = state.type
    console.log('currencySymbol',currencySymbol);
    
    axios
      .get(`http://localhost:8080/staking/getConfig/${currencySymbol}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {   
        setStakeConfig(res.data)
        console.log(res.data);
        
        if(stakeType === "fixed"){
          setApr(res.data[0].plans[0].apr);
        }else if(stakeType === "flexible"){
          setApr(res.data[res.data.length - 1].plans[0].apr);
          console.log(res.data[res.data.length-1].plans[0].apr);
          
        }
        })
      .catch((err) => {
        console.error("Error fetching config", err);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    const decoder = decodeToken(token)._id
    console.log('decoder',decoder);
    
    if (decoder) {
      setUserId(decoder);
    }
  }, []);

  useEffect(()=>{
    getConfig()
    
  },[stakeType])

  const handleStakeSubmit = async () => {

    if (
      (!stakeAmount && stakeType === "fixed") ||
      (!duration && stakeType === "fixed")
    ) {
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

        <select
          value={stakeType}
          onChange={(e) => setStakeType(e.target.value)}
        >
          <option value="fixed">Fixed</option>
          <option value="flexible">Flexible</option>
        </select>

        <p>
          <strong>APR</strong> : {apr}%
        </p>
        
          {stakeType === "fixed" &&(<div>
            <label>Duration (days):</label>
            <div className="customerStake">
              {stakeConfig
                .filter((cfg) => cfg.type === stakeType)
                .map((cfg) => (
                  <div key={cfg._id}>
                    <div>
                      {cfg.plans.map((plan, idx) => {
                        return (
                        <div>
                          <button
                            key={idx}
                            onClick={() => {
                              setDuration(plan.duration);
                              setApr(plan.apr);
                            }}
                            style={{
                              padding: "8px 12px",
                              backgroundColor:
                                duration === plan.duration
                                  ? "green"
                                  : "#e0e0e0",
                              color:
                                duration === plan.duration ? "white" : "black",
                              border: "none",
                              borderRadius: "15px",
                            }}
                          >
                            {plan.duration}
                          </button>
                        </div>
                      )})}
                    </div>
                  </div>
                ))}
            </div>
          </div>)}
        

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
