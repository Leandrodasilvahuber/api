import { serviceDB, moment } from "../../config.js"

const getWeekForecast = async () => {

  const client = await serviceDB.getClient();
  const database = client.db(process.env.DB_MONGO);
  const forecast = database.collection(process.env.TABLE_MONGO);
  const now = moment.utc().toDate();
    
    const result = await forecast.aggregate([
        {
            $addFields: { 
                parsedTime: { $toDate: "$time" } 
            }
        },
        {
            $match: { 
                parsedTime: { $gte: now } 
            }
        },
        { 
            $sort: { parsedTime: 1 } 
        } 
    ]).toArray();
    
    client.close();
    return result;
}

const getTodayForecast = async () => {

  const client = await serviceDB.getClient();
  const database = client.db(process.env.DB_MONGO);
  const forecast = database.collection(process.env.TABLE_MONGO);
  const now = moment.utc(); 

    const result = await forecast.aggregate([
        {
            $addFields: { 
                parsedTime: { $toDate: "$time" } 
            }
        },
        {
            $match: { 
                parsedTime: new Date(now.format('YYYY-MM-DDTHH') + ':00:00Z' ) 
            } 
        },
        { 
            $sort: { parsedTime: 1 } 
        } 
    ])
    .toArray()

    let today = result.shift()

    return {
      waveDirection: await findDirection(today.waveDirection.noaa),
      windDirection: await findDirection(today.windDirection.noaa),
      airTemperature: today.airTemperature.noaa.toFixed(0),
      waveHeight:  today.waveHeight.noaa.toFixed(1),
      windSpeed: today.windSpeed.noaa.toFixed(1),
      cloudCover: today.cloudCover > 30? false: true,
      precipitation: today.precipitation.noaa > 0.5? true: false
    }
}

const formatConditionForecast = (sun, precipitation) => {
  
  const conditions = {
    sunnyRainy: { icon: '☀️', text: 'Sol' },
    cloudyRainy: { icon: '🌧️', text: 'Chuva' },
    sunnyClear: { icon: '⛅', text: 'Parcialmente Nublado' },
    cloudyClear: { icon: '☁️', text: 'Nublado' }
  };

  switch (true) {
    case (sun && precipitation):
      return conditions.sunnyRainy;
    case (!sun && precipitation):
      return conditions.cloudyRainy;
    case (sun && !precipitation):
      return conditions.sunnyClear;
    case (!sun && !precipitation):
      return conditions.cloudyClear;
    default:
      return { icon: '❓', text: 'Sem Previsão' };
  }
}

const formatWeekForecast = async (week) => {

  let currentDay = null
  let color = "green"
  let weekFormatted = week.map((day)=>{

    const dateBrasilia = moment(day.time)
      .tz('America/Sao_Paulo')  
      .format('DD/MM/YYYY')

    const timeBrasilia = moment(day.time)
      .tz('America/Sao_Paulo')  
      .format('HH:mm:ss')

    if(currentDay !== dateBrasilia){
      currentDay = dateBrasilia
      color = color === 'green'? 'yellow': 'green'
    }

    const partial = {
      date: dateBrasilia,
      time: timeBrasilia,
      currentTemp: day.airTemperature.noaa.toFixed(0),
      waveDirection: findDirection(day.waveDirection.noaa).nome,
      waveDirectionIcon: findDirection(day.waveDirection.noaa).emoji,
      waveHeight: day.waveHeight.noaa.toFixed(1),
      windDirection: findDirection(day.windDirection.noaa).nome,
      windDirectionIcon: findDirection(day.windDirection.noaa).emoji,
      windSpeed: day.windSpeed.noaa.toFixed(1),
      color: color
    }

    return partial
  })

  return weekFormatted
}

const findDirection = async (degree) => {
  
  const directions = {
    n:  { emoji: '⬇️', start: 337.5, end: 22.5,  nome: 'Norte'     },
    ne: { emoji: '↙️', start: 22.5,  end: 67.5,  nome: 'Nordeste'  },
    l:  { emoji: '⬅️', start: 67.5,  end: 112.5, nome: 'Leste'     },
    se: { emoji: '↖️', start: 112.5, end: 157.5, nome: 'Sudeste'   },
    s:  { emoji: '⬆️', start: 157.5, end: 202.5, nome: 'Sul'       },
    so: { emoji: '↗️', start: 202.5, end: 247.5, nome: 'Sudoeste'  },
    o:  { emoji: '➡️', start: 247.5, end: 292.5, nome: 'Oeste'     },
    no: { emoji: '↘️', start: 292.5, end: 337.5, nome: 'Noroeste'  }
  };
  
  degree = ((degree % 360) + 360) % 360;
  
  for (const key in directions) {
    const dir = directions[key];
    
    if (dir.start > dir.end) {
      if (degree >= dir.start || degree < dir.end) {
        return dir; 
      }
    }else{
      if (degree >= dir.start && degree < dir.end) {
        return dir;
      }
    }
  }
  
  return null; 
}

export { 
  getWeekForecast, 
  getTodayForecast, 
  formatWeekForecast, 
  formatConditionForecast,
  findDirection
}