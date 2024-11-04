import { Col, Row } from "react-bootstrap";
import { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import "../index.css";

const LeftSideBar = (props: { logout: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useContext(UserContext);

  const isLoginPage = location.pathname === "/login";
  if (isLoginPage) {
    return null;
  }

  const handleNavigation1 = () => {
    navigate("/urban-planner/add-document"); // Redirects to /add-document
  };
  const handleNavigation2 = () => {
    navigate("/urban-planner/link-documents"); // Redirects to /add-document
  };

  return (
    <div className="sidebar-container">
      <Row className="top-side-box">
        {user ? (
          <Col>
            <Row>
              <div className="menu-text" role="button" onClick={handleNavigation1}>
                <span className="file-icon-box">
                  <i className="bi bi-files"></i>
                </span>
                <span className="menu-text bold-text">New document</span>
                <span className="arrow-icon-box">
                  <i className="bi bi-caret-right-fill"></i>
                </span>
              </div>{" "}
            </Row>
            <Row>
              <div className="menu-text" role="button" onClick={handleNavigation2}>
                <span className="file-icon-box">
                  <i className="bi bi-link"></i>
                </span>
                <span className="menu-text bold-text">Link Documents</span>
                <span className="arrow-icon-box">
                  <i className="bi bi-caret-right-fill"></i>
                </span>
              </div>{" "}
            </Row>
          </Col>
        ) : (
          <></>
        )}
      </Row>
      <Row className="bottom-side-box">
        <Col>
          <div className="user-text">
            <span className="login-icon-box">
              <i className="bi bi-person white-icon"></i>
            </span>
            <span className="bold-text">{user ? user.name : "Username"}</span>
            <span className="logout-icon-box" onClick={props.logout}>
              {user ? (
                <i className="bi bi-box-arrow-right blue-icon"></i>
              ) : (
                <i className="bi bi-box-arrow-in-right blue-icon"></i>
              )}
            </span>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default LeftSideBar;
