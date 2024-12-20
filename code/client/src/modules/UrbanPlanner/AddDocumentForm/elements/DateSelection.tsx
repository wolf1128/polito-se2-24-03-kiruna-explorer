import { Row, Col, Form } from "react-bootstrap";
import { useState, useEffect } from "react";
import "../../../style.css";
import { Props, NewDocument } from "../interfaces/types";

const DateSelection = (props: Props) => {
  function validateDate(day: string, month: string, year: string): boolean {
    const dayNum = day !== "" ? Number(day) : null;
    const monthNum = month !== "" ? Number(month) : null;
    const yearNum = year !== "" ? Number(year) : null;

    if (!yearNum && (dayNum || monthNum)) {
      setDateError("Date must be in format yyyy or mm/yyyy or dd/mm/yyyy");
      return false;
    }

    if (!dayNum && !monthNum) {
      setDateError("");
      return true;
    }

    if (!dayNum && monthNum) {
      if (monthNum && monthNum >= 1 && monthNum <= 12) {
        setDateError("");
        return true;
      } else {
        setDateError("Date must be in format yyyy or mm/yyyy or dd/mm/yyyy");
        return false;
      }
    }

    if (dayNum && monthNum) {
      if (isNaN(dayNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        setDateError("Date must be in format yyyy or mm/yyyy or dd/mm/yyyy");
        return false;
      }

      const daysInMonth = new Date(yearNum!, monthNum, 0).getDate();
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        setDateError("");
        return true;
      } else {
        setDateError("Date must be in format yyyy or mm/yyyy or dd/mm/yyyy");
        return false;
      }
    }

    setDateError("Date must be in format yyyy or mm/yyyy or dd/mm/yyyy");
    return false;
  }

  const formatDate = (day: string, month: string, year: string) => {
    if (day === "" && month === "" && year === "") {
      return "";
    } else if (day === "" && month === "") {
      return `${year}`;
    } else if (day === "") {
      return `${year}-${month}`;
    } else {
      return `${year}-${month}-${day}`;
    }
  };

  const handleDayChange = (value: string) => {
    setDay(value);
    validateDate(day, month, year);
  };

  const handleMonthChange = (value: string) => {
    setMonth(value);
    if (value === "") {
      setDay("");
    }
    validateDate(day, month, year);
  };

  const handleYearChange = (value: string) => {
    setYear(value);
    if (value === "") {
      setMonth("");
      setDay("");
    }
    validateDate(day, month, year);
  };

  const [issuanceDate, setIssuanceDate] = useState(
    props.document ? props.document.issuanceDate : ""
  );

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [yearmd, setYearmd] = useState(0);
  const [monthmd, setMonthmd] = useState(0);
  const [daymd, setDaymd] = useState(0);

  useEffect(() => {
    if (year === "") {
      setYearmd(12);
    } else if (year !== "" && month === "") {
      setYearmd(6);
      setMonthmd(6);
    } else if (year !== "" && month !== "" && day === "") {
      setYearmd(4);
      setMonthmd(4);
      setDaymd(4);
    }
  }, [day, month, year, props.setDocument]);

  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (props.setDocument && validateDate(day, month, year)) {
      props.setDocument((prevDocument: NewDocument) => ({
        ...prevDocument,
        issuanceDate: formatDate(day, month, year),
      }));
    }
  }, [day, month, year, props.setDocument]);

  return (
    <Form.Group as={Col} controlId="formGridDate">
      <Row>
        <Col md={yearmd}>
          <Form.Label className="black-text">Year *</Form.Label>
          <Form.Select
            required
            value={year}
            onChange={(event) => handleYearChange(event.target.value)}
            className="font-size-18"
            isInvalid={!!dateError}
          >
            <option value="">yyyy</option>
            {Array.from({ length: 100 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </Form.Select>
        </Col>

        {year !== "" && (
          <Col md={monthmd}>
            <Form.Label className="black-text">Month</Form.Label>
            <Form.Select
              value={month}
              onChange={(event) => handleMonthChange(event.target.value)}
              className="font-size-18"
              isInvalid={!!dateError}
            >
              <option value="">mm</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </Form.Select>
          </Col>
        )}

        {year !== "" && month !== "" && (
          <Col md={daymd}>
            <Form.Label className="black-text">Day</Form.Label>
            <Form.Select
              value={day}
              onChange={(event) => handleDayChange(event.target.value)}
              className="font-size-18"
              isInvalid={!!dateError}
            >
              <option value="">dd</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {String(i + 1).padStart(2, "0")}
                </option>
              ))}
            </Form.Select>
          </Col>
        )}
      </Row>
    </Form.Group>
  );
};

export default DateSelection;
