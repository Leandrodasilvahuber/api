import { getWeekForecast, getTodayForecast } from "./module.js";

const getForecast = async () => {
    const today = await getTodayForecast();

    return {
        currentTemp: today.airTemperature,
        condition: today.condition.text,
        conditionIcon: today.condition.icon,
        waveHeight: today.waveHeight,
        waveDirection: today.waveDirection.nome,
        waveDirectionIcon: today.waveDirection.emoji,
        windSpeed: today.windSpeed,
        windDirection: today.windDirection.nome,
        windDirectionIcon: today.windDirection.emoji,
        forecast: await getWeekForecast(),
    };
};

export default { getForecast };
