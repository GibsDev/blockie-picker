const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const fs = require('fs');

const { Worker } = require('worker_threads')

// ID counter for worker threads
let id = 0;

// Setup static file serve
app.use(express.static('public'));

// Serve client side script files from node modules
app.use('/scripts', express.static(__dirname + "/node_modules/socket.io/client-dist/"));

// Page for viewing wallets stored in the locker folder
app.get('/locker', (req, res) => {
    let page = '';
    page += fs.readFileSync(__dirname + '/header.html'.toString());
    // insert info for wallets from json
    let files = fs.readdirSync(__dirname + '/locker');
    //console.log(files);
    for (let file of files) {
        let wallet = JSON.parse(fs.readFileSync(__dirname + '/locker/' + file));
        page += '<pre class="blockie" style="display: none">' + wallet.address + '</pre>';
    }
    page += fs.readFileSync(__dirname + '/footer.html'.toString());
    res.send(page.toString());
});

// WebSockets
io.on('connection', socket => {
    let worker = null;

    console.log('Client connected');
    // Start the worker thread
    socket.on('start', data => {
        console.log('Starting wallet generator with data: ', data);
        data.id = id++;
        worker = runGenerator(socket, data);
    });
    // Save the wallet to the locker
    socket.on('save', wallet => {
        console.log('saving: ', wallet);
        fs.writeFileSync(__dirname + '/locker/' + wallet.address + '.json', JSON.stringify(wallet, null, 4));
    });
    // Relay and general messages from client
    socket.on('message', data => {
        console.log('Client said: ' + data);
    });
    // Kill the worker if a stop is requested
    socket.on('stop', () => {
        if (worker) {
            worker.terminate();
        }
        console.log('Client cancelled work');
        socket.emit('ready');
    });
    // Kill the worker if there is a disconnect
    socket.on('disconnect', () => {
        if (worker) {
            worker.terminate();
        }
        console.log('Client disconnected');
    });
    // Tell the client we can begin work
    socket.emit('ready');
});

server.listen(3000);

// Spawn a new wallet generator worker thread
function runGenerator(socket, data) {
    // Let the client know work has begun
    const worker = new Worker('./wallet-generator.js', { workerData: data });
    worker.on('online', () => {
        socket.emit('working');
    });
    // msg can be a wallet or the id of the worker thread when it finishes
    worker.on('message', msg => {
        if (Number.isInteger(msg)) {
            console.log('Worker ' + msg + ' finished.');
            // Tell the client we are ready for more work
            socket.emit('ready');
        } else {
            // Send the wallet to the client
            socket.emit('wallet', msg);
        }
    });
    worker.on('error', err => {
        console.log(err);
    });
    worker.on('exit', code => {
        if (code !== 0)
            new Error(`Worker ${data.id} stopped with exit code ${code}`);
    });
    return worker;
}