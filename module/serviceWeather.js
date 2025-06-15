import { serviceDB, moment } from "../config.js"

async function getWeekForecast(){

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

async function getTodayForecast() {

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

    client.close();
    return result.shift();
}

function findDirection(degree) {
  
  const directions = {
    n: {
      emoji: '⬇️',
      start: 337.5,
      end: 22.5,
      nome: 'Norte'
    },
    ne: {
      emoji: '↙️',
      start: 22.5,
      end: 67.5,
      nome: 'Nordeste'
    },
    l: {
      emoji: '⬅️',
      start: 67.5,
      end: 112.5,
      nome: 'Leste'
    },
    se: {
      emoji: '↖️',
      start: 112.5,
      end: 157.5,
      nome: 'Sudeste'
    },
    s: {
      emoji: '⬆️',
      start: 157.5,
      end: 202.5,
      nome: 'Sul'
    },
    so: {
      emoji: '↗️',
      start: 202.5,
      end: 247.5,
      nome: 'Sudoeste'
    },
    o: {
      emoji: '➡️',
      start: 247.5,
      end: 292.5,
      nome: 'Oeste'
    },
    no: {
      emoji: '↘️',
      start: 292.5,
      end: 337.5,
      nome: 'Noroeste'
    }
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

async function getForecast() {

    const today = await getTodayForecast()
    const sun = today.cloudCover.noaa > 30? false: true
    const precipitation = today.precipitation.noaa > 0.5? true: false
    
    let conditionIcon, condition

    if(sun && precipitation){ 
      conditionIcon ='☀️'
      condition = 'Sol'
    }else if(!sun && precipitation){ 
      conditionIcon = '🌧️'
      condition = 'Chuva'
    }else if(sun && !precipitation){
      conditionIcon = '⛅'
      condition = 'Parcialmente Nublado'
    } 
    else if(!sun && !precipitation){ 
      conditionIcon = '☁️'
      condition = 'Nublado'
    }

    const week = await getWeekForecast()

    let currentDay = null
    let color = "green"

    const weekFormatted = week.map((day)=>{

        const dateBrasilia = moment(day.time)
          .tz('America/Sao_Paulo')  
          .format('DD/MM/YYYY'); 

        const timeBrasilia = moment(day.time)
          .tz('America/Sao_Paulo')  
          .format('HH:mm:ss');   

        if(currentDay !== dateBrasilia){
          currentDay = dateBrasilia
          color = color === 'green'? 'yellow': 'green'
        }

        return {
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
    })

    return  {
        currentTemp: today.airTemperature.noaa.toFixed(0),
        condition: condition,
        conditionIcon: conditionIcon,
        waveHeight: today.waveHeight.noaa.toFixed(1),
        waveDirection: findDirection(today.waveDirection.noaa).nome,
        waveDirectionIcon: findDirection(today.waveDirection.noaa).emoji,
        windSpeed: today.windSpeed.noaa.toFixed(1),
        windDirection: findDirection(today.windDirection.noaa).nome,
        windDirectionIcon: findDirection(today.windDirection.noaa).emoji,
        forecast: weekFormatted
    }

}

export default { getForecast }