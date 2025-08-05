import { serviceDB, moment } from "../../config.js";

const getWeekForecast = async () => {
    let client = await serviceDB.getClient();
    const now = moment.utc().toDate();

    const result = await client
        .aggregate([
            {
                $addFields: {
                    parsedTime: { $toDate: "$time" },
                },
            },
            {
                $match: {
                    parsedTime: { $gte: now },
                },
            },
            {
                $sort: { parsedTime: 1 },
            },
        ])
        .toArray();

    client = null;

    return await formatWeekForecast(result);
};

const getTodayForecast = async () => {
    let client = await serviceDB.getClient();
    const now = moment.utc();

    const result = await client
        .aggregate([
            {
                $addFields: {
                    parsedTime: { $toDate: "$time" },
                },
            },
            {
                $match: {
                    parsedTime: new Date(
                        now.format("YYYY-MM-DDTHH") + ":00:00Z"
                    ),
                },
            },
            {
                $sort: { parsedTime: 1 },
            },
        ])
        .toArray();

    client = null;

    let today = result.shift();

    return {
        waveDirection: findDirection(today.waveDirection.noaa),
        windDirection: findDirection(today.windDirection.noaa),
        airTemperature: today.airTemperature.noaa.toFixed(0),
        waveHeight: today.waveHeight.noaa.toFixed(1),
        windSpeed: today.windSpeed.noaa.toFixed(1),
        condition: formatlabelsAndIconsForecast(today),
    };
};

const getLabelsAndIcons = (horaUTC) => {
    let partial;

    if (horaUTC >= 6 && horaUTC < 18) {
        partial = {
            rainy: { icon: "🌧️", text: "Chuva" },
            cloudy: { icon: "⛅", text: "Parcialmente Nublado" },
            sunny: { icon: "☀️", text: "Sol" },
            undefined: { icon: "❓", text: "Sem Previsão" },
        };
    } else {
        partial = {
            rainy: { icon: "🌧️", text: "Chuva" },
            cloudy: { icon: "☁️", text: "Parcialmente Nublado" },
            sunny: { icon: "🌙", text: "Limpo" },
            undefined: { icon: "❓", text: "Sem Previsão" },
        };
    }

    return partial;
};

const formatlabelsAndIconsForecast = (partial) => {
    const cloudCoverBoolean = partial.cloudCover > 10 ? true : false;
    const precipitationBoolean = partial.precipitation.noaa > 0 ? true : false;
    const horaUTC = moment.utc(partial.parsedTime).hour();
    const labelsAndIcons = getLabelsAndIcons(horaUTC);

    switch (true) {
        case cloudCoverBoolean && precipitationBoolean:
            return labelsAndIcons.rainy;
        case !cloudCoverBoolean && precipitationBoolean:
            return labelsAndIcons.rainy;
        case cloudCoverBoolean && !precipitationBoolean:
            return labelsAndIcons.sunny;
        case !cloudCoverBoolean && !precipitationBoolean:
            return labelsAndIcons.cloudy;
        default:
            return labelsAndIcons.undefined;
    }
};

const formatWeekForecast = (week) => {
    let currentDay = null;
    let color = "green";
    let weekFormatted = week.map((day) => {
        moment.locale("pt-br");
        const dateTime = moment(day.time).tz("America/Sao_Paulo");
        const timeBrasilia = dateTime.format("HH:mm:ss");
        const dateBrasilia = dateTime.format("DD/MM/YYYY");
        const weekDay = dateTime.format("ddd");

        if (currentDay !== dateBrasilia) {
            currentDay = dateBrasilia;
            color = color === "green" ? "yellow" : "green";
        }

        return {
            date: dateBrasilia,
            time: timeBrasilia,
            weekDay: weekDay.toUpperCase(),
            currentTemp: day.airTemperature.noaa.toFixed(0),
            waveDirection: findDirection(day.waveDirection.noaa).nome,
            waveDirectionIcon: findDirection(day.waveDirection.noaa).emoji,
            waveHeight: day.waveHeight.noaa.toFixed(1),
            windDirection: findDirection(day.windDirection.noaa).nome,
            windDirectionIcon: findDirection(day.windDirection.noaa).emoji,
            windSpeed: day.windSpeed.noaa.toFixed(1),
            color: color,
            condicao: formatlabelsAndIconsForecast(day),
        };
    });

    return weekFormatted;
};

const getDirections = () => {
    return {
        n: { emoji: "⬇️", start: 337.5, end: 22.5, nome: "Norte" },
        ne: { emoji: "↙️", start: 22.5, end: 67.5, nome: "Nordeste" },
        l: { emoji: "⬅️", start: 67.5, end: 112.5, nome: "Leste" },
        se: { emoji: "↖️", start: 112.5, end: 157.5, nome: "Sudeste" },
        s: { emoji: "⬆️", start: 157.5, end: 202.5, nome: "Sul" },
        so: { emoji: "↗️", start: 202.5, end: 247.5, nome: "Sudoeste" },
        o: { emoji: "➡️", start: 247.5, end: 292.5, nome: "Oeste" },
        no: { emoji: "↘️", start: 292.5, end: 337.5, nome: "Noroeste" },
    };
};

const findDirection = (degree) => {
    const directions = getDirections();

    degree = ((degree % 360) + 360) % 360;

    for (const key in directions) {
        const dir = directions[key];

        if (dir.start > dir.end) {
            if (degree >= dir.start || degree < dir.end) {
                return dir;
            }
        } else {
            if (degree >= dir.start && degree < dir.end) {
                return dir;
            }
        }
    }

    return null;
};

export { getWeekForecast, getTodayForecast };
