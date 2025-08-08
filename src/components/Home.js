import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "@/styles/home.css";

const Home = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by auth state change
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="w-100 home-container d-flex flex-column justify-content-center align-items-center home-background">
      <div className="home-text-wrapper">
        <main>
          <section className="hero-section text-primary py-5">
            <div className="container text-center">
              <div className="row justify-content-center">
                <div className="col-lg-12 hero-card px-4 py-4 rounded shadow-lg">
                  <h1 className="display-4 fw-bold mb-4 hero-title beige-color">
                    {t("home.welcomeTitle", {
                      title: process.env.REACT_APP_APP_TITLE,
                    })}
                  </h1>
                  <h4 className="h4 mb-4 hero-subtitle beige-color">
                    {t("home.subtitle")}
                  </h4>
                  {!currentUser && (
                    <div className="d-grid gap-3 d-sm-flex justify-content-sm-center hero-buttons">
                      <button
                        className="btn btn-primary btn-lg px-5 rounded-pill"
                        onClick={handleRegister}
                      >
                        {t("home.getStarted")}
                      </button>
                      <button
                        className="btn btn-outline-primary btn-lg px-5 rounded-pill"
                        onClick={handleLogin}
                      >
                        {t("navbar.signIn")}
                      </button>
                    </div>
                  )}
                  <div className="container mt-5">
                  <div className="row g-4">
                    <div className="col-md-4 feature-card">
                      <div className="card h-100 text-center border-0 shadow-sm feature-item">
                        <div className="card-body p-4">
                          <div className="feature-icon display-6 mb-3">🍽️</div>
                          <h3 className="card-title feature-title">
                            {t("home.features.menu.title")}
                          </h3>
                          <p className="card-text feature-description">
                            {t("home.features.menu.description")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 feature-card">
                      <div className="card h-100 text-center border-0 shadow-sm feature-item">
                        <div className="card-body p-4">
                          <div className="feature-icon display-6 mb-3">👨‍🍳</div>
                          <h3 className="card-title feature-title">
                            {t("home.features.chefs.title")}
                          </h3>
                          <p className="card-text feature-description">
                            {t("home.features.chefs.description")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 feature-card">
                      <div className="card h-100 text-center border-0 shadow-sm feature-item">
                        <div className="card-body p-4">
                          <div className="feature-icon display-6 mb-3">🏠</div>
                          <h3 className="card-title feature-title">
                            {t("home.features.atmosphere.title")}
                          </h3>
                          <p className="card-text feature-description">
                            {t("home.features.atmosphere.description")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
                
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;
