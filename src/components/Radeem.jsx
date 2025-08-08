import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import { toast, ToastContainer } from "react-toastify";
import decodeToken from "../utils/decode";

const Radeem = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [dbAddresses, setDbAddresses] = useState([]);
  const [withdrawId, setWithdrawId] = useState("");
  const [stake, setStake] = useState("");
  const [show, setShow] = useState(false);
  const location = useLocation()
  const stakeId = location.state

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const getAddress = () => {
    axios
      .get(`http://localhost:8080/staking/radeem/${stakeId}`,{headers:
        {Authorization:`Bearer ${localStorage.getItem("token")}`}})
      .then((res) => {
        setDbAddresses(res.data);
        console.log(res.data);
      });
  };

  const getStakeAmount = () => {
    axios
      .get(`http://localhost:8080/staking/stakeAmount/${account}`,{headers:
        {Authorization:`Bearer ${localStorage.getItem("token")}`}})
      .then((res) => {
        console.log("res.data", res.data);
        setStake(res.data);
      })
      .catch((err) => alert(err.response.data.message));
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log('token',token);
    
    const decoder = decodeToken(token)._id
    console.log('decoder',decoder);
    
    if (decoder) {
      setWithdrawId(decoder);
    }
  }, []);

  useEffect(() => {
    if (stakeId) {
      getAddress();
    }
    if (account) {
      getStakeAmount();
    }
  }, [withdrawId, account]);

  const withdrawAmount = () => {
    axios
      .post("http://localhost:8080/staking/withdraw",{ account, stake }, {headers:
        {Authorization:`Bearer ${localStorage.getItem("token")}`}})
      .then((res) => {
        toast.success(res.data.message);
        handleClose();
        setTimeout(() => navigate("/staking/home"), 3000);
      })
      .catch((err) => toast.error(err.response.data.message));
  };
  return (
    <div className="deposit-page-radeem">
      <span>
        Note : Withdraw your stake amount without during days or hours
        completed,no rewards added your address
      </span>
      <div className="deposit-card">
        <Button onClick={() => navigate("/staking/home")} className="home-btn">
          Home
        </Button>
        <h1>Radeem</h1>
        <div className="profile-head">
          {dbAddresses.map((wallet, index) => (
            <div key={index}>
              <h1>Profile Details</h1>
              <div className="profile-body">
                <div className="tr">
                  <h4 className="td">Address :</h4>
                  <h4 className="td">Network :</h4>
                  <h4 className="td">Stake Type : </h4>
                  <h4 className="td">Stake Amount : </h4>
                  <h4 className="td">Rewards : </h4>
                </div>
                <div className="tr">
                  <h4 className="td">{wallet.walletDetails.address}</h4>
                  <h4 className="td">{wallet.network}</h4>
                  <h4 className="td">{wallet.type}</h4>
                  <h4 className="td">{wallet.amount}</h4>
                  <h4 className="td">{wallet.rewards}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
        {account && <p>Total Stake Amount : {stake}</p>}
        <Button onClick={handleShow}>Withdraw</Button>
        <Modal className="text-center" show={show} onHide={handleClose}>
          <h1 className="pt-3">Withdraw</h1>
          <hr />
          <Modal.Body>Are you sure withdraw stake amount</Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={withdrawAmount}>
              yes
            </Button>
            <Button variant="danger" onClick={handleClose}>
              no
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Radeem;
