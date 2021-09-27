const concurrent = require("./concurrent")

const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const logger = require('../base/logger')
const NumberUtils = require('../base/NumberUtils')

const {rarityEth} = require('./RarityEthereumManager')
const {loadAccounts} = require('./AccountsLoader')

const Rarity = require('./contracts/Rarity')
const RarityGold = require('./contracts/RarityGold')
const RarityCraftingMaterials = require('./contracts/RarityCraftingMaterials')
const RarityAttributes = require('./contracts/RarityAttributes')
const RarityMulti = require('./contracts/RarityMulti')
const RaritySkills = require('./contracts/RaritySkills')
const mapLimit = require('async/mapLimit')

const rarity = new Rarity()
const gold = new RarityGold()
const craftingMaterials = new RarityCraftingMaterials()
const attributes = new RarityAttributes()
const rarityMulti = new RarityMulti()
const raritySkills = new RaritySkills()
const multiNum = 100
const craftingAddress = "0xb6705346755436767cAe9C84124a802F8677E1E7"
const controlHero = 1306172

const craftingBaseTypeList  = [3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  2,   2,  2,  2,  2,  2,  2,  1]
const craftingItemTypeList  = [59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 12,  18, 17, 16, 15, 14, 13, 22]
const craftingMaterailsList = [200,200,200,200,200,200,200,200,200,200,200,200,180, 140,120,120,110,110,110,100]
const craftingGoldCostList  = [250,400,100,90, 25, 60, 30, 35, 3,  1,  2,  2,  1500,30, 20, 7,  9,  3,  15,1000]

async function craftingMulti(AddressHeros, expectedCraftingId, multiNumber) {
    logger.info('crafting start')
    let param = {
        done: false
    }
    const preExecFunc = async function (item, callback) {
        let hero = item
        try {
            let attributeValue = await attributes.ability_scores(hero)
            if (attributeValue.intelligence == 22) {
                let {_xp, _log, _class, _level} = await rarity.summoner(hero)
                if (_xp > 0) {
                    let _skills = await raritySkills.get_skills(hero)
                    // logger.info(_skills)
                    if (_skills[5] == 4 ) {
                        const reward = await craftingMaterials.balanceOf(hero)

                        let heroGold = await gold.balanceOf(hero) / 1000000000000000000
                        _xp = _xp / 1000000000000000000
                        let craft_count = _xp / 250
                        logger.info(`summon: ${hero}， xp: ${_xp}, class:${_class}, level:${_level}, reward:${reward}, attribute:${attributeValue.intelligence}, gold:${heroGold}`)
                        return {hero, craft_count, reward, heroGold}
                    }

                }

            }

        } catch (e) {
            logger.error(e)
        }
    }
    const execFunc = async function (address, dataList) {
        if (address == craftingAddress) {
            logger.info(`address: ${address} dataList: ${JSON.stringify(dataList)}`)
            const dataList
            for (;;) {
                try {
                    let num = await rarityCrafting.next_item()
                    logger.info(`crafting number: ${num}`)
                    if (num < expectedCraftingId - 20) {
                        await sleep(1000)
                    }
                    if (num >= expectedCraftingId - multiNumber + 1) {
                        break
                    }
                } catch (e) {
                    logger.error(e)
                }

            }
        }
    }
    await concurrent.concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum)
    await concurrent.wailtUntilDone(param)
    logger.info('crafting end')
}

async function startCrafting(expectedId, multiNumber) {
    const AddressHeros = await loadAccounts()
    await craftingMulti(AddressHeros, expectedId, multiNumber)
}


module.exports = {
    startCrafting,
}