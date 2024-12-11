import { useMemo, useState, useRef, useContext, useEffect } from "react";
import { Marker, Popup, Polygon, Tooltip } from "react-leaflet";
import L from "leaflet";
import { UserContext } from "../../../components/UserContext";
import Logo from "../../../assets/icons/Kiruna Icon - 2.svg";
import API from "../../../API/API";
import Document from "../../../models/document";
import { useToast } from "../../ToastProvider";
import markers from "../../../models/documentTypeMarkers";
import { Button, Col, Row } from "react-bootstrap";
import DocumentDetail from "../../../models/documentDetail";
import ViewConnections from "../../../assets/icons/scan-eye-1.svg";
import Georeference from "../../../models/georeference";

const kirunaPosition: [number, number] = [67.85572, 20.22513];

interface DraggableMarkerProps {
  document: Document;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  isViewLinkedDocuments: boolean;
  setIsViewLinkedDocuments: React.Dispatch<React.SetStateAction<boolean>>;
  mapRef: React.RefObject<L.Map | null>;
  selectedMarkerId: number | null;
  setSelectedMarkerId: React.Dispatch<React.SetStateAction<number | null>>;
}

const DraggableMarker = ({
  document,
  setDocuments,
  isViewLinkedDocuments,
  setIsViewLinkedDocuments,
  mapRef,
  selectedMarkerId,
  setSelectedMarkerId,
}: DraggableMarkerProps) => {
  const user = useContext(UserContext);
  const showToast = useToast();
  const isPolygon = useMemo(() => {
    const coords = document.coordinates ? JSON.parse(document.coordinates) : [];
    return coords.length > 1;
  }, [document.coordinates]);
  const [documentSelected, setDocumentSelected] = useState<DocumentDetail>();
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [isPolygonVisible, setIsPolygonVisible] = useState(false);
  const [georeference, setGeoreference] = useState<Georeference>();

  const markerEventHandlers = useMemo(
    () => ({
      mouseover: () => {
        setIsPolygonVisible(true);
      },
      mouseout: () => {
        setIsPolygonVisible(false);
      },
    }),
    []
  );

  useEffect(() => {
    API.getDocumentById(document.documentId).then((doc) => setDocumentSelected(doc));
  }, [isViewLinkedDocuments]);

  useEffect(() => {
    API.getGeoreferences().then((georeferences) => {
      const georef = georeferences.find((g) => g.georeferenceId === document.georeferenceId);
      setGeoreference(georef);
    });
  }, [documentSelected]);

  const handleViewConnections = async () => {
    setIsViewLinkedDocuments(true);

    if (documentSelected?.linkedDocuments) {
      // Ottieni i dettagli dei documenti collegati
      const documentPromises = documentSelected.linkedDocuments.map((doc) =>
        API.getDocumentById(doc.documentId)
      );
      const documents = await Promise.all(documentPromises); // Array di DocumentDetail (documenti collegati)

      // Ottieni tutti i documenti
      const allDocs = await API.getDocuments();
      setAllDocuments(allDocs); // Array di Document (tutti i documenti)

      // Crea un array di Document con i documenti collegati
      const linkedDocuments = documents.map((doc) => {
        const document = allDocs.find((d) => d.documentId === doc.documentId);
        return document;
      });

      // Filtra i documenti duplicati per documentId
      const uniqueDocuments = linkedDocuments.filter(
        (doc, index, self) => index === self.findIndex((d) => d?.documentId === doc?.documentId)
      );

      // Filtra i documenti collegati e aggiorna lo stato
      setDocuments(uniqueDocuments.filter((doc): doc is Document => doc !== undefined));
    }
    // Imposta la vista della mappa alla posizione e zoom predefiniti
    if (mapRef.current) {
      mapRef.current.setView(kirunaPosition, 12);
    }
  };

  const [position, setPosition] = useState<[number, number]>(kirunaPosition);
  const [draggable, setDraggable] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (document.coordinates) {
      const coords = JSON.parse(document.coordinates);
      if (isPolygon) {
        const polygon = L.polygon(coords);
        const center = polygon.getBounds().getCenter();
        setPosition([center.lat, center.lng]);
      } else if (coords.length > 0) {
        setPosition([coords[0][0], coords[0][1]]);
      }
    }
  }, [document.coordinates, isPolygon]);

  const handleMoveDocument = (newCoordinates: [number, number]) => {
    if (
      newCoordinates[0] >= 67.82 &&
      newCoordinates[0] <= 67.89 &&
      newCoordinates[1] >= 20.1 &&
      newCoordinates[1] <= 20.35
    ) {
      API.updateDocumentGeoreference(document.documentId, [newCoordinates]).then((response) => {
        const { message } = response;
        setDocuments((prevDocuments) =>
          prevDocuments.map((doc) =>
            doc.documentId === document.documentId
              ? {
                  ...doc,
                  coordinates: JSON.stringify([newCoordinates]),
                }
              : doc
          )
        );
        showToast("Success!", "Georeference updated successfully", false);
      });
    } else {
      showToast("Cannot update coordinates", "Please choose coordinates within Kiruna area", true);
    }
  };

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          const newCoordinates: [number, number] = [newPos.lat, newPos.lng];
          setPosition(newCoordinates);
          handleMoveDocument(newCoordinates);
          setDraggable(false);
        }
      },
    }),
    [document.documentId]
  );

  const toggleDraggable = () => {
    setDraggable((prev) => !prev);
  };

  const handleMarkerClick = () => {
    setSelectedMarkerId(document.documentId);
  };

  const handlePopupClose = () => {
    setSelectedMarkerId(null);
  };

  const isSelected = selectedMarkerId === document.documentId;

  const customIcon = new L.Icon({
    iconUrl: Logo,
    iconSize: isSelected ? [55, 55] : [40, 40], // Cambia la dimensione del logo se selezionato
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const getCustomIcon = (documentType: string, isSelected: boolean) => {
    const baseIcon = markers.get(documentType);
    if (!baseIcon) return undefined;

    return new L.Icon({
      iconUrl: baseIcon.options.iconUrl,
      iconSize: isSelected ? [55, 55] : baseIcon.options.iconSize, // Cambia la dimensione del logo se selezionato
      iconAnchor: isSelected ? [22, 44] : baseIcon.options.iconAnchor,
      popupAnchor: baseIcon.options.popupAnchor,
    });
  };

  return (
    <>
      {console.log(isSelected)}
      {isPolygon && document.coordinates && isPolygonVisible && (
        <Polygon
          positions={JSON.parse(document.coordinates)}
          color={georeference?.areaColor ? georeference.areaColor : "#3d52a0"}
          fillOpacity={0.2}
          dashArray={"5, 10"}
          weight={5}
          eventHandlers={{
            click: (e) => {
              // Prevent the popup from opening on click of the polygon
              e.originalEvent.stopPropagation();
            },
          }}
        />
      )}
      <Marker
        draggable={draggable}
        eventHandlers={{
          ...eventHandlers,
          ...markerEventHandlers,
          click: handleMarkerClick,
          popupclose: handlePopupClose,
        }}
        position={position}
        ref={markerRef}
        icon={document.nodeType ? getCustomIcon(document.nodeType, isSelected) : customIcon}
      >
        <Tooltip direction="top" offset={[0, -30]} opacity={1} permanent={false}>
          {document.title}
        </Tooltip>
        <Popup autoClose={false} closeButton={true}>
          <div>
            <h5>{document.title}</h5>
            <p>Description: {document.description}</p>
            <p>Scale: {document.scale}</p>
            <p>Type: {document.nodeType}</p>
            <p>Issuance Date: {document.issuanceDate}</p>
            {georeference?.isArea === 1 && <p>Area name: {georeference.georeferenceName}</p>}
            <Row>
              <Col>
                <Button className="view-linked-documents-button" onClick={handleViewConnections}>
                  <img
                    className="view-linked-documents-icon"
                    src={ViewConnections}
                    alt="LinkIcon"
                  />
                </Button>
                <p>View Connections</p>
              </Col>
              <Row>
                {user && (
                  <button className="draggable-toggle-btn" onClick={toggleDraggable}>
                    {draggable ? "Stop Moving" : "Update georeference"}
                  </button>
                )}
              </Row>
            </Row>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default DraggableMarker;
