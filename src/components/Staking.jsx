import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";

const ConfigModal = ({ show1, handleClose1, dbNetwork }) => {
  const [type, setType] = useState("");
  const [network, setNetwork] = useState("");
  const [duration, setDuration] = useState("");
  const [apr, setApr] = useState("");

  const handleConfig = async () => {
    try {
      const response = await axios.post("http://localhost:8080/api/createConfig", {
        currencySymbol: network,
        apr,
        duration: duration.split(",").map(d => d.trim()),
        type
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}` // if you're using JWT auth
        }
      });

      alert("Configuration saved");
      handleClose1();
    } catch (error) {
      console.error("Error saving config", error);
      alert("Failed to save config");
    }
  };

  return (
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

        <label>Duration (comma-separated)</label>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="e.g., 30, 60, 90"
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
  );
};

export default ConfigModal;