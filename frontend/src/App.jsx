import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import factoryAbi from './utils/factoryAbi.json';
import sessionAbi from './utils/sessionAbi.json';
import { FACTORY_ADDRESS } from './utils/constants';
import './App.css'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import VoteChainLogo from './assets/VoteChain_Logo.png';


function App() {
  const [account, setAccount] = useState(null);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // new election
  const [newName, setNewName] = useState("");
  const [maxVoters, setMaxVoters] = useState();
  const [candidateInput, setCandidateInput] = useState("");
  
  // Whitelisting
  const [whitelistAddr, setWhitelistAddr] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) {
        console.error("Wallet connection failed", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // check if user is the Factory Owner (Admin)
  const checkRole = async (userAddress) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
    

    const contractAdmin = await factory.owner();
    if (userAddress.toLowerCase() === contractAdmin.toLowerCase()) {
      console.log("Match Found! Setting isAdmin to true.");
      setIsAdmin(true);
    } else {
      console.log("No Match. Setting isAdmin to false.");
      setIsAdmin(false);
    }
  } catch (err) {
    console.error("Critical Error in checkRole:", err);
  }
};

  const createElection = async () => {
    if (!newName || !candidateInput) return alert("Fill in all fields");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, signer);
      
      const candidates = candidateInput.split(',').map(c => c.trim());
      const tx = await factory.createNewElection(newName, maxVoters, candidates);
      await tx.wait();
      
      alert("Election Deployed to Blockchain!");
      loadAllElections();
    } catch (err) {
      console.error(err);
      alert("Deployment failed.");
    } finally {
      setLoading(false);
    }
  };
  const loadAllElections= async() => {
    try {
      const provider= new ethers.BrowserProvider(window.ethereum);
      const factory= new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
      const addresses= await factory.getDeployedElections();

      const electionData= await Promise.all(addresses.map(async(addr) => {
        const session= new ethers.Contract(addr, sessionAbi, provider);

        const name= await session.electionName();
        const max= await session.maxVoters();
        const current= await session.totalVotesCast();
        const candidatesRaw= await session.getCandidates();
        const sessionAdmin= await session.admin();
        const isFinalized= await session.isFinalized();
        const winnerIdx= await session.winnerIndex();

        return{
          address: addr,name,
          admin: sessionAdmin, isFinalized,
          winnerIndex: winnerIdx.toString(),
          max: max.toString(),
          current: current.toString(),
          candidates: candidatesRaw.map(c=> ({name: c.name, votes: c.voteCount.toString()}))
        };
      }));
      setElections(electionData.reverse());
    } catch(err) {
      console.error("Error loading elections:", err);
    }
  };

  const authorizeVoter = async (sessionAddress) => {
    if (!ethers.isAddress(whitelistAddr)) return alert("Invalid Address");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const session = new ethers.Contract(sessionAddress, sessionAbi, signer);
      
      const tx = await session.authorizeVoter(whitelistAddr);
      await tx.wait();
      alert("Voter Whitelisted!");
      setWhitelistAddr("");
    } catch (err) {
      alert("Only the session admin can whitelist voters.", err);
    }
    setLoading(false);
  };

  const finalize= async(sessionAddress) => {
    setLoading(true);
    try{
      const provider= new ethers.BrowserProvider(window.ethereum);
      const signer= await provider.getSigner();
      const session= new ethers.Contract(sessionAddress, sessionAbi, signer);

      const tx= await session.finalizeElection();
      await tx.wait();
      loadAllElections();
    } catch(err) {
      console.error("Finalization failed", err);
    } finally{
      setLoading(false);
    }
  };

  const castVote = async (sessionAddress, candidateIndex) => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const session = new ethers.Contract(sessionAddress, sessionAbi, signer);
      
      const tx = await session.vote(candidateIndex);
      await tx.wait();
      alert("Vote Recorded!");
      loadAllElections();
    } catch (err) {
      alert(err.reason || "Voting failed. Are you whitelisted / already voted?");
    }
    setLoading(false);
  };
  
  useEffect(() => {
    if (account) {
      checkRole(account);
      loadAllElections();
    }
  }, [account]);
  

    return (
  <div data-bs-theme="dark" className="app-container">
    <nav className="navbar navbar-expand-lg navbar-dark glass-card mb-5 px-4 py-3">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center" href="#">
            <img 
              src={VoteChainLogo} 
              alt="VoteChain Logo" 
              className="d-inline-block align-top me-2" 
              style={{ height: "30px", width: "auto" }} 
            />
            <span className="logo-text">VoteChain</span>
          </a>
        
        <div className="ms-auto d-flex align-items-center">
          {!account ? (
            <button className="btn btn-hehe rounded-pill px-4 fw-bold shadow-sm" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : (
            <div className="d-flex align-items-center gap-3">
              <span className={`badge rounded-pill p-2 ${isAdmin ? 'bg-hehe text-dark' : 'bg-secondary'}`}>
                {isAdmin ? "\u2B50 Admin" : "Voter"}
              </span>
              <span className="text-light small opacity-75">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>

    <main className="container">
      {/* admin*/}
      {isAdmin && (
        <section className="admin-box glass-card mb-5 p-4 border-info border-opacity-25">
          <h2 className="h4 mb-4 head-text fw-bold">Start New Session</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <input className="form-control bg-dark text-white border-secondary" placeholder="Election Name" onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input className="form-control bg-dark text-white border-secondary" type="number" placeholder="Max Voters" onChange={e => setMaxVoters(e.target.value)} />
            </div>
            <div className="col-md-4">
              <input className="form-control bg-dark text-white border-secondary" placeholder="Candidates (A, B, C)" onChange={e => setCandidateInput(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-hehe w-100 fw-bold" onClick={createElection} disabled={loading}>
                {loading ? "..." : "Create NFT"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/*dashboard */}
      <section className="row g-4">
        {elections.map((elec, i) => (
          <div key={i} className="col-12 col-md-6 col-lg-4">
            <div className="glass-card h-100 d-flex flex-column p-4 border-white border-opacity-10">
              <h3 className="h5 head-text fw-bold mb-1">{elec.name}</h3>
              <div className="mb-3">
                <span className="badge bg-dark border border-secondary text-secondary fw-normal">
                  {elec.current} / {elec.max} Voted
                </span>
              </div>
              
              <div className="progress-container mb-4">
                <div className="progress-bar" style={{ width: `${(elec.current / elec.max) * 100}%` }}></div>
              </div>

              <div className="candidate-list mt-auto">
                {elec.isFinalized ? (
                  <div className="winner-box text-center p-4 rounded glass-card border-hehe">
                    <div className="badge btn btn-hehe text-dark mb-2">Election Finalized</div>
                    <h4 className="text-white fw-bold mb-1">🏆 {elec.candidates[elec.winnerIndex].name}</h4>
                    <p className="text-secondary small mb-4">Winner Certified on Chain</p>
                    <div className="d-grid gap-2">
                      <a 
                      href={`https://sepolia.basescan.org/address/${elec.address}`} 
                      target="_blank" 
                      rel="noreferrer"className="btn btn-outline-hehe btn-sm fw-bold"
                      >
                        View Certification NFT ↗
                        </a>
                        </div>
                        </div>
) : (
                  <>
                    {elec.candidates.map((cand, idx) => (
                      <div key={idx} className="d-flex justify-content-between align-items-center mb-2 p-2 rounded bg-black bg-opacity-25 border border-white border-opacity-10">
                        <span className="small">{cand.name} ({cand.votes})</span>
                        <button onClick={() => castVote(elec.address, idx)} disabled={loading} className="btn btn-sm btn-hehe py-0 px-3 fw-bold">
                          Vote
                        </button>
                      </div>
                    ))}
                    
                    {/* Only election admin sees Whitelist and Finalize */}
                    {account && account.toLowerCase() === elec.admin.toLowerCase() && (
                      <div data-bs-theme="dark" className="mt-3 border-top border-secondary pt-3">
                        <div className="input-group mb-2">
                          <input 
                            className="form-control form-control-sm bg-dark text-white border-secondary"
                            placeholder="Voter Address" 
                            value={whitelistAddr}
                            onChange={(e) => setWhitelistAddr(e.target.value)} 
                          />
                          <button className="btn btn-sm btn-outline-hehe " onClick={() => authorizeVoter(elec.address)}>Whitelist</button>
                        </div>
                        <button className='btn btn-outline-danger btn-sm w-100 fw-bold' onClick={() => finalize(elec.address)} disabled={loading}>
                          Finalize Election
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  </div>
);
}

export default App;