import React, { useEffect, useRef, useState } from "react";
import "../../css/auth/auth.scss";
import { Link } from "react-router-dom";
import Modal from "../../components/AuthModal/Modal";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import swal from "sweetalert";
import utils from "./utils";
import Home from "./home";

const LoginScreen = () => {
  let Token = localStorage.getItem("token");
  let navigate = useNavigate();
  let loginFields = [
    {
      placeholder: "Email address or username",
      value: "",
      name: "username",
      type: "email",
      hasError: false,
    },

    {
      placeholder: "Password",
      value: "",
      name: "password",
      type: "password",
      hasError: false,
    },
  ];

  let feedbackObject = {
    process: "",
    feedback: "",
    closable: false,
  };

  const [fields, updateFields] = useState(loginFields);
  const [sendingRequest, updateSendingRequest] = useState(false);
  const [feedbackData, updateFeedbackData] = useState(feedbackObject);

  let resetTimeout = useRef(null);

  const setFieldValue = (value, index) => {
    let fieldData = [...fields];
    fieldData[index].value = value;
    fieldData[index].hasError = value === "";
    updateFields(fieldData);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    console.log("Form submitted");

    let requestObject = {};

    fields.forEach((field) => {
      requestObject[field.name] = field.value;
    });

    let feedbackTemplate = {
      process: "Signing in!",
      feedback: "",
      closable: false,
    };

    updateFeedbackData({ ...feedbackTemplate });
    updateSendingRequest(true);

    const options = {
      headers: {
          "Access-Control-Allow-Origin": "*"
      }
    };

    axios.post(
      // "http://192.168.1.37:8000/profile/user/login",
      `${utils.getHost()}/profile/user/login`,
      requestObject,
     // options
    )
      .then((response) => {
        console.log({ response });
        console.log("_______________", response.data.user);
        const token = response.data.token;
        console.log("________token_______", response.data);
        if (response.status === 200) {
          console.log("======if=======", token);
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          getUserImage(token, response.data.user.id)
        } else {
          swal("Failed", response, "error");
        }
      })
      .catch((error) => {
        let errorFeedback = {
          process: "Error",
          feedback: "",
          closable: true,
        };

        if (error.response) {
          errorFeedback.feedback = error.response.message;
          if (error.response.data) {
            if (error.response.data["non_field_errors"]) {
              errorFeedback.feedback = error.response.data["non_field_errors"];
            }
          } else {
            errorFeedback.feedback = "An unexpected error occurred";
          }
        } else {
          errorFeedback.feedback = "An unexpected error occurred";
        }

        updateFeedbackData({ ...errorFeedback });

        resetTimeout.current = setTimeout(() => {
          updateSendingRequest(false);
        }, 5000);
        console.log({ error });
      });
  };

  const getUserImage = async (token, resp) => {
    let api = `${utils.getHost()}/profile/user/profile_update/${resp}`;
    await axios
      .get(api, { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => {
        const value = data?.data;
        localStorage.setItem("loginUserImage", value?.image);
      }).then(() => {
        window.location.href = "/dashboard";
      })
      .catch((error) => console.log(error));
  }
  useEffect(() => {
    if (Token)
      navigate('/dashboard')
  }, [])

  return (
    <>
      {!Token ?
        <div className={"login-section page-container"}>
          <div className={"auth-container"}>
            <div className={"auth-logo"}>
              <img
                src={require("../../assets/teacherlogo.png")}
                alt={"Teacher logo"}
              />
            </div>

            <div className={"auth-content"}>
              <div className={"auth-header"}>
                <h4>Login</h4>
                <div className={"header-text"}>
                  Don't have an account yet? <Link to={"/register"}>Sign Up</Link>
                </div>
              </div>

              <form
                method={"post"}
                action={""}
                onSubmit={(event) => handleFormSubmit(event)}
              >
                <div className={"input-list centered-data"}>
                  {fields.map((field, index) => {
                    return (
                      <div className={`input-control`} key={index}>
                        <input
                          type={field.type}
                          value={field.value}
                          name={field.name}
                          onChange={(event) =>
                            setFieldValue(event.target.value, index)
                          }
                          placeholder={field.placeholder}
                          className={`${field.hasError ? "input-error" : ""}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className={"centered-data"}>
                  <div className={"forgot-password-section"}>
                    <Link to={"/ForgetPassword"}>Forgot password?</Link>
                  </div>

                  <div className={"button-container"}>
                    <button
                      type={"submit"}
                      disabled={
                        fields.filter((field) => field.value === "").length > 0
                      }
                    >
                      Log in
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {sendingRequest ? (
            <Modal
              text={feedbackData.process}
              feedbackText={feedbackData.feedback}
              closable={feedbackData.closable}
              onClose={() => {
                clearTimeout(resetTimeout.current);
                updateSendingRequest(false);
              }}
            />
          ) : null}
        </div>
        : <p>Loading ....</p>}
    </>
  );
};

export default LoginScreen;
