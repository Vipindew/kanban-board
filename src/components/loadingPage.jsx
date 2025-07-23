import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext, useEffect, useRef } from "react";
import { UserContext } from "../App";

export function LoadingPage() {

    const navigate = useNavigate();
    const {value1, value2} = useContext(UserContext);
    const [loginStatus, _] = value1;

    useEffect(() => {loginStatus ? navigate('/boards') : navigate('/login')}, [loginStatus]);

    return (<></>);
}