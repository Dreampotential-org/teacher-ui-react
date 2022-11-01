import React, { createRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEffect } from "react";
import { useRef } from "react";
import { Outlet } from "react-router-dom";
import "./mainChat.css";
import axios from "axios";
import utils from "../../pages/auth/utils";
import Loader from "./Loader";
import { useNavigate } from "react-router-dom";
import { Button, Dropdown, Form } from "react-bootstrap";
import Avatar from "@mui/material/Avatar";
import {
  ChatHeader,
  ImageShow,
  TextView,
  Answer,
  notify,
  ChatFooter,
  ChatLinkView,
} from "./templates/MainChat/Chat";
import CancelSharpIcon from "@mui/icons-material/CancelSharp";
import Record from "./Recorder";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { createPortal } from "react-dom";
import CallIcon from '@mui/icons-material/Call';
import Modal from 'react-bootstrap/Modal';
import 'react-toastify/dist/ReactToastify.css';
import Tooltip from '@mui/material/Tooltip';
import MicIcon from '@mui/icons-material/Mic';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import sound from './templates/MainChat/mixkit-bubble-pop-up-alert-notification-2357.wav'
import { HiOutlineEmojiHappy } from "react-icons/hi";

function UserChat(props) {
  let Token = localStorage.getItem("token");
  let loggedUser = JSON.parse(localStorage.getItem("user"));
  const profileSrc = localStorage.getItem("loginUserImage");
  let navigate = useNavigate();

  const inputRef = useRef(null);
  const scrollBottom = useRef(null);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [messageCount, setMessageCount] = useState(0);
  const [load, setLoad] = useState(false);
  const getChatImage = props.getChatImage;
  const [selectedFile, setSelectedFile] = useState();
  const [isSelected, setIsSelected] = useState(false);
  const [sendVoiceNote, setSendVoiceNote] = useState(true);
  const [tempReceiverId, setTempReceiverId] = useState(null);
  const [state, setState] = useState({
    file: "",
    filePreviewUrl:
      "https://github.com/OlgaKoplik/CodePen/blob/master/profile.jpg?raw=true",
  });
  const [call, setCall] = useState(false);
  const [callType, setCallType] = useState('');
  const [videoLink, setVideoLink] = useState(null);

  const userName = props.userName;
  const receiverId = props.userId;
  const type = props.type;
  var ws = props.websocket;

  useEffect(() => {
    // console.log(receiverId,'---------------receiverId--------------------');
    setTempReceiverId(receiverId)
  }, [props])

  var tempDict = {};


  useEffect(() => {
    ws.onmessage = (evt) => {
      const message = JSON.parse(JSON.stringify(evt.data));
      const receivedObj = JSON.parse(message);
      console.log("*******receivedObj From Onmessage******** ", receivedObj);
      tempDict[receivedObj.from_user.id + receivedObj.from_user.username] =
        receivedObj.unread_message_count;
      props.receiveMessageCount({
        unreadMessageCountDict: tempDict,
        unreadMessageCount: receivedObj.unread_message_count,
        userUniqeId: receivedObj.from_user.id + receivedObj.from_user.username,
      });
      const type = receivedObj?.message_type;
      if (loggedUser.id !== receivedObj.from_user.id) {
        //  notify();
        notify(receivedObj.from_user.username, type, receivedObj.message_text,receivedObj.message_type);

      }
      if (type === "message/videocall" || type === "message/voicecall") {
        console.log('------video call ---------');
        setCallType(type)
        setCall(true)
        setVideoLink(receivedObj?.media_link)
      }
      console.log(tempReceiverId, 'tempReceiverId from on message');
      if (tempReceiverId === receivedObj.from_user.id) {
        const massageTime = receivedObj?.created_at || "NA";
        const messageDate = new Date(massageTime);
        const message_type = receivedObj?.message_type;
        const time = messageDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const date = messageDate.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const msgObj = {
          sender: receivedObj?.from_user.username || "NA",
          message: receivedObj?.message_text || "NA",
          time: time || "NA",
          date: date || "NA",
          profile: receivedObj?.user_profile.image || null,
          message_type: message_type || "message/text",
          media_link: receivedObj?.media_link || null,
        };
        const prevMsgs = [...messages];
        prevMsgs.push(msgObj);
        setMessages([...prevMsgs]);
        if (type === "message/videocall_end" || type === "message/voicecall_end") {
          ReactDOM.unmountComponentAtNode(videoNode);
          videoNode.remove();
          ReactDOM.unmountComponentAtNode(voiceNode);
          voiceNode.remove();
          let soundPlayer = new Audio(sound);
          soundPlayer.play()
        }
      }
    };
  }, [messages, props]);
  useEffect(() => {
    if (scrollBottom) {
      scrollBottom.current.addEventListener("DOMNodeInserted", (event) => {
        const { currentTarget: target } = event;
        target.scroll({ top: target.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages]);

  const onScroll = () => {
    if (scrollBottom.current) {
      const { scrollTop } = scrollBottom.current;
      if (scrollTop == 0) {
        setPage(page + 1);
        if (page * 10 <= messageCount) {
          setLoad(true);
          updateData(page + 1);
        }
      }
    }
  };

  async function handleClick(event) {
    event.preventDefault();
    let context_type;
    let file_url;
    if (isSelected) {
      let formData = new FormData();
      formData.append("file", selectedFile);
      await axios
        .post(`${utils.getHost()}/profile/upload`, formData)
        .then((resp) => {
          console.log(resp.data.content_type);
          context_type = resp.data.content_type;
          file_url = resp.data.file_url;
        })
        .then(() => {
          setState({ file: false });
        })
        .catch((resp) => {
          setState({ file: false });

          alert("connection is breaked");
        });
    } else {
      context_type = null;
      file_url = null;
    }
    if (inputRef.current.value !== "" || isSelected) {
      ws.send(
        JSON.stringify({
          meta_attributes: "react",
          message_type: context_type ? context_type : "message/text",
          media_link: file_url ? file_url : null,
          message_text: inputRef.current.value ? inputRef.current.value : "",
        })
      );
      let messageDate = new Date();
      let timeNow = messageDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const date = messageDate.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      let a = {
        sender: loggedUser.username,
        message: inputRef.current.value,
        time: timeNow,
        date: date,
        media_link: file_url ? file_url : null,
        message_type: context_type ? context_type : "message/text",
        profile: getChatImage,
      };
      const prevMsgs = [...messages];
      prevMsgs.push(a);
      setMessages([...prevMsgs]);
      setIsSelected(false);
      setSendVoiceNote(true)
      setState({ file: false });
      document.getElementById("inp").value = "";
    }

  }

  const videoNode = document.createElement("div");
  function videoCall(event) {
    event.preventDefault();
    console.log("Video call");
    document.body.appendChild(videoNode);
    videoNode.style.height = "300px";
    videoNode.style.width = "600px";
    videoNode.style.position = "relative"
    const PopupContent = () => {
      ws.send(
        JSON.stringify({
          meta_attributes: "react",
          message_type: "message/videocall",
          media_link: "https://conference.dreampotential.org/videocall",
          message_text: "",
        })
      );
      return (
        <div>
          <Modal
            show={true}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            fullscreen={true}
            dialogClassName="modal-90w"
          >
            <Modal.Header className="bg-primary" onClick={videoclear} closeButton >
              <Modal.Title className="text-white" id="contained-modal-title-vcenter">
                Teach Video Call
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <JitsiMeeting
                domain={"conference.dreampotential.org"}
                roomName="videocall"
                configOverwrite={{
                  toolbarButtons: ['microphone', 'hangup', 'settings', 'camera',],
                  buttonsWithNotifyClick: [{ key: 'hangup', preventExecution: true }, { key: 'chat', preventExecution: true },],
                  hiddenPremeetingButtons: ['invite'],
                  notifications: [],
                  startWithAudioMuted: true,
                  disableModeratorIndicator: true,
                  startScreenSharing: true,
                  enableEmailInStats: false,
                }}
                interfaceConfigOverwrite={{
                  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
                }}
                userInfo={{
                  displayName: 'YOUR_USERNAME'
                }}
                onApiReady={(externalApi) => {
                }}
                getIFrameRef={(iframeRef) => { iframeRef.style.height = '440px'; iframeRef.style.width = '1340px'; }}
              />
            </Modal.Body>
            <Modal.Footer>
              <Tooltip title="Leave the meeting"><Button variant="danger" onClick={videoclear}>End Call</Button></Tooltip>
            </Modal.Footer>
          </Modal>
        </div>
      );
    };
    const videoclear = () => {
      ReactDOM.unmountComponentAtNode(videoNode);
      videoNode.remove();
    };
    ReactDOM.render(<PopupContent />, videoNode);
  }

  // const uniqueString = require("uuid").uuid.v4();
  const voiceNode = document.createElement("div");
  function voiceCall(event) {
    event.preventDefault();
    console.log("voiceCall");
    document.body.appendChild(voiceNode);
    voiceNode.style.height = "300px";
    voiceNode.style.width = "600px";
    voiceNode.style.position = "relative"
    const PopupContent = () => {
      ws.send(
        JSON.stringify({
          meta_attributes: "react",
          message_type: "message/voicecall",
          media_link: "https://conference.dreampotential.org/voicecall",
          message_text: "",
        })
      );
      return (
        <div>
          <Modal
            show={true}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            fullscreen={true}
            dialogClassName="modal-90w"
          >
            <Modal.Header onClick={voiceclear} closeButton >
              <Modal.Title id="contained-modal-title-vcenter">
                Teach Voice Call
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <JitsiMeeting
                domain={"conference.dreampotential.org"}
                roomName="voicecall"
                configOverwrite={{
                  toolbarButtons: ['microphone', 'hangup', 'settings'],
                  buttonsWithNotifyClick: [{ key: 'hangup', preventExecution: true }, { key: 'chat', preventExecution: true },],
                  hiddenPremeetingButtons: ['camera', 'invite', 'select-background'],
                  notifications: [],
                  startWithAudioMuted: true,
                  disableModeratorIndicator: true,
                  startScreenSharing: true,
                  enableEmailInStats: false,
                }}
                interfaceConfigOverwrite={{
                  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
                }}
                userInfo={{
                  displayName: 'YOUR_USERNAME'
                }}
                onApiReady={(externalApi) => {
                }}
                getIFrameRef={(iframeRef) => { iframeRef.style.height = '440px'; iframeRef.style.width = '1340px'; }}
              />
            </Modal.Body>
            <Modal.Footer>
              <Tooltip title="Leave the meeting"><Button variant="danger" onClick={() => { voiceclear(voiceclear) }}>End Call</Button></Tooltip>
            </Modal.Footer>
          </Modal>
        </div>
      );
    };
    const voiceclear = () => {
      ReactDOM.unmountComponentAtNode(voiceNode);
      voiceNode.remove();

    };
    ReactDOM.render(<PopupContent />, voiceNode);
  }
  useEffect(() => {
    console.log(
      `web socket connection created for ${userName},${receiverId}!!`
    );
    axios
      .get(
        `${utils.getHost()}/chat/get/user/paginated_messages/?user=${receiverId}&records=10`,
        {
          headers: {
            Authorization: `Bearer ${Token}`,
          },
        }
      )
      .then((res) => {
        const responseData = JSON.stringify(res.data);
        const message = JSON.parse(responseData);
        setMessageCount(message.count);
        const prevMsgs = [];
        if (message?.results?.length)
          for (let i = message.results.length - 1; i >= 0; i--) {
            const receivedObj = message.results[i];
            const massageTime = receivedObj?.created_at || "NA";
            const messageDate = new Date(massageTime);
            const message_type = receivedObj?.message_type;

            const time = messageDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const date = messageDate.toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });

            const msgObj = {
              sender: receivedObj?.from_user.username || "NA",
              message: receivedObj?.message_text || "NA",
              time: time || "NA",
              date: date || "NA",
              profile: receivedObj?.user_profile?.image || Avatar,
              message_type: message_type || "message/text",
              media_link: receivedObj?.media_link || null,
            };
            prevMsgs.push(msgObj);
          }
        setMessages([...prevMsgs]);
      })
      .then(() => {
        setLoad(false);
      })
      .catch((error) => {
        console.log("error : ", error);
      });
  }, [userName]);

  function updateData(value) {
    axios
      .get(
        `${utils.getHost()}/chat/get/user/paginated_messages/?user=${receiverId}&records=10&p=${value}`,
        {
          headers: {
            Authorization: `Bearer ${Token}`,
          },
        }
      )
      .then((res) => {
        const responseData = JSON.stringify(res.data);
        const message = JSON.parse(responseData);
        const prevMsgs = [];

        for (let i = message.results.length - 1; i >= 0; i--) {
          const receivedObj = message.results[i];
          const massageTime = receivedObj?.created_at || "NA";
          const messageDate = new Date(massageTime);
          const message_type = receivedObj?.message_type;

          const time = messageDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const date = messageDate.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          const msgObj = {
            sender: receivedObj?.from_user.username || "NA",
            message: receivedObj?.message_text || "NA",
            time: time || "NA",
            date: date || "NA",
            profile: receivedObj?.user_profile?.image || null,
            message_type: message_type || "message/text",
            media_link: receivedObj?.media_link || null,
          };

          prevMsgs.push(msgObj);
        }
        setLoad(false);
        setMessages([...prevMsgs, ...messages]);
      })
      .finally(() => {
        setLoad(false);
      });
  }

  const photoUpload = (event) => {
    event.preventDefault();
    const reader = new FileReader();
    const file = event.target.files[0];
    setSelectedFile(event.target.files[0]);
    setIsSelected(true);
    reader.onloadend = () => {
      setState({
        file: file,
        filePreviewUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const onStopRecording = async (recording) => {
    let formData = new FormData();
    formData.append("file", recording, "audio.mp3");
    await axios
      .post(`${utils.getHost()}/profile/upload`, formData)
      .then((resp) => {
        let file_url = resp.data.file_url;
        ws.send(
          JSON.stringify({
            meta_attributes: "react",
            message_type: "audio/mpeg",
            media_link: file_url ? file_url : null,
            message_text: inputRef.current.value ? inputRef.current.value : "",
          })
        );

        let messageDate = new Date();
        let timeNow = messageDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const date = messageDate.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        let a = {
          sender: loggedUser.username,
          message: inputRef.current.value,
          time: timeNow,
          date: date,
          media_link: file_url ? file_url : null,
          message_type: "audio/mpeg",
          profile: getChatImage,
        };
        const prevMsgs = [...messages];
        prevMsgs.push(a);
        setMessages([...prevMsgs]);
        setIsSelected(false);
        setState({ file: false });
        document.getElementById("inp").value = "";
      })
      .catch((resp) => {
        // setState({ file: false });

        alert("connection is breaked");
      });
  };
  const node = document.createElement("div");
  return (
    <div className="groupChat">
      <ChatHeader
        name={userName}
        props={props}
        type={type}
        image={getChatImage}
        ws={ws}
        onclickVoice={(e) => voiceCall(e)}
        onclickVedio={(e) => videoCall(e)}
        chatroomId={receiverId}
      />
      {load ? <Loader /> : null}
      <div >
        {call && (
          callType === 'message/videocall' ?
            <Answer type='message/videocall' image={videoLink} profile={null} sender={loggedUser.username} ws={ws} />
            :
            <Answer type='message/voicecall' image={videoLink} profile={null} sender={loggedUser.username} ws={ws} />
        )}
      </div>
      {state.file ? (
        <div>
          <CancelSharpIcon
            style={{ flex: 1, marginLeft: "90%", position: "relative" }}
            onClick={() => {
              setState({
                file: null,
                filePreviewUrl: null,
              });
              setIsSelected(false);
            }}
            color="primary"
            fontSize="large"
          />
          <ImageShow className="image-show-view" filePreviewUrl={state.filePreviewUrl} />
        </div>
      ) : (
        <div
          className="content"
          id="scroll"
          ref={scrollBottom}
          onScroll={onScroll}
        >
          {messages.map((e, i) => {
            return (
              <div
                key={i}
                style={{
                  marginTop: "2%",
                  overflow: "auto",
                }}
              >
                {e.sender === loggedUser.username ? (
                  <div>
                    {e.media_link ? (
                      <ChatLinkView
                        type={e.message_type}
                        link={e.media_link}
                        profile={profileSrc}
                        text={e.message}
                        sender={"Me"}
                        time={e.time}
                      />
                    )
                      :
                      (
                        <TextView
                          sender={"Me"}
                          profile={profileSrc}
                          text={e.message}
                          time={e.time}
                          type={type}
                        />
                      )}
                  </div>
                ) : (
                  <div>
                    {e.media_link ? (
                      <ChatLinkView
                        type={e.message_type}
                        link={e.media_link}
                        profile={e.profile}
                        text={`${e.message}`}
                        sender={e.sender}
                        time={e.time}
                        float={"left"}
                      />
                    ) : (
                      <TextView
                        sender={e.sender}
                        profile={e.profile}
                        text={e.message}
                        time={e.time}
                        float={"left"}
                        type={type}
                      />
                    )}

                  </div>
                )}

              </div>
            );
          })}
          <Outlet />
        </div>
      )}
      
      <div style={{ width: '100%', position: 'relative', paddingLeft: '30px' }}>
        <ChatFooter inputRef={inputRef} handleClick={e => handleClick(e)} sendImage={state.file}
          onStopRecording={e => onStopRecording(e)} photoUpload={e => photoUpload(e)} />

        {/* <Form className="box">
          <HiOutlineEmojiHappy style={{ cursor: 'pointer', fontSize: '30px', color: '#128c7e' }} onClick={()=>alert('...in progress')}/>

          <input
            ref={inputRef}
            className="input_text"
            id="inp"
            type="text"
            placeholder="Enter Text Here..."
            onKeyDown={(e) => e.key === "Enter" || handleClick}
            onChange={(value) => value.target.value.length > 0 ? setSendVoiceNote(false) : setSendVoiceNote(true)}
          />
          <ImgUpload onChange={photoUpload} />
          {!sendVoiceNote ?
            <button onClick={handleClick} className="btn btn-outline-primry" style={{ width: '80px', border: 'none', borderRadius: '500px', color: '#128c7e' }}>
              <SendRoundedIcon style={{ cursor: 'pointer' }} sx={{ fontSize: 40 }} ></SendRoundedIcon>
            </button>
            :
            <Tooltip title="Record a message"><MicIcon style={{ cursor: 'pointer', color: '#128c7e' }} sx={{ fontSize: 30 }}><Record onStopRecording={onStopRecording}></Record></MicIcon></Tooltip>
          }
        </Form> */}
      </div>
    </div>
  );
}

export default UserChat;
