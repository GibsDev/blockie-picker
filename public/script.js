let clearButton = document.getElementById('clear');
let startButton = document.getElementById('start');
let stopButton = document.getElementById('stop');
let saveButton = document.getElementById('save');
let walletHolder = document.getElementById('walletholder');
let walletViewer = document.getElementById('walletviewer');
let limitInput = document.getElementById('limit');
let containsInput = document.getElementById('contains');
let startsWithInput = document.getElementById('startswith');

// Holds the wallet object of the currently selected wallet
var currentWallet = null;

// Disable start button until server is ready
startButton.disabled = true;

// Connect to WebSocket
var socket = io('localhost:3000');

// Say hello to the server
socket.on('connect', () => {
    socket.send('Hello from the browser!');
});

// When the server sends a wallet message
socket.on('wallet', wallet => {
    // Append a wallet for the address
    walletHolder.appendChild(domWallet(wallet));
});

// Enable the start button when the server is ready
socket.on('ready', () => {
    startButton.disabled = false;
});

saveButton.disabled = true;

// Selects a wallet
function walletClicked(node, wallet) {
    clearSelectedWallet();
    node.className = 'selected';
    console.log(wallet);
    currentWallet = wallet;
    walletViewer.innerHTML = JSON.stringify(currentWallet, null, 4);
    saveButton.disabled = false;
}

// Clears the currently selected wallet
function clearSelectedWallet() {
    currentWallet = null;
    saveButton.disable = true;
    for (let node of document.querySelectorAll('canvas.selected')) {
        node.className = '';
    }
}

// Create a DOM node (a 'canvas' node generated by blockies) for a wallet object
function domWallet(wallet) {
    let node = createIcon({ seed: wallet.address, scale: 10 });
    node.id = wallet.address;
    node.addEventListener('click', () => {
        walletClicked(node, wallet);
    });
    return node;
}

// Linking JS to buttons
clearButton.addEventListener('click', () => {
    walletHolder.innerHTML = '';
    walletViewer.innerHTML = '';
})
startButton.addEventListener('click', () => {
    let params = {};
    params.limit = 20;
    if (limitInput.value) {
        params.limit = limitInput.value;
    }
    if (containsInput.value) {
        params.contains = containsInput.value;
    }
    if (startsWithInput.value) {
        params.startsWith = startsWithInput.value;
    }
    startButton.disabled = true;
    socket.emit('start', params);
});
stopButton.addEventListener('click', () => {
    socket.emit('stop');
});
saveButton.addEventListener('click', () => {
    if (currentWallet) {
        socket.emit('save', currentWallet);
        clearSelectedWallet();
    }
});

// Show the script is properly loaded in browser
console.log('Hello from script');
