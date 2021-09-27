/**
 * https://ftmscan.com/address/0x0762CEd32f9Ce787FdaB50702D38e60e3403c505#code
 * https://github.com/andrecronje/rarity
 */
const ContractManager = require("../../base/ContractManager")
const { rarityEth } = require("../RarityEthereumManager")

class RarityMulti extends ContractManager {

    static CONTRACT_ADDRESS = '0xb337B521d6014596cF67046B80E8322eaEbA5F72'
    // new 0x8EBCECfC15Cb771F17Ab02D0D4615D9d144952bA
    // old 0xfe2C0fcffF21D10fb3E4DBA672C00b91c0e9D90C
    static ABI = require('./abi_rarity_multi.json')

    constructor() {
        super(rarityEth, RarityMulti.CONTRACT_ADDRESS, RarityMulti.ABI)
    }

    multiple_adventure(account, heroList) {
        return this.write('multiple_adventure(uint256[])', [heroList], account)
    }

    multiple_adventure_crafting_materials(account, heroList) {
        return this.write('multiple_adventure_crafting_materials(uint256[])', [heroList], account)
    }

    multiple_level_up(account, heroList) {
        return this.write('multiple_level_up(uint256[])', [heroList], account)
    }

    multiple_claim_gold(account, heroList) {
        return this.write('multiple_claim_gold(uint256[])', [heroList], account)
    }

    multiple_transfer_materials(account, heroList, to, amountList) {
        return this.write('multiple_transfer_materials(uint256[],uint256,uint256[])', [heroList, to, amountList], account)
    }

    multiple_transfer_gold(account, heroList, to, amountList) {
        return this.write('multiple_transfer_gold(uint256[],uint256,uint256[])', [heroList, to, amountList], account)
    }

    multiple_distribute_materials(account, from, heroList, amountList) {
        return this.write('multiple_distribute_materials(uint256,uint256[],uint256[])', [from, heroList, amountList], account)
    }

    multiple_distribute_gold(account, from, heroList, amountList) {
        return this.write('multiple_distribute_gold(uint256,uint256[],uint256[])', [from, heroList, amountList], account)
    }

    multiple_approve_materials_and_gold(account, from) {
        return this.write('multiple_approve_materials_and_gold(uint256[])', [from], account)
    }

    multiple_approve(account, heroList) {
        return this.write('multiple_approve(uint256[])', [heroList], account)
    }

    multi_crafting(account, _summoners, _base_type, _item_type, _crafting_materials) {
        return this.write('multi_crafting(uint256[],uint256[],uint256[],uint256[])', [_summoners, _base_type, _item_type, _crafting_materials], account)
    }

    multiple_set_skills(account, heroList, skills) {
        return this.write('multiple_set_skills(uint256[],uint8[36])', [heroList, skills], account)
    }

    multiple_point_buy(account, heroList,  [_str, _dex, _const, _int, _wis, _cha]) {
        let params = [heroList, _str, _dex, _const, _int, _wis, _cha]
        return this.write('multiple_point_buy(uint256[],uint32,uint32,uint32,uint32,uint32,uint32)', params, account)
    }

}

module.exports = RarityMulti
