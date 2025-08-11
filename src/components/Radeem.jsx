import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import decodeToken from "../utils/decode";
import "react-toastify/dist/ReactToastify.css";
import "./Radeem.css";

const Radeem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stakeId = location.state;

  const [walletDetails, setWalletDetails] = useState(null);
  const [withdrawId, setWithdrawId] = useState("");
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Fetch wallet details
  const getAddress = async () => {
    console.log("stakeId", stakeId);
    try {
      const res = await axios.get(
        `http://localhost:8080/staking/radeem/${stakeId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (res.data && res.data.length > 0) {
        setWalletDetails(res.data[0]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch address");
    }
  };


  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoder = decodeToken(token)?._id;
      if (decoder) setWithdrawId(decoder);
    }
  }, []);

  // When stakeId changes, fetch wallet
  useEffect(() => {
    if (stakeId) {
      getAddress();
    }
  }, [stakeId]);


  // Withdraw request
  const withdrawAmount = async () => {
    try {
      const account = walletDetails.walletDetails.address;
      await axios.post(
        `http://localhost:8080/staking/withdraw/radeem/${stakeId}`,
        { account },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      toast.success("Withdrawal successful");
      handleClose();
      setTimeout(() => navigate("/staking/home"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Withdrawal failed");
    }
  };

  return (
    <div className="deposit-page-radeem">
      <p className="note">
        <strong>Note:</strong> If you withdraw before the staking period ends,
        no rewards will be credited.
      </p>

      <div className="deposit-card-radeem">
        <div className="header-actions">
          <Button variant="success" onClick={() => navigate("/staking/home")}>
            Home
          </Button>
          <h1>Redeem Stake</h1>
        </div>

        {walletDetails && (
          <div className="profile-section">
            <div className="profile-grid">
              <div className="label">Address:</div>
              <div className="value">{walletDetails.walletDetails.address}</div>
              <div className="label">Network:</div>
              <div className="value">{walletDetails.network}</div>
              <div className="label">Stake Type:</div>
              <div className="value">{walletDetails.type}</div>
              <div className="label">Stake Amount:</div>
              <div className="value">{walletDetails.amount}</div>
              <div className="label">Rewards:</div>
              <div className="value">{walletDetails.rewards}</div>
            </div>
          </div>
        )}

        <Button variant="danger" onClick={handleShow}>
          Withdraw
        </Button>

        <Modal className="text-center" show={show} onHide={handleClose}>
          <h1 className="pt-3">Withdraw</h1>
          <hr />
          <Modal.Body>Are you sure you want to withdraw your stake?</Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={withdrawAmount}>
              Yes
            </Button>
            <Button variant="danger" onClick={handleClose}>
              No
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default Radeem;
