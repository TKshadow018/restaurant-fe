import React from "react";
import '@/styles/theme.css';
import '../styles/Loading.css';

const Loading = ({ message = "Loading...", height = "400px" }) => {
  return (
    <div className="loading-container" style={{ height }}>
      <div className="text-center w-100">
        <div className="d-flex justify-content-center align-items-center mb-3">
          <div 
            className="loading-spinner spinner-border text-primary"
          ></div>
        </div>
        <h3 className="text-primary">{message}</h3>
      </div>
    </div>
  );
};

export default Loading;
