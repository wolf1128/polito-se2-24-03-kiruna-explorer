import L from "leaflet";
import DesignDocumentMarker from "../assets/icons/Design document marker.svg";
import InformativeDocumentMarker from "../assets/icons/Informative document marker.svg";
import PrescriptiveDocumentMarker from "../assets/icons/Prescriptive document marker.svg";
import TechnicalDocumentMarker from "../assets/icons/Technical document marker.svg";
import AgreementMarker from "../assets/icons/Agreement marker.svg";
import ConflictMarker from "../assets/icons/Conflict marker.svg";
import ConsultationMarker from "../assets/icons/Consultation marker.svg";
import ActionMarker from "../assets/icons/Action marker.svg";

const designDocumentMarker = new L.Icon({
  iconUrl: DesignDocumentMarker,
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const informativeDocumentMarker = new L.Icon({
  iconUrl: InformativeDocumentMarker,
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const prescriptiveDocumentMarker = new L.Icon({
  iconUrl: PrescriptiveDocumentMarker,
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const technicalDocumentMarker = new L.Icon({
  iconUrl: TechnicalDocumentMarker,
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const agreementMarker = new L.Icon({
  iconUrl: AgreementMarker,
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const conflictMarker = new L.Icon({
  iconUrl: ConflictMarker,
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const consultationMarker = new L.Icon({
  iconUrl: ConsultationMarker,
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const actionMarker = new L.Icon({
  iconUrl: ActionMarker,
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const markers = new Map<string, L.Icon>();
markers.set("Design document", designDocumentMarker);
markers.set("Informative document", informativeDocumentMarker);
markers.set("Prescriptive document", prescriptiveDocumentMarker);
markers.set("Technical document", technicalDocumentMarker);
markers.set("Agreement", agreementMarker);
markers.set("Conflict", conflictMarker);
markers.set("Consultation", consultationMarker);
markers.set("Action", actionMarker);

export default markers;
