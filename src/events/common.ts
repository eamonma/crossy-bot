import { Discord, On, Client, ArgsOf } from "discordx";

@Discord()
export abstract class AppDiscord {
  @On("messageCreate")
  onMessage([message]: ArgsOf<"messageCreate">, client: Client) {
    console.log(client.user?.username, message.content);
  }
}
