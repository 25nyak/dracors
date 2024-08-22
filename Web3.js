// app.js
const contractAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const usdcTokenAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // USDC contract address on Polygon mainnet

const abi = [
  // Your contract ABI goes here
  {
    "inputs": [{"internalType": "address", "name": "_usdcAddress", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "previousOwner", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "earned",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getRewardBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalStaked",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardPerTokenStored",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

let web3;
let accounts;
let contract;

window.addEventListener('load', async () => {
  if (typeof window.ethereum !== 'undefined') {
    web3 = new Web3(window.ethereum);
    try {
      accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      contract = new web3.eth.Contract(abi, contractAddress);
      document.getElementById('wallet-status').innerText = `Connected: ${accounts[0]}`;
      loadBalances();
    } catch (error) {
      console.error('User denied account access', error);
      document.getElementById('wallet-status').innerText = 'Connection Failed';
    }
  } else {
    console.warn('No web3 provider found');
    document.getElementById('wallet-status').innerText = 'No Web3 Provider Found';
  }

  document.getElementById('stake-btn').addEventListener('click', stakeTokens);
  document.getElementById('withdraw-btn').addEventListener('click', withdrawTokens);
  document.getElementById('claim-reward-btn').addEventListener('click', claimRewards);
});

async function loadBalances() {
  try {
    const usdcBalance = await getUSDCBalance(accounts[0]);
    const stakedBalance = await contract.methods.getBalance(accounts[0]).call();
    const rewardBalance = await contract.methods.getRewardBalance(accounts[0]).call();

    document.getElementById('usdc-balance').innerText = web3.utils.fromWei(usdcBalance, 'ether');
    document.getElementById('staked-balance').innerText = web3.utils.fromWei(stakedBalance, 'ether');
    document.getElementById('reward-balance').innerText = web3.utils.fromWei(rewardBalance, 'ether');
  } catch (error) {
    console.error('Error loading balances:', error);
  }
}

async function getUSDCBalance(address) {
  const usdcContract = new web3.eth.Contract([
    {
      "constant": true,
      "inputs": [{"name": "owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function"
    }
  ], usdcTokenAddress);

  return await usdcContract.methods.balanceOf(address).call();
}

async function stakeTokens() {
  const amount = document.getElementById('stake-amount').value;
  const amountInWei = web3.utils.toWei(amount, 'ether');

  try {
    // Approve the staking contract to spend the tokens
    const usdcContract = new web3.eth.Contract([
      {
        "constant": false,
        "inputs": [
          { "name": "spender", "type": "address" },
          { "name": "value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "success", "type": "bool" }],
        "type": "function"
      }
    ], usdcTokenAddress);

    await usdcContract.methods.approve(contractAddress, amountInWei).send({ from: accounts[0] });

    // Call the stake function on the contract
    const result = await contract.methods.stake(amountInWei).send({ from: accounts[0] });
    console.log('Transaction hash:', result.transactionHash);

    document.getElementById('stake-status').innerText = 'Staking successful!';
    loadBalances(); // Update the balances after staking
  } catch (error) {
    console.error('Staking failed:', error);
    document.getElementById('stake-status').innerText = 'Staking failed!';
  }
}

async function withdrawTokens() {
  const amount = document.getElementById('withdraw-amount').value;
  const amountInWei = web3.utils.toWei(amount, 'ether');

  try {
    // Call the withdraw function on the contract
    const result = await contract.methods.withdraw(amountInWei).send({ from: accounts[0] });
    console.log('Transaction hash:', result.transactionHash);

    document.getElementById('withdraw-status').innerText = 'Withdrawal successful!';
    loadBalances(); // Update the balances after withdrawal
  } catch (error) {
    console.error('Withdrawal failed:', error);
    document.getElementById('withdraw-status').innerText = 'Withdrawal failed!';
  }
}

async function claimRewards() {
  try {
    // Call the claimReward function on the contract
    const result = await contract.methods.claimReward().send({ from: accounts[0] });
    console.log('Transaction hash:', result.transactionHash);

    document.getElementById('claim-status').innerText = 'Rewards claimed successfully!';
    loadBalances(); // Update the balances after claiming rewards
  } catch (error) {
    console.error('Claiming rewards failed:', error);
    document.getElementById('claim-status').innerText = 'Claiming rewards failed!';
  }
}
