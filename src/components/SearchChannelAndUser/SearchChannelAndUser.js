import utils from "../../pages/auth/utils";
import React, { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../pages/auth/Sidebar";
import Header from "../../pages/auth/Header";
import "./SearchChannelAndUser.css";
import "../../css/auth/auth.scss";

import { Button, Container } from "react-bootstrap";
import { Avatar, ListItemAvatar } from "@mui/material";

// ("0","joined"),   
//     ("1","cancel"),
//     ("2","leave"),
//     ("3", "requested"),
//     ("-1","terminated")
const requestType = {
    Leave: 0,
    Request: 1,
    cancel: 3,
    terminated: -1
}

export default function SearchChannelAndUser() {
    let Token = localStorage.getItem("token");
    let login_user = JSON.parse(localStorage.getItem("user"));

    const [output, setOutput] = useState([])
    const [status, setStatus] = useState(2)
    const [request, setRequest] = useState({})

    async function getOrginizations() {
        axios
            .get(`${utils.getHost()}/chat/get/user_and_group_list/`, {
                headers: {
                    Authorization: `Bearer ${Token}`,
                },
            })
            .then(response => {
                const responseData = JSON.stringify(response.data);
                const data = JSON.parse(responseData);
                let val = []
                let tempData = data.results
                for (let i = 0; i < tempData.length; i++) {
                    if (tempData[i]?.org != 1)
                        if (tempData[i]?.org?.user?.username !== login_user.username) {
                            console.log(tempData[i]?.requested);
                            val.push({
                                "image": tempData[i]?.image,
                                "orgId": tempData[i]?.org?.id,
                                "orgName": tempData[i]?.org?.meta_attributes, "ChannelId": tempData[i]?.id,
                                "ChannelName": tempData[i]?.name,
                                "owner": tempData[i]?.org?.user?.username, "about": tempData[i]?.about,
                                "type": "Channel"
                            })
                            const uniqueId = tempData[i].type + tempData[i]?.org?.id + tempData[i]?.id
                            console.log(uniqueId, tempData[i]?.requested, " =-= ");
                            var req = request;

                            req[uniqueId] = tempData[i]?.requested;
                            setRequest({
                                ...request,
                                req
                            });

                        }
                }
                console.log({ request });
                setOutput(val)
            })
    }

    useEffect(() => {
        getOrginizations()
    }, [])

    const sendRequest = async (data) => {
        let value = { org: data.orgId, Channel: data.ChannelId, user: login_user.id }
        const res = await axios.post(
            `${utils.getHost()}/chat/userRequest/${login_user.id}`,
            value,
            {
                headers: { Authorization: ` Bearer ${Token}` },
            }
        );
        setRequest({
            ...request,
            [data.type + data.orgId + data.ChannelId]: 3,
        });
        // console.log('request data', res?.data?.request_type)

    }

    const sendCancleRequest = async (data) => {
        let value = { org: data.orgId, Channel: data.ChannelId, user: login_user.id }
        const res = await axios.delete
            (`${utils.getHost()}/chat/userRequest/${data.orgId}/${data.ChannelId}`,
                {
                    headers: { Authorization: ` Bearer ${Token}` },
                }
            ).then(() => {
                setRequest({
                    ...request,
                    [data.type + data.orgId + data.ChannelId]: 1,
                });
            })
        // console.log('request data', res?.data?.request_type)
    }


    const leaveRequest = async (data) => {
        console.log(data);
        setRequest({
            ...request,
            [data.type + data.orgId + data.ChannelId]: 1,
        });
    }
    return (
        <>
            {
                Token ? (
                    <div className="dashboard-wrapper">
                        <Sidebar />
                        <div className="header-main">
                            <Header />
                            <div className='App'>
                                <Container>
                                    <div className="d-flex justify-content-center">
                                        <h3>Groups / Users</h3>
                                    </div>
                                    <div className='d-flex' style={{ marginLeft: '15px' }} >
                                        <input onChange={e => console.log("setInput(e.target.value)")}
                                            type="text" placeholder='Search User/Group/...' aria-label="Search "
                                        />
                                        <p type="click"
                                            style={{ backgroundColor: 'transparent' }}
                                            className=" button-upload-org justify-content-right" onClick={(data) => {
                                                getOrginizations()
                                            }}>Refresh </p>
                                    </div>
                                    <hr style={{ width: '100%' }}></hr>
                                    {output.length > 0 ?
                                        <div className='output'>
                                            {output.map((e, i) => (
                                                <div key={i}>
                                                    <div style={{
                                                        background: 'skyblue', height: 'auto',
                                                        width: '80%', color: "white", padding: '5px',
                                                        borderRadius: '10px'
                                                    }}>
                                                        {'' + e.orgId + e.ChannelId}
                                                        <ListItemAvatar >
                                                            <Avatar alt={e.orgName} src={e.image} style={{
                                                                // padding: '5px',
                                                                alignItems: 'center',
                                                                height: '35px',
                                                                width: '35px'
                                                            }} />
                                                        </ListItemAvatar>
                                                        <div style={{
                                                            marginTop: "-25px",
                                                            paddingLeft: "80px"
                                                        }} >
                                                            <span >Channel Name : {e.ChannelName}</span>

                                                            {requestType.Request == request[e.type + e.orgId + e.ChannelId] &&
                                                                <span style={{ float: 'right' }} >
                                                                    <Button onClick={() => { sendRequest(e) }
                                                                    }>Request</Button>

                                                                </span>}
                                                            {requestType.Leave == request[e.type + e.orgId + e.ChannelId] &&
                                                                <span style={{ float: 'right' }} >
                                                                    <Button onClick={() => { leaveRequest(e) }
                                                                    }>Leave</Button>
                                                                </span>}

                                                            {requestType.cancel == request[e.type + e.orgId + e.ChannelId]
                                                                && <span style={{ float: 'right' }} >
                                                                    <Button onClick={() => { sendCancleRequest(e) }
                                                                    }>Cancel</Button>
                                                                </span>}
                                                            <p >ORGINIZATION: {e.orgName}</p>
                                                            <span style={{ float: 'right' }} >About : {e.about}</span>
                                                            <p >OWNER:  {e.owner}</p>
                                                        </div>

                                                    </div>
                                                    <hr style={{ width: '100%' }}></hr>
                                                </div>
                                            ))}
                                        </div>
                                        :
                                        <div className="d-flex justify-content-center">
                                            <h1>No Groups/ User To Show</h1>
                                        </div>
                                    }
                                </Container>


                            </div>
                        </div>
                    </div>
                )
                    : (
                        <Navigate replace to="/login" />
                    )}
        </>
    )
}
