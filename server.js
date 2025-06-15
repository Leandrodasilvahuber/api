import { 
    serviceWeather,
    express,
    cors
} from "./config.js"

const ws = express()
ws.use(express.json())
ws.use(cors())

var corsOptions = {
    origin: process.env.ENV_CORS_ORIGEM
}

ws.listen(process.env.ENV_API_PORT, () => {
    console.log(`Connected successfully on port ${process.env.ENV_API_PORT}`);
});

ws.get('/forecast', cors(corsOptions), async (req, res) => {
    let forecast = await serviceWeather.getForecast()
    res.status(200).json({"status": "ok", forecast})
})


