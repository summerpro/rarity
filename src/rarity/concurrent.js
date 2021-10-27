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
const mapLimit = require('async/mapLimit');

const rarity = new Rarity()
const gold = new RarityGold()
const craftI = new RarityCraftingMaterials()
const attributes = new RarityAttributes()
const rarityMulti = new RarityMulti()
const multiNum = 70
const toHero = 1306172

async function concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum) {
    let idx = 0
    for (const {address, heros} of AddressHeros) {
        await mapLimit(heros, 30,
            async function (item) {
                return await preExecFunc(item);
            },
            async function (err, data) {
                logger.info("start callback")
                if (err) {
                    console.log(err)
                } else {
                    let heros = []
                    for (const hero of data) {
                        if (hero != null) {
                            heros.push(hero)
                        }
                    }
                    for (let i = 0; i < heros.length; i += multiNum) {
                        let dataList = []
                        if (heros.length - i > multiNum) {
                            dataList = heros.slice(i, i + multiNum)
                        } else {
                            dataList = heros.slice(i, heros.length)
                        }
                        await execFunc(address, dataList)
                    }

                }
                idx++
                if (idx == AddressHeros.length) {
                    param.done = true
                }
            })
    }
}

async function adventureMulti(AddressHeros) {
    logger.info('adventureAll start')
    let param = {
        done: false
    }
    const preExecFunc = async function (item, callback) {
        let hero = item
        try {
            const adventurers_log = await rarity.adventurers_log(hero)
            const {timestamp} = await rarityEth.pendingBlock()
            if (NumberUtils.lte(timestamp, adventurers_log)) {
                // logger.info(`${hero} adventure canceled, need to wait to timestamp ${adventurers_log}, current timestamp is ${timestamp}`)
                return
            }
        } catch (e) {
            logger.error(`${hero} adventure error`, e)
            return await preExecFunc(hero)
        }
        // callback(null, hero)
        logger.info(`adventure: selected hero ${hero}`)
        return hero
    }
    const execFunc = async function (address, heroList) {
        try {
            await rarityMulti.multiple_adventure(address, heroList)
        } catch (e) {
            logger.error(`${heroList} adventure error`, e)
        }
        logger.info(`adventure success, hero list:${heroList}`)
    }
    await concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum)
    await wailtUntilDone(param)
    logger.info('adventureAll end')
}


async function collectCraftIMulti(AddressHeros) {
    logger.info('collectCraftIMulti start')
    let param = {
        done: false
    }
    const preExecFunc = async function (item, callback) {
        let hero = item
        let reward = 0
        try {
            reward = await craftI.scout(hero)
            if (!NumberUtils.gt(reward, 0)) {
                // logger.info(`${hero} collectCraft(I) canceled, reward is 0`)
                return
            }
            const {timestamp} = await rarityEth.pendingBlock()
            const adventurers_log = await craftI.adventurers_log(hero)
            if (NumberUtils.lte(timestamp, adventurers_log)) {
                // logger.info(`${hero} collectCraft(I) canceled, need to wait to timestamp ${adventurers_log}, current timestamp is ${timestamp}`)
                return
            }

        } catch (e) {
            logger.error(`${hero} collectCraft(I) error`, e)
            return await preExecFunc(hero)
        }
        // callback(null, hero)
        logger.info(`collectCraft(I): selected hero ${hero}, crafting materials: ${reward}`)
        return hero
    }
    const execFunc = async function (address, selectedHeroList) {
        try {
            if (selectedHeroList.length > 0) {
                await rarityMulti.multiple_adventure_crafting_materials(address, selectedHeroList)
                logger.info(`collectCraft success, hero list:${selectedHeroList}`)
            }
        } catch (e) {
            logger.error(`${selectedHeroList} adventure error`, e)
        }
    }
    await concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum)
    await wailtUntilDone(param)
    logger.info('collectCraftIMulti end')
}


async function levelupMulti(AddressHeros) {
    logger.info('levelupMulti start')
    let param = {
        done: false
    }
    const preExecFunc = async function (item, callback) {
        let hero = item
        try {
            const {_xp, _level} = await rarity.summoner(hero)
            const xp_required = await rarity.xp_required(_level)
            let attributeValue = await attributes.ability_scores(hero)
            if (attributeValue.intelligence != 22 && NumberUtils.gte(_xp, xp_required)) {
                logger.info(`selected hero: ${hero}, xp: ${_xp}, level: ${_level}`)
                return hero
            }
            // logger.info(`can not be upgraded hero: ${hero}, xp:${_xp}, level: ${_level}`)
        } catch (e) {
            logger.error(`${hero} levelup error`, e)
            return await preExecFunc(item, callback)
        }
    }
    const execFunc = async function (address, selectedHeroList) {
        try {
            await rarityMulti.multiple_level_up(address, selectedHeroList)
            logger.info(`level up success, hero list:${selectedHeroList}`)
            await rarityMulti.multiple_claim_gold(address, selectedHeroList)
            logger.info(`claim_gold success, hero list:${selectedHeroList}`)
        } catch (e) {
            logger.error(`${selectedHeroList} levelup error`, e)
        }
    }
    await concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum)
    await wailtUntilDone(param)
    logger.info('levelupMulti complete')
}


async function transferMaterialsMulti(AddressHeros) {
    logger.info('transferMaterials start')
    let param = {
        done: false
    }
    const preExecFunc = async function (item, callback) {
        let hero = item
        if (hero == toHero) {
            logger.info(`${hero} could not equal to toHero:${toHero}`)
            return
        }
        try {
            const amount = await craftI.balanceOf(hero)
            logger.info(`hero: ${hero} amount: ${amount}`)
            if (amount > 0) {
                return {hero, amount}
            }
        } catch (e) {
            logger.error(`${hero} TransferAttributes error`, e)
        }
    }
    const execFunc = async function (address, data) {
        let heroList = []
        let amountList = []
        for (const {hero, amount} of data) {
            heroList.push(hero)
            amountList.push(amount)
        }
        await rarityMulti.multiple_transfer_materials(address, heroList, toHero, amountList)
        logger.info(`transferMaterials complete hero:${heroList} amount:${amountList}`)
    }
    await concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum)
    await wailtUntilDone(param)
    logger.info('transferMaterials complete')
}

async function transferGoldMulti(AddressHeros) {
    logger.info('transferGold start')
    let param = {
        done: false
    }
    const preExecFunc = async function (item, callback) {
        let hero = item

    }
    const execFunc = async function (address, selectedHeroList) {

    }
    await concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum)
    await wailtUntilDone(param)
    logger.info('transferGold complete')
}

async function multiApprove(AddressHeros) {
    logger.info('multiApprove start')
    let param = {
        done: false
    }
    const preExecFunc = async function (item, callback) {
        let hero = item
        try {
            const addr = await rarity.getApproved(hero)
            if (addr != rarityMulti.contractAddress) {
                logger.info(`multiApprove selected hero: ${hero}`)
                return hero
            }
        } catch (e) {
            logger.error(`${hero} multiApprove error`, e)
            return await preExecFunc(item, callback)
        }

    }
    const execFunc = async function (address, selectedHeroList) {
        try {
            await rarityMulti.multiple_approve(address, selectedHeroList)
            logger.info(`multiple_approve success, heros: ${selectedHeroList}`)
        } catch (e) {
            logger.error(`${selectedHeroList} multiApprove error`, e)
        }

    }
    await concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum)
    await wailtUntilDone(param)
    logger.info('multiApprove complete')
}

function readValidAttributes() {
    const data = fs.readFileSync(path.resolve(__dirname, 'ra_point_buy_inputs.txt'))
    const lines = Buffer.from(data, 'binary').toString().split('\n')
    return lines.map(line => line.trim().split(','))
}

async function multiSetAttribute(AddressHeros) {
    logger.info('multiple_point_buy start')
    let param = {
        done: false
    }
    const validAttributes = readValidAttributes()
    const selectedAttribute = validAttributes[Math.floor(Math.random() * validAttributes.length)]
    const preExecFunc = async function (item, callback) {
        let hero = item
        if (hero > 2400000) {
            return hero
        }
    }
    const execFunc = async function (address, selectedHeroList) {
        try {
            await rarityMulti.multiple_point_buy(address, selectedHeroList, selectedAttribute)
            logger.info(`multiple_point_buy success, heros: ${selectedHeroList}`)
        } catch (e) {
            logger.error(`${selectedHeroList} multiple_point_buy error`, e)
        }
    }
    await concurrentExec(AddressHeros, preExecFunc, execFunc, param, multiNum)
    await wailtUntilDone(param)
    logger.info('multiple_point_buy complete')
}

async function startAdventure() {
    const AddressHeros = await loadAccounts()
    await multiApprove(AddressHeros)
    await adventureMulti(AddressHeros)
    await collectCraftIMulti(AddressHeros)
    await levelupMulti(AddressHeros)
}

async function startSetAttribute() {
    const AddressHeros = await loadAccounts()
    await multiSetAttribute(AddressHeros)
}

async function scheduleAdventure() {
    const CronJob = require('cron').CronJob;
    // second minute hour dayOfMonth month dayOfWeek
    const cron = '0 10 * * * *' // try every 1 minute
    const job = new CronJob(cron, function () {
        startAdventure()
    }, null, false, 'Asia/Shanghai')
    job.start()
    logger.info(`scheduled ${cron}`)
}


async function startTransferMaterials() {
    const AddressHeros = await loadAccounts()
    await transferMaterialsMulti(AddressHeros)
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function wailtUntilDone(param) {
    for (; ;) {
        if (param.done) {
            break
        }
        await sleep(100)
    }
}

module.exports = {
    startAdventure,
    scheduleAdventure,
    concurrentExec,
    wailtUntilDone,
    startTransferMaterials,
    startSetAttribute,
}