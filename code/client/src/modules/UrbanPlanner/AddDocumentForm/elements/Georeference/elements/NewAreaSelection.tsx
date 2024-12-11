import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { useState, useEffect } from "react";
import MiniMapAreaModal from "../minimap/MiniMapAreaModal";
import "../../../../../style.css";
import { Props } from "../../../interfaces/types";

const NewAreaSelection = (
  props: Props & {
    showPolygonMap: boolean;
    setShowPolygonMap: React.Dispatch<React.SetStateAction<boolean>>;
  }
) => {
  const [polygonName, setPolygonName] = useState("");
  const [polygonCoordinates, setPolygonCoordinates] = useState<[number, number][]>([]);
  const [polygonColor, setPolygonColor] = useState("#3d52a0"); // Stato per il colore

  useEffect(() => {
    props.setDocument({
      ...props.document,
      georeference: polygonCoordinates,
      georeferenceName: polygonName ? polygonName : undefined,
      areaColor: polygonColor,
    });
  }, [polygonName, polygonCoordinates, polygonColor]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPolygonName(e.target.value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPolygonColor(e.target.value);
  };

  // TODO - aggiungere un campo per scegliere il colore rgb dell'area

  return (
    <Form.Group as={Col} className="align-items-center">
      <Row>
        <Col>
          <InputGroup>
            {/* <InputGroup.Text className="font-size-18">Name</InputGroup.Text> */}
            <Form.Control
              type="text"
              value={polygonName}
              onChange={handleNameChange}
              placeholder="Enter area name"
              className="font-size-20"
              required
            />
          </InputGroup>
        </Col>
        <Col md="auto" className="col-color-wheel">
          <InputGroup className="input-color-wheel">
            <Form.Control
              type="color"
              value={polygonColor}
              onChange={handleColorChange}
              className="form-color-wheel"
              required
            />
          </InputGroup>
        </Col>
      </Row>

      {props.showPolygonMap && (
        <MiniMapAreaModal
          showPolygonMap={props.showPolygonMap}
          setShowPolygonMap={props.setShowPolygonMap}
          setPolygonCoordinates={setPolygonCoordinates}
        />
      )}
    </Form.Group>
  );
};

export default NewAreaSelection;
