import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import image from "../Images/Dustbin.png"
import { errorFunction } from "./errorfunction";
import _ from 'lodash';
import { backendURL } from "./url";

export function Boards(){

    const [boardList, setBoardList] = useState([]);
    const {value1, value2 : [username, setUsername]} = useContext(UserContext);
    const [loginStatus, _] = value1;
    const [members, setMembers] = useState({});
    const [suggestedMembers, setSuggestedMembers] = useState([]);
    const [popupToggle, setPopupToggle] = useState(false);
    const navigate = useNavigate();
    const [isPrivate, setIsPrivate] = useState(false);
    let deBounceTimer;

    useEffect(() => {
        !loginStatus && navigate('/login');
    }, [loginStatus]);

    useEffect(() => {getBoards()}, [])

    useEffect(() => {if (!isPrivate) {
        setSuggestedMembers([]);
        setMembers([]);
    }}, [isPrivate])

    async function getBoards() {
        try {
            const response = await axios.get(backendURL + "/boards", {withCredentials : true});
            setBoardList(response.data);          
        }
        catch(error) {
            errorFunction(error);
        }
    }

    async function getMembers(value) {
        clearTimeout(deBounceTimer);
        deBounceTimer = setTimeout(async () => {     
            try{
                const response = await axios.post(backendURL + "/members", {value:value}, {withCredentials : true});
                setSuggestedMembers(response.data);
            }
            catch(error) {
                errorFunction(error);
            }
        }, 300);
    }

    function addMember(member, selection){
        member != username && setMembers(m => ({...m, [member] : selection}));
    }

    function changePopup() {
        setIsPrivate(false);
        setPopupToggle(p => !p);
    }

    async function deleteBoard(e, id) {
        e.stopPropagation();
        try {
            setBoardList(d => d.filter(e => e.id !== id))
            const response = await axios.delete(backendURL + "/boards", {withCredentials : true, data : {id : id}});
            if (!_.isEqual(boardList, response.data)) setBoardList(response.data);
        } catch(error) {
            errorFunction(error)
        }
    }

    async function addBoardToBackend(e) {
        try {
            e.preventDefault();
            const boardName = e.target[0].value
            if (!boardName || boardList.some(b => b.name === boardName)) {
                alert("Board already exists")
                changePopup();
                return;
            };
            let membersSent = "public";
            if (isPrivate) {
                membersSent = members;
            }
            changePopup();
            setBoardList(b => [...b, {id : 12345, name : boardName, owner: 1, public : !isPrivate}].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())));
            const response = await axios.post(backendURL + "/boards", {name : boardName, members : membersSent}, {withCredentials : true});
            setBoardList(response.data);
        }
        catch(error){
            errorFunction(error);
        }
    }

    if (loginStatus) {return (
            <>
            <button className="add-board" onClick={changePopup}>Add Board</button>
            <h1>Join existing Boards </h1>
            <div className="boards">
                <div className="owner-list"> 
                    <h1>Created by You</h1>
                    <ul>             
                        {boardList.filter(e => e.owner).map((element,index) => (<li className="ui-boards" key={index} onClick={() => {navigate(`/homepage/${element.id}/${element.name}`)}}>
                            <div>{element.name}</div>
                            {element.owner ? <img className="dustbin" onClick={(e) => deleteBoard(e, element.id)} src={image} alt="Delete"></img> : ""}
                        </li>))}
                    </ul>
                </div>
                <div className="public-list">
                    <h1>Public Boards</h1>
                    <ul>             
                        {boardList.filter(e => !e.owner && e.public).map((element,index) => (<li className="ui-boards" key={index} onClick={() => {navigate(`/homepage/${element.id}/${element.name}`)}}>
                            <div>{element.name}</div>
                            {element.owner ? <img className="dustbin" onClick={(e) => deleteBoard(e, element.id)} src={image} alt="Delete"></img> : ""}
                        </li>))}
                    </ul>
                </div>
                <div className="private-list">
                    <h1>Private Boards</h1>
                    <ul>             
                        {boardList.filter(e => !e.owner && !e.public).map((element,index) => (<li className="ui-boards" key={index} onClick={() => {navigate(`/homepage/${element.id}/${element.name}`)}}>
                            <div>{element.name}</div>
                            {element.owner ? <img className="dustbin" onClick={(e) => deleteBoard(e, element.id)} src={image} alt="Delete"></img> : ""}
                        </li>))}
                    </ul>
                </div>
            </div>
            {popupToggle &&
                <div className="popup" onClick={changePopup}>
                    <div className="popup-box" onClick={(e) => {e.stopPropagation()}}>
                        <button onClick={changePopup} className="close-button">✖</button>
                        <form className="board-form" onSubmit={addBoardToBackend}>
                            <input className="board-name" autoComplete="off" autoFocus placeholder="Board name" id="boardName" name="board" type="text"></input><br/>
                            <input className="private" name="private" id="private" onChange={(e) => {setIsPrivate(e.target.checked)}} type="checkbox"></input>
                            <label className="private-label" htmlFor="private">Private</label><br/>
                            <input className="create-board" type="submit" value="Create board"></input>
                        </form>
                        {isPrivate && <>
                        <ul className="search" style={{listStyle : "none"}}>
                            <input onChange={(e) => {getMembers(e.target.value)}} name="member" placeholder="Search member" type="search"></input>
                            {suggestedMembers.map((element,index) => (<li key={index}>
                                <form onSubmit={(e)=> {
                                    e.preventDefault();
                                    const selection = e.target.elements.selection.value;
                                    addMember(element, selection);
                                    }}>
                                    <button>{element}</button>
                                    <select name="selection" defaultValue="Viewer">
                                        <option>Viewer</option>
                                        <option>Editor</option>
                                    </select>
                                </form>
                            </li>))}
                        </ul>
                        <ul className="added-members" style={{listStyle : "none"}}>
                            <div>Added Members</div>
                            {Object.keys(members).map((element,index) => (<li key={index}><div>{element} : {members[element]}</div> 
                                {element!=username && <button onClick={() => {
                                    const copyMembers = {...members};
                                    delete copyMembers[element];
                                    setMembers(copyMembers);
                                }}>Remove</button>}
                            </li>))}
                        </ul>
                        </>
                        }
                    </div>
                </div>
            }
            
            </>
        );
    } else {
        return (<></>);
    }
}