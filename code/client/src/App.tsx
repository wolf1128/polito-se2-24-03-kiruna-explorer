import { Container } from "react-bootstrap";
import { Navigate, Route, Routes, useNavigate , useLocation} from "react-router-dom";
import Home from "./components/Home";
import UrbanPlanner from "./modules/UrbanPlanner/components/UrbanPlanner";
import { useEffect, useState } from "react";
import { User, UserContext } from "./components/UserContext";
import API from "./API/API";
import Login from "./components/Login";
import NewDocument from "./components/NewDocument";
import Header from "./components/Header";

function App() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loggedIn, setLoggedIn] = useState<Boolean>(true);
  const [loginMessage, setLoginMessage] = useState<String>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hideHeader = location.pathname === "/login";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await API.getUserInfo();
        console.log(u);
        setUser(new User(u.username, u.name, u.surname));
        setLoggedIn(true);
        setIsLoaded(true);
        navigate("/");
      } catch {
        setLoggedIn(false);
        setUser(undefined);
        setIsLoaded(true);
      }
    };

    checkAuth();
  }, []);

  const doLogin = function (username: string, password: string) {
    API.login(username, password)
      .then((u: User) => {
        setLoggedIn(true);
        setUser(new User(u.username, u.name, u.surname));
        setIsLoaded(true);
        navigate("/");
      })
      .catch((err) => {
        console.log(typeof err);
        setLoginMessage(
          err.error
            ? err.error
            : err.message
            ? err.message
            : typeof err === "string"
            ? err
            : "An error occurred"
        );
      });
  };

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(undefined);
    setIsLoaded(false);
    navigate("/");
  };

  return (
    <Container fluid style={{ padding: 0, height: "100%" }}>
      <UserContext.Provider value={user}>
        {!hideHeader && <Header/>}
        <Routes>
          <Route path="/" element={loggedIn ? <Navigate to="/home" /> : <Navigate to="/login" />} />
          <Route
            path="/login"
            element={<Login login={doLogin} message={loginMessage} setMessage={setLoginMessage} />}
          />
          <Route path="/home" element={loggedIn ? <Home /> : <Navigate to="/login" />} />
          <Route path="/urban-planner" element={<UrbanPlanner />} />
          <Route path="/documents/new" element={<NewDocument/>}/>
        </Routes>
        <div></div>
      </UserContext.Provider>
    </Container>
  );
}

export default App;
