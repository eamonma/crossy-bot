import { Get, Post, Router } from "@discordx/koa"
import type { Context } from "koa"
import { client } from "../main.js"
import puppeteer, { Browser } from "puppeteer"
// import ormConfig from "./orm.config"

let browser = await puppeteer.launch()
const pages = new Map()

@Router()
export class API {
  @Get("/")
  index(context: Context) {
    context.body = `
      <div style="text-align: center">
        <h1>
          <a href="https://discord-ts.js.org">discord.ts</a> rest api server example
        </h1>
        <p>
          powered by <a href="https://koajs.com/">koa</a> and
          <a href="https://www.npmjs.com/package/@discordx/koa">@discordx/koa</a>
        </p>
      </div>
    `
  }

  @Post("/crossword/new/:guildId/")
  async newCrossword(context: Context) {
    const { guildId, puzzle } = context.params

    pages.set(`${guildId}-${puzzle}`, await browser.newPage())
    const page = pages.get(`${guildId}-${puzzle}`)
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
    await page.waitForSelector("#crossword-grid")
    const crosswordGrid = await page.$("#crossword-grid")
    if (!crosswordGrid) {
      console.log(page)

      context.status = 500
      context.body = "Not available."
      return
    }

    await crosswordGrid.screenshot({
      path: `data/${guildId}-${puzzle}-crossword.png`,
    })

    context.body = "Success"
  }

  // @Get("/crossword/:guildId/:puzzle")
  // async crossword(context: Context) {
  //   const { guildId, puzzle } = context.params

  //   pages.set(`${guildId}-${puzzle}`, await browser.newPage())
  //   const page = pages.get(`${guildId}-${puzzle}`)
  //   await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
  //   await page.waitForSelector("#crossword-grid")
  //   const crosswordGrid = await page.$("#crossword-grid")
  //   if (!crosswordGrid) {
  //     console.log(page)

  //     context.status = 500
  //     context.body = "Not available."
  //     return
  //   }

  //   await crosswordGrid.screenshot({
  //     path: `data/${guildId}-${puzzle}-crossword.png`,
  //   })

  //   context.body = "Success"
  // }

  @Post("/crossword/:guildId/:puzzle")
  async set(context: Context) {
    const { num, direction, answer } = context.request.body
    const { guildId, puzzle } = context.params

    const page = pages.get(`${guildId}-${puzzle}`)

    await page.waitForSelector("#crossword-grid")
    const crosswordGrid = await page.$("#crossword-grid")
    if (!crosswordGrid) {
      console.log(page)

      context.status = 500
      context.body = "Not available."
      return
    }

    const gridNum = await page.$("input[type=number]")
    await gridNum.click()
    await page.keyboard.press("Backspace")
    await page.keyboard.press("Backspace")
    await page.keyboard.press("Backspace")
    await page.keyboard.press("Backspace")
    await page.type("input[type=number]", JSON.stringify(num))
    await page.select("#direction", direction)
    await page.type("input[type=text]", answer)
    await page.click("button")

    await crosswordGrid.screenshot({
      path: `data/${guildId}-${puzzle}-crossword.png`,
    })
    // await page.screenshot({
    //   path: `data/${guildId}-${puzzle}-crossword.png`,
    // })

    context.body = "success"
    // const page = await browser.newPage()
    // await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" })
    // await page.waitForSelector("#crossword-grid")
    // const crosswordGrid = await page.$("#crosswor`d-grid")
    // if (!crosswordGrid) {
    //   console.log(page)

    //   context.status = 500
    //   context.body = "Not available."
    //   return
    // }

    // await crosswordGrid.screenshot({ path: "data/crossword.png" })

    context.body = "Success"
  }

  @Get()
  guilds(context: Context) {
    context.body = `${client.guilds.cache.map((g) => `${g.id}: ${g.name}\n`)}`
  }
}
