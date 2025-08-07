import React, { useEffect, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import { Button } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import decodeToken from "../utils/decode";

const Deposit = () => {
  const navigate = useNavigate();
  const [depositId, setDepositId] = useState("");
  const [account, setAccount] = useState("");
  const [dbAddresses, setDbAddresses] = useState([]);
  const [amount, setAmount] = useState(0);

  const getAddress = () => {
    
    axios
      .get(`http://localhost:8080/staking/getAddress/${depositId}`,{headers:
        {Authorization:`Bearer ${localStorage.getItem("token")}`}})
      .then((res) => {
        setDbAddresses(res.data);
        console.log('res.data',res.data);
      });
  };
 useEffect(() => {
    const token = localStorage.getItem("token");
    console.log('token',token);
    
    const decoder = decodeToken(token)._id
    console.log('decoder',decoder);
    
    if (decoder) {
      setDepositId(decoder);    
    }
  }, []);

  useEffect(() => {
    if (depositId) {
      getAddress();
    }
  }, [depositId]);

  const submit = () => {
    axios
      .post("http://localhost:8080/staking/addAmount",{account,amount},{headers:
        {Authorization:`Bearer ${localStorage.getItem("token")}`}})
      .then((res) => console.log(res.data.message));
    setAccount("");
    setAmount(0);
    toast.success("amount added successfully");
  };

  return (
    <div className="deposit-page">
      <div className="deposit-card">
        <Button onClick={() => navigate("/staking/home")} className="home-btn">
          Home
        </Button>
        <h1>Deposit</h1>
        <select value={account} onChange={(e) => setAccount(e.target.value)}>
          <option value="">Select Address</option>
          {dbAddresses.map((addr, idx) => (
            <option key={idx} value={addr.address}>
              {addr.address}
            </option>
          ))}
        </select>

        <label>Enter Amount :</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="submit-btn" onClick={submit}>
          Submit
        </button>
      </div>
      <ToastContainer/>
    </div>
  );
};

export default Deposit;
