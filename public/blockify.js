// for every pre tag with class blockie replace it with a generated blockie and label

let preblockies = document.querySelectorAll('pre.blockie');
let walletDiv = document.getElementById('wallets');

for (let preblockie of preblockies) {
    let blockie = document.createElement('div');
    let address = preblockie.innerHTML;
    let canvas = blockies.create({ seed: address, scale: 10 });
    walletDiv.replaceChild(blockie, preblockie);
    let label = document.createElement('p');
    label.innerHTML = address;
    blockie.appendChild(canvas);
    blockie.appendChild(label);
}