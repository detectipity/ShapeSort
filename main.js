let canvasBase;
let canvasShape;
let canvasMove;
let layerBase;
let layerShape;
let layerMove;

let images;

const shapeW = 30;
const shapeH = 30;

const originW = 15;
const originH = 15;

let prevX = 0;
let prevY = 0;

const canvasW = 320;
const canvasH = 640;

let arrayShape;
let numKinds = 10;
let numDivs = numKinds + 2;
let divCapacity = 9;

let divs;
let moveHistory = [];

let selectedDiv = -1

class Move {
    iFrom;
    iTo;
    num;
    constructor(iFrom, iTo, num) {
        this.iFrom = iFrom;
        this.iTo = iTo;
        this.num = num;
    }
}

class Div {
    list;
    kindTop;
    numLayer;
    isSorted;
    constructor() {
        this.list = [];
        this.kindTop = 0;
        this.numLayer = 0;
        this.isSorted = false;
    }
    
    add(kind, num) {
        for(let i = 0; i < num; i++) {
            this.list.push(kind);
        }
        if(this.kindTop != kind) {
            this.numLayer += 1;
        }
        
        this.kindTop = kind;
        
        if(this.list.length == divCapacity && this.numLayer == 1) {
            this.isSorted = true;
        }
    }
    
    remove(num) {
        let kindRemove = this.list[this.list.length - 1]
        for(let i = 0; i < num; i++) {
            this.list.pop();
        }
        
        let l = this.list.length;
        if(l > 0) {
            if(this.list[l - 1] != kindRemove) {
                this.numLayer -= 1;
            }
            this.kindTop = this.list[l - 1]
        }
        else {
            this.numLayer = 0;
            this.kindTop = 0;
        }
        
        this.isSorted = false;
    }
    
    get numOut() {
        if(this.list.length == 0 || this.isSorted) {
            return 0;
        }
        
        if(this.list.length == 1) {
            return 1;
        }
        
        for(let i = 1; i < this.list.length; i++) {
            let j = this.list.length - 1 - i;
            if(this.list[j] != this.kindTop) {
                return i
            }
        }
        
        return this.list.length
    }
    
    get numIn() {
        return divCapacity - this.list.length
    }
}

onload = function() {
    makeCanvas();
    setEventListener();

    images = new Image();
    images.src = "シェイプソート.png";
    
    images.onload = function(){
        initArray();
        initCanvas();
    }
}

function makeCanvas() {
    canvasBase = document.getElementById("main");
    
    if ( ! canvasBase || ! canvasBase.getContext ) {
        return false;
    }
    layerBase = canvasBase.getContext("2d");
    
    canvasBase.width = canvasW;
    canvasBase.height = canvasH;
    
    const divCanvas = document.getElementById("canvas")
    const clientRect = divCanvas.getBoundingClientRect();
    const px = window.pageXOffset + clientRect.left;
    const py = window.pageYOffset + clientRect.top;
    
    canvasShape = document.createElement("canvas");
    canvasShape.width = canvasW;
    canvasShape.height = canvasH;
    layerShape = canvasShape.getContext("2d");
    
    canvasShape.style.zIndex = 10;
    canvasShape.style.position = "absolute";
    canvasShape.style.left = px + "px";
    canvasShape.style.top = py + "px";
    document.getElementById("canvas").appendChild(canvasShape);
    
    canvasMove = document.createElement("canvas");
    canvasMove.width = canvasW;
    canvasMove.height = canvasH;
    layerMove = canvasMove.getContext("2d");
    
    canvasMove.style.zIndex = 2;
    canvasMove.style.position = "absolute";
    canvasMove.style.left = px + "px";
    canvasMove.style.top = py + "px";
    document.getElementById("canvas").appendChild(canvasMove);
}

function setEventListener() {
    document.addEventListener("dblclick", function(e){ e.preventDefault();}, { passive: false });
    
    if (
        (navigator.userAgent.indexOf("iPhone") > 0
         || navigator.userAgent.indexOf("iPod") > 0
         || navigator.userAgent.indexOf("iPad") > 0
         || navigator.userAgent.indexOf("Android") > 0)
        ) {
            canvasShape.addEventListener("touchstart", touchstart);
            canvasShape.addEventListener("touchmove", touchmove);
            canvasShape.addEventListener("touchend", touchend);
            canvasShape.addEventListener("touchcancel",touchcancel);
            canvasShape.style.touchAction = "pinch-zoom";
        }
    else {
        canvasShape.addEventListener("mousedown", mousedown);
        canvasShape.addEventListener("mousemove", mousemove);
        canvasShape.addEventListener("mouseup", mouseup);
        canvasShape.addEventListener("mouseleave", mouseleave);
    }
}

function initArray(){
    divs = [];
    
    let order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    shuffle(order)
    
    let array = [];
    for(let i = 0; i < numKinds; i++) {
        for(let j = 0; j < divCapacity; j++) {
            array.push(order[i]);
        }
    }
    
    shuffle(array)
    
    for(let i = 0; i < numDivs; i++) {
        divs.push(new Div());
    }
    
    for(let i = 0; i < numKinds; i++) {
        for(let j = 0; j < divCapacity; j++) {
            divs[i].add(array[i * divCapacity + j], 1);
        }
    }
    
    drawShapes()
    drawBottle()
}

function initCanvas(){
    // 背景
    layerBase.fillStyle = "rgb(210, 240, 160)"
    layerBase.beginPath();
    layerBase.fillRect(0, 0, canvasW, canvasH);
    //layerBase.fillStyle = "rgb(240, 180, 120)"
    
    layerBase.textBaseline = "middle";
}

function moveStart(mx, my){
    //let ax = Math.floor(mx / blockW);
    let ay = Math.floor((my - 5) / 48);
    
    if(ay >= 0 && ay < numDivs) {
        if(selectedDiv == ay) {
            selectedDiv = -1
        }
        else if(selectedDiv == -1) {
            if(divs[ay].numOut > 0 || divs[ay].isSorted == false) {
                selectedDiv = ay
            }
        }
        else {
            if(divs[ay].numIn > 0 && (divs[ay].kindTop == 0 || divs[ay].kindTop == divs[selectedDiv].kindTop)) {
                operate(selectedDiv, ay)
                selectedDiv = -1
            }
        }
        
        drawBottle()
    }
    else {
        reverse()
    }
}

function moving(mx, my){
}

function moveEnd(){
}

function moveCancel(){
}

function mousedown(event) {
    let rect = event.target.getBoundingClientRect();
    mx = event.clientX - rect.left;
    my = event.clientY - rect.top;
    
    moveStart(mx, my);
}
function mousemove(event) {
    let rect = event.target.getBoundingClientRect();
    mx = event.clientX - rect.left;
    my = event.clientY - rect.top;
    
    moving(mx, my);
}
function mouseup(event) {
    moveEnd();
}
function mouseleave(event) {
    moveCancel();
}

function touchstart(event) {
    console.log("hello")
    let rect = event.target.getBoundingClientRect();
    let fing = event.touches[0];
    mx = fing.clientX - rect.left;
    my = fing.clientY - rect.top;
    
    moveStart(mx, my);
}
function touchmove(event) {
    let rect = event.target.getBoundingClientRect();
    let fing = event.touches[0];
    mx = fing.clientX - rect.left;
    my = fing.clientY - rect.top;
    
    moving(mx, my);
}
function touchend(event) {
    moveEnd();
}
function touchcancel(event) {
    moveCancel();
}

function drawIcon(layer, posX, posY, iconNumber) {
    const copyX = 16 * iconNumber;
    const copyY = 0;
    layer.drawImage(images, copyX ,copyY, originW, originH, posX, posY, shapeW, shapeH);
}

function operate(iFrom, iTo) {
    let numMove = Math.min(divs[iFrom].numOut, divs[iTo].numIn)
    
    divs[iTo].add(divs[iFrom].kindTop, numMove)
    divs[iFrom].remove(numMove)
    
    moveHistory.push(new Move(iFrom, iTo, numMove))
    
    drawShapes()
}

function reverse() {
    let i = moveHistory.length
    
    if(i > 0) {
        let move = moveHistory[i - 1]
        moveHistory.pop()
        
        divs[move.iFrom].add(divs[move.iTo].kindTop, move.num)
        divs[move.iTo].remove(move.num)
        
        drawShapes()
        drawBottle()
    }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function drawShapes() {
    layerShape.clearRect(0, 0, canvasW, canvasH);
    
    for(let i = 0; i < numDivs; i++) {
        for(let j = 0; j < divs[i].list.length; j++) {
            let kind = divs[i].list[j];
            drawIcon(layerShape, j * 32 + 10, i * 48 + 10, kind - 1)
        }
    }
}

function drawBottle() {
    for(let i = 0; i < numDivs; i++) {
        if(divs[i].isSorted) {
            layerMove.fillStyle = "rgb(240, 240, 0)"
        }
        else if(i == selectedDiv) {
            layerMove.fillStyle = "rgb(240, 0, 0)"
        }
        else {
            layerMove.fillStyle = "rgb(240, 240, 240)"
        }
        layerMove.beginPath();
        layerMove.fillRect(7, i * 48 + 7, 32 * divCapacity + 5, 35);
    }
}

