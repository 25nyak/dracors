// web3.js

let web3;
let contract;
let usdcContract;
let accounts;
const contractAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const usdcTokenAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // USDC contract address on Polygon mainnet

const abi = [ /* ABI from earlier, truncated for brevity */ ];

async function connectWallet() {
    if (window.ethereum) {
        try {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            console.log(`Connected to wallet: ${accounts[0]}`);

            contract = new web3.eth.Contract(abi, contractAddress);
            usdcContract = new web3.eth.Contract([
                {
                    "constant": true,
                    "inputs": [{"name": "owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "balance", "type": "uint256"}],
                    "type": "function"
                }
            ], usdcTokenAddress);

            await loadBalances();
            return accounts[0]; // Return the connected account
        } catch (error) {
            console.error('User denied account access', error);
            throw error;
        }
    } else {
        alert('Please install MetaMask!');
        throw new Error('MetaMask not installed');
    }
}

async function loadBalances() {
    try {
        const usdcBalance = await usdcContract.methods.balanceOf(accounts[0]).call();
        document.getElementById('usdc-balance').innerText = (usdcBalance / (10 ** 6)) + ' USDC';

        const stakedBalance = await contract.methods.getBalance(accounts[0]).call();
        document.getElementById('staked-balance').innerText = (stakedBalance / (10 ** 6)) + ' USDC';

        const rewardBalance = await contract.methods.getRewardBalance(accounts[0]).call();
        document.getElementById('reward-balance').innerText = (rewardBalance / (10 ** 6)) + ' USDC';
    } catch (error) {
        console.error('Failed to load balances', error);
    }
}

async function stakeTokens(amount) {
    try {
        const amountInWei = web3.utils.toWei(amount, 'mwei');
        await usdcContract.methods.approve(contractAddress, amountInWei).send({ from: accounts[0] });
        await contract.methods.stake(amountInWei).send({ from: accounts[0] });
        await loadBalances();
        return true;
    } catch (error) {
        console.error('Stake failed', error);
        return false;
    }
}

async function withdrawTokens(amount) {
    try {
        const amountInWei = web3.utils.toWei(amount, 'mwei');
        await contract.methods.withdraw(amountInWei).send({ from: accounts[0] });
        await loadBalances();
        return true;
    } catch (error) {
        console.error('Withdraw failed', error);
        return false;
    }
}

async function claimRewards() {
    try {
        await contract.methods.claimReward().send({ from: accounts[0] });
        await loadBalances();
        return true;
    } catch (error) {
        console.error('Claim failed', error);
        return false;
    }
}
