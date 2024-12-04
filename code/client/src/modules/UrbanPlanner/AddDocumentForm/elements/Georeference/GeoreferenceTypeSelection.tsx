import { Row, Col, Form } from "react-bootstrap";
import { useState, useEffect } from "react";
import "../../../../style.css";
import { Props } from "../../interfaces/types";
import GeoreferenceSelection from "./GeoreferenceSelection";
import AreaSelection from "./GeoreferenceAreaSelection";

const GeoreferenceTypeSelection = (props: Props) => {
  const [geoType, setGeoType] = useState("Municipality");
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showPolygonMap, setShowPolygonMap] = useState(false); // Stato per il modal del poligono

  useEffect(() => {
    if (geoType === "Municipality") {
      props.setDocument({
        ...props.document,
        georeference: null,
      });
    }
  }, [geoType]);

  const handleGeoSelection = (value: string) => {
    setGeoType(value);
    if (value === "Point") {
      setShowMiniMap(true);
    } else if (value === "Polygon") {
      setShowPolygonMap(true);
    }
  };

  return (
    <>
      <Form.Group as={Col} controlId="formGridGeoType">
        <Form.Label className="black-text">Georeference</Form.Label>
        <Row>
          <Col xs="auto">
            <Form.Check
              type="radio"
              id="georeference-municipality"
              label="Municipality"
              name="georeference"
              value="Municipality"
              checked={geoType === "Municipality"}
              onChange={(e) => setGeoType(e.target.value)}
              className="font-size-20"
            />
          </Col>
          <Col xs="auto">
            <Form.Check
              type="radio"
              id="georeference-point"
              label="Point"
              name="georeference"
              value="Point"
              checked={geoType === "Point"}
              onChange={(e) => handleGeoSelection(e.target.value)}
              className="font-size-20"
            />
          </Col>
          <Col xs="auto">
            <Form.Check
              type="radio"
              id="georeference-polygon"
              label="Area"
              name="georeference"
              value="Polygon"
              checked={geoType === "Polygon"}
              onChange={(e) => handleGeoSelection(e.target.value)}
              className="font-size-20"
            />
          </Col>
        </Row>
        {geoType === "Point" && (
          <Row>
            <Col xs="auto">
              <Form.Check
                type="radio"
                id="new-point"
                label="New point"
                name="georeference"
                value="NewPoint"
                onChange={(e) => handleGeoSelection(e.target.value)}
                className="font-size-20"
              />
            </Col>
            <Col xs="auto">
              <Form.Check
                type="radio"
                id="list-points"
                label="List of points"
                name="georeference"
                value="ListOfPoints"
                onChange={(e) => handleGeoSelection(e.target.value)}
                className="font-size-20"
              />
            </Col>
            <Col>
              <Button
                variant="primary"
                onClick={handleDeselect}
                className="button-small mt-2"
              >
                Deselect
              </Button>
            </Col>
          </Row>
        )}
        {/* Area options */}
        {geoType === "Polygon" && (
          <Row>
            <Col xs="auto">
              <Form.Check
                type="radio"
                id="new-area"
                label="New area"
                name="georeference"
                value="NewArea"
                onChange={(e) => handleGeoSelection(e.target.value)}
                className="font-size-20"
              />
            </Col>
            <Col xs="auto">
              <Form.Check
                type="radio"
                id="list-areas"
                label="List of areas"
                name="georeference"
                value="ListOfAreas"
                onChange={(e) => handleGeoSelection(e.target.value)}
                className="font-size-20"
              />
            </Col>
            <Col xs="auto">
              <Form.Check
                type="radio"
                id="municipality"
                label="Municipality Area"
                name="georeference"
                value="Municipality"
                onChange={(e) => handleGeoSelection(e.target.value)}
                className="font-size-20"
              />
            </Col>
            <Col>
              <Button
                variant="primary"
                onClick={handleDeselect}
                className="button-small mt-2"
              >
                Deselect
              </Button>
            </Col>
          </Row>
        )}

        {geoType === "NewPoint" && (
          <NewPointSelection
            {...props}
            showMiniMap={showMiniMap}
            setShowMiniMap={setShowMiniMap}
          />
        )}
        {geoType === "NewArea" && (
          <NewAreaSelection
            {...props}
            showPolygonMap={showPolygonMap}
            setShowPolygonMap={setShowPolygonMap}
          />
        )}
        {geoType === "ListOfPoints" && (
          <ListOfPointsSelection
            {...props}
            showMiniMap={showMiniMap}
            setShowMiniMap={setShowMiniMap}
          />
        )}
        {geoType === "ListOfAreas" && (
          <ListOfAreasSelection
            {...props}
            showPolygonMap={showPolygonMap}
            setShowPolygonMap={setShowPolygonMap}
          />
        )}
      </Form.Group>
    </>
  );
};

export default GeoreferenceTypeSelection;