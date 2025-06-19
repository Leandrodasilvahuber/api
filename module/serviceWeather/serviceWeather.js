import { 
  getWeekForecast, 
  getTodayForecast, 
  formatConditionForecast, 
  formatWeekForecast
} from "./forecast.js"

const getForecast = async () => {

    const today = await getTodayForecast()
    const sun = today.cloudCover
    const precipitation = today.precipitation
    const condition = formatConditionForecast(sun, precipitation)
    const week = await getWeekForecast()
    const weekFormatted = await formatWeekForecast(week)

    return  {
        currentTemp: today.airTemperature,
        condition: condition.text,
        conditionIcon: condition.icon,
        waveHeight: today.waveHeight,
        waveDirection: today.waveDirection.nome,
        waveDirectionIcon: today.waveDirection.emoji,
        windSpeed: today.windSpeed,
        windDirection: today.windDirection.nome,
        windDirectionIcon: today.windDirection.emoji,
        forecast: weekFormatted
    }
}

export default { getForecast }