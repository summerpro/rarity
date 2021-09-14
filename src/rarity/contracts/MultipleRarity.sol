// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;


interface rarity {
    function summon(uint _class) external;

    function adventure(uint _summoner) external;

    function spend_xp(uint _summoner, uint _xp) external;

    function level_up(uint _summoner) external;

    function xp(uint _summoner) external pure returns (uint);

    function level(uint _summoner) external pure returns (uint);

    function xp_required(uint curent_level) external pure returns (uint);

    function adventurers_log(uint _summoner) external pure returns (uint);

    function ownerOf(uint) external view returns (address);

    function getApproved(uint) external view returns (address);

    function isApprovedForAll(address owner, address operator) external pure returns (bool) ;

    function approve(address to, uint256 tokenId) external;
}

interface rarity_gold {
    function claim(uint summoner) external;

    function claimed(uint summoner) external pure returns (uint);

    function transfer(uint from, uint to, uint amount) external returns (bool);
}

interface rarity_crafting_materials {
    function adventure(uint _summoner) external returns (uint);

    function adventurers_log (uint _summoner) external pure returns (uint);

    function transfer(uint from, uint to, uint amount) external returns (bool);
}

interface rarity_attributes {
    function point_buy(uint _summoner, uint32 _str, uint32 _dex, uint32 _const, uint32 _int, uint32 _wis, uint32 _cha) external;
}

interface rarity_crafting {
    function craft(uint _summoner, uint8 _base_type, uint8 _item_type, uint _crafting_materials) external;
}

interface rarity_skills {
    function set_skills(uint _summoner, uint8[36] memory _skills) external;
}

contract MultipleRarity {
    event Test1(address indexed user);
    event Test2(address indexed user);
    rarity constant _rarity = rarity(0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb);

    rarity_gold constant _rarity_gold = rarity_gold(0x2069B76Afe6b734Fb65D1d099E7ec64ee9CC76B2);

    rarity_crafting_materials constant _rarity_crafting_materials = rarity_crafting_materials(0x2A0F1cB17680161cF255348dDFDeE94ea8Ca196A);

    rarity_attributes constant _rarity_attributes = rarity_attributes(0xB5F5AF1087A8DA62A23b08C00C6ec9af21F397a1);

    rarity_crafting constant _rarity_crafting = rarity_crafting(0xf41270836dF4Db1D28F7fd0935270e3A603e78cC);

    rarity_skills constant _rarity_skills = rarity_skills(0x51C0B29A1d84611373BA301706c6B4b72283C80F);

    address payable  owner;

    constructor() { owner = payable(msg.sender); }

    function multiple_transfer_gold(uint[] calldata _summoners, uint256 to, uint[] calldata _amounts) external {
        require(_summoners.length == _amounts.length);
        for (uint256 i = 0; i < _summoners.length; i++) {
            if(_isOwner(_summoners[i])) {
                _rarity_gold.transfer(_summoners[i], to, _amounts[i]);
            }
        }
    }
    function multiple_transfer_materials(uint[] calldata _summoners, uint256 to, uint[] calldata _amounts) external {
        require(_summoners.length == _amounts.length);
        for (uint256 i = 0; i < _summoners.length; i++) {
            if(_isOwner(_summoners[i])) {
                _rarity_crafting_materials.transfer(_summoners[i], to, _amounts[i]);
            }
        }
    }

    function multiple_point_buy(uint256[] calldata _summoners, uint32 _str, uint32 _dex, uint32 _const, uint32 _int, uint32 _wis, uint32 _cha) external {
        for (uint256 i = 0; i < _summoners.length; i++) {
            if(_isOwner(_summoners[i])) {
                _rarity_attributes.point_buy(_summoners[i], _str, _dex, _const, _int, _wis, _cha);
            }
        }
    }

    function multiple_set_skills(uint256[] calldata _summoners, uint8[36] calldata _skills) external {
        for (uint256 i = 0; i < _summoners.length; i++) {
            if(_isOwner(_summoners[i])) {
                _rarity_skills.set_skills(_summoners[i], _skills);
            }
        }
    }


    function multiple_adventure(uint[] calldata _summoners) external {
        for (uint256 i = 0; i < _summoners.length; i++) {
            if (_isApprovedForAll(_summoners[i])) {
                _rarity.adventure(_summoners[i]);
            }
        }
    }

    function multiple_level_up(uint[] calldata _summoners) external {
        for (uint256 i = 0; i < _summoners.length; i++) {
            if (_isApprovedForAll(_summoners[i])) {
                _rarity.level_up(_summoners[i]);
            }
        }
    }

    function multiple_claim_gold(uint[] calldata _summoners) external {
        for (uint256 i = 0; i < _summoners.length; i++) {
            if (_isApprovedForAll(_summoners[i])) {
                _rarity_gold.claim(_summoners[i]);
            }
        }
    }

    function multiple_adventure_crafting_materials(uint[] calldata _summoners) external {
        for (uint256 i = 0; i < _summoners.length; i++) {
            if (_isApprovedForAll(_summoners[i])) {
                _rarity_crafting_materials.adventure(_summoners[i]);
            }
        }
    }

    function multiple_approve(uint[] calldata _summoners) external {
        for (uint256 i = 0; i < _summoners.length; i++) {
            _rarity.approve(address(this), _summoners[i]);
        }
    }

    function destroy() external {
        require(msg.sender == owner, "Only owner can call this function.");
        selfdestruct(owner);
    }

    function _isOwner(uint _summoner) internal view returns (bool) {
        return (_rarity.ownerOf(_summoner) == msg.sender);
    }

    function _isApproved(uint _summoner) internal view returns (bool) {
        return (_rarity.getApproved(_summoner) == address(this));
    }

    function _isApprovedForAll(uint _summoner) internal view virtual returns (bool) {
        return (_rarity.getApproved(_summoner) == address(this) || _rarity.isApprovedForAll(_rarity.ownerOf(_summoner), address(this)));
    }

}
