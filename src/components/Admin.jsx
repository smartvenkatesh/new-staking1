import React, { useEffect, useState } from "react";
import "../App.css";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast, ToastContainer } from "react-toastify";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

const Admin = () => {
  const [wallets, setWallets] = useState([]);
  const [stakeDetails, setStakeDetails] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [select, setSelect] = useState("");
  const [show, setShow] = useState("");
  const [currencyName, setCurrencyName] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [usdValue, setUsdValue] = useState("");
  const [show1, setShow1] = useState("")
  const [network, setNetwork] = useState("")
  const [dbNetwork, setDbNetwork] = useState([])
  const [apr, setApr] = useState("")
  const [duration, setDuration] = useState("")
  const [type, setType] = useState("")

  const handleClose = () => {
    setShow(false);
    setCurrencyName("");
    setCurrencySymbol("");
    setUsdValue("");
  };
  const handleClose1 = () => {
    setNetwork("")
    setApr("")
    setDuration("")
    setType("")
    setShow1(false)
  }
  const handleShow = () => setShow(true);
  const handleShow1 = () => setShow1(true);

  const getCurrency = () => {
    axios.get(`http://localhost:8080/staking/getCurrency`, {
      headers:
        { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then((res) => {
      setDbNetwork(res.data);
      console.log(res.data);
    });
  };

  const handleSave = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/staking/addCurrency",
        {
          currencyName,
          currencySymbol,
          usdValue,
        }, {
        headers:
          { Authorization: `Bearer ${localStorage.getItem("token")}` }
      }
      );
      toast.success(response.data.message);
      handleClose();
    } catch (error) {
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const handleConfig = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/staking/createConfig",
        {
          network,
          apr,
          duration,
          type
        }, {
          headers:
            { Authorization: `Bearer ${localStorage.getItem("token")}` }
      }
      );
      toast.success(response.data.message);
      handleClose1();
    } catch (error) {
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const getWallets = () => {
    axios
      .get("http://localhost:8080/staking/all-wallets", {
        headers:
          { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then((res) => {
        setWallets(res.data);
        console.log(res.data);
      })
      .catch((err) => {
        console.error("Error fetching wallets", err);
      });
  };

  useEffect(() => {
    getWallets();
    getCurrency()
    if (activeTab === "stake") {
      getStakeDetails();
    }
  }, [select]);


  const getStakeDetails = () => {
    setActiveTab("stake");
    if (select === "fixed" || select === "flexible") {
      axios
        .get(`http://localhost:8080/staking/stakes/${select}`, {
          headers:
            { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        .then((res) => {
          setStakeDetails(res.data);
          console.log("res.data", res.data);
        });
    } else if (!select) {
      axios.get("http://localhost:8080/staking/stakes", {
        headers:
          { Authorization: `Bearer ${localStorage.getItem("token")}` }
      }).then((res) => {
        setStakeDetails(res.data);
        console.log("res.data", res.data);
      });
    }
  };

  const adminHome = () => {
    setActiveTab("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("juice-tracker");
    window.location.href = "/login";
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 onClick={adminHome}>
          Staking <span>Admin Panel</span>
        </h1>

        {activeTab === "home" && (
          <button className="btn btn-success" onClick={handleShow}>
            Add Currency
          </button>
        )}

        {activeTab === "home" && (
          <button className="btn btn-warning" onClick={handleShow1}>
            Config
          </button>
        )}

        {activeTab === "home" && (
          <button className="btn btn-success" onClick={getStakeDetails}>
            Staking Details
          </button>
        )}
        {activeTab === "stake" && (
          <button className="btn btn-primary" onClick={adminHome}>
            Back To Home
          </button>
        )}
        {activeTab === "stake" && (
          <select
            id="admin-select"
            value={select}
            onChange={(e) => setSelect(e.target.value)}
          >
            <option value="">All Type</option>
            <option value="fixed">Fixed</option>
            <option value="flexible">Flexible</option>
          </select>
        )}
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Enter New Currency</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>Currency Name:</label>
          <input
            type="text"
            className="form-control mb-2"
            value={currencyName}
            onChange={(e) => setCurrencyName(e.target.value)}
          />

          <label>Currency Symbol:</label>
          <input
            type="text"
            className="form-control mb-2"
            value={currencySymbol}
            onChange={(e) => setCurrencySymbol(e.target.value)}
          />

          <label>Currency USD Value:</label>
          <input
            type="number"
            className="form-control"
            value={usdValue}
            onChange={(e) => setUsdValue(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={show1} onHide={handleClose1}>
        <Modal.Header closeButton>
          <Modal.Title>Enter New Currency Config</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <select className="w-100 text-center bg-light p-2 mb-2" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Stake Type</option>
            <option value="fixed">Fixed</option>
            <option value="flexible">Flexible</option>
          </select>

          <select className="w-100 text-center bg-light p-2 mb-2" value={network} onChange={(e) => setNetwork(e.target.value)}>
            <option value="">Currency Symbol</option>
            {dbNetwork.map((net, idx) => (
              <option key={idx} value={net.currencyName}>
                {net.currencyName}
              </option>
            ))}
          </select>

          <label>Duration</label>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          <label>APR (%)</label>
          <input
            type="number"
            className="form-control"
            value={apr}
            onChange={(e) => setApr(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose1}>
            Close
          </Button>
          <Button variant="primary" onClick={handleConfig}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {activeTab === "home" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>User Name</th>
                <th>Network</th>
                <th>Logo</th>
                <th>Wallet Address</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet, index) => (
                <tr key={wallet._id}>
                  <td>{index + 1}</td>
                  <td>{wallet.admin.username || "N/A"}</td>
                  <td>{wallet.currencyType}</td>
                  <td>
                    <img
                      src={
                        wallet.currencyType === "ETH"
                          ? "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
                          : "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png"
                      }
                      alt={wallet.currencyType}
                      width="30"
                      height="30"
                      style={{ objectFit: "contain" }}
                    />
                  </td>
                  <td>{wallet.address}</td>
                  <td>{wallet.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "stake" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>User Name</th>
                <th>Network</th>
                <th>Logo</th>
                <th>Wallet Address</th>
                <th>Stake Amount</th>
                <th>Time & Date</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Rewards</th>
                <th>Complete</th>
              </tr>
            </thead>
            <tbody>
              {stakeDetails.map((stake, index) => {
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{stake.user_details.username}</td>
                    <td>{stake.network}</td>
                    <td>
                      {" "}
                      <img
                        src={
                          stake.network === "ETH"
                            ? "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
                            : "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png"
                        }
                        alt={stake.network}
                        width="30"
                        height="30"
                        style={{ objectFit: "contain" }}
                      />
                    </td>
                    <td>{stake.wallet_details.address}</td>
                    <td>{stake.amount}</td>
                    <td>{new Date(stake.stakeDate).toLocaleString()}</td>
                    <td>{stake.type}</td>
                    <td>{stake.wallet_details.amount}</td>
                    <td>{stake.rewards}</td>
                    <td
                      className={
                        stake.status === "completed"
                          ? "bg-success text-light"
                          : stake.status === "cancelled"
                            ? "bg-danger text-light"
                            : "bg-warning"
                      }
                    >
                      {stake.status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Admin;
