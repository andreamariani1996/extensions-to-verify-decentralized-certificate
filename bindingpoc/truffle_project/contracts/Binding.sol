// SPDX-License-Identifier: GPL-3.0

pragma  solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./ECDSA.sol";

contract Binding {

    using ECDSA for bytes32;

        struct Request {
            string endpoint;
            string pubKey;
            uint value;
            uint bNumber;
        }

    mapping(address => mapping(bytes32 => Request)) public requestMap;


    event NewRequest(
        string endpoint,
        string pubKey,
        bytes32 R
    );



    function newRequest(string memory _endpoint, string memory _pubKey ) public payable{
        bytes32 R = keccak256(abi.encodePacked(_pubKey, _endpoint, block.number));
        requestMap[msg.sender][R] = Request(_endpoint,_pubKey,msg.value, block.number);
        emit NewRequest(_endpoint,_pubKey,R);
    }




    function payCommittee(bytes32 requestBlockhash, bytes32 R, bytes[] memory _QCs, bytes[] memory _Signatures) public {
        
        Request memory req = requestMap[msg.sender][R];
        bytes32 req_bh = blockhash(req.bNumber);
        require(requestBlockhash == req_bh);
        
        uint totValue = requestMap[msg.sender][R].value;
        require(totValue > 0);
        uint pay = totValue / _Signatures.length;
        requestMap[msg.sender][R].value = 0;

        for (uint i = 0; i < _Signatures.length; i++){
            bytes32 hash = keccak256(abi.encodePacked(_QCs[i],R));
            bytes32 messageHash = hash.toEthSignedMessageHash();
            address _com = messageHash.recover(_Signatures[i]);
            payable(_com).transfer(pay);
        }

    }

}