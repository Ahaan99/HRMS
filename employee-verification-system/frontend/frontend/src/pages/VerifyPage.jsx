import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function VerifyPage() {

  const { token } = useParams();
  const navigate = useNavigate();

  const handleAction = async (action) => {
    try {
      await API.get(`/verify-token/${token}?action=${action}`);
      alert(`Document ${action === "reject" ? "Rejected" : "Verified"}`);
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert("Verification Failed");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>

      <h2>Document Verification</h2>

      <button
        onClick={() => handleAction("verify")}
        style={{ margin: "10px", padding: "10px" }}
      >
        Verify
      </button>

      <button
        onClick={() => handleAction("reject")}
        style={{ margin: "10px", padding: "10px" }}
      >
        Reject
      </button>

    </div>
  );
}

export default VerifyPage;