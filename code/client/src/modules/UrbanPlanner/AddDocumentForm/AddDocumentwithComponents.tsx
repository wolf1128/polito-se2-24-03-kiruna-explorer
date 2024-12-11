import { Col, Row, Form, Button, Alert } from "react-bootstrap";
import { useState, FormEvent, useRef } from "react";
import { Props, NewDocument } from "./interfaces/types";
import { useNavigate } from "react-router-dom";
import API from "../../../API/API";
import { useSidebar } from "../../../components/SidebarContext";
import { useToast } from "../../ToastProvider";
import { FaCheck } from "react-icons/fa";
import StepOne from "./steps/StepOne";
import StepTwo from "./steps/StepTwo";
import StepThree from "./steps/StepThree";
import "../../style.css";

const AddDocumentForm = (props: Props) => {
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();

  const [errorMessage, setErrorMessage] = useState("");
  const [validatedFirstForm, setValidatedFirstForm] = useState(false); // Separate validated state for the first form
  const [currentStep, setCurrentStep] = useState(1);
  const [newDocID, setNewDocID] = useState(0);

  const stakeholderSelectionRef = useRef<any>(null);

  const showToast = useToast();

  const handleNext = () => {
    if (props.document.title && props.document.description) {
      setErrorMessage("");
      setCurrentStep((prevStep) => prevStep + 1);
    } else setErrorMessage("Title or Description are empty");
  };

  const handlePrevious = () => setCurrentStep((prevStep) => prevStep - 1);

  const handleSubmitFirstForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    stakeholderSelectionRef.current.handleValidationCheck();
    setValidatedFirstForm(true); // Set validated state for the first form
    const form = event.currentTarget as HTMLFormElement;
    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      const document = {
        title: props.document.title.trim(),
        description: props.document.description,
        documentType: props.document.documentType.trim(),
        scale: props.document.scale.trim(),
        nodeType: props.document.nodeType,
        stakeholders: props.document.stakeholders,
        issuanceDate: props.document.issuanceDate,
        language: props.document.language,
        pages: props.document.pages.trim(),
        georeference: props.document.georeference,
        georeferenceName: props.document.georeferenceName,
        areaColor: props.document.areaColor,
      };

      API.addDocument(document).then((response) => {
        const { documentId, message } = response;
        setNewDocID(documentId);

        const newDoc: NewDocument = {
          title: "",
          description: "",
          documentType: "",
          scale: "",
          nodeType: "",
          stakeholders: [],
          issuanceDate: "",
          language: "",
          pages: "",
          georeference: [[]],
          georeferenceName: "",
          areaColor: "",
        };
        props.setDocument(newDoc);
        setErrorMessage("");

        showToast(message, "Now you can see the document in the list", false);
        setCurrentStep(3); // Go to the final empty screen after submission
      });
    }
  };

  const handleCancel = () => {
    const resetDoc: NewDocument = {
      title: "",
      description: "",
      documentType: "",
      scale: "",
      nodeType: "",
      stakeholders: [],
      issuanceDate: "",
      language: "",
      pages: "",
      georeference: [[]],
      georeferenceName: "",
      areaColor: "",
    };

    props.setDocument(resetDoc);
    navigate("/explore-map");
  };

  // Render function for step circles
  const renderStepCircle = (step: number) => {
    if (currentStep === step) {
      return <div className="step-circle active"></div>;
    } else if (currentStep > step) {
      return (
        <div className="step-circle completed">
          <FaCheck color="white" />
        </div>
      );
    } else {
      return <div className="step-circle"></div>;
    }
  };

  return (
    <div className={`main-page ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <div className="form-container">
        <Row className="form-title">
          {currentStep == 3 ? "Connect Multiple Document" : "New Document"}
        </Row>

        {/* Step Indicator Row */}
        <Row className="step-indicator-row">
          <Col className="step-col">
            {renderStepCircle(1)}
            <div className="step-label">
              <span className="step-number">Step 1</span>
              <br />
              <span className="step-title">Basic info</span>
            </div>
          </Col>
          <Col className="line-col">
            <div></div>
            <div className="solid-line"></div>
            <div></div>
          </Col>
          <Col className="step-col">
            {renderStepCircle(2)}
            <div className="step-label">
              <span className="step-number">Step 2</span>
              <br />
              <span className="step-title">Add info</span>
            </div>
          </Col>
          <Col className="line-col">
            <div></div>
            <div className="solid-line"></div>
            <div></div>
          </Col>
          <Col className="step-col">
            {renderStepCircle(3)}
            <div className="step-label">
              <span className="step-number">Step 3 (optional)</span>
              <br />
              <span className="step-title">Connections</span>
            </div>
          </Col>
        </Row>

        {/* Step Components */}
        {currentStep === 1 && (
          <StepOne
            document={props.document}
            setDocument={props.setDocument}
            onNext={handleNext}
            onCancel={handleCancel}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        )}

        {currentStep === 2 && (
          <StepTwo
            document={props.document}
            setDocument={props.setDocument}
            stakeholderSelectionRef={stakeholderSelectionRef}
            onBack={handlePrevious}
            onSubmit={handleSubmitFirstForm}
          />
        )}

        {currentStep === 3 && <StepThree newDocID={newDocID} />}
      </div>
    </div>
  );
};

export default AddDocumentForm;
