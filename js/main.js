/* */
'use strict'
var NUM_OF_TARGETS = 6;
var GAMER_START_POS = [{ i: 2, j: 2 }, { i: 3, j: 2 }];
var MAX_STEPS = 1000;
var BONUSES = ['clock', 'magnet', 'gold'];
var gBoard = [];
var gGamerPos;
var gGameState = {};
var gBonusesInterval = 10;
var gClockSteps = 0;
var gGameLevel = 0;

initGame();

function initGame() {
    gGameState = { cntBoxOnTarget: 0, cntSteps: 0, isGameOn: true, allowedSteps: MAX_STEPS, 
        level: gGameLevel, cntMagnets: 0 , magnetCell: null};
    var level = gGameState.level;
    gGamerPos = { i: GAMER_START_POS[level].i, j: GAMER_START_POS[level].j };
    gClockSteps = 100;
    gBoard = createBoard();
    renderBoard(gBoard);
    updateScore();
    updateMagnetCnt();
    clearInterval(gBonusesInterval);
    gBonusesInterval = setInterval(createBonus, 10000);
    document.addEventListener('keydown', keyDown);
}

function createBoard() {
    var board = [];
    if (gGameState.level === 1) {
        board = [
            ['', '', '', '', '', '', '', 'wall', 'wall', 'wall', 'wall', '', ''],
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'floor', 'floor', 'wall', '', ''],
            ['wall', 'floor', 'floor', 'box', 'floor', 'floor', 'floor', 'floor', 'target', 'target', 'wall', '', ''],
            ['wall', 'floor', 'floor', 'box', 'floor', 'box', 'floor', 'wall', 'target', 'target', 'wall', '', ''],
            ['wall', 'wall', 'wall', 'wall', 'wall', 'box', 'wall', 'wall', 'boxontarget', 'boxontarget', 'wall', '', ''],
            ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall', 'target', 'target', 'wall', 'wall', 'wall'],
            ['wall', 'floor', 'box', 'floor', 'floor', 'floor', 'floor', 'wall', 'target', 'target', 'floor', 'floor', 'wall'],
            ['wall', 'wall', 'box', 'wall', 'wall', 'wall', 'wall', 'wall', 'floor', 'floor', 'wall', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'box', 'floor', 'floor', 'wall', 'wall', 'wall', 'wall', 'floor', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'box', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
            ['wall', 'wall', 'wall', 'wall', 'wall', 'floor', 'floor', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
            ['', '', '', '', 'wall', 'wall', 'wall', 'wall', '', '', '', '', ''],

        ];
    } else if (gGameState.level === 0) {
        board = [
            ['', '', 'wall', 'wall', 'wall', 'wall', 'wall', '', ''],
            ['wall', 'wall', 'wall', 'floor', 'floor', 'floor', 'wall', ''],
            ['wall', 'target', 'floor', 'box', 'floor', 'floor', 'wall', ''],
            ['wall', 'wall', 'wall', 'floor', 'box', 'target', 'wall', ''],
            ['wall', 'target', 'wall', 'wall', 'box', 'floor', 'wall', ''],
            ['wall', 'floor', 'wall', 'floor', 'target', 'floor', 'wall', 'wall'],
            ['wall', 'box', 'floor', 'boxontarget', 'box', 'box', 'target', 'wall'],
            ['wall', 'floor', 'floor', 'floor', 'target', 'floor', 'floor', 'wall'],
            ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
        ];
    }

    return board;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[i].length; j++) {
            var className = board[i][j];
            var gamer = (gGamerPos.i === i && gGamerPos.j === j ? '🚶‍' : '');
            var strId = 'cell-' + i + '-' + j;
            strHTML += '<td onclick="cellClicked(this)" class = "' + className + '" id="' + strId + '"' +
                '>' + gamer + '</td>';
        }
        strHTML += '</tr>';
    }
    if (strHTML !== '') {
        var elBoard = document.querySelector('.board');
        elBoard.innerHTML = strHTML;
    }

}

function cellClicked(elCell){
    if (elCell.classList.contains('box') || elCell.classList.contains('boxontarget')){
        activateMagnet(elCell);
    }
}

function activateMagnet(elCell){
    if (gGameState.magnetCell && elCell === gGameState.magnetCell){
        elCell.innerHTML = '';
        gGameState.magnetCell = null;
        gGameState.cntMagnets++;
    } else if (gGameState.cntMagnets && gGameState.magnetCell === null) {
        elCell.innerHTML = '⚡';
        gGameState.magnetCell = elCell;
        gGameState.cntMagnets--;
    }
}


function keyDown(event) {
    if (gGameState.isGameOn) {
        // move magnet box
        if (gGameState.magnetCell){
            var magnetCoord = getCellCoord(gGameState.magnetCell.id);
            var coord = getNewPosition(event.code, magnetCoord.i, magnetCoord.j);
            if (coord.i && coord.j && 
                    (coord.i !== gGamerPos.i || coord.j !== gGamerPos.j) &&
                    canMove(event.code, coord.i, coord.j, false)){
                updateCells(event.code,gGameState.magnetCell,magnetCoord.i,magnetCoord.j);
                gGameState.magnetCell.innerHTML = '';
                gGameState.magnetCell = null;
                updateMagnetCnt();
            }
        } else {
            var coord = getNewPosition(event.code, gGamerPos.i, gGamerPos.j);
            if (coord.i && coord.j && canMove(event.code, coord.i, coord.j, true)) {
                var elCell = getCellByCoord(gGamerPos.i, gGamerPos.j);
                movePlayer(event.code, elCell, coord.i, coord.j);
                updateScore();
            }
        }
        setTimeout(checkGameOver, 10);
    }
}

function updateScore() {
    var elScore = document.querySelector('.score');
    elScore.innerHTML = gGameState.allowedSteps - gGameState.cntSteps;
    if (gClockSteps >= 10) {
        gGameState.cntSteps++;
    }
    gClockSteps++;
}

function updateMagnetCnt(){
    var elMagnetCnt = document.getElementById('magnetcnt');
    elMagnetCnt.innerHTML = gGameState.cntMagnets;
}

function movePlayer(code, elPrevCell, i, j) {
    var elCell = getCellByCoord(i, j);
    elCell.innerHTML = elPrevCell.innerHTML;
    elPrevCell.innerHTML = '';
    gGamerPos.i = i;
    gGamerPos.j = j;
    updateBonus(elCell);
    updateCells(code,elCell,i,j);
}

function updateCells(code,elCell,i,j){
    if (gBoard[i][j] === 'box' || gBoard[i][j] === 'boxontarget') {
        // set new cell to cell or target
        gBoard[i][j] = (gBoard[i][j] === 'box' ? 'floor' : 'target');
        elCell.classList.remove('box', 'boxontarget');
        elCell.classList.add(gBoard[i][j]);
        if (gBoard[i][j] === 'target') gGameState.cntBoxOnTarget--;
        // set next cell to box or boxontarget
        var coord = getNewPosition(code, i, j);
        gBoard[coord.i][coord.j] = (gBoard[coord.i][coord.j] === 'floor' ? 'box' : 'boxontarget');
        var newCell = getCellByCoord(coord.i, coord.j);
        newCell.classList.remove('floor', 'target');
        newCell.classList.add(gBoard[coord.i][coord.j]);
        if (gBoard[coord.i][coord.j] === 'boxontarget') gGameState.cntBoxOnTarget++;
    }
}

function changeLevel(value){
    gGameLevel = +value;
    initGame();
}

function updateBonus(elCell) {
    if (elCell.classList.contains('clock')) {
        gClockSteps = 0;
        elCell.classList.remove('clock');
    } else if (elCell.classList.contains('magnet')) {
        gGameState.cntMagnets++;
        updateMagnetCnt();
        elCell.classList.remove('magnet');
    } else if (elCell.classList.contains('gold')) {
        gGameState.allowedSteps += 100;
        elCell.classList.remove('gold');
    }

}

function getCellByCoord(i, j) {
    var elCell = document.querySelector(getSelector({ i: i, j: j }));
    return elCell;
}

function getSelector(coord) {
    return '#cell-' + coord.i + '-' + coord.j;
}

function getNewPosition(code, i, j) {
    var row;
    var col;
    switch (code) {
        case 'ArrowLeft':
            row = i;
            col = Math.max(0, j - 1);
            break;
        case 'ArrowUp':
            row = Math.max(i - 1, 0);
            col = j;
            break;
        case 'ArrowRight':
            row = i;
            col = Math.min(gBoard[i].length, j + 1);
            break;
        case 'ArrowDown':
            row = Math.min(gBoard.length, i + 1);
            col = j;
            break;
    }

    return { i: row, j: col };
}

function canMove(code, i, j, canIterate) {
    if (gBoard[i][j] === 'wall') return false;

    if (gBoard[i][j] === 'box' || gBoard[i][j] === 'boxontarget') {
        // avoid second iteration if 2 boxes
        if (canIterate && !isBonus) {
            var coord = getNewPosition(code, i, j);
            var newCell = getCellByCoord(coord.i,coord.j);
            var isBonus = newCell.classList.contains('magnet') || 
                                newCell.classList.contains('gold') ||
                                newCell.classList.contains('clock');
            return (!isBonus && canMove(code, coord.i, coord.j, false));
        } else {
            // two boxes
            return false;
        }
    } else {
        return true;
    }
}

function checkGameOver() {
    if (gGameState.cntBoxOnTarget === NUM_OF_TARGETS || gGameState.cntSteps > gGameState.allowedSteps) {
        document.removeEventListener('keydown', keyDown);
        gGameState.isGameOn = false;
        clearInterval(gBonusesInterval);
    }
    if (!gGameState.isGameOn)
        gameOver();
}

function gameOver() {
    alert('Game over');
}

function createBonus() {
    var elCells = document.querySelectorAll('.floor');

    // regenerate cell if coordination on player
    do {
        var randCell = getRandomIntInclusive(0, elCells.length -  1);
        var randBonus = getRandomIntInclusive(0, BONUSES.length - 1);
        var elCell = elCells[randCell];
        var coord = getCellCoord(elCell.id); }
    while (coord.i === gGamerPos.i && coord.j === gGamerPos.j);

    elCell.classList.add(BONUSES[randBonus]);
    setTimeout(removeBonus, 5000, elCell, BONUSES[randBonus]);
}

function removeBonus(elCell, bonus) {
    elCell.classList.remove(bonus);
}

// returns cell coordinations from cell id string
function getCellCoord(strCellId) {
    var coord = {};
    coord.i = +strCellId.substring(5, strCellId.lastIndexOf('-'));
    coord.j = +strCellId.substring(strCellId.lastIndexOf('-') + 1);
    return coord;
}