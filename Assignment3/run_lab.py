"""Compile the assignment contracts and run reproducible, local EVM labs.
No public-network transactions or private keys are used by this script.
"""
from pathlib import Path
import json, datetime, subprocess
import solcx
from web3 import Web3, EthereumTesterProvider
from eth_tester import EthereumTester, PyEVMBackend
from eth.vm.forks.prague import PragueVM
from eth.vm.forks.istanbul import IstanbulVM

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'artifacts'
OUT.mkdir(exist_ok=True)

def compile_contract(filename, version, optimize=False, evm=None):
    if version not in [str(v) for v in solcx.get_installed_solc_versions()]:
        solcx.install_solc(version)
    settings = {'optimizer': {'enabled': optimize, 'runs': 200},
                'outputSelection': {'*': {'*': ['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}
    if evm: settings['evmVersion'] = evm
    result = solcx.compile_standard({'language':'Solidity', 'sources': {filename:{'content':(ROOT/filename).read_text()}},
                                     'settings':settings}, solc_version=version)
    (OUT/(filename+'.compile.json')).write_text(json.dumps(result,indent=2))
    return result['contracts'][filename]

def deploy(w3, artifact, args=()):
    c=w3.eth.contract(abi=artifact['abi'],bytecode=artifact['evm']['bytecode']['object'])
    tx=c.constructor(*args).transact({'from':w3.eth.accounts[0], 'gas':5000000, 'gasPrice':10**9})
    r=w3.eth.wait_for_transaction_receipt(tx)
    assert r.status==1
    return w3.eth.contract(address=r.contractAddress, abi=artifact['abi']),r

def receipt(r):
    return {k:(v.hex() if isinstance(v,bytes) else v) for k,v in dict(r).items() if k not in ['logs','logsBloom']}

storage=compile_contract('StorageTest.sol','0.5.1')['StorageTest']
hello=compile_contract('HelloWorld.sol','0.8.28',True,'cancun')['HelloWorld']
tx_interface=compile_contract('HelloWorldTx.sol','0.8.28',True,'cancun')['HelloWorldTx']
(OUT/'HelloWorldTx.abi').write_text(json.dumps(tx_interface['abi'],indent=2))
danger=compile_contract('Dangerous.sol','0.4.24')['Dangerous']
attack=compile_contract('ReentrancyAttack.sol','0.4.24')['ReentrancyAttack']
safe=compile_contract('SafeVault.sol','0.4.24')['SafeVault']
solc_bin=solcx.install.get_executable('0.8.28')
cmd=[str(solc_bin),'--optimize','--optimize-runs','200','--evm-version','cancun','--abi','--bin','--bin-runtime',
     '--overwrite','-o',str(OUT),str(ROOT/'HelloWorld.sol')]
proc=subprocess.run(cmd,capture_output=True,text=True,check=True)
(OUT/'hello_compile_command.txt').write_text(' '.join(cmd)+'\n'+proc.stdout+proc.stderr)

payload=[bytes([i])+bytes(31) for i in range(1,33)]
(ROOT/'put_input.json').write_text(json.dumps(['0x'+x.hex() for x in payload],indent=2))
report={'timestamp':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),
        'environment':'eth-tester with PyEVMBackend; local simulation, not Remix or Sepolia',
        'storage_compiler':'0.5.1, optimizer disabled', 'hello_compiler':'0.8.28, optimizer enabled, 200 runs, Cancun target',
        'storage':{}}
for name,vm in [('Prague',PragueVM),('Istanbul',IstanbulVM)]:
    w3=Web3(EthereumTesterProvider(EthereumTester(backend=PyEVMBackend(vm_configuration=((0,vm),)))))
    c,dr=deploy(w3,storage)
    tx=c.functions.put(payload).transact({'from':w3.eth.accounts[0],'gas':3000000,'gasPrice':10**9})
    r=w3.eth.wait_for_transaction_receipt(tx)
    assert r.status==1
    assert int.from_bytes(w3.eth.get_storage_at(c.address,0),'big')==32
    base=int.from_bytes(Web3.keccak(bytes(32)),'big')
    assert all(bytes(w3.eth.get_storage_at(c.address,base+i))==payload[i] for i in range(32))
    calldata=bytes.fromhex(c.functions.put(payload)._encode_transaction_data()[2:])
    intrinsic=21000+sum(4 if b==0 else 16 for b in calldata)
    tx2=c.functions.put(payload).transact({'from':w3.eth.accounts[0],'gas':3000000,'gasPrice':10**9})
    r2=w3.eth.wait_for_transaction_receipt(tx2)
    report['storage'][name]={'deployment':receipt(dr),'first_put':receipt(r),'second_identical_put':receipt(r2),
                             'calldata_bytes':len(calldata),'calldata_nonzero_bytes':sum(b!=0 for b in calldata),
                             'intrinsic_gas':intrinsic,'execution_gas':r.gasUsed-intrinsic,
                             'verified_payload_bytes':32*32,'verified_length_slot':32}

w3=Web3(EthereumTesterProvider(EthereumTester(backend=PyEVMBackend(vm_configuration=((0,PragueVM),)))))
h,hr=deploy(w3,hello)
assert h.functions.hello().call()=='Hello, world!'
htx=w3.eth.send_transaction({'from':w3.eth.accounts[0],'to':h.address,'data':h.functions.hello()._encode_transaction_data(),
                            'gas':100000,'gasPrice':10**9})
htr=w3.eth.wait_for_transaction_receipt(htx)
assert htr.status==1
report['hello']={'deployment':receipt(hr),'transaction_call':receipt(htr),'eth_call_result':h.functions.hello().call(),
                 'raw_return_data':w3.eth.call({'to':h.address,'data':h.functions.hello()._encode_transaction_data()}).hex(),
                 'creation_bytes':len(hello['evm']['bytecode']['object'])//2,
                 'runtime_bytes':len(hello['evm']['deployedBytecode']['object'])//2}

for kind,art in [('vulnerable',danger),('patched',safe)]:
    target,_=deploy(w3,art)
    a,_=deploy(w3,attack,(target.address,))
    fund=w3.eth.wait_for_transaction_receipt(target.functions.depositMoney().transact(
        {'from':w3.eth.accounts[1],'value':w3.to_wei(5.5,'ether'),'gas':150000,'gasPrice':10**9}))
    assert fund.status==1
    before=w3.eth.get_balance(w3.eth.accounts[0])
    tx=a.functions.attack().transact({'from':w3.eth.accounts[0],'value':w3.to_wei(1,'ether'),
                                     'gas':3000000,'gasPrice':10**9})
    r=w3.eth.wait_for_transaction_receipt(tx)
    after=w3.eth.get_balance(w3.eth.accounts[0])
    target_after=w3.eth.get_balance(target.address)
    owner_net=after-before+r.gasUsed*10**9
    if kind=='vulnerable':
        assert r.status==1 and target_after==0
        assert owner_net==w3.to_wei(5.5,'ether')
    else:
        assert r.status==0 and target_after==w3.to_wei(5.5,'ether')
        normal=w3.eth.wait_for_transaction_receipt(target.functions.withdraw(w3.to_wei(0.5,'ether')).transact(
            {'from':w3.eth.accounts[1],'gas':200000,'gasPrice':10**9}))
        assert normal.status==1
        assert w3.eth.get_balance(target.address)==w3.to_wei(5,'ether')
    report[kind]={'attack_receipt':receipt(r),'target_balance_after_attack_wei':target_after,
                 'owner_net_gain_excluding_gas_wei':owner_net,'attacker_contract_remaining_wei':w3.eth.get_balance(a.address)}
report['checks']='PASS: payload length and all 32 storage words, Hello World call and transaction, complete local drain including fractional remainder, patched attack rollback and legitimate withdrawal'
(OUT/'lab_results.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
