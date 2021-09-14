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

const rarity = new Rarity()
const gold = new RarityGold()
const craftI = new RarityCraftingMaterials()
const attributes = new RarityAttributes()
const rarityMulti = new RarityMulti()

async function adventure(account, hero, nonce = null) {
  logger.info(`${hero} adventure start (account ${account})`)
  try {
    const adventurers_log = await rarity.adventurers_log(hero)
    const { timestamp } = await rarityEth.pendingBlock()
    if (NumberUtils.lte(timestamp, adventurers_log)) {
      logger.info(`${hero} adventure canceled, need to wait to timestamp ${adventurers_log}, current timestamp is ${timestamp}`)
      return
    }
    await rarity.adventure(account, hero, nonce)
    const { _xp, _level } = await rarity.summoner(hero)
    const xp_required = await rarity.xp_required(_level)
    // logger.info({ adventurers_log, _xp, _level, xp_required })
    if (NumberUtils.gte(_xp, xp_required)) {
      await rarity.level_up(account, hero, nonce)
      logger.info(`${hero} adventure level up`)
    }
    logger.info(`${hero} adventure complete`)
  } catch (e) {
    logger.error(`${hero} adventure error`, e)
  }
}

async function claimGold(account, hero) {
  logger.info(`${hero} claimGold start (account ${account})`)
  try {
    const claimable = await gold.claimable(account, hero)
    if (!NumberUtils.gt(claimable, 0)) {
      logger.info(`${hero} claimGold canceled, no gold`)
      return
    }
    await gold.claim(account, hero)
    logger.info(`${hero} claimGold claimed ${claimable} gold`)
  } catch (e) {
    logger.error(`${hero} claimGold error`, e)
  }
}

async function collectCraftI(account, hero) {
  logger.info(`${hero} collectCraft(I) start (account ${account})`)
  try {
    const reward = await craftI.scout(hero)
    if (!NumberUtils.gt(reward, 0)) {
      logger.info(`${hero} collectCraft(I) canceled, reward is 0`)
      return
    }
    const { timestamp } = await rarityEth.pendingBlock()
    const adventurers_log = await craftI.adventurers_log(hero)
    if (NumberUtils.lte(timestamp, adventurers_log)) {
      logger.info(`${hero} collectCraft(I) canceled, need to wait to timestamp ${adventurers_log}, current timestamp is ${timestamp}`)
      return
    }
    await craftI.adventure(account, hero)
    const balance = await craftI.balanceOf(hero)
    logger.info(`${hero} collectCraft(I) complete, balance is ${balance} now`)
  } catch (e) {
    logger.error(`${hero} collectCraft(I) error`, e)
  }
}

async function adventureAll(AddressHeros) {
  logger.info('adventureAll start')
  for (const { address, heros } of AddressHeros) {
    for (const hero of heros) {
      await adventure(address, hero)
      await collectCraftI(address, hero)
    }
  }
  logger.info('adventureAll complete')
}

async function adventureAllMulti(AddressHeros) {
  logger.info('adventureAllMulti start')
  await collectCraftIMulti(AddressHeros)
  let newAddressHeros = await adventureMulti(AddressHeros)
  await levelupMulti(AddressHeros)
  logger.info('adventureAllMulti complete')
}
const multiNum = 100
async function adventureMulti(AddressHeros) {
  let newAddressHeros = []
  logger.info('adventureMulti start')
  for (const { address, heros } of AddressHeros) {
    let totalSelectedHeroList = []
    let selectedHeroList = []
    for (const hero of heros) {
      try {
        const adventurers_log = await rarity.adventurers_log(hero)
        const { timestamp } = await rarityEth.pendingBlock()
        if (NumberUtils.lte(timestamp, adventurers_log)) {
          logger.info(`${hero} adventure canceled, need to wait to timestamp ${adventurers_log}, current timestamp is ${timestamp}`)
          continue
        }
        selectedHeroList.push(hero)
        totalSelectedHeroList.push(hero)
        if(selectedHeroList.length >= multiNum) {
          await rarityMulti.multiple_adventure(address, selectedHeroList)
          logger.info(`adventure success, hero list:${selectedHeroList}`)
          selectedHeroList = []
        }
      } catch (e) {
        logger.error(`${hero} adventure error`, e)
      }
    }
    newAddressHeros.push({address, totalSelectedHeroList})
    try {
      if(selectedHeroList.length > 0) {
        await rarityMulti.multiple_adventure(address, selectedHeroList)
        logger.info(`adventure success, hero list:${selectedHeroList}`)
      }
    } catch (e) {
      logger.error(`${selectedHeroList} adventure error`, e)
    }

  }
  logger.info('adventureMulti complete')
  return newAddressHeros
}

async function levelupMulti(AddressHeros) {
  logger.info('levelupMulti start')
  for (const { address, heros } of AddressHeros) {
    let selectedHeroList = []
    for (const hero of heros) {
      try {
        const { _xp, _level } = await rarity.summoner(hero)
        const xp_required = await rarity.xp_required(_level)
        // logger.info({ adventurers_log, _xp, _level, xp_required })
        if (NumberUtils.gte(_xp, xp_required)) {
          selectedHeroList.push(hero)
        }
        if(selectedHeroList.length >= multiNum) {
          await rarityMulti.multiple_level_up(address, selectedHeroList)
          logger.info(`level up success, hero list:${selectedHeroList}`)
          // await rarityMulti.multiple_claim_gold(address, selectedHeroList)
          // logger.info(`claim_gold success, hero list:${selectedHeroList}`)
          selectedHeroList = []
        }
      } catch (e) {
        logger.error(`${selectedHeroList} levelup error`, e)
      }
    }
    try {
      if(selectedHeroList.length > 0) {
        await rarityMulti.multiple_level_up(address, selectedHeroList)
        logger.info(`level up success, hero list:${selectedHeroList}`)
        // await rarityMulti.multiple_claim_gold(address, selectedHeroList)
        // logger.info(`claim_gold success, hero list:${selectedHeroList}`)
      }
    } catch (e) {
      logger.error(`${selectedHeroList} adventure error`, e)
    }
  }
  logger.info('levelupMulti complete')
}

async function collectCraftIMulti(AddressHeros) {
  logger.info('collectCraftIMulti start')
  for (const { address, heros } of AddressHeros) {
    let selectedHeroList = []
    for (const hero of heros) {
      try {
        const reward = await craftI.scout(hero)
        if (!NumberUtils.gt(reward, 0)) {
          logger.info(`${hero} collectCraft(I) canceled, reward is 0`)
          continue
        }
        const { timestamp } = await rarityEth.pendingBlock()
        const adventurers_log = await craftI.adventurers_log(hero)
        if (NumberUtils.lte(timestamp, adventurers_log)) {
          logger.info(`${hero} collectCraft(I) canceled, need to wait to timestamp ${adventurers_log}, current timestamp is ${timestamp}`)
          continue
        }
        selectedHeroList.push(hero)
        if(selectedHeroList.length >= multiNum) {
          await rarityMulti.multiple_adventure_crafting_materials(address, selectedHeroList)
          logger.info(`collectCraft success, hero list:${selectedHeroList}`)
          selectedHeroList = []
        }
      } catch (e) {
        logger.error(`${hero} collectCraft(I) error`, e)
      }
    }
    try {
      if(selectedHeroList.length > 0) {
        await rarityMulti.multiple_adventure_crafting_materials(address, selectedHeroList)
        logger.info(`collectCraft success, hero list:${selectedHeroList}`)
      }
    } catch (e) {
      logger.error(`${selectedHeroList} adventure error`, e)
    }
  }
  logger.info('collectCraftIMulti complete')
}

async function claimGoldAll(AddressHeros) {
  logger.info('claimGoldAll start')
  for (const { address, heros } of AddressHeros) {
    for (const hero of heros) {
      await claimGold(address, hero)
    }
  }
  logger.info('claimGoldAll complete')
}

async function multiClaimGoldAll(AddressHeros) {
  let multiNum = 50
  logger.info('claimGoldAll start')
  for (const { address, heros } of AddressHeros) {
    let selectedHeroList = []
    for (const hero of heros) {
      try {
        logger.info('start claimable query')
        const claimable = await gold.claimable(address, hero)
        logger.info('stop claimable query')
        if (!NumberUtils.gt(claimable, 0)) {
          logger.info(`${hero} claimGold canceled, no gold`)
          continue
        }
        selectedHeroList.push(hero)
        logger.info(`${hero} push selected hero ${claimable} gold`)
        if(selectedHeroList.length >= multiNum) {
          await rarityMulti.multiple_claim_gold(address, selectedHeroList)
          logger.info(`claimGold success, hero list:${selectedHeroList}`)
          selectedHeroList = []
        }

      } catch (e) {
        logger.error(`${hero} claimGold error`, e)
      }
    }
    try {
      if(selectedHeroList.length > 0) {
        await rarityMulti.multiple_claim_gold(address, selectedHeroList)
        logger.info(`claimGold success, hero list:${selectedHeroList}`)
      }
    } catch (e) {
      logger.error(`${selectedHeroList} adventure error`, e)
    }
  }
  logger.info('claimGoldAll complete')
}

async function scheduleAdventure() {
  const AddressHeros = await loadAccounts()
  const CronJob = require('cron').CronJob;
  // second minute hour dayOfMonth month dayOfWeek
  const cron = '0 0 * * * *' // try every 1 hour
  const job = new CronJob(cron, function () {
    adventureAll(AddressHeros)
  }, null, false, 'Asia/Shanghai')
  job.start()
  logger.info(`scheduled ${cron}`)
}

async function scheduleAdventureMulti() {
  const AddressHeros = await loadAccounts()
  const CronJob = require('cron').CronJob;
  // second minute hour dayOfMonth month dayOfWeek
  const cron = '0 0 * * * *' // try every 1 hour
  const job = new CronJob(cron, function () {
    adventureAllMulti(AddressHeros)
  }, null, false, 'Asia/Shanghai')
  job.start()
  logger.info(`scheduled ${cron}`)
}

async function startAdventure() {
  const AddressHeros = await loadAccounts()
  return adventureAll(AddressHeros)
}

async function startAdventureMulti() {
  const AddressHeros = await loadAccounts()
  return adventureAllMulti(AddressHeros)
}

async function startClaimGold() {
  const AddressHeros = await loadAccounts()
  return claimGoldAll(AddressHeros)
}

async function startMultiClaimGold() {
  const AddressHeros = await loadAccounts()
  return multiClaimGoldAll(AddressHeros)
}

async function assignAttribute(address, hero, validAttributes) {
  try {
    logger.info(`${hero} assign attribute start, account ${address}`)
    const character_created = await attributes.character_created(hero)
    if (character_created) {
      logger.info(`${hero} assign attribute canceled, character already created`)
      return
    }
    const attrs = validAttributes[Math.floor(Math.random() * validAttributes.length)]
    await attributes.point_buy(address, hero, attrs)
    logger.info(`${hero} assign attribute to ${attrs} complete`)
  } catch (e) {
    logger.error(`${hero} assign attribute error`, e)
  }
}

function readValidAttributes() {
  const data = fs.readFileSync(path.resolve(__dirname, 'ra_point_buy_inputs.txt'))
  const lines = Buffer.from(data, 'binary').toString().split('\n')
  return lines.map(line => line.trim().split(','))
}

async function startAssignAttributes() {
  const AddressHeros = await loadAccounts()
  logger.info('assignAttributeAll start')
  const validAttributes = readValidAttributes()
  for (const { address, heros } of AddressHeros) {
    for (const hero of heros) {
      await assignAttribute(address, hero, validAttributes)
    }
  }
  logger.info('assignAttributeAll complete')
}

async function startTransferMaterials() {
  const toHero = 1306172
  const AddressHeros = await loadAccounts()
  logger.info('TransferAttributes start')
  for (const { address, heros } of AddressHeros) {
    for (const hero of heros) {
      if(hero == toHero) {
        logger.info(`${hero} could not equal to toHero:${toHero}`)
        continue
      }
      try {
        const amount = await craftI.balanceOf(hero)
        logger.info(`hero: ${hero} amount: ${amount}`)
        if(amount > 0) {
          await craftI.transfer(address, hero, toHero, amount)
          logger.info(`TransferAttributes complete hero:${hero} amount:${amount}`)
        }
      } catch (e) {
        logger.error(`${hero} TransferAttributes error`, e)
      }
    }
  }
  logger.info('TransferAttributes complete')
}


async function startMultiTransferMaterials() {
  const toHero = 1306172
  const AddressHeros = await loadAccounts()
  logger.info('TransferAttributes start')
  for (const { address, heros } of AddressHeros) {
    let selectedHeros = []
    let amountList = []
    for (const hero of heros) {
      if(hero == toHero) {
        logger.info(`${hero} could not equal to toHero:${toHero}`)
        continue
      }
      try {
        const amount = await craftI.balanceOf(hero)
        logger.info(`hero: ${hero} amount: ${amount}`)
        if(amount > 0) {
          selectedHeros.push(hero)
          amountList.push(amount)
          logger.info(`Transfer materials hero:${hero} amount:${amount}`)
        }
        if (selectedHeros.length > multiNum) {
          await rarityMulti.multiple_transfer_materials(address, selectedHeros, toHero, amountList)
          logger.info(`multiple_transfer_materials success, heros: ${selectedHeros}`)
          selectedHeros = []
          amountList = []
        }
      } catch (e) {
        logger.error(`${hero} TransferAttributes error`, e)
      }
    }
    try {
      if (selectedHeros.length > 0) {
        await rarityMulti.multiple_transfer_materials(address, selectedHeros, toHero, amountList)
        logger.info(`multiple_transfer_materials success, heros: ${selectedHeros}`)
      }
    } catch (e) {
      logger.error(`${hero} multiple_transfer_materials error`, e)
    }
  }
  logger.info('TransferAttributes complete')
}


async function startMultiTransferGold() {
  const toHero = 1306172
  const AddressHeros = await loadAccounts()
  logger.info('TransferGold start')
  for (const { address, heros } of AddressHeros) {
    let selectedHeros = []
    let amountList = []
    for (const hero of heros) {
      if(hero == toHero) {
        logger.info(`${hero} could not equal to toHero:${toHero}`)
        continue
      }
      try {
        const amount = await gold.balanceOf(hero)
        logger.info(`hero: ${hero} amount: ${amount}`)
        if(amount > 0) {
          selectedHeros.push(hero)
          amountList.push(amount)
          logger.info(`TransferGold  hero:${hero} amount:${amount}`)
        }
        if (selectedHeros.length > multiNum) {
          await rarityMulti.multiple_transfer_gold(address, selectedHeros, toHero, amountList)
          logger.info(`multiple_transfer_gold success, heros: ${selectedHeros}`)
          selectedHeros = []
          amountList = []
        }
      } catch (e) {
        logger.error(`${hero} TransferGold error`, e)
      }
    }
    try {
      if (selectedHeros.length > 0) {
        await rarityMulti.multiple_transfer_gold(address, selectedHeros, toHero, amountList)
        logger.info(`multiple_transfer_gold success, heros: ${selectedHeros}`)
      }
    } catch (e) {
      logger.error(` TransferGold error`, e)
    }

  }
  logger.info('TransferGold complete')
}


async function startTransferGold() {
  const toHero = 1306172
  const AddressHeros = await loadAccounts()
  logger.info('TransferGold start')
  for (const { address, heros } of AddressHeros) {
    for (const hero of heros) {
      if(hero == toHero) {
        logger.info(`${hero} could not equal to toHero:${toHero}`)
        continue
      }
      try {
        const amount = await gold.balanceOf(hero)
        logger.info(`hero: ${hero} amount: ${amount}`)
        if(amount > 0) {
          await gold.transfer(address, hero, toHero, amount)
          logger.info(`TransferGold  hero:${hero} amount:${amount}`)
        }
      } catch (e) {
        logger.error(` TransferGold error`, e)
      }
    }
  }
  logger.info('TransferGold complete')
}


async function multiApprove() {
  const AddressHeros = await loadAccounts()
  logger.info('multiApprove start')
  for (const { address, heros } of AddressHeros) {
    let selectedHeros = []
    for (const hero of heros) {
      try {
        const addr = await rarity.getApproved(hero)
        if (addr == rarityMulti.contractAddress) {
          logger.info(`already approved ${rarityMulti.contractAddress} ${hero}`)
          continue
        }
        logger.info(`selected approve ${rarityMulti.contractAddress} ${hero}`)
        selectedHeros.push(hero)
        if (selectedHeros.length > multiNum) {
          await rarityMulti.multiple_approve(address, selectedHeros)
          logger.info(`multiple_approve success, heros: ${selectedHeros}`)
          selectedHeros = []
        }
      } catch (e) {
        logger.error(` multiple_approve error`, e)
      }

    }
    try {
      if (selectedHeros.length > 0) {
        await rarityMulti.multiple_approve(address, selectedHeros)
        logger.info(`multiple_approve success, heros: ${selectedHeros}`)
      }
    } catch (e) {
      logger.error(` multiple_approve error`, e)
    }
  }
  logger.info('multiApprove complete')
}

module.exports = {
  scheduleAdventure,
  startAdventure,
  scheduleAdventureMulti,
  startAdventureMulti,
  startClaimGold,
  startMultiClaimGold,
  startAssignAttributes,
  startTransferMaterials,
  startTransferGold,
  startMultiTransferMaterials,
  startMultiTransferGold,
  multiApprove,
}
