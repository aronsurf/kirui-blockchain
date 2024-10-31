import React, { useState, useEffect, useCallback, useMemo } from "react";
import logo from './logo.svg';
import './App.css';
import Web3 from "web3";

// Contract address and ABI
const ADDRESS = "0x13cBD6f417771ba49Ca3345A0a96bAeF342FF6cb";
const ABI = [
    {
        "inputs": [],
        "name": "getNumber",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "newMessage", "type": "string"}],
        "name": "setMessage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "message",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "increaseNumber",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decreaseNumber",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

function App() {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [number, setNumber] = useState("none");
    const [message, setMessage] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [initialNumber, setInitialNumber] = useState("");
    const [requestPending, setRequestPending] = useState(false); // Track if a request is pending

    // Initialize Web3 and set account
    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);
                try {
                    if (!requestPending) { // Only request if no pending requests
                        setRequestPending(true); // Set request pending
                        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                        setAccount(accounts[0]);
                        
                        // Listen for account changes
                        window.ethereum.on("accountsChanged", (accounts) => setAccount(accounts[0]));
                    } else {
                        alert("Please complete the pending MetaMask request.");
                    }
                } catch (error) {
                    if (error.code === -32002) {
                        alert("You have a pending request. Please check MetaMask.");
                    } else {
                        console.error("Error fetching accounts:", error);
                    }
                } finally {
                    setRequestPending(false); // Reset pending state
                }
            } else {
                alert("Please install MetaMask!");
            }
        };
        initWeb3();
    }, [requestPending]);

    // Memoize the contract instance
    const myContract = useMemo(() => {
        if (web3) {
            return new web3.eth.Contract(ABI, ADDRESS);
        }
        return null;
    }, [web3]);

    // Fetch number from the contract
    const getNumber = useCallback(async () => {
        if (!myContract) return;
        try {
            const result = await myContract.methods.getNumber().call();
            setNumber(result.toString());
        } catch (error) {
            console.error("Error fetching number:", error);
        }
    }, [myContract]);

    // Fetch message from the contract
    const getMessage = useCallback(async () => {
        if (!myContract) return;
        try {
            const result = await myContract.methods.message().call();
            setMessage(result);
        } catch (error) {
            console.error("Error fetching message:", error);
        }
    }, [myContract]);

    // Set initial number by calling setMessage and increaseNumber
    const handleSetInitialNumber = async () => {
        if (!myContract || !account || isNaN(initialNumber)) {
            alert("Please enter a valid number and connect your account.");
            return;
        }
        try {
            await myContract.methods.setMessage("Initial Number Set").send({ from: account });
            await myContract.methods.increaseNumber().send({ from: account });
            setInitialNumber('');
            await getNumber();
            await getMessage();
        } catch (error) {
            console.error("Error setting initial number:", error);
        }
    };

    // Increase number
    const increaseNumber = async () => {
        if (!myContract || !account) return;
        try {
            await myContract.methods.increaseNumber().send({ from: account });
            await getNumber();
        } catch (error) {
            console.error("Error increasing number:", error);
        }
    };

    // Decrease number
    const decreaseNumber = async () => {
        if (!myContract || !account) return;
        try {
            await myContract.methods.decreaseNumber().send({ from: account });
            await getNumber();
        } catch (error) {
            console.error("Error decreasing number:", error);
        }
    };

    // Update message in the contract
    const updateMessage = async () => {
        if (!myContract || !account || !newMessage) return;
        try {
            await myContract.methods.setMessage(newMessage).send({ from: account });
            setNewMessage('');
            await getMessage();
        } catch (error) {
            console.error("Error updating message:", error);
        }
    };

    // Fetch initial number and message on component mount
    useEffect(() => {
        getNumber();
        getMessage();
    }, [getNumber, getMessage]);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <h2>Decentralized Counter App</h2>
                <div>
                    <button onClick={getNumber}>Get Number</button>
                    <p>Number: {number}</p>
                </div>
                <div>
                    <button onClick={getMessage}>Get Message</button>
                    <p>Message: {message}</p>
                </div>
                <input
                    type="number"
                    value={initialNumber}
                    onChange={(e) => setInitialNumber(e.target.value)}
                    placeholder="Enter initial number"
                />
                <button onClick={handleSetInitialNumber}>Set Initial Number</button>
                <button onClick={increaseNumber}>Increase Number</button>
                <button onClick={decreaseNumber}>Decrease Number</button>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter new message"
                />
                <button onClick={updateMessage}>Update Message</button>
            </header>
        </div>
    );
}

export default App;
