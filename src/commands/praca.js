const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");
const { calcEndTime } = require("../utils/calcEndTime");
const moment = require("moment-timezone");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("praca")
    .setDescription(
      "Reivindica uma sala na Magic Square baseado no andar, nome e número da chamber e tickets"
    )
    .addStringOption((option) =>
      option
        .setName("floor")
        .setDescription("Número do Floor (1F-6F)")
        .setRequired(true)
        .addChoice("1F", "1F")
        .addChoice("2F", "2F")
        .addChoice("3F", "3F")
        .addChoice("4F", "4F")
        .addChoice("5F", "5F")
        .addChoice("6F", "6F")
    )
    .addStringOption((option) =>
      option
        .setName("chambername")
        .setDescription("Nome da Chamber (Gold/Experience/Magic Stone)")
        .setRequired(true)
        .addChoice("Gold Chamber", "gold")
        .addChoice("Experience Chamber", "experience")
        .addChoice("Magic Stone Chamber", "magic-stone")
    )
    .addStringOption((option) =>
      option
        .setName("chambernumber")
        .setDescription("Número da Chamber (I/II/III)")
        .setRequired(true)
        .addChoice("Chamber I", "1")
        .addChoice("Chamber II", "2")
        .addChoice("Chamber III", "3")
    )
    .addStringOption((option) =>
      option
        .setName("tickets")
        .setDescription("Número de tickets: 1 or 2")
        .setRequired(true)
        .addChoice("1", "30")
        .addChoice("2", "60")
        .addChoice("3", "90")
        .addChoice("4", "120")
        .addChoice("5", "150")
        .addChoice("6", "180")
        .addChoice("7", "210")
        .addChoice("8", "240")
        .addChoice("9", "270")
        .addChoice("10", "300")
        .addChoice("11", "330")
        .addChoice("12", "360")
        .addChoice("13", "390")
        .addChoice("14", "420")
        .addChoice("15", "450")
        .addChoice("16", "480")
    ),
  async execute(interaction) {
    try {
      if (!interaction.isCommand) return;
      if (interaction.commandName === "square");

      const date = Date.now();
      const floor = interaction.options.getString("floor");
      const chamberName = interaction.options.getString("chambername");
      const chamberNumber = interaction.options.getString("chambernumber");
      const tickets = interaction.options.getString("tickets");
      const client = interaction.client;
      const guild = client.guilds.cache.get("903985002650411049");
      const channel = guild.channels.cache.get("903985002650411052");
      const user = client.users.cache.find(
        (u) => u.tag === `${interaction.user.tag}`
      );

      let allPlayersQueue = JSON.parse(
        fs.readFileSync("./src/players-on-queue.json")
      );
      let seconds;
      let minutes;
      let hours;
      let formattedDate;
      let formattedTicket;
      let ticketsHoursCalc;

      const findPlayer = allPlayersQueue.find(
        (player) => player.id === user.id
      );
      if (findPlayer) {
        await interaction.reply({
          content: `:no_entry_sign: <@${user.id}> você já esta numa fila!`,
          ephemeral: true,
        });
        return;
      }

      const formattedChamber = `${chamberName}-${chamberNumber}.json`;
      let queue;
      queue = JSON.parse(
        fs.readFileSync(`./src/magic-square/${floor}/${formattedChamber}`)
      );
      let queueDateCalc = eval(queue);

      let startedAt = date;
      let endsAt = startedAt;
      let timeToEnter;

      //Verifica se a primeira pessoa na fila não esta com tempo negativo(que o tempo dela nao expirou e o bot nao removeu por algum acaso)
      if (queue.length > 0 && queue[0].endsAt < date) {
        queue.shift();
      }
      //-----//

      if (queueDateCalc.length >= 2) {
        await interaction.reply({
          content: `\n:no_entry_sign: <@${user.id}> essa fila está cheia! :no_entry_sign:`,
          ephemeral: true,
        });
        return;
      }

      if (queue.length > 0 && date <= queue[0].endsAt - 300000) {
        await interaction.reply(
          `\n:no_entry_sign: <@${user.id}> Você ainda não pode dar claim aqui, deve faltar 5 minutos para acabar a vez do primeiro da fila. :no_entry_sign:`
        );
        return;
      }

      //Calcula o tempo que deve começar a vez do usuario que deu claim
      if (queueDateCalc.length == 1) {
        const endsAt01 = queueDateCalc[0].endsAt;
        startedAt = endsAt01;
      }
      endsAt = calcEndTime(tickets, startedAt);

      if (queueDateCalc.length >= 0) {
        timeToEnter = startedAt - date;
        ticketsInMs = endsAt - startedAt;
        minuteTimeToEnter = timeToEnter / 60000;
        seconds = Math.floor(timeToEnter / 1000) % 60;
        minutes = Math.floor((timeToEnter / (1000 * 60)) % 60);
        hours = Math.floor((timeToEnter / (1000 * 60 * 60)) % 24);
        hours = hours < 10 ? "0" + hours : hours;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        let ticketsSecCalc = Math.floor(ticketsInMs / 1000) % 60;
        let ticketsMinCalc = Math.floor((ticketsInMs / (1000 * 60)) % 60);
        ticketsHoursCalc = Math.floor((ticketsInMs / (1000 * 60 * 60)) % 24);
        ticketsHoursCalc =
          ticketsHoursCalc < 10 ? "0" + ticketsHoursCalc : ticketsHoursCalc;
        ticketsMinCalc =
          ticketsMinCalc < 10 ? "0" + ticketsMinCalc : ticketsMinCalc;
        ticketsSecCalc =
          ticketsSecCalc < 10 ? "0" + ticketsSecCalc : ticketsSecCalc;
        formattedDate = hours + ":" + minutes + ":" + seconds;
        formattedTicket =
          ticketsHoursCalc + ":" + ticketsMinCalc + ":" + ticketsSecCalc;
      }
      //-----//

      const player = {
        userName: interaction.user.username,
        id: user.id,
        spot: {
          floor: floor,
          name: chamberName,
          number: chamberNumber,
          tickets: tickets,
        },
        startedAt: startedAt,
        endsAt: endsAt,
      };

      const playerForAllPlayersQueue = {
        place: "magic-square",
        id: user.id,
        floor: floor,
        spot: formattedChamber,
      };

      //Coloca o player na fila e coloca a nova fila no respectivo arquivo json
      queue.push(player);

      fs.writeFileSync(
        `./src/magic-square/${floor}/${formattedChamber}`,
        JSON.stringify(queue)
      );
      //-----//

      //Coloca o player na fila do all-players-queue e escreve a nova fila no arquivo json
      allPlayersQueue.push(playerForAllPlayersQueue);
      fs.writeFileSync(
        `./src/players-on-queue.json`,
        JSON.stringify(allPlayersQueue)
      );

      //-----//

      if (queue.length === 1) {
        if (ticketsHoursCalc > 0) {
          await interaction.reply({
            content: `\n:white_check_mark: <@${user.id}> pegou o spot ${
              chamberName.charAt(0).toUpperCase() + chamberName.slice(1)
            } ${chamberNumber} no ${floor} por ${formattedTicket.slice(
              0,
              5
            )} horas   
            \n:ballot_box_with_check: ${
              interaction.user.username
            } você já pode entrar na Magic Square!`,
          });
        } else {
          await interaction.reply({
            content: `:white_check_mark: <@${user.id}> pegou o spot ${
              chamberName.charAt(0).toUpperCase() + chamberName.slice(1)
            } ${chamberNumber} no ${floor} por ${formattedTicket.slice(
              3,
              8
            )} minutos   
          \n:ballot_box_with_check: ${
            interaction.user.username
          } você já pode entrar na Magic Square!`,
          });
        }
      }
      if (queue.length > 1) {
        let result = timeToEnter - 300000;
        if (minutes + hours > 0) {
          if (ticketsHoursCalc > 0) {
            await interaction.reply({
              content: `:white_check_mark: <@${user.id}> pegou o spot ${
                chamberName.charAt(0).toUpperCase() + chamberName.slice(1)
              } ${chamberNumber} no ${floor} por ${formattedTicket.slice(
                0,
                5
              )} horas   
              \n:stopwatch: Sua vez é em ${formattedDate.slice(
                3,
                8
              )} minutos, esteja pronto!`,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: `:white_check_mark: <@${user.id}> pegou o spot ${
                chamberName.charAt(0).toUpperCase() + chamberName.slice(1)
              } ${chamberNumber} no ${floor} por ${formattedTicket.slice(
                3,
                8
              )} minutos   
              \n:stopwatch: Sua vez é em ${formattedDate.slice(
                3,
                8
              )} minutos, esteja pronto!`,
              ephemeral: true,
            });
          }

          setTimeout(() => {
            channel.send({
              content: `\n:rotating_light: <@${user.id}>, esteja pronto! Em 5 minutos você poderá entrar na Magic Square!`,
              ephemeral: true,
            });
          }, result);
        } else {
          if (ticketsHoursCalc > 0) {
            await interaction.reply({
              content: `:white_check_mark: <@${user.id}> pegou o spot ${
                chamberName.charAt(0).toUpperCase() + chamberName.slice(1)
              } ${chamberNumber} no ${floor} por ${formattedTicket.slice(
                0,
                5
              )} horas   
              \n:stopwatch: Sua vez é em ${formattedDate.slice(
                3,
                8
              )} segundos, esteja pronto!`,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: `:white_check_mark: <@${user.id}> pegou o spot ${
                chamberName.charAt(0).toUpperCase() + chamberName.slice(1)
              } ${chamberNumber} no ${floor} por ${formattedTicket.slice(
                3,
                8
              )} minutos   
              \n:stopwatch: Sua vez é em ${formattedDate.slice(
                3,
                8
              )} segundos, esteja pronto!`,
              ephemeral: true,
            });
          }

          setTimeout(() => {
            channel.send({
              content: `\n:rotating_light: <@${user.id}>, esteja pronto! Em 5 minutos você poderá entrar na Magic Square!`,
              ephemeral: true,
            });
          }, result);
        }
      }

      const queueExit = endsAt - date;

      setTimeout(() => {
        //Verifica se o usuaria ainda esta na fila (pois pode ja ter usado um leave)
        const checkPlayerInQueue = () => {
          const allPlayersOnQueue = JSON.parse(
            fs.readFileSync("./src/players-on-queue.json")
          );
          const check = allPlayersOnQueue.map(
            (player) => player.id === user.id
          );

          return check;
        };

        checkPlayerInQueue();

        if (!checkPlayerInQueue) return;
        //-----//

        let timeoutQueue = JSON.parse(
          fs.readFileSync(`./src/magic-square/${floor}/${formattedChamber}`)
        );
        eval(timeoutQueue);
        timeoutQueue.shift();
        fs.writeFileSync(
          `./src/magic-square/${floor}/${formattedChamber}`,
          JSON.stringify(timeoutQueue)
        );
        allPlayersQueue.shift();
        fs.writeFileSync(
          `./src/players-on-queue.json`,
          JSON.stringify(allPlayersQueue)
        );

        if (timeoutQueue.length === 0) return;
        else {
          channel.send({
            content: `\n:ballot_box_with_check: <@${timeoutQueue[0].id}>, Você está liberado! Entre na Magic Square!`,
            ephemeral: true,
          });
        }
      }, queueExit);
    } catch (error) {
      await interaction.reply({
        content: `Um erro aconteceu ao executar esse comando, por favor verifique com a staff.\nError:${error.message}`,
        ephemeral: true,
      });
    }
  },
};