import { MessageButton } from "discord.js"

const createButton = (gameId: string): MessageButton => {
  return new MessageButton()
    .setLabel("View live")
    .setStyle("LINK")
    .setURL(`${process.env.HOSTNAME as string}/game/${gameId}`)
}

export default createButton
