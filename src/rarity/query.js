const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const logger = require('../base/logger')
const NumberUtils = require('../base/NumberUtils')

const { rarityEth } = require('./RarityEthereumManager')
const { loadAccounts } = require('./AccountsLoader')

const Rarity = require('./contracts/Rarity')
const RarityGold = require('./contracts/RarityGold')
const RarityCraftingMaterials = require('./contracts/RarityCraftingMaterials')
const RarityAttributes = require('./contracts/RarityAttributes')
const RarityMulti = require('./contracts/RarityMulti')
const RarityCrafting = require('./contracts/RarityCrafting')

const rarity = new Rarity()
const gold = new RarityGold()
const craftI = new RarityCraftingMaterials()
const attributes = new RarityAttributes()
const rarityMulti = new RarityMulti()
const rarityCrafting = new RarityCrafting()
const multiNum = 100
const pointsLength = 1000000000000000000

async function queryCraftingNumber() {
    for (;;) {
        try {
            let num = await rarityCrafting.next_item()
            logger.info(`crafting number: ${num}`)
            if (num < 2600) {
                await sleep(1000)
            }
        } catch (e) {
            logger.error(e)
        }

    }

}

async function querySummon() {
    const AddressHeros = await loadAccounts()
    logger.info('multiApprove start')
    for (const { address, heros } of AddressHeros) {
        for (const hero of heros) {
            try {
                let {_xp, _log, _class, _level} = await rarity.summoner(hero)
                if(_level == 1 && _class != 1 && _class != 5 && _class != 7) {
                    let reward = await craftI.balanceOf(hero)
                    let attributeValue = await attributes.ability_scores(hero)
                    let heroGold = await gold.balanceOf(hero) / pointsLength
                    _xp = _xp / pointsLength
                    logger.info(`addr: ${address},summon: ${hero}`)
                    logger.info(`xp: ${_xp}, log:${_log}, class:${_class}, level:${_level}, reward:${reward}, attribute:${attributeValue.intelligence}, gold:${heroGold}`)
                }
            } catch (e) {
                logger.error(e)
            }

        }
    }

}


async function querySummonLevel2() {
    const AddressHeros = await loadAccounts()
    logger.info('multiApprove start')
    for (const { address, heros } of AddressHeros) {
        for (const hero of heros) {
            try {
                let {_xp, _log, _class, _level} = await rarity.summoner(hero)
                if(_level > 1) {
                    logger.info(`hero: ${hero}, xp: ${_xp / pointsLength} level: ${_level}`)
                    // logger.info(`xp: ${_xp}, log:${_log}, class:${_class}, level:${_level}, reward:${reward}, attribute:${attributeValue.intelligence}, gold:${heroGold}`)
                }
            } catch (e) {
                logger.error(e)
            }

        }
    }

}

async function queryCraftingMaterials() {
    const AddressHeros = await loadAccounts()
    logger.info('multiApprove start')
    for (const { address, heros } of AddressHeros) {
        for (const hero of heros) {
            let {_xp, _log, _class, _level} = await rarity.summoner(hero)
            if(_level == 1 && _class != 1 && _class != 5 && _class != 7) {
                let reward = await craftI.balanceOf(hero)
                logger.info(`addr: ${address},summon: ${hero}, xp: ${_xp}, log:${_log}, class:${_class}, level:${_level}, reward:${reward}`)
            }
        }
    }
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = {
    queryCraftingNumber,
    querySummon,
    queryCraftingMaterials,
    querySummonLevel2,
}

