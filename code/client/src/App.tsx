import { Button, Container } from "react-bootstrap";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./modules/GeneralPages/Home";
import NavBar from "./components/NavBar";
import LeftSideBar from "./components/LeftSideBar";
import { SidebarProvider } from "./components/SidebarContext";
import UrbanPlanner from "./modules/UrbanPlanner/UrbanPlannerDashboard";
import AddDocumentForm from "./modules/UrbanPlanner/AddDocumentForm/AddDocumentwithComponents";
import { NewDocument } from "./modules/UrbanPlanner/AddDocumentForm/interfaces/types";
import { User, UserContext } from "./components/UserContext";
import API from "./API/API";
import Login from "./modules/GeneralPages/Login";
import LinkDocumentForm from "./modules/UrbanPlanner/LinkDocumentForm/LinkDocumentForm";
import { ToastProvider } from "./modules/ToastProvider";
import DocumentsListTable from "./modules/UrbanPlanner/DocumentsList/DocumentsListTable";
import AddResourceForm from "./modules/UrbanPlanner/AddResourceForm/AddResourceForm";
import { FaPlus } from "react-icons/fa";
import ExploreMap from "./modules/AnonymousUser/Map/ExploreMap";

function App() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loggedIn, setLoggedIn] = useState<Boolean>(true);
  const [loginMessage, setLoginMessage] = useState<String>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [uploadDocumentId, setUploadDocumentId] = useState<number | undefined>(
    undefined
  );

  const [newDocument, setNewDocument] = useState<NewDocument>({
    title: "",
    description: "",
    documentType: "", //same thing as scale
    scale: "",
    nodeType: "",
    stakeholders: [],
    issuanceDate: "",
    language: "",
    pages: "",
    georeference: [[]],
  });

  useEffect(() => {
    const checkAuth = async () => {
      if (loggedIn) {
        // authenticated
        try {
          const u = await API.getUserInfo();
          setUser(new User(u.username, u.name, u.surname));
          setLoggedIn(true);
          setIsLoaded(true);
          navigate("/");
        } catch {
          setLoggedIn(false);
          setUser(undefined);
          setIsLoaded(true);
        }
      } else {
        // Not authenticated
        setLoggedIn(false);
        setUser(undefined);
        setIsLoaded(true);
        navigate("/login");
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

  // Added for resident | visitor users (guest)
  const doLoginAsGuest = function () {
    setLoggedIn(false);
    setUser(undefined);
    navigate("/explore-map");
  };

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser(undefined);
    setIsLoaded(false);
    navigate("/");
  };

  return (
    <>
      <ToastProvider>
        <Container>
          <SidebarProvider>
            <UserContext.Provider value={user}>
              <NavBar />
              <LeftSideBar logout={doLogOut} />
              <Routes>
                {/* default page is login page */}
                <Route
                  path="/"
                  element={
                    loggedIn ? (
                      <Navigate to="/explore-map" />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                {/* login page */}
                <Route
                  path="/login"
                  element={
                    <Login
                      login={doLogin}
                      loginAsGuest={doLoginAsGuest}
                      message={loginMessage}
                      setMessage={setLoginMessage}
                    />
                  }
                />
                {/* no login required */}
                <Route path="/home" element={<Home />} />
                <Route path="/explore-map" element={<ExploreMap />} />
                {/* urban-planner login required */}
                <Route
                  path="/urban-planner"
                  element={
                    loggedIn ? <UrbanPlanner /> : <Navigate to="/login" />
                  }
                />
                <Route
                  path="/urban-planner/add-document"
                  element={
                    loggedIn ? (
                      <AddDocumentForm
                        document={newDocument}
                        setDocument={setNewDocument}
                      />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route
                  path="/urban-planner/link-documents"
                  element={
                    loggedIn ? <LinkDocumentForm /> : <Navigate to="/login" />
                  }
                />
                <Route
                  path="/urban-planner/documents-list"
                  element={
                    loggedIn ? (
                      <DocumentsListTable
                        setUploadDocumentId={setUploadDocumentId}
                      />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route
                  path="/urban-planner/add-resource"
                  element={
                    loggedIn ? (
                      <AddResourceForm documentId={uploadDocumentId} />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
              </Routes>
            </UserContext.Provider>
          </SidebarProvider>
        </Container>
      </ToastProvider>
      {loggedIn && location.pathname == "/explore-map" ? (
        <Button
          onClick={() => navigate("/urban-planner/add-document")}
          className="add-button"
        >
          <FaPlus color="white" size={25} />
        </Button>
      ) : null}
    </>
  );
}

export default App;
