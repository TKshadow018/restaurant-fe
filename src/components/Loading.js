import React from "react";
import '@/styles/theme.css';

const Loading = ({ message = "Loading...", height = "400px" }) => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height }}>
      <div className="text-center w-100">
        <div className="d-flex justify-content-center align-items-center mb-3">
          <div 
            className="spinner-border text-primary" 
            style={{ width: '5rem', height: '5rem', borderWidth: ".5rem" }}
          ></div>
        </div>
        <h3 className="text-primary">{message}</h3>
      </div>
    </div>
  );
};

export default Loading;
