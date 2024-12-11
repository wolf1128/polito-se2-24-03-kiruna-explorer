import { Button, Col, Container, Dropdown, Row } from "react-bootstrap";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { FaEye, FaPlus } from "react-icons/fa";
import ExploreMap from "./modules/GeneralPages/Map/ExploreMap";
import DiagramWrapper from "./modules/GeneralPages/Diagram/DiagramWrapper";
import DocumentDetails from "./modules/GeneralPages/DocumentDetails";
import Document from "./models/document";
import ViewAll from "./assets/icons/eye-off.svg";
import HomePage from "./modules/GeneralPages/Homepage/Homepage";

function App() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loggedIn, setLoggedIn] = useState<Boolean>(false);
  const [loginMessage, setLoginMessage] = useState<String>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [searchTitle, setSearchTitle] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const [isViewLinkedDocuments, setIsViewLinkedDocuments] = useState(false);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [currentLayer, setCurrentLayer] = useState<keyof typeof tileLayers>("satellite"); // Stato per il layer selezionato

  const [uploadDocumentId, setUploadDocumentId] = useState<number | undefined>(undefined);

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
    georeferenceName: "",
    areaColor: "",
  });

  // Definizione dei layer disponibili
  const tileLayers = {
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/en-us/home">Esri</a>',
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
  };

  const handleSetDocuments = async () => {
    setIsViewLinkedDocuments(false);
    const allDocs = await API.getDocuments();
    setFilteredDocuments(allDocs);
  };

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
        navigate("/home");
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
    navigate("/home");
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
              <NavBar setSearchTitle={setSearchTitle} loggedIn={loggedIn} doLogOut={doLogOut} />
              {location.pathname !== "/home" && location.pathname !== "/" && (
                <LeftSideBar logout={doLogOut} />
              )}
              <Routes>
                {/* default page is home page */}
                <Route path="/" element={<Navigate to="/home" />} />
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
                <Route
                  path="/home"
                  element={<HomePage loggedIn={loggedIn} username={user?.username} />}
                />
                <Route path="/diagram" element={<DiagramWrapper />} />
                <Route path="/documents/:documentId" element={<DocumentDetails />} />
                <Route
                  path="/explore-map"
                  element={
                    <ExploreMap
                      key={location.pathname}
                      searchTitle={searchTitle}
                      isViewLinkedDocuments={isViewLinkedDocuments}
                      setIsViewLinkedDocuments={setIsViewLinkedDocuments}
                      filteredDocuments={filteredDocuments}
                      setFilteredDocuments={setFilteredDocuments}
                      currentLayer={currentLayer}
                    />
                  }
                />
                {/* urban-planner login required */}
                <Route
                  path="/urban-planner"
                  element={loggedIn ? <UrbanPlanner /> : <Navigate to="/login" />}
                />
                <Route
                  path="/urban-planner/add-document"
                  element={
                    loggedIn ? (
                      <AddDocumentForm document={newDocument} setDocument={setNewDocument} />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route
                  path="/urban-planner/link-documents"
                  element={loggedIn ? <LinkDocumentForm /> : <Navigate to="/login" />}
                />
                <Route
                  path="/urban-planner/documents-list"
                  element={
                    loggedIn ? (
                      <DocumentsListTable
                        setUploadDocumentId={setUploadDocumentId}
                        searchTitle={searchTitle}
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
      <Col>
        {loggedIn && location.pathname == "/explore-map" ? (
          <Row>
            <Button onClick={() => navigate("/urban-planner/add-document")} className="add-button">
              <FaPlus color="white" size={25} />
            </Button>
          </Row>
        ) : null}
        {isViewLinkedDocuments && location.pathname == "/explore-map" ? (
          <Row>
            <Button onClick={handleSetDocuments} className="view-all-button">
              <img src={ViewAll} alt="ViewAll" style={{ width: "30px", height: "30px" }} />
            </Button>
          </Row>
        ) : null}
        {location.pathname === "/explore-map" && (
          <Row>
            <Col>
              <Dropdown className="map-view-selector">
                <Dropdown.Toggle>View</Dropdown.Toggle>
                <Dropdown.Menu>
                  {Object.keys(tileLayers).map((layer) => (
                    <Dropdown.Item
                      key={layer}
                      onClick={() => setCurrentLayer(layer as keyof typeof tileLayers)}
                    >
                      {layer}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        )}
      </Col>
    </>
  );
}

export default App;
