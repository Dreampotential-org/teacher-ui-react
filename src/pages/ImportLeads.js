import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import axios from "axios";
function ImportLeads() {
  const [repo, setRepo] = useState("");
  const [command, setCommand] = useState("");
  const submit = () => {
    try {
      axios.post("https://meylorci-api.dreampotential.org/tasks/", {
        repo,
        command,
        meta: {
          user_id: "qw1213",
        },
      });
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {}, []);
  return (
    <Container>
      <Row>
        <Col>
          <input
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Command"
          />
          <input placeholder="repo" onChange={(e) => setRepo(e.target.value)} />
          <button onClick={() => submit()}>Post</button>
        </Col>
      </Row>
    </Container>
  );
}

export default ImportLeads;
