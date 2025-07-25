import { use, useContext, useEffect, useMemo, useRef, useState} from "react";
import axios from "axios";
import { data, useLocation, useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../App";
import { errorFunction } from "./errorfunction";
import _ from 'lodash';
import settings from "/home/vipin/logInPage/src/Images/settings.png";
import image  from "/home/vipin/logInPage/src/Images/Dustbin.png";
import { backendURL } from "./url";

function Homepage () {

    const [dataTable, setDataTable] = useState([]);
    const [addCardPop, setAddCardPop] = useState(false);
    const {value1, value2} = useContext(UserContext);
    const [loginStatus, setLoginStatus] = value1;
    const navigate = useNavigate();
    const {boardId, boardName} = useParams();
    const [cardPopup, setCardPopup] = useState(null);
    
    const role = useRef("Viewer");
    const currentColumn = useRef(null);
    const prevDataTable = useRef(dataTable);
    const dragElement = useRef(null);
    const dragElements = useRef(null);
    const indexDragStart = useRef(null);
    const indexDragEnd = useRef(null);
    const topIndexDragStart = useRef(null);
    const topIndexDragEnd = useRef(null);
    const mousePositionX = useRef(null);
    const mousePositionY = useRef(null);
    const deBouncer = useRef(null);
    const trackVersion = useRef(0);

    const marginHeading = 150;
    const columnHeight = 40;
    const gapX = 30;
    const gapY = 10;
    const widthX = 200;
    const heightY = 80;
    
    useEffect(() => {
        getData();
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('scroll', handleScrollMove);

        return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('scroll', handleScrollMove);
        };
    }, []);

    useEffect(() => {prevDataTable.current = dataTable}, [dataTable]);

    function isEditor(){
        return ["Editor", "Owner"].includes(role.current);
    }

    function changeData(response){

        clearTimeout(deBouncer.current);

        deBouncer.current = setTimeout(() => {

            const [newDataTable, newRole, version] = response.data;

            if (version > trackVersion.current && !_.isEqual(prevDataTable.current, newDataTable) || role.current !== newRole) {
                setDataTable(newDataTable);
                role.current = newRole;
                trackVersion.current = version;
            }
            
        }, 5000);
    }

    function changeDataInstant(response) {
        
        const [newDataTable, newRole, version] = response.data;

        if (version > trackVersion.current) {
            clearTimeout(deBouncer.current);

            setDataTable(newDataTable);
            role.current = newRole;

            trackVersion.current = version;
        }
    }

    async function getData() {
        try{
            const response = await axios.get(`${backendURL}/boards/${boardId}`, {withCredentials : true});
            const [newDataTable, newRole] = response.data;
            setDataTable(newDataTable);
            role.current = newRole;
            console.log(newRole);
        }
        catch(error){
            errorFunction(error);
        }
    }

    async function createColumn(e) {
        e.preventDefault();
        const columnName = e.target[0].value;
        if (!columnName) return;
        e.target[0].value = ""
        try{
            const response = await axios.post(backendURL + "/column", {columnName:columnName}, {withCredentials : true});
            changeDataInstant(response);
        } catch(error){
            errorFunction(error);
        }
    }

    async function deleteColumn(id) {
        try {
            setDataTable(d => d.filter(e => e.id !== id));
            const response = await axios.delete(backendURL + "/column", {withCredentials:true, data: {
                id: id
            }});

            changeData(response);
        }
        catch(error) {
            errorFunction(error);
        }
    }

    async function updateColumn(id, endPosition) {

        try{

            const response = await axios.put(backendURL + "/column", {id : id, end_position : endPosition}, {withCredentials : true});           

            changeData(response);

        } catch(error) {

            errorFunction(error);

        }

    }

    async function updateCard(id, startColumnId, endColumnId, end_index) {
        
        try{

            const response = await axios.put(backendURL + "/card", {id : id, start_column_id : startColumnId, end_column_id : endColumnId, end_index : end_index}, {withCredentials : true});
            
            changeData(response);

        } catch(error) {

            errorFunction(error);

        }
        
    }

    function leftPosition(index) {

        return index * (widthX + gapX) + gapX + "px";

    }

    function topPosition(index) {
        return (heightY + gapY) * index + gapY + columnHeight + "px";
    }

    function openCardPopup(card) {

        const created_date = new Date(card.created_at * 1000);
        const expire_date = new Date(card.expire_at * 1000);

        const popup = <div className="popup" onClick={closeCardPopup}>
            <div style={{backgroundColor : card.color, color : card.text_color}} onClick={(e) => e.stopPropagation()} className="card-box">
                <button onClick={closeCardPopup} className="close-button">✖</button>
                <h2>Name : {card.name}</h2>
                <div className="created">Created at : {created_date.toLocaleString()}</div>
                {card.expire_at && <div className="expire">Expiry : {expire_date.toLocaleString()}</div>}
                <div className="owner">Created by : {card.owner}</div>
                <h2>Description</h2>
                <div>{card.description}</div>
            </div>
        </div>;

        setCardPopup(popup);
    }

    async function editCard(id, name, description, text_color, color, dateTime) {
        try {
            closeCard();
            const temp = new Date(dateTime)
            const expire_at = temp.getTime()/1000;

            const response = await axios.post(backendURL + "/card",
                {id:id, name:name, description:description, color:color, text_color:text_color,
                    expire_at:expire_at}, {withCredentials: true});

            changeDataInstant(response);

        } catch(error){
            errorFunction(error);
        }
    }

    function editCardPopup(card) {

        const expire_date = new Date(card.expire_at * 1000);
                    
        const popup = <div className="popup" onClick={closeCardPopup}>
            <div className="popup-box" onClick={(e) => {e.stopPropagation()}}>
                <button onClick={closeCardPopup} className="close-button">✖</button>
                <form className="create-card" onSubmit={(e) => {
                    e.preventDefault();
                    editCard(card.id, e.target[0].value, e.target[1].value, e.target[2].value, e.target[3].value, e.target[4].value);
                    closeCardPopup();
                }}>
                    <input autoFocus name="cardName" defaultValue={card.name} placeholder="Card name" type="text"></input>
                    <textarea name="description" defaultValue={card.description} placeholder="Description" type="textbox"></textarea>
                    <label> Text Color : <input name="color" type="color" defaultValue={card.text_color}></input></label>
                    <label> Background Color : <input name="text_color" type="color" defaultValue={card.color}></input></label>
                    <label> Expiry : <input name="expireAt" defaultValue={card.expire_at && `${expire_date.getFullYear()}-${(expire_date.getMonth()+1).toString().padStart(2,'0')}-${expire_date.getDate().toString().padStart(2,'0')}T${expire_date.getHours().toString().padStart(2,'0')}:${expire_date.getMinutes().toString().padStart(2,'0')}`} type="datetime-local"></input></label>
                    <button type="submit">Save</button>
                </form>
            </div>
        </div>;

        setCardPopup(popup);
    }

    async function editColumn(e, id) {
        e.preventDefault();
        const columnName = e.target[0].value;
        if (!columnName) return;
        closeCardPopup();
        try{
            const response = await axios.post(backendURL + "/column", {columnName:columnName, id:id}, {withCredentials : true});
            changeDataInstant(response);
        } catch(error){
            errorFunction(error);
        }
    }

    function createColumnPopup(column) {
        const popup = <div className="popup" onClick={closeCardPopup}>
            <div className="popup-box" onClick={(e) => e.stopPropagation()}>
                <button onClick={closeCardPopup} className="close-button">✖</button>
                <form className="create-card" onSubmit={(e) => editColumn(e, column.id)}>
                    <input autoFocus name="columnName" defaultValue={column.name} placeholder="Column name" type="text"></input>
                    <button type="submit">Save</button>
                </form>
            </div>
        </div>;

        setCardPopup(popup);
    }

    function closeCardPopup() {
        setCardPopup(null);
    }

    function printTable() {
        return (<div className="container">
            {dataTable.map((element, index) => (
                <div key={"c" + element.id} className="container-column" onDragStart={(e) => handleDragStart(e, index)} draggable={isEditor()} 
                style={{height : columnHeight, width : widthX, top : marginHeading, left : leftPosition(index), backgroundColor : 'white'}}>
                    <div className="column-delete">
                        <div className="column-name">{element.name}</div>
                        {isEditor() && <>
                            <img className="settings" onClick={() => createColumnPopup(element)} alt="settings" src={settings}></img>
                            <img src={image} alt="delete" onClick={() => {deleteColumn(element.id)}}></img>
                        </>}
                    </div>
                    {element.cards.map((e,i) => (
                        <div key={"r" + e.id} className="container-card" onDoubleClick={() => {openCardPopup(e)}} onDragStart={(ev) => handleDragStart(ev, index, i)} draggable={isEditor()} 
                        style={{height : heightY, width: widthX, left : '0px', top : topPosition(i), backgroundColor : e.color, color: e.text_color}}>
                            <div className="card-name" >{e.name}</div>
                            {isEditor() && <>
                                <img className="settings" onClick={() => {
                                    editCardPopup(e);
                                    }} alt="settings" src={settings}></img>
                                <img src={image} alt="delete" onClick={(ev) => {
                                    deleteCard(e.id, element.id);
                                    ev.stopPropagation();
                                }}></img>
                            </>}
                        </div>
                    ))}
                    {isEditor() ? <button onClick={() => {
                        currentColumn.current = element.id;
                        setAddCardPop(true);
                    }} className="add-button"
                    style={{top : topPosition(element.cards.length)}}>+</button> : <div className="space" style={{top : topPosition(element.cards.length)}}></div>}
                </div>
            ))}
            {isEditor() ? <form style={{height : columnHeight, left : leftPosition(dataTable.length), top : marginHeading + "px"}} className='add-column' onSubmit={(e) => createColumn(e)}>
                <input autoComplete='on' type='text' placeholder="Add Column"></input>
                <button type='submit'>+</button>
            </form> : <div style={{left : dataTable.length * (widthX + gapX) + "px"}} className="space"></div>}    
        </div>);
    }

    function scrollRightLeft(){
        if (mousePositionX.current > (window.innerWidth - 100)) {
            const speed = Math.floor((mousePositionX.current - window.innerWidth + 100)/20);
            window.scrollBy(speed, 0);
        }
        else if (mousePositionX.current < 100) {
            const speed = Math.floor((100 - mousePositionX.current)/20);
            window.scrollBy(-speed, 0);
        }
        if (mousePositionY.current > (window.innerHeight - 100)) {
            const speed = Math.floor((mousePositionY.current - window.innerHeight + 100)/20);
            window.scrollBy(0, speed);
        }
        else if (mousePositionY.current < 100) {
            const speed = Math.floor((100 - mousePositionY.current)/20);
            window.scrollBy(0, -speed);
        }
    }

    function deArrange(startIndexX, endIndexX) {

        dragElement.current.style.left = leftPosition(endIndexX);

        
        if (endIndexX !== indexDragEnd.current && indexDragEnd.current !== null){

            for (let index = 0; index < dragElements.current.length; index++) {
                if (index < startIndexX && index>= endIndexX) {
                dragElements.current[index].style.left = leftPosition(index + 1);
                } else if (index > startIndexX && index <= endIndexX) {
                dragElements.current[index].style.left = leftPosition(index - 1);
                } else if (index !== startIndexX) {
                dragElements.current[index].style.left = leftPosition(index);
                }
            }
        }
    }

    function handleScrollMove() {
        if(dragElement.current) {
        
        let endIndexX = Math.min(Math.floor((mousePositionX.current - gapX/2 + window.scrollX)/(widthX + gapX)), dragElements.current.length - 1);
        endIndexX = Math.max(endIndexX, 0);

        let endIndexY = Math.min(Math.floor((mousePositionY.current - columnHeight - marginHeading - gapY/2 + window.scrollY)/(heightY + gapY)), dragElements.current[endIndexX].children.length - (endIndexX === indexDragStart.current ? 3 : 2));
        endIndexY = Math.max(endIndexY, 0);

        if (dragElement.current.className === 'container-column') {
            deArrange(indexDragStart.current, endIndexX);
        } else if (dragElement.current.className === 'container-card') {
            deArrangeCards(indexDragStart.current, endIndexX, topIndexDragStart.current, endIndexY);
        }

        scrollRightLeft();
        }
    }

    function handleDragMove(e) {
        if (dragElement.current) {
        
        let endIndexX = Math.min(Math.floor((e.pageX - gapX/2)/(widthX + gapX)), dragElements.current.length - 1);
        endIndexX = Math.max(endIndexX, 0);

        let endIndexY = Math.min(Math.floor((e.pageY - columnHeight - marginHeading - gapY/2)/(heightY  +gapY)), dragElements.current[endIndexX].children.length - (endIndexX === indexDragStart.current ? 3 : 2));
        endIndexY = Math.max(endIndexY, 0);

        if (dragElement.current.className === 'container-column') {
            deArrange(indexDragStart.current, endIndexX);  
        } else if (dragElement.current.className === 'container-card') {
            deArrangeCards(indexDragStart.current, endIndexX, topIndexDragStart.current, endIndexY);
        }
        mousePositionX.current = e.clientX;
        mousePositionY.current = e.clientY;
        topIndexDragEnd.current = endIndexY;
        indexDragEnd.current = endIndexX;
        scrollRightLeft();
        }
    }

    function deArrangeCards(startIndexX, endIndexX, startIndexY, endIndexY) {
        
        if (endIndexX !== indexDragEnd.current && indexDragEnd.current !== null) {

            dragElement.current.style.top = topPosition(endIndexY);
            dragElement.current.style.left = (endIndexX - startIndexX) * (gapX + widthX) + "px";


            if (indexDragEnd.current === startIndexX) {

                const cardIterable = dragElements.current[startIndexX].children;

                for (let index = 0; index < cardIterable.length - 1; index++) {
                
                    if (index < startIndexY) {

                        cardIterable[index + 1].style.top = topPosition(index);

                    } else if (index > startIndexY) {

                        cardIterable[index + 1].style.top = topPosition(index - 1);

                    }
                }
                
                verticalSortingDiffIndex(endIndexX, endIndexY);

            } else if (endIndexX === startIndexX) {

                verticalSortingOnIndex(startIndexY, endIndexY);
                verticalSorting(indexDragEnd.current);

            } else {

                verticalSorting(indexDragEnd.current);
                verticalSortingDiffIndex(endIndexX, endIndexY);

            }
            }

            if (endIndexY !== topIndexDragEnd.current && topIndexDragEnd.current !== null) {

            dragElement.current.style.top = topPosition(endIndexY);
            dragElement.current.style.left = (endIndexX - startIndexX) * (gapX + widthX) + "px";

            if (endIndexX === startIndexX) {

                verticalSortingOnIndex(startIndexY, endIndexY)

            } else {
                
                verticalSortingDiffIndex(endIndexX, endIndexY);

            }
        }
    }

    function verticalSortingOnIndex(startIndexY, endIndexY) {

        const cardIterable = dragElements.current[indexDragStart.current].children;

        for (let index = 0; index < cardIterable.length - 1; index++) {
            
            if (index > startIndexY && index <= endIndexY) {

                cardIterable[index + 1].style.top = topPosition(index - 1);

            } else if (index < startIndexY && index >= endIndexY) {

                cardIterable[index + 1].style.top = topPosition(index + 1);

            } else if (index !== startIndexY) {
                
                cardIterable[index + 1].style.top = topPosition(index);

            }
        }
    }

    function verticalSorting(prevIndexX) {

        const cardIterable = dragElements.current[prevIndexX].children;

        for (let index = 0; index < cardIterable.length - 1; index++) {
        
            cardIterable[index + 1].style.top = topPosition(index);

        }
    }

    function verticalSortingDiffIndex(endIndexX, endIndexY) {

        const cardIterable = dragElements.current[endIndexX].children;

        for (let index = 0; index < cardIterable.length - 1; index++) {
        
        if (index >= endIndexY) {

            cardIterable[index + 1].style.top = topPosition(index + 1);

        } else {

            cardIterable[index + 1].style.top = topPosition(index);

        }
        }
    }

    function handleDragStart(e, index, i){
        e.preventDefault();
        e.stopPropagation();
        dragElement.current = e.target;
        dragElement.current.style.zIndex = '1010';
        // xoffset.current = (e.pageX - e.target.offsetLeft);
        mousePositionX.current = e.clientX;
        mousePositionY.current = e.clientY;
        indexDragStart.current = index;
        if (i !== null) topIndexDragStart.current = i;
        dragElements.current = document.getElementsByClassName('container-column');
    }

    function handleDragEnd() {
        if (dragElement.current && dragElement.current.className === 'container-column') {
        
            const temp = JSON.parse(JSON.stringify(prevDataTable.current));
            const startPosition = temp[indexDragStart.current].position;
            const endPosition = temp[indexDragEnd.current].position;

            startPosition !== endPosition && updateColumn(prevDataTable.current[indexDragStart.current].id, endPosition);

            sortPosition(temp, startPosition, endPosition);

            if (JSON.stringify(temp) !== JSON.stringify(prevDataTable.current)) setDataTable(temp);

            dragElement.current.style.zIndex = 'auto';
            
        } else if (dragElement.current && dragElement.current.className === 'container-card') {

            const startX = indexDragStart.current;
            const startY = topIndexDragStart.current;
            const endX = indexDragEnd.current;
            const endY = topIndexDragEnd.current;
            const temp = JSON.parse(JSON.stringify(prevDataTable.current));

            
            if (!(startX === endX && startY === endY)) updateCard(temp[startX].cards[startY].id, temp[startX].id, temp[endX].id, endY);

            if (startX === endX) {

                const startPosition = temp[startX].cards[startY].position;
                const endPosition = temp[startX].cards[endY].position;

                sortPosition(temp[startX].cards, startPosition, endPosition);

            } else {

                const deletedRow = temp[startX].cards.splice(startY, 1)[0];

                const endColumn = temp[endX].cards;
                
                const length = endColumn.length;

                endColumn.forEach((e, i) => {
                if (i === endY) {
                    deletedRow.position = e.position;
                    e.position++;
                } else if (i > endY) {
                    e.position++;
                }
                });

                if (endY === length) {
                    length ? deletedRow.position = (endColumn[length - 1].position) + 1 : deletedRow.position = 1;
                };

                endColumn.push(deletedRow);

                endColumn.sort((a, b) => a.position - b.position);
                
            }

            dragElement.current.style.zIndex = 'auto';
            if (JSON.stringify(temp) !== JSON.stringify(prevDataTable.current)) setDataTable(temp);
        }
        
        dragElement.current = null;
        indexDragEnd.current = null;
        topIndexDragEnd.current = null;
    }

    function sortPosition(temp, startPosition, endPosition) {
        if (startPosition === endPosition) return;

        temp.forEach((element) => {
            if (startPosition > endPosition) {
                if (element.position === startPosition) {
                    element.position = endPosition;
                } else if(element.position >= endPosition && element.position < startPosition) {
                    element.position++;
                }
            } else {
                if (element.position > endPosition) {
                    element.position++;
                } else if (element.position === startPosition){
                    element.position = endPosition + 1;
                }
            }
        });

        temp.sort((a, b) => a.position - b.position);

    }

    async function deleteCard(id,column_id) {
        try {
            setDataTable(d => d.map(element => element.id === column_id ? {...element, cards : element.cards.filter(e => e.id !== id)}: element))
            const response = await axios.delete(backendURL + "/card", {withCredentials : true, data : {id : id}});
            changeData(response);
        } catch(error){
            errorFunction(error);
        }

    }

    function closeCard(){
        setAddCardPop(false);
    }

    async function createCard(name, description, text_color, color, dateTime){

        try {
            closeCard();
            const temp = new Date(dateTime)
            const expire_at = temp.getTime()/1000;

            const response = await axios.post(backendURL + "/card",
                {name:name, description:description, color:color, text_color:text_color,
                    expire_at:expire_at, column_id:currentColumn.current}, {withCredentials: true});

            changeDataInstant(response);
            currentColumn.current = null;

        } catch(error){
            errorFunction(error);
        }
    }

    if (loginStatus) {
            return (
            <>
            <h1>Welcome {value2[0]} to {boardName}</h1>
            {printTable()}
            {cardPopup}
            {addCardPop &&
            <div className="popup" onClick={closeCard}>
                <div className="popup-box" onClick={(e) => {e.stopPropagation()}}>
                    <button onClick={closeCard} className="close-button">✖</button>
                    <form className="create-card" onSubmit={(e) => {
                        e.preventDefault();
                        if (!e.target[0].value) return;
                        createCard(e.target[0].value, e.target[1].value, e.target[2].value, e.target[3].value, e.target[4].value)
                    }}>
                        <input autoFocus name="cardName" placeholder="Card name" type="text"></input>
                        <textarea name="description" placeholder="Description" type="textbox"></textarea>
                        <label> Text Color : <input name="color" type="color" defaultValue="#000000"></input></label>
                        <label> Background Color : <input name="text_color" type="color" defaultValue="#ffffff"></input></label>
                        <label> Expiry : <input name="expireAt" type="datetime-local"></input></label>
                        <button type="submit">Save</button>
                    </form>
                </div>
            </div>}
            </>
        );
    } else {
        return (<></>);
    }
}

export default Homepage